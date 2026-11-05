# Privacy policy – changes for the iPhone / iPad version

> **Done (2026-11-05):** these changes are applied in all 5 languages in `Debo APP/privacy-site/index.html`. They still need to be deployed to https://debo-privacy.pages.dev (Cloudflare → Workers & Pages → debo-privacy → Create deployment → upload `index.html`, or `npx wrangler pages deploy . --project-name debo-privacy --branch main`).

The current policy (`Debo APP/privacy-site/index.html`, https://debo-privacy.pages.dev) has an **"Apple Health (iPhone)"** section, but the iOS app does **not** use Apple Health. Apple compares the policy with the app, so replace that section and adjust three others. Do the same in lv / pl / de (I can translate when you want).

## 1. "General provisions" – first sentence
**EN:** This privacy policy explains how information is handled in the "Debo" mobile app for Android (package com.debo.app) and for iPhone and iPad (hereinafter – the App).

**LT:** Ši privatumo politika paaiškina, kaip tvarkoma informacija mobiliojoje programėlėje „Debo“, skirtoje „Android“ (paketas com.debo.app) ir iPhone bei iPad įrenginiams (toliau – Programėlė).

## 2. Replace "Apple Health (iPhone)" with "iPhone and iPad"
**EN – iPhone and iPad**
On iPhone and iPad the App stores everything you enter only in its own storage on your device. The iOS version does not read or write Apple Health (HealthKit) data and does not store your entries in iCloud.
If you turn on reminders, the App asks for permission to send notifications. Notifications are scheduled locally by iOS; no information is sent to any server. You can turn them off at any time in the App or in Settings → Notifications → Debo.
A PDF report is created only when you tap Print; a backup file is created only when you tap Export. You decide where to save them and whether to share them, for example with your doctor.

**LT – iPhone ir iPad**
iPhone ir iPad įrenginiuose Programėlė visą jūsų įvestą informaciją saugo tik savo saugykloje jūsų įrenginyje. iOS versija neskaito ir nerašo „Apple Health“ (HealthKit) duomenų ir nesaugo jūsų įrašų „iCloud“.
Jei įjungiate priminimus, Programėlė paprašo leidimo siųsti pranešimus. Pranešimus planuoja pati iOS jūsų įrenginyje, jokia informacija į serverius nesiunčiama. Pranešimus galite bet kada išjungti Programėlėje arba Nustatymuose → Pranešimai → Debo.
PDF ataskaita sukuriama tik paspaudus „Spausdinti“, atsarginės kopijos failas – tik paspaudus „Eksportuoti“. Jūs patys sprendžiate, kur juos išsaugoti ir ar kam nors perduoti, pavyzdžiui, gydytojui.

## 3. "Third parties" – add after the Google Play sentence
**EN:** On iPhone and iPad the App is distributed through the Apple App Store. Apple may process certain data (for example about your device and installation) under its own privacy policy: apple.com/legal/privacy.

**LT:** iPhone ir iPad įrenginiams Programėlė platinama per „Apple App Store“. „Apple“ gali tvarkyti tam tikrus duomenis (pavyzdžiui, apie įrenginį ir diegimą) pagal savo privatumo politiką: apple.com/legal/privacy.

## 4. "Security"
**EN:** Your information is protected by the app isolation (sandbox) of Android and iOS. We recommend using a screen lock and making regular backups, because if you lose your device the Developer cannot restore your data.

**LT:** Informaciją saugo „Android“ ir iOS operacinių sistemų programėlių izoliacija. Rekomenduojame naudoti įrenginio ekrano užraktą ir reguliariai kurti atsargines kopijas, nes praradus įrenginį Kūrėjas negali atkurti jūsų duomenų.

## 5. Update date
Change `UPDATED` to the day you deploy the new version.
