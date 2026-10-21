# Debo – Google Play materials

Everything needed for the store listing, in 5 languages (lt, en, lv, pl, de).

| Folder / file | What it is | Where it goes in Play Console |
|---|---|---|
| `listing/{lang}.md` | App name, short description, full description, release notes | Grow users → Store presence → Main store listing (add each language under "Manage translations") |
| `screenshots/{lang}/01–07.png` | 7 phone screenshots, 1080×1920 | Main store listing → Phone screenshots (2–8 per language) |
| `feature-graphic/feature-{lang}.png` | Feature graphic, 1024×500 | Main store listing → Feature graphic |
| `../logo/PNG/debo-play-icon.png` | App icon, 512×512 | Main store listing → App icon |
| `data-safety.md` | Data safety answers and other App content declarations | Policy and programs → App content |

Screenshot order: 1 home, 2 glucose chart, 3 statistics, 4 food catalogue, 5 low-glucose guide, 6 exercise guide, 7 supplies. The demo data is made up: generic insulin names, no brand logos, a neutral first name.

## This launch: free and guest-only

The current build (`api-config.js`) has `premiumEnabled: false` and `accountsEnabled: false`:

- No subscriptions; photo, voice and barcode entry are hidden.
- No sign-in or accounts: the welcome screen has one "Pradėti" button and asks only for a first name.
- **No data leaves the phone.** The server is needed only to host the privacy policy page.

## Steps

1. **Privacy policy – done.** Live at **https://debo-privacy.pages.dev** (Cloudflare Pages project `debo-privacy`, account jbenas.devstud@gmail.com). The source is `Debo APP/privacy-site/index.html` (5 languages, guest-only text). To change it, edit the file and run `npx wrangler pages deploy . --project-name debo-privacy --branch main` in that folder. The server's `/privacy` page describes accounts and Premium – use it only after turning those on.
2. **Build the app**: the current build is version 1.1.1 (versionCode 40, code optimised with R8; keep rules in `android/app/proguard-rules.pro`), saved as `Debo_app\Debo-1.1.1.aab`, signed with the upload key in `Documents\debo-keys`. Run `gradlew :app:bundleRelease` in `android` (it signs automatically through `keystore.properties`). For every update, raise `versionCode` – it must always go up.
3. **Create the app in Play Console**: Free, no in-app products. Declare yourself a **non-trader**.
4. **Store listing**: paste the texts from `listing/`, upload the icon, feature graphic and screenshots for each language.
5. **App content** (see `data-safety.md`): Data safety → "No data collected"; Privacy policy URL; Ads: none; App access: all features available without sign-in; Target audience 18+; Health apps declaration (Health & fitness, not a medical device); **Health Connect permissions declaration**.
6. **Content rating** questionnaire (expected: Everyone / PEGI 3).
7. **Closed testing**: upload the bundle, invite **at least 12 testers for 14 days** (personal developer account rule), then apply for production. Internal testing does not count. The invitation, a feedback form and draft answers for the production application are in `testers/`.
8. **Review the translations** with a native speaker before release, especially the hypo/hyper guides and the privacy policy for lv/pl/de.

Countries: add Lithuania, Latvia, Poland, Germany (and any others) under Production → Countries/regions.

## Turning accounts on later

1. Set the server secrets: `JWT_SECRET` (random 32+ characters), Brevo API key and `EMAIL_FROM` for password-reset emails, and the Google OAuth client IDs for Google sign-in (see `server/README.md`).
2. Apply the database migrations: `npx wrangler d1 migrations apply debo-meal-credits --remote`, then deploy.
3. Set `accountsEnabled: true` in `api-config.js`, copy it to the Android `www` folder, raise the version and build.
4. Update Data safety (Name, Email address, User IDs) and add the account-deletion URL.

## Turning Premium on later (needs accounts)

1. Set up a public address, email and phone, and switch your EU trader status to **trader**.
2. Create the subscriptions `membership_monthly` and `membership_annual` in Monetize → Subscriptions, with prices for every country; set up the billing service account and notifications (see `Debo-AI-ir-naryste.md`).
3. Add the OpenAI API key to the server, set `premiumEnabled: true`, raise the version and build.
4. Update Data safety (add Purchase history and Photos), and add the Premium paragraph back to the store descriptions.
