# Debo for iPhone / iPad (Swift Playgrounds)

`Debo.swiftpm` is a Swift Playgrounds app. It shows the same web version of Debo (`Web/`) inside a native iOS window, with native iOS features added.

## Opening it
1. Copy `Debo.swiftpm.zip` to your iPad or Mac (iCloud Drive, AirDrop, Files).
2. Tap the zip to unzip it, then tap `Debo.swiftpm`. It opens in Swift Playgrounds (version 4.4 or later, iPadOS/macOS 17+).
3. Press ▶︎ Run. For real use, open the app full screen (the expand button on App Preview).

## What works on iOS
- Everything in the web version: entries, charts, statistics, guides and themes. Data is stored on the device only.
- Reminders as iOS notifications: glucose checks (with night pause), long-acting insulin, post-meal check, 15-min hypo timer, weekly summary, custom, care and supply reminders. Glucose reminders every 2 h are scheduled about a day ahead and refreshed every time the app is opened (iOS keeps at most 64 pending notifications).
- PDF report: **Print** opens the iOS print dialog, which can also save it as a PDF.
- Backup: **Export** opens the share sheet. **Restore** uses the iOS file picker.
- Barcode scanner for food (camera; on devices with an A12 chip or newer). Manual EAN entry otherwise.
- Light / dark theme follows the app setting.

Hidden on iOS (Android only): Health Connect/CGM, voice input, the home-screen widget.

## Publishing to the App Store
1. Join the Apple Developer Program (99 USD per year): https://developer.apple.com/programs/
2. In Swift Playgrounds: open the app → **App Settings** → sign in with the developer Apple ID and pick your team. Check that the bundle ID `com.debo.app` is free; if not, change it (e.g. `lt.debo.app`).
3. In App Store Connect (https://appstoreconnect.apple.com) create a new app with the same bundle ID:
   - Category: **Medical** (or Health & Fitness).
   - Privacy policy URL: https://debo-privacy.pages.dev (add an iOS section to it: data stays on the device, notifications and camera are used only for reminders and barcodes).
   - App Privacy: **Data Not Collected**.
   - Screenshots: iPhone 6.9" and iPad 13".
   - Export compliance: the app uses no encryption beyond Apple's standard (HTTPS) → "None of the algorithms mentioned".
4. In Swift Playgrounds: **App Settings → Upload to App Store Connect**.
5. In App Store Connect: pick the build, fill in the review notes and submit.

Review notes worth adding: "Debo is a diabetes logbook. It does not calculate doses or interpret readings. All data stays on the device; no account is needed."

## Updating
After changing the web app (`Debo APP/index.html`, `app.js`, …), copy the files into `ios/Debo.swiftpm/Web/` again and raise `displayVersion` / `bundleVersion` in `Package.swift`:

```bash
cd "Debo APP" && cp -r index.html app.js styles.css api-config.js lang-*.js assets ../ios/Debo.swiftpm/Web/
```
