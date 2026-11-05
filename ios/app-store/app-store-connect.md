# Debo – App Store Connect answers (iOS 1.0)

Based on the current iOS build: free, guest-only (`premiumEnabled: false`, `accountsEnabled: false`).
Nothing leaves the device. If you turn on accounts, Premium, analytics or Apple Health later, update these answers **before** that release.

## App Information
| Field | Answer |
|---|---|
| Primary category | **Medical** |
| Secondary category | Health & Fitness |
| Content rights | Does not contain, show or access third-party content |
| Age rating | Fill in the questionnaire honestly: no violence, gambling, user content, web browsing, etc. For **Medical or treatment information** choose the mild / infrequent option (general guides on low and high glucose). Expected result: 13+ or similar. |
| Regulated medical device (EU / UK / US) | **No** – Debo is a logbook and general information app, not a medical device |
| Digital Services Act (EU) trader status | **Not a trader**, if you publish only as a private person and earn nothing from the app (same as Google Play). Choose **Trader** if you sell anything or act as a business – then your address, phone and e-mail are shown in the EU App Store. |

## Pricing and Availability
- Price: **Free** (0)
- Availability: all countries, or at least Lithuania, Latvia, Poland, Germany and the other EU countries
- iPhone and iPad: both (the app supports both)
- "Make available on Mac / Apple Vision": you may leave it on; turn it off if you don't want to support those

## App Privacy (Data types)
- "Do you or your third-party partners collect data from this app?" → **No, we do not collect data from this app**
- Result shown on the App Store: **Data Not Collected**

Why: all entries are stored only in the app's storage on the device. Reminders are local notifications. Reports and backups are files the user saves or shares by themselves. Apple counts data as "collected" only when it leaves the device to you or a third party.

## Export compliance (asked for TestFlight and each build)
- "Does your app use encryption?" → **Yes**, only standard (HTTPS) → choose **"None of the algorithms mentioned above"** (exempt)
- No documents needed.
- Tip: to skip this question for every build, it can be added to the app's Info.plist later (`ITSAppUsesNonExemptEncryption = NO`).

## App Review Information
- Sign-in required: **No** (no accounts)
- Contact: your name, phone and e-mail (jbenas.devstud@gmail.com)
- Notes (paste as-is):

> Debo is a diabetes logbook for recording glucose readings, food, insulin doses and exercise, with charts, statistics and a PDF report the user can print or share with their doctor.
>
> No account or sign-in is needed. Tap "Start", enter any first name and the app is ready. All data is stored only on the device; nothing is sent to us or any third party. There are no ads, analytics or in-app purchases.
>
> Debo does not calculate insulin doses, interpret readings or give treatment recommendations. The low/high glucose and exercise sections contain general information only, with a reminder to follow the user's own doctor's advice.
>
> Notifications are used only for reminders the user turns on (glucose checks, long-acting insulin, sensor change, supplies, weekly summary). The camera permission is declared for a food barcode scanner that is not enabled in this version.
>
> The app is built with Swift and WKWebView; native iOS features used: local notifications, printing (UIPrintInteractionController), share sheet for backups, file picker for restore.

## Screenshots
Required: **iPhone 6.9"** (1320 × 2868 or 1290 × 2796) and **iPad 13"** (2064 × 2752), 3–10 each per language.
Easiest: install the TestFlight build, add demo data, take screenshots on your iPhone and iPad (side button + volume up). If your iPhone is a smaller model, send them to me and I'll resize them to the right size.

Suggested order (same as Google Play):
1. Home screen with today's glucose, food and insulin
2. Glucose chart
3. Statistics (averages, time in range, daily profile)
4. Food catalogue
5. Low-glucose guide
6. Exercise guide
7. Supplies and device changes

Use made-up demo data, generic insulin names where possible and a neutral first name. No other apps' logos.

## Before you press "Submit for Review"
- [ ] Privacy policy updated with the iOS section (`privacy-policy-ios.md`) and deployed
- [ ] Build tested through TestFlight on iPhone and iPad (typing, reminders, report, backup)
- [ ] Screenshots uploaded for iPhone and iPad
- [ ] Description, keywords, support and privacy URLs filled in (lt + en; lv / pl / de optional)
- [ ] App Privacy = Data Not Collected
- [ ] Age rating questionnaire done
