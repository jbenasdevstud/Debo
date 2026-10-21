package com.debo.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;

public final class ReminderReceiver extends BroadcastReceiver {
    static final String ACTION = "com.debo.app.REMINDER";
    static final String EXTRA_ID = "id";
    static final String EXTRA_AT = "at";
    static final String EXTRA_INTERVAL = "interval";
    static final String EXTRA_TITLE = "title";
    static final String EXTRA_BODY = "body";
    static final String EXTRA_QUIET_FROM = "quietFrom";
    static final String EXTRA_QUIET_TO = "quietTo";
    private static final String CHANNEL_ID = "debo_health_reminders";

    @Override
    public void onReceive(Context context, Intent intent) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        int id = intent.getIntExtra(EXTRA_ID, 1);
        String title = intent.getStringExtra(EXTRA_TITLE);
        String body = intent.getStringExtra(EXTRA_BODY);
        long interval = intent.getLongExtra(EXTRA_INTERVAL, 0);
        int quietFrom = intent.getIntExtra(EXTRA_QUIET_FROM, -1);
        int quietTo = intent.getIntExtra(EXTRA_QUIET_TO, -1);
        long now = System.currentTimeMillis();
        if (interval > 0) {
            long next = intent.getLongExtra(EXTRA_AT, now) + interval;
            while (next <= now) next += interval;
            // A repeating reminder with a night pause waits until the pause ends
            if (ReminderBridge.inQuiet(next, quietFrom, quietTo)) next = ReminderBridge.quietEnd(next, quietTo);
            ReminderBridge.scheduleAlarm(context, id, next, interval, title, body, quietFrom, quietTo);
        } else {
            ReminderBridge.forget(context, id);
        }
        // An alarm delivered late into the quiet window stays silent
        if (ReminderBridge.inQuiet(now, quietFrom, quietTo)) return;

        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Debo", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription(context.getString(R.string.reminder_channel_description));
            channel.enableVibration(true);
            manager.createNotificationChannel(channel);
        }

        Intent open = new Intent(context, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent content = PendingIntent.getActivity(context, id, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder builder = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(context, CHANNEL_ID)
                : new Notification.Builder(context);
        builder.setSmallIcon(R.drawable.ic_notification)
                .setColor(Color.rgb(255, 93, 115))
                .setContentTitle(title == null || title.isEmpty() ? "Debo" : title)
                .setContentText(body == null ? "" : body)
                .setStyle(new Notification.BigTextStyle().bigText(body == null ? "" : body))
                .setCategory(Notification.CATEGORY_REMINDER)
                .setAutoCancel(true)
                .setContentIntent(content);
        if (Build.VERSION.SDK_INT < 26) {
            builder.setPriority(Notification.PRIORITY_HIGH).setDefaults(Notification.DEFAULT_ALL);
        }
        try {
            manager.notify(id, builder.build());
        } catch (SecurityException ignored) { }
    }

    static void dismiss(Context context, int id) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.cancel(id);
    }
}
