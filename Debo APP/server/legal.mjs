const UPDATED = '2026-10-13';
const LANGUAGES = ['lt', 'en', 'lv', 'pl', 'de'];
const LANGUAGE_NAMES = { lt: 'Lietuvių', en: 'English', lv: 'Latviešu', pl: 'Polski', de: 'Deutsch' };

const TEXT = {
  lt: {
    privacyTitle: 'Privatumo politika',
    deletionTitle: 'Paskyros ir duomenų ištrynimas',
    updated: 'Atnaujinta',
    privacy: [
      ['Kas mes', `<p>Ši politika paaiškina, kaip programėlė „Debo“ (Android, paketas <code>com.debo.app</code>) tvarko asmens duomenis. Duomenų valdytojas: {controller}. Kontaktai privatumo klausimais: {contact}.</p>`],
      ['Svarbiausia trumpai', `<ul>
        <li>Gliukozės, insulino, maisto įrašai ir kiti sveikatos duomenys saugomi <strong>tik jūsų telefone</strong>. Mes jų negauname ir nesaugome savo serveriuose.</li>
        <li>Serveryje saugoma tik paskyros informacija (el. paštas, vardas) ir narystės būsena.</li>
        <li>Duomenų neparduodame, nenaudojame reklamai ir nesekame jūsų kitose programėlėse.</li>
      </ul>`],
      ['Kokius duomenis tvarkome', `<h3>Telefone saugomi duomenys</h3>
        <p>Gliukozės rodmenys (ir, jei įvedate, ketonai), insulino dozės, maisto įrašai, įrašų žymos, mėgstami valgiai, sensoriaus, švirkštiklio ar infuzijos rinkinio keitimo datos, atsargų kiekiai ir galiojimo datos, profilio nustatymai (vardas, amžius, gydymo būdas, insulino pavadinimai), priminimų nustatymai. Šie duomenys lieka programėlės saugykloje telefone ir ištrinami ištrynus programėlę arba jos duomenis.</p>
        <h3>Paskyros duomenys serveryje</h3>
        <p>Kuriant paskyrą: el. pašto adresas, vardas, slaptažodžio maiša (slaptažodis saugomas tik negrįžtamai užšifruotas, PBKDF2), arba prisijungiant su Google – Google paskyros identifikatorius, el. paštas ir vardas. Taip pat: nemokamų analizių likutis, narystės galiojimo data ir produktas, „Google Play“ pirkimo žetonai, paskyros sukūrimo data. Paprašius atkurti slaptažodį, 15 min. saugoma užšifruota vienkartinio kodo maiša.</p>
        <h3>Maisto nuotraukos</h3>
        <p>Pasirinkus analizuoti maisto nuotrauką, ji siunčiama į mūsų serverį ir perduodama OpenAI paslaugai maistinės vertės įvertinimui. Mes nuotraukų ir rezultatų nesaugome. OpenAI užklausas tvarko kaip duomenų tvarkytojas pagal savo API sąlygas; užklausos nenaudojamos modeliams mokyti ir gali būti laikinai (iki 30 d.) saugomos piktnaudžiavimo stebėsenai.</p>
        <h3>Health Connect</h3>
        <p>Jei įjungiate CGM sinchronizaciją, programėlė <strong>tik skaito</strong> kraujo gliukozės rodmenis (leidimas READ_BLOOD_GLUCOSE), kuriuos į Health Connect įrašo jūsų CGM ar gliukomačio programėlė. Šie rodmenys naudojami tik programėlėje telefone: grafikui, statistikai, laikui tiksliniame intervale ir ataskaitai gydytojui. Jie nesiunčiami į mūsų ar trečiųjų šalių serverius. Debo nieko nerašo į Health Connect. Jei įjungiate „Veikti fone“, programėlė, gavusi leidimą READ_HEALTH_DATA_IN_BACKGROUND, maždaug kas 15 min. perskaito naujausius rodmenis ir uždarius programėlę – tik tam, kad atnaujintų pagrindinio ekrano valdiklį; šie duomenys taip pat lieka telefone. Leidimus galite bet kada atšaukti Health Connect nustatymuose.</p>
        <p>Debo naudojimas ir informacijos, gautos iš Health Connect, perdavimas atitinka Health Connect leidimų politiką, įskaitant riboto naudojimo (Limited Use) reikalavimus.</p>
        <h3>Brūkšninių kodų paieška</h3>
        <p>Nuskaitytas produkto brūkšninis kodas siunčiamas į viešą „Open Food Facts“ duomenų bazę, kad būtų rasta produkto maistinė vertė. Kartu nesiunčiama jokia informacija apie jus. Brūkšninį kodą nuskaito „Google“ kodų skaitytuvas telefone; kamera mums neprieinama.</p>
        <h3>Balso įvestis</h3>
        <p>Diktuojant maisto pavadinimą naudojama telefono kalbos atpažinimo paslauga (dažniausiai „Google“). Garso įrašų negauname.</p>
        <h3>Mokėjimai</h3>
        <p>Narystės mokėjimus tvarko „Google Play“. Mes negauname kortelės ar banko duomenų – tik pirkimo žetoną ir prenumeratos būseną, kad galėtume aktyvuoti narystę. „Google Play“ mums praneša apie prenumeratos pratęsimą, atšaukimą ar pinigų grąžinimą.</p>
        <h3>Techniniai žurnalai</h3>
        <p>Serverio teikėjas „Cloudflare“ trumpam tvarko IP adresą ir užklausos techninius duomenis saugumui ir piktnaudžiavimo ribojimui (pvz., per daug prisijungimo bandymų).</p>`],
      ['Kodėl tvarkome ir teisinis pagrindas', `<ul>
        <li>Paskyra, narystė, mokėjimų patikra – sutarties vykdymas (BDAR 6 str. 1 d. b p.).</li>
        <li>Maisto nuotraukų analizė ir Health Connect duomenų skaitymas – jūsų sutikimas ir aiškus veiksmas programėlėje (BDAR 6 str. 1 d. a p. ir 9 str. 2 d. a p.). Sutikimą galite atšaukti bet kada.</li>
        <li>Saugumas ir piktnaudžiavimo prevencija – teisėtas interesas (BDAR 6 str. 1 d. f p.).</li>
      </ul>`],
      ['Kam perduodami duomenys', `<ul>
        <li>„Cloudflare, Inc.“ – serverio ir duomenų bazės paslaugos.</li>
        <li>„OpenAI“ – tik jūsų pasirinktos maisto nuotraukos analizei.</li>
        <li>„Google“ – prisijungimas su Google, „Google Play“ mokėjimai, kalbos atpažinimas, kodų skaitytuvas, Health Connect.</li>
        <li>„Open Food Facts“ – tik brūkšninis kodas.</li>
        <li>El. laiškų siuntimo paslauga („Brevo“ arba „Resend“) – tik el. pašto adresas ir slaptažodžio atkūrimo kodas, kai jo paprašote.</li>
      </ul>
      <p>Kai kurie teikėjai gali tvarkyti duomenis už ES ribų (pvz., JAV). Tokiu atveju taikomos ES standartinės sutarčių sąlygos arba ES ir JAV duomenų apsaugos sistema.</p>`],
      ['Kiek laiko saugome', `<p>Paskyros duomenys saugomi, kol paskyra aktyvi. Ištrynus paskyrą, paskyros įrašas ir susieti pirkimų įrašai iš mūsų duomenų bazės ištrinami iš karto. Telefone saugomi duomenys lieka jūsų valdomi, kol ištrinate juos programėlėje arba ištrinate programėlę. „Google Play“ mokėjimų įrašus saugo „Google“ pagal savo taisykles.</p>`],
      ['Jūsų teisės', `<p>Turite teisę susipažinti su savo duomenimis, juos ištaisyti, ištrinti, apriboti tvarkymą, nesutikti, gauti duomenis perkeliamu formatu ir atšaukti sutikimą. Telefone saugomus duomenis galite eksportuoti patys (Statistika → Atsarginė kopija). Dėl kitų prašymų rašykite {contact}. Taip pat galite pateikti skundą Valstybinei duomenų apsaugos inspekcijai (<a href="https://vdai.lrv.lt">vdai.lrv.lt</a>).</p>`],
      ['Paskyros ištrynimas', `<p>Paskyrą galite ištrinti programėlėje: Profilis → Ištrinti paskyrą. Daugiau informacijos: <a href="{deletionUrl}">paskyros ištrynimo puslapis</a>.</p>`],
      ['Vaikai', `<p>Programėlė skirta 16 metų ir vyresniems asmenims. Jaunesni asmenys ją gali naudoti tik su tėvų ar globėjų sutikimu ir priežiūra.</p>`],
      ['Medicininis įspėjimas', `<p>„Debo“ yra įrašų (dienoraščio) ir bendros informacijos programėlė, o ne medicinos priemonė. Ji neskaičiuoja insulino dozių, neinterpretuoja jūsų rodmenų ir neteikia individualių gydymo rekomendacijų. Gydymo sprendimus priimkite kartu su savo gydytoju.</p>`],
      ['Saugumas', `<p>Duomenys tarp programėlės ir serverio perduodami šifruotu HTTPS ryšiu, slaptažodžiai saugomi tik negrįžtamai užšifruoti, prieiga prie serverio ribojama. Telefone duomenis saugo Android programėlės izoliacija.</p>`],
      ['Pakeitimai', `<p>Apie esminius šios politikos pakeitimus pranešime programėlėje. Data viršuje rodo paskutinį atnaujinimą.</p>`]
    ],
    deletion: `<p>„Debo“ (Android, <code>com.debo.app</code>, valdytojas {controller}) leidžia bet kada ištrinti paskyrą ir su ja susietus duomenis.</p>
      <h2>Kaip ištrinti programėlėje</h2>
      <ol><li>Atidarykite „Debo“ ir prisijunkite.</li><li>Paspauskite profilio ženkliuką viršuje kairėje.</li><li>Pasirinkite „Ištrinti paskyrą“ ir patvirtinkite.</li><li>Jei norite, pažymėkite, kad būtų ištrinti ir telefone saugomi įrašai.</li></ol>
      <h2>Jei programėlės nebeturite</h2>
      <p>Parašykite {contact} iš paskyros el. pašto adreso su tema „Paskyros ištrynimas“. Paskyrą ištrinsime per 30 dienų ir patvirtinsime atsakymu.</p>
      <h2>Kas ištrinama</h2>
      <ul><li>El. paštas, vardas, slaptažodžio maiša, Google paskyros identifikatorius.</li><li>Nemokamų analizių likutis ir narystės būsena.</li><li>Su paskyra susieti „Google Play“ pirkimo žetonai.</li></ul>
      <h2>Kas nėra ištrinama</h2>
      <ul><li>Telefone saugomi įrašai, jei jų nepažymėjote ištrynimui – juos ištrina programėlės ištrynimas.</li><li>Jūsų pačių išsaugotos atsarginės kopijos.</li><li>„Google Play“ mokėjimų įrašai, kuriuos „Google“ saugo pagal savo taisykles ir teisės aktus.</li></ul>
      <p><strong>Svarbu:</strong> paskyros ištrynimas neatšaukia „Google Play“ prenumeratos. Ją atšaukite „Google Play“ → Mokėjimai ir prenumeratos → Prenumeratos.</p>
      <p><a href="{privacyUrl}">Privatumo politika</a></p>`,
    noContact: 'el. paštu, nurodytu „Google Play“ programėlės puslapyje'
  },
  en: {
    privacyTitle: 'Privacy policy',
    deletionTitle: 'Account and data deletion',
    updated: 'Last updated',
    privacy: [
      ['Who we are', `<p>This policy explains how the Debo app (Android, package <code>com.debo.app</code>) handles personal data. Data controller: {controller}. Privacy contact: {contact}.</p>`],
      ['The short version', `<ul>
        <li>Glucose, insulin and food entries and other health data are stored <strong>only on your phone</strong>. We do not receive or store them on our servers.</li>
        <li>Our server stores only account details (email, name) and membership status.</li>
        <li>We do not sell data, use it for advertising, or track you across other apps.</li>
      </ul>`],
      ['Data we process', `<h3>Data stored on your phone</h3>
        <p>Glucose readings (and ketones, if you enter them), insulin doses, food entries, entry tags, favourite meals, sensor, pen or infusion set change dates, supply counts and expiry dates, profile settings (name, age, therapy type, insulin names) and reminder settings. This data stays in the app's storage on your phone and is removed when you delete the app or its data.</p>
        <h3>Account data on our server</h3>
        <p>When you create an account: email address, name and a password hash (passwords are stored only in irreversible hashed form, PBKDF2), or for Google sign-in your Google account identifier, email and name. Also: remaining free analyses, membership expiry and product, Google Play purchase tokens and account creation date. When you request a password reset, a hashed one-time code is kept for 15 minutes.</p>
        <h3>Meal photos</h3>
        <p>When you choose to analyse a meal photo, it is sent to our server and passed to OpenAI to estimate its nutritional content. We do not store photos or results. OpenAI processes requests as a processor under its API terms; requests are not used to train models and may be kept temporarily (up to 30 days) for abuse monitoring.</p>
        <h3>Health Connect</h3>
        <p>If you turn on CGM sync, the app <strong>only reads</strong> blood glucose readings (READ_BLOOD_GLUCOSE permission) that your CGM or meter app writes to Health Connect. These readings are used only within the app on your phone: for the chart, statistics, time in range and the report for your doctor. They are not sent to our servers or third parties. Debo does not write anything to Health Connect. If you turn on “Run in background”, the app, with the READ_HEALTH_DATA_IN_BACKGROUND permission, reads the latest readings about every 15 minutes even when it is closed – only to update the home screen widget; this data also stays on your phone. You can revoke permissions at any time in Health Connect settings.</p>
        <p>Debo's use and transfer of information received from Health Connect adheres to the Health Connect Permissions policy, including the Limited Use requirements.</p>
        <h3>Barcode lookup</h3>
        <p>A scanned product barcode is sent to the public Open Food Facts database to find the product's nutrition values. No information about you is sent with it. Barcodes are read on the phone by Google's code scanner; we have no access to the camera.</p>
        <h3>Voice input</h3>
        <p>Dictating a food name uses your phone's speech recognition service (usually Google). We do not receive audio.</p>
        <h3>Payments</h3>
        <p>Membership payments are handled by Google Play. We do not receive card or bank details – only the purchase token and subscription status needed to activate membership. Google Play notifies us about renewals, cancellations and refunds.</p>
        <h3>Technical logs</h3>
        <p>Our hosting provider Cloudflare briefly processes IP addresses and technical request data for security and abuse limits (for example, too many sign-in attempts).</p>`],
      ['Purposes and legal bases', `<ul>
        <li>Account, membership and payment verification – performance of a contract (GDPR Art. 6(1)(b)).</li>
        <li>Meal photo analysis and reading Health Connect data – your consent through a clear action in the app (GDPR Art. 6(1)(a) and 9(2)(a)). You can withdraw it at any time.</li>
        <li>Security and abuse prevention – legitimate interest (GDPR Art. 6(1)(f)).</li>
      </ul>`],
      ['Who receives data', `<ul>
        <li>Cloudflare, Inc. – server and database hosting.</li>
        <li>OpenAI – only for meal photos you choose to analyse.</li>
        <li>Google – Google sign-in, Google Play payments, speech recognition, code scanner, Health Connect.</li>
        <li>Open Food Facts – barcode only.</li>
        <li>Email delivery provider (Brevo or Resend) – only your email address and the password reset code, when you request one.</li>
      </ul>
      <p>Some providers may process data outside the EU (for example, in the USA). In that case EU Standard Contractual Clauses or the EU–US Data Privacy Framework apply.</p>`],
      ['How long we keep data', `<p>Account data is kept while the account is active. When you delete your account, the account record and linked purchase records are deleted from our database immediately. Data on your phone stays under your control until you delete it in the app or uninstall the app. Google keeps Google Play payment records under its own rules.</p>`],
      ['Your rights', `<p>You have the right to access, correct and delete your data, restrict or object to processing, receive your data in a portable format and withdraw consent. You can export the data on your phone yourself (Statistics → Backup). For other requests contact {contact}. You can also lodge a complaint with the State Data Protection Inspectorate of Lithuania (<a href="https://vdai.lrv.lt">vdai.lrv.lt</a>) or your local supervisory authority.</p>`],
      ['Account deletion', `<p>You can delete your account in the app: Profile → Delete account. More details: <a href="{deletionUrl}">account deletion page</a>.</p>`],
      ['Children', `<p>The app is intended for people aged 16 and over. Younger people may use it only with the consent and supervision of a parent or guardian.</p>`],
      ['Medical notice', `<p>Debo is a logbook and general information app, not a medical device. It does not calculate insulin doses, interpret your readings or give personalised treatment recommendations. Make treatment decisions together with your doctor.</p>`],
      ['Security', `<p>Data between the app and our server is sent over encrypted HTTPS, passwords are stored only in irreversible hashed form and server access is restricted. On the phone, data is protected by Android app isolation.</p>`],
      ['Changes', `<p>We will announce material changes to this policy in the app. The date at the top shows the latest update.</p>`]
    ],
    deletion: `<p>Debo (Android, <code>com.debo.app</code>, controller {controller}) lets you delete your account and its linked data at any time.</p>
      <h2>Delete in the app</h2>
      <ol><li>Open Debo and sign in.</li><li>Tap your profile badge in the top left.</li><li>Choose “Delete account” and confirm.</li><li>Optionally tick the box to also delete the entries stored on your phone.</li></ol>
      <h2>If you no longer have the app</h2>
      <p>Email {contact} from your account email address with the subject “Account deletion”. We will delete the account within 30 days and confirm by reply.</p>
      <h2>What is deleted</h2>
      <ul><li>Email, name, password hash and Google account identifier.</li><li>Remaining free analyses and membership status.</li><li>Google Play purchase tokens linked to the account.</li></ul>
      <h2>What is not deleted</h2>
      <ul><li>Entries stored on your phone unless you chose to delete them – uninstalling the app removes them.</li><li>Backup files you saved yourself.</li><li>Google Play payment records, which Google keeps under its own rules and the law.</li></ul>
      <p><strong>Important:</strong> deleting your account does not cancel a Google Play subscription. Cancel it in Google Play → Payments &amp; subscriptions → Subscriptions.</p>
      <p><a href="{privacyUrl}">Privacy policy</a></p>`,
    noContact: 'the email address listed on the app’s Google Play page'
  },
  lv: {
    privacyTitle: 'Privātuma politika',
    deletionTitle: 'Konta un datu dzēšana',
    updated: 'Atjaunināts',
    privacy: [
      ['Kas mēs esam', `<p>Šī politika skaidro, kā lietotne Debo (Android, pakotne <code>com.debo.app</code>) apstrādā personas datus. Datu pārzinis: {controller}. Saziņa privātuma jautājumos: {contact}.</p>`],
      ['Īsumā', `<ul>
        <li>Glikozes, insulīna un ēdiena ieraksti un citi veselības dati tiek glabāti <strong>tikai jūsu tālrunī</strong>. Mēs tos nesaņemam un neglabājam savos serveros.</li>
        <li>Mūsu serverī tiek glabāta tikai konta informācija (e-pasts, vārds) un abonementa statuss.</li>
        <li>Mēs nepārdodam datus, neizmantojam tos reklāmai un neizsekojam jūs citās lietotnēs.</li>
      </ul>`],
      ['Kādus datus apstrādājam', `<h3>Tālrunī glabātie dati</h3>
        <p>Glikozes rādījumi (un ketoni, ja tos ievadāt), insulīna devas, ēdiena ieraksti, ierakstu atzīmes, iecienītās maltītes, sensora, pildspalvas vai infūzijas komplekta maiņas datumi, krājumu daudzumi un derīguma termiņi, profila iestatījumi (vārds, vecums, ārstēšanas veids, insulīnu nosaukumi) un atgādinājumu iestatījumi. Šie dati paliek lietotnes krātuvē jūsu tālrunī un tiek dzēsti, dzēšot lietotni vai tās datus.</p>
        <h3>Konta dati mūsu serverī</h3>
        <p>Veidojot kontu: e-pasta adrese, vārds un paroles jaucējvērtība (paroles tiek glabātas tikai neatgriezeniski šifrētā veidā, PBKDF2) vai, piesakoties ar Google, Google konta identifikators, e-pasts un vārds. Kā arī: atlikušās bezmaksas analīzes, abonementa derīguma termiņš un produkts, Google Play pirkumu marķieri un konta izveides datums. Pieprasot paroles atjaunošanu, šifrēta vienreizējā koda jaucējvērtība tiek glabāta 15 minūtes.</p>
        <h3>Maltīšu foto</h3>
        <p>Ja izvēlaties analizēt maltītes foto, tas tiek nosūtīts uz mūsu serveri un nodots OpenAI uzturvērtības aplēsei. Mēs foto un rezultātus neglabājam. OpenAI pieprasījumus apstrādā kā apstrādātājs saskaņā ar saviem API noteikumiem; pieprasījumi netiek izmantoti modeļu apmācībai un var tikt īslaicīgi (līdz 30 dienām) glabāti ļaunprātīgas izmantošanas uzraudzībai.</p>
        <h3>Health Connect</h3>
        <p>Ja ieslēdzat CGM sinhronizāciju, lietotne <strong>tikai nolasa</strong> asins glikozes rādījumus (atļauja READ_BLOOD_GLUCOSE), ko Health Connect ieraksta jūsu CGM vai glikometra lietotne. Šie rādījumi tiek izmantoti tikai lietotnē tālrunī: grafikam, statistikai, laikam mērķa diapazonā un atskaitei ārstam. Tie netiek sūtīti uz mūsu vai trešo personu serveriem. Debo neko neieraksta Health Connect. Ja ieslēdzat „Darbība fonā“, lietotne ar atļauju READ_HEALTH_DATA_IN_BACKGROUND aptuveni ik pēc 15 minūtēm nolasa jaunākos rādījumus arī tad, kad tā ir aizvērta – tikai sākuma ekrāna logrīka atjaunināšanai; arī šie dati paliek tālrunī. Atļaujas varat jebkurā laikā atsaukt Health Connect iestatījumos.</p>
        <p>Debo veiktā no Health Connect saņemtās informācijas izmantošana un nodošana atbilst Health Connect atļauju politikai, tostarp ierobežotas izmantošanas (Limited Use) prasībām.</p>
        <h3>Svītrkodu meklēšana</h3>
        <p>Noskenētais produkta svītrkods tiek nosūtīts uz publisko Open Food Facts datubāzi, lai atrastu produkta uzturvērtību. Kopā ar to netiek sūtīta nekāda informācija par jums. Svītrkodu tālrunī nolasa Google kodu skeneris; mums nav piekļuves kamerai.</p>
        <h3>Balss ievade</h3>
        <p>Diktējot ēdiena nosaukumu, tiek izmantots tālruņa runas atpazīšanas pakalpojums (parasti Google). Mēs nesaņemam audio.</p>
        <h3>Maksājumi</h3>
        <p>Abonementa maksājumus apstrādā Google Play. Mēs nesaņemam kartes vai bankas datus – tikai pirkuma marķieri un abonementa statusu, kas vajadzīgs abonementa aktivizēšanai. Google Play mūs informē par atjaunošanu, atcelšanu un naudas atmaksu.</p>
        <h3>Tehniskie žurnāli</h3>
        <p>Mūsu mitināšanas pakalpojumu sniedzējs Cloudflare īslaicīgi apstrādā IP adreses un pieprasījumu tehniskos datus drošības un ļaunprātīgas izmantošanas ierobežošanas nolūkā (piemēram, pārāk daudz pieteikšanās mēģinājumu).</p>`],
      ['Mērķi un tiesiskais pamats', `<ul>
        <li>Konts, abonements un maksājumu pārbaude – līguma izpilde (VDAR 6. panta 1. punkta b) apakšpunkts).</li>
        <li>Maltīšu foto analīze un Health Connect datu nolasīšana – jūsu piekrišana, ko izsakāt ar skaidru darbību lietotnē (VDAR 6. panta 1. punkta a) apakšpunkts un 9. panta 2. punkta a) apakšpunkts). Piekrišanu varat atsaukt jebkurā laikā.</li>
        <li>Drošība un ļaunprātīgas izmantošanas novēršana – leģitīmās intereses (VDAR 6. panta 1. punkta f) apakšpunkts).</li>
      </ul>`],
      ['Kas saņem datus', `<ul>
        <li>Cloudflare, Inc. – servera un datubāzes mitināšana.</li>
        <li>OpenAI – tikai jūsu izvēlēto maltīšu foto analīzei.</li>
        <li>Google – pieteikšanās ar Google, Google Play maksājumi, runas atpazīšana, kodu skeneris, Health Connect.</li>
        <li>Open Food Facts – tikai svītrkods.</li>
        <li>E-pasta piegādes pakalpojums (Brevo vai Resend) – tikai jūsu e-pasta adrese un paroles atjaunošanas kods, kad to pieprasāt.</li>
      </ul>
      <p>Daži pakalpojumu sniedzēji var apstrādāt datus ārpus ES (piemēram, ASV). Šādā gadījumā tiek piemērotas ES standartlīguma klauzulas vai ES–ASV datu privātuma regulējums.</p>`],
      ['Cik ilgi glabājam datus', `<p>Konta dati tiek glabāti, kamēr konts ir aktīvs. Dzēšot kontu, konta ieraksts un saistītie pirkumu ieraksti no mūsu datubāzes tiek dzēsti nekavējoties. Tālrunī glabātie dati paliek jūsu kontrolē, līdz tos dzēšat lietotnē vai atinstalējat lietotni. Google Play maksājumu ierakstus Google glabā saskaņā ar saviem noteikumiem.</p>`],
      ['Jūsu tiesības', `<p>Jums ir tiesības piekļūt saviem datiem, tos labot un dzēst, ierobežot apstrādi vai iebilst pret to, saņemt datus pārnesamā formātā un atsaukt piekrišanu. Tālrunī glabātos datus varat eksportēt paši (Statistika → Rezerves kopija). Citos jautājumos rakstiet {contact}. Varat arī iesniegt sūdzību Lietuvas Valsts datu aizsardzības inspekcijai (<a href="https://vdai.lrv.lt">vdai.lrv.lt</a>) vai savas valsts uzraudzības iestādei (Latvijā – Datu valsts inspekcijai, <a href="https://www.dvi.gov.lv">dvi.gov.lv</a>).</p>`],
      ['Konta dzēšana', `<p>Kontu varat dzēst lietotnē: Profils → Dzēst kontu. Vairāk informācijas: <a href="{deletionUrl}">konta dzēšanas lapa</a>.</p>`],
      ['Bērni', `<p>Lietotne paredzēta personām no 16 gadu vecuma. Jaunākas personas to drīkst lietot tikai ar vecāku vai aizbildņu piekrišanu un uzraudzību.</p>`],
      ['Medicīnisks paziņojums', `<p>Debo ir dienasgrāmatas un vispārīgas informācijas lietotne, nevis medicīniska ierīce. Tā neaprēķina insulīna devas, neinterpretē jūsu rādījumus un nesniedz individuālus ārstēšanas ieteikumus. Ārstēšanas lēmumus pieņemiet kopā ar savu ārstu.</p>`],
      ['Drošība', `<p>Dati starp lietotni un mūsu serveri tiek pārsūtīti, izmantojot šifrētu HTTPS savienojumu, paroles tiek glabātas tikai neatgriezeniski šifrētā veidā, un piekļuve serverim ir ierobežota. Tālrunī datus aizsargā Android lietotņu izolācija.</p>`],
      ['Izmaiņas', `<p>Par būtiskām šīs politikas izmaiņām paziņosim lietotnē. Datums augšpusē norāda pēdējo atjauninājumu.</p>`]
    ],
    deletion: `<p>Debo (Android, <code>com.debo.app</code>, pārzinis {controller}) ļauj jebkurā laikā dzēst savu kontu un ar to saistītos datus.</p>
      <h2>Dzēšana lietotnē</h2>
      <ol><li>Atveriet Debo un piesakieties.</li><li>Pieskarieties profila ikonai augšējā kreisajā stūrī.</li><li>Izvēlieties „Dzēst kontu“ un apstipriniet.</li><li>Ja vēlaties, atzīmējiet, lai tiktu dzēsti arī tālrunī glabātie ieraksti.</li></ol>
      <h2>Ja jums vairs nav lietotnes</h2>
      <p>Rakstiet uz {contact} no sava konta e-pasta adreses ar tēmu „Konta dzēšana“. Kontu dzēsīsim 30 dienu laikā un apstiprināsim to atbildē.</p>
      <h2>Kas tiek dzēsts</h2>
      <ul><li>E-pasts, vārds, paroles jaucējvērtība un Google konta identifikators.</li><li>Atlikušās bezmaksas analīzes un abonementa statuss.</li><li>Ar kontu saistītie Google Play pirkumu marķieri.</li></ul>
      <h2>Kas netiek dzēsts</h2>
      <ul><li>Tālrunī glabātie ieraksti, ja neizvēlējāties tos dzēst – tos dzēš lietotnes atinstalēšana.</li><li>Jūsu pašu saglabātās rezerves kopijas.</li><li>Google Play maksājumu ieraksti, ko Google glabā saskaņā ar saviem noteikumiem un likumu.</li></ul>
      <p><strong>Svarīgi:</strong> konta dzēšana neatceļ Google Play abonementu. Atceliet to Google Play → Maksājumi un abonementi → Abonementi.</p>
      <p><a href="{privacyUrl}">Privātuma politika</a></p>`,
    noContact: 'e-pasta adresi, kas norādīta lietotnes Google Play lapā'
  },
  pl: {
    privacyTitle: 'Polityka prywatności',
    deletionTitle: 'Usuwanie konta i danych',
    updated: 'Ostatnia aktualizacja',
    privacy: [
      ['Kim jesteśmy', `<p>Niniejsza polityka wyjaśnia, jak aplikacja Debo (Android, pakiet <code>com.debo.app</code>) przetwarza dane osobowe. Administrator danych: {controller}. Kontakt w sprawach prywatności: {contact}.</p>`],
      ['W skrócie', `<ul>
        <li>Wpisy dotyczące glukozy, insuliny i jedzenia oraz inne dane zdrowotne są przechowywane <strong>wyłącznie na Twoim telefonie</strong>. Nie otrzymujemy ich i nie przechowujemy na naszych serwerach.</li>
        <li>Nasz serwer przechowuje tylko dane konta (e-mail, imię) i status subskrypcji.</li>
        <li>Nie sprzedajemy danych, nie wykorzystujemy ich do reklam i nie śledzimy Cię w innych aplikacjach.</li>
      </ul>`],
      ['Jakie dane przetwarzamy', `<h3>Dane przechowywane na telefonie</h3>
        <p>Pomiary glukozy (oraz ketonów, jeśli je wpisujesz), dawki insuliny, wpisy jedzenia, tagi wpisów, ulubione posiłki, daty wymiany sensora, pena lub zestawu infuzyjnego, stany i daty ważności zapasów, ustawienia profilu (imię, wiek, sposób leczenia, nazwy insulin) oraz ustawienia przypomnień. Dane te pozostają w pamięci aplikacji na telefonie i są usuwane po usunięciu aplikacji lub jej danych.</p>
        <h3>Dane konta na naszym serwerze</h3>
        <p>Przy zakładaniu konta: adres e-mail, imię i skrót hasła (hasła są przechowywane wyłącznie w nieodwracalnej postaci, PBKDF2) albo – przy logowaniu przez Google – identyfikator konta Google, e-mail i imię. Ponadto: liczba pozostałych darmowych analiz, data ważności i rodzaj subskrypcji, tokeny zakupów Google Play oraz data utworzenia konta. Po zgłoszeniu resetu hasła przez 15 minut przechowujemy skrót jednorazowego kodu.</p>
        <h3>Zdjęcia posiłków</h3>
        <p>Jeśli zdecydujesz się przeanalizować zdjęcie posiłku, jest ono wysyłane na nasz serwer i przekazywane do OpenAI w celu oszacowania wartości odżywczych. Nie przechowujemy zdjęć ani wyników. OpenAI przetwarza zapytania jako podmiot przetwarzający zgodnie ze swoimi warunkami API; zapytania nie są używane do trenowania modeli i mogą być tymczasowo (do 30 dni) przechowywane w celu wykrywania nadużyć.</p>
        <h3>Health Connect</h3>
        <p>Jeśli włączysz synchronizację CGM, aplikacja <strong>wyłącznie odczytuje</strong> pomiary glukozy we krwi (uprawnienie READ_BLOOD_GLUCOSE), które Twoja aplikacja CGM lub glukometru zapisuje w Health Connect. Pomiary te są używane tylko w aplikacji na telefonie: do wykresu, statystyk, czasu w zakresie i raportu dla lekarza. Nie są wysyłane na nasze serwery ani do podmiotów trzecich. Debo niczego nie zapisuje w Health Connect. Jeśli włączysz „Działanie w tle”, aplikacja z uprawnieniem READ_HEALTH_DATA_IN_BACKGROUND mniej więcej co 15 minut odczytuje najnowsze pomiary także po zamknięciu – wyłącznie w celu odświeżenia widżetu na ekranie głównym; również te dane pozostają na telefonie. Uprawnienia możesz w każdej chwili cofnąć w ustawieniach Health Connect.</p>
        <p>Sposób, w jaki Debo wykorzystuje i przekazuje informacje otrzymane z Health Connect, jest zgodny z zasadami dotyczącymi uprawnień Health Connect, w tym z wymaganiami ograniczonego użycia (Limited Use).</p>
        <h3>Wyszukiwanie po kodzie kreskowym</h3>
        <p>Zeskanowany kod kreskowy produktu jest wysyłany do publicznej bazy Open Food Facts w celu znalezienia wartości odżywczych. Razem z nim nie są wysyłane żadne informacje o Tobie. Kod kreskowy odczytuje na telefonie skaner kodów Google; nie mamy dostępu do aparatu.</p>
        <h3>Wpis głosowy</h3>
        <p>Dyktowanie nazwy jedzenia korzysta z usługi rozpoznawania mowy w telefonie (zwykle Google). Nie otrzymujemy nagrań.</p>
        <h3>Płatności</h3>
        <p>Płatności za subskrypcję obsługuje Google Play. Nie otrzymujemy danych karty ani konta bankowego – tylko token zakupu i status subskrypcji potrzebne do jej aktywacji. Google Play informuje nas o odnowieniach, anulowaniach i zwrotach.</p>
        <h3>Logi techniczne</h3>
        <p>Nasz dostawca hostingu Cloudflare krótko przetwarza adresy IP i techniczne dane zapytań w celach bezpieczeństwa i ograniczania nadużyć (np. zbyt wielu prób logowania).</p>`],
      ['Cele i podstawy prawne', `<ul>
        <li>Konto, subskrypcja i weryfikacja płatności – wykonanie umowy (art. 6 ust. 1 lit. b RODO).</li>
        <li>Analiza zdjęć posiłków i odczyt danych Health Connect – Twoja zgoda wyrażona wyraźnym działaniem w aplikacji (art. 6 ust. 1 lit. a i art. 9 ust. 2 lit. a RODO). Możesz ją w każdej chwili wycofać.</li>
        <li>Bezpieczeństwo i zapobieganie nadużyciom – prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO).</li>
      </ul>`],
      ['Odbiorcy danych', `<ul>
        <li>Cloudflare, Inc. – hosting serwera i bazy danych.</li>
        <li>OpenAI – wyłącznie zdjęcia posiłków, które zdecydujesz się przeanalizować.</li>
        <li>Google – logowanie przez Google, płatności Google Play, rozpoznawanie mowy, skaner kodów, Health Connect.</li>
        <li>Open Food Facts – wyłącznie kod kreskowy.</li>
        <li>Dostawca wysyłki e-maili (Brevo lub Resend) – wyłącznie Twój adres e-mail i kod resetu hasła, gdy o niego poprosisz.</li>
      </ul>
      <p>Niektórzy dostawcy mogą przetwarzać dane poza UE (np. w USA). W takim przypadku stosuje się standardowe klauzule umowne UE lub ramy ochrony danych UE–USA.</p>`],
      ['Jak długo przechowujemy dane', `<p>Dane konta są przechowywane, dopóki konto jest aktywne. Po usunięciu konta rekord konta i powiązane zakupy są natychmiast usuwane z naszej bazy danych. Dane na telefonie pozostają pod Twoją kontrolą, dopóki nie usuniesz ich w aplikacji lub nie odinstalujesz aplikacji. Zapisy płatności Google Play Google przechowuje na własnych zasadach.</p>`],
      ['Twoje prawa', `<p>Masz prawo dostępu do swoich danych, ich sprostowania i usunięcia, ograniczenia przetwarzania lub sprzeciwu wobec niego, otrzymania danych w formacie przenośnym oraz wycofania zgody. Dane z telefonu możesz wyeksportować samodzielnie (Statystyki → Kopia zapasowa). W innych sprawach napisz na {contact}. Możesz też złożyć skargę do litewskiego Państwowego Inspektoratu Ochrony Danych (<a href="https://vdai.lrv.lt">vdai.lrv.lt</a>) lub do organu nadzorczego w swoim kraju (w Polsce – Prezesa UODO, <a href="https://uodo.gov.pl">uodo.gov.pl</a>).</p>`],
      ['Usuwanie konta', `<p>Konto możesz usunąć w aplikacji: Profil → Usuń konto. Więcej informacji: <a href="{deletionUrl}">strona usuwania konta</a>.</p>`],
      ['Dzieci', `<p>Aplikacja jest przeznaczona dla osób w wieku 16 lat i starszych. Osoby młodsze mogą z niej korzystać wyłącznie za zgodą i pod nadzorem rodzica lub opiekuna.</p>`],
      ['Informacja medyczna', `<p>Debo to aplikacja-dziennik z ogólnymi informacjami, a nie wyrób medyczny. Nie oblicza dawek insuliny, nie interpretuje Twoich pomiarów i nie udziela indywidualnych zaleceń terapeutycznych. Decyzje o leczeniu podejmuj wspólnie z lekarzem.</p>`],
      ['Bezpieczeństwo', `<p>Dane między aplikacją a naszym serwerem są przesyłane szyfrowanym połączeniem HTTPS, hasła są przechowywane wyłącznie w nieodwracalnej postaci, a dostęp do serwera jest ograniczony. Na telefonie dane chroni izolacja aplikacji w systemie Android.</p>`],
      ['Zmiany', `<p>O istotnych zmianach tej polityki poinformujemy w aplikacji. Data u góry wskazuje ostatnią aktualizację.</p>`]
    ],
    deletion: `<p>Debo (Android, <code>com.debo.app</code>, administrator {controller}) pozwala w każdej chwili usunąć konto i powiązane z nim dane.</p>
      <h2>Usuwanie w aplikacji</h2>
      <ol><li>Otwórz Debo i zaloguj się.</li><li>Dotknij ikony profilu w lewym górnym rogu.</li><li>Wybierz „Usuń konto” i potwierdź.</li><li>Opcjonalnie zaznacz, aby usunąć także wpisy przechowywane na telefonie.</li></ol>
      <h2>Jeśli nie masz już aplikacji</h2>
      <p>Napisz na {contact} z adresu e-mail przypisanego do konta, w temacie „Usunięcie konta”. Usuniemy konto w ciągu 30 dni i potwierdzimy to w odpowiedzi.</p>
      <h2>Co zostaje usunięte</h2>
      <ul><li>E-mail, imię, skrót hasła i identyfikator konta Google.</li><li>Pozostałe darmowe analizy i status subskrypcji.</li><li>Tokeny zakupów Google Play powiązane z kontem.</li></ul>
      <h2>Co nie zostaje usunięte</h2>
      <ul><li>Wpisy na telefonie, jeśli nie zaznaczysz ich usunięcia – usuwa je odinstalowanie aplikacji.</li><li>Kopie zapasowe, które zapisałeś samodzielnie.</li><li>Zapisy płatności Google Play, które Google przechowuje na własnych zasadach i zgodnie z prawem.</li></ul>
      <p><strong>Ważne:</strong> usunięcie konta nie anuluje subskrypcji Google Play. Anuluj ją w Google Play → Płatności i subskrypcje → Subskrypcje.</p>
      <p><a href="{privacyUrl}">Polityka prywatności</a></p>`,
    noContact: 'adres e-mail podany na stronie aplikacji w Google Play'
  },
  de: {
    privacyTitle: 'Datenschutzerklärung',
    deletionTitle: 'Löschung von Konto und Daten',
    updated: 'Zuletzt aktualisiert',
    privacy: [
      ['Wer wir sind', `<p>Diese Erklärung beschreibt, wie die App Debo (Android, Paket <code>com.debo.app</code>) personenbezogene Daten verarbeitet. Verantwortlicher: {controller}. Kontakt für Datenschutzfragen: {contact}.</p>`],
      ['Das Wichtigste in Kürze', `<ul>
        <li>Glukose-, Insulin- und Essenseinträge sowie andere Gesundheitsdaten werden <strong>nur auf Ihrem Telefon</strong> gespeichert. Wir erhalten sie nicht und speichern sie nicht auf unseren Servern.</li>
        <li>Unser Server speichert nur Kontodaten (E-Mail, Name) und den Status der Mitgliedschaft.</li>
        <li>Wir verkaufen keine Daten, nutzen sie nicht für Werbung und verfolgen Sie nicht über andere Apps hinweg.</li>
      </ul>`],
      ['Welche Daten wir verarbeiten', `<h3>Auf Ihrem Telefon gespeicherte Daten</h3>
        <p>Glukosewerte (und Ketone, falls Sie sie eintragen), Insulindosen, Essenseinträge, Tags zu Einträgen, Lieblingsmahlzeiten, Wechseldaten von Sensor, Pen oder Infusionsset, Vorratsmengen und Haltbarkeitsdaten, Profileinstellungen (Name, Alter, Therapieform, Insulinnamen) und Erinnerungseinstellungen. Diese Daten bleiben im Speicher der App auf Ihrem Telefon und werden gelöscht, wenn Sie die App oder ihre Daten löschen.</p>
        <h3>Kontodaten auf unserem Server</h3>
        <p>Bei der Kontoerstellung: E-Mail-Adresse, Name und ein Passwort-Hash (Passwörter werden nur in nicht umkehrbarer Form gespeichert, PBKDF2) oder bei der Google-Anmeldung Ihre Google-Konto-ID, E-Mail und Name. Außerdem: verbleibende kostenlose Analysen, Ablaufdatum und Produkt der Mitgliedschaft, Google-Play-Kauftokens und das Erstellungsdatum des Kontos. Wenn Sie ein neues Passwort anfordern, wird ein Hash des Einmalcodes 15 Minuten lang gespeichert.</p>
        <h3>Fotos von Mahlzeiten</h3>
        <p>Wenn Sie ein Foto einer Mahlzeit analysieren lassen, wird es an unseren Server gesendet und an OpenAI weitergegeben, um die Nährwerte zu schätzen. Wir speichern weder Fotos noch Ergebnisse. OpenAI verarbeitet die Anfragen als Auftragsverarbeiter gemäß seinen API-Bedingungen; Anfragen werden nicht zum Training von Modellen verwendet und können vorübergehend (bis zu 30 Tage) zur Missbrauchsüberwachung gespeichert werden.</p>
        <h3>Health Connect</h3>
        <p>Wenn Sie die CGM-Synchronisierung aktivieren, <strong>liest</strong> die App ausschließlich Blutzuckerwerte (Berechtigung READ_BLOOD_GLUCOSE), die Ihre CGM- oder Messgerät-App in Health Connect speichert. Diese Werte werden nur in der App auf Ihrem Telefon verwendet: für den Verlauf, die Statistik, die Zeit im Zielbereich und den Bericht für die Arztpraxis. Sie werden nicht an unsere Server oder Dritte gesendet. Debo schreibt nichts in Health Connect. Wenn Sie „Im Hintergrund ausführen“ aktivieren, liest die App mit der Berechtigung READ_HEALTH_DATA_IN_BACKGROUND etwa alle 15 Minuten auch bei geschlossener App die neuesten Werte – nur um das Widget auf dem Startbildschirm zu aktualisieren; auch diese Daten bleiben auf Ihrem Telefon. Berechtigungen können Sie jederzeit in den Health-Connect-Einstellungen widerrufen.</p>
        <p>Die Nutzung und Weitergabe von Informationen aus Health Connect durch Debo entspricht der Health-Connect-Berechtigungsrichtlinie einschließlich der Anforderungen zur eingeschränkten Nutzung (Limited Use).</p>
        <h3>Barcode-Suche</h3>
        <p>Ein gescannter Produkt-Barcode wird an die öffentliche Datenbank Open Food Facts gesendet, um die Nährwerte des Produkts zu finden. Dabei werden keine Informationen über Sie übermittelt. Der Barcode wird auf dem Telefon vom Google-Codescanner gelesen; wir haben keinen Zugriff auf die Kamera.</p>
        <h3>Spracheingabe</h3>
        <p>Beim Diktieren eines Lebensmittels wird die Spracherkennung Ihres Telefons verwendet (meist Google). Wir erhalten keine Audioaufnahmen.</p>
        <h3>Zahlungen</h3>
        <p>Zahlungen für die Mitgliedschaft wickelt Google Play ab. Wir erhalten keine Karten- oder Bankdaten – nur das Kauftoken und den Abo-Status, die zur Aktivierung der Mitgliedschaft nötig sind. Google Play informiert uns über Verlängerungen, Kündigungen und Erstattungen.</p>
        <h3>Technische Protokolle</h3>
        <p>Unser Hosting-Anbieter Cloudflare verarbeitet kurzzeitig IP-Adressen und technische Anfragedaten zur Sicherheit und zur Begrenzung von Missbrauch (z. B. zu viele Anmeldeversuche).</p>`],
      ['Zwecke und Rechtsgrundlagen', `<ul>
        <li>Konto, Mitgliedschaft und Zahlungsprüfung – Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO).</li>
        <li>Fotoanalyse von Mahlzeiten und Lesen von Health-Connect-Daten – Ihre Einwilligung durch eine eindeutige Handlung in der App (Art. 6 Abs. 1 lit. a und Art. 9 Abs. 2 lit. a DSGVO). Sie können sie jederzeit widerrufen.</li>
        <li>Sicherheit und Missbrauchsverhinderung – berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO).</li>
      </ul>`],
      ['Empfänger der Daten', `<ul>
        <li>Cloudflare, Inc. – Hosting von Server und Datenbank.</li>
        <li>OpenAI – nur für Fotos von Mahlzeiten, die Sie analysieren lassen.</li>
        <li>Google – Google-Anmeldung, Google-Play-Zahlungen, Spracherkennung, Codescanner, Health Connect.</li>
        <li>Open Food Facts – nur der Barcode.</li>
        <li>E-Mail-Versanddienst (Brevo oder Resend) – nur Ihre E-Mail-Adresse und der Code zum Zurücksetzen des Passworts, wenn Sie ihn anfordern.</li>
      </ul>
      <p>Einige Anbieter können Daten außerhalb der EU verarbeiten (z. B. in den USA). In diesem Fall gelten die EU-Standardvertragsklauseln oder das EU-US Data Privacy Framework.</p>`],
      ['Speicherdauer', `<p>Kontodaten werden gespeichert, solange das Konto aktiv ist. Wenn Sie Ihr Konto löschen, werden der Kontodatensatz und verknüpfte Kaufdatensätze sofort aus unserer Datenbank gelöscht. Daten auf Ihrem Telefon bleiben unter Ihrer Kontrolle, bis Sie sie in der App löschen oder die App deinstallieren. Google speichert Google-Play-Zahlungsdaten nach eigenen Regeln.</p>`],
      ['Ihre Rechte', `<p>Sie haben das Recht auf Auskunft, Berichtigung und Löschung Ihrer Daten, auf Einschränkung der Verarbeitung, auf Widerspruch, auf Datenübertragbarkeit und auf Widerruf Ihrer Einwilligung. Die Daten auf Ihrem Telefon können Sie selbst exportieren (Statistik → Datensicherung). Für andere Anliegen schreiben Sie an {contact}. Sie können sich auch bei der litauischen Datenschutzaufsicht (<a href="https://vdai.lrv.lt">vdai.lrv.lt</a>) oder bei der Aufsichtsbehörde Ihres Landes beschweren.</p>`],
      ['Kontolöschung', `<p>Sie können Ihr Konto in der App löschen: Profil → Konto löschen. Weitere Informationen: <a href="{deletionUrl}">Seite zur Kontolöschung</a>.</p>`],
      ['Kinder', `<p>Die App richtet sich an Personen ab 16 Jahren. Jüngere Personen dürfen sie nur mit Zustimmung und unter Aufsicht eines Elternteils oder Erziehungsberechtigten nutzen.</p>`],
      ['Medizinischer Hinweis', `<p>Debo ist eine Tagebuch- und Informations-App, kein Medizinprodukt. Sie berechnet keine Insulindosen, interpretiert Ihre Werte nicht und gibt keine individuellen Therapieempfehlungen. Treffen Sie Therapieentscheidungen gemeinsam mit Ihrer Ärztin oder Ihrem Arzt.</p>`],
      ['Sicherheit', `<p>Daten zwischen der App und unserem Server werden über verschlüsseltes HTTPS übertragen, Passwörter werden nur in nicht umkehrbarer Form gespeichert und der Serverzugriff ist beschränkt. Auf dem Telefon schützt die App-Isolierung von Android Ihre Daten.</p>`],
      ['Änderungen', `<p>Über wesentliche Änderungen dieser Erklärung informieren wir in der App. Das Datum oben zeigt die letzte Aktualisierung.</p>`]
    ],
    deletion: `<p>Debo (Android, <code>com.debo.app</code>, Verantwortlicher {controller}) ermöglicht es Ihnen, Ihr Konto und die verknüpften Daten jederzeit zu löschen.</p>
      <h2>Löschen in der App</h2>
      <ol><li>Öffnen Sie Debo und melden Sie sich an.</li><li>Tippen Sie oben links auf Ihr Profilsymbol.</li><li>Wählen Sie „Konto löschen“ und bestätigen Sie.</li><li>Optional können Sie auch die auf dem Telefon gespeicherten Einträge löschen lassen.</li></ol>
      <h2>Wenn Sie die App nicht mehr haben</h2>
      <p>Schreiben Sie von der E-Mail-Adresse Ihres Kontos an {contact} mit dem Betreff „Kontolöschung“. Wir löschen das Konto innerhalb von 30 Tagen und bestätigen dies per Antwort.</p>
      <h2>Was gelöscht wird</h2>
      <ul><li>E-Mail, Name, Passwort-Hash und Google-Konto-ID.</li><li>Verbleibende kostenlose Analysen und Mitgliedschaftsstatus.</li><li>Mit dem Konto verknüpfte Google-Play-Kauftokens.</li></ul>
      <h2>Was nicht gelöscht wird</h2>
      <ul><li>Einträge auf Ihrem Telefon, sofern Sie deren Löschung nicht gewählt haben – sie werden beim Deinstallieren der App entfernt.</li><li>Datensicherungen, die Sie selbst gespeichert haben.</li><li>Google-Play-Zahlungsdaten, die Google nach eigenen Regeln und gesetzlichen Vorgaben aufbewahrt.</li></ul>
      <p><strong>Wichtig:</strong> Das Löschen des Kontos kündigt kein Google-Play-Abo. Kündigen Sie es in Google Play → Zahlungen und Abos → Abos.</p>
      <p><a href="{privacyUrl}">Datenschutzerklärung</a></p>`,
    noContact: 'die auf der Google-Play-Seite der App angegebene E-Mail-Adresse'
  }
};

const STYLE = `
:root{--bg:#F5F7F4;--card:#FFFFFF;--ink:#1F2D2B;--muted:#5C6C68;--line:#E1E8E3;--accent:#2E7466}
@media (prefers-color-scheme:dark){:root{--bg:#141A19;--card:#1C2422;--ink:#E8EFEC;--muted:#A6B4AF;--line:#2C3835;--accent:#7CCBB4}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 "Nunito","Segoe UI",Roboto,-apple-system,sans-serif}
main{max-width:760px;margin:0 auto;padding:28px 16px 56px}
header{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:8px}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:.14em;color:var(--accent)}
.brand b{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:var(--accent);color:var(--bg);letter-spacing:0}
nav{display:flex;flex-wrap:wrap;gap:6px}
.lang{color:var(--accent);font-weight:700;font-size:14px;text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:5px 12px;background:var(--card)}
.lang[aria-current]{background:var(--accent);border-color:var(--accent);color:var(--bg)}
h1{margin:18px 0 4px;font-size:30px;line-height:1.2}
.updated{margin:0 0 20px;color:var(--muted);font-size:14px}
section,.card{margin:0 0 14px;padding:18px 20px;border:1px solid var(--line);border-radius:18px;background:var(--card)}
h2{margin:0 0 8px;font-size:19px;color:var(--accent)}
.card h2{margin-top:16px}.card h2:first-of-type{margin-top:8px}
h3{margin:16px 0 4px;font-size:16px}
p{margin:0 0 10px}ul,ol{margin:0 0 10px;padding-left:22px}li{margin:4px 0}
a{color:var(--accent)}code{font-size:.9em}
`;

function fill(text, values) {
  return text.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function page(lang, path, title, body) {
  const t = TEXT[lang];
  const links = LANGUAGES.map(code => `<a class="lang" href="${path}?lang=${code}" hreflang="${code}" lang="${code}"${code === lang ? ' aria-current="page"' : ''}>${LANGUAGE_NAMES[code]}</a>`).join('');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} – Debo</title><meta name="robots" content="index,follow"><style>${STYLE}</style></head><body><main><header><span class="brand"><b>D</b>DEBO</span><nav>${links}</nav></header><h1>${title}</h1><p class="updated">${t.updated}: ${UPDATED}</p>${body}</main></body></html>`;
}

export function legalPage(url, env) {
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const kind = path === '/privacy' ? 'privacy' : path === '/account-deletion' ? 'deletion' : null;
  if (!kind) return null;
  const requested = url.searchParams.get('lang');
  const lang = LANGUAGES.includes(requested) ? requested : 'lt';
  const t = TEXT[lang];
  const email = String(env.CONTACT_EMAIL || '').trim();
  const values = {
    controller: escapeHtml(String(env.DEVELOPER_NAME || 'Debo').trim()),
    contact: email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : t.noContact,
    privacyUrl: `/privacy?lang=${lang}`,
    deletionUrl: `/account-deletion?lang=${lang}`
  };
  const html = kind === 'privacy'
    ? page(lang, path, t.privacyTitle, t.privacy.map(([heading, body]) => `<section><h2>${heading}</h2>${fill(body, values)}</section>`).join(''))
    : page(lang, path, t.deletionTitle, `<div class="card">${fill(t.deletion, values)}</div>`);
  return new Response(html, { headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; base-uri 'none'; form-action 'none'",
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  }});
}
