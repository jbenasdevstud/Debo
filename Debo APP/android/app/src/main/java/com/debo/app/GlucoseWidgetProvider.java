package com.debo.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONObject;

public final class GlucoseWidgetProvider extends AppWidgetProvider {
    static final String PREFS = "debo_widget";
    static final String KEY_DATA = "data";
    static final String ACTION_ENTRY = "com.debo.app.ACTION_ENTRY";
    static final String EXTRA_ENTRY = "entry";
    private static final long STALE_MS = 2 * 60 * 60 * 1000L;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        render(context, manager, ids);
    }

    static void save(Context context, String json) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_DATA, json).apply();
        refresh(context);
    }

    static void refresh(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, GlucoseWidgetProvider.class));
        if (ids.length > 0) render(context, manager, ids);
    }

    private static void render(Context context, AppWidgetManager manager, int[] ids) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONObject data;
        try {
            data = new JSONObject(prefs.getString(KEY_DATA, "{}"));
        } catch (Exception error) {
            data = new JSONObject();
        }
        long timestamp = data.optLong("timestamp", 0);
        boolean hasReading = timestamp > 0 && !data.optString("value").isEmpty();
        boolean stale = hasReading && System.currentTimeMillis() - timestamp > STALE_MS;
        String state = data.optString("state", "normal");
        int valueColor = context.getColor(stale ? R.color.widget_muted
                : "low".equals(state) ? R.color.widget_low
                : "high".equals(state) ? R.color.widget_high
                : R.color.widget_target);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_glucose);
        if (hasReading) {
            views.setTextViewText(R.id.widget_value, data.optString("value"));
            views.setTextViewText(R.id.widget_unit, data.optString("unit"));
            views.setTextViewText(R.id.widget_arrow, stale ? "" : data.optString("arrow"));
            String meta = stale ? data.optString("staleText") : data.optString("meta");
            views.setTextViewText(R.id.widget_meta, meta);
        } else {
            views.setTextViewText(R.id.widget_value, "—");
            views.setTextViewText(R.id.widget_unit, "");
            views.setTextViewText(R.id.widget_arrow, "");
            String empty = data.optString("emptyText");
            views.setTextViewText(R.id.widget_meta, empty.isEmpty() ? context.getString(R.string.widget_empty) : empty);
        }
        views.setTextColor(R.id.widget_value, valueColor);
        views.setTextColor(R.id.widget_arrow, valueColor);
        views.setOnClickPendingIntent(R.id.widget_root, launch(context, null, 0));
        views.setOnClickPendingIntent(R.id.widget_add, launch(context, "glucose", 1));
        for (int id : ids) manager.updateAppWidget(id, views);
    }

    private static PendingIntent launch(Context context, String entry, int requestCode) {
        Intent intent = new Intent(context, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (entry != null) intent.setAction(ACTION_ENTRY).putExtra(EXTRA_ENTRY, entry);
        else intent.setAction(Intent.ACTION_MAIN);
        return PendingIntent.getActivity(context, requestCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
