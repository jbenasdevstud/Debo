# Debo for iPad / Mac (Swift Playgrounds)

`Debo.swiftpm` is a Swift Playgrounds app. It shows the same web version of Debo (`Web/`) inside a native iOS window.

## Opening it
1. Copy `Debo.zip` (or the `Debo.swiftpm` folder) to your iPad or Mac, for example with iCloud Drive, AirDrop or the Files app.
2. Unzip it if needed. Tap `Debo.swiftpm` and it opens in Swift Playgrounds (version 4.4 or later, iPadOS/macOS 17+).
3. Press ▶︎ Run.

## What works
- Everything in the web version: entries, charts, statistics, guides and themes. Data is stored on the device.
- PDF report: **Print** opens the iOS print dialog, where you can also save it as a PDF.
- Backup: **Export** opens the share sheet (Save to Files, AirDrop and so on). **Restore** uses the iOS file picker.

## What doesn't work (Android only)
Health Connect/CGM, the home-screen widget, system reminders, voice input and the barcode scanner. The app hides or skips these features when the Android bridges are missing.

## Updating
After changing the web app (`Debo APP/index.html`, `app.js`, …), copy the files into `ios/Debo.swiftpm/Web/` again:

```bash
cd "Debo APP" && cp -r index.html app.js styles.css api-config.js lang-*.js assets ../ios/Debo.swiftpm/Web/
```
