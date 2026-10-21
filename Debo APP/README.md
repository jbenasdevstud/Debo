# Debo – kasdienis diabeto palydovas

Diabeto dienoraštis (įrašai ir bendra informacija) 1-o tipo diabetu sergantiems žmonėms. Android programėlė (`com.debo.app`) ir ta pati versija naršyklei. Kalbos: LT, EN, LV, PL, DE.

## Kas veikia
- Gliukozės, ketonų, insulino, maisto ir fizinio aktyvumo įrašai su pastabomis; redagavimas, ištrynimas su „Atšaukti“, paieška istorijoje.
- Gliukozės grafikas, statistika, PDF ataskaita gydytojui, atsarginė kopija.
- Health Connect (CGM rodmenų skaitymas), pagrindinio ekrano valdiklis, priminimai.
- Priemonės ir atsargos (sensoriaus, švirkštiklio, infuzijos rinkinio keitimas).
- Hipo- ir hiperglikemijos bei sporto gidai (bendra informacija).
- Šviesi, tamsi ir sistemos tema.

Dabartinis leidimas: **nemokamas, be paskyrų** – visi duomenys tik telefone (`api-config.js`: `premiumEnabled: false`, `accountsEnabled: false`).

## Aplankai
| Aplankas / failas | Kas tai |
|---|---|
| `index.html`, `app.js`, `styles.css`, `lang-*.js`, `api-config.js`, `assets/` | Programėlė (web). Pakeitus – nukopijuoti į `android/app/src/main/assets/www`. |
| `android/` | Android projektas. Pasirašytas failas: `gradlew :app:bundleRelease` → `app/release/`. |
| `privacy-site/` | Privatumo politika – https://debo-privacy.pages.dev |
| `play-store/` | Google Play tekstai, ekrano nuotraukos, grafika, Data safety atsakymai. |
| `logo/` | Logotipas ir ikonos (SVG, PNG, PDF). |
| `server/` | Cloudflare serveris paskyroms ir Premium – **dabar nenaudojamas**. |

## Paleidimas naršyklėje
Atidarykite `index.html` bet kurioje modernioje naršyklėje.

## Medicinos priemonės riba
Programėlė yra įrašų ir bendros informacijos priemonė, ne medicinos priemonė. Kad taip ir liktų, į ją **nedėkite**:

1. Insulino dozių, korekcijų ar I:C skaičiavimų (įskaitant aktyvaus insulino vertinimą).
2. Patarimų, priklausančių nuo konkretaus naudotojo rodmens („suleiskite X vnt.“, „suvalgykite Y g“).
3. Rodmenų interpretavimo, rizikos įspėjimų ar prognozių (pvz., žemos / krentančios gliukozės aliarmų, apskaičiuoto HbA1c).

Taip pat sekite formuluotes programėlėje ir „Google Play“ aprašyme: reguliuotojai vertina tai, ką žadate, ne tik tai, ką daro kodas.
