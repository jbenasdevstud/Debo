# Debo – Diabetes companion

A calm, privacy-first diabetes diary for Android and iPhone. Log glucose, food, insulin and exercise, import CGM readings from Health Connect or Apple Health, and share a PDF report with your doctor. No account is needed and all data stays on the phone.

Available in Lithuanian, English, Latvian, Polish and German.

## Folders

| Folder | What it is |
|---|---|
| `Debo APP/` | Shared web app (`index.html`, `app.js`, `styles.css`, `lang-*.js`) |
| `Debo APP/android/` | Android app (WebView shell, Health Connect, reminders, widget) – open in Android Studio |
| `Debo APP/server/` | Optional Cloudflare Worker (not used in the current guest-only release) |
| `Debo APP/privacy-site/` | Privacy policy page (Cloudflare Pages) |
| `Debo APP/play-store/` | Google Play listing texts, screenshots and graphics |
| `Debo_IOS/` | iPhone app (WKWebView shell, HealthKit, notifications, WidgetKit widget) – open `Debo.xcodeproj` in Xcode |

The web files are copied into `Debo APP/android/app/src/main/assets/www` and `Debo_IOS/Debo/www`. Keep the three copies in sync after a change.

## Building

- **Android:** signing reads `Debo APP/android/keystore.properties`, which is not in this repository. Create it locally with `storeFile`, `storePassword`, `keyAlias` and `keyPassword`, then run `gradlew bundleRelease`.
- **iPhone:** see `Debo_IOS/SKAITYK_MANE.md`.

## Disclaimer

Debo is not a medical device. It does not diagnose, treat, cure or prevent any disease and does not calculate insulin doses.
