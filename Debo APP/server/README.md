# Debo meal-photo API

The Cloudflare Worker accepts a meal image, calls OpenAI's Responses API with vision, and returns editable nutrition estimates. It does not persist uploaded images or analysis results. The OpenAI key must exist only in the server environment.

## Free hosting with Cloudflare Workers

The app can use Cloudflare's `workers.dev` HTTPS address, so no domain or paid server is required. The Workers Free plan currently includes up to 100,000 requests per day and free Worker execution within its limits. OpenAI image analysis remains usage-billed separately; OpenAI publishes an image cost calculator because the cost depends on model and image size. Review the [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and [OpenAI image cost calculator](https://developers.openai.com/api/docs/guides/image-cost-calculator).

In Cloudflare's dashboard, create a free account. In this folder, use Wrangler to deploy the Worker and set the OpenAI key as a secret:

```powershell
npx wrangler login
npx wrangler secret put OPENAI_API_KEY --name debo-meal-api
npx wrangler deploy
```

Wrangler prints the HTTPS `workers.dev` URL after deployment. Set that URL in `api-config.js` as `mealAnalysisApiBaseUrl`, then rebuild the Android AAB. Keep the key in the Cloudflare secret; never add it to `api-config.js` or the app.

## Run locally

Requires Node.js 20 or newer. In PowerShell:

```powershell
$env:OPENAI_API_KEY = 'your-server-side-key'
$env:OPENAI_VISION_MODEL = 'gpt-6-luna'
node .\server\meal-analysis.mjs
```

The endpoint is `POST /api/analyze-meal`; the JSON body is `{ "imageDataUrl": "data:image/jpeg;base64,...", "language": "lt" }`. It accepts JPEG, PNG, or WebP images. It applies a basic in-memory per-IP request limit. Do not treat that simple limit or CORS as authentication; use Cloudflare abuse controls before broad public release.

## Paid photo analysis setup

The Worker supports email/password accounts, 3 free introductory analyses per new account, and Google Play subscriptions for unlimited analysis. Subscription IDs are `membership_monthly` (€8.99 per month) and `membership_annual` (€89.99 per year). Membership is activated only after the Worker checks the purchase token with Google Play, and the Worker acknowledges each new subscription.

Before deploying this billing version:

1. Create a Cloudflare D1 database named `debo-meal-credits`, replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.jsonc`, then apply `migrations/0001_billing.sql`.
2. Bind that database as `DB` in the Worker settings.
3. Keep the existing `OPENAI_API_KEY` secret. Add `JWT_SECRET` (a new random secret, at least 32 bytes), `PLAY_SERVICE_ACCOUNT_JSON` (the Google Play service account JSON), and `PLAY_PACKAGE_NAME` (`com.debo.app`) to Worker secrets/variables. Never put these values in the Android app.
4. Link the Google Play developer account to the Google Cloud project, grant the service account access to the app and Play Developer API, and create both subscriptions with the IDs above, each with an auto-renewing base plan. Set their prices in Play Console.
5. Deploy the Worker, then publish the updated Android app to an internal testing track. Play purchases must be tested using a licensed tester account and products available in the Play Console.

The Worker requires authenticated accounts for photo analysis. Account credentials and the credit balance live on the Worker/D1 database; health logs remain local to the phone. Password reset by email is described below; email address verification at sign-up is not implemented.

## Account management

Authenticated users can change their password (`POST /api/auth/password` with `currentPassword` and `newPassword`) and permanently delete their account (`POST /api/auth/delete`), which removes the user row and its purchase links. Google Play requires in-app account deletion for apps that offer account creation; also publish a web page or email address for deletion requests and enter it in Play Console under Data safety. Failed email/password sign-ins are limited to 8 attempts per 15 minutes for each IP and email combination.

## Privacy policy and account deletion pages

The Worker serves public pages in Lithuanian and English, so no extra hosting is needed:

- `https://<worker>/privacy` (add `?lang=en` for English) – use this URL in Play Console (App content > Privacy policy) and in the Health Connect declaration.
- `https://<worker>/account-deletion` – use this URL in Play Console > Data safety > Data deletion.

Set `CONTACT_EMAIL` (a mailbox you read, used for privacy and deletion requests) and `DEVELOPER_NAME` (your name or company, shown as data controller) in `wrangler.jsonc` `vars` before deploying. The app links to the policy on the sign-in screen and in the profile.

## Password reset by email

Users who forget their password tap **Forgot password?** on the sign-in screen, receive a 6-digit code by email and set a new password in the app. Codes are stored only as an HMAC hash, expire after 15 minutes, allow 5 attempts, and at most 3 codes per account per hour can be sent (60 s between sends). The request endpoint always answers the same way, so it does not reveal which emails have accounts. Changing or resetting a password signs the account out on other devices.

1. Apply `migrations/0004_password_resets.sql` (`npx wrangler d1 migrations apply debo-meal-credits --remote` applies all pending migrations).
2. Choose an email provider:
   - **Brevo** (works without your own domain; free plan 300 emails/day): create an account, verify a sender address under Senders, create an API key, then `npx wrangler secret put BREVO_API_KEY`.
   - **Resend** (needs a domain you own): verify the domain, create an API key, then `npx wrangler secret put RESEND_API_KEY`.
3. Set `EMAIL_FROM` in `wrangler.jsonc` `vars` to the verified sender address (and optionally `EMAIL_FROM_NAME`), then deploy.

Endpoints: `POST /api/auth/reset/request` with `{ email, language }` and `POST /api/auth/reset/confirm` with `{ email, code, newPassword }`; the confirm endpoint returns a new session token.

## Google Play real-time developer notifications (RTDN)

RTDN keeps membership status current when a subscription renews, is cancelled, expires, goes on hold, is refunded or is replaced by a new purchase. Google Play publishes these events to Google Cloud Pub/Sub, and Pub/Sub pushes them to `POST /api/play/rtdn`.

1. Create a random secret and store it: `npx wrangler secret put RTDN_TOKEN`.
2. In the Google Cloud project used for the Play service account, enable **Cloud Pub/Sub API** and create a topic, for example `play-billing`.
3. On that topic, grant the **Pub/Sub Publisher** role to `google-play-developer-notifications@system.gserviceaccount.com`.
4. Create a **push** subscription on the topic with endpoint `https://<worker>/api/play/rtdn?token=<RTDN_TOKEN>`. Recommended: enable authentication with a service account and set the audience to the same endpoint URL without the query string, then set `RTDN_AUDIENCE` to that audience and `RTDN_SERVICE_ACCOUNT` to the service account email. The Worker then also verifies Google's signed token.
5. In Play Console > Monetize with Play > Monetization setup, enter the full topic name `projects/<project-id>/topics/play-billing`, choose subscriptions and voided purchases, save, and press **Send test notification**. A test message returns HTTP 200.

The Worker re-reads each subscription from the Play Developer API instead of trusting the message body, acknowledges new subscriptions, links resubscriptions through `linkedPurchaseToken`, and recalculates the account's membership from all linked purchases. Failed Google API lookups return HTTP 500 so Pub/Sub retries the message. Events for purchases not yet linked to an account are ignored; the app links them on its next purchase check.

## Google account sign-in

The Android app uses Google's Credential Manager to request a Google ID token. The Worker validates its signature, audience, verified email, expiry, and one-time nonce before creating or linking the app account. Health logs remain on the phone; only account identity and the photo-analysis credit balance are stored in D1.

Before enabling sign-in:

1. In Google Cloud, configure the OAuth consent screen and create a **Web application** OAuth client. Also create an **Android** OAuth client for `com.debo.app` using the Play app's SHA-1 signing certificate (from Play Console > App integrity after Play App Signing is enabled).
2. Set the Web application client ID in the Cloudflare Worker variable `GOOGLE_WEB_CLIENT_ID`. The app fetches this public client ID from `/api/auth/config`; client IDs are public, and no OAuth client secret belongs in the app.
3. Apply `migrations/0002_google_accounts.sql` to the existing D1 database, set the Worker variable, and deploy the Worker.
4. Rebuild the Android app and test sign-up, repeat sign-in, and sign-in after reinstall with an internal tester account.

The app grants three introductory analysis credits to a new Google account. A verified Google email matching an existing email account is linked to that account, preserving its balance.

## Connect the Android app

Set `window.DEBO_CONFIG.mealAnalysisApiBaseUrl` in `api-config.js` to the deployed HTTPS service base URL (without a trailing path), for example `https://api.example.com`. Then copy the updated web files into `android/app/src/main/assets/www` and build the Android app. This project cannot be enabled for real devices until the service has a deployed HTTPS URL and a valid server-side API key.

The app's account session authenticates photo-analysis requests. Before broad public release, add email verification, password recovery, production abuse controls, and review the privacy notice. CORS is not authentication.

The output is an estimate for user review, not a measured nutrition label. Glycemic index depends on the specific food and preparation and may be omitted. The endpoint deliberately does not accept glucose, active insulin, correction factors, or return insulin doses.

## Current deployment

The deployed Worker is `debo-meal-api` at `https://debo-meal-api.benas-jurkenas3.workers.dev`. In the Cloudflare dashboard, open this Worker, choose **Settings** > **Runtime variables and secrets** > **Add variable**, use the name `OPENAI_API_KEY`, mark it as a **Secret**, enter the OpenAI API key, and choose **Add variable and deploy**. Do not send the key in chat. OpenAI API usage is billed separately.

The API limits each IP address to 20 photo requests per hour in memory and limits account creation to 5 per IP per hour. These are basic abuse guards, not production-grade fraud prevention. The Worker does not persist uploaded photos or results, and it never calculates insulin doses.
