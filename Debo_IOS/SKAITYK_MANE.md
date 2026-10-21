# Debo iPhone – kaip įkelti į App Store iš MacBook

Šiame aplanke yra visas Xcode projektas. Programėlė naudoja **tą patį kodą kaip Android versija** (`Debo/www`), o iPhone dalis (priminimai, Apple Health, spausdinimas, failų išsaugojimas) parašyta Swift kalba.

## Ko reikia

| Kas | Pastaba |
|---|---|
| MacBook su **macOS 14.5 ar naujesne** | Xcode 16 reikalauja bent macOS 14.5. Patikrinti:  → „Apie šį Mac“. |
| **Xcode** (nemokamas, iš Mac App Store) | ~10 GB atsisiuntimas, įdiegti gali užtrukti valandą. Įdiekite iš anksto. |
| **Apple ID** | Jūsų, ne sesers. Galite prisijungti tik Xcode, sesers kompiuterio paskyros keisti nereikia. |
| **Apple Developer Program** (99 USD per metus) | https://developer.apple.com/programs/enroll/ – registruokitės iš anksto, patvirtinimas gali užtrukti 1–2 dienas. Individualiam kūrėjui App Store bus rodomas jūsų vardas ir pavardė. |

## 1. Nukopijuokite aplanką į MacBook

Nukopijuokite visą aplanką **`Debo_IOS`** (USB atmintine, AirDrop arba per iCloud Drive / Google Drive) pavyzdžiui į sesers MacBook aplanką „Desktop“.

## 2. Atidarykite projektą

Du kartus spustelėkite **`Debo_IOS/Debo.xcodeproj`**. Atsidarys Xcode.
Jei Xcode paklaus „Trust and open?“ – spauskite **Trust and Open**.

## 3. Prisijunkite su savo Apple ID

Xcode → meniu **Xcode → Settings… → Accounts** → apačioje **+** → **Apple ID** → prisijunkite.

## 4. Pasirinkite komandą (signing)

Projekte yra **dvi dalys**: pati programėlė (**Debo**) ir pagrindinio ekrano valdiklis (**DeboWidgetExtension**). Abiem reikia tos pačios komandos.

1. Kairėje spustelėkite mėlyną **Debo** (projektą) → viduryje **TARGETS → Debo** → skirtukas **Signing & Capabilities**.
2. **Team:** pasirinkite savo vardą (Apple Developer Program paskyrą).
3. Patikrinkite, ar sąraše yra **HealthKit** ir **App Groups** su pažymėtu `group.com.debo.app`. Jei grupė raudona arba jos nėra: **App Groups** skiltyje spauskite **+** ir įrašykite `group.com.debo.app`.
4. Tą patį padarykite **TARGETS → DeboWidgetExtension**: **Team** – jūsų vardas, **App Groups** – `group.com.debo.app`.
5. **Bundle Identifier:** programėlės `com.debo.app`, valdiklio `com.debo.app.widget`. Jei Xcode parašys, kad `com.debo.app` užimtas, pakeiskite į pvz. `com.benasjurkenas.debo`, o valdiklio – į `com.benasjurkenas.debo.widget` (valdiklio ID visada turi prasidėti programėlės ID). Tada App Store Connect naudokite naująjį programėlės ID.

## 5. Išbandykite simuliatoriuje

1. Viršuje, šalia „Debo“, pasirinkite įrenginį **iPhone 16 Pro Max**.
2. Spauskite ▶ (arba **Cmd+R**). Pirmą kartą kompiliavimas gali užtrukti kelias minutes.
3. Patikrinkite: įvedimą, grafiką, priminimus (simuliatorius rodo pranešimus), ataskaitą (spausdinimo langas), atsarginės kopijos išsaugojimą, Apple Health prijungimą (Profilis → Nustatymai → „CGM per Apple Health“ → Prijungti).
4. Valdiklis: simuliatoriuje grįžkite į pagrindinį ekraną (**Cmd+Shift+H**), ilgai paspauskite tuščią vietą → **+** viršuje → raskite **Debo** → pridėkite mažą arba vidutinį valdiklį. Įvedus gliukozę programėlėje, valdiklis atsinaujina; vidutinio dydžio valdiklio mygtukas „Įvesti gliukozę“ atidaro įvedimo langą.

> Jei kompiliuojant atsiranda klaida – nufotografuokite / nukopijuokite raudoną tekstą iš Xcode ir atsiųskite man. Projektą rašiau Windows kompiuteryje, kuriame Xcode nėra, todėl pirmas kompiliavimas yra pirmas tikras patikrinimas.

## 6. Ekrano nuotraukos App Store (privaloma)

Simuliatoriuje **iPhone 16 Pro Max** atidarykite norimą ekraną ir paspauskite **Cmd+S** – nuotrauka (1320 × 2868) išsaugoma į darbalaukį. Padarykite 4–7 nuotraukas (pradžia, grafikas, statistika, maistas, gairės, priemonės). Kalbą galima perjungti programėlėje (vėliava viršuje dešinėje), jei norite nuotraukų kiekviena kalba.

Patarimas: prieš fotografuodami įveskite kelias dienas pavyzdinių duomenų, kad grafikai neatrodytų tušti.

## 7. Paskelbkite atnaujintą privatumo politiką

Apple reikalauja, kad privatumo politikoje būtų aprašytas Apple Health naudojimas. Aplanke `privacy-site` jau yra atnaujinta versija (5 kalbomis). Ją reikia įkelti į tą patį adresą https://debo-privacy.pages.dev:

- **Paprasčiausia:** https://dash.cloudflare.com → Workers & Pages → **debo-privacy** → **Create deployment** → įkelkite failą `privacy-site/index.html` → Deploy.
- Arba Mac terminale (reikia Node.js iš https://nodejs.org): `cd ~/Desktop/Debo_IOS/privacy-site` ir `npx wrangler pages deploy . --project-name debo-privacy --branch main`

## 8. Sukurkite programėlę App Store Connect

https://appstoreconnect.apple.com → **Apps** → **+** → **New App**:
- Platforms: **iOS**
- Name: **Debo – diabeto palydovas**
- Primary Language: **Lithuanian**
- Bundle ID: **com.debo.app** (tas pats kaip 4 žingsnyje)
- SKU: **debo-ios**
- User Access: Full Access

Tada užpildykite (visi tekstai paruošti aplanke `AppStore`):
- **App Information**, **Pricing and Availability**, **App Privacy**, **Age Rating** – atsakymai faile `AppStore/review-info.md`.
- Versijos puslapyje (1.1.1) kiekvienai kalbai: pavadinimas, subtitras, reklaminis tekstas, aprašymas, raktažodžiai – failuose `AppStore/lt.md`, `en.md`, `lv.md`, `pl.md`, `de.md`. Kalbas pridedate viršuje dešinėje esančiu kalbos meniu.
- Įkelkite ekrano nuotraukas (6 žingsnis) į **iPhone 6.9" Display**.

## 9. Įkelkite programėlę iš Xcode

1. Xcode viršuje vietoje simuliatoriaus pasirinkite **Any iOS Device (arm64)**.
2. Meniu **Product → Archive**. Palaukite, kol atsidarys langas **Organizer**.
3. **Distribute App** → **App Store Connect** → **Upload** → palikite numatytus nustatymus → **Upload**.
4. Po 10–30 min. App Store Connect versijos puslapyje, skiltyje **Build**, pasirinkite įkeltą versiją.

> Kiekvienam naujam įkėlimui padidinkite **Build** numerį (1 → 2 → 3…). Programėlės ir valdiklio numeriai turi sutapti, todėl keiskite juos **projekto** lygiu: kairėje mėlynas **Debo** → viduryje **PROJECT → Debo** (ne TARGETS) → **Build Settings** → paieškoje įrašykite `version` → **Current Project Version**. Ten pat yra ir **Marketing Version** (1.1.1), kurią keičiate tik naujai versijai.

## 10. (Neprivaloma) Išbandykite savo iPhone per TestFlight

App Store Connect → **TestFlight** → įkeltas build → pridėkite save kaip **Internal Tester**. Savo iPhone įdiekite programėlę **TestFlight** ir iš jos – Debo. Vidiniams testuotojams Apple peržiūros nereikia.

## 11. Pateikite peržiūrai

Versijos puslapyje **App Review Information** įklijuokite pastabas iš `AppStore/review-info.md`, tada **Add for Review** → **Submit for Review**. Apple peržiūra paprastai trunka 1–2 dienas. Jei atmes – laiške bus priežastis; atsiųskite ją man.

---

## Kas skiriasi nuo Android versijos

| Funkcija | iPhone |
|---|---|
| CGM rodmenys | Iš **Apple Health** (tik skaitymas), vietoje Health Connect |
| Priminimai | iOS pranešimai. 2 val. gliukozės priminimai suplanuojami parai į priekį ir atnaujinami kiekvieną kartą atidarius programėlę; naktinė pauzė veikia |
| Ataskaita gydytojui | iOS spausdinimo langas (iš jo galima išsaugoti PDF) |
| Atsarginė kopija | „Išsaugoti failuose“ (iCloud Drive arba „Mano iPhone“) |
| Pagrindinio ekrano valdiklis | Yra (mažas ir vidutinis): paskutinis rodmuo, tendencijos rodyklė, laikas; po 2 val. papilkėja; vidutinis turi mygtuką „Įvesti gliukozę“. Atsinaujina, kai programėlėje atsiranda naujas rodmuo |
| Skaitymas fone | Nėra (eilutė „Veikti fone“ nerodoma), todėl naujus CGM rodmenis valdiklis parodo atidarius programėlę |
| Įvedimo laukai | Paspaudus lauką puslapis nebepriartinamas (kaip programėlėje, ne kaip naršyklėje) |
| Tekstai | Paleidus iPhone, „Health Connect“ automatiškai rodomas kaip „Apple Health“, o sakiniai apie Android/Google Play praleidžiami (Apple atmeta programėles, kuriose minimos kitos platformos) |

## Kai atnaujinsite programėlės kodą

Web dalis yra `Debo_IOS/Debo/www`. Kai pakeisite failus `Debo APP` aplanke (Windows), nukopijuokite tuos pačius failus (`index.html`, `app.js`, `styles.css`, `api-config.js`, `lang-*.js`, `assets`) į `Debo_IOS/Debo/www`, padidinkite Build numerį ir vėl atlikite 9 žingsnį.
