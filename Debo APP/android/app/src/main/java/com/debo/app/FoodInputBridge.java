package com.debo.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions;
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning;

import org.json.JSONObject;

import java.util.ArrayList;

public final class FoodInputBridge {
    private static final int AUDIO_PERMISSION_REQUEST = 8124;
    private final Activity activity;
    private final WebView webView;
    private SpeechRecognizer speechRecognizer;
    private String pendingLanguage = "lt-LT";

    FoodInputBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    @JavascriptInterface
    public void scanBarcode() {
        activity.runOnUiThread(() -> {
            try {
                GmsBarcodeScannerOptions options = new GmsBarcodeScannerOptions.Builder()
                        .setBarcodeFormats(
                                com.google.mlkit.vision.barcode.common.Barcode.FORMAT_EAN_13,
                                com.google.mlkit.vision.barcode.common.Barcode.FORMAT_EAN_8,
                                com.google.mlkit.vision.barcode.common.Barcode.FORMAT_UPC_A,
                                com.google.mlkit.vision.barcode.common.Barcode.FORMAT_UPC_E)
                        .enableAutoZoom()
                        .build();
                GmsBarcodeScanning.getClient(activity, options).startScan()
                        .addOnSuccessListener(barcode -> {
                            String value = barcode.getRawValue();
                            if (value == null || value.trim().isEmpty()) send("onNativeBarcodeError", "scan");
                            else send("onNativeBarcodeScanned", value);
                        })
                        .addOnCanceledListener(() -> { })
                        .addOnFailureListener(error -> send("onNativeBarcodeError", "scan"));
            } catch (Exception error) {
                send("onNativeBarcodeError", "scan");
            }
        });
    }

    @JavascriptInterface
    public void startSpeechRecognition(String language) {
        pendingLanguage = "en".equalsIgnoreCase(language) ? "en-US" : "lt-LT";
        activity.runOnUiThread(() -> {
            if (activity.checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                    != PackageManager.PERMISSION_GRANTED) {
                activity.requestPermissions(
                        new String[]{Manifest.permission.RECORD_AUDIO},
                        AUDIO_PERMISSION_REQUEST);
            } else {
                startRecognition();
            }
        });
    }

    void onRequestPermissionsResult(int requestCode, int[] grantResults) {
        if (requestCode != AUDIO_PERMISSION_REQUEST) return;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            startRecognition();
        } else {
            send("onNativeSpeechError", "permission");
        }
    }

    private void startRecognition() {
        if (!SpeechRecognizer.isRecognitionAvailable(activity)) {
            send("onNativeSpeechError", "unavailable");
            return;
        }
        stopRecognition();
        try {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(activity);
            speechRecognizer.setRecognitionListener(new RecognitionListener() {
                @Override public void onReadyForSpeech(Bundle params) { }
                @Override public void onBeginningOfSpeech() { }
                @Override public void onRmsChanged(float rmsdB) { }
                @Override public void onBufferReceived(byte[] buffer) { }
                @Override public void onEndOfSpeech() { }
                @Override public void onError(int error) {
                    send("onNativeSpeechError", "recognition");
                    stopRecognition();
                }
                @Override public void onResults(Bundle results) {
                    ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (matches == null || matches.isEmpty()) send("onNativeSpeechError", "empty");
                    else send("onNativeSpeechResult", matches.get(0));
                    stopRecognition();
                }
                @Override public void onPartialResults(Bundle partialResults) { }
                @Override public void onEvent(int eventType, Bundle params) { }
            });
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, pendingLanguage);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, pendingLanguage);
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
            speechRecognizer.startListening(intent);
        } catch (Exception error) {
            send("onNativeSpeechError", "recognition");
            stopRecognition();
        }
    }

    private void stopRecognition() {
        if (speechRecognizer == null) return;
        try { speechRecognizer.cancel(); } catch (Exception ignored) { }
        try { speechRecognizer.destroy(); } catch (Exception ignored) { }
        speechRecognizer = null;
    }

    private void send(String callback, String value) {
        String quoted = JSONObject.quote(value == null ? "" : value);
        webView.post(() -> webView.evaluateJavascript(
                "window." + callback + " && window." + callback + "(" + quoted + ")", null));
    }

    void close() {
        activity.runOnUiThread(this::stopRecognition);
    }
}
