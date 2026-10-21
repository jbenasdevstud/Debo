package com.debo.app;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.webkit.JavascriptInterface;

import org.json.JSONObject;

import java.util.Calendar;
import java.util.Map;

public final class ReminderBridge {
    private static final int PERMISSION_REQUEST = 8125;
    private static final String NOTIFICATION_PERMISSION = "android.permission.POST_NOTIFICATIONS";
    private static final String PREFS = "debo_reminders";

    private final Activity activity;

    ReminderBridge(Activity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public void schedule(int id, double atMillis, String title, String body) {
        requestNotificationPermission();
        scheduleAlarm(activity, id, (long) atMillis, 0, title, body);
    }

    @JavascriptInterface
    public void scheduleRepeating(int id, double firstAtMillis, double intervalMillis, String title, String body) {
        requestNotificationPermission();
        scheduleAlarm(activity, id, (long) firstAtMillis, (long) intervalMillis, title, body);
    }

    // Repeating reminder that skips a nightly quiet window (minutes after midnight, e.g. 1320 → 420 = 22:00–07:00)
    @JavascriptInterface
    public void scheduleRepeatingQuiet(int id, double firstAtMillis, double intervalMillis, String title, String body,
                                       int quietFrom, int quietTo) {
        requestNotificationPermission();
        long at = (long) firstAtMillis;
        if (inQuiet(at, quietFrom, quietTo)) at = quietEnd(at, quietTo);
        scheduleAlarm(activity, id, at, (long) intervalMillis, title, body, quietFrom, quietTo);
    }

    @JavascriptInterface
    public void cancel(int id) {
        AlarmManager alarms = (AlarmManager) activity.getSystemService(Context.ALARM_SERVICE);
        if (alarms != null) alarms.cancel(pendingIntent(activity, id, 0, 0, "", "", -1, -1));
        forget(activity, id);
        ReminderReceiver.dismiss(activity, id);
    }

    static boolean inQuiet(long ts, int from, int to) {
        if (from < 0 || to < 0 || from == to) return false;
        Calendar time = Calendar.getInstance();
        time.setTimeInMillis(ts);
        int minute = time.get(Calendar.HOUR_OF_DAY) * 60 + time.get(Calendar.MINUTE);
        return from < to ? minute >= from && minute < to : minute >= from || minute < to;
    }

    // The first moment after ts when the quiet window ends
    static long quietEnd(long ts, int to) {
        Calendar end = Calendar.getInstance();
        end.setTimeInMillis(ts);
        end.set(Calendar.HOUR_OF_DAY, to / 60);
        end.set(Calendar.MINUTE, to % 60);
        end.set(Calendar.SECOND, 0);
        end.set(Calendar.MILLISECOND, 0);
        if (end.getTimeInMillis() <= ts) end.add(Calendar.DAY_OF_MONTH, 1);
        return end.getTimeInMillis();
    }

    static void scheduleAlarm(Context context, int id, long at, long interval, String title, String body) {
        scheduleAlarm(context, id, at, interval, title, body, -1, -1);
    }

    static void scheduleAlarm(Context context, int id, long at, long interval, String title, String body, int quietFrom, int quietTo) {
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarms == null) return;
        remember(context, id, at, interval, title, body, quietFrom, quietTo);
        PendingIntent pending = pendingIntent(context, id, at, interval, title, body, quietFrom, quietTo);
        try {
            if (Build.VERSION.SDK_INT >= 31 && !alarms.canScheduleExactAlarms()) {
                alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending);
            } else {
                alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending);
            }
        } catch (SecurityException error) {
            alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending);
        }
    }

    // Every scheduled alarm is kept here so BootReceiver can put it back after a restart
    private static SharedPreferences store(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static void remember(Context context, int id, long at, long interval, String title, String body, int quietFrom, int quietTo) {
        try {
            JSONObject item = new JSONObject()
                    .put("at", at)
                    .put("interval", interval)
                    .put("title", title == null ? "" : title)
                    .put("body", body == null ? "" : body)
                    .put("quietFrom", quietFrom)
                    .put("quietTo", quietTo);
            store(context).edit().putString(String.valueOf(id), item.toString()).apply();
        } catch (Exception ignored) { }
    }

    static void forget(Context context, int id) {
        store(context).edit().remove(String.valueOf(id)).apply();
    }

    static void restoreAll(Context context) {
        long now = System.currentTimeMillis();
        for (Map.Entry<String, ?> entry : store(context).getAll().entrySet()) {
            try {
                int id = Integer.parseInt(entry.getKey());
                JSONObject item = new JSONObject(String.valueOf(entry.getValue()));
                long at = item.optLong("at");
                long interval = item.optLong("interval");
                int quietFrom = item.optInt("quietFrom", -1);
                int quietTo = item.optInt("quietTo", -1);
                if (at <= now && interval > 0) {
                    while (at <= now) at += interval;
                }
                if (at <= now) {
                    forget(context, id);
                    continue;
                }
                if (inQuiet(at, quietFrom, quietTo)) at = quietEnd(at, quietTo);
                scheduleAlarm(context, id, at, interval, item.optString("title"), item.optString("body"), quietFrom, quietTo);
            } catch (Exception ignored) { }
        }
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT < 33) return;
        if (activity.checkSelfPermission(NOTIFICATION_PERMISSION) == PackageManager.PERMISSION_GRANTED) return;
        activity.runOnUiThread(() -> activity.requestPermissions(new String[]{NOTIFICATION_PERMISSION}, PERMISSION_REQUEST));
    }

    private static PendingIntent pendingIntent(Context context, int id, long at, long interval, String title, String body,
                                               int quietFrom, int quietTo) {
        Intent intent = new Intent(context, ReminderReceiver.class)
                .setAction(ReminderReceiver.ACTION)
                .putExtra(ReminderReceiver.EXTRA_ID, id)
                .putExtra(ReminderReceiver.EXTRA_AT, at)
                .putExtra(ReminderReceiver.EXTRA_INTERVAL, interval)
                .putExtra(ReminderReceiver.EXTRA_TITLE, title == null ? "" : title)
                .putExtra(ReminderReceiver.EXTRA_BODY, body == null ? "" : body)
                .putExtra(ReminderReceiver.EXTRA_QUIET_FROM, quietFrom)
                .putExtra(ReminderReceiver.EXTRA_QUIET_TO, quietTo);
        return PendingIntent.getBroadcast(context, id, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
