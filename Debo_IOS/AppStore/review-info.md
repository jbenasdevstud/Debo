# App Store Connect – answers for the forms

Everything below matches the current build: free, no accounts, no ads, no data leaves the iPhone.

## App information
| Field | Value |
|---|---|
| Name | Debo – diabeto palydovas (each language: see `lt.md`, `en.md`, …) |
| Primary language | Lithuanian |
| Bundle ID | com.debo.app (the same as in Xcode) |
| SKU | debo-ios |
| Primary category | Health & Fitness |
| Secondary category | (leave empty) – do NOT choose Medical |
| Content rights | "No, it does not contain, show, or access third-party content" |

## URLs
| Field | Value |
|---|---|
| Privacy Policy URL | https://debo-privacy.pages.dev/ (publish the updated `privacy-site` first – it must mention Apple Health) |
| Support URL | https://debo-privacy.pages.dev/ (the page has the contact e-mail) |
| Marketing URL | leave empty |

## Pricing and availability
Free (0 USD). Countries: Lithuania, Latvia, Poland, Germany (or all).

## App Privacy ("nutrition label")
"Do you or your third-party partners collect data from this app?" → **No, we do not collect data from this app.**
(Health data is only read and kept on the iPhone; Apple counts only data sent off the device as "collected".)

## Age rating questionnaire
- Medical / Treatment Information: **Infrequent/Mild** (general information about low and high glucose)
- Alcohol, Tobacco, or Drug Use or References: **Infrequent/Mild** (the food catalogue lists beer and wine with carbohydrates)
- Everything else (violence, gambling, horror, mature themes, profanity, sexual content, contests, unrestricted web access, user-generated content): **None / No**
- Expected result: 12+ – fine.

## Export compliance
Already answered in the app (`ITSAppUsesNonExemptEncryption = NO`). If asked: the app uses no encryption beyond standard HTTPS → "None of the algorithms mentioned above".

## App Review Information
Sign-in required: **No**.
Contact: your name, phone and e-mail.

Notes (paste in English):

```
Debo is a diabetes diary that works offline. No account is needed: tap "Start", enter any first name and the app is ready.

Apple Health: tap the round profile letter in the top-left corner → "Settings" → section "CGM via Apple Health" → "Connect". Debo asks for read access to Blood Glucose only. Readings are shown on the glucose chart, in Statistics and in the doctor report. To test it, add a Blood Glucose sample in the Health app (Browse → Body Measurements… or Other Data → Blood Glucose → Add Data) and tap "Sync now" in Debo. Without Apple Health data, readings can be entered by hand with the + button.

Debo only reads blood glucose, never writes to Apple Health, and keeps all data on the device. It does not calculate insulin doses or give treatment advice; this is stated in the app description and in the guides.
```

## Screenshots (required)
iPhone 6.9" display: 1320 × 2868 pixels (portrait), 3 to 10 images.
Make them in the Xcode Simulator with **iPhone 16 Pro Max** (see `SKAITYK_MANE.md`, step 6).
