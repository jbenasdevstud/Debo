package com.debo.app;

import android.app.Activity;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialException;

import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import org.json.JSONObject;

import java.util.concurrent.Executor;

public final class GoogleAuthBridge {
    private final Activity activity;
    private final WebView webView;
    private final CredentialManager credentialManager;

    GoogleAuthBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        this.credentialManager = CredentialManager.create(activity);
    }

    @JavascriptInterface
    public void startGoogleSignIn(String serverClientId, String nonce) {
        if (serverClientId == null || serverClientId.trim().isEmpty() || nonce == null || nonce.length() < 32) {
            sendError("configuration");
            return;
        }
        activity.runOnUiThread(() -> {
            try {
                GetGoogleIdOption googleOption = new GetGoogleIdOption.Builder()
                        .setFilterByAuthorizedAccounts(false)
                        .setServerClientId(serverClientId.trim())
                        .setNonce(nonce)
                        .build();
                GetCredentialRequest request = new GetCredentialRequest.Builder()
                        .addCredentialOption(googleOption)
                        .build();
                Executor executor = command -> activity.runOnUiThread(command);
                credentialManager.getCredentialAsync(activity, request, null, executor,
                        new androidx.credentials.CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                            @Override
                            public void onResult(GetCredentialResponse response) {
                                handleCredential(response.getCredential(), nonce);
                            }

                            @Override
                            public void onError(GetCredentialException error) {
                                String type = error.getClass().getSimpleName().toLowerCase();
                                sendError(type.contains("cancel") ? "cancelled" : "sign_in_failed");
                            }
                        });
            } catch (Exception error) {
                sendError("sign_in_failed");
            }
        });
    }

    private void handleCredential(Credential credential, String nonce) {
        if (!(credential instanceof CustomCredential)
                || !GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
            sendError("sign_in_failed");
            return;
        }
        try {
            GoogleIdTokenCredential googleCredential = GoogleIdTokenCredential.createFrom(((CustomCredential) credential).getData());
            JSONObject result = new JSONObject();
            result.put("idToken", googleCredential.getIdToken());
            result.put("nonce", nonce);
            evaluateCallback(result.toString());
        } catch (Exception error) {
            sendError("sign_in_failed");
        }
    }

    private void sendError(String reason) {
        try {
            JSONObject result = new JSONObject();
            result.put("error", reason);
            evaluateCallback(result.toString());
        } catch (Exception ignored) { }
    }

    private void evaluateCallback(String payload) {
        activity.runOnUiThread(() -> webView.evaluateJavascript(
                "window.onDeboGoogleCredential && window.onDeboGoogleCredential(" + payload + ")", null));
    }
}
