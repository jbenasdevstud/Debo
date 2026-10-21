package com.debo.app;

import android.app.Activity;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient.FileChooserParams;
import android.content.Intent;
import android.net.Uri;
import android.graphics.Color;
import android.graphics.Insets;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.widget.FrameLayout;

public final class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 4107;
    private static final int SAVE_FILE_REQUEST = 4108;
    private String pendingSaveText;
    private WebView webView;
    private FrameLayout root;
    private ValueCallback<Uri[]> fileChooserCallback;
    private PlayBillingBridge billingBridge;
    private FoodInputBridge foodInputBridge;
    private WebView printWebView;
    private HealthBridge healthBridge;
    private String pendingEntry;
    private boolean pageReady;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        billingBridge = new PlayBillingBridge(this, webView);
        foodInputBridge = new FoodInputBridge(this, webView);
        webView.addJavascriptInterface(billingBridge, "AndroidBilling");
        webView.addJavascriptInterface(new GoogleAuthBridge(this, webView), "AndroidAuth");
        webView.addJavascriptInterface(foodInputBridge, "NativeFoodTools");
        webView.addJavascriptInterface(new SystemUiBridge(), "AndroidUi");
        webView.addJavascriptInterface(new ReminderBridge(this), "AndroidReminders");
        webView.addJavascriptInterface(new PrintBridge(), "AndroidPrint");
        healthBridge = new HealthBridge(this, webView);
        webView.addJavascriptInterface(healthBridge, "AndroidHealth");
        webView.addJavascriptInterface(new FileBridge(), "AndroidFiles");
        webView.addJavascriptInterface(new WidgetBridge(), "AndroidWidget");
        pendingEntry = entryFrom(getIntent());
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setOffscreenPreRaster(true);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileChooserCallback != null) fileChooserCallback.onReceiveValue(null);
                fileChooserCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), FILE_CHOOSER_REQUEST);
                    return true;
                } catch (Exception error) {
                    fileChooserCallback = null;
                    callback.onReceiveValue(null);
                    return false;
                }
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                pageReady = true;
                dispatchEntry();
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                if ("http".equals(scheme) || "https".equals(scheme)) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    } catch (Exception ignored) { }
                    return true;
                }
                if (!"tel".equals(scheme)) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_DIAL, uri));
                } catch (Exception ignored) { }
                return true;
            }
        });
        root = new FrameLayout(this);
        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        if (Build.VERSION.SDK_INT >= 35) {
            // Android 15+ always draws the app edge-to-edge: keep the page clear of the status bar,
            // navigation bar and keyboard by padding the container instead
            root.setOnApplyWindowInsetsListener((view, insets) -> {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                Insets ime = insets.getInsets(WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom));
                return WindowInsets.CONSUMED;
            });
        }
        applySystemBars(false);
        setContentView(root);
        registerBackHandler();
        webView.loadUrl("file:///android_asset/www/index.html");
    }

    private static String entryFrom(Intent intent) {
        if (intent == null || !GlucoseWidgetProvider.ACTION_ENTRY.equals(intent.getAction())) return null;
        String entry = intent.getStringExtra(GlucoseWidgetProvider.EXTRA_ENTRY);
        return "glucose".equals(entry) || "food".equals(entry) || "insulin".equals(entry) ? entry : null;
    }

    private void dispatchEntry() {
        if (!pageReady || pendingEntry == null || webView == null) return;
        String entry = pendingEntry;
        pendingEntry = null;
        webView.evaluateJavascript("window.onAppAction && window.onAppAction('" + entry + "')", null);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String entry = entryFrom(intent);
        if (entry != null) {
            pendingEntry = entry;
            dispatchEntry();
        }
    }

    private final class WidgetBridge {
        @JavascriptInterface
        public void update(String json) {
            GlucoseWidgetProvider.save(MainActivity.this, json == null ? "{}" : json);
        }
    }

    private void applySystemBars(boolean dark) {
        Window window = getWindow();
        int background = dark ? Color.rgb(20, 26, 25) : Color.rgb(245, 247, 244);
        // On Android 15+ the bar colors are ignored and the container's padding shows through instead
        if (root != null) root.setBackgroundColor(background);
        window.setStatusBarColor(background);
        window.setNavigationBarColor(background);
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                int light = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                controller.setSystemBarsAppearance(dark ? 0 : light, light);
            }
        } else {
            window.getDecorView().setSystemUiVisibility(dark ? 0
                    : View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        }
    }

    private final class PrintBridge {
        @JavascriptInterface
        public void print(String html, String title) {
            String jobName = title == null || title.isEmpty() ? "Debo" : title;
            runOnUiThread(() -> {
                WebView view = new WebView(MainActivity.this);
                printWebView = view;
                view.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView page, String url) {
                        PrintManager manager = (PrintManager) getSystemService(PRINT_SERVICE);
                        if (manager != null) {
                            manager.print(jobName, page.createPrintDocumentAdapter(jobName),
                                    new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).build());
                        }
                    }
                });
                view.loadDataWithBaseURL(null, html == null ? "" : html, "text/html", "UTF-8", null);
            });
        }
    }

    private final class FileBridge {
        @JavascriptInterface
        public void saveText(String name, String mime, String text) {
            pendingSaveText = text == null ? "" : text;
            runOnUiThread(() -> {
                try {
                    startActivityForResult(new Intent(Intent.ACTION_CREATE_DOCUMENT)
                            .addCategory(Intent.CATEGORY_OPENABLE)
                            .setType(mime == null || mime.isEmpty() ? "application/octet-stream" : mime)
                            .putExtra(Intent.EXTRA_TITLE, name == null ? "debo.json" : name), SAVE_FILE_REQUEST);
                } catch (Exception error) {
                    pendingSaveText = null;
                    notifyFileSaved("error");
                }
            });
        }
    }

    private void notifyFileSaved(String result) {
        if (webView != null) webView.post(() -> webView.evaluateJavascript(
                "window.onFileSaved && window.onFileSaved(\"" + result + "\")", null));
    }

    private void writePendingFile(Uri uri) {
        String text = pendingSaveText;
        pendingSaveText = null;
        new Thread(() -> {
            try (java.io.OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                if (out == null) throw new java.io.IOException("stream");
                out.write(text.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                notifyFileSaved("ok");
            } catch (Exception error) {
                notifyFileSaved("error");
            }
        }).start();
    }

    private final class SystemUiBridge {
        @JavascriptInterface
        public void setTheme(String theme) {
            boolean dark = "dark".equals(theme);
            runOnUiThread(() -> applySystemBars(dark));
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (healthBridge != null) healthBridge.onActivityResult(requestCode);
        if (requestCode == SAVE_FILE_REQUEST) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null && pendingSaveText != null) {
                writePendingFile(data.getData());
            } else {
                pendingSaveText = null;
                notifyFileSaved("cancel");
            }
            return;
        }
        if (requestCode == FILE_CHOOSER_REQUEST && fileChooserCallback != null) {
            Uri[] results = resultCode == RESULT_OK && data != null
                    ? FileChooserParams.parseResult(resultCode, data) : null;
            fileChooserCallback.onReceiveValue(results);
            fileChooserCallback = null;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (foodInputBridge != null) foodInputBridge.onRequestPermissionsResult(requestCode, grantResults);
        if (healthBridge != null) healthBridge.onRequestPermissionsResult(requestCode);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.evaluateJavascript("window.onAppResume && window.onAppResume()", null);
    }

    // Back first closes the open window or sub-page in the web app (window.onAppBack); only on Home does it leave the app.
    // Android 13+ delivers Back through OnBackInvokedCallback (with targetSdk 36 onBackPressed is no longer called).
    private void registerBackHandler() {
        if (Build.VERSION.SDK_INT < 33) return;
        getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,
                () -> handleBack(() -> moveTaskToBack(true)));
    }

    private void handleBack(Runnable leave) {
        if (webView == null) {
            leave.run();
            return;
        }
        webView.evaluateJavascript("!!(window.onAppBack && window.onAppBack())",
                handled -> { if (!"true".equals(handled)) leave.run(); });
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        handleBack(super::onBackPressed);
    }

    @Override
    protected void onDestroy() {
        if (billingBridge != null) billingBridge.close();
        if (foodInputBridge != null) foodInputBridge.close();
        if (webView != null) webView.removeJavascriptInterface("AndroidBilling");
        if (webView != null) webView.removeJavascriptInterface("AndroidAuth");
        if (webView != null) webView.removeJavascriptInterface("NativeFoodTools");
        if (webView != null) webView.removeJavascriptInterface("AndroidUi");
        if (webView != null) webView.removeJavascriptInterface("AndroidReminders");
        if (webView != null) webView.removeJavascriptInterface("AndroidPrint");
        if (webView != null) webView.removeJavascriptInterface("AndroidHealth");
        if (webView != null) webView.removeJavascriptInterface("AndroidFiles");
        if (webView != null) webView.removeJavascriptInterface("AndroidWidget");
        super.onDestroy();
    }
}
