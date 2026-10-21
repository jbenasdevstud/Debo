# Debo – Google Play Data safety answers

Based on the current code (Android app `com.debo.app` 1.1.1 (versionCode 40), server `debo-meal-api`). The app no longer declares the microphone permission (voice entry is off). If you add analytics, crash reporting, ads or cloud sync later, these answers must change.

> **Guest-only free launch (current build: `premiumEnabled: false`, `accountsEnabled: false`):** nothing leaves the phone – no accounts, no subscriptions, no photo analysis. Answer **"No"** to *"Does your app collect or share any of the required user data types?"* and you are done with this form; no account-deletion URL is needed. The tables below apply only after you turn accounts or Premium back on – update the form *before* releasing that build.

Key fact for the whole form: **health entries (glucose, insulin, food, ketones, notes, workouts, device changes, supplies) never leave the phone.** Google counts data as "collected" only when it is sent off the device, so on-device data is not declared.

---

## Section 1 – Data collection and security

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS only) |
| Which of the following methods of account creation does your app support? | **Username and password**, **OAuth (Sign in with Google)** – account is optional, the app also works in guest mode |
| Delete account URL | `https://debo-meal-api.benas-jurkenas3.workers.dev/account-deletion` |
| Do you provide a way for users to request that some or all of their data is deleted, without requiring them to delete their account? | **No** (only full account deletion; on-device data is deleted in the app or by uninstalling) |

## Section 2 – Data types

Declare **only** these. For each one: *Collected* = yes, *Shared* = **no** (Cloudflare, OpenAI, Google Play and the email provider act as service providers, which Google does not count as sharing).

### Personal info
| Data type | Collected | Shared | Processed ephemerally | Required / optional | Purposes |
|---|---|---|---|---|---|
| Name | Yes | No | No | Optional (only with an account) | Account management |
| Email address | Yes | No | No | Optional (only with an account) | Account management, App functionality (password reset email) |
| User IDs | Yes | No | No | Optional (Google account ID when signing in with Google) | Account management |

### Financial info – only when Premium is on
| Data type | Collected | Shared | Processed ephemerally | Required / optional | Purposes |
|---|---|---|---|---|---|
| Purchase history | Yes | No | No | Optional (only when buying Premium) | App functionality (activating the membership) |

Debo never receives card or bank details – Google Play handles payment.

### Photos and videos – only when Premium is on
| Data type | Collected | Shared | Processed ephemerally | Required / optional | Purposes |
|---|---|---|---|---|---|
| Photos | Yes | No | **No** – OpenAI may keep requests up to 30 days for abuse monitoring, so do not tick "ephemeral" | Optional (only when the user chooses meal photo analysis) | App functionality |

### Do NOT declare
- **Health info / Fitness info** – stays on the phone, including data read from Health Connect.
- **Audio** – voice entry uses the phone's own speech recognition service; Debo receives only the recognised text and sends nothing. (Conservative alternative if a reviewer asks: declare "Voice or sound recordings", collected, not shared, processed ephemerally, optional, App functionality.)
- **App activity, App info and performance, Device or other IDs, Location** – no analytics, crash reporting or advertising SDKs are included.
- **Barcode lookups** – the barcode number sent to Open Food Facts is not user data.

---

## Related declarations in Play Console (App content)

| Item | Answer |
|---|---|
| Privacy policy URL | `https://debo-privacy.pages.dev/` (opens in the visitor's language; `?lang=lt`, `en`, `lv`, `pl`, `de` picks one). After turning accounts on, switch to the server's `/privacy` page. |
| Ads | **No ads** |
| App access | Choose **"All functionality is available without any access restrictions"** – there is no sign-in; the welcome screen only asks for a first name and has one "Pradėti" / "Start" button. (When accounts or Premium are on, give reviewers a test account and a licence-tester purchase.) |
| Target audience | **18+** recommended (the policy says 16+; choosing 18+ avoids the Families requirements) |
| Health apps declaration | Choose **Health and fitness** features (e.g. disease and condition management / logging). Avoid the "Medical" category on a personal developer account – Google may require an organisation account for medical apps. State that it is **not a medical device**, does not diagnose or treat, and has no regulatory clearance. |
| Health Connect permissions | READ_BLOOD_GLUCOSE – show glucose chart, statistics, time in range, doctor report. READ_HEALTH_DATA_IN_BACKGROUND – update the home screen widget while the app is closed. No write permissions. |
| Financial features | None |
| Trader status (EU) | Free launch: **non-trader** (you sell nothing). Switch to trader – with a public address, email and phone – before turning Premium on. |
| Government app | No |
| Content rating questionnaire | Category "Reference, News, or Educational" or "Utility"; answer **No** to violence, sexuality, gambling, user-generated content sharing. Expected rating: Everyone / PEGI 3. |
