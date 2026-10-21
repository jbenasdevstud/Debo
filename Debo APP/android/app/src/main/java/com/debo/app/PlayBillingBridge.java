package com.debo.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class PlayBillingBridge implements PurchasesUpdatedListener {
    private static final List<String> SUBS_IDS = Arrays.asList("membership_monthly", "membership_annual");

    private final Activity activity;
    private final WebView webView;
    private final Map<String, Purchase> knownPurchases = new HashMap<>();
    private BillingClient client;
    private String accountId = "";
    private boolean connecting;

    PlayBillingBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        client = BillingClient.newBuilder(activity)
                .setListener(this)
                .enablePendingPurchases(PendingPurchasesParams.newBuilder()
                        .enableOneTimeProducts()
                        .enablePrepaidPlans()
                        .build())
                .enableAutoServiceReconnection()
                .build();
    }

    @JavascriptInterface
    public void loadProducts(String userId) {
        accountId = userId == null ? "" : userId;
        runOnUi(() -> withConnection(this::queryProducts));
    }

    private void queryProducts() {
        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        for (String id : SUBS_IDS) products.add(QueryProductDetailsParams.Product.newBuilder()
                .setProductId(id).setProductType(BillingClient.ProductType.SUBS).build());
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder().setProductList(products).build();
        client.queryProductDetailsAsync(params, (result, queryResult) -> {
            JSONArray items = new JSONArray();
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                for (ProductDetails product : queryResult.getProductDetailsList()) {
                    JSONObject item = new JSONObject();
                    try {
                        ProductDetails.PricingPhase phase = recurringPhase(product);
                        item.put("productId", product.getProductId());
                        item.put("formattedPrice", phase == null ? "" : phase.getFormattedPrice());
                        item.put("priceMicros", phase == null ? 0 : phase.getPriceAmountMicros());
                        item.put("currency", phase == null ? "" : phase.getPriceCurrencyCode());
                        item.put("title", product.getTitle());
                    } catch (Exception ignored) { }
                    items.put(item);
                }
            }
            send("onPlayProducts", items.toString());
            restorePurchases();
        });
    }

    @JavascriptInterface
    public void purchase(String productId, String userId) {
        if (productId == null || !SUBS_IDS.contains(productId)) {
            sendPurchaseError("Nežinomas produktas.");
            return;
        }
        accountId = userId == null ? "" : userId;
        runOnUi(() -> withConnection(() -> {
            QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                    .setProductList(Arrays.asList(QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(productId).setProductType(BillingClient.ProductType.SUBS).build()))
                    .build();
            client.queryProductDetailsAsync(params, (result, queryResult) -> {
                ProductDetails selected = null;
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    for (ProductDetails item : queryResult.getProductDetailsList()) {
                        if (productId.equals(item.getProductId())) selected = item;
                    }
                }
                ProductDetails.SubscriptionOfferDetails offer = selected == null ? null : basePlan(selected);
                if (offer == null) {
                    sendPurchaseError("Narystė dar nepasiekiama „Google Play“.");
                    return;
                }
                BillingFlowParams flow = BillingFlowParams.newBuilder()
                        .setProductDetailsParamsList(Arrays.asList(BillingFlowParams.ProductDetailsParams.newBuilder()
                                .setProductDetails(selected)
                                .setOfferToken(offer.getOfferToken())
                                .build()))
                        .setObfuscatedAccountId(obfuscate(accountId)).build();
                BillingResult launch = client.launchBillingFlow(activity, flow);
                if (launch.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    sendPurchaseError("Nepavyko pradėti pirkimo („Google Play“ kodas " + launch.getResponseCode() + ").");
                }
            });
        }));
    }

    @JavascriptInterface
    public void acknowledge(String purchaseToken) {
        if (purchaseToken == null || purchaseToken.isEmpty()) return;
        runOnUi(() -> withConnection(() -> {
            Purchase purchase = knownPurchases.get(purchaseToken);
            if (purchase == null || purchase.isAcknowledged()
                    || purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) return;
            client.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(purchaseToken).build(), result -> { });
        }));
    }

    @JavascriptInterface
    public void manageSubscription(String productId) {
        String url = "https://play.google.com/store/account/subscriptions?package=" + activity.getPackageName();
        if (productId != null && SUBS_IDS.contains(productId)) url += "&sku=" + productId;
        String target = url;
        runOnUi(() -> {
            try {
                activity.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(target)));
            } catch (Exception ignored) { }
        });
    }

    private void withConnection(Runnable action) {
        if (client.isReady()) { action.run(); return; }
        if (connecting) return;
        connecting = true;
        client.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(BillingResult result) {
                connecting = false;
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) action.run();
                else sendPurchaseError("Nepavyko prisijungti prie „Google Play“ atsiskaitymo.");
            }
            @Override public void onBillingServiceDisconnected() { connecting = false; }
        });
    }

    private void restorePurchases() {
        client.queryPurchasesAsync(QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.SUBS).build(), (result, purchases) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) return;
            for (Purchase purchase : purchases) sendPurchase(purchase, true);
        });
    }

    @Override public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) sendPurchase(purchase, false);
        } else if (result.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            restorePurchases();
        } else if (result.getResponseCode() != BillingClient.BillingResponseCode.USER_CANCELED) {
            sendPurchaseError("„Google Play“ pirkimo nepavyko užbaigti.");
        } else {
            JSONObject payload = new JSONObject();
            try { payload.put("cancelled", true); } catch (Exception ignored) { }
            send("onPlayPurchase", payload.toString());
        }
    }

    private void sendPurchase(Purchase purchase, boolean restored) {
        List<String> products = purchase.getProducts();
        if (products.isEmpty() || !SUBS_IDS.contains(products.get(0))) return;
        JSONObject payload = new JSONObject();
        try {
            payload.put("productId", products.get(0));
            payload.put("subscription", true);
            payload.put("restored", restored);
            if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) payload.put("state", "pending");
            else if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                payload.put("state", "purchased");
                payload.put("purchaseToken", purchase.getPurchaseToken());
                payload.put("acknowledged", purchase.isAcknowledged());
                payload.put("autoRenewing", purchase.isAutoRenewing());
                knownPurchases.put(purchase.getPurchaseToken(), purchase);
            } else return;
        } catch (Exception ignored) { return; }
        send("onPlayPurchase", payload.toString());
    }

    private void sendPurchaseError(String message) {
        JSONObject payload = new JSONObject();
        try { payload.put("error", message); } catch (Exception ignored) { }
        send("onPlayPurchase", payload.toString());
    }

    private void send(String callback, String data) {
        String safe = JSONObject.quote(data);
        runOnUi(() -> webView.evaluateJavascript("window." + callback + " && window." + callback + "(" + safe + ")", null));
    }

    private void runOnUi(Runnable action) { activity.runOnUiThread(action); }

    private static ProductDetails.SubscriptionOfferDetails basePlan(ProductDetails product) {
        List<ProductDetails.SubscriptionOfferDetails> offers = product.getSubscriptionOfferDetails();
        if (offers == null || offers.isEmpty()) return null;
        for (ProductDetails.SubscriptionOfferDetails offer : offers) {
            if (offer.getOfferId() == null) return offer;
        }
        return offers.get(0);
    }

    private static ProductDetails.PricingPhase recurringPhase(ProductDetails product) {
        ProductDetails.SubscriptionOfferDetails offer = basePlan(product);
        if (offer == null) return null;
        List<ProductDetails.PricingPhase> phases = offer.getPricingPhases().getPricingPhaseList();
        return phases.isEmpty() ? null : phases.get(phases.size() - 1);
    }

    private static String obfuscate(String value) {
        if (value == null || value.isEmpty()) return "debo";
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder out = new StringBuilder();
            for (byte b : digest) out.append(String.format("%02x", b));
            return out.toString();
        } catch (Exception ignored) { return "debo"; }
    }

    void close() {
        if (client != null) client.endConnection();
    }
}
