package com.debo.app

import android.app.NotificationManager
import android.app.job.JobInfo
import android.app.job.JobParameters
import android.app.job.JobScheduler
import android.app.job.JobService
import android.content.ComponentName
import android.content.Context
import android.os.Build
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.concurrent.thread
import kotlin.math.abs
import kotlin.math.roundToInt

class GlucoseBackgroundJob : JobService() {
    override fun onStartJob(params: JobParameters): Boolean {
        thread(name = "debo-background") {
            try {
                BackgroundGlucose.run(applicationContext)
            } catch (error: Exception) {
            } finally {
                jobFinished(params, false)
            }
        }
        return true
    }

    override fun onStopJob(params: JobParameters): Boolean = true
}

object BackgroundGlucose {
    private const val JOB_ID = 4130
    private const val PREFS = "debo_background"
    private const val KEY_CONFIG = "config"
    private const val LEGACY_ALERT_CHANNEL_ID = "glucose_alerts"
    private const val LOW = 3.9
    private const val HIGH = 10.0
    private const val MINUTE = 60_000L

    @JvmStatic
    fun configure(context: Context, json: String) {
        val config = try { JSONObject(json) } catch (error: Exception) { JSONObject() }
        prefs(context).edit().putString(KEY_CONFIG, config.toString()).apply()
        removeLegacyAlertChannel(context)
        if (config.optBoolean("enabled")) schedule(context) else cancel(context)
    }

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun schedule(context: Context) {
        val scheduler = context.getSystemService(JobScheduler::class.java) ?: return
        if (scheduler.getPendingJob(JOB_ID) != null) return
        val job = JobInfo.Builder(JOB_ID, ComponentName(context, GlucoseBackgroundJob::class.java))
            .setPeriodic(15 * MINUTE)
            .setPersisted(true)
            .build()
        scheduler.schedule(job)
    }

    private fun cancel(context: Context) {
        context.getSystemService(JobScheduler::class.java)?.cancel(JOB_ID)
    }

    fun run(context: Context) {
        val config = try { JSONObject(prefs(context).getString(KEY_CONFIG, "{}") ?: "{}") } catch (error: Exception) { return }
        if (!config.optBoolean("enabled")) {
            cancel(context)
            return
        }
        if (HealthConnectCompat.backgroundStatus(context) != "granted") return
        val now = System.currentTimeMillis()
        val readings = HealthConnectCompat.readRecentBlocking(context, now - 3 * 60 * MINUTE)
            .filter { it.second in 1.0..35.0 && it.first <= now + MINUTE }
        val latest = readings.lastOrNull() ?: return
        val strings = config.optJSONObject("strings") ?: JSONObject()
        val trend = trend(readings)
        updateWidget(context, config, strings, latest, trend)
    }

    private data class Trend(val rate: Double, val level: Int, val falling: Boolean)

    private fun trend(readings: List<Pair<Long, Double>>): Trend? {
        val latest = readings.last()
        if (System.currentTimeMillis() - latest.first > 15 * MINUTE) return null
        val recent = readings.filter { latest.first - it.first <= 20 * MINUTE }
        if (recent.size < 2 || latest.first - recent.first().first < 4 * MINUTE) return null
        val meanT = recent.sumOf { it.first.toDouble() } / recent.size
        val meanV = recent.sumOf { it.second } / recent.size
        var num = 0.0
        var den = 0.0
        recent.forEach {
            val dt = (it.first - meanT) / MINUTE
            num += dt * (it.second - meanV)
            den += dt * dt
        }
        if (den == 0.0) return null
        val rate = num / den
        val size = abs(rate)
        val level = if (size < .055) 0 else if (size < .11) 1 else if (size < .17) 2 else 3
        return Trend(rate, level, rate < 0)
    }

    private fun display(config: JSONObject, mmol: Double): String =
        if (config.optString("unit") == "mg") (mmol * 18.0182).roundToInt().toString()
        // Same decimal separator as the app shows (comma for every language except English)
        else String.format(Locale.US, "%.1f", mmol).let { if (config.optBoolean("decimalComma")) it.replace('.', ',') else it }

    private fun clock(ts: Long): String = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date(ts))

    private fun updateWidget(context: Context, config: JSONObject, strings: JSONObject, latest: Pair<Long, Double>, trend: Trend?) {
        val widgetPrefs = context.getSharedPreferences(GlucoseWidgetProvider.PREFS, Context.MODE_PRIVATE)
        val current = try { JSONObject(widgetPrefs.getString(GlucoseWidgetProvider.KEY_DATA, "{}") ?: "{}") } catch (error: Exception) { JSONObject() }
        if (current.optLong("timestamp", 0) >= latest.first) {
            GlucoseWidgetProvider.refresh(context)
            return
        }
        val value = latest.second
        val arrow = when {
            trend == null -> ""
            trend.level == 0 -> "→"
            trend.falling -> arrayOf("", "↘", "↓", "⇊")[trend.level]
            else -> arrayOf("", "↗", "↑", "⇈")[trend.level]
        }
        val trendKey = when {
            trend == null -> null
            trend.level == 0 -> "trendStable"
            trend.falling -> arrayOf("", "trendFallingSlow", "trendFalling", "trendFallingFast")[trend.level]
            else -> arrayOf("", "trendRisingSlow", "trendRising", "trendRisingFast")[trend.level]
        }
        val label = trendKey?.let { strings.optString(it) } ?: ""
        val time = clock(latest.first)
        val payload = JSONObject()
            .put("value", display(config, value))
            .put("unit", strings.optString("unit", "mmol/L"))
            .put("arrow", arrow)
            .put("state", if (value < LOW) "low" else if (value > HIGH) "high" else "normal")
            .put("timestamp", latest.first)
            .put("meta", if (label.isEmpty()) time else "$time · $label")
            .put("staleText", "$time · ${strings.optString("stale")}")
        GlucoseWidgetProvider.save(context, payload.toString())
    }

    private fun removeLegacyAlertChannel(context: Context) {
        if (Build.VERSION.SDK_INT < 26) return
        context.getSystemService(NotificationManager::class.java)?.deleteNotificationChannel(LEGACY_ALERT_CHANNEL_ID)
    }
}
