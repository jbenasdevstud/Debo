package com.debo.app;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.health.connect.HealthConnectException;
import android.health.connect.HealthConnectManager;
import android.health.connect.ReadRecordsRequestUsingFilters;
import android.health.connect.ReadRecordsResponse;
import android.health.connect.TimeInstantRangeFilter;
import android.health.connect.datatypes.BloodGlucoseRecord;
import android.os.Build;
import android.os.OutcomeReceiver;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.time.Instant;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

public final class HealthBridge {
    static final int PERMISSION_REQUEST = 8131;
    static final int BACKGROUND_REQUEST = 8133;
    private static final int NOTIFICATION_REQUEST = 8134;
    static final String READ_GLUCOSE = "android.permission.health.READ_BLOOD_GLUCOSE";
    private static final int MAX_RECORDS = 20000;

    private final Activity activity;
    private final WebView webView;
    private final Executor executor = Executors.newSingleThreadExecutor();

    HealthBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    @JavascriptInterface
    public String status() {
        if (Build.VERSION.SDK_INT < 34) return compatStatus();
        if (activity.getSystemService(HealthConnectManager.class) == null) return "unavailable";
        return hasPermission() ? "granted" : "available";
    }

    @JavascriptInterface
    public void requestPermission() {
        if (Build.VERSION.SDK_INT < 34) {
            String state = compatStatus();
            if ("granted".equals(state)) {
                emit("onHealthPermission", "granted");
            } else if ("available".equals(state)) {
                activity.runOnUiThread(() -> {
                    try {
                        activity.startActivityForResult(HealthConnectCompat.permissionIntent(activity), PERMISSION_REQUEST);
                    } catch (Exception error) {
                        emit("onHealthPermission", "denied");
                    }
                });
            } else {
                emit("onHealthPermission", state);
            }
            return;
        }
        if (hasPermission()) {
            emit("onHealthPermission", "granted");
            return;
        }
        activity.runOnUiThread(() -> activity.requestPermissions(new String[]{READ_GLUCOSE}, PERMISSION_REQUEST));
    }

    @JavascriptInterface
    public void openSettings() {
        if (Build.VERSION.SDK_INT < 34) {
            if (Build.VERSION.SDK_INT < 28) return;
            activity.runOnUiThread(() -> {
                try {
                    activity.startActivity(HealthConnectCompat.settingsIntent());
                } catch (Exception ignored) { }
            });
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                activity.startActivity(new Intent(HealthConnectManager.ACTION_MANAGE_HEALTH_PERMISSIONS)
                        .putExtra(Intent.EXTRA_PACKAGE_NAME, activity.getPackageName()));
            } catch (Exception error) {
                try {
                    activity.startActivity(new Intent("android.health.connect.action.HEALTH_HOME_SETTINGS"));
                } catch (Exception ignored) { }
            }
        });
    }

    @JavascriptInterface
    public void readGlucose(double sinceMillis) {
        if (Build.VERSION.SDK_INT < 34) {
            if (Build.VERSION.SDK_INT < 28) {
                emitResult(null, "unsupported");
                return;
            }
            HealthConnectCompat.read(activity, (long) sinceMillis, records -> {
                try {
                    emitResult(records == null ? null : new JSONArray(records), records == null ? "read" : null);
                } catch (Exception error) {
                    emitResult(null, "read");
                }
            });
            return;
        }
        if (!hasPermission()) {
            emitResult(null, "permission");
            return;
        }
        Reader.read(this, (long) sinceMillis);
    }

    @JavascriptInterface
    public void install() {
        activity.runOnUiThread(() -> {
            try {
                activity.startActivity(HealthConnectCompat.installIntent());
            } catch (Exception error) {
                try {
                    activity.startActivity(HealthConnectCompat.installWebIntent());
                } catch (Exception ignored) { }
            }
        });
    }

    @JavascriptInterface
    public String backgroundStatus() {
        if (Build.VERSION.SDK_INT < 28) return "unsupported";
        try {
            return HealthConnectCompat.backgroundStatus(activity);
        } catch (Exception error) {
            return "unsupported";
        }
    }

    @JavascriptInterface
    public void requestBackgroundPermission() {
        if (Build.VERSION.SDK_INT < 28) {
            emit("onHealthBackgroundPermission", "unsupported");
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                if (Build.VERSION.SDK_INT >= 34) {
                    activity.requestPermissions(new String[]{READ_GLUCOSE, HealthConnectCompat.BACKGROUND_PERMISSION}, BACKGROUND_REQUEST);
                } else {
                    activity.startActivityForResult(HealthConnectCompat.backgroundPermissionIntent(activity), BACKGROUND_REQUEST);
                }
            } catch (Exception error) {
                emit("onHealthBackgroundPermission", "denied");
            }
        });
    }

    @JavascriptInterface
    public void configureBackground(String json) {
        BackgroundGlucose.configure(activity, json == null ? "{}" : json);
    }

    private void finishBackgroundRequest() {
        HealthConnectCompat.backgroundStatusAsync(activity, state -> {
            emit("onHealthBackgroundPermission", state);
            if ("granted".equals(state) && Build.VERSION.SDK_INT >= 33
                    && activity.checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                activity.runOnUiThread(() -> activity.requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, NOTIFICATION_REQUEST));
            }
        });
    }

    void onActivityResult(int requestCode) {
        if (requestCode == BACKGROUND_REQUEST && Build.VERSION.SDK_INT < 34) {
            finishBackgroundRequest();
            return;
        }
        if (requestCode != PERMISSION_REQUEST || Build.VERSION.SDK_INT >= 34) return;
        HealthConnectCompat.statusAsync(activity, state ->
                emit("onHealthPermission", "granted".equals(state) ? "granted" : "denied"));
    }

    private String compatStatus() {
        if (Build.VERSION.SDK_INT < 28) return "unsupported";
        try {
            return HealthConnectCompat.status(activity);
        } catch (Exception error) {
            return "unavailable";
        }
    }

    void onRequestPermissionsResult(int requestCode) {
        if (requestCode == BACKGROUND_REQUEST) {
            finishBackgroundRequest();
            return;
        }
        if (requestCode != PERMISSION_REQUEST) return;
        emit("onHealthPermission", hasPermission() ? "granted" : "denied");
    }

    private boolean hasPermission() {
        return Build.VERSION.SDK_INT >= 34
                && activity.checkSelfPermission(READ_GLUCOSE) == PackageManager.PERMISSION_GRANTED;
    }

    private void emit(String callback, String value) {
        String quoted = JSONObject.quote(value == null ? "" : value);
        webView.post(() -> webView.evaluateJavascript(
                "window." + callback + " && window." + callback + "(" + quoted + ")", null));
    }

    private void emitResult(JSONArray records, String error) {
        JSONObject result = new JSONObject();
        try {
            result.put("ok", records != null);
            result.put("records", records == null ? new JSONArray() : records);
            if (error != null) result.put("error", error);
        } catch (Exception ignored) { }
        emit("onHealthGlucose", result.toString());
    }

    @TargetApi(34)
    private static final class Reader {
        static void read(HealthBridge bridge, long sinceMillis) {
            HealthConnectManager manager = bridge.activity.getSystemService(HealthConnectManager.class);
            if (manager == null) {
                bridge.emitResult(null, "unavailable");
                return;
            }
            long now = System.currentTimeMillis();
            long start = Math.max(sinceMillis, now - 30L * 24 * 60 * 60 * 1000);
            page(bridge, manager, Instant.ofEpochMilli(start), Instant.ofEpochMilli(now + 60000), -1, new JSONArray());
        }

        private static void page(HealthBridge bridge, HealthConnectManager manager, Instant start, Instant end,
                                 long token, JSONArray collected) {
            ReadRecordsRequestUsingFilters.Builder<BloodGlucoseRecord> builder =
                    new ReadRecordsRequestUsingFilters.Builder<>(BloodGlucoseRecord.class)
                            .setTimeRangeFilter(new TimeInstantRangeFilter.Builder()
                                    .setStartTime(start).setEndTime(end).build())
                            .setPageSize(5000);
            if (token != -1) builder.setPageToken(token);
            try {
                manager.readRecords(builder.build(), bridge.executor,
                        new OutcomeReceiver<ReadRecordsResponse<BloodGlucoseRecord>, HealthConnectException>() {
                            @Override
                            public void onResult(ReadRecordsResponse<BloodGlucoseRecord> response) {
                                for (BloodGlucoseRecord record : response.getRecords()) {
                                    try {
                                        JSONObject item = new JSONObject();
                                        item.put("id", record.getMetadata().getId());
                                        item.put("ts", record.getTime().toEpochMilli());
                                        item.put("mmol", record.getLevel().getInMillimolesPerLiter());
                                        item.put("origin", record.getMetadata().getDataOrigin().getPackageName());
                                        collected.put(item);
                                    } catch (Exception ignored) { }
                                }
                                long next = response.getNextPageToken();
                                if (next != -1 && collected.length() < MAX_RECORDS) {
                                    page(bridge, manager, start, end, next, collected);
                                } else {
                                    bridge.emitResult(collected, null);
                                }
                            }

                            @Override
                            public void onError(HealthConnectException error) {
                                bridge.emitResult(null, "read");
                            }
                        });
            } catch (Exception error) {
                bridge.emitResult(null, "read");
            }
        }
    }
}
