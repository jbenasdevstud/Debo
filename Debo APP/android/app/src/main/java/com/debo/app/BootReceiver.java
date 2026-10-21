package com.debo.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

// Alarms are wiped when the phone restarts: put the saved reminders back without waiting for the app to be opened
public final class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent == null ? null : intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            ReminderBridge.restoreAll(context);
        }
    }
}
