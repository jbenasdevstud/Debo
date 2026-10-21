package com.debo.app

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.HealthConnectFeatures
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.BloodGlucoseRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant

object HealthConnectCompat {
    private const val PROVIDER = "com.google.android.apps.healthdata"
    private const val MAX_RECORDS = 20000
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val readPermission = HealthPermission.getReadPermission(BloodGlucoseRecord::class)

    fun interface ReadCallback {
        fun onResult(records: String?)
    }

    fun interface StatusCallback {
        fun onResult(status: String)
    }

    @JvmStatic
    fun status(context: Context): String {
        if (Build.VERSION.SDK_INT < 28) return "unsupported"
        return when (HealthConnectClient.getSdkStatus(context, PROVIDER)) {
            HealthConnectClient.SDK_AVAILABLE -> if (hasPermission(context)) "granted" else "available"
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "install"
            else -> "unsupported"
        }
    }

    @JvmStatic
    fun statusAsync(context: Context, callback: StatusCallback) {
        scope.launch { callback.onResult(status(context)) }
    }

    private fun hasPermission(context: Context): Boolean = try {
        runBlocking {
            withTimeout(4000) {
                HealthConnectClient.getOrCreate(context, PROVIDER)
                    .permissionController.getGrantedPermissions().contains(readPermission)
            }
        }
    } catch (error: Exception) {
        false
    }

    @JvmStatic
    fun permissionIntent(context: Context): Intent =
        PermissionController.createRequestPermissionResultContract(PROVIDER)
            .createIntent(context, setOf(readPermission))

    @JvmStatic
    fun installIntent(): Intent =
        Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$PROVIDER&url=healthconnect%3A%2F%2Fonboarding"))
            .setPackage("com.android.vending")
            .putExtra("overlay", true)
            .putExtra("callerId", "com.debo.app")

    @JvmStatic
    fun installWebIntent(): Intent =
        Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=$PROVIDER"))

    @JvmStatic
    fun settingsIntent(): Intent = Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)

    @JvmStatic
    fun backgroundStatus(context: Context): String {
        if (Build.VERSION.SDK_INT < 28) return "unsupported"
        if (HealthConnectClient.getSdkStatus(context, PROVIDER) != HealthConnectClient.SDK_AVAILABLE) return "unsupported"
        return try {
            runBlocking {
                withTimeout(4000) {
                    val client = HealthConnectClient.getOrCreate(context, PROVIDER)
                    val available = client.features.getFeatureStatus(HealthConnectFeatures.FEATURE_READ_HEALTH_DATA_IN_BACKGROUND) ==
                        HealthConnectFeatures.FEATURE_STATUS_AVAILABLE
                    if (!available) "unsupported"
                    else if (client.permissionController.getGrantedPermissions().containsAll(setOf(readPermission, BACKGROUND_PERMISSION))) "granted"
                    else "available"
                }
            }
        } catch (error: Exception) {
            "unsupported"
        }
    }

    @JvmStatic
    fun backgroundStatusAsync(context: Context, callback: StatusCallback) {
        scope.launch { callback.onResult(backgroundStatus(context)) }
    }

    @JvmStatic
    fun backgroundPermissionIntent(context: Context): Intent =
        PermissionController.createRequestPermissionResultContract(PROVIDER)
            .createIntent(context, setOf(readPermission, BACKGROUND_PERMISSION))

    @JvmField
    val BACKGROUND_PERMISSION: String = HealthPermission.PERMISSION_READ_HEALTH_DATA_IN_BACKGROUND

    fun readRecentBlocking(context: Context, sinceMillis: Long): List<Pair<Long, Double>> = runBlocking {
        withTimeout(20000) {
            val client = HealthConnectClient.getOrCreate(context, PROVIDER)
            val filter = TimeRangeFilter.between(Instant.ofEpochMilli(sinceMillis), Instant.ofEpochMilli(System.currentTimeMillis() + 60000))
            client.readRecords(ReadRecordsRequest(BloodGlucoseRecord::class, filter, pageSize = 1000))
                .records.map { it.time.toEpochMilli() to it.level.inMillimolesPerLiter }
                .sortedBy { it.first }
        }
    }

    @JvmStatic
    fun read(context: Context, sinceMillis: Long, callback: ReadCallback) {
        scope.launch {
            try {
                val client = HealthConnectClient.getOrCreate(context, PROVIDER)
                val now = System.currentTimeMillis()
                val start = maxOf(sinceMillis, now - 30L * 24 * 60 * 60 * 1000)
                val filter = TimeRangeFilter.between(Instant.ofEpochMilli(start), Instant.ofEpochMilli(now + 60000))
                val collected = JSONArray()
                var token: String? = null
                do {
                    val response = client.readRecords(
                        ReadRecordsRequest(BloodGlucoseRecord::class, filter, pageSize = 5000, pageToken = token)
                    )
                    for (record in response.records) {
                        collected.put(
                            JSONObject()
                                .put("id", record.metadata.id)
                                .put("ts", record.time.toEpochMilli())
                                .put("mmol", record.level.inMillimolesPerLiter)
                                .put("origin", record.metadata.dataOrigin.packageName)
                        )
                    }
                    token = response.pageToken
                } while (!token.isNullOrEmpty() && collected.length() < MAX_RECORDS)
                callback.onResult(collected.toString())
            } catch (error: Exception) {
                callback.onResult(null)
            }
        }
    }
}
