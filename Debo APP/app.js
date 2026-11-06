/* Windows (dialogs) slide away instead of disappearing at once. close() keeps the dialog on screen
   for the short exit animation; the page already sees it as closed (.open is false) right away. */
(() => {
  const proto = window.HTMLDialogElement?.prototype;
  if (!proto || proto.__deboAnimated) return;
  proto.__deboAnimated = true;
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const nativeClose = proto.close;
  const nativeShowModal = proto.showModal;
  const nativeShow = proto.show;
  const openDesc = Object.getOwnPropertyDescriptor(proto, 'open');
  Object.defineProperty(proto, 'open', {
    configurable: true,
    enumerable: openDesc.enumerable,
    get() {
      return openDesc.get.call(this) && !this.__deboClosing;
    },
    set(value) {
      openDesc.set.call(this, value);
    }
  });
  const finish = dialog => {
    clearTimeout(dialog.__deboCloseTimer);
    dialog.__deboClosing = false;
    dialog.classList.remove('debo-closing');
  };
  proto.close = function (result) {
    if (!openDesc.get.call(this) || this.__deboClosing) return;
    if (reduced()) return nativeClose.call(this, result);
    this.__deboClosing = true;
    this.classList.add('debo-closing');
    this.__deboCloseTimer = setTimeout(() => {
      finish(this);
      nativeClose.call(this, result);
    }, 190);
  };
  // Opening again while it is still sliding away: keep it open
  proto.showModal = function () {
    if (this.__deboClosing) {
      finish(this);
      if (!this.matches(':modal')) {
        nativeClose.call(this);
        return nativeShowModal.call(this);
      }
      return;
    }
    return nativeShowModal.call(this);
  };
  proto.show = function () {
    if (this.__deboClosing) return finish(this);
    return nativeShow.call(this);
  };
  // <form method="dialog"> buttons (Cancel, Save) close through the same animation
  document.addEventListener('submit', e => {
    const form = e.target;
    if (e.defaultPrevented || (form.getAttribute('method') || '').toLowerCase() !== 'dialog') return;
    if ((e.submitter?.getAttribute('formmethod') || 'dialog').toLowerCase() !== 'dialog') return;
    const dialog = form.closest('dialog');
    if (!dialog || reduced()) return;
    e.preventDefault();
    dialog.close(e.submitter?.value ?? '');
  });
})();

const $ = s => document.querySelector(s),
  $$ = s => [...document.querySelectorAll(s)];
// Hidden until the entry logs are loaded from IndexedDB (see the end of this file), so nothing renders empty first
document.documentElement.style.visibility = 'hidden';
setTimeout(() => (document.documentElement.style.visibility = ''), 12000);
const dayStartCache = new Map(),
  hourCache = new Map();

// Storage keys were called oriva-* in early test builds: move them to debo-* once
try {
  Object.keys(localStorage)
    .filter(key => key.startsWith('oriva-'))
    .forEach(key => {
      const renamed = 'debo-' + key.slice(6);
      if (localStorage.getItem(renamed) === null) localStorage.setItem(renamed, localStorage.getItem(key));
      localStorage.removeItem(key);
    });
} catch {}

const DOM = {
  authScreen: $('#auth-screen'),
  authChoice: $('#auth-choice'),
  authForm: $('#auth-form'),
  authName: $('#auth-name'),
  authEmail: $('#auth-email'),
  authPassword: $('#auth-password'),
  authPasswordRepeat: $('#auth-password-repeat'),
  authOpenLogin: $('#auth-open-login'),
  authOpenSignup: $('#auth-open-signup'),
  authBack: $('#auth-back'),
  authFormTitle: $('#auth-form-title'),
  authFormLead: $('#auth-form-lead'),
  authSubmit: $('#auth-submit'),
  continueGuest: $('#continue-guest'),
  authNameField: $('#auth-name-field'),
  authEmailField: $('#auth-email-field'),
  authPasswordField: $('#auth-password-field'),
  authPasswordRepeatField: $('#auth-password-repeat-field'),
  authGuestNote: $('#auth-guest-note'),
  todayLabel: $('#today-label'),
  profileButton: $('#header-profile'),
  settingsButton: $('#header-settings'),
  glucoseCard: $('#glucose-card'),
  glucoseValue: $('#glucose-value'),
  glucoseUnitLabel: $('#glucose-unit-label'),
  glucoseUpdated: $('#glucose-updated'),
  glucoseReadingTime: $('#glucose-reading-time'),
  glucoseRange: $('#glucose-range'),
  glucoseRangeMin: $('#glucose-range-min'),
  glucoseRangeLow: $('#glucose-range-low'),
  glucoseRangeHigh: $('#glucose-range-high'),
  glucoseRangeMax: $('#glucose-range-max'),
  glucoseChartModal: $('#glucose-chart-modal'),
  trendArrow: $('#trend-arrow'),
  trendLabel: $('#trend-label'),
  chartScroll: $('#chart-scroll'),
  chartCanvas: $('#chart-canvas'),
  timelineSvg: $('#timeline-svg'),
  chartTargetZone: $('#chart-target-zone'),
  chartHorizontalGrid: $('#chart-horizontal-grid'),
  chartArea: $('#chart-area'),
  chartLine: $('#chart-line'),
  glucosePoints: $('#glucose-points'),
  insulinMarkers: $('#insulin-markers'),
  timeLabels: $('#time-labels-svg'),
  chartTimezone: $('#chart-timezone'),
  visibleEventsTime: $('#visible-events-time'),
  visibleEventList: $('#visible-event-list'),
  chartTooltip: $('#chart-tooltip'),
  bottomNav: $('#bottom-nav'),
  entryModal: $('#entry-modal'),
  photoModal: $('#photo-analysis-modal'),
  photoCameraInput: $('#meal-camera-input'),
  photoGalleryInput: $('#meal-gallery-input'),
  photoPreview: $('#meal-photo-preview'),
  photoStatus: $('#meal-photo-status'),
  photoResults: $('#meal-photo-results'),
  photoAnalyzeButton: $('#analyze-meal-photo'),
  photoSaveButton: $('#save-photo-meal'),
  profileModal: $('#profile-modal'),
  guideModal: $('#guide-modal'),
  setupModal: $('#setup-modal'),
  guideContent: $('#guide-content'),
  toast: $('#toast'),
  modalKicker: $('#modal-kicker'),
  modalTitle: $('#modal-title'),
  modalDescription: $('#modal-description'),
  amountLabel: $('#amount-label'),
  amountLabelText: $('#amount-label-text'),
  entryAmount: $('#entry-amount'),
  typeLabel: $('#type-label'),
  insulinType: $('#insulin-type'),
  pumpInsulinNote: $('#pump-insulin-note'),
  insulinTimeLabel: $('#insulin-time-label'),
  insulinTime: $('#insulin-time'),
  glucoseTimeLabel: $('#glucose-time-label'),
  glucoseEntryTime: $('#glucose-entry-time'),
  foodLabel: $('#food-label'),
  foodProduct: $('#food-product'),
  foodPortion: $('#food-portion'),
  foodGramsLabel: $('#food-grams-label'),
  foodGrams: $('#food-grams'),
  customFoodFields: $('#custom-food-fields'),
  customFoodName: $('#custom-food-name'),
  customFoodCarbs: $('#custom-food-carbs'),
  customFoodProtein: $('#custom-food-protein'),
  customFoodFat: $('#custom-food-fat'),
  foodModeStatus: $('#food-mode-status'),
  foodBarcodeManual: $('#barcode-manual-entry'),
  foodBarcodeInput: $('#food-barcode-input'),
  carbPreview: $('#carb-preview'),
  foodPreparationNote: $('#food-preparation-note'),
  rapidSelect: $('#rapid-select'),
  longSelect: $('#long-select'),
  longField: $('#long-field'),
  reminderField: $('#reminder-field'),
  reminderTimeWrap: $('#reminder-time-wrap'),
  reminderEnabled: $('#reminder-enabled'),
  reminderTime: $('#reminder-time'),
  accountProfileFields: $('#account-profile-fields'),
  profileAge: $('#profile-age'),
  glucoseReminderEnabled: $('#glucose-reminder-enabled'),
  notificationNote: $('#notification-note'),
  glucoseUnitSelect: $('#glucose-unit-select'),
  settingsLanguage: $('#settings-language'),
  reminderStatus: $('#reminder-status'),
  therapyNote: $('#therapy-note'),
  activeDoseMain: $('#active-dose-main'),
  activeDoseSub: $('#active-dose-sub'),
  noActiveDose: $('#no-active-dose'),
  multiActivity: $('#multi-activity'),
  activeDoseList: $('#active-dose-list'),
  toggleActiveDoses: $('#toggle-active-doses'),
  historyList: $('#history-list'),
  historyDateLabel: $('#history-date-label'),
  historyDateInput: $('#history-date-input'),
  historyPrev: $('#history-prev'),
  historyNext: $('#history-next'),
  profileName: $('#profile-name'),
  profileNameNote: $('#profile-name-note'),
  accountSummary: $('#account-summary'),
  profileAvatar: $('#profile-avatar'),
  profilePhotoInput: $('#profile-photo-input'),
  profileAccountFields: $('#profile-account-fields'),
  profileEmail: $('#profile-email'),
  profilePasswordDetails: $('#profile-password-details'),
  profileCurrentPassword: $('#profile-current-password'),
  profileNewPassword: $('#profile-new-password'),
  profileNewPasswordRepeat: $('#profile-new-password-repeat'),
  profileLogout: $('#profile-logout'),
  profileCreateAccount: $('#profile-create-account'),
  themeSelect: $('#theme-select'),
  converterMmol: $('#conv-mmol'),
  converterMg: $('#conv-mg'),
  converterPresets: $('#conv-presets')
};

// Premium (subscriptions, photo, voice and barcode entry) can be switched off in api-config.js
const PREMIUM = window.DEBO_CONFIG?.premiumEnabled !== false;
document.documentElement.classList.toggle('premium-off', !PREMIUM);
// Without accounts the app is guest-only: one start button, no sign-in, nothing stored on a server
const ACCOUNTS = window.DEBO_CONFIG?.accountsEnabled !== false;
document.documentElement.classList.toggle('accounts-off', !ACCOUNTS);
if (!ACCOUNTS) Object.assign(document.getElementById('continue-guest'), { className: 'primary' }).dataset.i18n = 'introStart';
const LANGUAGES = ['lt', 'en', 'lv', 'pl', 'de'];
const LANGUAGE_NAMES = { lt: 'Lietuvių', en: 'English', lv: 'Latviešu', pl: 'Polski', de: 'Deutsch' };
const LOCALES = { lt: 'lt-LT', en: 'en-GB', lv: 'lv-LV', pl: 'pl-PL', de: 'de-DE' };
// First launch follows the phone's language when the app speaks it, otherwise English
const deviceLanguage = String(navigator.language || '').slice(0, 2).toLowerCase();
let language = localStorage.getItem('debo-language') || (LANGUAGES.includes(deviceLanguage) ? deviceLanguage : 'en');
if (!LANGUAGES.includes(language)) language = 'en';
let entryMode = 'glucose',
  chartViewHours = 24,
  chartShouldScrollToLatest = true;
let chartScrollFrame = 0,
  resizeFrame = 0,
  navFrame = 0,
  toastTimer = 0,
  showAllActiveDoses = false;
let selectedHistoryDate = startOfDay(Date.now()),
  statisticsPeriod = 'quarter',
  notificationTimer = null,
  lastChartTap = { id: null, time: 0 };
let initialSetupMissing = false,
  authMode = 'choice',
  pendingProfilePhoto = null;
let photoMealEstimate = null,
  selectedMealPhotoFile = null;
const systemTheme = matchMedia('(prefers-color-scheme: dark)');

const CHART_MIN = 3,
  CHART_MAX = 14.5,
  CHART_TOP = 8,
  CHART_BOTTOM = 82,
  CHART_LABEL_Y = 99,
  EDGE = 18;

const translations={
lt:{
  bloodGlucose:'Gliukozė',lastReadingAt:'Matuota',openQuickGlucose:'Įvesti gliukozę',glucoseEntryTime:'Matavimo laikas',glucoseChartKicker:'ŠIANDIEN',glucoseChartTitle:'Gliukozės grafikas',glucoseChartIntro:'Gliukozė ir insulinas',chartDayEvents:'Įvykiai',chartLegendGlucose:'Gliukozė',chartLegendRapid:'Trumpo veikimo',chartLegendLong:'Ilgo veikimo',hoursShort:'val.',
  insulin:'Insulinas',food:'Maistas',glucose:'Gliukozė',mealType:'Valgio tipas',mealBreakfast:'Pusryčiai',mealLunch:'Pietūs',mealDinner:'Vakarienė',mealSnack:'Užkandis',chooseMealType:'Valgis',
  enterReading:'Įvesti rodmenį',insulinActivity:'Insulino žurnalas',noActiveDoseDescription:'Šiandien dozių nėra.',
  seeMore:'Daugiau',showLess:'Mažiau',
  hypoglycemia:'Hipoglikemija',hyperglycemia:'Hiperglikemija',
  mainDisclaimer:'Debo yra įrašų programėlė, o ne medicinos priemonė. Gydymo sprendimus derinkite su gydytoju.',
  authTitle:'Kasdienis diabeto palydovas',authLead:'Rodmenys, maistas ir insulinas vienoje vietoje.',
  email:'El. paštas',password:'Slaptažodis',repeatPassword:'Pakartokite slaptažodį',signIn:'Prisijungti',createAccount:'Kurti paskyrą',or:'arba',continueGuest:'Tęsti kaip svečiui',
  authMvpNote:'Sveikatos duomenys saugomi tik šiame telefone.',
  accountExists:'Paskyra jau sukurta. Prisijunkite.',loginFailed:'Neteisingas el. paštas arba slaptažodis.',
  loginTitle:'Prisijungimas',loginLead:'Įveskite el. pašto adresą ir slaptažodį.',createTitle:'Nauja paskyra',createLead:'El. paštas naudojamas prisijungti.',guestTitle:'Svečio režimas',guestLead:'Įveskite savo vardą.',guestStorageNote:'Duomenys saugomi tik šiame įrenginyje.',
  nameRequired:'Įveskite vardą.',ageRequired:'Įveskite amžių nuo 1 iki 120.',passwordMismatch:'Slaptažodžiai nesutampa.',socialUnavailable:'Prisijungimas per Google veikia tik „Android“ programėlėje.',googleSetupMissing:'Prisijungimas per Google nepasiekiamas. Naudokite el. paštą.',googleLoginFailed:'Nepavyko prisijungti per Google.',googleCancelled:'Prisijungimas per Google atšauktas.',googleSigningIn:'Jungiamasi per Google…',
  guestAccount:'Svečio režimas',signedInAccount:'Prisijungta paskyra',guestAccountNote:'Narystei reikalinga paskyra.',
  home:'Pradžia',sportNav:'Sportas',converter:'Konverteris',
  converterCaps:'KONVERTERIS',
  converterDescription:'Įveskite reikšmę bet kuriame laukelyje.',converterPresets:'Dažnos reikšmės',
  history:'ISTORIJA',statistics:'Statistika',dayEvents:'Dienos istorija',historyRange:'Rodomi paskutinių 3 mėnesių įrašai.',averageDailyGlucose:'Vidutinė gliukozė',statToday:'Šiandien',statReadings:'Rodmenys',
  save:'Išsaugoti',cancel:'Atšaukti',delete:'Ištrinti',close:'Uždaryti',back:'Grįžti',
  proteinG:'Baltymai (g)',fatG:'Riebalai (g)',
  manual:'Įvesti ranka',
  insulinType:'Insulino tipas',injectionTime:'Suleidimo laikas',
  giNote:'GI yra orientacinis ir priklauso nuo produkto.',takePhoto:'Nufotografuoti',pickPhoto:'Pasirinkti iš galerijos',
  photoAnalysis:'NUOTRAUKOS ANALIZĖ',photoMealTitle:'Maisto nuotrauka',photoPrivacy:'Nuotrauka analizuojama per OpenAI ir nesaugoma.',analyzePhoto:'Analizuoti nuotrauką',saveMealEstimate:'Įrašyti maistą',photoDisclaimer:'AI įverčiai gali būti netikslūs. Patikrinkite porciją. Tai nėra dozavimo rekomendacija.',photoPickFirst:'Pirmiausia pasirinkite nuotrauką.',photoApiMissing:'Analizė šiuo metu nepasiekiama.',photoWorking:'Analizuojama nuotrauka…',photoFailed:'Analizė nepavyko. Patikrinkite ryšį.',photoNoFood:'Maisto nerasta.',photoPortion:'Porcija',photoConfidence:'Patikimumas',photoGI:'Glikeminis indeksas',photoUnknownGI:'Nenustatomas',photoNutrition:'Angliavandeniai',photoProtein:'Baltymai',photoFat:'Riebalai',photoLow:'žemas',photoMedium:'vidutinis',photoHigh:'aukštas',photoOverallNote:'Porcija gali būti netiksli.',photoWholePortion:'Visa porcija',photoBreakdown:'Produktai',photoBreakdownCount:'produktai',photoPortionWeight:'Porcijos svoris',photoMealName:'Patiekalas iš nuotraukos',photoSaveDone:'Maistas įrašytas.',
  photoCredits:'Liko nemokamų analizių',photoCreditSignIn:'Narystei reikia prisijungti.',photoCreditLoginRequired:'Prisijunkite ir gaukite 3 nemokamas analizes.',photoCreditLow:'Analizė prieinama su Premium.',photoPurchasePending:'Laukiama „Google Play“ patvirtinimo.',photoBillingUnavailable:'Pirkimai galimi tik „Google Play“ programėlėje.',
  glucoseOutOfRange:'Neįprasta reikšmė. Patikrinkite skaičių ir vienetus.',insulinTooHigh:'Dozė viršija 100 vnt. Patikrinkite.',noReadingYet:'Rodmenų dar nėra',readingStale:'Senesnis nei 2 val.',deleteAccount:'Ištrinti paskyrą',deleteAccountTitle:'Ištrinti paskyrą?',deleteAccountText:'Paskyra ir narystė bus ištrintos negrįžtamai. Prenumeratą atšaukite „Google Play“.',deleteLocalData:'Taip pat ištrinti įrašus šiame telefone',deleteAccountConfirm:'Ištrinti visam laikui',accountDeleted:'Paskyra ištrinta.',passwordChanged:'Slaptažodis pakeistas.',foodSearchPlaceholder:'Ieškoti produkto',foodSelected:'Pasirinkta',foodChange:'Keisti',customProductLink:'Savo produktas',foodSmartTitle:'Kiti būdai',premiumTag:'Premium',foodSearchEmpty:'Produktas nerastas.',per100Short:'/ 100 g',historyKicker:'ĮRAŠAI',historyLinkText:'Visi įrašai',statisticsKicker:'SUVESTINĖ',notificationNative:'Priminimai veikia ir uždarius programėlę.',reminderGlucoseTitle:'Gliukozės priminimas',reminderGlucoseBody:'Praėjo 2 val. Įveskite gliukozės rodmenį.',reminderLongTitle:'Ilgo veikimo insulinas',reminderLongBody:'Laikas ilgo veikimo insulino dozei.',

insulinSubstance_aspart:'aspartas',insulinSubstance_lispro:'lisproas',insulinSubstance_glulisine:'glulizinas',insulinSubstance_human:'žmogaus insulinas',insulinSubstance_glargine:'glarginas',insulinSubstance_glargine300:'glarginas 300 V/ml',insulinSubstance_detemir:'detemiras',insulinSubstance_degludec:'degludekas',insulinSubstance_icodec:'ikodekas',insulinSubstance_nph:'NPH insulinas',insulinGroup_ultraRapid:'Itin greito veikimo',insulinGroup_rapidAnalog:'Greito veikimo analogai',insulinGroup_humanShort:'Trumpo veikimo žmogaus insulinas',insulinGroup_longAnalog:'Ilgo veikimo analogai',insulinGroup_weekly:'Kartą per savaitę',insulinGroup_nph:'Vidutinės trukmės (NPH)',
showPassword:'Rodyti slaptažodį',hidePassword:'Slėpti slaptažodį',authNoAccount:'Neturite paskyros?',authCreateLink:'Sukurti',authHaveAccount:'Jau turite paskyrą?',authLoginLink:'Prisijunkite',errEmailInvalid:'Įveskite teisingą el. pašto adresą.',errPasswordShort:'Slaptažodis turi būti bent 8 ženklų.',authBusyLogin:'Jungiamasi…',authBusySignup:'Kuriama paskyra…',authNetwork:'Nepavyko prisijungti prie serverio.',authTooMany:'Per daug bandymų. Bandykite vėliau.',authServiceDown:'Paslauga laikinai nepasiekiama.',sessionExpired:'Sesija baigėsi. Prisijunkite iš naujo – duomenys išsaugoti.',strengthTooShort:'Bent 8 ženklai',strengthWeak:'Silpnas',strengthMedium:'Vidutinis',strengthStrong:'Stiprus',accountCreated:'Paskyra sukurta. Sveiki, {name}!',welcomeBack:'Sveiki sugrįžę, {name}!',
tirTitle:'Laikas tiksliniame intervale',tirBasedOn:'Pagal {n} rodmenis',tirNoData:'Šiam laikotarpiui rodmenų nėra.',tirVeryLow:'Labai žema',tirLow:'Žema',tirInRange:'Tiksliniame intervale',tirHigh:'Aukšta',tirVeryHigh:'Labai aukšta',reportTitle:'Ataskaita gydytojui',reportKicker:'ATASKAITA',reportLead:'Gliukozės, insulino ir maisto suvestinė.',reportLinkText:'PDF arba spausdinimas',reportSave:'Išsaugoti PDF / spausdinti',reportPrivacy:'Ataskaita kuriama telefone ir niekur nesiunčiama.',reportPrintFailed:'Nepavyko atidaryti spausdinimo lango.',reportPeriod:'Laikotarpis',reportGenerated:'Sukurta',reportTherapy:'Gydymas',reportGlucose:'Gliukozė',reportAverage:'Vidutinė gliukozė',reportVariability:'Svyravimai (CV)',reportReadings:'Rodmenų',reportDaysWithReadings:'{n} d. su rodmenimis',reportEvents:'Žemos ir aukštos reikšmės',reportLows:'Žemi rodmenys',reportLowest:'Mažiausias rodmuo',reportVeryHighs:'Labai aukšti rodmenys',reportHighest:'Didžiausias rodmuo',reportLowList:'Žemų rodmenų laikas',reportInsulinFood:'Insulinas ir maistas (per dieną)',reportAvgRapid:'Greito veikimo insulinas',reportAvgBasal:'Bazinis insulinas',reportAvgCarbs:'Angliavandeniai',reportDaily:'Dienų suvestinė',reportDate:'Diena',reportAvgShort:'Vid. (n)',reportMinMax:'Min–maks',reportRapidShort:'Greitas',reportBasalShort:'Bazinis',reportCarbsShort:'Angl. g',reportNoData:'Šiam laikotarpiui įrašų nėra.',reportDisclaimer:'Duomenis įvedė naudotojas. Tai nėra medicininis dokumentas.',reportDays:'{n} d.',
  bgTitle:'Veikti fone',bgText:'Valdiklis atnaujinamas ir uždarius programėlę.',bgNote:'Atnaujinama maždaug kas 15 min.',bgEnabled:'Fono režimas įjungtas',bgDenied:'Leidimas skaityti fone nesuteiktas.',bgUnsupported:'Health Connect neleidžia skaityti fone. Atnaujinkite Health Connect.',
  forgotPassword:'Pamiršote slaptažodį?',resetKicker:'SLAPTAŽODIS',resetTitle:'Slaptažodžio atkūrimas',resetLead:'Atsiųsime 6 skaitmenų kodą.',resetSend:'Siųsti kodą',resetCode:'Kodas iš laiško',resetConfirm:'Pakeisti slaptažodį',resetResend:'Siųsti kodą dar kartą',resetResendIn:'Siųsti dar kartą po {n} s',resetChangeEmail:'Keisti el. paštą',resetSpamNote:'Laiško nėra? Patikrinkite šlamšto aplanką.',resetSentText:'Jei paskyra {email} egzistuoja, išsiuntėme kodą. Jis galioja 15 min.',resetResent:'Naujas kodas išsiųstas.',resetCodeLength:'Įveskite 6 skaitmenų kodą.',resetInvalidCode:'Kodas neteisingas arba nebegalioja.',resetUnavailable:'Slaptažodžio atkūrimas laikinai nepasiekiamas.',resetEmailFailed:'Nepavyko išsiųsti laiško.',resetDone:'Slaptažodis pakeistas. Esate prisijungę.',
  authLegal:'Tęsdami sutinkate su',privacyPolicyLower:'privatumo politika',privacyPolicy:'Privatumo politika',
  agpTitle:'Dienos profilis',agpBasedOn:'{n} d. rodmenys pagal valandas',agpNeedData:'Reikia bent 3 dienų rodmenų.',agpMedian:'Mediana',postMealReminder:'Priminti 2 val. po valgio',reminderPostMealTitle:'Gliukozė po valgio',reminderPostMealBody:'Praėjo 2 val. po valgio. Įveskite gliukozės rodmenį.',
  trendStable:'Stabili',trendRisingSlow:'Lėtai kyla',trendRising:'Kyla',trendRisingFast:'Greitai kyla',trendFallingSlow:'Lėtai krenta',trendFalling:'Krenta',trendFallingFast:'Greitai krenta',
  backupTitle:'Atsarginė kopija',backupKicker:'DUOMENYS',backupLinkText:'Išsaugoti arba perkelti duomenis',backupLead:'Įrašai saugomi tik šiame telefone.',backupExport:'Išsaugoti kopiją',backupImport:'Atkurti iš kopijos',backupNote:'Atkuriant pasikartojantys įrašai praleidžiami.',backupInsulin:'Insulinas',backupFood:'Maistas',backupSaved:'Kopija išsaugota',backupSaveFailed:'Nepavyko išsaugoti kopijos.',backupInvalid:'Failas nėra Debo atsarginė kopija.',backupImported:'Atkurta įrašų: {n}',backupNothingNew:'Naujų įrašų kopijoje nėra.',storageFull:'Telefone baigėsi vieta Debo duomenims – nauji įrašai neišsaugomi. Pasidarykite atsarginę kopiją ir parašykite mums.',
  cgmTitle:'CGM per Health Connect',cgmLead:'Rodmenys iš Libre, Dexcom ir kitų programėlių įkeliami automatiškai.',cgmConnect:'Prijungti',cgmSyncNow:'Sinchronizuoti dabar',cgmDisconnect:'Išjungti',cgmPermissions:'Health Connect leidimai',cgmSource:'Gliukozė · CGM',cgmJustNow:'ką tik',cgmMinutesAgo:'prieš {n} min.',cgmNoApp:'Veikia tik „Android“ programėlėje.',cgmUnsupported:'Reikalinga „Android“ 9 ar naujesnė versija.',cgmInstall:'Įdiekite Health Connect iš Google Play.',cgmInstallButton:'Įdiegti Health Connect',cgmUnavailable:'Health Connect šiame telefone nepasiekiamas.',cgmPermissionLost:'Nėra leidimo. Patikrinkite Health Connect nustatymus.',cgmSyncing:'Sinchronizuojama…',cgmReadError:'Nepavyko nuskaityti duomenų.',cgmLastSync:'Sinchronizuota',cgmLastReading:'paskutinis rodmuo',cgmConnected:'Prijungta',cgmOff:'Išjungta',cgmDisabled:'Sinchronizavimas išjungtas. Rodmenys išsaugoti.',cgmConnectedToast:'Health Connect prijungtas',cgmDenied:'Leidimas nesuteiktas.',cgmImported:'Įkelta rodmenų: {n}',cgmNothingNew:'Naujų rodmenų nėra.',
  membership:'Narystė',membershipKicker:'DEBO NARYSTĖ',membershipTitle:'Debo Premium',membershipIntro:'Nuotraukų analizė, įvedimas balsu ir barkodų skenavimas.',membershipMonthly:'Mėnesinė',membershipAnnual:'Metinė',membershipMonthlyName:'Mėnesinė narystė',membershipAnnualName:'Metinė narystė',membershipPerMonth:'/ mėn.',membershipPerYear:'/ metus',membershipMonthlyHint:'Atsiskaitoma kas mėnesį',membershipAnnualHint:'{price} per mėnesį',membershipSave:'Sutaupote 17 %',membershipPerk1:'Neribota maisto nuotraukų analizė',membershipPerk2:'Maisto įvedimas balsu',membershipPerk3:'Produktų paieška skenuojant barkodą',membershipCtaMonthly:'Pradėti už {price} / mėn.',membershipCtaAnnual:'Pradėti už {price} / metus',membershipRestore:'Atkurti pirkimus',membershipRestoring:'Tikrinami ankstesni pirkimai…',membershipManage:'Tvarkyti „Google Play“',membershipLegal:'Prenumerata atnaujinama automatiškai. Ją atšaukti galite „Google Play“.',membershipActive:'Aktyvi narystė',membershipActiveLead:'Visos Premium funkcijos aktyvios.',membershipUntil:'Galioja iki {date}',membershipUnlimited:'Neribotos analizės',membershipDone:'Narystė aktyvuota. Dėkojame!',membershipSignIn:'Narystei reikalinga paskyra.',membershipSignInCta:'Prisijungti',membershipProfileLead:'Premium nuo {price} / mėn.',membershipProcessing:'Tvirtinamas pirkimas…',
  voiceEntry:'Balsu',barcodeEntry:'Barkodas',photoEntry:'Nuotrauka',
  voicePrompt:'Pasakykite produktą ir kiekį, pvz., „150 g obuolio“.',
  voiceUnavailable:'Šiame įrenginyje balso įvestis nepalaikoma.',voiceFailed:'Nepavyko atpažinti. Bandykite dar kartą.',
  barcodePrompt:'Nukreipkite kamerą į produkto barkodą.',barcodeManualPrompt:'Įveskite barkodą.',barcodeWorking:'Ieškoma…',lookupBarcode:'Ieškoti',barcodeAttribution:'Produktų duomenys iš Open Food Facts.',
  barcodeNotFound:'Produktas nerastas. Įveskite vertes ranka.',barcodeFailed:'Paieška nepavyko. Patikrinkite ryšį.',
  foodNeedsMacros:'Patikrinkite produktą ir maistines vertes.',productNotFound:'Produkto kataloge nėra. Įveskite vertes ranka.',
  product:'Produktas',productName:'Produkto pavadinimas',carbs100:'Angl. / 100 g',protein100:'Balt. / 100 g',fat100:'Rieb. / 100 g',
  portionSize:'Porcijos dydis',exactAmount:'Tikslus kiekis',chooseProduct:'Pasirinkite produktą',
  customProduct:'+ Savo produktas',exactAmountOption:'Įvesti tikslų kiekį',
  carbs:'angliavandenių',giUnknown:'GI nenurodytas',lowGiLabel:'Mažas GI',mediumGiLabel:'Vidutinis GI',highGiLabel:'Aukštas GI',
  
  
  profile:'PROFILIS',yourProfile:'Jūsų profilis',name:'Vardas',profileNameLabel:'Vardas',profilePhoto:'Profilio nuotrauka',profilePhotoNote:'Palieskite, kad pakeistumėte.',changePassword:'Keisti slaptažodį',currentPassword:'Dabartinis slaptažodis',newPassword:'Naujas slaptažodis',passwordSecurityNote:'Reikalingas dabartinis slaptažodis.',logout:'Atsijungti',nameChangeLocked:'Vardą vėl galėsite keisti',passwordTooShort:'Naujas slaptažodis turi būti bent 8 ženklų.',currentPasswordWrong:'Dabartinis slaptažodis neteisingas.',profilePhotoTooLarge:'Nepavyko apdoroti nuotraukos. Pasirinkite kitą failą.',
  settings:'NUSTATYMAI',settingsLabel:'Nustatymai',treatmentSettings:'Nustatymai',age:'Amžius',penTherapy:'Švirkštiklis',pumpTherapy:'Pompa',
  rapidInsulin:'Greito veikimo insulinas',longInsulin:'Bazinis insulinas',
  longReminder:'Priminti apie ilgo veikimo insuliną',reminderTime:'Priminimo laikas',
  glucoseUnit:'Gliukozės vienetai',language:'Kalba',
  appearance:'Išvaizda',themeSystem:'Pagal sistemą',themeLight:'Šviesi',themeDark:'Tamsi',
  glucoseReminder:'Priminti įvesti gliukozę kas 2 val.',glucoseQuiet:'Nepriminti naktį',quietFrom:'Nuo',quietTo:'Iki',mealTime:'Valgymo laikas',
  notificationOpenOnly:'Priminimai veikia tik atidarius programėlę.',
  notificationUnsupported:'Šiame įrenginyje pranešimai nepalaikomi.',
  pumpInsulinNote:'Naudojant pompą parenkamas greito veikimo insulinas.',
  pumpSummary:'Insulino pompos terapija',penSummary:'Švirkštiklio terapija',
  
  enterValidValue:'Įveskite tinkamą reikšmę.',chooseTime:'Pasirinkite tinkamą laiką.',
  chooseFood:'Pasirinkite produktą ir porciją.',stable:'Stabili',low:'Žema',high:'Aukšta',
  enterReadingPrompt:'Įvesti rodmenį',localTime:'Vietos laikas',noEvents:'Šią dieną įrašų nėra.',
  rapid:'Greito veikimo',long:'Ilgo veikimo',
  understood:'Supratau',
  hypoKicker:'ŽEMA GLIUKOZĖ',hypoTitle:'Hipoglikemija',
  hypoStep1Title:'Įvertinkite situaciją',hypoStep1Text:'Jei rodmuo neatitinka savijautos, pasitikrinkite dar kartą. Esant ryškiems simptomams, nedelskite.',
  hypoStep2Title:'Suvartokite 15 g greitų angliavandenių',hypoStep2Text:'Pvz., gliukozės tabletės ar sultys. Šokoladas veikia lėčiau.',
  hypoStep3Title:'Palaukite 15 min.',hypoStep3Text:'Nevairuokite ir nesportuokite. Tada pasitikrinkite.',
  hypoStep4Title:'Jei vis dar žema – pakartokite',hypoStep4Text:'Jei gliukozė vis dar žemesnė nei 3,9 mmol/L (70 mg/dL), suvartokite dar 15 g ir pasitikrinkite.',
  hypoStep5Title:'Kai gliukozė atsistato',hypoStep5Text:'Jei valgis dar negreit, suvalgykite užkandį pagal savo planą. Užsirašykite galimą priežastį.',
  hypoExtraTitle:'Svarbu',hypoExtraText:'Dažnas ar naktines hipoglikemijas aptarkite su gydytoju.',
  hypoEmergency:'Jei žmogus negali ryti, yra be sąmonės ar ištiko traukuliai: nieko neduokite per burną, naudokite gliukagoną, jei jis yra, ir skambinkite 112.',
  hyperKicker:'AUKŠTA GLIUKOZĖ',hyperTitle:'Hiperglikemija',hyperStep1Title:'Patikrinkite rodmenį ir insuliną',hyperStep1Text:'Pasitikrinkite dar kartą. Ar nepraleidote dozės? Su pompa – patikrinkite kateterį.',hyperStep2Title:'Įvertinkite ketonus',hyperStep2Text:'Ypač kai gliukozė virš 14 mmol/L (250 mg/dL), sergate ar pykina.',hyperStep3Title:'Gerkite vandens',hyperStep3Text:'Jei gydytojas neriboja skysčių.',hyperStep4Title:'Korekcija – tik pagal savo planą',hyperStep4Text:'Nekartokite korekcijų per trumpą laiką. Bazinio insulino nenutraukite.',hyperMoveTitle:'Kas gali padėti sumažinti gliukozę',hyperMove1:'15 min pasivaikščiojimas',hyperMove2:'Lengvi namų ruošos darbai',hyperMove3:'Ramus judėjimas po valgio',hyperMoveCaution:'Nejudėkite, jei gliukozė virš 14 mmol/L (250 mg/dL) arba yra ketonų – judėjimas tada gali ją dar pakelti.',
  hyperEmergency:'Skubiai kreipkitės pagalbos, jei vemiate, skauda pilvą, sunku kvėpuoti, jaučiate sumišimą ar ketonai nemažėja.',
  guideDisclaimer:'Bendro pobūdžio informacija, ne gydymo planas.',
  sportCaps:'SPORTAS',sportKicker:'FIZINIS AKTYVUMAS',sportTitle:'Sporto gidas',sportLegendDown:'dažnai mažėja',sportLegendVariable:'kinta',sportLegendUp:'gali kilti',sportAerobicTitle:'Aerobinė',sportAerobicText:'Tolygus vidutinio intensyvumo krūvis.',sportAerobicExamples:'Ėjimas · bėgimas · žygiai · dviratis · irklavimas · plaukimas',sportAnaerobicTitle:'Jėgos / anaerobinė',sportAnaerobicText:'Trumpas, labai intensyvus krūvis.',sportAnaerobicExamples:'Svoriai · sunkioji atletika · sprintai · šuoliai · trumpi įkalnės sprintai',sportMixedShortTitle:'Mišri / intervalinė',sportMixedShortText:'Aerobinė veikla su intensyviais epizodais.',sportMixedExamples:'Futbolas · krepšinis · tenisas · ledo ritulys · kovos menai · HIIT',sportLightTitle:'Lengva / lankstumo',sportLightText:'Mažesnis intensyvumas, lėtesnis pokytis.',sportLightExamples:'Tempimas · joga · pilatesas · taiči · lengvas pasivaikščiojimas',sportBeforeShort:'Prieš',sportDuringShort:'Per',sportAfterShort:'Po',
  sportIntro:'Gliukozės reakcija priklauso nuo veiklos tipo, intensyvumo, trukmės, aktyvaus insulino ir maisto. Vertingiausia yra stebėti savo pasikartojančius dėsningumus.',
  sportStep1Title:'Prieš veiklą',sportStep1Text:'Patikrinkite gliukozę ir kryptį, įvertinkite aktyvų insuliną, turėkite greitai veikiančių angliavandenių ir vandens.',
  sportStep2Title:'Veiklos metu',sportStep2Text:'Ilgesnės, naujos ar intensyvesnės veiklos metu gliukozę stebėkite dažniau. Jei ji krenta ar jaučiate hipoglikemijos simptomus — sustokite ir gydykite pagal savo planą.',
  sportStep3Title:'Po veiklos',sportStep3Text:'Padidėjęs jautrumas insulinui gali išlikti kelias valandas, todėl stebėkite gliukozę ir vėliau, ypač po ilgesnio aerobinio krūvio.',
  sportKetoneTitle:'Kada veiklą atidėti',sportDisclaimer:'Bendro pobūdžio informacija. Pakeitimus derinkite su gydytoju.',
  sportWarning:'Jei jaučiatės blogai, gliukozė neįprastai aukšta ar yra ketonų, intensyvų sportą atidėkite.',
  sportDetailKicker:'SPORTO RŪŠIS',sportDetailActivities:'Priskiriamos veiklos',sportDetailResponse:'Dažna gliukozės reakcija',sportDetailBefore:'Prieš veiklą',sportDetailDuring:'Veiklos metu',sportDetailAfter:'Po veiklos',
  sportAerobicResponse:'Dažniausiai mažina gliukozę, taip pat ir po veiklos.',sportAerobicBefore:'Patikrinkite gliukozę. Turėkite greitų angliavandenių ir vandens.',sportAerobicDuring:'Tikrinkite dažniau. Jei gliukozė krenta ar jaučiate simptomus, sustokite.',sportAerobicAfter:'Gliukozė gali kristi kelias valandas ar naktį.',
  sportAnaerobicResponse:'Gali laikinai pakilti, vėliau – kristi.',sportAnaerobicBefore:'Jei jaučiatės blogai, gliukozė aukšta ar yra ketonų, treniruotę atidėkite.',sportAnaerobicDuring:'Pakilimas dažnai laikinas – neskubėkite koreguoti.',sportAnaerobicAfter:'Vėliau pasitikrinkite dar kartą.',
  sportMixedResponse:'Besikeičiantis intensyvumas gali sukelti nepastovią kryptį: gliukozė gali mažėti, nekisti arba laikinai kilti.',sportMixedBefore:'Patikrinkite gliukozę. Turėkite greitų angliavandenių ir vandens.',sportMixedDuring:'Pasitikrinkite per pertraukas.',sportMixedAfter:'Stebėkite kelias valandas.',
  sportLightResponse:'Nedidelis pokytis arba lėtas kritimas.',sportLightBefore:'Patikrinkite gliukozę, ypač jei ji arti apatinės ribos.',sportLightDuring:'Turėkite greitų angliavandenių.',sportLightAfter:'Po ilgesnės veiklos pasitikrinkite.',
  heroTitle:'Paskutinis rodmuo',tileCarbs:'g angl.',tileUnits:'vnt.',tileReadings:'rodm.',prevMonth:'Ankstesnis mėnuo',nextMonth:'Kitas mėnuo',carbsShort:'angl.',entriesShort:'įraš.',mealEmpty:'Įrašų nėra',addFood:'Pridėti maistą',recentFoods:'Neseniai valgyta',settingsLead:'Insulinas, vienetai, priminimai',timerTitle:'Laikmatis',converterNav:'Konverteris',ketonesLabel:'Ketonai (mmol/L), nebūtina',ketonesShort:'ketonai',ketonesInvalid:'Ketonai turi būti nuo 0 iki 10 mmol/L.',logKetones:'Įrašyti ketonus',favoritesTitle:'Mėgstami valgiai',favSave:'Išsaugoti šiandienos valgį ({meal}) kaip mėgstamą',favSaved:'Išsaugota mėgstamuose',favLogged:'Įrašyta produktų: {n}',favDelete:'Pašalinti',introSkip:'Praleisti',introNext:'Toliau',introStart:'Pradėti',intro1Title:'Sveiki atvykę į Debo',intro1Text:'Gliukozė, maistas ir insulinas vienoje vietoje.',intro2Title:'Įrašas per kelias sekundes',intro2Text:'Spauskite + gliukozės kortelėje arba valgio eilutę. Mėgstamus valgius įrašysite vienu paspaudimu.',intro3Title:'Dienoraštis, ne gydymas',intro3Text:'Debo padeda vesti įrašus ir rodo bendrą informaciją. Gydymo sprendimus derinkite su gydytoju.',weeklySummary:'Savaitės suvestinė sekmadienį',weeklyTitle:'Debo savaitės suvestinė',weeklyBody:'7 d.: vidurkis {avg}, intervale {tir} %, įrašų: {n}',weeklyNoData:'Šią savaitę gliukozės rodmenų nebuvo.',customRemindersTitle:'Mano priminimai',customReminderAdd:'+ Pridėti priminimą',customReminderPlaceholder:'pvz.: pasimatuoti prieš vakarienę',customReminderDefault:'Debo priminimas',customRemindersNote:'Kartojama kasdien. Veikia Android programėlėje.',timerLead:'Po 15 min pasitikrinkite gliukozę.',timerStart:'Pradėti 15 min laikmatį',timerStartShort:'Pradėti',timerLeft:'liko',timerReady:'paruošta',timerDoneShort:'Laikas pasitikrinti',timerDoneTitle:'Praėjo 15 min',timerDoneBody:'Pasitikrinkite gliukozę.',timerCheck:'Įvesti rodmenį',timerRestart:'Iš naujo',timerStop:'Sustabdyti laikmatį',timerDisclaimer:'Bendro pobūdžio priemonė, ne gydymo planas.',weekCalendar:'Kalendorius',statCarbsDay:'Angliavandeniai per d.',statInsulinDay:'Insulinas per d.',statLast7:'7 dienų vidurkiai',
  eventDeleted:'Įrašas ištrintas',undo:'Atšaukti',
  careTitle:'Priemonės ir atsargos',careKicker:'PRIEŽIŪRA',careChanges:'Keitimai',care_sensor:'Sensorius pakeistas',care_pumpset:'Infuzijos rinkinys pakeistas',care_pen:'Švirkštiklis pakeistas',dev_sensor:'Sensorius',dev_pumpset:'Infuzijos rinkinys',dev_pen:'Švirkštiklis',careChangedAgo:'Pakeistas {ago}',careNever:'Dar neįrašyta',careNext:'kitas {date}',careDuePassed:'intervalas baigėsi',careNow:'Pakeista dabar',careLastChange:'Paskutinis keitimas',careInterval:'Intervalas, d.',careRemind:'Priminti, kai baigsis intervalas',careLoggedMsg:'{item}: keitimas įrašytas',careDueBody:'{item}: praėjo {n} d. nuo keitimo',agoToday:'šiandien',agoYesterday:'vakar',agoDays:'prieš {n} d.',
  suppliesTitle:'Atsargos',supplyNone:'Atsargų dar nepridėta.',supplyOther:'Kita',supplyCustom:'Pavadinimas',supplyExpiry:'Galioja iki',supplyLowAt:'Priminti, kai liks',supplyLow:'Liko mažai',supplyExpires:'galioja iki {date}',supplyLowBody:'{name}: liko {n}',supplyExpiryBody:'{name}: galioja iki {date}',sup_sensor:'Sensoriai',sup_strips:'Testo juostelės',sup_pen:'Švirkštikliai',sup_needles:'Adatos',sup_pumpset:'Infuzijos rinkiniai',sup_reservoir:'Rezervuarai',sup_lancets:'Lancetai',careNote:'Priminimai veikia Android programėlėje.',supplyNote:'Kai atsargų lieka mažai, priminama 10:00.',
  historySearch:'Ieškoti įrašų',historySearchNote:'Ieškoma paskutinių 3 mėnesių įrašuose.',historyNoMatch:'Nieko nerasta.',
  unitU:'vnt.',carbAbbr:'Angl.',protAbbr:'Balt.',fatAbbr:'Rieb.',addedToLog:'Pridėta į maisto žurnalą',servHalf:'½ porcijos',servOne:'1 pilna porcija',servOneHalf:'1½ porcijos',servTwo:'2 porcijos',enterExactAmount:'Įvesti tikslų kiekį',portionInvalid:'Įveskite tinkamą porcijos kiekį',foodSaveFailed:'Maisto išsaugoti nepavyko',carbsWord:'angliavandenių',proteinWord:'Baltymai',fatWord:'Riebalai',photoTypeError:'Pasirinkite JPG, PNG arba WebP nuotrauką iki 15 MB.',photoCheckValues:'Patikrinkite maistines vertes ir glikeminį indeksą.',dosesToday:'Šiandien · dozių: {n}',emergencyLabel:'Skubi situacija',urgentHelp:'Skubi pagalba',chooseLanguage:'Kalba',chartRangeAria:'Grafiko mastelis',chartLegendAria:'Grafiko žymos',sportLegendAria:'Gliukozės krypties legenda',sportTypesAria:'Sporto tipai ir dažna gliukozės kryptis',searchResultsAria:'Paieškos rezultatai',purchaseFailed:'Pirkimo nepavyko užbaigti. Bandykite dar kartą.',savedShort:'išsaugota',nameTitle:'Kaip į jus kreiptis?',requestFailed:'Nepavyko. Bandykite dar kartą.',noteLabel:'Pastaba (nebūtina)',notePlaceholder:'pvz., gimtadienio tortas',exerciseNotePlaceholder:'pvz., po darbo, su draugais',editKicker:'ĮRAŠO REDAGAVIMAS',editDate:'Data',editTime:'Laikas',historyEditHint:'Palieskite įrašą, kad jį pakeistumėte.',exerciseKicker:'TRENIRUOTĖ',exerciseTitle:'Įrašyti treniruotę',exerciseActivity:'Veikla',exerciseDuration:'Trukmė, min',exerciseIntensity:'Intensyvumas',intensity_light:'Lengvas',intensity_moderate:'Vidutinis',intensity_hard:'Intensyvus',exerciseStart:'Pradžia',exerciseOther:'Kita veikla',exerciseInvalid:'Įveskite trukmę nuo 1 iki 600 min.',chartLegendExercise:'Sportas',exerciseLogThis:'Įrašyti šią treniruotę',minutesShort:'min',intro4Title:'Pritaikykime Debo',intro4Text:'Tai galėsite pakeisti nustatymuose.',introTherapyQ:'Kaip leidžiate insuliną?',
  sportPickTitle:'Kokią treniruotę planuojate?',sportSearch:'Ieškoti',sportNoMatch:'Nerasta',sportRiskTitle:'Rizikos mažinimas',
  sportGuideKicker:'TRENIRUOTĖ',
  statDaysLogged:'Dienos su įrašais',
  switchLanguage:'Pakeisti kalbą'
},
en:{
  bloodGlucose:'Glucose',lastReadingAt:'Measured',openQuickGlucose:'Enter glucose',glucoseEntryTime:'Measurement time',glucoseChartKicker:'TODAY',glucoseChartTitle:'Glucose chart',glucoseChartIntro:'Glucose and insulin',chartDayEvents:'Events',chartLegendGlucose:'Glucose',chartLegendRapid:'Short-acting',chartLegendLong:'Long-acting',hoursShort:'h',
  insulin:'Insulin',food:'Food',glucose:'Glucose',mealType:'Meal type',mealBreakfast:'Breakfast',mealLunch:'Lunch',mealDinner:'Dinner',mealSnack:'Snack',chooseMealType:'Meal',enterReading:'Enter reading',
  insulinActivity:'Insulin log',noActiveDoseDescription:'No doses today.',
  seeMore:'More',showLess:'Less',
  hypoglycemia:'Hypoglycemia',hyperglycemia:'Hyperglycemia',
  mainDisclaimer:'Debo is a logbook, not a medical device. Discuss treatment decisions with your doctor.',
  authTitle:'Everyday diabetes companion',authLead:'Readings, food and insulin in one place.',
  email:'Email',password:'Password',repeatPassword:'Repeat password',signIn:'Sign in',createAccount:'Create account',or:'or',continueGuest:'Continue as guest',
  authMvpNote:'Health data is stored only on this phone.',accountExists:'This account already exists. Please sign in.',loginFailed:'Incorrect email or password.',
  loginTitle:'Sign in',loginLead:'Enter your email and password.',createTitle:'New account',createLead:'Your email is used to sign in.',guestTitle:'Guest mode',guestLead:'Enter your name.',guestStorageNote:'Data is stored only on this device.',
  nameRequired:'Enter your name.',ageRequired:'Enter an age from 1 to 120.',passwordMismatch:'The passwords do not match.',socialUnavailable:'Google sign-in is available only in the Android app.',googleSetupMissing:'Google sign-in is unavailable. Please use email.',googleLoginFailed:'Google sign-in failed.',googleCancelled:'Google sign-in was cancelled.',googleSigningIn:'Signing in with Google…',
  guestAccount:'Guest mode',signedInAccount:'Signed-in account',guestAccountNote:'Membership requires an account.',
  home:'Home',sportNav:'Exercise',converter:'Converter',converterCaps:'CONVERTER',
  converterDescription:'Type a value in either field.',converterPresets:'Common values',
  history:'HISTORY',statistics:'Statistics',dayEvents:'Daily history',historyRange:'Showing the last 3 months.',averageDailyGlucose:'Average glucose',statToday:'Today',statReadings:'Readings',
  save:'Save',cancel:'Cancel',delete:'Delete',close:'Close',back:'Back',
  proteinG:'Protein (g)',fatG:'Fat (g)',
  manual:'Enter manually',
  insulinType:'Insulin type',injectionTime:'Injection time',
  giNote:'GI is approximate and depends on the product.',photoAnalysis:'PHOTO ANALYSIS',photoMealTitle:'Meal photo',photoPrivacy:'The photo is analyzed by OpenAI and is not stored.',analyzePhoto:'Analyze photo',saveMealEstimate:'Log meal',photoDisclaimer:'AI estimates may be inaccurate. Check the portion. This is not a dosing recommendation.',photoPickFirst:'Choose a photo first.',photoApiMissing:'Analysis is currently unavailable.',photoWorking:'Analyzing photo…',photoFailed:'Analysis failed. Check your connection.',photoNoFood:'No food found.',photoPortion:'Portion',photoConfidence:'Confidence',photoGI:'Glycemic index',photoUnknownGI:'Not available',photoNutrition:'Carbohydrates',photoProtein:'Protein',photoFat:'Fat',photoLow:'low',photoMedium:'medium',photoHigh:'high',photoOverallNote:'Portion may be inaccurate.',photoWholePortion:'Whole portion',photoBreakdown:'Items',photoBreakdownCount:'items',photoPortionWeight:'Portion weight',photoMealName:'Photo meal',photoSaveDone:'Meal logged.',product:'Product',productName:'Product name',
  photoCredits:'Free analyses left',photoCreditSignIn:'Sign in to use membership.',photoCreditLoginRequired:'Sign in to get 3 free analyses.',photoCreditLow:'Analysis requires Premium.',photoPurchasePending:'Waiting for Google Play confirmation.',photoBillingUnavailable:'Purchases are available only in the Google Play app.',
  glucoseOutOfRange:'Unusual value. Check the number and units.',insulinTooHigh:'The dose exceeds 100 U. Please check.',noReadingYet:'No readings yet',readingStale:'Older than 2 h',deleteAccount:'Delete account',deleteAccountTitle:'Delete account?',deleteAccountText:'Your account and membership will be permanently deleted. Cancel the subscription in Google Play.',deleteLocalData:'Also delete entries on this phone',deleteAccountConfirm:'Delete permanently',accountDeleted:'Account deleted.',passwordChanged:'Password changed.',foodSearchPlaceholder:'Search food',foodSelected:'Selected',foodChange:'Change',customProductLink:'Custom food',foodSmartTitle:'Other methods',premiumTag:'Premium',foodSearchEmpty:'No food found.',per100Short:'/ 100 g',historyKicker:'ENTRIES',historyLinkText:'All entries',statisticsKicker:'SUMMARY',notificationNative:'Reminders work even when the app is closed.',reminderGlucoseTitle:'Glucose reminder',reminderGlucoseBody:'2 hours have passed. Enter a glucose reading.',reminderLongTitle:'Long-acting insulin',reminderLongBody:'Time for your long-acting insulin dose.',

insulinSubstance_aspart:'aspart',insulinSubstance_lispro:'lispro',insulinSubstance_glulisine:'glulisine',insulinSubstance_human:'human insulin',insulinSubstance_glargine:'glargine',insulinSubstance_glargine300:'glargine 300 U/ml',insulinSubstance_detemir:'detemir',insulinSubstance_degludec:'degludec',insulinSubstance_icodec:'icodec',insulinSubstance_nph:'NPH insulin',insulinGroup_ultraRapid:'Ultra-rapid',insulinGroup_rapidAnalog:'Rapid-acting analogues',insulinGroup_humanShort:'Short-acting human insulin',insulinGroup_longAnalog:'Long-acting analogues',insulinGroup_weekly:'Once weekly',insulinGroup_nph:'Intermediate-acting (NPH)',
showPassword:'Show password',hidePassword:'Hide password',authNoAccount:'No account yet?',authCreateLink:'Create',authHaveAccount:'Already have an account?',authLoginLink:'Sign in',errEmailInvalid:'Enter a valid email address.',errPasswordShort:'Password must be at least 8 characters.',authBusyLogin:'Signing in…',authBusySignup:'Creating account…',authNetwork:'Cannot reach the server.',authTooMany:'Too many attempts. Try again later.',authServiceDown:'The service is temporarily unavailable.',sessionExpired:'Your session has expired. Sign in again; your data is safe.',strengthTooShort:'At least 8 characters',strengthWeak:'Weak',strengthMedium:'Medium',strengthStrong:'Strong',accountCreated:'Account created. Welcome, {name}!',welcomeBack:'Welcome back, {name}!',
tirTitle:'Time in range',tirBasedOn:'Based on {n} readings',tirNoData:'No readings for this period.',tirVeryLow:'Very low',tirLow:'Low',tirInRange:'In range',tirHigh:'High',tirVeryHigh:'Very high',reportTitle:'Report for your doctor',reportKicker:'REPORT',reportLead:'Summary of glucose, insulin and food.',reportLinkText:'PDF or print',reportSave:'Save PDF / print',reportPrivacy:'Created on your phone and never sent.',reportPrintFailed:'Could not open the print dialog.',reportPeriod:'Period',reportGenerated:'Created',reportTherapy:'Treatment',reportGlucose:'Glucose',reportAverage:'Average glucose',reportVariability:'Variability (CV)',reportReadings:'Readings',reportDaysWithReadings:'{n} days with readings',reportEvents:'Lows and highs',reportLows:'Low readings',reportLowest:'Lowest reading',reportVeryHighs:'Very high readings',reportHighest:'Highest reading',reportLowList:'Times of low readings',reportInsulinFood:'Insulin and food (per day)',reportAvgRapid:'Rapid-acting insulin',reportAvgBasal:'Basal insulin',reportAvgCarbs:'Carbohydrates',reportDaily:'Daily summary',reportDate:'Day',reportAvgShort:'Avg (n)',reportMinMax:'Min–max',reportRapidShort:'Rapid',reportBasalShort:'Basal',reportCarbsShort:'Carbs g',reportNoData:'No entries for this period.',reportDisclaimer:'Data entered by the user. This is not a medical document.',reportDays:'{n} days',
  bgTitle:'Run in background',bgText:'The widget updates even when the app is closed.',bgNote:'Updates about every 15 min.',bgEnabled:'Background mode on',bgDenied:'Background access was not granted.',bgUnsupported:'Health Connect does not allow background reading. Please update it.',
  forgotPassword:'Forgot password?',resetKicker:'PASSWORD',resetTitle:'Reset password',resetLead:'We will send you a 6-digit code.',resetSend:'Send code',resetCode:'Code from the email',resetConfirm:'Change password',resetResend:'Send code again',resetResendIn:'Send again in {n} s',resetChangeEmail:'Change email',resetSpamNote:'No email? Check your spam folder.',resetSentText:'If an account for {email} exists, we have sent a code. It is valid for 15 minutes.',resetResent:'A new code has been sent.',resetCodeLength:'Enter the 6-digit code.',resetInvalidCode:'The code is incorrect or has expired.',resetUnavailable:'Password reset is temporarily unavailable.',resetEmailFailed:'The email could not be sent.',resetDone:'Password changed. You are signed in.',
  authLegal:'By continuing, you accept the',privacyPolicyLower:'privacy policy',privacyPolicy:'Privacy policy',
  agpTitle:'Daily profile',agpBasedOn:'{n} days, by hour',agpNeedData:'At least 3 days of readings are required.',agpMedian:'Median',postMealReminder:'Remind me 2 h after meals',reminderPostMealTitle:'Glucose after a meal',reminderPostMealBody:'2 hours have passed since your meal. Enter a glucose reading.',
  trendStable:'Steady',trendRisingSlow:'Rising slowly',trendRising:'Rising',trendRisingFast:'Rising fast',trendFallingSlow:'Falling slowly',trendFalling:'Falling',trendFallingFast:'Falling fast',
  backupTitle:'Backup',backupKicker:'DATA',backupLinkText:'Save or transfer data',backupLead:'Entries are stored only on this phone.',backupExport:'Save backup',backupImport:'Restore from backup',backupNote:'Duplicate entries are skipped when restoring.',backupInsulin:'Insulin',backupFood:'Food',backupSaved:'Backup saved',backupSaveFailed:'Could not save the backup.',backupInvalid:'This file is not a Debo backup.',backupImported:'Entries restored: {n}',backupNothingNew:'No new entries in the backup.',storageFull:'Debo has run out of storage on this phone – new entries are not being saved. Make a backup and contact us.',
  cgmTitle:'CGM via Health Connect',cgmLead:'Readings from Libre, Dexcom and other apps are imported automatically.',cgmConnect:'Connect',cgmSyncNow:'Sync now',cgmDisconnect:'Turn off',cgmPermissions:'Health Connect permissions',cgmSource:'Glucose · CGM',cgmJustNow:'just now',cgmMinutesAgo:'{n} min ago',cgmNoApp:'Available only in the Android app.',cgmUnsupported:'Requires Android 9 or later.',cgmInstall:'Install Health Connect from Google Play.',cgmInstallButton:'Install Health Connect',cgmUnavailable:'Health Connect is not available on this phone.',cgmPermissionLost:'Permission missing. Check Health Connect settings.',cgmSyncing:'Syncing…',cgmReadError:'Could not read data.',cgmLastSync:'Synced',cgmLastReading:'last reading',cgmConnected:'Connected',cgmOff:'Off',cgmDisabled:'Sync turned off. Readings were kept.',cgmConnectedToast:'Health Connect connected',cgmDenied:'Permission was not granted.',cgmImported:'Readings imported: {n}',cgmNothingNew:'No new readings.',
  membership:'Membership',membershipKicker:'DEBO MEMBERSHIP',membershipTitle:'Debo Premium',membershipIntro:'Photo analysis, voice entry and barcode scanning.',membershipMonthly:'Monthly',membershipAnnual:'Annual',membershipMonthlyName:'Monthly membership',membershipAnnualName:'Annual membership',membershipPerMonth:'/ month',membershipPerYear:'/ year',membershipMonthlyHint:'Billed every month',membershipAnnualHint:'{price} per month',membershipSave:'Save 17%',membershipPerk1:'Unlimited meal photo analysis',membershipPerk2:'Voice food entry',membershipPerk3:'Find products by scanning a barcode',membershipCtaMonthly:'Start for {price} / month',membershipCtaAnnual:'Start for {price} / year',membershipRestore:'Restore purchases',membershipRestoring:'Checking previous purchases…',membershipManage:'Manage in Google Play',membershipLegal:'The subscription renews automatically. Cancel it in Google Play.',membershipActive:'Active membership',membershipActiveLead:'All Premium features are active.',membershipUntil:'Valid until {date}',membershipUnlimited:'Unlimited analyses',membershipDone:'Membership activated. Thank you!',membershipSignIn:'Membership requires an account.',membershipSignInCta:'Sign in',membershipProfileLead:'Premium from {price} / month',membershipProcessing:'Confirming purchase…',
  voiceEntry:'Voice',barcodeEntry:'Barcode',photoEntry:'Photo',
  voicePrompt:'Say the food and amount, e.g. “150 g apple”.',
  voiceUnavailable:'Voice input is not supported on this device.',voiceFailed:'Speech not recognized. Please try again.',
  barcodePrompt:'Point the camera at the product barcode.',barcodeManualPrompt:'Enter the barcode.',barcodeWorking:'Searching…',lookupBarcode:'Search',barcodeAttribution:'Product data from Open Food Facts.',
  barcodeNotFound:'Product not found. Enter values manually.',barcodeFailed:'Lookup failed. Check your connection.',
  foodNeedsMacros:'Check the food and nutrition values.',productNotFound:'Not in the catalog. Enter values manually.',
  carbs100:'Carbs / 100 g',protein100:'Protein / 100 g',fat100:'Fat / 100 g',portionSize:'Portion size',exactAmount:'Exact amount',chooseProduct:'Choose product',
  customProduct:'+ Custom food',exactAmountOption:'Enter exact amount',carbs:'carbohydrates',giUnknown:'GI not specified',
  lowGiLabel:'Low GI',mediumGiLabel:'Medium GI',highGiLabel:'High GI',
  
  
  profile:'PROFILE',yourProfile:'Your profile',name:'Name',profileNameLabel:'Name',profilePhoto:'Profile photo',profilePhotoNote:'Tap to change.',changePassword:'Change password',currentPassword:'Current password',newPassword:'New password',passwordSecurityNote:'Current password required.',logout:'Sign out',nameChangeLocked:'You can change your name again on',passwordTooShort:'The new password must be at least 8 characters.',currentPasswordWrong:'The current password is incorrect.',profilePhotoTooLarge:'The photo could not be processed. Choose another file.',settings:'SETTINGS',settingsLabel:'Settings',treatmentSettings:'Settings',age:'Age',
  penTherapy:'Pen',pumpTherapy:'Pump',rapidInsulin:'Rapid-acting insulin',longInsulin:'Basal insulin',
  longReminder:'Long-acting insulin reminder',reminderTime:'Reminder time',glucoseUnit:'Glucose units',
  language:'Language',glucoseReminder:'Glucose reminder every 2 h',glucoseQuiet:'Pause at night',quietFrom:'From',quietTo:'Until',mealTime:'Meal time',
  appearance:'Appearance',themeSystem:'System',themeLight:'Light',themeDark:'Dark',
  notificationOpenOnly:'Reminders work only while the app is open.',
  notificationUnsupported:'Notifications are not supported on this device.',
  pumpInsulinNote:'With a pump, rapid-acting insulin is selected.',pumpSummary:'Insulin pump therapy',penSummary:'Insulin pen therapy',
  
  enterValidValue:'Enter a valid value.',chooseTime:'Choose a valid time.',
  chooseFood:'Choose a product and portion.',stable:'Stable',low:'Low',high:'High',
  enterReadingPrompt:'Enter reading',localTime:'Local time',noEvents:'No entries for this day.',rapid:'Rapid-acting',long:'Long-acting',
  understood:'Got it',
  hypoKicker:'LOW GLUCOSE',hypoTitle:'Hypoglycemia',
  hypoStep1Title:'Assess the situation',hypoStep1Text:'If the reading does not match how you feel, recheck. With strong symptoms, do not wait.',
  hypoStep2Title:'Take 15 g of fast carbohydrates',hypoStep2Text:'For example, glucose tablets or juice. Chocolate acts more slowly.',
  hypoStep3Title:'Wait 15 minutes',hypoStep3Text:'Do not drive or exercise. Then recheck.',
  hypoStep4Title:'If still low, repeat',hypoStep4Text:'If glucose is still below 3.9 mmol/L (70 mg/dL), take another 15 g and recheck.',
  hypoStep5Title:'Once glucose recovers',hypoStep5Text:'If your next meal is not soon, have a snack according to your plan. Note the possible cause.',
  hypoExtraTitle:'Important',hypoExtraText:'Discuss frequent or night-time hypoglycemia with your care team.',
  hypoEmergency:'If the person cannot swallow, is unconscious or has a seizure: give nothing by mouth, use glucagon if available and call emergency services.',
  hyperKicker:'HIGH GLUCOSE',hyperTitle:'Hyperglycemia',hyperStep1Title:'Check the reading and insulin',hyperStep1Text:'Recheck. Was a dose missed? With a pump, check the infusion site.',hyperStep2Title:'Check ketones',hyperStep2Text:'Especially above 14 mmol/L (250 mg/dL), or when ill or nauseous.',hyperStep3Title:'Drink water',hyperStep3Text:'Unless your doctor restricts fluids.',hyperStep4Title:'Correct only per your plan',hyperStep4Text:'Avoid repeated corrections within a short time. Do not stop basal insulin.',hyperMoveTitle:'What can help lower glucose',hyperMove1:'A 15-minute walk',hyperMove2:'Light house chores',hyperMove3:'Gentle movement after a meal',hyperMoveCaution:'Do not exercise if glucose is above 14 mmol/L (250 mg/dL) or ketones are present – activity may raise it further.',
  hyperEmergency:'Seek urgent help if you are vomiting, have abdominal pain, difficulty breathing, confusion, or ketones are not falling.',
  guideDisclaimer:'General information, not a treatment plan.',
  sportCaps:'EXERCISE',sportKicker:'PHYSICAL ACTIVITY',sportTitle:'Exercise guide',sportLegendDown:'often falls',sportLegendVariable:'varies',sportLegendUp:'may rise',sportAerobicTitle:'Aerobic',sportAerobicText:'Steady moderate-intensity activity.',sportAerobicExamples:'Walking · running · hiking · cycling · rowing · swimming',sportAnaerobicTitle:'Strength / anaerobic',sportAnaerobicText:'Short, very intense effort.',sportAnaerobicExamples:'Weights · weightlifting · sprints · jumps · short hill sprints',sportMixedShortTitle:'Mixed / interval',sportMixedShortText:'Aerobic activity with intense bursts.',sportMixedExamples:'Football · basketball · tennis · ice hockey · martial arts · HIIT',sportLightTitle:'Light / flexibility',sportLightText:'Lower intensity, slower change.',sportLightExamples:'Stretching · yoga · Pilates · tai chi · easy walking',sportBeforeShort:'Before',sportDuringShort:'During',sportAfterShort:'After',
  sportIntro:'Glucose response depends on activity type, intensity, duration, active insulin and food. Your own repeating patterns are the most useful guide.',
  sportStep1Title:'Before activity',sportStep1Text:'Check glucose and trend, consider active insulin, and carry fast-acting carbohydrate and water.',
  sportStep2Title:'During activity',sportStep2Text:'Monitor more often during longer, new or more intense activity. If glucose is falling or hypo symptoms appear, stop and treat according to your plan.',
  sportStep3Title:'After activity',sportStep3Text:'Increased insulin sensitivity can last for hours, so keep monitoring later, especially after longer aerobic exercise.',
  sportKetoneTitle:'When to postpone activity',sportDisclaimer:'General information. Agree any changes with your care team.',
  sportWarning:'If you feel unwell, glucose is unusually high or ketones are present, postpone intense exercise.',
  sportDetailKicker:'ACTIVITY TYPE',sportDetailActivities:'Included activities',sportDetailResponse:'Typical glucose response',sportDetailBefore:'Before activity',sportDetailDuring:'During activity',sportDetailAfter:'After activity',
  sportAerobicResponse:'Usually lowers glucose, including afterwards.',sportAerobicBefore:'Check glucose. Carry fast carbohydrates and water.',sportAerobicDuring:'Check more often. If glucose is falling or you have symptoms, stop.',sportAerobicAfter:'Glucose may fall for hours or overnight.',
  sportAnaerobicResponse:'May rise briefly and fall later.',sportAnaerobicBefore:'If you feel unwell, glucose is high or ketones are present, postpone training.',sportAnaerobicDuring:'Rises are often temporary; do not rush corrections.',sportAnaerobicAfter:'Recheck later.',
  sportMixedResponse:'Changing intensity can produce a variable direction: glucose may fall, stay stable or temporarily rise.',sportMixedBefore:'Check glucose. Carry fast carbohydrates and water.',sportMixedDuring:'Check during breaks.',sportMixedAfter:'Monitor for a few hours.',
  sportLightResponse:'Little change or a slow fall.',sportLightBefore:'Check glucose, especially near your lower limit.',sportLightDuring:'Keep fast carbohydrates at hand.',sportLightAfter:'Recheck after longer sessions.',takePhoto:'Take a photo',pickPhoto:'Choose from gallery',
  heroTitle:'Latest reading',tileCarbs:'g carbs',tileUnits:'U',tileReadings:'readings',prevMonth:'Previous month',nextMonth:'Next month',carbsShort:'carbs',entriesShort:'items',mealEmpty:'No entries',addFood:'Add food',recentFoods:'Recent',settingsLead:'Insulin, units, reminders',timerTitle:'Timer',converterNav:'Converter',ketonesLabel:'Ketones (mmol/L), optional',ketonesShort:'ketones',ketonesInvalid:'Ketones must be between 0 and 10 mmol/L.',logKetones:'Log ketones',favoritesTitle:'Favorite meals',favSave:'Save today\'s meal ({meal}) as a favorite',favSaved:'Saved to favorites',favLogged:'Items logged: {n}',favDelete:'Remove',introSkip:'Skip',introNext:'Next',introStart:'Start',intro1Title:'Welcome to Debo',intro1Text:'Glucose, food and insulin in one place.',intro2Title:'Log in seconds',intro2Text:'Tap + on the glucose card or a meal row. Log favorite meals with one tap.',intro3Title:'A logbook, not treatment',intro3Text:'Debo helps you keep records and shows general information. Discuss treatment decisions with your doctor.',weeklySummary:'Weekly summary on Sunday',weeklyTitle:'Debo weekly summary',weeklyBody:'7 days: average {avg}, in range {tir}%, entries: {n}',weeklyNoData:'No glucose readings this week.',customRemindersTitle:'My reminders',customReminderAdd:'+ Add reminder',customReminderPlaceholder:'e.g. check before dinner',customReminderDefault:'Debo reminder',customRemindersNote:'Repeats daily. Works in the Android app.',timerLead:'Check your glucose after 15 min.',timerStart:'Start 15-min timer',timerStartShort:'Start',timerLeft:'left',timerReady:'ready',timerDoneShort:'Time to check',timerDoneTitle:'15 minutes passed',timerDoneBody:'Check your glucose.',timerCheck:'Enter reading',timerRestart:'Restart',timerStop:'Stop timer',timerDisclaimer:'A general tool, not a treatment plan.',weekCalendar:'Calendar',statCarbsDay:'Carbohydrates / day',statInsulinDay:'Insulin / day',statLast7:'7-day averages',
  eventDeleted:'Entry deleted',undo:'Undo',
  careTitle:'Devices and supplies',careKicker:'CARE',careChanges:'Changes',care_sensor:'Sensor changed',care_pumpset:'Infusion set changed',care_pen:'Pen changed',dev_sensor:'Sensor',dev_pumpset:'Infusion set',dev_pen:'Pen',careChangedAgo:'Changed {ago}',careNever:'Not logged yet',careNext:'next {date}',careDuePassed:'interval reached',careNow:'Changed now',careLastChange:'Last change',careInterval:'Interval, days',careRemind:'Remind me when the interval ends',careLoggedMsg:'{item} change logged',careDueBody:'{item}: {n} days since the last change',agoToday:'today',agoYesterday:'yesterday',agoDays:'{n} days ago',
  suppliesTitle:'Supplies',supplyNone:'No supplies added yet.',supplyOther:'Other',supplyCustom:'Name',supplyExpiry:'Expires',supplyLowAt:'Remind at',supplyLow:'Running low',supplyExpires:'expires {date}',supplyLowBody:'{name}: {n} left',supplyExpiryBody:'{name}: expires {date}',sup_sensor:'Sensors',sup_strips:'Test strips',sup_pen:'Pens',sup_needles:'Pen needles',sup_pumpset:'Infusion sets',sup_reservoir:'Reservoirs',sup_lancets:'Lancets',careNote:'Reminders work in the Android app.',supplyNote:'Low-stock reminders come at 10:00.',
  historySearch:'Search entries',historySearchNote:'Searching entries from the last 3 months.',historyNoMatch:'Nothing found.',
  unitU:'U',carbAbbr:'Carbs',protAbbr:'Protein',fatAbbr:'Fat',addedToLog:'Added to food log',servHalf:'½ serving',servOne:'1 full serving',servOneHalf:'1½ servings',servTwo:'2 servings',enterExactAmount:'Enter exact amount',portionInvalid:'Enter a valid portion amount',foodSaveFailed:'Could not save food',carbsWord:'carbohydrates',proteinWord:'Protein',fatWord:'Fat',photoTypeError:'Choose a JPG, PNG or WebP image under 15 MB.',photoCheckValues:'Check the nutrition values and glycemic index.',dosesToday:'Today · {n} doses',emergencyLabel:'Emergency',urgentHelp:'Urgent help',chooseLanguage:'Language',chartRangeAria:'Chart range',chartLegendAria:'Chart legend',sportLegendAria:'Glucose direction legend',sportTypesAria:'Exercise types and common glucose direction',searchResultsAria:'Search results',purchaseFailed:'The purchase could not be completed. Please try again.',savedShort:'saved',nameTitle:'What should we call you?',requestFailed:'Something went wrong. Please try again.',noteLabel:'Note (optional)',notePlaceholder:'e.g. birthday cake',exerciseNotePlaceholder:'e.g. after work, with friends',editKicker:'EDIT ENTRY',editDate:'Date',editTime:'Time',historyEditHint:'Tap an entry to edit it.',exerciseKicker:'WORKOUT',exerciseTitle:'Log a workout',exerciseActivity:'Activity',exerciseDuration:'Duration, min',exerciseIntensity:'Intensity',intensity_light:'Light',intensity_moderate:'Moderate',intensity_hard:'Hard',exerciseStart:'Start time',exerciseOther:'Other activity',exerciseInvalid:'Enter a duration from 1 to 600 min.',chartLegendExercise:'Exercise',exerciseLogThis:'Log this workout',minutesShort:'min',intro4Title:'Set up Debo',intro4Text:'You can change this later in Settings.',introTherapyQ:'How do you take insulin?',
  sportPickTitle:'Which workout are you planning?',sportSearch:'Search',sportNoMatch:'No match',sportRiskTitle:'Reducing risk',
  sportGuideKicker:'WORKOUT',
  statDaysLogged:'Days logged',
  switchLanguage:'Change language'
}};

// Latvian, Polish and German live in lang-*.js files loaded before this script
const LANGUAGE_PACKS = window.DEBO_LANGS || {};
Object.entries(LANGUAGE_PACKS).forEach(([code, pack]) => (translations[code] = pack.ui || {}));
const t = k => translations[language]?.[k] ?? translations.en[k] ?? translations.lt[k] ?? k;
// Text kept inline as an English/Lithuanian pair; other languages translate the English text in their language file
const tx = (en, lt = en) => (language === 'lt' ? lt : language === 'en' ? en : (LANGUAGE_PACKS[language]?.phrases?.[en] ?? en));
const mealApiBase = () =>
  String(window.DEBO_CONFIG?.mealAnalysisApiBaseUrl || '')
    .trim()
    .replace(/\/$/, '');
async function mealApi(path, { token, ...options } = {}) {
  const base = mealApiBase();
  if (!base) throw Object.assign(new Error(t('photoApiMissing')), { translated: true });
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  const response = await fetch(`${base}${path}`, { ...options, headers });
  let payload = {};
  try {
    payload = await response.json();
  } catch {}
  if (!response.ok) {
    const error = new Error(payload.error || 'Request failed');
    error.status = response.status;
    error.payload = payload;
    if (response.status === 401 && token) setTimeout(handleSessionExpired, 0);
    throw error;
  }
  return payload;
}

// Server error texts are Lithuanian, so other languages get the app's own translated message instead
function serverText(error, fallbackKey) {
  if (error?.translated) return error.message;
  if (error?.status === 429) return t('authTooMany');
  return language === 'lt' && error?.status && error.payload?.error ? error.payload.error : t(fallbackKey);
}

// The entry logs live in IndexedDB: localStorage holds only ~5 MB, which CGM readings fill within a few months.
// They are loaded into logCache before the first render, so readJSON/writeJSON stay synchronous for the rest of the app.
const LOG_KEYS = ['debo-glucose-history', 'debo-insulin-log', 'debo-food-log', 'debo-exercise-log', 'debo-care-log'];
const LOG_DB_NAME = 'debo',
  LOG_STORE = 'logs';
const logCache = {};
let logDb = null; // stays null when IndexedDB can't be opened: the logs then keep using localStorage
let logsReady = false;
const pendingLogWrites = new Set();
const isLogKey = k => LOG_KEYS.includes(k);

function idbDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  });
}
function openLogDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(LOG_DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(LOG_STORE);
    req.onsuccess = () => {
      // Never hold up a delete or upgrade requested elsewhere (e.g. a second copy of the page)
      req.result.onversionchange = () => req.result.close();
      resolve(req.result);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB blocked'));
  });
}
// Older versions or a launch without IndexedDB may have saved entries in localStorage: keep every entry from both
function mergeLogs(current, older) {
  if (!Array.isArray(current)) return older;
  const ids = new Set(current.map(x => x?.id).filter(Boolean));
  return [...current, ...older.filter(x => x && !(x.id && ids.has(x.id)))].sort((a, b) => a.timestamp - b.timestamp);
}
async function loadLogStore() {
  let opening;
  try {
    opening = openLogDb();
    const db = await Promise.race([opening, new Promise((_, reject) => setTimeout(() => reject(new Error('IndexedDB timeout')), 10000))]);
    const tx = db.transaction(LOG_STORE, 'readonly');
    const store = tx.objectStore(LOG_STORE);
    LOG_KEYS.forEach(key => {
      store.get(key).onsuccess = event => {
        if (event.target.result !== undefined) logCache[key] = event.target.result;
      };
    });
    await idbDone(tx);
    logDb = db;
    // One-time move of the logs out of localStorage; the old copy is removed only after IndexedDB confirmed the write
    const moved = [];
    LOG_KEYS.forEach(key => {
      try {
        const raw = localStorage.getItem(key);
        const old = raw === null ? null : JSON.parse(raw);
        if (!Array.isArray(old)) return;
        logCache[key] = mergeLogs(logCache[key], old);
        if (key === 'debo-glucose-history') compactHealthReadings(logCache[key]);
        moved.push(key);
      } catch {}
    });
    if (moved.length) {
      try {
        const write = db.transaction(LOG_STORE, 'readwrite');
        moved.forEach(key => write.objectStore(LOG_STORE).put(logCache[key], key));
        await idbDone(write);
        moved.forEach(key => localStorage.removeItem(key));
      } catch (e) {
        // localStorage keeps its copy and the move is tried again on the next launch
        console.warn('log migration', e);
      }
    }
  } catch (e) {
    console.warn('IndexedDB unavailable, logs stay in localStorage', e);
    logDb = null;
    LOG_KEYS.forEach(key => delete logCache[key]);
    // Only slow, not missing: once it opens, reload so the saved entries show (anything written meanwhile
    // sits in localStorage and is merged in by the move above). Once per session, so it can never loop.
    opening?.then(
      db => {
        db.close();
        let reloaded = true;
        try {
          reloaded = sessionStorage.getItem('debo-idb-reload') === '1';
          sessionStorage.setItem('debo-idb-reload', '1');
        } catch {}
        if (!reloaded) flushLogs().finally(() => location.reload());
      },
      () => {}
    );
  }
  logsReady = true;
}
const logsLoaded = loadLogStore();

function persistLog(k, v) {
  let done;
  try {
    const tx = logDb.transaction(LOG_STORE, 'readwrite');
    if (v === undefined) tx.objectStore(LOG_STORE).delete(k);
    else tx.objectStore(LOG_STORE).put(v, k);
    done = idbDone(tx);
  } catch (e) {
    done = Promise.reject(e);
  }
  const pending = done
    .catch(e => {
      console.warn(k, e);
      warnStorageFull();
    })
    .finally(() => pendingLogWrites.delete(pending));
  pendingLogWrites.add(pending);
}
// Resolves once every log write so far is on disk: wait for it before reloading the page
function flushLogs() {
  return Promise.all([...pendingLogWrites]);
}
function clearLogs() {
  LOG_KEYS.forEach(key => {
    localStorage.removeItem(key);
    delete logCache[key];
    if (logDb) persistLog(key, undefined);
  });
}

function readJSON(k, f) {
  if (isLogKey(k)) {
    if (!logsReady) return f;
    if (logDb) return k in logCache ? logCache[k] : f;
  }
  try {
    const v = localStorage.getItem(k);
    return v === null ? f : JSON.parse(v);
  } catch {
    return f;
  }
}
let storageFullWarned = false;
function warnStorageFull() {
  // Phone storage for the app is full: new entries are not being saved, so tell the person instead of failing silently
  if (storageFullWarned) return;
  storageFullWarned = true;
  setTimeout(() => {
    try {
      toast(t('storageFull'));
    } catch {}
  }, 0);
}
function writeJSON(k, v) {
  if (isLogKey(k)) {
    if (!logsReady) return console.warn('log write before load', k), false;
    if (k === 'debo-glucose-history') compactHealthReadings(v);
    if (logDb) {
      logCache[k] = v;
      persistLog(k, v);
      return true;
    }
  }
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch (e) {
    console.warn(k, e);
    warnStorageFull();
    return false;
  }
}
// Health Connect ids are only needed to skip readings already imported, and a sync never looks back more than 30 days
const HC_ID_KEEP_MS = 35 * 24 * 60 * 60 * 1000;
function compactHealthReadings(list) {
  if (!Array.isArray(list)) return list;
  const cutoff = Date.now() - HC_ID_KEEP_MS;
  list.forEach(x => {
    if (x?.hcId && x.timestamp < cutoff) delete x.hcId;
  });
  return list;
}
function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}
function parseNumber(v) {
  const n = Number(
    String(v ?? '')
      .trim()
      .replace(',', '.')
  );
  return Number.isFinite(n) ? n : NaN;
}
// Short ids (e.g. "gmh2k9x1a3f9q2"): a CGM adds hundreds of entries a day, so every character is stored many times.
// Older ids like "glucose-1792315179058-gpdf60" stay valid; nothing reads meaning from an id.
function createId(p) {
  return `${p[0]}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8).padEnd(6, '0')}`;
}
function escapeHtml(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
function pad2(v) {
  return String(v).padStart(2, '0');
}
// Statistics call these for every CGM reading (tens of thousands), so cache them per 15-minute slot:
// every time zone offset is a multiple of 15 minutes, so all times in a slot share their day and hour.
// The caches (dayStartCache, hourCache) are declared at the top of the file: startOfDay runs during startup.
function cachedPerSlot(cache, ts, compute) {
  const slot = Math.floor(ts / 900000);
  let value = cache.get(slot);
  if (value === undefined) {
    if (cache.size > 100000) cache.clear();
    value = compute(new Date(ts));
    cache.set(slot, value);
  }
  return value;
}
function startOfDay(ts) {
  return cachedPerSlot(dayStartCache, ts, d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime());
}
function hourOfDay(ts) {
  return cachedPerSlot(hourCache, ts, d => d.getHours());
}
function endOfDay(ts) {
  return shiftCalendarDay(startOfDay(ts), 1) - 1;
}
function shiftCalendarDay(ts, days) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.getTime();
}
function isoDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function currentTimeInputValue() {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function locale() {
  return LOCALES[language] || 'en-GB';
}
// Building an Intl formatter is slow and lists format hundreds of times, so keep one per language
const dateFormatters = new Map();
function dateFormatter(name, options) {
  const key = `${name}|${locale()}`;
  if (!dateFormatters.has(key)) dateFormatters.set(key, new Intl.DateTimeFormat(locale(), options));
  return dateFormatters.get(key);
}
function formatClock(ts) {
  return dateFormatter('clock', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ts));
}
function formatDateOnly(ts) {
  return dateFormatter('date', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(ts));
}
function timeInputToTodayTimestamp(v) {
  if (!v?.includes(':')) return NaN;
  const [h, m] = v.split(':').map(Number),
    n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), h, m).getTime();
}

const NAME_CHANGE_INTERVAL = 14 * 24 * 60 * 60 * 1000;

function getLocalAccount() {
  const account = readJSON('debo-account', null);
  return account && account.email ? account : null;
}

// The 14-day limit protects account names on the server; a guest's name lives only on the phone
function nameCanChange(profile = readJSON('debo-profile', {})) {
  if (getSession()?.mode !== 'account') return true;
  return !profile.nameChangedAt || Date.now() - profile.nameChangedAt >= NAME_CHANGE_INTERVAL;
}

function nextNameChangeDate(profile = readJSON('debo-profile', {})) {
  return profile.nameChangedAt ? profile.nameChangedAt + NAME_CHANGE_INTERVAL : null;
}

function mmolToMg(v) {
  return v * 18.0182;
}
function mgToMmol(v) {
  return v / 18.0182;
}
function getSettings() {
  return readJSON('gluco-insulin-setup', {});
}
function getGlucoseUnit() {
  return getSettings().glucoseUnit || 'mmol';
}
function decimal(v, digits = 1) {
  const text = Number(v).toFixed(digits);
  return language === 'en' ? text : text.replace('.', ',');
}
function displayGlucose(v) {
  return getGlucoseUnit() === 'mg' ? Math.round(mmolToMg(v)) : decimal(v);
}
function glucoseUnitText() {
  return getGlucoseUnit() === 'mg' ? 'mg/dL' : 'mmol/L';
}
function formatGlucose(v) {
  return `${displayGlucose(v)} ${glucoseUnitText()}`;
}

function getThemePreference() {
  const saved = localStorage.getItem('debo-theme') || getSettings().theme;
  return ['light', 'dark', 'system'].includes(saved) ? saved : 'light';
}

function applyTheme(preference = getThemePreference()) {
  const resolved = preference === 'system' ? (systemTheme.matches ? 'dark' : 'light') : preference;
  document.documentElement.dataset.theme = resolved;
  localStorage.setItem('debo-theme', preference);
  if (DOM.themeSelect) DOM.themeSelect.value = preference;
  const themeMeta = $('meta[name="theme-color"]');
  if (themeMeta) themeMeta.content = resolved === 'dark' ? '#141A19' : '#F5F7F4';
  try {
    window.AndroidUi?.setTheme(resolved);
  } catch {}
}

function getSession() {
  const session = readJSON('debo-session', null);
  return session && ['guest', 'account'].includes(session.mode) ? session : null;
}

function showAuthScreen() {
  DOM.profileModal?.close();
  openAuthMode('choice');
  DOM.authScreen.classList.remove('hidden');
}

function setAuthAlert(message = '', tone = 'error') {
  const alert = $('#auth-alert');
  if (!alert) return;
  alert.textContent = message;
  alert.dataset.tone = tone;
  alert.classList.toggle('hidden', !message);
}

function setFieldError(input, message = '') {
  if (!input) return;
  const error = $(`[data-error-for="${input.id}"]`);
  if (error) error.textContent = message;
  input.classList.toggle('invalid', !!message);
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function clearAuthErrors() {
  [DOM.authName, DOM.authEmail, DOM.authPassword, DOM.authPasswordRepeat].forEach(input => setFieldError(input));
  setAuthAlert();
}

function passwordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-ząčęėįšųūž]/.test(password) && /[A-ZĄČĘĖĮŠŲŪŽ]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9ąčęėįšųūžĄČĘĖĮŠŲŪŽ]/.test(password)) score++;
  return password.length < 8 ? 0 : score <= 2 ? 1 : score <= 3 ? 2 : 3;
}

function renderPasswordStrength() {
  const box = $('#password-strength');
  if (!box) return;
  const visible = authMode === 'signup' && DOM.authPassword.value.length > 0;
  box.classList.toggle('hidden', !visible);
  if (!visible) return;
  const level = passwordStrength(DOM.authPassword.value);
  box.dataset.level = String(level);
  $('#password-strength-label').textContent = t(['strengthTooShort', 'strengthWeak', 'strengthMedium', 'strengthStrong'][level]);
}

function setAuthBusy(busy) {
  DOM.authSubmit.disabled = busy;
  DOM.authSubmit.classList.toggle('is-busy', busy);
  DOM.authSubmit.textContent = busy
    ? t(authMode === 'signup' ? 'authBusySignup' : 'authBusyLogin')
    : t(authMode === 'guest' ? (ACCOUNTS ? 'continueGuest' : 'introStart') : authMode === 'signup' ? 'createAccount' : 'signIn');
}

function openAuthMode(mode) {
  authMode = mode;
  const choice = mode === 'choice';
  DOM.authChoice.classList.toggle('hidden', !choice);
  DOM.authForm.classList.toggle('hidden', choice);
  clearAuthErrors();
  if (choice) return;
  const guest = mode === 'guest';
  const signup = mode === 'signup';
  DOM.authNameField.classList.toggle('hidden', mode === 'login');
  DOM.authEmailField.classList.toggle('hidden', guest);
  DOM.authPasswordField.classList.toggle('hidden', guest);
  DOM.authPasswordRepeatField.classList.toggle('hidden', !signup);
  $('#auth-forgot')?.classList.toggle('hidden', mode !== 'login');
  DOM.authGuestNote.classList.toggle('hidden', !guest);
  DOM.authFormTitle.textContent = t(guest ? (ACCOUNTS ? 'guestTitle' : 'nameTitle') : signup ? 'createTitle' : 'loginTitle');
  DOM.authFormLead.textContent = t(guest ? 'guestLead' : signup ? 'createLead' : 'loginLead');
  DOM.authPassword.autocomplete = signup ? 'new-password' : 'current-password';
  setAuthBusy(false);
  renderPasswordStrength();
  const switchBox = $('#auth-switch');
  if (switchBox) {
    switchBox.classList.toggle('hidden', guest);
    $('#auth-switch-text').textContent = t(signup ? 'authHaveAccount' : 'authNoAccount');
    $('#auth-switch-button').textContent = t(signup ? 'authLoginLink' : 'authCreateLink');
  }
  if (mode === 'login' && !DOM.authEmail.value) DOM.authEmail.value = localStorage.getItem('debo-last-email') || '';
  setTimeout(() => {
    const input = guest || signup ? DOM.authName : DOM.authEmail.value ? DOM.authPassword : DOM.authEmail;
    input?.focus();
  }, 20);
}

function validateAuthForm() {
  clearAuthErrors();
  const errors = [];
  const name = DOM.authName.value.trim();
  const email = DOM.authEmail.value.trim();
  const password = DOM.authPassword.value;
  if (authMode !== 'login' && !name) errors.push([DOM.authName, t('nameRequired')]);
  if (authMode !== 'guest') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2}$/.test(email)) errors.push([DOM.authEmail, t('errEmailInvalid')]);
    if (password.length < 8) errors.push([DOM.authPassword, t('errPasswordShort')]);
    if (authMode === 'signup' && password.length >= 8 && password !== DOM.authPasswordRepeat.value)
      errors.push([DOM.authPasswordRepeat, t('passwordMismatch')]);
  }
  errors.forEach(([input, message]) => setFieldError(input, message));
  errors[0]?.[0].focus();
  return !errors.length;
}

function authErrorMessage(error) {
  if (error instanceof TypeError || error.message === 'Failed to fetch') return t('authNetwork');
  if (error.status === 401) return t('loginFailed');
  if (error.status === 409) return t('accountExists');
  if (error.status === 429) return t('authTooMany');
  if (error.status >= 500 || error.status === 404) return t('authServiceDown');
  return serverText(error, 'requestFailed');
}

function handleSessionExpired() {
  const session = getSession();
  if (session?.mode !== 'account') return;
  if (session.email) localStorage.setItem('debo-last-email', session.email);
  localStorage.removeItem('debo-session');
  $$('dialog[open]').forEach(dialog => dialog.close());
  DOM.authScreen.classList.remove('hidden');
  openAuthMode('login');
  setAuthAlert(t('sessionExpired'), 'info');
}

function prepareInitialSetup() {
  const session = getSession();
  DOM.accountProfileFields.classList.toggle('hidden', initialSetupMissing && session?.mode === 'guest');
}

function startSession(session) {
  writeJSON('debo-session', session);
  DOM.authPassword.value = '';
  DOM.authPasswordRepeat.value = '';
  DOM.authScreen.classList.add('hidden');
  if (session.name) {
    const profile = readJSON('debo-profile', {});
    if (!profile.name) writeJSON('debo-profile', { ...profile, name: session.name });
  }
  renderProfile();
  pushWidgetState();
  configureBackgroundSync();
  if (initialSetupMissing) {
    prepareInitialSetup();
    setTimeout(() => showIntroThen(afterIntroSetup), 180);
  }
}

async function submitAuthForm() {
  const email = DOM.authEmail.value.trim().toLowerCase();
  const password = DOM.authPassword.value;
  const name = DOM.authName.value.trim();
  if (DOM.authSubmit.disabled) return;
  if (!validateAuthForm()) return;
  if (authMode === 'guest') return startSession({ mode: 'guest', name });
  setAuthBusy(true);
  try {
    const path = authMode === 'signup' ? '/api/auth/register' : '/api/auth/login';
    const account = await mealApi(path, {
      method: 'POST',
      body: JSON.stringify({ email, password, ...(authMode === 'signup' ? { name } : {}) })
    });
    localStorage.removeItem('debo-account');
    localStorage.setItem('debo-last-email', account.user.email || email);
    const profile = readJSON('debo-profile', {});
    if (authMode === 'signup' && !profile.name) writeJSON('debo-profile', { ...profile, name: account.user.name });
    setAuthBusy(false);
    startSession({
      mode: 'account',
      provider: 'email',
      email: account.user.email,
      name: account.user.name,
      token: account.token,
      credits: account.user.credits,
      userId: account.user.id,
      member: account.user.member,
      membershipUntil: account.user.membershipUntil,
      membershipProduct: account.user.membershipProduct
    });
    toast(t(authMode === 'signup' ? 'accountCreated' : 'welcomeBack').replace('{name}', account.user.name || ''));
    refreshPhotoCredits();
  } catch (error) {
    setAuthBusy(false);
    setAuthAlert(authErrorMessage(error));
    if (error.status === 401) setFieldError(DOM.authPassword, ' ');
  }
}

let resetEmailValue = '';
let resetCooldownUntil = 0;
let resetCooldownTimer = null;
function setResetAlert(message = '', tone = 'error') {
  const alert = $('#reset-alert');
  alert.textContent = message;
  alert.dataset.tone = tone;
  alert.classList.toggle('hidden', !message);
}
function resetErrorMessage(error) {
  const code = error?.payload?.code;
  if (code === 'invalid_code') return t('resetInvalidCode');
  if (code === 'email_not_configured') return t('resetUnavailable');
  if (code === 'email_failed') return t('resetEmailFailed');
  if (code === 'weak_password') return t('errPasswordShort');
  if (code === 'invalid_email') return t('errEmailInvalid');
  return authErrorMessage(error);
}
function showResetStep(step) {
  $('#reset-step-email').classList.toggle('hidden', step !== 'email');
  $('#reset-step-code').classList.toggle('hidden', step !== 'code');
  if (step === 'code') $('#reset-sent-text').textContent = t('resetSentText').replace('{email}', resetEmailValue);
  setTimeout(() => (step === 'code' ? $('#reset-code') : $('#reset-email')).focus(), 30);
}
function renderResetCooldown() {
  const button = $('#reset-resend');
  const left = Math.ceil((resetCooldownUntil - Date.now()) / 1000);
  button.disabled = left > 0;
  button.textContent = left > 0 ? t('resetResendIn').replace('{n}', left) : t('resetResend');
  if (left <= 0) {
    clearInterval(resetCooldownTimer);
    resetCooldownTimer = null;
  }
}
function startResetCooldown() {
  resetCooldownUntil = Date.now() + 60000;
  clearInterval(resetCooldownTimer);
  resetCooldownTimer = setInterval(renderResetCooldown, 1000);
  renderResetCooldown();
}
function openPasswordReset() {
  const modal = $('#reset-modal');
  ['reset-email', 'reset-code', 'reset-password', 'reset-password-repeat'].forEach(id => setFieldError($(`#${id}`)));
  setResetAlert();
  $('#reset-email').value = DOM.authEmail.value.trim() || localStorage.getItem('debo-last-email') || '';
  $('#reset-code').value = '';
  $('#reset-password').value = '';
  $('#reset-password-repeat').value = '';
  showResetStep(
    resetEmailValue && resetEmailValue === $('#reset-email').value.trim().toLowerCase() && resetCooldownUntil > Date.now() - 15 * 60000
      ? 'code'
      : 'email'
  );
  if (!modal.open) modal.showModal();
}
async function sendResetCode(resend = false) {
  const input = $('#reset-email');
  const email = resend ? resetEmailValue : input.value.trim().toLowerCase();
  setResetAlert();
  setFieldError(input);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2}$/.test(email)) {
    setFieldError(input, t('errEmailInvalid'));
    input.focus();
    return;
  }
  const button = resend ? $('#reset-resend') : $('#reset-send');
  button.disabled = true;
  button.classList.add('is-busy');
  try {
    await mealApi('/api/auth/reset/request', { method: 'POST', body: JSON.stringify({ email, language }) });
    resetEmailValue = email;
    localStorage.setItem('debo-last-email', email);
    showResetStep('code');
    startResetCooldown();
    if (resend) setResetAlert(t('resetResent'), 'info');
  } catch (error) {
    setResetAlert(resetErrorMessage(error));
  } finally {
    button.classList.remove('is-busy');
    if (!resend) button.disabled = false;
    else renderResetCooldown();
  }
}
async function confirmPasswordReset() {
  const codeInput = $('#reset-code'),
    passInput = $('#reset-password'),
    repeatInput = $('#reset-password-repeat');
  [codeInput, passInput, repeatInput].forEach(input => setFieldError(input));
  setResetAlert();
  const code = codeInput.value.replace(/\D/g, '');
  const password = passInput.value;
  const errors = [];
  if (code.length !== 6) errors.push([codeInput, t('resetCodeLength')]);
  if (password.length < 8) errors.push([passInput, t('errPasswordShort')]);
  else if (password !== repeatInput.value) errors.push([repeatInput, t('passwordMismatch')]);
  errors.forEach(([input, message]) => setFieldError(input, message));
  if (errors.length) {
    errors[0][0].focus();
    return;
  }
  const button = $('#reset-confirm');
  button.disabled = true;
  button.classList.add('is-busy');
  try {
    const account = await mealApi('/api/auth/reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ email: resetEmailValue, code, newPassword: password })
    });
    $('#reset-modal').close();
    resetEmailValue = '';
    passInput.value = '';
    repeatInput.value = '';
    localStorage.removeItem('debo-account');
    localStorage.setItem('debo-last-email', account.user.email);
    startSession({
      mode: 'account',
      provider: 'email',
      email: account.user.email,
      name: account.user.name,
      token: account.token,
      credits: account.user.credits,
      userId: account.user.id,
      member: account.user.member,
      membershipUntil: account.user.membershipUntil,
      membershipProduct: account.user.membershipProduct
    });
    toast(t('resetDone'));
    refreshPhotoCredits();
  } catch (error) {
    setResetAlert(resetErrorMessage(error));
    if (error?.payload?.code === 'invalid_code') {
      setFieldError(codeInput, ' ');
      codeInput.select();
    }
  } finally {
    button.disabled = false;
    button.classList.remove('is-busy');
  }
}
function bindPasswordResetEvents() {
  $('#auth-forgot')?.addEventListener('click', openPasswordReset);
  $('#reset-send')?.addEventListener('click', () => sendResetCode(false));
  $('#reset-resend')?.addEventListener('click', () => sendResetCode(true));
  $('#reset-change-email')?.addEventListener('click', () => {
    setResetAlert();
    showResetStep('email');
  });
  $('#reset-confirm')?.addEventListener('click', confirmPasswordReset);
  $('#reset-email')?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendResetCode(false);
    }
  });
  $('#reset-code')?.addEventListener('input', event => {
    event.target.value = event.target.value.replace(/\D/g, '').slice(0, 6);
    if (event.target.value.length === 6) $('#reset-password').focus();
  });
  $('#reset-password-repeat')?.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      confirmPasswordReset();
    }
  });
}

let googleAuthButton = null;
async function finishGoogleSignIn(result) {
  if (!result?.idToken) {
    if (googleAuthButton) googleAuthButton.disabled = false;
    if (result?.error && result.error !== 'cancelled') toast(t('googleLoginFailed'));
    else if (result?.error === 'cancelled') toast(t('googleCancelled'));
    googleAuthButton = null;
    return;
  }
  try {
    const account = await mealApi('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken: result.idToken, nonce: result.nonce })
    });
    localStorage.removeItem('debo-account');
    const profile = readJSON('debo-profile', {});
    if (!profile.name && account.user.name) writeJSON('debo-profile', { ...profile, name: account.user.name });
    startSession({
      mode: 'account',
      provider: 'google',
      email: account.user.email,
      name: account.user.name,
      token: account.token,
      credits: account.user.credits,
      userId: account.user.id,
      member: account.user.member,
      membershipUntil: account.user.membershipUntil,
      membershipProduct: account.user.membershipProduct
    });
    refreshPhotoCredits();
  } catch (error) {
    if (error instanceof TypeError || error.status === 404 || error.status >= 500) setAuthAlert(authErrorMessage(error));
    else setAuthAlert(serverText(error, 'googleLoginFailed'));
  } finally {
    if (googleAuthButton) googleAuthButton.disabled = false;
    googleAuthButton = null;
  }
}
window.onDeboGoogleCredential = result => finishGoogleSignIn(result);
async function beginGoogleSignIn(button) {
  if (!window.AndroidAuth?.startGoogleSignIn) return toast(t('socialUnavailable'));
  googleAuthButton = button;
  button.disabled = true;
  toast(t('googleSigningIn'));
  try {
    const base = mealApiBase();
    if (!base) throw new Error('missing-api');
    const response = await fetch(`${base}/api/auth/config`, { method: 'GET', cache: 'no-store' });
    const config = await response.json();
    if (!response.ok || !config.googleWebClientId) throw new Error('missing-client-id');
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const nonce = btoa(String.fromCharCode(...bytes))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/, '');
    window.AndroidAuth.startGoogleSignIn(config.googleWebClientId, nonce);
  } catch (error) {
    button.disabled = false;
    googleAuthButton = null;
    toast(error.message === 'missing-client-id' ? t('googleSetupMissing') : t('googleLoginFailed'));
  }
}

function toast(msg, small = false) {
  const el = DOM.toast;
  clearTimeout(toastTimer);
  el.textContent = msg;
  el.classList.toggle('small', small);
  // As a popover the message sits above any open window
  try {
    if (el.matches(':popover-open')) el.hidePopover();
    el.showPopover();
  } catch {}
  el.classList.add('show');
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    toastTimer = setTimeout(() => {
      try {
        el.hidePopover();
      } catch {}
    }, 200);
  }, 2200);
}
const toastSaved = () => toast(t('savedShort'), true);

// A window opened from another one brings that window back when it closes (save, cancel, × or swipe)
let returnTo = null;
function openFrom(dialog, open, reopen = () => dialog.showModal()) {
  if (dialog?.open) {
    dialog.close();
    returnTo = reopen;
  }
  open();
}
function returnToPrevious() {
  const reopen = returnTo;
  returnTo = null;
  if (reopen && !document.querySelector('dialog[open]') && DOM.authScreen.classList.contains('hidden')) reopen();
}

function showView(name) {
  const viewName = name === 'history' ? 'statistics' : name;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === `view-${viewName}`));
  const navName = viewName;
  $$('[data-view-nav]').forEach(b => b.classList.toggle('selected', b.dataset.viewNav === navName));
  window.scrollTo({ top: 0, behavior: 'auto' });
  hideChartTooltip();
  if (name === 'history' || name === 'statistics') renderHistory();
  if (name === 'food') renderExpandedFoodPage();
  if (name === 'converter') {
    const mmol = parseNumber(DOM.converterMmol.value);
    if (Number.isFinite(mmol) && mmol > 0) DOM.converterMmol.value = decimal(mmol, 1);
    updateConverter();
  }
}

function renderHeaderDate() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat(locale(), { weekday: 'long' }).format(now);
  DOM.todayLabel.textContent = `${capitalize(weekday)}, ${new Intl.DateTimeFormat(locale(), { month: 'long', day: 'numeric' }).format(now)}`;
}

let calendarMonthOffset = 0;
const MEAL_ROWS = [
  ['breakfast', 'mealBreakfast'],
  ['lunch', 'mealLunch'],
  ['dinner', 'mealDinner'],
  ['snack', 'mealSnack']
];
const formatAmount = (value, digits = 0) => new Intl.NumberFormat(locale(), { maximumFractionDigits: digits }).format(value);
function capitalize(text) {
  return text.charAt(0).toLocaleUpperCase(locale()) + text.slice(1);
}
function monthStart(offset = 0) {
  const date = new Date(startOfDay(Date.now()));
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);
  return date.getTime();
}

/* Calendar sheet: month grid, today highlighted, a dot on days with entries, tap a day for its history */
function renderCalendar() {
  const first = new Date(monthStart(calendarMonthOffset));
  const today = startOfDay(Date.now()),
    earliest = historyEarliestDate();
  const logged = new Set([...glucoseHistory, ...insulinLog, ...foodLog].map(x => startOfDay(x.timestamp)));
  $('#cal-month').textContent = capitalize(new Intl.DateTimeFormat(locale(), { month: 'long', year: 'numeric' }).format(first));
  const monday = new Date(2024, 0, 1);
  $('#cal-weekdays').innerHTML = Array.from(
    { length: 7 },
    (_, i) =>
      `<span>${escapeHtml(new Intl.DateTimeFormat(locale(), { weekday: 'narrow' }).format(new Date(monday.getFullYear(), 0, 1 + i)))}</span>`
  ).join('');
  const lead = (first.getDay() + 6) % 7,
    days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  let html = '<span></span>'.repeat(lead);
  for (let d = 1; d <= days; d++) {
    const day = startOfDay(new Date(first.getFullYear(), first.getMonth(), d).getTime());
    const disabled = day > today || day < earliest;
    html += `<button class="cal-day${day === today ? ' today' : ''}${day === calendarSelectedDay ? ' selected' : ''}${logged.has(day) ? ' has-entries' : ''}" type="button" data-cal-day="${day}" ${disabled ? 'disabled' : ''} aria-label="${escapeHtml(formatDateOnly(day))}">${d}</button>`;
  }
  $('#cal-grid').innerHTML = html;
  $('#cal-prev').disabled =
    first.getTime() <= startOfDay(new Date(new Date(earliest).getFullYear(), new Date(earliest).getMonth(), 1).getTime());
  $('#cal-next').disabled = calendarMonthOffset >= 0;
}

let calendarSelectedDay = null;
function openCalendar(day = null) {
  hideChartTooltip();
  calendarSelectedDay = typeof day === 'number' ? startOfDay(day) : null;
  const now = new Date(),
    focus = new Date(calendarSelectedDay || Date.now());
  calendarMonthOffset = (focus.getFullYear() - now.getFullYear()) * 12 + focus.getMonth() - now.getMonth();
  renderCalendar();
  $('#calendar-modal').showModal();
}

function renderHomeSummary() {
  const start = startOfDay(Date.now()),
    end = endOfDay(start),
    today = x => x.timestamp >= start && x.timestamp <= end;
  const foods = foodLog.filter(today);
  $('#tile-food').textContent = formatAmount(foods.reduce((sum, x) => sum + Number(x.carbs || 0), 0));
  $('#tile-insulin').textContent = formatAmount(
    insulinLog.filter(today).reduce((sum, x) => sum + Number(x.amount || 0), 0),
    1
  );
  $('#tile-glucose').textContent = String(glucoseHistory.filter(today).length);
  $('#meal-list').innerHTML = MEAL_ROWS.map(([key, label]) => {
    const items = foods.filter(x => (x.mealType || 'snack') === key);
    const carbs = items.reduce((sum, x) => sum + Number(x.carbs || 0), 0);
    const countLabel = language === 'en' ? (items.length === 1 ? 'entry' : 'entries') : t('entriesShort');
    const detail = items.length ? `${formatAmount(carbs)} g ${t('carbsShort')} · ${items.length} ${countLabel}` : t('mealEmpty');
    return `<button class="meal-row" type="button" data-add-meal="${key}" aria-label="${escapeHtml(`${t('addFood')}: ${t(label)}, ${detail}`)}"><span class="meal-icon meal-${key}" aria-hidden="true"></span><span class="meal-copy"><strong>${escapeHtml(t(label))}</strong><small>${escapeHtml(detail)}</small></span><span class="meal-add" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M12 5v14"/></svg></span></button>`;
  }).join('');
}

function bindHomeSummaryEvents() {
  $('#calendar-open').addEventListener('click', () => openCalendar());
  // Day history: tapping the date goes back to the month calendar
  $('#history-modal .history-date-wrap').addEventListener('click', () => {
    $('#history-modal').close();
    openCalendar(selectedHistoryDate);
  });
  $('#cal-prev').addEventListener('click', () => {
    calendarMonthOffset--;
    renderCalendar();
  });
  $('#cal-next').addEventListener('click', () => {
    calendarMonthOffset = Math.min(0, calendarMonthOffset + 1);
    renderCalendar();
  });
  $('#close-calendar').addEventListener('click', () => $('#calendar-modal').close());
  $('#cal-grid').addEventListener('click', event => {
    const day = event.target.closest('[data-cal-day]');
    if (!day || day.disabled) return;
    $('#calendar-modal').close();
    selectedHistoryDate = Number(day.dataset.calDay);
    openHistoryModal();
  });
  $('#meal-list').addEventListener('click', event => {
    const button = event.target.closest('[data-add-meal]');
    if (!button) return;
    hideChartTooltip();
    openEntry('food');
    setMealType(button.dataset.addMeal);
  });
}

const GAUGE_MIN = 2,
  GAUGE_MAX = 18,
  GAUGE_LOW = 3.9,
  GAUGE_HIGH = 10,
  GAUGE_ARC = 433.54;
function renderGaugeScale() {
  const scale = $('#gauge-scale');
  if (!scale) return;
  const point = (value, radius) => {
    const angle = ((135 + ((value - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 270) * Math.PI) / 180;
    return [110 + radius * Math.cos(angle), 110 + radius * Math.sin(angle)].map(n => n.toFixed(1));
  };
  const unit = GAUGE_ARC / (GAUGE_MAX - GAUGE_MIN);
  [
    ['.gauge-low', GAUGE_MIN, GAUGE_LOW],
    ['.gauge-target', GAUGE_LOW, GAUGE_HIGH],
    ['.gauge-high', GAUGE_HIGH, GAUGE_MAX]
  ].forEach(([selector, from, to]) => {
    const zone = document.querySelector('#glucose-card ' + selector);
    if (!zone) return;
    zone.setAttribute('stroke-dasharray', `${((to - from) * unit).toFixed(2)} 578.05`);
    zone.setAttribute('stroke-dashoffset', (-(from - GAUGE_MIN) * unit).toFixed(2));
  });
  let html = '';
  for (let value = GAUGE_MIN; value <= GAUGE_MAX; value++) {
    const major = (value - GAUGE_MIN) % 4 === 0;
    const [x1, y1] = point(value, major ? 84 : 88),
      [x2, y2] = point(value, 100);
    html += `<line class="gauge-tick${major ? ' major' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    if (major) {
      const [x, y] = point(value, 71);
      html += `<text class="gauge-label" x="${x}" y="${y}">${getGlucoseUnit() === 'mg' ? Math.round(mmolToMg(value)) : value}</text>`;
    }
  }
  scale.innerHTML = html;
}
function renderUnitLabels() {
  DOM.glucoseUnitLabel.textContent = glucoseUnitText();
  renderGaugeScale();
  $('#axis-39').textContent = getGlucoseUnit() === 'mg' ? '70' : decimal(3.9);
  $('#axis-10').textContent = getGlucoseUnit() === 'mg' ? '180' : '10';
  $('#axis-14').textContent = getGlucoseUnit() === 'mg' ? '252' : '14';
}

function flagSvg(lang, scope) {
  const stripes = { lv: ['#9E3039', '#9E3039', '#FFFFFF', '#9E3039', '#9E3039'], pl: ['#FFFFFF', '#DC143C'], de: ['#000000', '#DD0000', '#FFCE00'] }[lang];
  if (stripes)
    return `<svg viewBox="0 0 3 ${stripes.length}" preserveAspectRatio="xMidYMid slice">${stripes.map((fill, i) => `<rect y="${i}" width="3" height="1.02" fill="${fill}"/>`).join('')}</svg>`;
  if (lang === 'lt')
    return '<svg viewBox="0 0 3 3" preserveAspectRatio="xMidYMid slice"><rect width="3" height="3" fill="#C1272D"/><rect width="3" height="2" fill="#006A44"/><rect width="3" height="1" fill="#FDB913"/></svg>';
  const clip = `flag-uk-${scope}`;
  return `<svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice"><clipPath id="${clip}"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30M60 0 0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30M60 0 0 30" clip-path="url(#${clip})" stroke="#C8102E" stroke-width="4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></svg>`;
}

function openLanguagePicker() {
  $('#language-list').innerHTML = LANGUAGES.map(
    code =>
      `<button class="language-option${code === language ? ' active' : ''}" type="button" data-language="${code}" lang="${code}" aria-pressed="${code === language}"><span class="flag-icon" aria-hidden="true">${flagSvg(code, 'pick-' + code)}</span><span>${LANGUAGE_NAMES[code]}</span>${code === language ? '<b aria-hidden="true">✓</b>' : ''}</button>`
  ).join('');
  $('#language-modal').showModal();
}

function setLanguage(next) {
  if (!LANGUAGES.includes(next)) return;
  language = next;
  const settings = getSettings();
  if (Object.keys(settings).length) writeJSON('gluco-insulin-setup', { ...settings, language });
  applyLanguage();
}

function applyLanguage() {
  document.documentElement.lang = language;
  localStorage.setItem('debo-language', language);
  DOM.settingsLanguage.value = language;
  populateInsulinSelects();
  $$('[data-i18n]').forEach(el => (el.textContent = t(el.dataset.i18n)));
  $$('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  $$('[data-i18n-placeholder]').forEach(el => el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder)));
  $$('[data-auth-language]').forEach(button => {
    button.classList.toggle('active', button.dataset.authLanguage === language);
    button.setAttribute('aria-pressed', String(button.dataset.authLanguage === language));
    button.innerHTML = `<span class="flag-icon" aria-hidden="true">${flagSvg(button.dataset.authLanguage, 'auth')}</span>`;
  });
  $('#language-flag').innerHTML = flagSvg(language, 'home');
  if (typeof renderHealthSync === 'function') renderHealthSync();
  if (typeof configureBackgroundSync === 'function') configureBackgroundSync();
  const privacyBase = window.DEBO_CONFIG?.privacyPolicyUrl || (mealApiBase() && `${mealApiBase()}/privacy`);
  const privacyUrl = privacyBase ? `${privacyBase}?lang=${language}` : '';
  $$('[data-privacy-link]').forEach(link => {
    link.hidden = !privacyUrl;
    link.href = privacyUrl || '#';
    link.target = '_blank';
    link.rel = 'noopener';
  });
  DOM.insulinType.querySelector('[value="rapid"]').textContent = t('rapid');
  DOM.insulinType.querySelector('[value="long"]').textContent = t('long');
  renderHeaderDate();
  renderUnitLabels();
  renderFoodCatalog();
  renderExpandedFoodPage();
  renderCurrentGlucose();
  renderTimelineGraph();
  renderHistory();
  renderSportPicker();
  renderProfile();
  renderActiveInsulin();
  setTherapyUi();
  updateNotificationNote();
  if (authMode !== 'choice') openAuthMode(authMode);
}

const foodCatalog=[
  {id:'apple',catLt:'Vaisiai',catEn:'Fruit',lt:'Obuolys',en:'Apple',carbs:12.1,protein:.3,fat:.2,gi:44,unit:'g',portions:[[90,'½ obuolio · ~90 g','½ apple · ~90 g'],[120,'Mažas · ~120 g','Small · ~120 g'],[180,'Vidutinis · ~180 g','Medium · ~180 g']]},
  {id:'banana',catLt:'Vaisiai',catEn:'Fruit',lt:'Bananas',en:'Banana',carbs:20,protein:1.1,fat:.3,gi:52,unit:'g',portions:[[60,'½ banano · ~60 g','½ banana · ~60 g'],[100,'Mažas · ~100 g','Small · ~100 g'],[120,'Vidutinis · ~120 g','Medium · ~120 g']]},
  {id:'orange',catLt:'Vaisiai',catEn:'Fruit',lt:'Apelsinas',en:'Orange',carbs:8.6,protein:.9,fat:.1,gi:43,unit:'g',portions:[[130,'Mažas · ~130 g','Small · ~130 g'],[180,'Vidutinis · ~180 g','Medium · ~180 g']]},
  {id:'grapes',catLt:'Vaisiai',catEn:'Fruit',lt:'Vynuogės',en:'Grapes',carbs:15,protein:.7,fat:.2,gi:53,unit:'g',portions:[[75,'½ stiklinės · ~75 g','½ cup · ~75 g'],[150,'1 stiklinė · ~150 g','1 cup · ~150 g']]},
  {id:'strawberries',catLt:'Vaisiai',catEn:'Fruit',lt:'Braškės',en:'Strawberries',carbs:4,protein:.7,fat:.3,gi:40,unit:'g',portions:[[100,'100 g','100 g'],[150,'1 stiklinė · ~150 g','1 cup · ~150 g']]},
  {id:'raspberries',catLt:'Vaisiai',catEn:'Fruit',lt:'Avietės',en:'Raspberries',carbs:5.4,protein:1.2,fat:.7,gi:32,unit:'g',portions:[[60,'½ stiklinės · ~60 g','½ cup · ~60 g'],[120,'1 stiklinė · ~120 g','1 cup · ~120 g']]},
  {id:'white_bread',catLt:'Duona',catEn:'Bread',lt:'Balta duona',en:'White bread',carbs:43.2,protein:8.9,fat:3.3,gi:73,unit:'g',portions:[[37,'1 riekė · ~37 g','1 slice · ~37 g'],[74,'2 riekės · ~74 g','2 slices · ~74 g']]},
  {id:'grain_bread',catLt:'Duona',catEn:'Bread',lt:'Grūdėta / sėklų duona',en:'Grain / seeded bread',carbs:40,protein:10,fat:5,gi:53,unit:'g',portions:[[35,'1 riekė · ~35 g','1 slice · ~35 g'],[70,'2 riekės · ~70 g','2 slices · ~70 g']]},
  {id:'basmati',catLt:'Grūdai',catEn:'Grains',lt:'Basmati ryžiai, virti',en:'Basmati rice, cooked',carbs:23,protein:2.7,fat:.3,gi:60,unit:'g',prepLt:'Angliavandeniai ir porcijos nurodyti VIRTIEMS ryžiams.',prepEn:'Carbohydrates and portions are for COOKED rice.',portions:[[85,'½ stiklinės · ~85 g','½ cup · ~85 g'],[170,'1 stiklinė · ~170 g','1 cup · ~170 g']]},
  {id:'jasmine',catLt:'Grūdai',catEn:'Grains',lt:'Jasmine ryžiai, virti',en:'Jasmine rice, cooked',carbs:21.2,protein:2.9,fat:.3,gi:89,unit:'g',prepLt:'Angliavandeniai ir porcijos nurodyti VIRTIEMS ryžiams.',prepEn:'Carbohydrates and portions are for COOKED rice.',portions:[[100,'½ stiklinės · ~100 g','½ cup · ~100 g'],[198,'1 stiklinė · ~198 g','1 cup · ~198 g']]},
  {id:'white_pasta',catLt:'Grūdai',catEn:'Grains',lt:'Balti makaronai, virti „al dente“',en:'White pasta, cooked al dente',carbs:23.9,protein:5.8,fat:.9,gi:27,unit:'g',prepLt:'GI ir angliavandeniai nurodyti VIRTIEMS „al dente“ makaronams; pervirti gali reaguoti kitaip.',prepEn:'GI and carbohydrates are for pasta cooked AL DENTE; overcooked pasta may respond differently.',portions:[[78,'½ stiklinės · ~78 g','½ cup · ~78 g'],[155,'1 stiklinė · ~155 g','1 cup · ~155 g']]},
  {id:'whole_pasta',catLt:'Grūdai',catEn:'Grains',lt:'Pilno grūdo makaronai, virti',en:'Wholemeal pasta, cooked',carbs:24.5,protein:5.3,fat:1.1,gi:59,unit:'g',prepLt:'Duomenys nurodyti VIRTIEMS makaronams.',prepEn:'Values are for COOKED pasta.',portions:[[78,'½ stiklinės · ~78 g','½ cup · ~78 g'],[155,'1 stiklinė · ~155 g','1 cup · ~155 g']]},
  {id:'potato',catLt:'Daržovės',catEn:'Vegetables',lt:'Bulvės, virtos',en:'Potatoes, boiled',carbs:11.5,protein:2,fat:.1,gi:73,unit:'g',prepLt:'Duomenys nurodyti VIRTOMS bulvėms.',prepEn:'Values are for BOILED potatoes.',portions:[[100,'~100 g','~100 g'],[150,'Vidutinė · ~150 g','Medium · ~150 g'],[250,'Didelė · ~250 g','Large · ~250 g']]},
  {id:'buckwheat',catLt:'Grūdai',catEn:'Grains',lt:'Grikiai, virti',en:'Buckwheat, cooked',carbs:20,protein:3.4,fat:.6,gi:null,unit:'g',prepLt:'Duomenys nurodyti VIRTIEMS grikiams.',prepEn:'Values are for COOKED buckwheat.',portions:[[85,'½ stiklinės · ~85 g','½ cup · ~85 g'],[170,'1 stiklinė · ~170 g','1 cup · ~170 g']]},
  {id:'oats',catLt:'Grūdai',catEn:'Grains',lt:'Avižų košė iš tradicinių dribsnių',en:'Porridge from rolled oats',carbs:10,protein:1.8,fat:1.4,gi:58,unit:'g',prepLt:'GI nurodytas košei iš tradicinių avižų.',prepEn:'GI is for traditional rolled-oat porridge.',portions:[[85,'½ porcijos · ~85 g','½ portion · ~85 g'],[170,'Porcija · ~170 g','Portion · ~170 g']]},
  {id:'chickpeas',catLt:'Ankštiniai',catEn:'Legumes',lt:'Avinžirniai, konservuoti ir nusausinti',en:'Chickpeas, canned and drained',carbs:18.7,protein:7.2,fat:2.6,gi:35,unit:'g',portions:[[75,'⅓ stiklinės · ~75 g','⅓ cup · ~75 g'],[170,'1 stiklinė · ~170 g','1 cup · ~170 g']]},
  {id:'lentils',catLt:'Ankštiniai',catEn:'Legumes',lt:'Lęšiai, virti',en:'Lentils, boiled',carbs:11.9,protein:9,fat:.4,gi:16,unit:'g',prepLt:'Duomenys nurodyti VIRTIEMS lęšiams.',prepEn:'Values are for BOILED lentils.',portions:[[90,'½ stiklinės · ~90 g','½ cup · ~90 g'],[185,'1 stiklinė · ~185 g','1 cup · ~185 g']]},
  {id:'kidney',catLt:'Ankštiniai',catEn:'Legumes',lt:'Raudonos pupelės, konservuotos ir nusausintos',en:'Kidney beans, canned and drained',carbs:14.2,protein:8.1,fat:.5,gi:36,unit:'g',portions:[[75,'⅓ stiklinės · ~75 g','⅓ cup · ~75 g'],[190,'1 stiklinė · ~190 g','1 cup · ~190 g']]},
  {id:'milk',catLt:'Pieno produktai',catEn:'Dairy',lt:'Pienas',en:'Milk',carbs:4.8,protein:3.3,fat:3.3,gi:30,unit:'ml',portions:[[100,'½ stiklinės · 100 ml','½ cup · 100 ml'],[200,'1 stiklinė · 200 ml','1 cup · 200 ml'],[250,'250 ml','250 ml']]},
  {id:'kefir',catLt:'Pieno produktai',catEn:'Dairy',lt:'Natūralus kefyras',en:'Plain kefir',carbs:4.7,protein:3.4,fat:2,gi:null,unit:'ml',prepLt:'Angliavandenių kiekis priklauso nuo gamintojo – pirmenybę teikite produkto etiketei.',prepEn:'Carbohydrate content varies by manufacturer – use the product label when available.',portions:[[100,'½ stiklinės · 100 ml','½ cup · 100 ml'],[200,'1 stiklinė · 200 ml','1 cup · 200 ml'],[300,'1½ stiklinės · 300 ml','1½ cups · 300 ml']]},
  {id:'yogurt',catLt:'Pieno produktai',catEn:'Dairy',lt:'Natūralus jogurtas',en:'Natural yoghurt',carbs:4.7,protein:3.5,fat:3.3,gi:35,unit:'g',portions:[[100,'100 g','100 g'],[150,'150 g','150 g'],[200,'200 g','200 g']]},
  {id:'donut',catLt:'Saldumynai',catEn:'Sweets',lt:'Spurga su glaistu',en:'Glazed doughnut',carbs:50,protein:5.1,fat:23,gi:null,unit:'g',portions:[[55,'1 spurga · ~55 g','1 doughnut · ~55 g']]},
  {id:'gummy',catLt:'Saldumynai',catEn:'Sweets',lt:'Guminukai',en:'Gummy sweets',carbs:77,protein:6,fat:0,gi:null,unit:'g',portions:[[25,'Maža porcija · 25 g','Small portion · 25 g'],[50,'50 g','50 g']]},
  {id:'dark_choc',catLt:'Saldumynai',catEn:'Sweets',lt:'Juodasis šokoladas',en:'Dark chocolate',carbs:46,protein:7.8,fat:29,gi:null,unit:'g',portions:[[10,'1 gabalėlis · ~10 g','1 piece · ~10 g'],[20,'~20 g','~20 g'],[35,'~35 g','~35 g']]}
];

const expandedFoods=[
 ['pear','Vaisiai','Fruit','Kriaušė','Pear',15.2,0.4,0.1,['snack','breakfast']],['peach','Vaisiai','Fruit','Persikas','Peach',9.5,0.9,0.3,['snack','breakfast']],['mango','Vaisiai','Fruit','Mangas','Mango',15,0.8,0.4,['snack','breakfast']],['kiwi','Vaisiai','Fruit','Kivis','Kiwi',14.7,1.1,0.5,['snack','breakfast']],['pineapple','Vaisiai','Fruit','Ananasas','Pineapple',13.1,0.5,0.1,['snack','breakfast']],['blueberry','Vaisiai','Fruit','Mėlynės','Blueberries',14.5,0.7,0.3,['snack','breakfast']],['watermelon','Vaisiai','Fruit','Arbūzas','Watermelon',7.6,0.6,0.2,['snack']],['avocado','Vaisiai','Fruit','Avokadas','Avocado',8.5,2,14.7,['snack','lunch']],
 ['tomato','Daržovės','Vegetables','Pomidoras','Tomato',3.9,0.9,0.2,['lunch','dinner']],['cucumber','Daržovės','Vegetables','Agurkas','Cucumber',3.6,0.7,0.1,['lunch','dinner']],['carrot','Daržovės','Vegetables','Morka','Carrot',9.6,0.9,0.2,['snack','lunch','dinner']],['broccoli','Daržovės','Vegetables','Brokoliai, virti','Broccoli, cooked',7.2,2.4,0.4,['lunch','dinner']],['cauliflower','Daržovės','Vegetables','Žiediniai kopūstai, virti','Cauliflower, cooked',5,1.9,0.3,['lunch','dinner']],['corn','Daržovės','Vegetables','Kukurūzai, virti','Sweetcorn, cooked',21,3.4,1.5,['lunch','dinner']],['peas','Daržovės','Vegetables','Žirneliai, virti','Peas, cooked',15.6,5.4,0.4,['lunch','dinner']],['sweet_potato','Daržovės','Vegetables','Saldžioji bulvė, kepta','Sweet potato, baked',20.7,2,0.2,['lunch','dinner']],
 ['brown_rice','Grūdai','Grains','Rudieji ryžiai, virti','Brown rice, cooked',23,2.6,0.9,['lunch','dinner']],['quinoa','Grūdai','Grains','Bolivinė balanda, virta','Quinoa, cooked',21.3,4.4,1.9,['lunch','dinner']],['couscous','Grūdai','Grains','Kuskusas, virtas','Couscous, cooked',23.2,3.8,0.2,['lunch','dinner']],['bulgur','Grūdai','Grains','Bulguras, virtas','Bulgur, cooked',18.6,3.1,0.2,['lunch','dinner']],['rye_bread','Duona','Bread','Ruginė duona','Rye bread',48.3,8.5,3.3,['breakfast','lunch']],['tortilla','Duona','Bread','Kvietinė tortilija','Wheat tortilla',52,8,8,['lunch','dinner']],['pita','Duona','Bread','Pitos duona','Pita bread',55.7,9.1,1.2,['lunch','dinner']],
 ['egg','Kiaušiniai','Eggs','Kiaušinis, virtas','Egg, boiled',1.1,12.6,10.6,['breakfast','snack']],['chicken','Mėsa ir žuvis','Meat & fish','Vištienos krūtinėlė, kepta','Chicken breast, cooked',0,31,3.6,['lunch','dinner']],['turkey','Mėsa ir žuvis','Meat & fish','Kalakutiena, kepta','Turkey, cooked',0,29,2,['lunch','dinner']],['salmon','Mėsa ir žuvis','Meat & fish','Lašiša, kepta','Salmon, cooked',0,25,13,['lunch','dinner']],['tuna','Mėsa ir žuvis','Meat & fish','Tunas savo sultyse','Tuna in water',0,25.5,0.8,['lunch','dinner']],['pork','Mėsa ir žuvis','Meat & fish','Kiaulienos nugarinė, kepta','Pork loin, cooked',0,27,8,['lunch','dinner']],['beef','Mėsa ir žuvis','Meat & fish','Jautiena, kepta','Beef, cooked',0,26,15,['lunch','dinner']],['cod','Mėsa ir žuvis','Meat & fish','Menkė, kepta','Cod, cooked',0,23,0.9,['lunch','dinner']],
 ['cottage_cheese','Pieno produktai','Dairy','Grūdėta varškė','Cottage cheese',3.4,11.1,4.3,['breakfast','snack']],['cheddar','Pieno produktai','Dairy','Čederio sūris','Cheddar cheese',1.3,25,33,['breakfast','lunch']],['greek_yogurt','Pieno produktai','Dairy','Graikiškas jogurtas, natūralus','Greek yoghurt, plain',3.6,10,5,['breakfast','snack']],['kefir_drink','Pieno produktai','Dairy','Pasukos','Buttermilk',4.8,3.3,1,['breakfast','snack']],['tofu','Ankštiniai','Legumes','Tofu','Tofu',1.9,17.3,8.7,['lunch','dinner']],['peanut_butter','Riešutai ir sėklos','Nuts & seeds','Žemės riešutų sviestas','Peanut butter',20,25,50,['breakfast','snack']],['almonds','Riešutai ir sėklos','Nuts & seeds','Migdolai','Almonds',21.6,21.2,49.9,['snack']],['walnuts','Riešutai ir sėklos','Nuts & seeds','Graikiniai riešutai','Walnuts',13.7,15.2,65.2,['snack']],['cashews','Riešutai ir sėklos','Nuts & seeds','Anakardžiai','Cashews',30.2,18.2,43.8,['snack']],['pumpkin_seeds','Riešutai ir sėklos','Nuts & seeds','Moliūgų sėklos','Pumpkin seeds',10.7,30.2,49,['snack']],
 ['hummus','Ankštiniai','Legumes','Humusas','Hummus',14.3,7.9,17.1,['snack','lunch']],['dark_rye_crisp','Duona','Bread','Ruginiai traškučiai','Rye crispbread',66,10,2,['breakfast','snack']],['cornflakes','Pusryčių dribsniai','Breakfast cereal','Kukurūzų dribsniai','Corn flakes',84,7,0.4,['breakfast']],['granola','Pusryčių dribsniai','Breakfast cereal','Granola','Granola',64,10,20,['breakfast','snack']],['pancake','Pusryčių patiekalai','Breakfast foods','Blynas','Pancake',28,6,7,['breakfast']],['honey','Saldumynai','Sweets','Medus','Honey',82.4,0.3,0,['breakfast','snack']],['raisins','Vaisiai','Fruit','Razinos','Raisins',79.2,3.1,0.5,['snack','breakfast']],['dates','Vaisiai','Fruit','Datulės, džiovintos','Dates, dried',75,2.5,0.4,['snack']],['pretzels','Užkandžiai','Snacks','Sūrūs riestainiai','Pretzels',74,10,3.5,['snack']],['popcorn','Užkandžiai','Snacks','Spragėsiai, be priedų','Popcorn, plain',78,12,4.3,['snack']],['potato_chips','Užkandžiai','Snacks','Bulvių traškučiai','Potato crisps',52,6.5,34,['snack']],['icecream','Desertai','Desserts','Vaniliniai ledai','Vanilla ice cream',23.6,3.5,11,['snack']],['orange_juice','Gėrimai','Drinks','Apelsinų sultys','Orange juice',10.4,0.7,0.2,['breakfast','snack']],['soy_milk','Gėrimai','Drinks','Sojų gėrimas, nesaldintas','Soy drink, unsweetened',0.7,3.3,1.8,['breakfast','snack']],['oat_milk','Gėrimai','Drinks','Avižų gėrimas','Oat drink',6.7,1,1.5,['breakfast','snack']]
].map(([id,catLt,catEn,lt,en,carbs,protein,fat,mealTypes])=>({id,catLt,catEn,lt,en,carbs,protein,fat,gi:null,unit:'g',mealTypes,portions:[[100,'100 g','100 g'],[150,'150 g','150 g'],[200,'200 g','200 g']]}));
foodCatalog.push(...expandedFoods);
const lidlBakery=[
  ['lidl_10059723','Atitirpinta „Banoffee“ spurga su 16 % bananų ir sviestinės karamelės įdaru',46,5.1,24,'https://www.lidl.lt/p/atitirpinta-banoffee-spurga-su-16-bananu-ir-sviestines-karameles-idaru-7612678/p10059723'],
  ['lidl_10059724','Kvietinė bandelė su moliūgų sėklomis, apkepta ant kepimo akmens',47.9,12.4,6.9,'https://www.lidl.lt/p/kvietine-bandele-su-moliugu-seklomis-apkepta-ant-kepimo-akmens-5564522/p10059724'],
  ['lidl_10059825','Speltos duona su vitaminais, apkepta ant kepimo akmens',42.7,12,6.6,'https://www.lidl.lt/p/speltos-duona-su-vitaminais-apkepta-ant-kepimo-akmens-5570153/p10059825'],
  ['lidl_10059763','„Morta“ - tamsi duona su raugu ir medumi',49,8.1,1.3,'https://www.lidl.lt/p/morta-tamsi-duona-su-raugu-ir-medumi-7612637/p10059763'],
  ['lidl_10059764','„Morta“ - šviesi duona su raugu ir visų grūdo dalių ruginiais miltais',54.5,8.6,2,'https://www.lidl.lt/p/morta-sviesi-duona-su-raugu-ir-visu-grudo-daliu-ruginiais-miltais-7612638/p10059764'],
  ['lidl_10059765','Mini bandelės su rūkytos mėsos įdaru',37,9.6,22,'https://www.lidl.lt/p/mini-bandeles-su-rukytos-mesos-idaru-7604756/p10059765'],
  ['lidl_10059766','Pyragėlis su mėsa ir sūriu',29,8.2,24,'https://www.lidl.lt/p/pyragelis-su-mesa-ir-suriu-226707/p10059766'],
  ['lidl_10059767','Štrudelis su špinatais ir feta',29,6.4,12.9,'https://www.lidl.lt/p/strudelis-su-spinatais-ir-feta-223633/p10059767'],
  ['lidl_10059768','Dubajaus stiliaus spurga',42.9,8,25.8,'https://www.lidl.lt/p/dubajaus-stiliaus-spurga-228129/p10059768'],
  ['lidl_10059769','Sluoksniuotos tešlos pyragėliai su „Carbonara“ įdaru, apibarstyti mocarelos sūriu',27,9.9,20,'https://www.lidl.lt/p/sluoksniuotos-teslos-pyrageliai-su-carbonara-idaru-apibarstyti-mocarelos-suriu-226709/p10059769'],
  ['lidl_10059770','Mini pica su karštai rūkytu kumpiu ir marinuotomis paprikomis',28,9.7,8.7,'https://www.lidl.lt/p/mini-pica-su-karstai-rukytu-kumpiu-ir-marinuotomis-paprikomis-7612007/p10059770'],
  ['lidl_10059771','Pyragėlis su 31 % įdaru',27,7.3,21,'https://www.lidl.lt/p/pyragelis-su-31-idaru-226710/p10059771'],
  ['lidl_10059772','Mini pica su mocarela ir padažu su saulėje džiovintais pomidorais',30,9.2,12,'https://www.lidl.lt/p/mini-pica-su-mocarela-ir-padazu-su-sauleje-dziovintais-pomidorais-7612002/p10059772'],
  ['lidl_10059773','Keksas „Aguonų šokis“',47,5.7,20,'https://www.lidl.lt/p/keksas-aguonu-sokis-7612802/p10059773'],
  ['lidl_10059774','Mielinė pynė su kreminiu įdaru su aguonomis ir sviestiniais trupiniais',48.4,6.9,9.9,'https://www.lidl.lt/p/mieline-pyne-su-kreminiu-idaru-su-aguonomis-ir-sviestiniais-trupiniais-169092/p10059774'],
  ['lidl_10059775','Mielinė spurga su 22 % pistacijų kremo įdaru, aplieta 12 % žaliu ir 1,4 % baltu glaistais',41,5.4,33,'https://www.lidl.lt/p/mieline-spurga-su-22-pistaciju-kremo-idaru-aplieta-12-zaliu-ir-1-4-baltu-glaistais-229448/p10059775'],
  ['lidl_10059776','Kvietinė duona su razinomis, bulvėmis, lazdyno riešutais ir medumi',44,7.2,7.5,'https://www.lidl.lt/p/kvietine-duona-su-razinomis-bulvemis-lazdyno-riesutais-ir-medumi-180903/p10059776'],
  ['lidl_10059821','Spurga su 14 % balto kremo įdaru, 12 % glaistu ir 4,8 % spalvotais cukriniais papuošimais',45,4.9,27,'https://www.lidl.lt/p/spurga-su-14-balto-kremo-idaru-12-glaistu-ir-4-8-spalvotais-cukriniais-papuosimais-180905/p10059821'],
  ['lidl_10059822','Spurga padengta 26 % baltu glaistu ir karamelės gabaliukais',43,4.9,36,'https://www.lidl.lt/p/spurga-padengta-26-baltu-glaistu-ir-karameles-gabaliukais-180906/p10059822'],
  ['lidl_10059823','Mini pica su karštai rūkyta vištiena, pomidorais ir svogūnais',29,11,9,'https://www.lidl.lt/p/mini-pica-su-karstai-rukyta-vistiena-pomidorais-ir-svogunais-7612006/p10059823'],
  ['lidl_10059824','Tortas „BUENO“',42.8,5.7,21.8,'https://www.lidl.lt/p/tortas-bueno-7612672/p10059824'],
  ['lidl_10059826','Tortas „VYŠNIŲ SVAJA“',39.8,5.5,12.5,'https://www.lidl.lt/p/tortas-vysniu-svaja-7612673/p10059826'],
  ['lidl_10059827','Tortas „RAFAELA“',32.1,5.1,25.3,'https://www.lidl.lt/p/tortas-rafaela-7612674/p10059827'],
  ['lidl_10059828','Kruasanai iš kildintos tešlos',41.3,7.7,22.1,'https://www.lidl.lt/p/kruasanai-is-kildintos-teslos-1015437/p10059828'],
  ['lidl_10059829','Prancūziškas batonas su sėklomis',55.7,10.7,2.9,'https://www.lidl.lt/p/prancuziskas-batonas-su-seklomis-165173/p10059829'],
  ['lidl_10059830','Kokosinis pyragas „Braunis“',53,3.2,33,'https://www.lidl.lt/p/kokosinis-pyragas-braunis-7613006/p10059830'],
  ['lidl_10059831','Varškės spurgų žiedai su milteliniu cukrumi',40,12,8.5,'https://www.lidl.lt/p/varskes-spurgu-ziedai-su-milteliniu-cukrumi-7612996/p10059831'],
  ['lidl_10059832','Suktinukas su pomidorais ir alyvuogėmis, papuoštas sezamo sėklomis',29.6,7.5,16.1,'https://www.lidl.lt/p/suktinukas-su-pomidorais-ir-alyvuogemis-papuostas-sezamo-seklomis-6209661/p10059832'],
  ['lidl_10059833','Mini spurga su kakavos ir lazdyno riešutų tyrės įdaru',49,5.3,23,'https://www.lidl.lt/p/mini-spurga-su-kakavos-ir-lazdyno-riesutu-tyres-idaru-198835/p10059833'],
  ['lidl_10059834','Sviestinės tešlos pyragėlis su karamele',58,3.5,18.9,'https://www.lidl.lt/p/sviestines-teslos-pyragelis-su-karamele-6608343/p10059834'],
  ['lidl_10059835','Spurga su pistacijų įdaru ir šokolado juostelėmis',44.6,6.7,28.5,'https://www.lidl.lt/p/spurga-su-pistaciju-idaru-ir-sokolado-juostelemis-213282/p10059835'],
  ['lidl_10059836','Mielinės tešlos spurgos, aplietos 26 % violetiniu glaistu ir 4,8 % milteliniu cukrumi',46,3.8,35,'https://www.lidl.lt/p/mielines-teslos-spurgos-aplietos-26-violetiniu-glaistu-ir-4-8-milteliniu-cukrumi-169430/p10059836'],
  ['lidl_10059837','Suktinukas su sūriu ir rūkytos kiaulienos kumpio kubeliais',32.2,16.4,13.6,'https://www.lidl.lt/p/suktinukas-su-suriu-ir-rukytos-kiaulienos-kumpio-kubeliais-227361/p10059837'],
  ['lidl_10059838','Suktinukas su vištienos įdaru',33.9,8,13,'https://www.lidl.lt/p/suktinukas-su-vistienos-idaru-6903630/p10059838'],
  ['lidl_10059839','Varškės spurgytės su vanilės skonio kremu',34.4,7.2,11.5,'https://www.lidl.lt/p/varskes-spurgytes-su-vaniles-skonio-kremu-190197/p10059839'],
  ['lidl_10059840','Užkandis su mocarela ir pomidorais',28.5,9.8,5.7,'https://www.lidl.lt/p/uzkandis-su-mocarela-ir-pomidorais-127696/p10059840'],
  ['lidl_10059841','Kruasanas su „Creme Brulee“ skonio kremo įdaru',43,7.9,19,'https://www.lidl.lt/p/kruasanas-su-creme-brulee-skonio-kremo-idaru-186004/p10059841'],
  ['lidl_10059842','Mielinis pyragas su razinomis, migdolais, apibarstytas migdolų drožlėmis',48.5,7.9,11.2,'https://www.lidl.lt/p/mielinis-pyragas-su-razinomis-migdolais-apibarstytas-migdolu-drozlemis-122289/p10059842'],
  ['lidl_10059843','Pyragėlis su 16 % lazdyno riešutų ir nugos kremo ir 12 % lazdyno riešutų įdaru, padengtas kakavinio glaisto juostelėmis',43.1,6.4,23.5,'https://www.lidl.lt/p/pyragelis-su-16-lazdyno-riesutu-ir-nugos-kremo-ir-12-lazdyno-riesutu-idaru-padengtas-kakavinio-glaisto-juostelemis-187307/p10059843'],
  ['lidl_10059844','Spurga su „YUZU“ įdaru',50,3.9,19,'https://www.lidl.lt/p/spurga-su-yuzu-idaru-7612753/p10059844'],
  ['lidl_10059845','Mielinės tešlos suktinukas su bešamelio padažu ir čederiu',25.7,7.8,18.9,'https://www.lidl.lt/p/mielines-teslos-suktinukas-su-besamelio-padazu-ir-cederiu-207369/p10059845'],
  ['lidl_10059846','Spurga su 37 % baltu ir 4 % kakaviniu glaistu',45,5,33,'https://www.lidl.lt/p/spurga-su-37-baltu-ir-4-kakaviniu-glaistu-159266/p10059846'],
  ['lidl_10059847','Madlenos su lazdyno riešutų ir kakavos įdaru',46,6.4,29,'https://www.lidl.lt/p/madlenos-su-lazdyno-riesutu-ir-kakavos-idaru-5606339/p10059847'],
  ['lidl_10059848','Brecelis su kremo įdaru',50,6.3,16,'https://www.lidl.lt/p/brecelis-su-kremo-idaru-186006/p10059848'],
  ['lidl_10059849','Sluoksniuotos tešlos bandelė su „La Vache qui rit®“ lydyto sūrio įdaru',33,9.2,18,'https://www.lidl.lt/p/sluoksniuotos-teslos-bandele-su-la-vache-qui-rit-lydyto-surio-idaru-1010479/p10059849'],
  ['lidl_10059850','Kruasanas su pistacijų įdaru, apibarstytas kukurūzų dribsniais',43.8,8.9,24.2,'https://www.lidl.lt/p/kruasanas-su-pistaciju-idaru-apibarstytas-kukuruzu-dribsniais-6019043/p10059850'],
  ['lidl_10059851','Kruasanas su pistacijų įdaru ir žaliu glaistu',47.5,7.3,24.2,'https://www.lidl.lt/p/kruasanas-su-pistaciju-idaru-ir-zaliu-glaistu-5570567/p10059851'],
  ['lidl_10059852','Tamsi duona su saulėgrąžomis',44,7,4.6,'https://www.lidl.lt/p/tamsi-duona-su-saulegrazomis-7613160/p10059852'],
  ['lidl_10059853','Bandelė su vanilės skonio įdaru',41,5.1,9.2,'https://www.lidl.lt/p/bandele-su-vaniles-skonio-idaru-7602260/p10059853'],
  ['lidl_10059854','Kvietinė bandelė su sėklomis',37,14,13.6,'https://www.lidl.lt/p/kvietine-bandele-su-seklomis-192844/p10059854'],
  ['lidl_10059855','Kibinas su kiaulienos ir suryminio sūrio įdaru',26,9.3,20,'https://www.lidl.lt/p/kibinas-su-kiaulienos-ir-suryminio-surio-idaru-7613223/p10059855'],
  ['lidl_10059856','Mini pyragėliai su vaniliniu įdaru',43,5.2,13.4,'https://www.lidl.lt/p/mini-pyrageliai-su-vaniliniu-idaru-7613161/p10059856'],
  ['lidl_10059857','Mini prancūziška bandelė „MEDOMI“',49,9.3,1.6,'https://www.lidl.lt/p/mini-prancuziska-bandele-medomi-7613195/p10059857'],
  ['lidl_10059858','Mini prancūziška bandelė su grūdais ir sėklomis „MEDOMI“',46,10,4.6,'https://www.lidl.lt/p/mini-prancuziska-bandele-su-grudais-ir-seklomis-medomi-7613194/p10059858'],
  ['lidl_10059859','Mielinės tešlos pyragėliai su 30 % grietinėlės likerio skonio įdaru, papuošti 3,3 % grietinėlės likerio skonio glajumi',49.3,5.6,6.6,'https://www.lidl.lt/p/mielines-teslos-pyrageliai-su-30-grietineles-likerio-skonio-idaru-papuosti-3-3-grietineles-likerio-skonio-glajumi-1016073/p10059859'],
  ['lidl_10059860','Sviestinis kruasanas su vaniliniu ir karameliniu įdaru',42.7,7,19,'https://www.lidl.lt/p/sviestinis-kruasanas-su-vaniliniu-ir-karameliniu-idaru-172241/p10059860'],
  ['lidl_10059861','Kvietinė bandelė su graikiniais riešutais ir medumi',43.2,9.9,11,'https://www.lidl.lt/p/kvietine-bandele-su-graikiniais-riesutais-ir-medumi-1007009/p10059861'],
  ['lidl_10059862','Cinamoninė bandelė su šokolado juostelėmis',46,5.7,16,'https://www.lidl.lt/p/cinamonine-bandele-su-sokolado-juostelemis-6506569/p10059862'],
  ['lidl_10059863','Biskvitinis pyragas su 15 % kreminiu įdaru, aplietas 26 % kakaviniu glaistu',53,5.9,27.7,'https://www.lidl.lt/p/biskvitinis-pyragas-su-15-kreminiu-idaru-aplietas-26-kakaviniu-glaistu-1000643/p10059863'],
  ['lidl_10059864','Užkandis su lėtai virta kiauliena',32.9,9,17.7,'https://www.lidl.lt/p/uzkandis-su-letai-virta-kiauliena-198608/p10059864'],
  ['lidl_10059865','Vyniotinis su 15% kremo įdaru, 22 % baltu glaistu, dekoruotas kokosų drožlėmis',48.7,4,31.8,'https://www.lidl.lt/p/vyniotinis-su-15-kremo-idaru-22-baltu-glaistu-dekoruotas-kokosu-drozlemis-1000644/p10059865'],
  ['lidl_10059866','Spurga su 23 % „Limoncello“ skonio įdaru',44,5.1,21,'https://www.lidl.lt/p/spurga-su-23-limoncello-skonio-idaru-227353/p10059866'],
  ['lidl_10059867','Kvietinės tešlos pyragėliai su gaudos sūriu',46,11,5.1,'https://www.lidl.lt/p/kvietines-teslos-pyrageliai-su-gaudos-suriu-51816/p10059867'],
  ['lidl_10059868','Degintas pyragas su kumpiu ir svogūnais',32.8,10.5,10.3,'https://www.lidl.lt/p/degintas-pyragas-su-kumpiu-ir-svogunais-208623/p10059868'],
  ['lidl_10059869','Mielinės tešlos spurgos su 31 % baltu glaistu ir 9 % karameliniais gabalėliais',44,6.3,30,'https://www.lidl.lt/p/mielines-teslos-spurgos-su-31-baltu-glaistu-ir-9-karameliniais-gabaleliais-1016854/p10059869'],
  ['lidl_10059870','Mielinė spurga su rožiniu glaistu ir cukriniais pabarstukais',48,4.9,28,'https://www.lidl.lt/p/mieline-spurga-su-roziniu-glaistu-ir-cukriniais-pabarstukais-1016855/p10059870'],
  ['lidl_10059871','Fokačija su alyvuogių aliejumi ir juodosiomis alyvuogėmis',45.7,7.1,4.7,'https://www.lidl.lt/p/fokacija-su-alyvuogiu-aliejumi-ir-juodosiomis-alyvuogemis-6905143/p10059871'],
  ['lidl_10059872','Spurga su kakavos ir lazdyno riešutų įdaru',50,5.2,20,'https://www.lidl.lt/p/spurga-su-kakavos-ir-lazdyno-riesutu-idaru-176848/p10059872'],
  ['lidl_10059873','„Milka“ spurga su įdaru',50.4,6.4,25,'https://www.lidl.lt/p/milka-spurga-su-idaru-165823/p10059873'],
  ['lidl_10059874','Šokoladinė spurga',49,6.1,27.8,'https://www.lidl.lt/p/sokoladine-spurga-1016279/p10059874'],
  ['lidl_10059875','„Crème Brûlée“ spurga',47.7,3.8,24.4,'https://www.lidl.lt/p/creme-brulee-spurga-1017242/p10059875'],
  ['lidl_10059876','Sluoksniuotos tešlos spurga su cukrumi',41,5.5,36,'https://www.lidl.lt/p/sluoksniuotos-teslos-spurga-su-cukrumi-159136/p10059876'],
  ['lidl_10059877','SUKUTIS SU KREMU IR ŠOKOLADO GABALIUKAIS. Kakavos sausųjų medžiagų šokolade - ne mažiau kaip 35 %',47.7,6.7,12.1,'https://www.lidl.lt/p/sukutis-su-kremu-ir-sokolado-gabaliukais-kakavos-sausuju-medziagu-sokolade-ne-maziau-kaip-35-85266/p10059877'],
  ['lidl_10059878','Mielinės tešlos pyragaitis, aplietas 26 % mėlynu glaistu ir 3,6 % spalvotais cukraus papuošimais',46,4,35,'https://www.lidl.lt/p/mielines-teslos-pyragaitis-aplietas-26-melynu-glaistu-ir-3-6-spalvotais-cukraus-papuosimais-169428/p10059878'],
  ['lidl_10059879','Pyragėlis su sūrio įdaru',31.8,8.7,14.9,'https://www.lidl.lt/p/pyragelis-su-surio-idaru-6206555/p10059879'],
  ['lidl_10059880','Picos užkandis „Vesuvio“ su saliamiu ir šonine',31,7.6,13,'https://www.lidl.lt/p/picos-uzkandis-vesuvio-su-saliamiu-ir-sonine-7613313/p10059880'],
  ['lidl_10059881','Spurga ASORTI su vaisiniu įdaru',46,6.1,12,'https://www.lidl.lt/p/spurga-asorti-su-vaisiniu-idaru-7613293/p10059881'],
  ['lidl_10059883','Bandelė su citrinų skonio kremu',47.1,5.3,6.2,'https://www.lidl.lt/p/bandele-su-citrinu-skonio-kremu-224039/p10059883'],
  ['lidl_10059884','Cinamoninė bandelė',54.8,5,15.4,'https://www.lidl.lt/p/cinamonine-bandele-7613355/p10059884'],
  ['lidl_10059885','Aguoninė bandelė',58.1,9.6,22.4,'https://www.lidl.lt/p/aguonine-bandele-7613358/p10059885'],
  ['lidl_10059886','Apkepta duona su sėklomis',42.5,9,8.5,'https://www.lidl.lt/p/apkepta-duona-su-seklomis-7207520/p10059886'],
  ['lidl_10059887','Prancūziškas batonas su traškia plutele',52.9,8,1.2,'https://www.lidl.lt/p/prancuziskas-batonas-su-traskia-plutele-144723/p10059887'],
  ['lidl_10059888','Pyragas su 50 % aguonų įdaru',45.4,8.8,25.2,'https://www.lidl.lt/p/pyragas-su-50-aguonu-idaru-6413977/p10059888'],
  ['lidl_10059889','Pyragas su 50 % graikinių riešutų įdaru',48.3,8.5,27,'https://www.lidl.lt/p/pyragas-su-50-graikiniu-riesutu-idaru-6414022/p10059889'],
  ['lidl_10059890','Mielinės tešlos brecelis padengtas cukrumi ir cinamonu',50,7.3,18,'https://www.lidl.lt/p/mielines-teslos-brecelis-padengtas-cukrumi-ir-cinamonu-5010182/p10059890'],
  ['lidl_10059891','Sluoksniuotos tešlos suktinukas su 40 % vaniliniu kremu',32.2,4.4,19,'https://www.lidl.lt/p/sluoksniuotos-teslos-suktinukas-su-40-vaniliniu-kremu-163753/p10059891'],
  ['lidl_10059892','Rankų darbo sluoksniuotos tešlos kibinas su su saldžiarūgščiu kiaulienos įdaru',27.4,7.9,16.1,'https://www.lidl.lt/p/ranku-darbo-sluoksniuotos-teslos-kibinas-su-su-saldziarugsciu-kiaulienos-idaru-7612438/p10059892'],
  ['lidl_10059893','Spurga su kakava, „Spekulatius“ sausainių įdaru ir sausainių gabaliukais',46.7,5.8,27.7,'https://www.lidl.lt/p/spurga-su-kakava-spekulatius-sausainiu-idaru-ir-sausainiu-gabaliukais-1015462/p10059893'],
  ['lidl_10059894','„Hot Dog“ bandelė su dešrele ir „BBQ“ padažu',27,10,10,'https://www.lidl.lt/p/hot-dog-bandele-su-desrele-ir-bbq-padazu-178744/p10059894'],
  ['lidl_10059895','Mielinė spurga su 14 % įvairių vaisių įdaru, aplieta 12 % baltu glaistu ir 4,8 % braškių skonio cukriniais pabarstukais',44,6.5,20,'https://www.lidl.lt/p/mieline-spurga-su-14-ivairiu-vaisiu-idaru-aplieta-12-baltu-glaistu-ir-4-8-braskiu-skonio-cukriniais-pabarstukais-209327/p10059895'],
  ['lidl_10059896','Kruasanas su kremo įdaru',55,6.3,8.4,'https://www.lidl.lt/p/kruasanas-su-kremo-idaru-229747/p10059896'],
  ['lidl_10059897','Pyragėlis su čoriso dešra',38.6,7.7,7,'https://www.lidl.lt/p/pyragelis-su-coriso-desra-5905014/p10059897'],
  ['lidl_10059899','Greitai užšaldyti kruasanai su riešutų nugos kremo įdaru, papuošti smulkintais lazdyno riešutais',46.5,7.9,24.7,'https://www.lidl.lt/p/greitai-uzsaldyti-kruasanai-su-riesutu-nugos-kremo-idaru-papuosti-smulkintais-lazdyno-riesutais-227543/p10059899'],
  ['lidl_10059900','Mini kruasanas su „Serrano“ kumpio ir sūrio įdaru',33,9.9,20.8,'https://www.lidl.lt/p/mini-kruasanas-su-serrano-kumpio-ir-surio-idaru-5721312/p10059900'],
  ['lidl_10059901','Mėlynas kibinas su su vištienos ir raudonųjų paprikų įdaru',25,10,18,'https://www.lidl.lt/p/melynas-kibinas-su-su-vistienos-ir-raudonuju-papriku-idaru-7613475/p10059901'],
  ['lidl_10059902','„Pastel de Nata“ – sluoksniuotos tešlos pyragaičiai su 63,2 % kremo įdaru',40,4.6,11.4,'https://www.lidl.lt/p/pastel-de-nata-sluoksniuotos-teslos-pyragaiciai-su-63-2-kremo-idaru-128974/p10059902'],
  ['lidl_10059903','Tamsi duona su kalendra',50.9,5.9,1.2,'https://www.lidl.lt/p/tamsi-duona-su-kalendra-7613360/p10059903'],
  ['lidl_10059904','Mielinės tešlos spurga, aplieta 27 % raudonu glajumi ir apibarstyta 2,4 % karamelizuotais kokosų gabaliukais',41,4.4,38,'https://www.lidl.lt/p/mielines-teslos-spurga-aplieta-27-raudonu-glajumi-ir-apibarstyta-2-4-karamelizuotais-kokosu-gabaliukais-184001/p10059904'],
  ['lidl_10059905','Suktinukas su sūriu ir špinatais',31.6,7.3,13.4,'https://www.lidl.lt/p/suktinukas-su-suriu-ir-spinatais-6209662/p10059905'],
  ['lidl_10059906','Spurga su 23 % „Bitter“ kokteilio skonio kremo įdaru',43,5,21,'https://www.lidl.lt/p/spurga-su-23-bitter-kokteilio-skonio-kremo-idaru-227355/p10059906'],
  ['lidl_10059907','Brecelis apibarstytas sūriu',47.3,11.3,6.3,'https://www.lidl.lt/p/brecelis-apibarstytas-suriu-99773/p10059907'],
  ['lidl_10059908','Mini prancūziškas batonas su sviesto, česnakų ir prieskoninių augalų ruošiniu',43,7.4,7,'https://www.lidl.lt/p/mini-prancuziskas-batonas-su-sviesto-cesnaku-ir-prieskoniniu-augalu-ruosiniu-184003/p10059908'],
  ['lidl_10059909','Pyragas su 13 % morkomis ir 11 % lazdyno riešutais, aplietas 20 % glajumi, papuoštas 5 % graikinių riešutų griliažu ir 2 % cukrumi',59.1,6.1,26.1,'https://www.lidl.lt/p/pyragas-su-13-morkomis-ir-11-lazdyno-riesutais-aplietas-20-glajumi-papuostas-5-graikiniu-riesutu-griliazu-ir-2-cukrumi-1014801/p10059909'],
  ['lidl_10059910','Mielinė spurga su 14 % kakaviniu glaistu ir 11 % skaldytais lazdyno riešutais',34,7.7,35,'https://www.lidl.lt/p/mieline-spurga-su-14-kakaviniu-glaistu-ir-11-skaldytais-lazdyno-riesutais-201130/p10059910'],
  ['lidl_10059912','Mielinės spurgos su 25 % obuolių įdaru',42.1,5.7,12,'https://www.lidl.lt/p/mielines-spurgos-su-25-obuoliu-idaru-208070/p10059912'],
  ['lidl_10059914','Kvietinių miltų pyragėlis su špinatais',21.8,3.9,12.9,'https://www.lidl.lt/p/kvietiniu-miltu-pyragelis-su-spinatais-6206551/p10059914'],
  ['lidl_10059915','Kepti pyragėliai įdaryti razinomis, korintinėmis razinomis ir obuoliais',38.5,6.1,10.4,'https://www.lidl.lt/p/kepti-pyrageliai-idaryti-razinomis-korintinemis-razinomis-ir-obuoliais-6605795/p10059915'],
  ['lidl_10059916','Mielinės tešlos spurga, aplieta 13,5 % kakaviniu glaistu',36.5,7.6,27.9,'https://www.lidl.lt/p/mielines-teslos-spurga-aplieta-13-5-kakaviniu-glaistu-153690/p10059916'],
  ['lidl_10059917','Spurga su sūriu karamele ir lazdyno riešutais',50.1,5.3,27.2,'https://www.lidl.lt/p/spurga-su-suriu-karamele-ir-lazdyno-riesutais-1018007/p10059917'],
  ['lidl_10060108','Spurga su 21 % karamelės skonio įdaru',48,4.5,21,'https://www.lidl.lt/p/spurga-su-21-karameles-skonio-idaru-159229/p10060108'],
  ['lidl_10060109','Mielinės tešlos spurga, aplieta 27 % raudonu glaistu apibarstyta 2,4 % karamelizuotais kokosų gabaliukais',41,4.4,38,'https://www.lidl.lt/p/mielines-teslos-spurga-aplieta-27-raudonu-glaistu-apibarstyta-2-4-karamelizuotais-kokosu-gabaliukais-184001/p10060109'],
  ['lidl_10060110','Spurgų rinkinys. 4 vnt',42,6,26,'https://www.lidl.lt/p/spurgu-rinkinys-4-vnt-178630/p10060110'],
  ['lidl_10060111','Keptos spurgos su razinomis, korintinėmis razinomis ir obuoliais',38.5,6.1,10.4,'https://www.lidl.lt/p/keptos-spurgos-su-razinomis-korintinemis-razinomis-ir-obuoliais-6605795/p10060111'],
  ['lidl_10060112','Spurgos su rožiniais pabarstukais',48,4.9,28,'https://www.lidl.lt/p/spurgos-su-roziniais-pabarstukais-201135/p10060112'],
  ['lidl_10060113','Mielinė spurga su 20 % įvairių vaisių įdaru, padengta 8 % žaliu glaistu ir spalvoto baltojo šokolado dekoracijomis, kakavos sviesto ir pieno miltelių pagrindu bei raudonais cukriniais pabarstukais',45.3,6.2,17.2,'https://www.lidl.lt/p/mieline-spurga-su-20-ivairiu-vaisiu-idaru-padengta-8-zaliu-glaistu-ir-spalvoto-baltojo-sokolado-dekoracijomis-kakavos-sviesto-ir-pieno-milteliu-pagrindu-bei-raudonais-cukriniais-pabarstukais-1022663/p10060113'],
  ['lidl_10060114','Duona iš kvietinių ir ruginių miltų',43,6.1,1,'https://www.lidl.lt/p/duona-is-kvietiniu-ir-ruginiu-miltu-7801546/p10060114'],
  ['lidl_10060115','Sūrio pyragas',35.1,6.8,16,'https://www.lidl.lt/p/surio-pyragas-1014434/p10060115'],
  ['lidl_10060116','Mielinės tešlos spurgos su 10 % cukrumi ir 0,2 % cinamonu',43.6,8.4,19.5,'https://www.lidl.lt/p/mielines-teslos-spurgos-su-10-cukrumi-ir-0-2-cinamonu-153770/p10060116'],
  ['lidl_10060117','Mielinės tešlos pyragėlis su 26 % lazdyno riešutų gaminiu, papuoštas 14 % graikiniais riešutais ir 4 % kakaviniu galumi',47.7,7.2,17.9,'https://www.lidl.lt/p/mielines-teslos-pyragelis-su-26-lazdyno-riesutu-gaminiu-papuostas-14-graikiniais-riesutais-ir-4-kakaviniu-galumi-173691/p10060117']
].map(([id,name,carbs,protein,fat,source])=>({id,restaurant:'lidl',restaurantLt:'Lidl',restaurantEn:'Lidl',lt:name,en:name,weight:100,per100:true,unit:'g',carbs,protein,fat,gi:null,source,restaurantCategory:lidlCategory(name),portions:[[50,'50 g','50 g'],[100,'100 g','100 g'],[150,'150 g','150 g']]}));
function lidlCategory(name){
  const n=name.toLocaleLowerCase('lt');
  if(/spurg/.test(n))return 'Spurgos';
  if(/kruasan/.test(n))return 'Kruasanai';
  if(/tort|keks|braun|vyniotin|madlen|pyragas|pyragaitis|biskvit/.test(n))return 'Pyragai ir desertai';
  if(/pica|kibin|užkand|štrudel|mės|kumpi|vištien|kiaulien|carbonara|sūri|feta|šonin|saliam|elnien|čeder|besamel/.test(n))return 'Sūrūs kepiniai';
  if(/duon|batonas|ciabatta|fokacija|riestain|beigel|brecel/.test(n))return 'Duona ir batonai';
  if(/bandel/.test(n))return 'Bandelės';
  return 'Saldūs kepiniai';
}
const brandFoods=[
  ['brand_snickers','Saldumynai','Sweets','Snickers batonėlis','Snickers bar',60,8.6,23,'g',[[25,'½ batonėlio · 25 g','½ bar · 25 g'],[50,'1 batonėlis · 50 g','1 bar · 50 g']]],
  ['brand_bounty','Saldumynai','Sweets','Bounty batonėlis','Bounty bar',59.6,3.9,25.6,'g',[[28.5,'1 batonėlis · 28,5 g','1 bar · 28.5 g'],[57,'Pakuotė (2 vnt.) · 57 g','Pack (2 bars) · 57 g']]],
  ['brand_twix','Saldumynai','Sweets','Twix','Twix',65,4.6,24,'g',[[25,'1 lazdelė · 25 g','1 finger · 25 g'],[50,'Pakuotė (2 vnt.) · 50 g','Pack (2 fingers) · 50 g']]],
  ['brand_milky_way','Saldumynai','Sweets','Milky Way batonėlis','Milky Way bar',71,3.8,16,'g',[[21.5,'1 batonėlis · 21,5 g','1 bar · 21.5 g'],[43,'2 batonėliai · 43 g','2 bars · 43 g']]],
  ['brand_kitkat','Saldumynai','Sweets','KitKat 4 Finger','KitKat 4 Finger',60.6,6.6,26.1,'g',[[10.4,'1 lazdelė · ~10 g','1 finger · ~10 g'],[41.5,'1 batonėlis · 41,5 g','1 bar · 41.5 g']]],
  ['brand_kinder_bueno','Saldumynai','Sweets','Kinder Bueno','Kinder Bueno',49.5,8.6,37.3,'g',[[21.5,'1 batonėlis · 21,5 g','1 bar · 21.5 g'],[43,'Pakuotė (2 vnt.) · 43 g','Pack (2 bars) · 43 g']]],
  ['brand_kinder_chocolate','Saldumynai','Sweets','Kinder Chocolate','Kinder Chocolate',53.5,8.7,35,'g',[[12.5,'1 batonėlis · 12,5 g','1 bar · 12.5 g'],[25,'2 batonėliai · 25 g','2 bars · 25 g']]],
  ['brand_ferrero_rocher','Saldumynai','Sweets','Ferrero Rocher','Ferrero Rocher',44.4,8.2,42.7,'g',[[12.5,'1 saldainis · 12,5 g','1 piece · 12.5 g'],[37.5,'3 saldainiai · 37,5 g','3 pieces · 37.5 g']]],
  ['brand_milka_alpine','Saldumynai','Sweets','Milka pieninis šokoladas','Milka Alpine Milk chocolate',57,6.5,31,'g',[[25,'¼ plytelės · 25 g','¼ bar · 25 g'],[50,'½ plytelės · 50 g','½ bar · 50 g'],[100,'1 plytelė · 100 g','1 bar · 100 g']]],
  ['brand_ritter_milk','Saldumynai','Sweets','Ritter Sport pieninis šokoladas','Ritter Sport Alpine Milk',54,8.2,32,'g',[[25,'¼ plytelės · 25 g','¼ bar · 25 g'],[50,'½ plytelės · 50 g','½ bar · 50 g'],[100,'1 plytelė · 100 g','1 bar · 100 g']]],
  ['brand_ritter_marzipan','Saldumynai','Sweets','Ritter Sport su marcipanu','Ritter Sport Marzipan',52,7,27,'g',[[25,'¼ plytelės · 25 g','¼ bar · 25 g'],[50,'½ plytelės · 50 g','½ bar · 50 g'],[100,'1 plytelė · 100 g','1 bar · 100 g']]],
  ['brand_toblerone','Saldumynai','Sweets','Toblerone','Toblerone',61,5.6,28,'g',[[8.3,'1 trikampėlis · ~8 g','1 triangle · ~8 g'],[35,'Batonėlis · 35 g','Bar · 35 g'],[100,'100 g','100 g']]],
  ['brand_mms_peanut','Saldumynai','Sweets','M&M’s su žemės riešutais','M&M’s Peanut',60,9.7,26,'g',[[45,'1 pakelis · 45 g','1 pack · 45 g'],[90,'Didelis pakelis · 90 g','Large pack · 90 g']]],
  ['brand_mms_chocolate','Saldumynai','Sweets','M&M’s šokoladiniai','M&M’s Chocolate',70,5.2,19,'g',[[45,'1 pakelis · 45 g','1 pack · 45 g'],[90,'Didelis pakelis · 90 g','Large pack · 90 g']]],
  ['brand_skittles','Saldumynai','Sweets','Skittles Fruits','Skittles Fruits',89,0,4.2,'g',[[19,'½ pakelio · 19 g','½ pack · 19 g'],[38,'1 pakelis · 38 g','1 pack · 38 g']]],
  ['brand_haribo_goldbears','Saldumynai','Sweets','Haribo Goldbären guminukai','Haribo Goldbears',77,6.9,0.5,'g',[[25,'Sauja · ~25 g','Handful · ~25 g'],[100,'Pakelis · 100 g','Bag · 100 g']]],
  ['brand_nutella','Saldumynai','Sweets','Nutella','Nutella',57.5,6.3,30.9,'g',[[15,'1 valgomasis šaukštas · 15 g','1 tablespoon · 15 g'],[30,'2 valgomieji šaukštai · 30 g','2 tablespoons · 30 g']]],
  ['brand_oreo','Saldumynai','Sweets','Oreo Original sausainiai','Oreo Original cookies',67,5.6,19,'g',[[11,'1 sausainis · 11 g','1 cookie · 11 g'],[33,'3 sausainiai · 33 g','3 cookies · 33 g']]],
  ['brand_belvita_honey','Pusryčių dribsniai','Breakfast cereal','belVita Original su medumi','belVita Original with honey',68,7.4,15,'g',[[50,'1 pakelis (4 sausainiai) · 50 g','1 pack (4 biscuits) · 50 g']]],
  ['brand_belvita_chocolate','Pusryčių dribsniai','Breakfast cereal','belVita su šokoladu','belVita with chocolate',66,7.9,14,'g',[[50,'1 pakelis (4 sausainiai) · 50 g','1 pack (4 biscuits) · 50 g']]],
  ['brand_magnum_classic','Desertai','Desserts','Magnum Classic ledai','Magnum Classic ice cream',30,3.3,19,'g',[[75,'1 ledai · ~75 g','1 ice cream · ~75 g']]],
  ['brand_lays_paprika','Užkandžiai','Snacks','Lay’s paprikų skonio traškučiai','Lay’s Paprika crisps',54,6,29,'g',[[30,'Sauja · 30 g','Handful · 30 g'],[60,'60 g','60 g']]],
  ['brand_pringles_sourcream','Užkandžiai','Snacks','Pringles Sour Cream & Onion','Pringles Sour Cream & Onion',54,6.3,30,'g',[[30,'~13 traškučių · 30 g','~13 crisps · 30 g'],[60,'60 g','60 g']]],
  ['brand_doritos_nacho','Užkandžiai','Snacks','Doritos Nacho Cheese','Doritos Nacho Cheese',61,6.8,22,'g',[[30,'Sauja · 30 g','Handful · 30 g'],[60,'60 g','60 g']]],
  ['brand_coca_cola','Gėrimai','Drinks','Coca-Cola','Coca-Cola',10.6,0,0,'ml',[[250,'1 stiklinė · 250 ml','1 glass · 250 ml'],[330,'1 skardinė · 330 ml','1 can · 330 ml'],[500,'1 butelis · 500 ml','1 bottle · 500 ml']]],
  ['brand_coca_cola_zero','Gėrimai','Drinks','Coca-Cola Zero','Coca-Cola Zero',0,0,0,'ml',[[330,'1 skardinė · 330 ml','1 can · 330 ml'],[500,'1 butelis · 500 ml','1 bottle · 500 ml']]],
  ['brand_red_bull','Gėrimai','Drinks','Red Bull Energy Drink','Red Bull Energy Drink',11,0,0,'ml',[[250,'1 skardinė · 250 ml','1 can · 250 ml'],[355,'Didelė skardinė · 355 ml','Large can · 355 ml']]],
  ['brand_monster_ultra','Gėrimai','Drinks','Monster Ultra (be cukraus)','Monster Ultra (sugar-free)',0.9,0,0,'ml',[[500,'1 skardinė · 500 ml','1 can · 500 ml']]]
].map(([id,catLt,catEn,lt,en,carbs,protein,fat,unit,portions])=>({id,catLt,catEn,lt,en,carbs,protein,fat,gi:null,unit,portions,brand:true}));
foodCatalog.push(...brandFoods);
const usdaFoods=[
  ['fd_cherries_sweet','Vaisiai','Fruit','Trešnės','Sweet cherries',16,1.1,0.2,'g',[[70,'10 trešnių · ~70 g','10 cherries · ~70 g'],[140,'1 stiklinė · ~140 g','1 cup · ~140 g']],171719],
  ['fd_cherries_sour','Vaisiai','Fruit','Vyšnios','Sour cherries',12.2,1,0.3,'g',[[75,'½ stiklinės · ~75 g','½ cup · ~75 g'],[150,'1 stiklinė · ~150 g','1 cup · ~150 g']],173954],
  ['fd_plums','Vaisiai','Fruit','Slyvos','Plums',11.4,0.7,0.3,'g',[[65,'1 slyva · ~65 g','1 plum · ~65 g'],[130,'2 slyvos · ~130 g','2 plums · ~130 g']],169949],
  ['fd_apricots','Vaisiai','Fruit','Abrikosai','Apricots',11.1,1.4,0.4,'g',[[35,'1 abrikosas · ~35 g','1 apricot · ~35 g'],[105,'3 abrikosai · ~105 g','3 apricots · ~105 g']],171697],
  ['fd_nectarine','Vaisiai','Fruit','Nektarinas','Nectarine',10.6,1.1,0.3,'g',[[140,'1 vidutinis nektarinas · ~140 g','1 medium nectarine · ~140 g']],169914],
  ['fd_melon','Vaisiai','Fruit','Melionas','Honeydew melon',9.1,0.5,0.1,'g',[[150,'1 riekė · ~150 g','1 slice · ~150 g'],[300,'2 riekės · ~300 g','2 slices · ~300 g']],169911],
  ['fd_blackcurrants','Vaisiai','Fruit','Juodieji serbentai','Blackcurrants',15.4,1.4,0.4,'g',[[55,'½ stiklinės · ~55 g','½ cup · ~55 g'],[110,'1 stiklinė · ~110 g','1 cup · ~110 g']],173963],
  ['fd_redcurrants','Vaisiai','Fruit','Raudonieji serbentai','Redcurrants',13.8,1.4,0.2,'g',[[55,'½ stiklinės · ~55 g','½ cup · ~55 g'],[110,'1 stiklinė · ~110 g','1 cup · ~110 g']],173964],
  ['fd_gooseberries','Vaisiai','Fruit','Agrastai','Gooseberries',10.2,0.9,0.6,'g',[[75,'½ stiklinės · ~75 g','½ cup · ~75 g'],[150,'1 stiklinė · ~150 g','1 cup · ~150 g']],173030],
  ['fd_blackberries','Vaisiai','Fruit','Gervuogės','Blackberries',9.6,1.4,0.5,'g',[[70,'½ stiklinės · ~70 g','½ cup · ~70 g'],[145,'1 stiklinė · ~145 g','1 cup · ~145 g']],173946],
  ['fd_cranberries','Vaisiai','Fruit','Spanguolės','Cranberries',12,0.5,0.1,'g',[[50,'½ stiklinės · ~50 g','½ cup · ~50 g'],[100,'1 stiklinė · ~100 g','1 cup · ~100 g']],171722],
  ['fd_lemon','Vaisiai','Fruit','Citrina','Lemon',9.3,1.1,0.3,'g',[[58,'1 citrina · ~58 g','1 lemon · ~58 g']],167746],
  ['fd_grapefruit','Vaisiai','Fruit','Greipfrutas','Grapefruit',10.7,0.8,0.1,'g',[[120,'½ greipfruto · ~120 g','½ grapefruit · ~120 g'],[240,'1 greipfrutas · ~240 g','1 grapefruit · ~240 g']],174673],
  ['fd_mandarin','Vaisiai','Fruit','Mandarinas','Mandarin',13.3,0.8,0.3,'g',[[75,'1 mandarinas · ~75 g','1 mandarin · ~75 g'],[150,'2 mandarinai · ~150 g','2 mandarins · ~150 g']],169105],
  ['fd_pomegranate','Vaisiai','Fruit','Granatas','Pomegranate',18.7,1.7,1.2,'g',[[90,'½ granato sėklų · ~90 g','½ pomegranate seeds · ~90 g'],[175,'1 stiklinė sėklų · ~175 g','1 cup seeds · ~175 g']],169134],
  ['fd_figs_dried','Vaisiai','Fruit','Figos, džiovintos','Dried figs',63.9,3.3,0.9,'g',[[20,'1 figa · ~20 g','1 fig · ~20 g'],[60,'3 figos · ~60 g','3 figs · ~60 g']],174665],
  ['fd_prunes','Vaisiai','Fruit','Džiovintos slyvos','Prunes',63.9,2.2,0.4,'g',[[10,'1 vnt. · ~10 g','1 prune · ~10 g'],[40,'4 vnt. · ~40 g','4 prunes · ~40 g']],168162],
  ['fd_apricots_dried','Vaisiai','Fruit','Džiovinti abrikosai','Dried apricots',62.6,3.4,0.5,'g',[[8,'1 vnt. · ~8 g','1 piece · ~8 g'],[40,'5 vnt. · ~40 g','5 pieces · ~40 g']],173941],
  ['fd_applesauce','Vaisiai','Fruit','Obuolių tyrė, nesaldinta','Applesauce, unsweetened',11.3,0.2,0.1,'g',[[60,'1 indelis · ~60 g','1 pouch · ~60 g'],[120,'½ stiklinės · ~120 g','½ cup · ~120 g']],167772],
  ['fd_cabbage','Daržovės','Vegetables','Baltagūžis kopūstas','White cabbage',5.8,1.3,0.1,'g',[[70,'1 stiklinė tarkuoto · ~70 g','1 cup shredded · ~70 g'],[150,'150 g','150 g']],169975],
  ['fd_sauerkraut','Daržovės','Vegetables','Rauginti kopūstai','Sauerkraut',4.3,0.9,0.1,'g',[[70,'½ stiklinės · ~70 g','½ cup · ~70 g'],[140,'1 stiklinė · ~140 g','1 cup · ~140 g']],169279],
  ['fd_beetroot','Daržovės','Vegetables','Burokėliai, virti','Beetroot, boiled',10,1.7,0.2,'g',[[50,'1 mažas burokėlis · ~50 g','1 small beet · ~50 g'],[85,'½ stiklinės griežinėlių · ~85 g','½ cup slices · ~85 g']],169146],
  ['fd_bell_pepper','Daržovės','Vegetables','Raudonoji paprika','Red bell pepper',6,1,0.3,'g',[[60,'½ paprikos · ~60 g','½ pepper · ~60 g'],[120,'1 paprika · ~120 g','1 pepper · ~120 g']],170108],
  ['fd_onion','Daržovės','Vegetables','Svogūnas','Onion',9.3,1.1,0.1,'g',[[40,'½ svogūno · ~40 g','½ onion · ~40 g'],[110,'1 vidutinis svogūnas · ~110 g','1 medium onion · ~110 g']],170000],
  ['fd_zucchini','Daržovės','Vegetables','Cukinija','Zucchini',3.1,1.2,0.3,'g',[[100,'½ cukinijos · ~100 g','½ zucchini · ~100 g'],[200,'1 cukinija · ~200 g','1 zucchini · ~200 g']],169291],
  ['fd_pumpkin','Daržovės','Vegetables','Moliūgas, virtas','Pumpkin, boiled',4.9,0.7,0.1,'g',[[120,'½ stiklinės · ~120 g','½ cup · ~120 g'],[245,'1 stiklinė · ~245 g','1 cup · ~245 g']],168449],
  ['fd_spinach','Daržovės','Vegetables','Špinatai','Spinach',3.6,2.9,0.4,'g',[[30,'1 stiklinė · ~30 g','1 cup · ~30 g'],[90,'3 saujos · ~90 g','3 handfuls · ~90 g']],168462],
  ['fd_lettuce','Daržovės','Vegetables','Lapinės salotos','Lettuce',2.9,1.4,0.2,'g',[[35,'1 stiklinė · ~35 g','1 cup · ~35 g'],[70,'2 stiklinės · ~70 g','2 cups · ~70 g']],169249],
  ['fd_mushrooms','Daržovės','Vegetables','Pievagrybiai','Mushrooms',3.3,3.1,0.3,'g',[[70,'1 stiklinė griežinėlių · ~70 g','1 cup sliced · ~70 g'],[140,'140 g','140 g']],169251],
  ['fd_green_beans','Daržovės','Vegetables','Šparaginės pupelės, virtos','Green beans, boiled',7.9,1.9,0.3,'g',[[60,'½ stiklinės · ~60 g','½ cup · ~60 g'],[125,'1 stiklinė · ~125 g','1 cup · ~125 g']],169141],
  ['fd_radish','Daržovės','Vegetables','Ridikėliai','Radishes',3.4,0.7,0.1,'g',[[45,'5 ridikėliai · ~45 g','5 radishes · ~45 g'],[115,'1 stiklinė · ~115 g','1 cup · ~115 g']],169276],
  ['fd_eggplant','Daržovės','Vegetables','Baklažanas','Eggplant',5.9,1,0.2,'g',[[80,'1 stiklinė kubelių · ~80 g','1 cup cubed · ~80 g'],[160,'160 g','160 g']],169228],
  ['fd_potato_baked','Daržovės','Vegetables','Bulvės, keptos su lupena','Baked potato with skin',21.2,2.5,0.1,'g',[[140,'1 maža bulvė · ~140 g','1 small potato · ~140 g'],[200,'1 vidutinė bulvė · ~200 g','1 medium potato · ~200 g']],170093],
  ['fd_mashed_potato','Daržovės','Vegetables','Bulvių košė','Mashed potatoes',16.8,1.9,4.2,'g',[[105,'½ stiklinės · ~105 g','½ cup · ~105 g'],[210,'1 stiklinė · ~210 g','1 cup · ~210 g']],168555],
  ['fd_fries_oven','Daržovės','Vegetables','Bulvytės, keptos orkaitėje','Oven fries',28.7,2.7,5.2,'g',[[70,'Maža porcija · ~70 g','Small serving · ~70 g'],[120,'Vidutinė porcija · ~120 g','Medium serving · ~120 g']],170118],
  ['fd_rice_white','Grūdai','Grains','Balti ryžiai, virti','White rice, cooked',28.2,2.7,0.3,'g',[[80,'½ stiklinės · ~80 g','½ cup · ~80 g'],[160,'1 stiklinė · ~160 g','1 cup · ~160 g']],168878],
  ['fd_millet','Grūdai','Grains','Soros, virtos','Millet, cooked',23.7,3.5,1,'g',[[85,'½ stiklinės · ~85 g','½ cup · ~85 g'],[175,'1 stiklinė · ~175 g','1 cup · ~175 g']],168871],
  ['fd_barley','Grūdai','Grains','Perlinės kruopos, virtos','Pearl barley, cooked',28.2,2.3,0.4,'g',[[80,'½ stiklinės · ~80 g','½ cup · ~80 g'],[155,'1 stiklinė · ~155 g','1 cup · ~155 g']],170285],
  ['fd_rice_noodles','Grūdai','Grains','Ryžių makaronai, virti','Rice noodles, cooked',24,1.8,0.2,'g',[[90,'½ stiklinės · ~90 g','½ cup · ~90 g'],[175,'1 stiklinė · ~175 g','1 cup · ~175 g']],168914],
  ['fd_oat_flakes','Pusryčių dribsniai','Breakfast cereal','Avižiniai dribsniai (sausi)','Rolled oats (dry)',67.7,13.2,6.5,'g',[[40,'½ stiklinės · ~40 g','½ cup · ~40 g'],[80,'1 stiklinė · ~80 g','1 cup · ~80 g']],173904],
  ['fd_wheat_flour','Grūdai','Grains','Kvietiniai miltai','Wheat flour',76.3,10.3,1,'g',[[8,'1 valg. šaukštas · ~8 g','1 tablespoon · ~8 g'],[125,'1 stiklinė · ~125 g','1 cup · ~125 g']],168894],
  ['fd_baguette','Duona','Bread','Prancūziškas batonas','Baguette',51.9,10.8,2.4,'g',[[30,'1 riekė · ~30 g','1 slice · ~30 g'],[60,'2 riekės · ~60 g','2 slices · ~60 g']],172675],
  ['fd_wholewheat_bread','Duona','Bread','Pilno grūdo duona','Wholemeal bread',42.7,12.4,3.5,'g',[[32,'1 riekė · ~32 g','1 slice · ~32 g'],[64,'2 riekės · ~64 g','2 slices · ~64 g']],172688],
  ['fd_croissant','Duona','Bread','Sviestinis kruasanas','Butter croissant',45.8,8.2,21,'g',[[45,'1 mažas kruasanas · ~45 g','1 small croissant · ~45 g'],[60,'1 vidutinis kruasanas · ~60 g','1 medium croissant · ~60 g']],174987],
  ['fd_burger_bun','Duona','Bread','Mėsainio bandelė','Burger bun',50.1,9.8,3.9,'g',[[45,'1 bandelė · ~45 g','1 bun · ~45 g']],172796],
  ['fd_beans_white','Ankštiniai','Legumes','Baltos pupelės, virtos','White beans, cooked',25.1,9.7,0.4,'g',[[90,'½ stiklinės · ~90 g','½ cup · ~90 g'],[180,'1 stiklinė · ~180 g','1 cup · ~180 g']],175203],
  ['fd_peas_split','Ankštiniai','Legumes','Skaldyti žirniai, virti','Split peas, cooked',21.1,8.3,0.4,'g',[[100,'½ stiklinės · ~100 g','½ cup · ~100 g'],[195,'1 stiklinė · ~195 g','1 cup · ~195 g']],172429],
  ['fd_milk_skim','Pieno produktai','Dairy','Liesas pienas','Skimmed milk',5,3.4,0.1,'ml',[[200,'1 stiklinė · ~200 ml','1 glass · ~200 ml'],[250,'250 ml','250 ml']],171269],
  ['fd_sour_cream','Pieno produktai','Dairy','Grietinė','Sour cream',4.6,2.4,19.4,'g',[[15,'1 valg. šaukštas · ~15 g','1 tablespoon · ~15 g'],[60,'¼ stiklinės · ~60 g','¼ cup · ~60 g']],171257],
  ['fd_cream','Pieno produktai','Dairy','Grietinėlė, riebi','Heavy cream',2.8,2.8,36.1,'ml',[[15,'1 valg. šaukštas · ~15 ml','1 tablespoon · ~15 ml'],[60,'¼ stiklinės · ~60 ml','¼ cup · ~60 ml']],170859],
  ['fd_mozzarella','Pieno produktai','Dairy','Mocarela','Mozzarella',2.4,22.2,22.1,'g',[[30,'1 riekelė · ~30 g','1 slice · ~30 g'],[125,'1 rutulys · ~125 g','1 ball · ~125 g']],170845],
  ['fd_feta','Pieno produktai','Dairy','Feta sūris','Feta',3.9,14.2,21.5,'g',[[30,'30 g','30 g'],[60,'60 g','60 g']],173420],
  ['fd_gouda','Pieno produktai','Dairy','Gauda sūris','Gouda',2.2,24.9,27.4,'g',[[20,'1 riekelė · ~20 g','1 slice · ~20 g'],[40,'2 riekelės · ~40 g','2 slices · ~40 g']],171241],
  ['fd_parmesan','Pieno produktai','Dairy','Parmezanas','Parmesan',3.2,35.8,25,'g',[[5,'1 valg. šaukštas tarkuoto · ~5 g','1 tablespoon grated · ~5 g'],[20,'20 g','20 g']],170848],
  ['fd_butter','Pieno produktai','Dairy','Sviestas','Butter',0.1,0.8,81.1,'g',[[5,'1 arb. šaukštelis · ~5 g','1 teaspoon · ~5 g'],[14,'1 valg. šaukštas · ~14 g','1 tablespoon · ~14 g']],173410],
  ['fd_chicken_thigh','Mėsa ir žuvis','Meat & fish','Vištienos šlaunelė, kepta','Chicken thigh, roasted',0,24.8,8.2,'g',[[100,'1 šlaunelė · ~100 g','1 thigh · ~100 g']],172388],
  ['fd_beef_mince','Mėsa ir žuvis','Meat & fish','Jautienos faršas, keptas','Minced beef, cooked',0,25.9,15.4,'g',[[100,'100 g','100 g'],[150,'150 g','150 g']],174032],
  ['fd_ham','Mėsa ir žuvis','Meat & fish','Kumpis','Ham',3.6,16.6,8.8,'g',[[25,'1 riekelė · ~25 g','1 slice · ~25 g'],[50,'2 riekelės · ~50 g','2 slices · ~50 g']],173864],
  ['fd_herring','Mėsa ir žuvis','Meat & fish','Silkė, marinuota','Pickled herring',9.6,14.2,18,'g',[[50,'50 g','50 g'],[100,'100 g','100 g']],175118],
  ['fd_mackerel','Mėsa ir žuvis','Meat & fish','Skumbrė, kepta','Mackerel, cooked',0,23.8,17.8,'g',[[100,'100 g','100 g'],[150,'150 g','150 g']],175120],
  ['fd_shrimp','Mėsa ir žuvis','Meat & fish','Krevetės, virtos','Shrimp, cooked',0.2,24,0.3,'g',[[85,'85 g','85 g'],[150,'150 g','150 g']],175180],
  ['fd_sardines','Mėsa ir žuvis','Meat & fish','Sardinės aliejuje','Sardines in oil',0,24.6,11.4,'g',[[90,'1 skardinė · ~90 g','1 can · ~90 g']],175139],
  ['fd_egg_fried','Kiaušiniai','Eggs','Kiaušinis, keptas','Fried egg',0.8,13.6,14.8,'g',[[46,'1 kiaušinis · ~46 g','1 egg · ~46 g'],[92,'2 kiaušiniai · ~92 g','2 eggs · ~92 g']],173423],
  ['fd_omelet','Kiaušiniai','Eggs','Omletas','Omelette',0.6,10.6,11.7,'g',[[60,'Iš 1 kiaušinio · ~60 g','From 1 egg · ~60 g'],[120,'Iš 2 kiaušinių · ~120 g','From 2 eggs · ~120 g']],172185],
  ['fd_hazelnuts','Riešutai ir sėklos','Nuts & seeds','Lazdyno riešutai','Hazelnuts',16.7,15,60.8,'g',[[15,'Sauja (~10 vnt.) · ~15 g','Handful (~10) · ~15 g'],[30,'30 g','30 g']],170581],
  ['fd_pistachios','Riešutai ir sėklos','Nuts & seeds','Pistacijos','Pistachios',27.2,20.2,45.3,'g',[[15,'Sauja · ~15 g','Handful · ~15 g'],[30,'30 g','30 g']],170184],
  ['fd_sunflower_seeds','Riešutai ir sėklos','Nuts & seeds','Saulėgrąžos (lukštentos)','Sunflower seeds',20,20.8,51.5,'g',[[10,'1 valg. šaukštas · ~10 g','1 tablespoon · ~10 g'],[30,'30 g','30 g']],170562],
  ['fd_chia','Riešutai ir sėklos','Nuts & seeds','Chia sėklos','Chia seeds',42.1,16.5,30.7,'g',[[12,'1 valg. šaukštas · ~12 g','1 tablespoon · ~12 g'],[25,'2 valg. šaukštai · ~25 g','2 tablespoons · ~25 g']],170554],
  ['fd_flaxseed','Riešutai ir sėklos','Nuts & seeds','Linų sėmenys','Flaxseed',28.9,18.3,42.2,'g',[[10,'1 valg. šaukštas · ~10 g','1 tablespoon · ~10 g'],[20,'2 valg. šaukštai · ~20 g','2 tablespoons · ~20 g']],169414],
  ['fd_peanuts','Riešutai ir sėklos','Nuts & seeds','Žemės riešutai','Peanuts',16.1,25.8,49.2,'g',[[15,'Sauja · ~15 g','Handful · ~15 g'],[30,'30 g','30 g']],172430],
  ['fd_sugar','Saldumynai','Sweets','Cukrus','Sugar',100,0,0,'g',[[4,'1 arb. šaukštelis · ~4 g','1 teaspoon · ~4 g'],[12,'1 valg. šaukštas · ~12 g','1 tablespoon · ~12 g']],169655],
  ['fd_jam','Saldumynai','Sweets','Uogienė','Jam',68.9,0.4,0.1,'g',[[20,'1 valg. šaukštas · ~20 g','1 tablespoon · ~20 g'],[40,'2 valg. šaukštai · ~40 g','2 tablespoons · ~40 g']],169641],
  ['fd_milk_choc','Saldumynai','Sweets','Pieninis šokoladas','Milk chocolate',59.4,7.6,29.7,'g',[[10,'1 kvadratėlis · ~10 g','1 square · ~10 g'],[25,'¼ plytelės · ~25 g','¼ bar · ~25 g']],167587],
  ['fd_butter_cookies','Saldumynai','Sweets','Sviestiniai sausainiai','Butter cookies',68.9,6.1,18.8,'g',[[10,'1 sausainis · ~10 g','1 cookie · ~10 g'],[30,'3 sausainiai · ~30 g','3 cookies · ~30 g']],174950],
  ['fd_pizza_cheese','Užkandžiai','Snacks','Pica su sūriu','Cheese pizza',29,10.4,12.3,'g',[[100,'1 gabalas · ~100 g','1 slice · ~100 g'],[200,'2 gabalai · ~200 g','2 slices · ~200 g']],170317],
  ['fd_maple_syrup','Saldumynai','Sweets','Klevų sirupas','Maple syrup',67,0,0.1,'g',[[20,'1 valg. šaukštas · ~20 g','1 tablespoon · ~20 g'],[40,'2 valg. šaukštai · ~40 g','2 tablespoons · ~40 g']],169661],
  ['fd_apple_juice','Gėrimai','Drinks','Obuolių sultys','Apple juice',11.3,0.1,0.1,'ml',[[200,'1 stiklinė · ~200 ml','1 glass · ~200 ml'],[330,'330 ml','330 ml']],173933],
  ['fd_beer','Gėrimai','Drinks','Alus','Beer',3.6,0.5,0,'ml',[[330,'1 butelis · 330 ml','1 bottle · 330 ml'],[500,'0,5 l · 500 ml','0.5 l · 500 ml']],168746],
  ['fd_wine_red','Gėrimai','Drinks','Raudonasis vynas','Red wine',2.6,0.1,0,'ml',[[150,'1 taurė · ~150 ml','1 glass · ~150 ml']],173190],
  ['fd_wine_white','Gėrimai','Drinks','Baltasis vynas','White wine',2.6,0.1,0,'ml',[[150,'1 taurė · ~150 ml','1 glass · ~150 ml']],174837]
].map(([id,catLt,catEn,lt,en,carbs,protein,fat,unit,portions,fdcId])=>({id,catLt,catEn,lt,en,carbs,protein,fat,gi:null,unit,portions,fdcId,source:'https://fdc.nal.usda.gov/food-details/'+fdcId+'/nutrients'}));
foodCatalog.push(...usdaFoods);
foodCatalog.forEach(f=>{
  if(f.mealTypes)return;
  const category=String(f.catEn||'').toLowerCase();
  f.mealTypes=category.includes('fruit')||category.includes('sweet')?['snack','breakfast']:
    category.includes('grain')||category.includes('bread')?['breakfast','lunch','dinner']:
    category.includes('dairy')?['breakfast','snack']:
    category.includes('vegetable')||category.includes('legume')?['lunch','dinner']:['snack','breakfast','lunch','dinner'];
});

const householdPortionPresets={
  apple:[[45,'¼ obuolio · ~45 g','¼ apple · ~45 g'],[90,'½ obuolio · ~90 g','½ apple · ~90 g'],[180,'1 vidutinis obuolys · ~180 g','1 medium apple · ~180 g'],[220,'1 didelis obuolys · ~220 g','1 large apple · ~220 g']],
  pear:[[80,'½ kriaušės · ~80 g','½ pear · ~80 g'],[140,'1 maža kriaušė · ~140 g','1 small pear · ~140 g'],[180,'1 vidutinė kriaušė · ~180 g','1 medium pear · ~180 g'],[230,'1 didelė kriaušė · ~230 g','1 large pear · ~230 g']],
  banana:[[60,'½ banano · ~60 g','½ banana · ~60 g'],[100,'1 mažas bananas · ~100 g','1 small banana · ~100 g'],[120,'1 vidutinis bananas · ~120 g','1 medium banana · ~120 g'],[150,'1 didelis bananas · ~150 g','1 large banana · ~150 g']],
  orange:[[65,'½ apelsino · ~65 g','½ orange · ~65 g'],[130,'1 mažas apelsinas · ~130 g','1 small orange · ~130 g'],[180,'1 vidutinis apelsinas · ~180 g','1 medium orange · ~180 g'],[220,'1 didelis apelsinas · ~220 g','1 large orange · ~220 g']],
  peach:[[75,'½ persiko · ~75 g','½ peach · ~75 g'],[120,'1 mažas persikas · ~120 g','1 small peach · ~120 g'],[150,'1 vidutinis persikas · ~150 g','1 medium peach · ~150 g'],[180,'1 didelis persikas · ~180 g','1 large peach · ~180 g']],
  kiwi:[[70,'1 kivis · ~70 g','1 kiwi · ~70 g'],[140,'2 kiviai · ~140 g','2 kiwis · ~140 g'],[210,'3 kiviai · ~210 g','3 kiwis · ~210 g']],
  grapes:[[75,'½ stiklinės vynuogių · ~75 g','½ cup grapes · ~75 g'],[150,'1 stiklinė · ~150 g','1 cup · ~150 g'],[225,'1½ stiklinės · ~225 g','1½ cups · ~225 g'],[300,'2 stiklinės · ~300 g','2 cups · ~300 g']],
  strawberries:[[75,'~5 braškės · ~75 g','~5 strawberries · ~75 g'],[150,'1 stiklinė braškių · ~150 g','1 cup strawberries · ~150 g'],[225,'1 dubenėlis · ~225 g','1 bowl · ~225 g']],
  raspberries:[[60,'½ stiklinės aviečių · ~60 g','½ cup raspberries · ~60 g'],[120,'1 stiklinė · ~120 g','1 cup · ~120 g'],[180,'1½ stiklinės · ~180 g','1½ cups · ~180 g']],
  blueberry:[[75,'½ stiklinės mėlynių · ~75 g','½ cup blueberries · ~75 g'],[150,'1 stiklinė · ~150 g','1 cup · ~150 g'],[225,'1½ stiklinės · ~225 g','1½ cups · ~225 g']],
  watermelon:[[150,'1 riekė · ~150 g','1 wedge · ~150 g'],[300,'1 dubenėlis · ~300 g','1 bowl · ~300 g'],[500,'Didelė porcija · ~500 g','Large portion · ~500 g']],
  avocado:[[50,'¼ avokado · ~50 g','¼ avocado · ~50 g'],[75,'½ avokado · ~75 g','½ avocado · ~75 g'],[150,'1 avokadas · ~150 g','1 avocado · ~150 g']],
  basmati:[[15,'1 valgomasis šaukštas · ~15 g','1 tablespoon · ~15 g'],[85,'½ stiklinės virtų ryžių · ~85 g','½ cup cooked rice · ~85 g'],[150,'1 kumštis virtų ryžių · ~150 g','1 fist of cooked rice · ~150 g'],[170,'1 stiklinė virtų ryžių · ~170 g','1 cup cooked rice · ~170 g'],[250,'1 dubenėlis · ~250 g','1 bowl · ~250 g']],
  jasmine:[[15,'1 valgomasis šaukštas · ~15 g','1 tablespoon · ~15 g'],[100,'½ stiklinės virtų ryžių · ~100 g','½ cup cooked rice · ~100 g'],[150,'1 kumštis virtų ryžių · ~150 g','1 fist of cooked rice · ~150 g'],[198,'1 stiklinė virtų ryžių · ~198 g','1 cup cooked rice · ~198 g'],[300,'1 didelis dubenėlis · ~300 g','1 large bowl · ~300 g']],
  buckwheat:[[15,'1 valgomasis šaukštas · ~15 g','1 tablespoon · ~15 g'],[85,'½ stiklinės virtų grikių · ~85 g','½ cup cooked buckwheat · ~85 g'],[150,'1 kumštis virtų grikių · ~150 g','1 fist of cooked buckwheat · ~150 g'],[170,'1 stiklinė virtų grikių · ~170 g','1 cup cooked buckwheat · ~170 g'],[250,'1 dubenėlis · ~250 g','1 bowl · ~250 g']],
  brown_rice:[[15,'1 valgomasis šaukštas · ~15 g','1 tablespoon · ~15 g'],[90,'½ stiklinės virtų ryžių · ~90 g','½ cup cooked rice · ~90 g'],[150,'1 kumštis virtų ryžių · ~150 g','1 fist of cooked rice · ~150 g'],[185,'1 stiklinė virtų ryžių · ~185 g','1 cup cooked rice · ~185 g'],[275,'1 dubenėlis · ~275 g','1 bowl · ~275 g']],
  quinoa:[[15,'1 valgomasis šaukštas · ~15 g','1 tablespoon · ~15 g'],[90,'½ stiklinės virtos bolivinės balandos · ~90 g','½ cup cooked quinoa · ~90 g'],[150,'1 kumštis · ~150 g','1 fist · ~150 g'],[185,'1 stiklinė · ~185 g','1 cup · ~185 g'],[275,'1 dubenėlis · ~275 g','1 bowl · ~275 g']],
  white_pasta:[[15,'1 valgomasis šaukštas · ~15 g','1 tablespoon · ~15 g'],[78,'½ stiklinės virtų makaronų · ~78 g','½ cup cooked pasta · ~78 g'],[150,'1 kumštis virtų makaronų · ~150 g','1 fist of cooked pasta · ~150 g'],[155,'1 stiklinė virtų makaronų · ~155 g','1 cup cooked pasta · ~155 g'],[230,'1 dubenėlis · ~230 g','1 bowl · ~230 g']],
  whole_pasta:[[15,'1 valgomasis šaukštas · ~15 g','1 tablespoon · ~15 g'],[78,'½ stiklinės virtų makaronų · ~78 g','½ cup cooked pasta · ~78 g'],[150,'1 kumštis virtų makaronų · ~150 g','1 fist of cooked pasta · ~150 g'],[155,'1 stiklinė virtų makaronų · ~155 g','1 cup cooked pasta · ~155 g'],[230,'1 dubenėlis · ~230 g','1 bowl · ~230 g']],
  milk:[[100,'½ stiklinės · 100 ml','½ glass · 100 ml'],[150,'¾ stiklinės · 150 ml','¾ glass · 150 ml'],[200,'1 stiklinė · 200 ml','1 glass · 200 ml'],[250,'1 puodelis · 250 ml','1 cup · 250 ml'],[330,'1 maža pakuotė · 330 ml','1 small carton · 330 ml']],
  kefir:[[100,'½ stiklinės · 100 ml','½ glass · 100 ml'],[150,'¾ stiklinės · 150 ml','¾ glass · 150 ml'],[200,'1 stiklinė · 200 ml','1 glass · 200 ml'],[300,'1½ stiklinės · 300 ml','1½ glasses · 300 ml'],[500,'1 buteliukas · 500 ml','1 bottle · 500 ml']],
  egg:[[25,'½ kiaušinio · ~25 g','½ egg · ~25 g'],[50,'1 kiaušinis · ~50 g','1 egg · ~50 g'],[100,'2 kiaušiniai · ~100 g','2 eggs · ~100 g'],[150,'3 kiaušiniai · ~150 g','3 eggs · ~150 g']],
  chicken:[[50,'½ delno dydžio gabalėlio · ~50 g','½ palm-sized piece · ~50 g'],[100,'1 delno dydžio gabalėlis · ~100 g','1 palm-sized piece · ~100 g'],[150,'1½ delno · ~150 g','1½ palms · ~150 g'],[200,'2 delno dydžio gabalėliai · ~200 g','2 palm-sized pieces · ~200 g']],
  almonds:[[10,'1 valgomasis šaukštas · ~10 g','1 tablespoon · ~10 g'],[20,'Maža sauja · ~20 g','Small handful · ~20 g'],[30,'1 sauja · ~30 g','1 handful · ~30 g'],[40,'Didelė sauja · ~40 g','Large handful · ~40 g']],
  walnuts:[[10,'1 valgomasis šaukštas · ~10 g','1 tablespoon · ~10 g'],[20,'Maža sauja · ~20 g','Small handful · ~20 g'],[30,'1 sauja · ~30 g','1 handful · ~30 g'],[40,'Didelė sauja · ~40 g','Large handful · ~40 g']],
  cashews:[[10,'1 valgomasis šaukštas · ~10 g','1 tablespoon · ~10 g'],[20,'Maža sauja · ~20 g','Small handful · ~20 g'],[30,'1 sauja · ~30 g','1 handful · ~30 g'],[40,'Didelė sauja · ~40 g','Large handful · ~40 g']],
  pumpkin_seeds:[[10,'1 valgomasis šaukštas · ~10 g','1 tablespoon · ~10 g'],[20,'2 valgomieji šaukštai · ~20 g','2 tablespoons · ~20 g'],[30,'Maža sauja · ~30 g','Small handful · ~30 g'],[40,'1 sauja · ~40 g','1 handful · ~40 g']]
};
Object.assign(householdPortionPresets,{
  potato:[[75,'1 maža bulvė · ~75 g','1 small potato · ~75 g'],[150,'1 vidutinė bulvė · ~150 g','1 medium potato · ~150 g'],[250,'1 didelė bulvė · ~250 g','1 large potato · ~250 g'],[300,'2 vidutinės bulvės · ~300 g','2 medium potatoes · ~300 g']],
  oats:[[85,'½ stiklinės košės · ~85 g','½ cup porridge · ~85 g'],[170,'1 dubenėlis košės · ~170 g','1 bowl of porridge · ~170 g'],[250,'Didelis dubenėlis · ~250 g','Large bowl · ~250 g']],
  yogurt:[[100,'Mažas indelis · 100 g','Small pot · 100 g'],[150,'1 indelis · 150 g','1 pot · 150 g'],[200,'1 puodelis · 200 g','1 cup · 200 g'],[300,'2 indeliai · 300 g','2 pots · 300 g']],
  lentils:[[50,'3 valgomieji šaukštai virtų lęšių · ~50 g','3 tablespoons cooked lentils · ~50 g'],[100,'½ stiklinės virtų lęšių · ~100 g','½ cup cooked lentils · ~100 g'],[200,'1 stiklinė virtų lęšių · ~200 g','1 cup cooked lentils · ~200 g'],[300,'1 dubenėlis · ~300 g','1 bowl · ~300 g']],
  chickpeas:[[45,'3 valgomieji šaukštai · ~45 g','3 tablespoons · ~45 g'],[85,'½ stiklinės · ~85 g','½ cup · ~85 g'],[170,'1 stiklinė · ~170 g','1 cup · ~170 g'],[250,'1 dubenėlis · ~250 g','1 bowl · ~250 g']],
  kidney:[[50,'3 valgomieji šaukštai · ~50 g','3 tablespoons · ~50 g'],[95,'½ stiklinės · ~95 g','½ cup · ~95 g'],[190,'1 stiklinė · ~190 g','1 cup · ~190 g'],[280,'1 dubenėlis · ~280 g','1 bowl · ~280 g']]
});
function completeFoodPortions(food){
  const presets=householdPortionPresets[food.id]||[],category=String(food.catEn||'').toLowerCase(),unit=food.unit||'g';
  let weights=[];
  if(unit==='ml')weights=[[100,'100 ml','100 ml'],[150,'150 ml','150 ml'],[200,'200 ml','200 ml'],[250,'250 ml','250 ml'],[330,'330 ml','330 ml'],[500,'500 ml','500 ml']];
  else if(category.includes('fruit'))weights=[[50,'50 g','50 g'],[100,'100 g','100 g'],[150,'150 g','150 g'],[200,'200 g','200 g'],[250,'250 g','250 g']];
  else if(category.includes('bread'))weights=[[20,'20 g','20 g'],[35,'35 g','35 g'],[50,'50 g','50 g'],[70,'70 g','70 g'],[100,'100 g','100 g']];
  else if(category.includes('nut'))weights=[[10,'10 g','10 g'],[20,'20 g','20 g'],[30,'30 g','30 g'],[40,'40 g','40 g'],[50,'50 g','50 g']];
  else if(category.includes('grain')||food.id==='oats'||food.id==='cornflakes'||food.id==='granola')weights=[[30,'30 g','30 g'],[50,'50 g','50 g'],[85,'85 g','85 g'],[150,'150 g','150 g'],[200,'200 g','200 g'],[250,'250 g','250 g']];
  else if(category.includes('meat')||category.includes('egg'))weights=[[50,'50 g','50 g'],[75,'75 g','75 g'],[100,'100 g','100 g'],[150,'150 g','150 g'],[200,'200 g','200 g'],[250,'250 g','250 g']];
  else if(category.includes('vegetable'))weights=[[50,'50 g','50 g'],[100,'100 g','100 g'],[150,'150 g','150 g'],[200,'200 g','200 g'],[250,'250 g','250 g']];
  else if(category.includes('dairy'))weights=[[50,'50 g','50 g'],[100,'100 g','100 g'],[150,'150 g','150 g'],[200,'200 g','200 g'],[250,'250 g','250 g']];
  else if(category.includes('sweet')||category.includes('dessert')||category.includes('snack'))weights=[[10,'10 g','10 g'],[20,'20 g','20 g'],[30,'30 g','30 g'],[50,'50 g','50 g'],[100,'100 g','100 g']];
  else weights=[[50,'50 g','50 g'],[100,'100 g','100 g'],[150,'150 g','150 g'],[200,'200 g','200 g'],[250,'250 g','250 g']];
  const byAmount=new Map();
  [...presets,...(food.portions||[]),...weights].forEach(option=>{if(Array.isArray(option)&&Number.isFinite(Number(option[0]))&&!byAmount.has(Number(option[0])))byAmount.set(Number(option[0]),option)});
  return [...byAmount.values()].sort((a,b)=>Number(a[0])-Number(b[0]));
}
foodCatalog.forEach(food=>{food.portions=completeFoodPortions(food)});

const restaurantFoods=[
 {id:'mcd_burger',restaurant:'mcdonalds',restaurantLt:'McDonald’s',restaurantEn:'McDonald’s',lt:'Mėsainis',en:'Hamburger',weight:1,carbs:29,protein:13,fat:8.9,source:'https://mcd.lt/product/mesainis/'},
 {id:'mcd_cheeseburger',restaurant:'mcdonalds',restaurantLt:'McDonald’s',restaurantEn:'McDonald’s',lt:'Mėsainis su sūriu',en:'Cheeseburger',weight:1,carbs:30,protein:16,fat:13,source:'https://mcd.lt/product/mesainis-su-suriu/'},
 {id:'mcd_chickenburger',restaurant:'mcdonalds',restaurantLt:'McDonald’s',restaurantEn:'McDonald’s',lt:'Chickenburger™',en:'Chickenburger™',weight:1,carbs:37,protein:11,fat:14,source:'https://mcd.lt/product/chickenburger/'},
 {id:'hes_burger',restaurant:'hesburger',restaurantLt:'Hesburger',restaurantEn:'Hesburger',lt:'„Hesburger“ mėsainis',en:'Hesburger burger',weight:235,carbs:43.8,protein:28.3,fat:42.5,source:'https://www.hesburger.lt/gaminiai/m--sainiai/---hesburger----m--sainis'},
 {id:'hes_bbq',restaurant:'hesburger',restaurantLt:'Hesburger',restaurantEn:'Hesburger',lt:'Barbekiu mėsainis',en:'BBQ burger',weight:260,carbs:58,protein:29.7,fat:40.3,source:'https://www.hesburger.lt/gaminiai/m--sainiai/barbekiu-m--sainis'},
 {id:'hes_sweet_sour',restaurant:'hesburger',restaurantLt:'Hesburger',restaurantEn:'Hesburger',lt:'Saldžiarūgštis padažas',en:'Sweet and sour dip',weight:32,carbs:9,protein:.2,fat:0,source:'https://www.hesburger.lt/gaminiai/pada--ai/sald--iar--g--tis-pada--as'},
 {id:'bk_mozz_vege',restaurant:'burgerking',restaurantLt:'Burger King',restaurantEn:'Burger King',lt:'Mozzarella Vege™',en:'Mozzarella Vege™',weight:333.5,carbs:74.5,protein:35.2,fat:11.5,source:'https://www.burgerking.lt/meniu/augaliniai-mesainiai-ir-tortilijos/mozzarella-vege/'},
 {id:'bk_plant_nuggets',restaurant:'burgerking',restaurantLt:'Burger King',restaurantEn:'Burger King',lt:'Augaliniai kepsneliai ir padažas',en:'Plant-based nuggets and dip',weight:72,carbs:14.3,protein:5.3,fat:8.6,source:'https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/augaliniai-kepsneliai-ir-padazas/'},
 {id:'bk_mozz_chicken',restaurant:'burgerking',restaurantLt:'Burger King',restaurantEn:'Burger King',lt:'Mozzarella Chicken™',en:'Mozzarella Chicken™',weight:340.1,carbs:83.1,protein:36.5,fat:36.6,source:'https://www.burgerking.lt/meniu/Komplektai/mozzarella-chicken/'},
 {id:'bk_vanilla_shake',restaurant:'burgerking',restaurantLt:'Burger King',restaurantEn:'Burger King',lt:'Vanilinis ledų kokteilis',en:'Vanilla milkshake',weight:330,carbs:58.7,protein:10.7,fat:8.9,source:'https://www.burgerking.lt/meniu/desertai/milk-shake-vanilla/'}
];
restaurantFoods.push(
 {id:'mcd_filet',restaurant:'mcdonalds',restaurantLt:'McDonald’s',restaurantEn:'McDonald’s',lt:'Filet-o-Fish™',en:'Filet-o-Fish™',weight:1,carbs:37,protein:15,fat:14,source:'https://mcd.lt/product/filet-o-fish/'},
 {id:'hes_regular_burger',restaurant:'hesburger',restaurantLt:'Hesburger',restaurantEn:'Hesburger',lt:'Mėsainis',en:'Hamburger',weight:125,carbs:29.4,protein:14.6,fat:17.8,source:'https://www.hesburger.lt/gaminiai/m--sainiai/m--sainis'},
 {id:'hes_breakfast_burger',restaurant:'hesburger',restaurantLt:'Hesburger',restaurantEn:'Hesburger',lt:'Pusryčių mėsainis',en:'Breakfast burger',weight:137,carbs:28.1,protein:23.8,fat:27.7,source:'https://www.hesburger.lt/gaminiai/pusry--iai---kiekvien---dien---nuo-restorano-atsidarymo-iki-12-00-valandos/pusry--i---m--sainis'},
 {id:'hes_burger_salad',restaurant:'hesburger',restaurantLt:'Hesburger',restaurantEn:'Hesburger',lt:'Mėsainių salotos',en:'Burger salad',weight:350,carbs:5.8,protein:26.3,fat:22.7,source:'https://www.hesburger.lt/gaminiai/salotos/m--saini---salotos'},
 {id:'bk_cheeseburger',restaurant:'burgerking',restaurantLt:'Burger King',restaurantEn:'Burger King',lt:'Mėsainis su sūriu',en:'Cheeseburger',weight:118.9,carbs:31.1,protein:16.2,fat:13,source:'https://burgerking.lt/meniu/Komplektai/mesainis-su-suriu/'},
 {id:'bk_fries',restaurant:'burgerking',restaurantLt:'Burger King',restaurantEn:'Burger King',lt:'Vidutinė skrudintų bulvyčių porcija',en:'Medium fries',weight:116,carbs:37.7,protein:3.7,fat:12.9,source:'https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/vidutine-porcija-skrudintu-bulvyciu/'},
 {id:'bk_tendercrisp',restaurant:'burgerking',restaurantLt:'Burger King',restaurantEn:'Burger King',lt:'Chicken Tendercrisp®',en:'Chicken Tendercrisp®',weight:268.6,carbs:54.5,protein:31.2,fat:32.5,source:'https://burgerking.lt/meniu/Komplektai/chicken-tendercrisp/'},
 {id:'bk_crispy_cheese',restaurant:'burgerking',restaurantLt:'Burger King',restaurantEn:'Burger King',lt:'Crispy Chicken™ su sūriu',en:'Crispy Chicken™ with cheese',weight:153,carbs:35.8,protein:14.2,fat:25,source:'https://www.burgerking.lt/meniu/Komplektai/crispy-chicken-su-suriu/'}
);
let foodBrowserMode='home',foodSearchQuery='',selectedFoodCategory='all',selectedFoodSubcategory='all',selectedRestaurant='all',selectedRestaurantCategory='all',pendingCatalogFood=null;
const kfcNutritionSource='https://brand-uk.assets.kfc.co.uk/nutrition-allergens.pdf';
const subwayNutritionSource='https://media.subway.com/dam/urn:aaid:aem:c9e92cc1-b7a5-493f-adcd-7acb0641eeba/original/as/UKIBuildsandIngredientsNutritionalInformationSeptember2.pdf';
const addRestaurantMenu=(brand,brandLabel,market,source,rows)=>restaurantFoods.push(...rows.map(([id,lt,en,weight,carbs,protein,fat])=>({id,restaurant:brand,restaurantLt:`${brandLabel} · ${market}`,restaurantEn:`${brandLabel} · ${market}`,lt,en,weight,carbs,protein,fat,source})));
addRestaurantMenu('kfc','KFC','JK ir Airija',kfcNutritionSource,[
 ['kfc_fillet','Filė mėsainis','Fillet Burger',1,43,28.8,18.7],['kfc_zinger','Zinger mėsainis','Zinger Burger',1,43,23,22],['kfc_tower','Filė bokšto mėsainis','Fillet Tower Burger',1,55.5,32.1,27],['kfc_bbq_tower','BBQ Filė bokšto mėsainis','BBQ Fillet Tower Burger',1,57,32.1,27.2],['kfc_supercharger_tower','Zinger Supercharger bokštas','Zinger Supercharger Tower Burger',1,53.5,26.2,35.9],['kfc_stacker','Zinger Stacker mėsainis','Zinger Stacker Burger',1,60.9,45.1,42.3],['kfc_mini_burger','Mažas mėsainis','Mini Burger',1,28,18,10],['kfc_kids_burger','Vaikiškas mėsainis','Kids Burger',1,30,18,7],['kfc_vegan_burger','Veganiškas mėsainis','Vegan Burger',1,41,15,17],
 ['kfc_kentucky_twister','Kentucky Mayo suktinukas','Kentucky Mayo Twister',1,46.1,28.4,24],['kfc_sweet_chilli_twister','Saldžiai aštrus suktinukas','Sweet Chilli Twister',1,53.1,28.7,17.6],['kfc_smokey_bbq_twister','Dūminio BBQ suktinukas','Smokey BBQ Twister',1,51.2,28.7,17.4],['kfc_supercharger_twister','Supercharger suktinukas','Supercharger Twister',1,47.8,29.1,26],['kfc_flamin_mini_wrap','Aštrus mažas suktinukas','Flamin’ Mini Wrap',1,28.5,17.6,15.3],['kfc_bbq_mini_wrap','BBQ mažas suktinukas','BBQ Mini Wrap',1,30.9,17.6,10.8],
 ['kfc_original_ranch_rice','Original Ranch ryžių dubenėlis','Original Ranch Rice Bowl',1,62.8,28.8,19.7],['kfc_zinger_ranch_rice','Zinger Ranch ryžių dubenėlis','Zinger Ranch Rice Bowl',1,61.6,23,21.3],['kfc_veggie_ranch_rice','Daržovių Ranch ryžių dubenėlis','Veggie Ranch Rice Bowl',1,59.7,7.5,9.5],
 ['kfc_original_piece','Original Recipe vištiena, 1 vnt.','Original Recipe Chicken, 1 piece',1,8.6,22,13],['kfc_small_popcorn','Maža spragintų vištienos kąsnelių porcija','Small Popcorn Chicken',1,8.3,8.3,8.3],['kfc_regular_popcorn','Vidutinė spragintų vištienos kąsnelių porcija','Regular Popcorn Chicken',1,18,18,18],['kfc_large_popcorn','Didelė spragintų vištienos kąsnelių porcija','Large Popcorn Chicken',1,28,28,28],['kfc_hot_wing','Aštrus sparnelis, 1 vnt.','Hot Wing, 1 piece',1,3.8,4.9,6.2],['kfc_tender','Vištienos juostelė, 1 vnt.','Chicken Tender, 1 piece',1,5.8,13.1,5.4],['kfc_sweet_chilli_bites','Sweet Chilli vištienos kąsneliai','Sweet Chilli Drip’d Bites',1,36.8,19.1,13.5],['kfc_kansas_bbq_bites','Kansas BBQ vištienos kąsneliai','Kansas BBQ Drip’d Bites',1,34.7,15.8,10.8],
 ['kfc_regular_fries','Įprasta bulvyčių porcija','Regular Signature Fries',1,38,3.1,9.8],['kfc_large_fries','Didelė bulvyčių porcija','Large Signature Fries',1,54,4.4,14],['kfc_regular_beans','Įprasta BBQ pupelių porcija','Regular BBQ Beans',1,15.1,4.7,.6],['kfc_large_beans','Didelė BBQ pupelių porcija','Large BBQ Beans',1,32,10,1.4],['kfc_regular_coleslaw','Įprastos kopūstų salotos','Regular Coleslaw',1,6.1,1.1,13],['kfc_large_coleslaw','Didelės kopūstų salotos','Large Coleslaw',1,12,2.2,26],['kfc_corn','Kukurūzų burbuolė','Corn Cobette',1,8.1,2.2,1.3],['kfc_two_corn','Dvi kukurūzų burbuolės','2 Corn Cobettes',1,16,4.4,2.7],['kfc_regular_gravy','Įprasta padažo porcija','Regular Gravy',1,8.4,1.7,3.5],['kfc_large_gravy','Didelė padažo porcija','Large Gravy',1,19,3.9,8],['kfc_regular_mash','Įprasta bulvių košė','Regular Creamy Mash',1,20,2.4,3.4],['kfc_large_mash','Didelė bulvių košė','Large Creamy Mash',1,40,4.8,6.8],
 ['kfc_rice','Cajun Dirty ryžiai','Cajun Dirty Rice',1,43,3.8,2.6],['kfc_side_salad','Salotos','Side Salad',1,4.7,.8,3.6],['kfc_loaded_fries','Užkrautos bulvytės','Dirty Loaded Fries',1,53.1,11.8,22.7],['kfc_cheese_slice','Sūrio riekelė','Cheese Slice',1,.5,2.2,3.1],['kfc_hashbrown','Bulvių blynelis','Hash Brown',1,8.8,.9,5.5],
 ['kfc_mini_sundae','Mažas šokoladinis ledų desertas','Mini Chocolate Sundae',1,20,2.5,5.3],['kfc_oreo_sundae','Oreo ledų desertas','Oreo Sundae',1,38,4.1,9.6],['kfc_milkybar_sundae','Milkybar ledų desertas','Milkybar Sundae',1,39,5.7,13],['kfc_raspberry_sundae','Aviečių ledų desertas','Raspberry Ripple Sundae',1,37,5,12],['kfc_chocolate_cookie','Pieniško šokolado sausainis','Milk Chocolate Cookie',1,36.3,2.9,13.8],['kfc_white_cookie','Baltojo šokolado sausainis','White Chocolate Cookie',1,36,2.7,14],['kfc_yoyo_bear','Braškinis guminukas','Yoyo Bear Strawberry',1,13,.5,.5],
 ['kfc_oreo_krushems','Oreo kokteilis','Oreo Krushems Shake',1,41,4.1,10],['kfc_milkybar_krushems','Milkybar kokteilis','MilkyBar Krushems Shake',1,43,6.4,13],['kfc_aero_krushems','Aero Peppermint kokteilis','Aero Peppermint Krushem Shake',1,41,3.9,11],['kfc_raspberry_krushems','Aviečių kokteilis','Raspberry Ripple Krushem Shake',1,36,4.6,11],
 ['kfc_dirty_louisiana','Dirty Louisiana mėsainis','Dirty Louisiana Burger',1,61.4,32.6,34.3],['kfc_zinger_louisiana','Zinger Dirty Louisiana mėsainis','Zinger Dirty Louisiana Burger',1,61.3,26.7,36.6],['kfc_loaded_doritos','Užkrauti Doritos','Loaded Doritos',1,82.2,34.6,38.6],['kfc_dirty_millionaire','Dirty Millionaire kokteilis','Dirty Millionaire Shake',1,103.2,8.3,17.9],
 ['kfc_cherry_boba','Vyšnių Boba gėrimas','Cherry Boba Refresher',1,27.3,.5,.5],['kfc_strawberry_boba','Braškių Boba gėrimas','Strawberry Boba Refresher',1,35.3,.5,.5],['kfc_raspberry_lemonade','Aviečių limonadas','Sparkling Raspberry Lemonade',1,21.9,.5,.5],['kfc_cloudy_lemonade','Gazuotas limonadas','Sparkling Cloudy Lemonade',1,4.3,.5,.5],
 ['kfc_garlic_parm_dip','Česnakinis parmezano padažas','Garlic Parmesan Dip',1,3.2,.5,19.7],['kfc_honey_mustard_dip','Medaus ir garstyčių padažas','Honey Mustard Dip',1,9.3,.7,17.1],['kfc_hot_honey_dip','Aštrus medaus padažas','Hot Honey Habanero Dip',1,22.4,.5,.5],['kfc_jalapeno_ranch','Jalapeno Ranch padažas','Jalapeno Ranch Dip',1,3.4,.6,15.4],['kfc_mango_masala','Mango Masala padažas','Mango Masala Dip',1,15,.5,.5],['kfc_original_dip','Original padažas','Original Dip',1,3.3,.7,15.6],['kfc_supercharger_dip','Supercharger padažas','Supercharger Dip',1,3.9,.6,19],['kfc_sweet_teriyaki','Saldus Teriyaki padažas','Sweet Teriyaki Dip',1,11.4,.6,.5],['kfc_texas_bbq','Texas BBQ padažas','Texas BBQ Dip',1,16.6,.5,.5],['kfc_ketchup','Kečupas','Tomato Ketchup',1,2.3,.5,.5]
]);
addRestaurantMenu('subway','Subway','JK ir Airija',subwayNutritionSource,[
 ['sub_chicken_breast','Vištienos krūtinėlės 15 cm sumuštinis','Chicken Breast 6-inch sub',198,42,26,6.8],['sub_chicken_bacon','Vištienos ir šoninės 15 cm sumuštinis','Chicken and Bacon 6-inch sub',174,37,23,7],['sub_chicken_tikka','Chicken Tikka 15 cm sumuštinis','Chicken Tikka 6-inch sub',197,43,28,7.1],['sub_beef_chilli','Beef Chilli 15 cm sumuštinis','Beef Chilli 6-inch sub',241,48,22,8],['sub_rotisserie','Rotisserie vištienos 15 cm sumuštinis','Rotisserie Style Chicken 6-inch sub',177,38,22,7.6],['sub_tex_mexan','Tex Mexan 15 cm sumuštinis','Tex Mexan 6-inch sub',247,49,31,19],['sub_meatball','Meatball Marinara 15 cm sumuštinis','Meatball Marinara 6-inch sub',243,51,23,16],['sub_philly_steak','Philly Steak 15 cm sumuštinis','Philly Steak 6-inch sub',165,48,18,3.6],['sub_garlic_cheesesteak','Garlic Cheesesteak 15 cm sumuštinis','Garlic Cheesesteak 6-inch sub',272,51,24,27],['sub_ham','Kumpio 15 cm sumuštinis','Ham 6-inch sub',182,42,21,7.9],['sub_turkey','Kalakutienos 15 cm sumuštinis','Turkey 6-inch sub',183,41,22,6.6],['sub_ham_turkey','Kumpio ir kalakutienos 15 cm sumuštinis','Ham and Turkey 6-inch sub',192,42,23,7.4],['sub_spicy_italian','Aštrus itališkas 15 cm sumuštinis','Spicy Italian 6-inch sub',186,43,22,27],['sub_italian_bmt','Italian B.M.T. 15 cm sumuštinis','Italian B.M.T. 6-inch sub',139,41,20,16],['sub_veggie_delite','Veggie Delite 15 cm sumuštinis','Veggie Delite 6-inch sub',163,42,8.3,2.4],['sub_tuna','Tunų 15 cm sumuštinis','Tuna Mayo 6-inch sub',200,43,22,16],['sub_plant_patty','Augalinio paplotėlio 15 cm sumuštinis','Spiced Plant Patty 6-inch sub',211,51,21,14],['sub_bean_chilli','5 pupelių čili 15 cm sumuštinis','5 Bean Chilli 6-inch sub',241,52,14,7],
 ['sub_toastie_bacon_cheese','Skrudintas sumuštinis su šonine ir sūriu','Bacon and Cheese Toastie',165,43,27,24],['sub_toastie_philly','Skrudintas Philly Cheese Steak','Philly Cheese Steak Toastie',395,59,25,18],['sub_toastie_tuna','Skrudintas tuno ir sūrio sumuštinis','Tuna Mayo and Cheese Toastie',398,54,26,27],['sub_toastie_bmt','Skrudintas B.M.T. su sūriu','B.M.T. and Cheese Toastie',390,53,27,27],['sub_toastie_ham','Skrudintas kumpio ir sūrio sumuštinis','Ham and Cheese Toastie',380,53,25,19],['sub_toastie_blT','Skrudintas BLT','BLT Toastie',146,38,14,13],
 ['sub_waffle_fries','Įprasta vaflinių bulvyčių porcija','Regular Waffle Fries',100,23,2.8,8.2],['sub_large_waffle_fries','Didelė vaflinių bulvyčių porcija','Large Waffle Fries',150,34,4.2,12],['sub_hash_browns','Bulvių blyneliai, 6 vnt.','Hash Browns, 6 pieces',111,22,2.4,11],['sub_mozz_bites_5','Mocarelos ir čederio kąsneliai, 5 vnt.','Mozzarella and Cheddar Bites x 5',75,19,11,15],['sub_nacho_bites_6','Nacho vištienos kąsneliai, 6 vnt.','Nacho Chicken Bites, 6 pieces',108,21,16,13],['sub_choc_cookie','Šokoladinis sausainis','Chocolate Chunk Cookie',45,28,2.3,10],['sub_rainbow_cookie','Spalvotas sausainis','Rainbow Cookie',45,28,2,9.8],['sub_vegan_cookie','Veganiškas dvigubo šokolado sausainis','Vegan Double Chocolate Cookie',46,27,2,11],['sub_white_cookie','Baltojo šokolado ir makadamijų sausainis','White Macadamia Nut Cookie',45,27,2.3,10],['sub_oat_cookie','Avižinis sausainis su razinomis','Oat and Raisin Cookie',45,28,2.6,.6],['sub_mini_cookies','Maži sausainiai ir karamelės padažas','Mini Cookies and Caramel Dip',126,79,5,21],
 ['sub_spud_beans','Bulvė su pupelėmis','Spud with beans',464,69,21,17],['sub_spud_tuna','Bulvė su tunu ir sūriu','Spud with tuna and cheese',398,54,26,27],['sub_nachos','Doritos sūrio nachos','Doritos Tangy Cheese Nachos',207,55,19,34],['sub_loaded_nachos','Užkrauti jautienos čili nachos','Chilli Beef Brisket Loaded Nachos',243,63,24,25],['sub_protein_pot','Vištienos krūtinėlės kąsneliai','Chicken Breast Strips',71,1.5,16,1.1]
]);
restaurantFoods.forEach(f=>{if(f.restaurant==='kfc'||f.restaurant==='subway')f.mealTypes=['breakfast','snack','lunch','dinner']});
addRestaurantMenu('hesburger','Hesburger','Lietuva','https://www.hesburger.lt/maistin---vert---ir-alergenai',[
 ['hes_bacon_burger','Sumuštinis su šonine','Bacon sandwich',1,46.5,48.2,64.5],['hes_double_cheese','Dvigubas mėsainis su sūriu','Double cheeseburger',1,30.6,29.3,31.2],['hes_cheeseburger','Mėsainis su sūriu','Cheeseburger',1,29.9,17.1,21.1],['hes_kebab_burger','Kebabo mėsainis','Kebab burger',1,57.2,28.6,51.6],['hes_veke_cheese','VEKE® mėsainis su sūriu','VEKE® cheeseburger',1,38,16.3,24.4],['hes_veke_double','VEKE® dvigubas mėsainis su sūriu','VEKE® double cheeseburger',1,46.3,28,41.3],['hes_veke_vegetarian','VEKE® vegetariškas mėsainis','VEKE® vegetarian burger',1,38.4,14.1,26.7],['hes_chicken_fillet_sandwich','Sumuštinis su vištienos filė','Chicken fillet sandwich',1,46,25.3,26.4],['hes_chicken_sandwich','Sumuštinis su vištiena','Chicken sandwich',1,62.1,22.4,37.4],['hes_mini_chicken','Mažas sumuštinis su vištiena','Mini chicken sandwich',1,36.8,12.2,21],
 ['hes_bacon_breakfast_wrap','Pusryčių tortilija su šonine','Breakfast bacon tortilla',1,36.2,21.3,49.5],['hes_breakfast_sandwich','Pusryčių sumuštinis','Breakfast sandwich',1,27.4,14,20.8],['hes_bacon_omelette','Pusryčių omletas su šonine','Bacon omelette',1,27.1,17.1,23.8],['hes_hash_browns','Tarkuotų bulvių paplotėliai','Hash browns',1,27.6,2.1,8.7],
 ['hes_big_fries','Skrudintos bulvytės, didelė porcija','Large fries',1,51.9,4.3,16.7],['hes_veke_warm_salad','VEKE® sojų šiltos salotos','VEKE® warm soy salad',1,18,15.6,12.9],['hes_vegetable_salad','Daržovių salotos','Vegetable salad',1,3.4,1.2,.3],['hes_veke_sticks4','VEKE® sojų lazdelės, 4 vnt. su padažu','VEKE® soy sticks, 4 pcs with dip',1,7.5,7.7,7.1],['hes_veke_sticks6','VEKE® sojų lazdelės, 6 vnt. su padažu','VEKE® soy sticks, 6 pcs with dip',1,11.3,11.6,10.7],['hes_veke_sticks9','VEKE® sojų lazdelės, 9 vnt. su 2 padažais','VEKE® soy sticks, 9 pcs with 2 dips',1,16.9,17.4,16],['hes_veke_sticks15','VEKE® sojų lazdelės, 15 vnt. su 3 padažais','VEKE® soy sticks, 15 pcs with 3 dips',1,28.2,29,26.7],['hes_onion_rings','Svogūnų žiedai su padažu','Onion rings with dip',1,22.8,3.5,8.8],
 ['hes_chicken_tortilla','Tortilija su vištiena','Chicken tortilla',1,38.1,25.6,33.2],['hes_veke_tortilla','VEKE® sojų tortilija','VEKE® soy tortilla',1,45.4,19.3,42.3],['hes_fries','Skrudintos bulvytės','Fries',1,37,3.1,11.9],['hes_greek_salad','Graikiškos salotos','Greek salad',1,5.4,19.3,25.7],['hes_chicken_salad','Vištienos salotos','Chicken salad',1,7.6,32,11.5],['hes_warm_chicken_salad','Salotos su šilta vištiena','Warm chicken salad',1,20.6,27.6,19.7],['hes_croutons','Skrebučiai salotoms','Salad croutons',1,12.3,2.2,3.6],
 ['hes_nuggets4','Vištienos kepsneliai, 4 vnt. su padažu','Chicken nuggets, 4 pcs with dip',1,16.3,9,12.8],['hes_nuggets6','Vištienos kepsneliai, 6 vnt. su padažu','Chicken nuggets, 6 pcs with dip',1,26.9,14.9,21.1],['hes_nuggets9','Vištienos kepsneliai, 9 vnt. su 2 padažais','Chicken nuggets, 9 pcs with 2 dips',1,40.4,22.4,31.7],['hes_nuggets15','Vištienos kepsneliai, 15 vnt. su 3 padažais','Chicken nuggets, 15 pcs with 3 dips',1,61.2,33.9,48],['hes_crispy_fillet','Traški vištienos filė, 2 vnt. su padažu','Crispy chicken fillet, 2 pcs with dip',1,13.8,17.2,9.3],['hes_paprika_mayo','Paprikinis majonezas','Paprika mayonnaise',1,2.2,.6,29.2],['hes_cola_025','Coca-Cola, 250 ml','Coca-Cola, 250 ml',250,26.5,0,0],['hes_pistachio_icecream','Ledai su pistacijų užpilu','Ice cream with pistachio topping',1,38.8,6.7,18.1],['hes_vanilla_shake','Vanilinis kokteilis, 0,4 l','Vanilla shake, 0.4 l',400,41.1,12.5,15.4],['hes_black_coffee','Juoda kava, 200 ml','Black coffee, 200 ml',200,0,0,0],['hes_large_black_coffee','Didelė juoda kava, 300 ml','Large black coffee, 300 ml',300,0,0,0]
]);
for(let i=restaurantFoods.length-1;i>=0;i--)if(!['mcdonalds','hesburger'].includes(restaurantFoods[i].restaurant))restaurantFoods.splice(i,1);
const mcdMenuItems=[
 ['mcd_mctoast_double','McToast™ su dvigubu sūriu','Pusryčiai'],['mcd_mctoast_bacon','McToast™ su šonine ir sūriu','Pusryčiai'],['mcd_mcmuffin_egg','McMuffin™ su kiaušiniu','Pusryčiai'],['mcd_mcmuffin_pork','McMuffin™ su kiauliena','Pusryčiai'],['mcd_mcmuffin_pork_egg','McMuffin™ su kiauliena ir kiaušiniu','Pusryčiai'],['mcd_mcmuffin_bacon_egg','McMuffin™ su šonine ir kiaušiniu','Pusryčiai'],['mcd_deluxe_mcmuffin_pork','DeLuxe McMuffin™ su kiauliena','Pusryčiai'],['mcd_deluxe_mcmuffin_chicken','DeLuxe McMuffin™ su vištiena','Pusryčiai'],['mcd_double_deluxe_mcmuffin','Dvigubas DeLuxe McMuffin™ su kiauliena','Pusryčiai'],['mcd_breakfast_wrap_chicken','Pusryčių McWrap™ su vištiena ir šonine','Pusryčiai'],['mcd_breakfast_wrap_pork','Pusryčių McWrap™ su kiauliena ir kiaušiniu','Pusryčiai'],['mcd_hashbrown','Bulvių paplotėlis','Pusryčiai'],
 ['mcd_big_tasty_original','Big Tasty™ originalus','Mėsainiai ir McWrap™'],['mcd_triple_cheddar_chicken','Mėsainis su vištiena ir trigubu čederiu','Mėsainiai ir McWrap™'],['mcd_triple_cheddar_beef','Mėsainis su jautiena ir trigubu čederiu','Mėsainiai ir McWrap™'],['mcd_triple_cheddar_pork','Mėsainis su kiauliena ir trigubu čederiu','Mėsainiai ir McWrap™'],['mcd_big_arch','BIG ARCH®','Mėsainiai ir McWrap™'],['mcd_mccrispy','McCrispy®','Mėsainiai ir McWrap™'],['mcd_honey_mustard_snack_wrap','Užkandžių suktinukas su medaus garstyčių padažu','Mėsainiai ir McWrap™'],['mcd_big_mac','Big Mac®','Mėsainiai ir McWrap™'],['mcd_pork_cheeseburger','Kiaulienos mėsainis su sūriu','Mėsainiai ir McWrap™'],['mcd_tasty_jr','Tasty Jr.™','Mėsainiai ir McWrap™'],['mcd_double_big_tasty','Dvigubas Big Tasty™','Mėsainiai ir McWrap™'],['mcd_hamburger','Mėsainis','Mėsainiai ir McWrap™'],['mcd_cheeseburger','Mėsainis su sūriu','Mėsainiai ir McWrap™'],['mcd_chickenburger','Chickenburger™','Mėsainiai ir McWrap™'],['mcd_double_cheeseburger','Dvigubas mėsainis su sūriu','Mėsainiai ir McWrap™'],['mcd_mcroyal','McRoyal®','Mėsainiai ir McWrap™'],['mcd_big_tasty_bacon','Big Tasty™ su šonine','Mėsainiai ir McWrap™'],['mcd_chicken_bacon_wrap','McWrap™ su vištiena ir šonine','Mėsainiai ir McWrap™'],['mcd_mcchicken','McChicken™','Mėsainiai ir McWrap™'],['mcd_filet_o_fish','Filet-o-Fish™','Mėsainiai ir McWrap™'],
 ['mcd_apple_slices','Obuolių skiltelės','Salotos'],['mcd_small_veggie_salad','Mažosios daržovių salotos','Salotos'],['mcd_crispy_chicken_caesar','Cezario salotos su traškia vištiena','Salotos'],
 ['mcd_crispy_chicken_5','Traškūs vištienos gabalėliai, 5 vnt','Užkandžiai'],['mcd_snack_box_xl','Užkandžių rinkinys XL','Užkandžiai'],['mcd_snack_box_mix','Užkandžių rinkinys MIX','Užkandžiai'],['mcd_snack_box_chicken','Užkandžių rinkinys su VIŠTIENA','Užkandžiai'],['mcd_snack_box_cheese_nuggets','Užkandžių rinkinys SŪRIS ir Chicken McNUGGETS','Užkandžiai'],['mcd_mac_cheese_4','Mac’n’Cheese kąsneliai, 4 vnt.','Užkandžiai'],['mcd_mac_cheese_6','Mac’n’Cheese kąsneliai, 6 vnt.','Užkandžiai'],['mcd_snack_box_mac_cheese','Užkandžių rinkinys MAC’n’CHEESE ir Chicken McNUGGETS','Užkandžiai'],['mcd_crinkle_fries_large','Didelė bulvyčių bangelių porcija','Užkandžiai'],['mcd_bbq_fries_medium','Vidutinė porcija BBQ bulvyčių','Užkandžiai'],['mcd_bbq_fries_large','Didelė porcija BBQ bulvyčių','Užkandžiai'],['mcd_crispy_chicken_3','Traškūs vištienos gabalėliai, 3 vnt','Užkandžiai'],['mcd_spicy_cheese_4','Aštrūs sūrio gabalėliai, 4 vnt.','Užkandžiai'],['mcd_spicy_cheese_6','Aštrūs sūrio gabalėliai, 6 vnt.','Užkandžiai'],['mcd_nuggets_4','Chicken McNuggets™, 4 vnt.','Užkandžiai'],['mcd_fries_small','Maža skrudintų bulvyčių porcija','Užkandžiai'],['mcd_fries_medium','Vidutinė skrudintų bulvyčių porcija','Užkandžiai'],['mcd_fries_large','Didelė skrudintų bulvyčių porcija','Užkandžiai'],['mcd_nuggets_6','Chicken McNuggets™, 6 vnt.','Užkandžiai'],['mcd_nuggets_9','Chicken McNuggets™, 9 vnt.','Užkandžiai'],['mcd_nuggets_20','Chicken McNuggets™, 20 vnt.','Užkandžiai'],
 ['mcd_happy_meal','Happy Meal™','Happy Meal™'],
 ['mcd_mcflurry_lion','McFlurry™ su Lion®','Desertai'],['mcd_pineapple','Ananaso gabalėlis','Desertai'],['mcd_mini_mcflurry_oreo','Mini McFlurry™ Oreo®','Desertai'],['mcd_shake_vanilla_250','Vanilinis ledų kokteilis, 250 ml','Desertai'],['mcd_shake_chocolate_250','Šokoladinis ledų kokteilis, 250 ml','Desertai'],['mcd_shake_strawberry_250','Braškinis ledų kokteilis, 250 ml','Desertai'],['mcd_apple_pie','Obuolių pyragėlis','Desertai'],['mcd_cherry_pie','Vyšnių pyragėlis','Desertai'],['mcd_sundae_caramel','McSundae™ ledai su karamele','Desertai'],['mcd_sundae_chocolate','McSundae™ ledai su šokoladu','Desertai'],['mcd_sundae_strawberry','McSundae™ ledai su braškių užpilu','Desertai'],['mcd_mcflurry_oreo','McFlurry™ Oreo®','Desertai'],['mcd_shake_chocolate_400','Šokoladinis ledų kokteilis, 400 ml','Desertai'],['mcd_shake_strawberry_400','Braškinis ledų kokteilis, 400 ml','Desertai'],['mcd_shake_vanilla_400','Vanilinis ledų kokteilis, 400 ml','Desertai'],
 ['mcd_sauce_honey_mustard','Medaus garstyčių padažas','Padažai'],['mcd_sauce_creamy_chili','Kreminis Čili padažas','Padažai'],['mcd_sauce_mex_cheddar','Meksikietiškas čederio padažas, 100 ml','Padažai'],['mcd_sauce_ketchup','Kečupas','Padažai'],['mcd_sauce_sour_cream','Grietinės padažas','Padažai'],['mcd_sauce_garlic','Česnakinis padažas','Padažai'],['mcd_sauce_sweet_sour','Saldžiarūgštis padažas','Padažai'],['mcd_sauce_bbq','Barbekiu padažas','Padažai'],['mcd_sauce_caesar','Cezario padažas','Padažai'],
 ['mcd_cherry_cola_zero_250','Coca-Cola® Vyšnių Zero, 250 ml','Šalti gėrimai'],['mcd_cherry_cola_zero_400','Coca-Cola® Vyšnių Zero, 400 ml','Šalti gėrimai'],['mcd_cherry_cola_zero_500','Coca-Cola® Vyšnių Zero, 500 ml','Šalti gėrimai'],['mcd_capri_s','Capri-S Mystic Dragon sulčių gėrimas','Šalti gėrimai'],['mcd_passion_sprite','Pasiflorų X Sprite®, 400 ml','Šalti gėrimai'],['mcd_cola_250','Coca-Cola®, 250 ml','Šalti gėrimai'],['mcd_cola_400','Coca-Cola®, 400 ml','Šalti gėrimai'],['mcd_cola_500','Coca-Cola®, 500 ml','Šalti gėrimai'],['mcd_cola_zero_250','Coca-Cola Zero®, 250 ml','Šalti gėrimai'],['mcd_cola_zero_400','Coca-Cola Zero®, 400 ml','Šalti gėrimai'],['mcd_cola_zero_500','Coca-Cola Zero®, 500 ml','Šalti gėrimai'],['mcd_fanta_250','Fanta®, 250 ml','Šalti gėrimai'],['mcd_fanta_400','Fanta®, 400 ml','Šalti gėrimai'],['mcd_fanta_500','Fanta®, 500 ml','Šalti gėrimai'],['mcd_sprite_250','Sprite®, 250 ml','Šalti gėrimai'],['mcd_sprite_400','Sprite®, 400 ml','Šalti gėrimai'],['mcd_sprite_500','Sprite®, 500 ml','Šalti gėrimai'],['mcd_lipton_peach_250','Lipton® persikų skonio šalta arbata, 250 ml','Šalti gėrimai'],['mcd_lipton_peach_400','Lipton® persikų skonio šalta arbata, 400 ml','Šalti gėrimai'],['mcd_lipton_peach_500','Lipton® persikų skonio šalta arbata, 500 ml','Šalti gėrimai'],['mcd_water_still','Natūralus mineralinis vanduo','Šalti gėrimai'],['mcd_water_sparkling','Gazuotas mineralinis vanduo','Šalti gėrimai'],['mcd_cappy_apple_250','Cappy® obuolių sultys, 250 ml','Šalti gėrimai'],['mcd_cappy_apple_400','Cappy® obuolių sultys, 400 ml','Šalti gėrimai'],['mcd_cappy_orange_250','Cappy® apelsinų sultys, 250 ml','Šalti gėrimai'],['mcd_cappy_orange_400','Cappy® apelsinų sultys, 400 ml','Šalti gėrimai'],['mcd_rasens_milk','Pienas „Rasēns“','Šalti gėrimai'],['mcd_rasens_strawberry','Braškių skonio pieno gėrimas „Rasēns“','Šalti gėrimai'],
 ['mcd_green_tea_300','Žalioji arbata, 300 ml','Karšti gėrimai'],['mcd_green_tea_400','Žalioji arbata, 400 ml','Karšti gėrimai'],['mcd_black_tea_200','Juodoji arbata, 200 ml','Karšti gėrimai'],['mcd_black_tea_300','Juodoji arbata, 300 ml','Karšti gėrimai'],['mcd_black_tea_400','Juodoji arbata, 400 ml','Karšti gėrimai'],['mcd_fruit_tea_200','Vaisinė arbata, 200 ml','Karšti gėrimai'],['mcd_fruit_tea_300','Vaisinė arbata, 300 ml','Karšti gėrimai'],['mcd_fruit_tea_400','Vaisinė arbata, 400 ml','Karšti gėrimai'],['mcd_mint_tea_200','Mėtų arbata, 200 ml','Karšti gėrimai'],['mcd_mint_tea_300','Mėtų arbata, 300 ml','Karšti gėrimai'],['mcd_mint_tea_400','Mėtų arbata, 400 ml','Karšti gėrimai'],['mcd_green_tea_200','Žalioji arbata, 200 ml','Karšti gėrimai'],['mcd_black_coffee_200','Juoda kava, 200 ml','Karšti gėrimai'],['mcd_espresso','Espresas','Karšti gėrimai'],['mcd_double_espresso','Dvigubas Espresas','Karšti gėrimai'],['mcd_black_coffee_300','Juoda kava, 300 ml','Karšti gėrimai'],['mcd_black_coffee_400','Juoda kava, 400 ml','Karšti gėrimai'],['mcd_coffee_milk_200','Juoda kava su pienu, 200 ml','Karšti gėrimai'],['mcd_coffee_milk_300','Juoda kava su pienu, 300 ml','Karšti gėrimai'],['mcd_coffee_milk_400','Juoda kava su pienu, 400 ml','Karšti gėrimai'],['mcd_cappuccino_200','Kapučinas, 200 ml','Karšti gėrimai'],['mcd_cappuccino_300','Kapučinas, 300 ml','Karšti gėrimai'],['mcd_cappuccino_400','Kapučinas, 400 ml','Karšti gėrimai'],['mcd_latte_300','Latė, 300 ml','Karšti gėrimai'],['mcd_latte_400','Latė, 400 ml','Karšti gėrimai'],['mcd_flat_white','Fletvaitas','Karšti gėrimai']
];
for(const [id,lt,restaurantCategory] of mcdMenuItems){if(!restaurantFoods.some(f=>f.restaurant==='mcdonalds'&&f.lt===lt))restaurantFoods.push({id,restaurant:'mcdonalds',restaurantLt:'McDonald’s',restaurantEn:'McDonald’s',lt,en:lt,weight:1,carbs:null,protein:null,fat:null,source:'https://mcd.lt/menu/',restaurantCategory});}
const mcdConfigurableBundleIds=new Set(['mcd_snack_box_xl','mcd_snack_box_mix','mcd_snack_box_chicken','mcd_snack_box_cheese_nuggets','mcd_snack_box_mac_cheese','mcd_happy_meal']);
for(const f of restaurantFoods){if(mcdConfigurableBundleIds.has(f.id))f.macroUnavailableReason={lt:'Rinkinį sudaro pasirinktiniai produktai, todėl vienos pastovios makro sumos nėra. Pridėkite pasirinktus produktus atskirai.',en:'This bundle has configurable items, so there is no single fixed macro total. Add the selected items separately.'};}
addRestaurantMenu('hesburger','Hesburger','Lietuva','https://www.hesburger.lt/maistin---vert---ir-alergenai',[
 ['hes_promo_chicken_kebab','Kebabas su vištiena','Chicken kebab',1,52.7,29.2,29],['hes_promo_ruby_ice_latte','Rubinio šokolado skonio ledinė latė','Ruby chocolate iced latte',1,29.3,6.3,2.7],['hes_promo_rhubarb_lemonade','Rabarbarų skonio limonadas','Rhubarb lemonade',1,47.5,0,0],
 ['hes_chili_cheese6','Aitriųjų paprikų sūrio gabaliukai, 6 vnt.','Chili cheese bites, 6 pcs',1,35.7,13.6,20.5],['hes_chili_cheese9','Aitriųjų paprikų sūrio gabaliukai, 9 vnt.','Chili cheese bites, 9 pcs',1,53.5,20.4,30.8],
 ['hes_cola_zero_050','Coca-Cola Zero, 500 ml','Coca-Cola Zero, 500 ml',500,0,.2,0],['hes_sprite_050','Sprite, 500 ml','Sprite, 500 ml',500,33,0,0],['hes_caramel_iced_latte','Karamelinė ledinė latės kava','Caramel iced latte',1,20.7,6.3,2.7],['hes_strawberry_lemonade','Limonadas braškių skonio','Strawberry lemonade',1,7.5,0,0],['hes_passionfruit_lemonade','Pasiflorų skonio limonadas','Passion fruit lemonade',1,7.5,0,0],['hes_cappy_orange','„Cappy“ apelsinų nektaras','Cappy orange nectar',1,37,0,0],['hes_cappy_apple','„Cappy“ obuolių nektaras','Cappy apple nectar',1,36,0,0],['hes_cappy_multifruit','„Cappy“ įvairių vaisių nektaras','Cappy multifruit nectar',1,38,0,0],['hes_iced_peach_tea','Šaltoji persikų arbata','Iced peach tea',1,22,0,0],['hes_iced_lemon_tea','Šaltoji citrinų arbata','Iced lemon tea',1,22,0,0],['hes_neptunas_sparkling','„Neptūnas“ gazuotas vanduo','Neptunas sparkling water',1,0,0,0],['hes_neptunas_still','„Neptūnas“ negazuotas vanduo','Neptunas still water',1,0,0,0],['hes_thick_smoothie','Tirštasis kokteilis','Thick smoothie',1,28,1.4,.6],['hes_poltsamaa_apple','„Põltsamaa“ obuolių gėrimas','Põltsamaa apple drink',1,17.8,0,0],
 ['hes_small_soft_vanilla','Maži minkštieji vaniliniai ledai','Small vanilla soft serve',1,10.8,2.8,4],['hes_small_soft_strawberry','Maži minkštieji ledai su braškių užpilu','Small soft serve with strawberry topping',1,12.8,2.8,4],['hes_small_soft_chocolate','Maži minkštieji ledai su šokoladiniu užpilu','Small soft serve with chocolate topping',1,12.7,2.9,4.7],['hes_small_soft_caramel','Maži minkštieji ledai su karameliniu užpilu','Small soft serve with caramel topping',1,14,2.9,4.6],['hes_milk_choc_donut','Spurga su pienišku šokoladu','Milk chocolate doughnut',1,17.3,1.9,6.7],['hes_white_choc_donut','Spurga su baltu šokoladu','White chocolate doughnut',1,19,1.7,6.3],['hes_choc_chip_cookie','Sausainis su pieniško ir juodo šokolado gabalėliais','Milk and dark chocolate chip cookie',1,30.8,2.7,11],['hes_white_chip_cookie','Sausainis su balto šokolado gabalėliais','White chocolate chip cookie',1,32.5,2.5,11.7],
 ['hes_flat_white','Kava „Flat White“, 200 ml','Flat White coffee, 200 ml',200,3.8,5,2.1],['hes_tea_200','Arbata, 200 ml','Tea, 200 ml',200,0,0,0],['hes_milk_coffee_large','Didelė kava su pienu, 300 ml','Large coffee with milk, 300 ml',300,3.5,4.6,2]
]);
const addOfficialMenu=(brand,label,rows)=>restaurantFoods.push(...rows.map(([id,lt,weight,carbs,protein,fat,restaurantCategory,source])=>({id,restaurant:brand,restaurantLt:label,restaurantEn:label,lt,en:lt,weight,carbs,protein,fat,restaurantCategory,source})));
addOfficialMenu('burgerking','Burger King',[
  ['bklt_blt','B.L.T.',146,8,1.9,74.5,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/blt/'],
  ['bklt_king_fish','Fish King mėsainis',186,40.8,15.8,24.1,'Žuvies mėsainiai','https://www.burgerking.lt/meniu/zuvies-mesainiai/king-fish/'],
  ['bklt_long_cheeseburger','Long Cheeseburger',118.9,31.1,16.2,13,'Long mėsainiai','https://www.burgerking.lt/meniu/long-mesainiai/long-cheeseburger/'],
  ['bklt_vege_whopper_jr','Augalinis Whopper Jr®',141,28,15.2,11,'Augaliniai mėsainiai ir tortilijos','https://www.burgerking.lt/meniu/augaliniai-mesainiai-ir-tortilijos/vege-whopper-jr/'],
  ['bklt_vege_big_king','Augalinis Big King®',182.1,28.3,25.6,27.3,'Augaliniai mėsainiai ir tortilijos','https://www.burgerking.lt/meniu/augaliniai-mesainiai-ir-tortilijos/vege-big-king/'],
  ['bklt_vege_chili_cheese_double_beef','Augalinis Chili Cheese double',177,26.9,28,27.6,'Augaliniai mėsainiai ir tortilijos','https://www.burgerking.lt/meniu/augaliniai-mesainiai-ir-tortilijos/vege-chili-cheese-double-beef/'],
  ['bklt_long_chili_cheese_chicken','Long Chili Cheese Chicken™ komplektas',211,39,13,22,'Mėsainiai ir tortilijos','https://www.burgerking.lt/meniu/Komplektai/meals-long-chili-cheese-chicken/'],
  ['bklt_long_chili_cheese_beef','Long Chili Cheese Beef™ komplektas',249,39.5,45,37.5,'Mėsainiai ir tortilijos','https://www.burgerking.lt/meniu/Komplektai/meals-long-chili-cheese-beef/'],
  ['bklt_vege_long_chicken','Augalinis vištienos skonio mėsainis',212,52.3,25,30.1,'Long mėsainiai','https://www.burgerking.lt/meniu/long-mesainiai/vege-long-chicken/'],
  ['bklt_vege_chicken_wrap','BBQ Augalinė vištienos skonio tortilija',195,46.2,18,24.2,'Augaliniai mėsainiai ir tortilijos','https://www.burgerking.lt/meniu/augaliniai-mesainiai-ir-tortilijos/vege-chicken-wrap/'],
  ['bklt_long_bacon_king','Long Bacon King™',204,29.7,36.3,43.4,'Long mėsainiai','https://www.burgerking.lt/meniu/long-mesainiai/long-bacon-king/'],
  ['bklt_long_chicken','Long Chicken™',212,52.3,25,30.1,'Long mėsainiai','https://www.burgerking.lt/meniu/long-mesainiai/long-chicken/'],
  ['bklt_chili_cheese_double_beef','Chili Cheese Double Beef™',177,26.9,28,27.6,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/chili-cheese-double-beef/'],
  ['bklt_chili_cheese_chicken','Chili Cheese Chicken™',211,39,13,22,'Vištienos mėsainiai','https://www.burgerking.lt/meniu/vistienos-mesainiai/chili-cheese-chicken/'],
  ['bklt_bbq_tortilija_su_vistiena','BBQ tortilija su vištiena',195,46.2,18,24.2,'Augaliniai mėsainiai ir tortilijos','https://www.burgerking.lt/meniu/augaliniai-mesainiai-ir-tortilijos/bbq-tortilija-su-vistiena/'],
  ['bklt_wrapas_su_jautiena','Tortilija su jautiena',364,63.4,47,49.2,'Augaliniai mėsainiai ir tortilijos','https://www.burgerking.lt/meniu/augaliniai-mesainiai-ir-tortilijos/wrapas-su-jautiena/'],
  ['bklt_wrapas_su_augaliniu_paploteliu','Tortilija su augaliniu paplotėliu',283,61.6,11.6,22.2,'Augaliniai mėsainiai ir tortilijos','https://www.burgerking.lt/meniu/augaliniai-mesainiai-ir-tortilijos/wrapas-su-augaliniu-paploteliu/'],
  ['bklt_big_king','Big King®',182.1,28.3,25.6,27.3,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/big-king/'],
  ['bklt_bacon_king','Bacon King™',335,48.7,59.6,71.3,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/bacon-king/'],
  ['bklt_whopper','Whopper®',286.2,51.1,30.4,38.4,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/whopper/'],
  ['bklt_whopper_su_suriu','Whopper® su sūriu',309.2,51.9,34.7,44.6,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/whopper-su-suriu/'],
  ['bklt_dvigubas_whopper_su_suriu','Dvigubas Whopper® su sūriu',393.2,51.9,55,64.5,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/dvigubas-whopper-su-suriu/'],
  ['bklt_dvigubas_whopper','Dvigubas Whopper®',370.2,51.1,50.5,58.3,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/dvigubas-whopper/'],
  ['bklt_steakhouse','Steakhouse™',272,50.4,24.7,46.6,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/steakhouse/'],
  ['bklt_big_king_xxl','Big King XXL®',374.2,51.1,59.2,65.2,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/big-king-xxl/'],
  ['bklt_dvigubas_mesainis_su_suriu','Dvigubas mėsainis su sūriu',163.2,31.5,26.7,22.9,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/dvigubas-mesainis-su-suriu/'],
  ['bklt_mesainis_su_suriu','Mėsainis su sūriu',118.9,31.1,16.2,13,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/mesainis-su-suriu/'],
  ['bklt_mesainis','Mėsainis',107.4,30.7,14,9.9,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/mesainis/'],
  ['bklt_whopper_jr','Whopper JR™',141,28,15.2,11,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/whopper-jr/'],
  ['bklt_whopper_jr_su_suriu','Whopper JR™ su sūriu',152,29,12,20,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/whopper-jr-su-suriu/'],
  ['bklt_be_glitimo_whopper_jr','Be glitimo Whopper JR™',141,29,7,13,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/be-glitimo-whopper-jr/'],
  ['bklt_king_jr_vistienos_kepsneliu_mesainis','King JR™ Vištienos kepsnelių mėsainis',153,38.3,14,18.5,'Mėsainiai ir tortilijos','https://www.burgerking.lt/meniu/Komplektai/king-jr-vistienos-kepsneliu-mesainis/'],
  ['bklt_king_jr_burger','King JR™ Burger',97,30.6,14.3,9.5,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/king-jr-burger/'],
  ['bklt_king_jr_cheeseburger','King JR™ Cheeseburger',108.5,31,16.5,12.6,'Ant grotelių kepti mėsainiai','https://www.burgerking.lt/meniu/ant-groteliu-kepti-mesainiai/king-jr-cheeseburger/'],
  ['bklt_chicken_tendercrisp','Chicken Tendercrisp®',268.6,54.5,31.2,32.5,'Vištienos mėsainiai','https://www.burgerking.lt/meniu/vistienos-mesainiai/chicken-tendercrisp/'],
  ['bklt_chicken_tendercrisp_su_suriu','Chicken Tendercrisp® su sūriu',287,58.9,34,37.6,'Vištienos mėsainiai','https://www.burgerking.lt/meniu/vistienos-mesainiai/chicken-tendercrisp-su-suriu/'],
  ['bklt_crispy_chicken','Crispy Chicken™',153,35.8,14.2,25,'Vištienos mėsainiai','https://www.burgerking.lt/meniu/vistienos-mesainiai/crispy-chicken/'],
  ['bklt_crispy_chicken_su_suriu','Crispy Chicken™ su sūriu',153,35.8,14.2,25,'Vištienos mėsainiai','https://www.burgerking.lt/meniu/vistienos-mesainiai/crispy-chicken-su-suriu/'],
  ['bklt_long_chili_cheese_beef','Long Chili Cheese Beef™',249,39.5,45,37.5,'Long mėsainiai','https://www.burgerking.lt/meniu/long-mesainiai/long-chili-cheese-beef/'],
  ['bklt_long_chili_cheese_chicken','Long Chili Cheese Chicken™',211,39,13,22,'Long mėsainiai','https://www.burgerking.lt/meniu/long-mesainiai/long-chili-cheese-chicken/'],
  ['bklt_didele_porcija_skrudintu_bulvyciu','Didelė porcija skrudintų bulvyčių',159,51.7,5.1,17.6,'Užkandžiai ir padažai','https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/didele-porcija-skrudintu-bulvyciu/'],
  ['bklt_vidutine_porcija_skrudintu_bulvyciu','Vidutinė porcija skrudintų bulvyčių',116,37.7,3.7,12.9,'Užkandžiai ir padažai','https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/vidutine-porcija-skrudintu-bulvyciu/'],
  ['bklt_maza_porcija_skrudintu_bulvyciu','Maža porcija skrudintų bulvyčių',74,24.1,2.4,8.2,'Užkandžiai ir padažai','https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/maza-porcija-skrudintu-bulvyciu/'],
  ['bklt_gruzdintos_bulviu_groteles','Gruzdintos bulvių grotelės',180,63,5.4,30.6,'Užkandžiai ir padažai','https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/gruzdintos-bulviu-groteles/'],
  ['bklt_cheesy_onion_fries','Cheesy Onion Fries',280,76.7,9.8,40.8,'Užkandžiai ir padažai','https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/cheesy-onion-fries/'],
  ['bklt_chili_cheese_fries','Chili Cheese Fries',280,56,6.3,30.6,'Užkandžiai ir padažai','https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/chili-cheese-fries/'],
  ['bklt_mocarelos_lazdeles','Mocarelos lazdelės',69,16.6,9.3,14.6,'Užkandžiai ir padažai','https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/mocarelos-lazdeles/'],
  ['bklt_pikantiski_surio_kamuoliukai','Pikantiški sūrio kamuoliukai',70,22.5,6.3,11.9,'Užkandžiai ir padažai','https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/pikantiski-surio-kamuoliukai/'],
  ['bklt_svogunu_ziedai','Svogūnų žiedai',90,31.1,4,11.3,'Užkandžiai ir padažai','https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/svogunu-ziedai/'],
  ['bklt_vistienos_kepsneliai_ir_padazas','Vištienos kepsneliai ir padažas',68,14.3,8.2,8.2,'Užkandžiai ir padažai','https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/vistienos-kepsneliai-ir-padazas/'],
  ['bklt_augaliniai_kepsneliai_ir_padazas','Augaliniai kepsneliai ir padažas',72,14.3,5.3,8.6,'Užkandžiai ir padažai','https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/augaliniai-kepsneliai-ir-padazas/'],
  ['bklt_bbq_padazas','BBQ veganiškas padažas',25,7.8,0.5,0.5,'Užkandžiai ir padažai','https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/bbq-padazas/'],
  ['bklt_saldziarugstis_padazas','Saldžiarūgštis veganiškas padažas',25,6.9,0.1,0.7,'Užkandžiai ir padažai','https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/saldziarugstis-padazas/'],
  ['bklt_cesnakinis_padazas','Česnakinis padažas',25,0.9,0.4,16,'Užkandžiai ir padažai','https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/cesnakinis-padazas/'],
  ['bklt_grietines_ir_svogunu_padazas','Grietinės ir svogūnų padažas',25,0.3,0.4,17.8,'Užkandžiai ir padažai','https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/grietines-ir-svogunu-padazas/'],
  ['bklt_sriracha_aitriuju_papriku_padazas','Sriracha aitriųjų paprikų padažas',25,1.1,0.3,16,'Užkandžiai ir padažai','https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/sriracha-aitriuju-papriku-padazas/'],
  ['bklt_kecupas_padazas','Kečupas padažas',10,4.6,0.2,0,'Užkandžiai ir padažai','https://www.burgerking.lt/meniu/uzkandziai-ir-padazai/kecupas-padazas/'],
  ['bklt_king_sundae_citrina','King Sundae Citrina',150,39.6,4.5,8.5,'Desertai','https://www.burgerking.lt/meniu/desertai/king-sundae-citrina/'],
  ['bklt_king_sundae_biscoff','Biscoff® King Sundae',150,46.5,5,9.6,'Desertai','https://www.burgerking.lt/meniu/desertai/king-sundae-biscoff/'],
  ['bklt_king_sundae_strawberry','King Sundae su braškiniu padažu',150,39.6,4.5,8.5,'Desertai','https://www.burgerking.lt/meniu/desertai/king-sundae-strawberry/'],
  ['bklt_king_sundae_su_sokoladu','King Sundae su šokoladu',150,37,3.8,6.9,'Desertai','https://www.burgerking.lt/meniu/desertai/king-sundae-su-sokoladu/'],
  ['bklt_king_sundae_su_karamele','King Sundae su karamele',150,39.6,4.5,8.5,'Desertai','https://www.burgerking.lt/meniu/desertai/king-sundae-su-karamele/'],
  ['bklt_king_sundae_be_padazo','King Sundae be padažo',150,37,3.8,6.9,'Desertai','https://www.burgerking.lt/meniu/desertai/king-sundae-be-padazo/'],
  ['bklt_mini_king_fusion_oreo','Mini King Fusion Oreo®',160,41.8,5.8,11.2,'Desertai','https://www.burgerking.lt/meniu/desertai/mini-king-fusion-oreo/'],
  ['bklt_milk_shake_oreo','Ledų kokteilis Oreo®',330,69.5,9.1,8.1,'Desertai','https://www.burgerking.lt/meniu/desertai/milk-shake-oreo/'],
  ['bklt_milk_shake_vanilla','Vanilinis ledų kokteilis',330,58.7,10.7,8.9,'Desertai','https://www.burgerking.lt/meniu/desertai/milk-shake-vanilla/'],
  ['bklt_milk_shake_strawberry','Braškinis ledų kokteilis',330,70.8,8.6,7.1,'Desertai','https://www.burgerking.lt/meniu/desertai/milk-shake-strawberry/'],
  ['bklt_milk_shake_chocolate','Šokoladinis ledų kokteilis',330,70.8,8.6,7.1,'Desertai','https://www.burgerking.lt/meniu/desertai/milk-shake-chocolate/'],
  ['bklt_shokoladinis_braunis','Šokoladinis Braunis',80,38.1,5.4,30.8,'Desertai','https://www.burgerking.lt/meniu/desertai/shokoladinis-braunis/']
]);
addOfficialMenu('kfc','KFC',[
  ['kfclt_1','Originalaus recepto kulšelė',100,8.4,19,13,'Vištiena','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_2','Originalaus recepto vištienos lazdelė',47,6.1,10.3,5.6,'Vištiena','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_3','Originalaus recepto vištienos krūtinėlė',95,9,18,14.4,'Vištiena','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_4','Aštrūs sparneliai (1 vnt.)',46,6.9,7.8,11,'Vištiena','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_5','Ypač traški vištienos lazdelė',60,7.8,12,8.4,'Vištiena','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_6','Aštri vištienos šlaunelių mėsa',105,18.8,23.2,25.4,'Vištiena','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_7','KFC Nugget (1 vnt.)',18,2.3,4,2.2,'Vištiena','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_8','KFC Nugget su Korean BBQ glazūra (1 vnt.)',25.5,5.4,4.1,2.2,'Vištiena','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_9','Veggie traški lazdelė',31,3.4,3.7,2.8,'Vištiena','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_10','Traškus vištienos sumuštinis originalaus recepto',122,35.4,15.9,14.6,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_11','Traškus vištienos sumuštinis ypač traškaus recepto',135,37.8,17.6,17.6,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_12','Crispy Deluxe sumuštinis originalaus recepto',131,35.4,15.7,18.3,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_13','Crispy Deluxe sumuštinis ypač traškaus recepto',144,37.4,17.3,21.6,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_14','Vištienos sumuštinis su sūriu originalaus recepto',144,38.9,18.7,10.5,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_15','Vištienos sumuštinis su sūriu ypač traškaus recepto',157,40.8,20.4,13.5,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_16','Dvigubas vištienos sumuštinis su sūriu originalaus recepto',191,43.9,28.6,16,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_17','Dvigubas vištienos sumuštinis su sūriu ypač traškaus recepto',217,47.7,32.6,21.7,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_18','American i-Twister tortilija originalaus recepto',125,28.8,16.2,15,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_19','American i-Twister tortilija ypač traškaus recepto',138,30.4,17.9,17.9,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_20','Kentucky Gold i-Twister tortilija originalaus recepto',131,32.8,14.4,15.7,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_21','Kentucky Gold i-Twister tortilija ypač traškaus recepto',144,34.6,15.8,18.7,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_22','Zinger sumuštinis',194,46.6,27.2,42.7,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_23','Fillet sumuštinis',184,38.6,23.9,33.1,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_24','Jalapeno Zinger sumuštinis',215,49.4,30.1,38.7,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_25','Jalapeno Fillet sumuštinis',205,41,26.6,28.7,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_26','Jalapeno Wrapper tortilija originalaus recepto',230,46,27.6,32.2,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_27','Jalapeno Wrapper tortilija aštri',240,52.8,31.2,43.2,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_28','K-Zinger sumuštinis',283,73.6,31.1,36.8,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_29','K-Fillet sumuštinis',263,60.5,28.9,28.9,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_30','K-Twister tortilija originalaus recepto',241,60.2,26.5,22.9,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_31','K-Twister tortilija ypač traškaus recepto',277,66.5,30.5,27.7,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_32','Grander Texas sumuštinis originalaus recepto',281,53.4,30.9,39.3,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_33','Grander Texas sumuštinis aštrus',291,61.1,34.9,49.5,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_34','Twister tortilija originalaus recepto',228,45.6,27.4,29.6,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_35','Twister tortilija ypač traškaus recepto',254,48.3,30.5,35.6,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_36','Coleslaw sumuštinis originalaus recepto',250,50,24.5,32.5,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_37','Coleslaw sumuštinis aštrus',260,57.2,28.6,41.6,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_38','Kentucky Gold Twister tortilija originalaus recepto',228,50.2,27.4,22.8,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_39','Kentucky Gold Twister tortilija ypač traškaus recepto',254,53.3,30.5,27.9,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_40','Boxmaster tortilija originalaus recepto',278,50,27.8,50,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_41','Boxmaster tortilija aštri',288,57.6,31.7,57.6,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_42','Kentucky Gold Grander sumuštinis originalaus recepto',247,56.8,32.1,39.5,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_43','Kentucky Gold Grander sumuštinis aštrus',257,64.2,33.4,48.8,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_44','Deluxe pusryčių sumuštinis',112,32.5,10.1,20.2,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_45','Deluxe pusryčių sumuštinis su šonine',131,32.8,12.6,24.9,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_46','Veggie Fillet sumuštinis',151,36.2,12.1,24.2,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_47','Veggie Twister tortilija',208,41.6,13.1,17.3,'Sumuštiniai ir tortilijos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_48','Bulvių paplotėlis',37,5.9,0.6,11.5,'Užkandžiai ir salotos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_49','Maža bulvyčių porcija',70,13.3,1.6,7.7,'Užkandžiai ir salotos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_50','Vidutinė bulvyčių porcija',120,22.8,2.8,13.2,'Užkandžiai ir salotos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_51','Didelė bulvyčių porcija',170,32.3,3.9,18.7,'Užkandžiai ir salotos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_52','Vidutinė traškių banguotų bulvyčių porcija',110,24.2,2.5,13.2,'Užkandžiai ir salotos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_53','Didelė traškių banguotų bulvyčių porcija',165,36.3,3.8,19.8,'Užkandžiai ir salotos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_54','Obuolių skiltelės',70,9.1,0.2,0.1,'Užkandžiai ir salotos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_55','Kamambero sūrio gabaliukai (3 vnt.)',72,13,6.9,20.9,'Užkandžiai ir salotos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_56','Coleslaw kopūstų salotos',120,13.2,1.3,10.7,'Užkandžiai ir salotos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_57','Cezario salotos su vištiena originalaus recepto',217,16.7,26,15.8,'Užkandžiai ir salotos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_58','Cezario salotos su vištiena ypač traškaus recepto',217,16.9,23.9,18.7,'Užkandžiai ir salotos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_59','Cezario salotos su Veggie lazdelėmis',185,11.7,11.8,10.5,'Užkandžiai ir salotos','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_60','Kečupas',25,7,0.3,0.1,'Padažai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_61','Barbekiu padažas',25,5.8,0.4,0.1,'Padažai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_62','Česnakinis padažas',25,1.8,0.6,12.8,'Padažai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_63','Saldus čili padažas',25,10.5,0.1,0.1,'Padažai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_64','Majonezinis padažas',25,1.1,0.2,13,'Padažai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_65','Kentucky Gold padažas',25,6.5,0.2,9,'Padažai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_66','Supercharger aštrus padažas',30,3.3,0.3,14.1,'Padažai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_67','Maža spurga su karamele',23,11,1,5.3,'Desertai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_68','Maža spurga su braškių įdaru',23,9.9,0.9,4.8,'Desertai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_69','Maža spurga su baltu glajumi ir pabarstukais',18,8.3,0.9,4.9,'Desertai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_70','Vanilinis ledų kokteilis, 250 ml',250,47.5,4.2,7,'Desertai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_71','Šokoladinis ledų kokteilis, 250 ml',250,45,4.2,7,'Desertai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_72','Braškinis ledų kokteilis, 250 ml',250,45,4.2,7,'Desertai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_73','Tiramisu',100,34,2.5,12,'Desertai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_74','Coca-Cola, 250 ml',250,27.5,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_75','Coca-Cola, 400 ml',400,44,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_76','Coca-Cola, 500 ml',500,55,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_77','Coca-Cola Zero, 250 ml',250,0,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_78','Coca-Cola Zero, 400 ml',400,0,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_79','Coca-Cola Zero, 500 ml',500,0,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_80','Cappy multivitaminų sultys, 330 ml',330,36.3,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_81','Cappy apelsinų sultys, 330 ml',330,29.4,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_82','Cappy obuolių sultys, 330 ml',330,36.3,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_83','Fuzetea žalioji šalta arbata, 500 ml',500,23,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_84','Fuzetea citrinų skonio šaltoji arbata, 500 ml',500,22,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_85','Fuzetea persikų skonio šaltoji arbata, 500 ml',500,22.5,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_86','Pasiflorų skonio limonadas, 300 ml',300,27.9,0.3,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_87','Kivių skonio limonadas, 300 ml',300,27.6,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_88','Greipfrutų skonio limonadas, 300 ml',300,39,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_89','Pasiflorų skonio burbulinis limonadas, 300 ml',300,36,0.3,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_90','Kivių skonio burbulinis limonadas, 300 ml',300,36,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_91','Greipfrutų skonio burbulinis limonadas, 300 ml',300,45,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_92','Red Bull Original, 250 ml',250,27.5,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_93','Red Bull Sugarfree, 250 ml',250,0,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_94','Red Bull Apricot, 250 ml',250,27.5,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_95','Red Bull curacao infusion (Original), 300 ml',300,42,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_96','Red Bull curacao infusion (Sugarfree), 300 ml',300,15.3,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_97','Red Bull berry infusion (Apricot), 300 ml',300,51,0,0,'Gėrimai','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_98','Juoda kava, 200 ml',200,1.2,0.4,0.4,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_99','Juoda kava, 300 ml',300,1.8,0.6,0.6,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_100','Juoda kava su pienu, 200 ml',200,6.4,4,4,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_101','Juoda kava su pienu, 300 ml',300,9.6,6,6,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_102','Kapučino, 200 ml',200,7.4,4.6,4.6,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_103','Kapučino, 300 ml',300,11.1,6.9,6.9,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_104','Latė, 200 ml',200,6.8,4.2,4.2,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_105','Latė, 300 ml',300,10.2,6.3,6.3,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_106','Flat white, 200 ml',200,6.2,3.6,3.8,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_107','Šalta latė, 300 ml',300,33,6.3,6.3,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_108','Sūdytos karamelės latė, 300 ml',300,26.1,6.3,6.3,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_109','Šalta sūdytos karamelės latė, 300 ml',300,26.1,6.3,6.3,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_110','Šalta karamelinė macchiato, 300 ml',300,33,7.5,7.8,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_111','Šokoladinių sausainių latė, 300 ml',300,26.4,6.3,6.3,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_112','Šalta šokoladinių sausainių latė, 300 ml',300,26.4,6.3,6.3,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_113','Pumpkin spice latė, 300 ml',300,26.4,6.3,6.3,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_114','Šalta pumpkin spice latė, 300 ml',300,26.4,6.3,6.3,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_115','Šalta mocha, 300 ml',300,33,7.5,7.2,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_116','Juoda arbata, 300 ml',300,0,0,0,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_117','Žalia arbata, 300 ml',300,0,0,0,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf'],
  ['kfclt_118','Vaisinė arbata, 300 ml',300,0,0,0,'Kava ir arbata','https://kfc.lt/wp-content/uploads/2026/04/NUTRITIONS-LT.pdf']
]);
restaurantFoods.push(...lidlBakery);
for(const f of restaurantFoods){if(f.restaurant==='mcdonalds'&&!f.restaurantCategory)f.restaurantCategory='Mėsainiai ir McWrap™';if(f.restaurant==='hesburger'){const n=f.lt.toLocaleLowerCase();f.restaurantCategory=n.includes('pusry')?'Pusryčiai':n.includes('tortil')?'Tortilijos':n.includes('salot')?'Salotos':n.includes('bulvyt')?'Skrudintos bulvytės':n.includes('padaž')||n.includes('majonez')||n.includes('kečup')?'Padažai':n.includes('kokteil')?'Pieno kokteiliai':n.includes('kava')||n.includes('latė')||n.includes('kapuč')||n.includes('espres')||n.includes('arbata')?'Karštieji gėrimai':n.includes('ledai')||n.includes('spurga')||n.includes('sausain')?'Desertai':n.includes('cola')||n.includes('coca')||n.includes('fanta')||n.includes('sprite')||n.includes('vanduo')||n.includes('limonad')||n.includes('obuolių gėr')||n.includes('pienas')?'Gėrimai':n.includes('mėsain')||n.includes('sumuštin')?'Mėsainiai':n.includes('vištienos kepsnel')||n.includes('filė')||n.includes('sūrio gabal')||n.includes('sojų lazdel')||n.includes('žiedai')?'Specialieji patiekalai':n.includes('veke')?'Vegetariški produktai':'Mėsainiai';f.restaurantCategories=[f.restaurantCategory];if(n.includes('veke'))f.restaurantCategories.push('Vegetariški produktai');if(f.id.startsWith('hes_promo_'))f.restaurantCategories.push('Akcijos');}}
const mcMacroOverrides={
 'Mėsainis':[29,13,8.9],'Mėsainis su sūriu':[30,16,13],'Big Tasty™ originalus':[36,39,42],
 'McToast™ su dvigubu sūriu':[28,10,10],'McToast™ su šonine ir sūriu':[28,12,13],'McMuffin™ su kiaušiniu':[26,16,13],
 'McMuffin™ su kiauliena':[26,18,18],'McMuffin™ su kiauliena ir kiaušiniu':[26,25,25],'McMuffin™ su šonine ir kiaušiniu':[26,18,15],
 'DeLuxe McMuffin™ su kiauliena':[28,18,21],'DeLuxe McMuffin™ su vištiena':[38,14,14],
 'Dvigubas DeLuxe McMuffin™ su kiauliena':[28,28,32],
 'Pusryčių McWrap™ su vištiena ir šonine':[44,18,26],
 'Pusryčių McWrap™ su kiauliena ir kiaušiniu':[35,23,36],
 'Bulvių paplotėlis':[17,1.7,7],
 'Mėsainis su vištiena ir trigubu čederiu':[54,35,43],'Mėsainis su jautiena ir trigubu čederiu':[30,38,39],
 'Mėsainis su kiauliena ir trigubu čederiu':[31,30,50],
 'McCrispy®':[56,21,25],'Užkandžių suktinukas su medaus garstyčių padažu':[34,13,14],
 'Kiaulienos mėsainis su sūriu':[28,14,23],'Tasty Jr.™':[32,16,18],
 'Chickenburger™':[37,11,14],'Dvigubas mėsainis su sūriu':[31,26,23],
 'McRoyal®':[38,32,27],'Big Tasty™ su šonine':[36,41,44],
 'McWrap™ su vištiena ir šonine':[50,25,21],'McChicken™':[49,21,17],
 'Filet-o-Fish™':[37,15,14],
 'BIG ARCH®':[54,51,86],'Traškūs vištienos gabalėliai, 5 vnt':[47,39,34],
 'Mažosios daržovių salotos':[1.9,.8,.2],
 'Cezario salotos su traškia vištiena':[17,24,17],
 'Obuolių skiltelės':[13,.1,.4],
 'Traškūs vištienos gabalėliai, 3 vnt':[28,23,21],
 'Mac’n’Cheese kąsneliai, 4 vnt.':[23.8,5.4,8.8],
 'Mac’n’Cheese kąsneliai, 6 vnt.':[35.7,8.2,13.3],
 'Didelė bulvyčių bangelių porcija':[75,14,41],
 'Vidutinė porcija BBQ bulvyčių':[50,5.14,17],
 'Didelė porcija BBQ bulvyčių':[64,6.6,22],
 'Aštrūs sūrio gabalėliai, 4 vnt.':[20.8,6.7,11],
 'Aštrūs sūrio gabalėliai, 6 vnt.':[31,10,17],
 'Chicken McNuggets™, 4 vnt.':[13,11,8.6],
 'Chicken McNuggets™, 6 vnt.':[20,17,13],
 'Chicken McNuggets™, 9 vnt.':[30,25,19],
 'Chicken McNuggets™, 20 vnt.':[67,55,43],
 'Maža skrudintų bulvyčių porcija':[29,2.8,11],
 'Vidutinė skrudintų bulvyčių porcija':[41,3.9,16],
 'Didelė skrudintų bulvyčių porcija':[54,5.2,21],
 '„McFlurry™“ su „Lion®“':[42,5.8,8],'McFlurry™ su Lion®':[42,5.8,8],
 'Ananaso gabalėlis':[7.9,.3,.2],
 'Mini McFlurry™Oreo®':[27,3.6,5.3],'Mini McFlurry™ Oreo®':[27,3.6,5.3],
 'Mini McFlurry™Oreo®':[27,3.6,5.3],
 'Vanilinis ledų kokteilis, 250 ml':[36,5.1,3.7],
 'Šokoladinis ledų kokteilis, 250 ml':[36,5.5,4],
 'Braškinis ledų kokteilis, 250 ml':[36,5.1,3.7],
 'Obuolių pyragėlis':[28,2.3,12],
 'Vyšnių pyragėlis':[34,2.7,10],
 'McSundae™ ledai su karamele':[53,4.7,6.1],
 'McSundae™ ledai su šokoladu':[45,5.5,8.2],
 'McSundae™ ledai su braškių užpilu':[43,4.1,4.1],
 'McFlurry™ Oreo®':[48,5.7,9.7],
 'Šokoladinis ledų kokteilis, 400 ml':[57,8.9,6.4],
 'Braškinis ledų kokteilis, 400 ml':[58,8.1,5.9],
 'Vanilinis ledų kokteilis, 400 ml':[57,8.1,5.9],
 'Medaus garstyčių padažas':[7.4,.3,1.4],
 'Medaus garstyčių padažas.':[7.4,.3,1.4],
 'Kreminis Čili padažas':[4.5,.2,5],
 'Meksikietiškas čederio padažas, 100 ml':[2,10,14.5],
 'Kečupas':[7.8,.4,0],
 'Grietinės padažas':[2.3,.5,11],
 'Česnakinis padažas':[.9,.3,18],
 'Saldžiarūgštis padažas':[12,.1,.4],
 'Barbekiu padažas':[11,.2,.3],
 'Cezario padažas':[3,1.4,9.1],
 'Coca-Cola® Vyšnių Zero, 250 ml':[0,0,0],'Coca-Cola® Vyšnių Zero, 400 ml':[0,0,0],'Coca-Cola® Vyšnių Zero, 500 ml':[0,0,0],
 'Capri-S Mystic Dragon sulčių gėrimas':[10,1,1],'Pasiflorų X Sprite®, 400 ml':[23.2,0,0],
 'Coca-Cola®, 250 ml':[26,0,0],'Coca-Cola®, 400 ml':[42,0,0],'Coca-Cola®, 500 ml':[53,0,0],
 'Coca-Cola Zero®, 250 ml':[0,0,0],'Coca-Cola Zero®, 400 ml':[0,0,0],'Coca-Cola Zero®, 500 ml':[0,0,0],
 'Fanta®, 250 ml':[26,0,0],'Fanta®, 400 ml':[41,0,0],'Fanta®, 500 ml':[52,0,0],
 'Sprite®, 250 ml':[22.8,0,0],'Sprite®, 400 ml':[36.4,0,0],'Sprite®, 500 ml':[46,0,0],
 'Lipton® persikų skonio šalta arbata, 250 ml':[12,0,0],'Lipton® persikų skonio šalta arbata, 400 ml':[18,0,0],'Lipton® persikų skonio šalta arbata, 500 ml':[23,0,0],
 'Natūralus mineralinis vanduo':[0,0,0],'Gazuotas mineralinis vanduo':[0,0,0],
 'Cappy® obuolių sultys, 250 ml':[30,.3,0],'Cappy® obuolių sultys, 400 ml':[44,.3,0],
 'Cappy® apelsinų sultys, 250 ml':[25,2,0],'Cappy® apelsinų sultys, 400 ml':[35,2.7,.6],
 'Pienas „Rasēns“':[9.6,6,3],'Braškių skonio pieno gėrimas „Rasēns“':[22,5.6,3],
 'Žalioji arbata, 200 ml':[.2,0,0],'Žalioji arbata, 300 ml':[.4,0,0],'Žalioji arbata, 400 ml':[.6,0,0],
 'Juodoji arbata, 200 ml':[.6,0,0],'Juodoji arbata, 300 ml':[.9,0,0],'Juodoji arbata, 400 ml':[1.2,0,0],
 'Vaisinė arbata, 200 ml':[.6,0,0],'Vaisinė arbata, 300 ml':[1.1,0,0],'Vaisinė arbata, 400 ml':[1.3,0,0],
 'Mėtų arbata, 200 ml':[.6,0,0],'Mėtų arbata, 300 ml':[.9,0,0],'Mėtų arbata, 400 ml':[1.2,0,0],
 'Juoda kava, 200 ml':[.6,.4,0],'Juoda kava, 300 ml':[.9,.6,0],'Juoda kava, 400 ml':[1.2,.8,0],
 'Espresas':[.1,.1,0],'Dvigubas Espresas':[.2,.1,0],
 'Juoda kava su pienu, 200 ml':[2.9,1.9,1.7],'Juoda kava su pienu, 300 ml':[4.1,2.6,2.3],'Juoda kava su pienu, 400 ml':[6.2,4,3.6],
 'Kapučinas, 200 ml':[5.9,3.8,4],'Kapučinas, 300 ml':[7.4,4.8,4.9],'Kapučinas, 400 ml':[10,6.4,6.6],
 'Latė, 300 ml':[8.8,5.6,5.9],'Latė, 400 ml':[9.9,6.4,6.6],
 'Dvigubas Big Tasty™':[37,66,70],
 'Big Mac®':[46,28,28],
 'Fletvaitas':[12,8.5,8]
};
for(const f of restaurantFoods){if(f.restaurant==='mcdonalds'&&mcMacroOverrides[f.lt]){[f.carbs,f.protein,f.fat]=mcMacroOverrides[f.lt];f.weight=1;}}
const mcProductSources={
 'Big Tasty™ originalus':'https://mcd.lt/product/big-tasty-originalus/','Mėsainis su vištiena ir trigubu čederiu':'https://mcd.lt/product/mesainis-su-vistiena-ir-trigubu-cederiu/','Mėsainis su jautiena ir trigubu čederiu':'https://mcd.lt/product/mesainis-su-jautiena-ir-trigubu-cederiu/','Mėsainis su kiauliena ir trigubu čederiu':'https://mcd.lt/product/mesainis-su-kiauliena-ir-trigubu-cederiu/','BIG ARCH®':'https://mcd.lt/product/big-arch/','McCrispy®':'https://mcd.lt/product/mccrispy/','Užkandžių suktinukas su medaus garstyčių padažu':'https://mcd.lt/product/uzkandziu-suktinukas-su-medaus-garstyciu-padazu/','Big Mac®':'https://mcd.lt/product/big-mac-2/','Kiaulienos mėsainis su sūriu':'https://mcd.lt/product/kiaulienos-mesainis-su-suriu-2/','Tasty Jr.™':'https://mcd.lt/product/tasty-jr/','Dvigubas Big Tasty™':'https://mcd.lt/product/dvigubas-big-tasty/','Mėsainis':'https://mcd.lt/product/mesainis/','Mėsainis su sūriu':'https://mcd.lt/product/mesainis-su-suriu/','Chickenburger™':'https://mcd.lt/product/chickenburger/','Dvigubas mėsainis su sūriu':'https://mcd.lt/product/dvigubas-mesainis-su-suriu/','McRoyal®':'https://mcd.lt/product/mcroyal/','Big Tasty™ su šonine':'https://mcd.lt/product/big-tasty-su-sonine/','McWrap™ su vištiena ir šonine':'https://mcd.lt/product/mcwrap-su-vistiena-ir-sonine/','McChicken™':'https://mcd.lt/product/mcchicken/','Filet-o-Fish™':'https://mcd.lt/product/filet-o-fish/','McToast™ su dvigubu sūriu':'https://mcd.lt/product/mctoast-su-dvigubu-suriu/','McToast™ su šonine ir sūriu':'https://mcd.lt/product/mctoast-su-sonine-ir-suriu/','McMuffin™ su kiaušiniu':'https://mcd.lt/product/mcmuffin-su-kiausiniu/','McMuffin™ su kiauliena':'https://mcd.lt/product/mcmuffin-su-kiauliena/','McMuffin™ su kiauliena ir kiaušiniu':'https://mcd.lt/product/mcmuffin-su-kiauliena-ir-kiausiniu/','McMuffin™ su šonine ir kiaušiniu':'https://mcd.lt/product/mcmuffin-su-sonine-ir-kiausiniu/','DeLuxe McMuffin™ su kiauliena':'https://mcd.lt/product/deluxe-mcmuffin-su-kiauliena/','DeLuxe McMuffin™ su vištiena':'https://mcd.lt/product/deluxe-mcmuffin-su-vistiena/','Dvigubas DeLuxe McMuffin™ su kiauliena':'https://mcd.lt/product/dvigubas-deluxe-mcmuffin-su-kiauliena/','Pusryčių McWrap™ su vištiena ir šonine':'https://mcd.lt/product/pusryciu-mcwrap-su-vistiena-ir-sonine/','Pusryčių McWrap™ su kiauliena ir kiaušiniu':'https://mcd.lt/product/pusryciu-mcwrap-su-kiauliena-ir-kiausiniu/','Bulvių paplotėlis':'https://mcd.lt/product/bulviu-paplotelis/','Traškūs vištienos gabalėliai, 5 vnt':'https://mcd.lt/product/traskus-vistienos-gabaleliai-5-vnt/','Mažosios daržovių salotos':'https://mcd.lt/product/mazosios-darzoviu-salotos/','Cezario salotos su traškia vištiena':'https://mcd.lt/product/cezario-salotos-su-traskia-vistiena/'
};
Object.assign(mcProductSources,{
 'McFlurry™ su Lion®':'https://mcd.lt/product/mcflurry-su-lion/',
 'Mini McFlurry™ Oreo®':'https://mcd.lt/product/mini-mcflurryoreo/',
 'Medaus garstyčių padažas':'https://mcd.lt/product/medaus-garstyciu-padazas/',
 'Medaus garstyčių padažas.':'https://mcd.lt/product/medaus-garstyciu-padazas/',
 'Sprite®, 250 ml':'https://mcd.lt/product/sprite-250-ml/',
 'Pienas „Rasēns“':'https://mcd.lt/product/pienas/',
 'Braškių skonio pieno gėrimas „Rasēns“':'https://mcd.lt/product/braskiu-skonio-pieno-gerimas-rasens/'
});
for(const f of restaurantFoods){if(f.restaurant==='mcdonalds'&&f.lt==='Big Mac®')f.nutritionSource='https://www.macros.lt/mc';}
for(const f of restaurantFoods){if(f.restaurant==='mcdonalds'&&mcProductSources[f.lt])f.source=mcProductSources[f.lt];}
addRestaurantMenu('hesburger','Hesburger','Lietuva','https://www.hesburger.lt/maistin---vert---ir-alergenai',[
 ['hes_mega_burger','„Megos“ mėsainis','Mega burger',1,58.5,41.9,71.8],['hes_crispy_fillet4','Traški vištienos filė, 4 vnt. su 2 padažais','Crispy chicken fillet, 4 pcs with 2 dips',1,31.2,39,21.1],['hes_crispy_fillet6','Traški vištienos filė, 6 vnt. su 3 padažais','Crispy chicken fillet, 6 pcs with 3 dips',1,46.8,58.5,31.6],['hes_chili_cheese','Aitriųjų paprikų sūrio gabaliukai, 4 vnt.','Chili cheese bites, 4 pcs',1,23.8,9.1,13.7],
 ['hes_pickle_mayo','Agurkinis majonezas','Pickle mayonnaise',1,2.3,.9,22],['hes_veke_spicy_mayo','VEKEMAJO® aitriųjų paprikų majonezo padažas','VEKEMAJO® spicy mayonnaise dip',1,2.4,.2,17.2],['hes_veke_natural_mayo','VEKEMAJO® natūralus majonezo padažas','VEKEMAJO® natural mayonnaise dip',1,5.2,.1,22.4],['hes_curry_mayo','Majonezas su kariu','Curry mayonnaise',1,3.5,.7,21.3],['hes_veke_garlic_mayo','VEKEMAJO® česnakinis majonezo padažas','VEKEMAJO® garlic mayonnaise dip',1,3.8,.1,21.2],['hes_cheddar_dip','Čederio skonio padažas','Cheddar dip',1,2.5,1.1,9.2],['hes_house_salad_dressing','Lengvas „Naminis“ salotų padažas','Light house salad dressing',1,11.2,.5,8.4],['hes_steak_sauce','Kepsnių padažas','Steak sauce',1,8.6,.4,0],['hes_ketchup','Kečupas','Ketchup',1,5.2,.3,.1],
 ['hes_cola_04','Coca-Cola, 400 ml','Coca-Cola, 400 ml',400,42.4,0,0],['hes_cola_05','Coca-Cola, 500 ml','Coca-Cola, 500 ml',500,53,0,0],['hes_cola_zero_025','Coca-Cola Zero, 250 ml','Coca-Cola Zero, 250 ml',250,0,.1,0],['hes_cola_zero_04','Coca-Cola Zero, 400 ml','Coca-Cola Zero, 400 ml',400,0,.2,0],['hes_fanta_025','Fanta, 250 ml','Fanta, 250 ml',250,26.5,0,0],['hes_fanta_04','Fanta, 400 ml','Fanta, 400 ml',400,42.4,0,0],['hes_fanta_05','Fanta, 500 ml','Fanta, 500 ml',500,53,0,0],['hes_sprite_025','Sprite, 250 ml','Sprite, 250 ml',250,16.5,0,0],['hes_sprite_04','Sprite, 400 ml','Sprite, 400 ml',400,26.4,0,0],['hes_strawberry_milk','Braškių skonio pienas','Strawberry milk',1,22,5.6,3],
 ['hes_choco_sundae','Ledai su šokoladiniais saldainiais ir šokoladiniu užpilu','Ice cream with chocolate candies and topping',1,40.3,6.4,13.1],['hes_strawberry_sundae','Ledai su braškių skonio saldainiais ir braškiniu užpilu','Ice cream with strawberry candies and topping',1,45.3,5.6,8],['hes_caramel_sundae','Ledai su karameliniais spragėsiais ir karameliniu užpilu','Ice cream with caramel popcorn and topping',1,46.6,4.8,13],['hes_soft_vanilla','Vaniliniai minkštieji ledai','Vanilla soft serve',1,21.6,5.5,7.9],['hes_soft_strawberry','Minkštieji ledai su braškiniu užpilu','Soft serve with strawberry topping',1,29.4,5.6,8],['hes_soft_chocolate','Minkštieji ledai su šokoladiniu užpilu','Soft serve with chocolate topping',1,29,6,10.7],['hes_soft_caramel','Minkštieji ledai su karameliniu užpilu','Soft serve with caramel topping',1,34.4,6.2,10.3],['hes_strawberry_shake','Braškinis pieno kokteilis, 0,4 l','Strawberry shake, 0.4 l',400,59.1,12.7,17.2],['hes_chocolate_shake','Šokoladinis pieno kokteilis, 0,4 l','Chocolate shake, 0.4 l',400,63.1,12.9,15.6],['hes_banana_shake','Bananinis pieno kokteilis, 0,4 l','Banana shake, 0.4 l',400,62,12.6,17.7],['hes_milk_coffee','Kava su pienu, 200 ml','Coffee with milk, 200 ml',200,2.2,2.8,1.2],['hes_cappuccino','Kapučinas, 200 ml','Cappuccino, 200 ml',200,3.4,4.4,1.9],['hes_latte','Latės kava, 300 ml','Latte, 300 ml',300,6.1,7.9,3.4],['hes_espresso','Espresas, 30 ml','Espresso, 30 ml',30,0,0,0]
]);

for(const f of restaurantFoods){if(f.restaurant==='mcdonalds'&&!f.restaurantCategory)f.restaurantCategory='Mėsainiai ir McWrap™';if(f.restaurant==='hesburger'){const n=f.lt.toLocaleLowerCase();f.restaurantCategory=n.includes('pusry')?'Pusryčiai':n.includes('tortil')?'Tortilijos':n.includes('salot')?'Salotos':n.includes('bulvyt')?'Skrudintos bulvytės':n.includes('padaž')||n.includes('majonez')||n.includes('kečup')?'Padažai':n.includes('kokteil')?'Pieno kokteiliai':n.includes('kava')||n.includes('latė')||n.includes('kapuč')||n.includes('espres')||n.includes('arbata')?'Karštieji gėrimai':n.includes('ledai')||n.includes('spurga')||n.includes('sausain')?'Desertai':n.includes('cola')||n.includes('coca')||n.includes('fanta')||n.includes('sprite')||n.includes('vanduo')||n.includes('limonad')||n.includes('obuolių gėr')||n.includes('pienas')?'Gėrimai':n.includes('mėsain')||n.includes('sumuštin')?'Mėsainiai':n.includes('vištienos kepsnel')||n.includes('filė')||n.includes('sūrio gabal')||n.includes('sojų lazdel')||n.includes('žiedai')?'Specialieji patiekalai':n.includes('veke')?'Vegetariški produktai':'Mėsainiai';f.restaurantCategories=[f.restaurantCategory];if(n.includes('veke'))f.restaurantCategories.push('Vegetariški produktai');if(f.id.startsWith('hes_promo_'))f.restaurantCategories.push('Akcijos');}}

// Generic foods get names from the language packs; brand and restaurant items keep their English names
Object.entries(LANGUAGE_PACKS).forEach(([code, pack]) => foodCatalog.forEach(f => pack.foods?.[f.id] && (f[code] = pack.foods[f.id])));
const foodName = f => (language === 'lt' ? f.lt : f[language] || f.en);
const foodCategory = f => tx(f.catEn, f.catLt);
// Portion names exist in Lithuanian and English; other languages show just the amount
const portionText = (p, unit = 'g') => (language === 'lt' ? p[1] : language === 'en' || /^[\d.,\s]+(g|ml)$/i.test(p[2]) ? p[2] : `~${formatAmount(Number(p[0]))} ${unit || 'g'}`);

function getGiCategory(gi) {
  if (gi === null || gi === undefined || gi === '' || !Number.isFinite(Number(gi))) return { label: t('giUnknown'), className: 'gi-none' };
  if (gi <= 55) return { label: t('lowGiLabel'), className: 'gi-low' };
  if (gi <= 69) return { label: t('mediumGiLabel'), className: 'gi-medium' };
  return { label: t('highGiLabel'), className: 'gi-high' };
}

function renderGi(food) {
  const c = getGiCategory(food?.gi);
  if (food?.gi === null || food?.gi === undefined || food?.gi === '' || !Number.isFinite(Number(food.gi)))
    return `<div class="gi-info-row"><span class="gi-badge gi-none">${t('giUnknown')}</span></div>`;
  return `<div class="gi-info-row"><span class="gi-badge ${c.className}">GI ${food.gi}</span><span class="gi-description">${c.label}</span></div>`;
}

const insulinDatabase={
  rapid:[
    {name:'Fiasp',group:'ultraRapid',substance:'aspart',peakMinutes:60,durationHours:5},
    {name:'Lyumjev',group:'ultraRapid',substance:'lispro',peakMinutes:60,durationHours:5},
    {name:'NovoRapid',group:'rapidAnalog',substance:'aspart',peakMinutes:90,durationHours:5},
    {name:'Insulin aspart Sanofi',group:'rapidAnalog',substance:'aspart',peakMinutes:90,durationHours:5},
    {name:'Kirsty',group:'rapidAnalog',substance:'aspart',peakMinutes:90,durationHours:5},
    {name:'Humalog',group:'rapidAnalog',substance:'lispro',peakMinutes:75,durationHours:5},
    {name:'Insulin lispro Sanofi',group:'rapidAnalog',substance:'lispro',peakMinutes:75,durationHours:5},
    {name:'Apidra',group:'rapidAnalog',substance:'glulisine',peakMinutes:75,durationHours:4},
    {name:'Actrapid',group:'humanShort',substance:'human',peakMinutes:150,durationHours:7},
    {name:'Humulin R',group:'humanShort',substance:'human',peakMinutes:150,durationHours:7},
    {name:'Insuman Rapid',group:'humanShort',substance:'human',peakMinutes:150,durationHours:7},
    {name:'Insulin lispro',group:'rapidAnalog',substance:'lispro',peakMinutes:75,durationHours:5,hidden:true},
    {name:'Trurapi',group:'rapidAnalog',substance:'aspart',peakMinutes:90,durationHours:5,hidden:true},
    {name:'Admelog',group:'rapidAnalog',substance:'lispro',peakMinutes:75,durationHours:5,hidden:true}
  ],
  long:[
    {name:'Lantus',group:'longAnalog',substance:'glargine'},
    {name:'Abasaglar',group:'longAnalog',substance:'glargine'},
    {name:'Semglee',group:'longAnalog',substance:'glargine'},
    {name:'Toujeo',group:'longAnalog',substance:'glargine300'},
    {name:'Levemir',group:'longAnalog',substance:'detemir'},
    {name:'Tresiba',group:'longAnalog',substance:'degludec'},
    {name:'Awiqli',group:'weekly',substance:'icodec',weekly:true},
    {name:'Insulatard',group:'nph',substance:'nph'},
    {name:'Humulin N',group:'nph',substance:'nph'},
    {name:'Insuman Basal',group:'nph',substance:'nph'}
  ]
};

function loadGlucoseHistory() {
  const x = readJSON('debo-glucose-history', []);
  if (Array.isArray(x) && x.length) {
    return x
      .filter(i => Number.isFinite(+i.value) && Number.isFinite(+i.timestamp))
      .map(i => ({ ...i, id: i.id || createId('glucose'), value: +i.value, timestamp: +i.timestamp }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }
  return [];
}

function loadInsulinLog() {
  const x = readJSON('debo-insulin-log', []);
  if (!Array.isArray(x)) return [];
  return x
    .filter(i => Number.isFinite(+i.amount) && Number.isFinite(+i.timestamp))
    .map(i => ({ ...i, id: i.id || createId('insulin'), amount: +i.amount, timestamp: +i.timestamp }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

let glucoseHistory = loadGlucoseHistory();
let insulinLog = loadInsulinLog();
let foodLog = readJSON('debo-food-log', []);
let exerciseLog = readJSON('debo-exercise-log', []);
let glucoseUpdatedAt = glucoseHistory.at(-1)?.timestamp || null;
// Runs once the log store has loaded, before the first render
function loadLogs() {
  glucoseHistory = loadGlucoseHistory();
  insulinLog = loadInsulinLog();
  foodLog = readJSON('debo-food-log', []);
  exerciseLog = readJSON('debo-exercise-log', []);
  careLog = readJSON('debo-care-log', []);
  glucoseUpdatedAt = glucoseHistory.at(-1)?.timestamp || null;
}
function startOfMonthsAgo(months, from = Date.now()) {
  const date = new Date(from),
    day = date.getDate();
  date.setHours(0, 0, 0, 0);
  date.setDate(1);
  date.setMonth(date.getMonth() - months);
  date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
  return date.getTime();
}
function historyEarliestDate() {
  return startOfMonthsAgo(3);
}

function renderGlucoseUpdatedAt() {
  if (!glucoseUpdatedAt || Date.now() - glucoseUpdatedAt >= 7200000) {
    DOM.glucoseUpdated.textContent = t('enterReadingPrompt');
    DOM.glucoseUpdated.classList.add('stale');
    DOM.glucoseUpdated.disabled = false;
    DOM.glucoseUpdated.setAttribute('aria-label', t('enterReading'));
    DOM.glucoseUpdated.closest('.updated')?.classList.remove('hidden');
    return;
  }
  DOM.glucoseUpdated.classList.remove('stale');
  DOM.glucoseUpdated.disabled = true;
  DOM.glucoseUpdated.removeAttribute('aria-label');
  DOM.glucoseUpdated.closest('.updated')?.classList.add('hidden');
}

function glucoseTrend() {
  const latest = glucoseHistory.at(-1);
  if (!latest || Date.now() - latest.timestamp > 15 * 60000) return null;
  const recent = glucoseHistory.filter(x => latest.timestamp - x.timestamp <= 20 * 60000);
  if (recent.length < 2) return null;
  const span = latest.timestamp - recent[0].timestamp;
  if (span < 4 * 60000) return null;
  const meanT = recent.reduce((s, x) => s + x.timestamp, 0) / recent.length;
  const meanV = recent.reduce((s, x) => s + x.value, 0) / recent.length;
  let num = 0,
    den = 0;
  recent.forEach(x => {
    const dt = (x.timestamp - meanT) / 60000;
    num += dt * (x.value - meanV);
    den += dt * dt;
  });
  if (!den) return null;
  const rate = num / den;
  const abs = Math.abs(rate);
  const level = abs < 0.055 ? 0 : abs < 0.11 ? 1 : abs < 0.17 ? 2 : 3;
  const sign = rate < 0 ? -1 : 1;
  const angle = level === 0 ? 0 : level === 1 ? sign * -45 : sign * -90;
  const key =
    level === 0
      ? 'trendStable'
      : sign > 0
        ? ['', 'trendRisingSlow', 'trendRising', 'trendRisingFast'][level]
        : ['', 'trendFallingSlow', 'trendFalling', 'trendFallingFast'][level];
  return { rate, level, direction: level === 0 ? 'stable' : sign > 0 ? 'rising' : 'falling', angle, double: level === 3, key };
}
function renderTrend() {
  const trend = glucoseTrend();
  const box = DOM.trendLabel.parentElement;
  const arrow = DOM.trendArrow;
  if (!trend) {
    arrow?.classList.add('hidden');
    box.dataset.direction = '';
    return false;
  }
  arrow.classList.remove('hidden');
  arrow.style.setProperty('--trend-angle', `${trend.angle}deg`);
  arrow.dataset.double = String(trend.double);
  box.dataset.direction = '';
  const perMin = getGlucoseUnit() === 'mg' ? `${Math.round(trend.rate * 18)}` : trend.rate.toFixed(2);
  const sign = trend.rate > 0 ? '+' : '';
  DOM.trendLabel.textContent = t(trend.key);
  DOM.trendLabel.title = `${sign}${perMin} ${glucoseUnitText()}/min`;
  return true;
}
const TREND_ARROWS = { 0: '→', 1: '↗', 2: '↑', 3: '⇈' };
const TREND_ARROWS_DOWN = { 1: '↘', 2: '↓', 3: '⇊' };
let lastWidgetPayload = '';
function pushWidgetState() {
  const bridge = window.AndroidWidget;
  if (!bridge?.update) return;
  const latest = glucoseHistory.at(-1) || null;
  const session = getSession();
  let payload;
  if (!latest || !session) {
    payload = { emptyText: t('noReadingYet') };
  } else {
    const trend = glucoseTrend();
    const arrow = !trend ? '' : trend.direction === 'falling' ? TREND_ARROWS_DOWN[trend.level] : TREND_ARROWS[trend.level];
    payload = {
      value: String(displayGlucose(latest.value)),
      unit: glucoseUnitText(),
      arrow,
      state: latest.value < GAUGE_LOW ? 'low' : latest.value > GAUGE_HIGH ? 'high' : 'normal',
      timestamp: latest.timestamp,
      meta: trend ? `${formatClock(latest.timestamp)} · ${t(trend.key)}` : formatClock(latest.timestamp),
      staleText: `${formatClock(latest.timestamp)} · ${t('readingStale')}`
    };
  }
  const json = JSON.stringify(payload);
  if (json === lastWidgetPayload) return;
  lastWidgetPayload = json;
  try {
    bridge.update(json);
  } catch {}
}
window.onAppAction = function (action) {
  // A widget tap can arrive while the logs are still loading: run it once the app has started
  if (!logsReady) return void logsLoaded.then(() => window.onAppAction(action));
  if (!['glucose', 'food', 'insulin'].includes(action)) return;
  if (!getSession() || !DOM.authScreen.classList.contains('hidden')) return;
  $$('dialog[open]').forEach(dialog => dialog.close());
  hideChartTooltip();
  openEntry(action);
};
// Android Back button / gesture (MainActivity asks this first): close the top window, step back in the food
// browser or the sign-in form, then return to Home. Returns false only when Back should leave the app.
window.onAppBack = function () {
  if (!logsReady) return false;
  const open = $$('dialog[open]');
  if (open.length) {
    open.at(-1).close();
    return true;
  }
  hideChartTooltip();
  if (!DOM.authScreen.classList.contains('hidden')) {
    if (DOM.authForm && !DOM.authForm.classList.contains('hidden') && DOM.authBack) {
      DOM.authBack.click();
      return true;
    }
    return false;
  }
  if ($('#view-food')?.classList.contains('active') && foodBrowserMode !== 'home') {
    const back = $('#food-browser [data-food-back]');
    if (back) back.click();
    else {
      foodBrowserMode = 'home';
      foodSearchQuery = '';
      renderExpandedFoodPage();
    }
    return true;
  }
  if (!$('#view-home')?.classList.contains('active')) {
    $('[data-view-nav="home"]')?.click();
    return true;
  }
  return false;
};
function updateGlucoseVisual(v) {
  const min = GAUGE_MIN,
    max = GAUGE_MAX;
  const position = clamp((v - min) / (max - min), 0, 1);
  DOM.glucoseRange.dataset.state = 'reading';
  DOM.glucoseRange.style.setProperty('--glucose-position', `${position * 100}%`);
  DOM.glucoseCard.dataset.state = 'reading';
  DOM.glucoseCard.dataset.zone = v < GAUGE_LOW ? 'low' : v > GAUGE_HIGH ? 'high' : 'target';
  DOM.glucoseCard.style.setProperty('--glucose-angle', `${135 + position * 270}deg`);
  DOM.trendLabel.textContent = '';
  DOM.trendLabel.removeAttribute('title');
  renderTrend();
  DOM.glucoseRange.setAttribute('aria-label', formatGlucose(v));
}

function renderCurrentGlucose() {
  const latest = glucoseHistory.at(-1) || null;
  const current = !!latest && Date.now() - latest.timestamp < 7200000;
  glucoseUpdatedAt = latest?.timestamp || null;
  DOM.glucoseUnitLabel.textContent = glucoseUnitText();
  const mg = getGlucoseUnit() === 'mg';
  DOM.glucoseRangeMin.textContent = mg ? String(Math.round(mmolToMg(GAUGE_MIN))) : String(GAUGE_MIN);
  DOM.glucoseRangeLow.textContent = mg ? '70' : decimal(GAUGE_LOW, 1);
  DOM.glucoseRangeHigh.textContent = mg ? '180' : String(GAUGE_HIGH);
  DOM.glucoseRangeMax.textContent = mg ? String(Math.round(mmolToMg(GAUGE_MAX))) : String(GAUGE_MAX);
  if (!current) {
    DOM.glucoseValue.textContent = '';
    const emptyText = $('#glucose-empty-text');
    if (emptyText) emptyText.textContent = t(latest ? 'readingStale' : 'noReadingYet');
    $('.home-reading-kicker')?.classList.toggle('hidden', !latest);
    DOM.trendLabel.textContent = '—';
    DOM.trendArrow?.classList.add('hidden');
    DOM.glucoseReadingTime.textContent = latest ? formatClock(latest.timestamp) : '—';
    DOM.glucoseRange.dataset.state = 'none';
    DOM.glucoseCard.dataset.state = 'none';
    DOM.glucoseCard.dataset.zone = '';
    DOM.glucoseRange.setAttribute('aria-label', t('enterReadingPrompt'));
    renderGlucoseUpdatedAt();
    pushWidgetState();
    return;
  }
  DOM.glucoseValue.textContent = displayGlucose(latest.value);
  const emptyText = $('#glucose-empty-text');
  if (emptyText) emptyText.textContent = '';
  $('.home-reading-kicker')?.classList.remove('hidden');
  DOM.glucoseReadingTime.textContent = formatClock(latest.timestamp);
  updateGlucoseVisual(latest.value);
  renderGlucoseUpdatedAt();
  pushWidgetState();
}

function recordGlucose(mmol, timestamp = Date.now(), extra = {}) {
  glucoseHistory.push({
    id: createId('glucose'),
    value: mmol,
    timestamp,
    ...extra
  });
  glucoseHistory.sort((a, b) => a.timestamp - b.timestamp);
  syncNativeReminders();
  cancelPostMealIfChecked(timestamp);
  writeJSON('debo-glucose-history', glucoseHistory);
  chartShouldScrollToLatest = true;
  renderCurrentGlucose();
  renderTimelineGraph();
  renderHistory();
}

function openGlucoseChart() {
  hideChartTooltip();
  $$('[data-chart-hours]').forEach(button => button.classList.toggle('active', +button.dataset.chartHours === chartViewHours));
  DOM.glucoseChartModal.showModal();
  chartShouldScrollToLatest = true;
  requestAnimationFrame(() => renderTimelineGraph());
}

function getChartWindow() {
  return {
    start: startOfDay(Date.now()),
    end: Date.now()
  };
}

function glucoseToY(v) {
  const ratio = (clamp(v, CHART_MIN, CHART_MAX) - CHART_MIN) / (CHART_MAX - CHART_MIN);
  return CHART_BOTTOM - ratio * (CHART_BOTTOM - CHART_TOP);
}

function timeToX(ts, start, end, width) {
  const usable = Math.max(1, width - EDGE * 2);
  const ratio = end <= start ? 0 : clamp((ts - start) / (end - start), 0, 1);
  return EDGE + ratio * usable;
}

function getVisibleChartWindow() {
  const { start, end } = getChartWindow();
  const duration = chartViewHours * 3600000;
  if (end - start <= duration) return { start, end };
  const max = Math.max(0, DOM.chartCanvas.scrollWidth - DOM.chartScroll.clientWidth);
  const ratio = max ? clamp(DOM.chartScroll.scrollLeft / max, 0, 1) : 1;
  const latestStart = end - duration;
  const visibleStart = start + (latestStart - start) * ratio;
  return {
    start: visibleStart,
    end: visibleStart + duration
  };
}

function renderVisibleEvents() {
  // The whole day, so the list (and the window height) stays the same while the chart is scrolled
  const { start, end } = getChartWindow();
  const events = [
    ...glucoseHistory.filter(x => x.timestamp >= start && x.timestamp <= end).map(x => ({ eventType: 'glucose', ...x })),
    ...insulinLog.filter(x => x.timestamp >= start && x.timestamp <= end).map(x => ({ eventType: 'insulin', ...x })),
    ...exerciseLog.filter(x => x.timestamp >= start && x.timestamp <= end).map(x => ({ eventType: 'exercise', ...x }))
  ].sort((a, b) => b.timestamp - a.timestamp);
  DOM.visibleEventsTime.textContent = `${formatClock(start)}–${formatClock(end)}`;
  DOM.visibleEventList.innerHTML = events.length
    ? events
        .map(e =>
          e.eventType === 'exercise'
            ? `
          <div class="event-pill exercise" data-event-type="exercise" data-event-id="${e.id}">
            <button class="event-pill-main" type="button">
              <b>${e.minutes} ${t('minutesShort')}</b>
              <small>${escapeHtml(exerciseName(e))} · ${formatClock(e.timestamp)}</small>
            </button>
          </div>
        `
            : e.eventType === 'glucose'
            ? `
          <div class="event-pill" data-event-type="glucose" data-event-id="${e.id}">
            <button class="event-pill-main" type="button">
              <b>${formatGlucose(e.value)}</b>
              <small>${formatClock(e.timestamp)}</small>
            </button>
          </div>
        `
            : `
          <div class="event-pill ${e.type === 'long' ? 'long-insulin' : 'insulin'}" data-event-type="insulin" data-event-id="${e.id}">
            <button class="event-pill-main" type="button">
              <b>${decimal(e.amount, 1)} ${t('unitU')}</b>
              <small>${escapeHtml(e.name)} · ${formatClock(e.timestamp)}</small>
            </button>
          </div>
        `
        )
        .join('')
    : `<span class="no-visible-events">${t('noEvents')}</span>`;
}

// Deleting is instant; the undo bar brings the entry back for a few seconds
let undoAction = null,
  undoTimer = 0;
const EVENT_STORES = {
  glucose: {
    key: 'debo-glucose-history',
    get: () => glucoseHistory,
    set: value => {
      glucoseHistory = value;
    },
    render: () => renderCurrentGlucose()
  },
  insulin: {
    key: 'debo-insulin-log',
    get: () => insulinLog,
    set: value => {
      insulinLog = value;
    },
    render: () => {
      showAllActiveDoses = false;
      renderActiveInsulin();
    }
  },
  food: {
    key: 'debo-food-log',
    get: () => foodLog,
    set: value => {
      foodLog = value;
    },
    render: () => {
      if ($('#view-food')?.classList.contains('active') && foodBrowserMode === 'daily-summary') renderExpandedFoodPage();
    }
  },
  exercise: {
    key: 'debo-exercise-log',
    get: () => exerciseLog,
    set: value => {
      exerciseLog = value;
    },
    render: () => {}
  },
  care: {
    key: 'debo-care-log',
    get: () => careLog,
    set: value => {
      careLog = value;
    },
    render: () => syncCareReminders()
  }
};
function showUndo(message, undo) {
  const bar = $('#undo-bar');
  undoAction = undo;
  $('#undo-text').textContent = message;
  // Re-showing the popover puts it above any dialog opened since
  try {
    if (bar.matches(':popover-open')) bar.hidePopover();
    bar.showPopover();
  } catch {
    bar.classList.add('open');
  }
  clearTimeout(undoTimer);
  undoTimer = setTimeout(hideUndo, 5000);
}
function hideUndo() {
  const bar = $('#undo-bar');
  clearTimeout(undoTimer);
  undoAction = null;
  bar.classList.remove('open');
  try {
    if (bar.matches(':popover-open')) bar.hidePopover();
  } catch {}
}
function runUndo() {
  const undo = undoAction;
  hideUndo();
  undo?.();
}
function refreshStore(store) {
  store.render();
  renderTimelineGraph();
  renderHistory();
}
function quickDeleteEvent(type, id) {
  const store = EVENT_STORES[type];
  const item = store?.get().find(x => x.id === id);
  if (!item) return;
  store.set(store.get().filter(x => x.id !== id));
  writeJSON(store.key, store.get());
  refreshStore(store);
  showUndo(t('eventDeleted'), () => {
    store.set([...store.get(), item].sort((a, b) => a.timestamp - b.timestamp));
    writeJSON(store.key, store.get());
    refreshStore(store);
  });
}
function renderTimelineGraph() {
  const { start, end } = getChartWindow();
  const viewport = Math.max(260, DOM.chartScroll.clientWidth);
  const elapsed = Math.max((end - start) / 3600000, 0.01);
  const pixelWidth = Math.max(viewport, (elapsed * viewport) / chartViewHours);
  // The plot is drawn in a 104-unit-high space; a taller chart (CSS height) scales it up evenly,
  // so dots, labels and lines grow together instead of stretching
  const scale = Math.max(1, (DOM.timelineSvg.getBoundingClientRect().height || 104) / 104);
  const width = pixelWidth / scale;
  DOM.chartCanvas.style.width = `${pixelWidth}px`;
  DOM.timelineSvg.style.width = `${pixelWidth}px`;
  DOM.timelineSvg.setAttribute('viewBox', `0 0 ${width} 104`);
  // Time labels keep about 11 px on screen however much the plot is scaled
  DOM.timelineSvg.style.setProperty('--chart-text', `${(scale > 1 ? 11 : 7) / scale}px`);
  const pixelsPerHour = pixelWidth / Math.max(elapsed, 1);
  const labelStep = scale > 1 ? [1, 2, 3, 4, 6, 12].find(hours => hours * pixelsPerHour >= 46) || 12 : chartViewHours === 3 ? 1 : 2;
  const targetTop = glucoseToY(10);
  const targetBottom = glucoseToY(3.9);
  DOM.chartTargetZone.setAttribute('x', EDGE);
  DOM.chartTargetZone.setAttribute('y', targetTop);
  DOM.chartTargetZone.setAttribute('width', Math.max(0, width - EDGE * 2));
  DOM.chartTargetZone.setAttribute('height', targetBottom - targetTop);
  // Line color switches exactly at 10 and 3.9: above is high, between is target, below is low
  const zoneLine = $('#zone-line');
  if (zoneLine) {
    zoneLine.setAttribute('y1', glucoseToY(GAUGE_HIGH));
    zoneLine.setAttribute('y2', glucoseToY(GAUGE_LOW));
  }
  DOM.chartHorizontalGrid.innerHTML = [14, 10, 3.9]
    .map(v => {
      const y = glucoseToY(v);
      return `
          <line
            class="chart-horizontal-line"
            x1="${EDGE}"
            x2="${width - EDGE}"
            y1="${y}"
            y2="${y}"
          />
        `;
    })
    .join('');
  const labels = [];
  for (let ts = start; ts <= end; ts += 3600000) {
    const hour = new Date(ts).getHours();
    if (hour % labelStep === 0) {
      const x = timeToX(ts, start, end, width);
      labels.push(`
        <text
          class="chart-time-text"
          x="${x}"
          y="${CHART_LABEL_Y}"
        >
          ${formatClock(ts)}
        </text>
      `);
    }
  }
  DOM.timeLabels.innerHTML = labels.join('');
  const points = glucoseHistory
    .filter(x => x.timestamp >= start && x.timestamp <= end)
    .map(x => ({
      ...x,
      x: timeToX(x.timestamp, start, end, width),
      y: glucoseToY(x.value)
    }));
  if (points.length > 1) {
    const line = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
    DOM.chartLine.setAttribute('d', line);
    DOM.chartArea.setAttribute('d', `${line} L ${points.at(-1).x} ${CHART_BOTTOM} L ${points[0].x} ${CHART_BOTTOM} Z`);
  } else {
    DOM.chartLine.setAttribute('d', '');
    DOM.chartArea.setAttribute('d', '');
  }
  DOM.glucosePoints.innerHTML = points
    .map(
      (p, index) => `
        <g>
          ${
            p.source === 'healthconnect' && index < points.length - 1
              ? ''
              : `<circle
            class="glucose-point zone-${p.value < GAUGE_LOW ? 'low' : p.value > GAUGE_HIGH ? 'high' : 'target'}"
            cx="${p.x}"
            cy="${p.y}"
            r="3.3"
          />`
          }

          <circle
            class="chart-hit-circle"
            cx="${p.x}"
            cy="${p.y}"
            r="12"
            data-event-type="glucose"
            data-event-id="${p.id}"
            data-tooltip="${escapeHtml(`${formatGlucose(p.value)} · ${formatClock(p.timestamp)}`)}"
          />
        </g>
      `
    )
    .join('');
  // Workouts are drawn as a bar along the bottom of the plot, from start to end
  $('#exercise-bands').innerHTML = exerciseLog
    .filter(x => x.timestamp <= end && x.timestamp + x.minutes * 60000 >= start)
    .map(e => {
      const x1 = timeToX(Math.max(e.timestamp, start), start, end, width),
        x2 = Math.max(x1 + 6, timeToX(Math.min(e.timestamp + e.minutes * 60000, end), start, end, width));
      const text = `${exerciseName(e)} · ${e.minutes} ${t('minutesShort')} · ${formatClock(e.timestamp)}`;
      return `<g><rect class="exercise-band ${e.intensity || 'moderate'}" x="${x1}" y="85" width="${x2 - x1}" height="4" rx="2"/><rect class="chart-hit-circle" x="${x1 - 4}" y="78" width="${x2 - x1 + 8}" height="16" data-event-type="exercise" data-event-id="${e.id}" data-tooltip="${escapeHtml(text)}"/></g>`;
    })
    .join('');
  DOM.insulinMarkers.innerHTML = insulinLog
    .filter(x => x.timestamp >= start && x.timestamp <= end)
    .map(i => {
      const x = timeToX(i.timestamp, start, end, width);
      const c = i.type === 'long' ? 'long' : 'rapid';
      const text = `${decimal(i.amount, 1)} ${t('unitU')} · ${i.name} · ${formatClock(i.timestamp)}`;
      return `
          <g>
            <line
              class="insulin-marker-line ${c}"
              x1="${x}"
              x2="${x}"
              y1="72"
              y2="82"
            />

            <circle
              class="insulin-marker-dot ${c}"
              cx="${x}"
              cy="72"
              r="3.8"
            />

            <circle
              class="chart-hit-circle"
              cx="${x}"
              cy="72"
              r="13"
              data-event-type="insulin"
              data-event-id="${i.id}"
              data-tooltip="${escapeHtml(text)}"
            />
          </g>
        `;
    })
    .join('');
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  DOM.chartTimezone.textContent = timezone ? `${t('localTime')} · ${timezone}` : t('localTime');
  if (chartShouldScrollToLatest) {
    requestAnimationFrame(() => {
      DOM.chartScroll.scrollLeft = Math.max(0, DOM.chartScroll.scrollWidth - DOM.chartScroll.clientWidth);
      chartShouldScrollToLatest = false;
      renderVisibleEvents();
    });
  } else {
    renderVisibleEvents();
  }
}

function hideChartTooltip() {
  clearTimeout(showChartTooltip.timer);
  DOM.chartTooltip.classList.add('hidden');
}

// The value bubble sits inside the chart, right above the tapped dot, and scrolls with it
function showChartTooltip(target) {
  const text = target.dataset.tooltip;
  if (!text) return;
  const tip = DOM.chartTooltip;
  if (tip.parentElement !== DOM.chartCanvas) DOM.chartCanvas.appendChild(tip);
  const [value, ...rest] = text.split(' · ');
  tip.innerHTML = `<strong>${escapeHtml(value)}</strong>${rest.length ? `<small>${escapeHtml(rest.join(' · '))}</small>` : ''}`;
  const svg = DOM.timelineSvg.getBoundingClientRect(),
    canvas = DOM.chartCanvas.getBoundingClientRect();
  const scale = svg.height / 104 || 1;
  const box = target.getBBox();
  const cx = box.x + box.width / 2,
    top = target.tagName === 'rect' ? box.y + box.height / 2 : box.y + box.height / 2;
  const x = svg.left - canvas.left + cx * scale,
    y = svg.top - canvas.top + top * scale;
  tip.classList.toggle('below', y < 64);
  tip.style.left = `${clamp(x, 64, Math.max(64, canvas.width - 64))}px`;
  tip.style.top = `${y}px`;
  tip.classList.remove('hidden');
}

function updateHistoryDateUi() {
  const today = startOfDay(Date.now());
  const earliest = historyEarliestDate();
  selectedHistoryDate = Math.max(earliest, Math.min(selectedHistoryDate, today));
  DOM.historyDateLabel.textContent = formatDateOnly(selectedHistoryDate);
  DOM.historyDateInput.value = isoDate(selectedHistoryDate);
  DOM.historyDateInput.max = isoDate(today);
  DOM.historyDateInput.min = isoDate(earliest);
  DOM.historyNext.disabled = selectedHistoryDate >= today;
  DOM.historyPrev.disabled = selectedHistoryDate <= earliest;
}

function timeInRange(readings) {
  const counts = { veryLow: 0, low: 0, range: 0, high: 0, veryHigh: 0 };
  readings.forEach(x => {
    if (x.value < 3) counts.veryLow++;
    else if (x.value < 3.9) counts.low++;
    else if (x.value <= 10) counts.range++;
    else if (x.value <= 13.9) counts.high++;
    else counts.veryHigh++;
  });
  const total = readings.length;
  const pct = {};
  Object.keys(counts).forEach(key => {
    pct[key] = total ? Math.round((counts[key] / total) * 100) : 0;
  });
  return { total, counts, pct };
}

function tirBands() {
  const v = mmol =>
    getGlucoseUnit() === 'mg'
      ? String(Math.round(mmolToMg(mmol)))
      : new Intl.NumberFormat(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(mmol);
  const unit = glucoseUnitText();
  return [
    { key: 'veryLow', label: t('tirVeryLow'), range: `< ${v(3)} ${unit}` },
    { key: 'low', label: t('tirLow'), range: `${v(3)}–${v(3.8)} ${unit}` },
    { key: 'range', label: t('tirInRange'), range: `${v(3.9)}–${v(10)} ${unit}` },
    { key: 'high', label: t('tirHigh'), range: `${v(10.1)}–${v(13.9)} ${unit}` },
    { key: 'veryHigh', label: t('tirVeryHigh'), range: `> ${v(13.9)} ${unit}` }
  ];
}

function percentile(sorted, p) {
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index),
    upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}
function agpProfile(readings) {
  const days = new Set(readings.map(x => startOfDay(x.timestamp)));
  if (days.size < 3 || readings.length < 20) return null;
  const byHour = Array.from({ length: 24 }, () => []);
  readings.forEach(x => byHour[hourOfDay(x.timestamp)].push(x.value));
  const hours = byHour.map((_, h) => {
    const values = [...byHour[(h + 23) % 24], ...byHour[h], ...byHour[(h + 1) % 24]].sort((a, b) => a - b);
    if (values.length < 4) return null;
    return {
      p10: percentile(values, 0.1),
      p25: percentile(values, 0.25),
      p50: percentile(values, 0.5),
      p75: percentile(values, 0.75),
      p90: percentile(values, 0.9)
    };
  });
  if (hours.filter(Boolean).length < 8) return null;
  return { hours, days: days.size };
}
function agpSvg(profile) {
  const W = 320,
    H = 210,
    L = 30,
    R = 312,
    T = 10,
    B = 186;
  const yMin = 2,
    yMax = 20;
  const x = h => L + ((h + 0.5) / 24) * (R - L);
  const y = v => B - ((clamp(v, yMin, yMax) - yMin) / (yMax - yMin)) * (B - T);
  const segments = [];
  let current = [];
  profile.hours.forEach((p, h) => {
    if (p) current.push({ h, ...p });
    else if (current.length) {
      segments.push(current);
      current = [];
    }
  });
  if (current.length) segments.push(current);
  const band = (seg, lo, hi) =>
    `M${seg.map(p => `${x(p.h).toFixed(1)} ${y(p[hi]).toFixed(1)}`).join(' L')} L${seg
      .slice()
      .reverse()
      .map(p => `${x(p.h).toFixed(1)} ${y(p[lo]).toFixed(1)}`)
      .join(' L')} Z`;
  const line = (seg, key) => `M${seg.map(p => `${x(p.h).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(' L')}`;
  const label = v => (getGlucoseUnit() === 'mg' ? String(Math.round(mmolToMg(v))) : String(v).replace('.', (language === 'en' ? '.' : ',')));
  const gridValues = [3.9, 10, 13.9];
  return `<svg class="agp-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHtml(t('agpTitle'))}">
    <rect class="agp-target" x="${L}" y="${y(10)}" width="${R - L}" height="${y(3.9) - y(10)}"/>
    ${gridValues.map(v => `<line class="agp-grid${v === 3.9 ? ' agp-grid-low' : ''}" x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}"/><text class="agp-axis" x="${L - 4}" y="${y(v) + 3}" text-anchor="end">${label(v)}</text>`).join('')}
    ${segments.map(seg => `<path class="agp-outer" d="${band(seg, 'p10', 'p90')}"/><path class="agp-inner" d="${band(seg, 'p25', 'p75')}"/><path class="agp-median" d="${line(seg, 'p50')}"/>`).join('')}
    ${[0, 6, 12, 18, 24].map(h => `<text class="agp-axis" x="${L + (h / 24) * (R - L)}" y="${H - 8}" text-anchor="${h === 0 ? 'start' : h === 24 ? 'end' : 'middle'}">${String(h).padStart(2, '0')}:00</text>`).join('')}
  </svg>`;
}
function agpCard(readings) {
  const profile = agpProfile(readings);
  if (!profile)
    return `<section class="statistics-agp-card"><div class="tir-head"><p>${t('agpTitle')}</p><small>${t('agpNeedData')}</small></div></section>`;
  return `<section class="statistics-agp-card"><div class="tir-head"><p>${t('agpTitle')}</p><small>${t('agpBasedOn').replace('{n}', profile.days)}</small></div>${agpSvg(profile)}<div class="agp-legend"><span><i class="agp-key-median"></i>${t('agpMedian')}</span><span><i class="agp-key-inner"></i>25–75 %</span><span><i class="agp-key-outer"></i>10–90 %</span></div></section>`;
}

function renderStatisticsSummary() {
  const root = $('#statistics-summary');
  if (!root) return;
  const ranges = [
      ['today', t('statToday')],
      ['week', tx('7 d', '7 d.')],
      ['month', tx('1 mo', '1 mėn.')],
      ['quarter', tx('3 mo', '3 mėn.')]
    ],
    periodMonths = { month: 1, quarter: 3 };
  const now = Date.now(),
    todayStart = startOfDay(now);
  const start =
    statisticsPeriod === 'today'
      ? todayStart
      : statisticsPeriod === 'week'
        ? shiftCalendarDay(todayStart, -6)
        : startOfMonthsAgo(periodMonths[statisticsPeriod] || 3);
  const inPeriod = x => x.timestamp >= start && x.timestamp <= now;
  const readings = glucoseHistory.filter(inPeriod);
  const dailyMap = new Map();
  readings.forEach(x => {
    const key = startOfDay(x.timestamp);
    if (!dailyMap.has(key)) dailyMap.set(key, []);
    dailyMap.get(key).push(x.value);
  });
  const dayMeans = [...dailyMap.values()].map(values => values.reduce((a, b) => a + b, 0) / values.length);
  const mean = dayMeans.length ? dayMeans.reduce((a, b) => a + b, 0) / dayMeans.length : null;
  const fmt = value =>
    value === null ? '—' : new Intl.NumberFormat(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
  const glucoseText = value => (value === null ? '—' : getGlucoseUnit() === 'mg' ? String(Math.round(mmolToMg(value))) : fmt(value));
  const days = Array.from({ length: 7 }, (_, i) => shiftCalendarDay(todayStart, i - 6));
  const readingsSince7 = glucoseHistory.filter(x => x.timestamp >= days[0]);
  const dayValues = days.map(day => {
    const dayEnd = endOfDay(day);
    const values = readingsSince7.filter(x => x.timestamp >= day && x.timestamp <= dayEnd).map(x => x.value);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  });
  const scaleMax = Math.max(12, ...dayValues.filter(v => v !== null));
  const bars = days
    .map((day, i) => {
      const value = dayValues[i];
      const height = value === null ? 0 : Math.max(6, Math.round((value / scaleMax) * 100));
      const weekday = capitalize(new Intl.DateTimeFormat(locale(), { weekday: 'short' }).format(new Date(day))).replace('.', '');
      return `<div class="week-bar${day === todayStart ? ' today' : ''}"><span class="week-bar-value">${value === null ? '' : glucoseText(value)}</span><span class="week-bar-track"><i style="height:${height}%"></i></span><small>${escapeHtml(weekday)}</small></div>`;
    })
    .join('');
  const loggedDays = new Set([...glucoseHistory, ...insulinLog, ...foodLog].filter(inPeriod).map(x => startOfDay(x.timestamp))).size;
  const periodDays = Math.max(1, loggedDays);
  const carbs = foodLog.filter(inPeriod).reduce((sum, x) => sum + Number(x.carbs || 0), 0) / periodDays;
  const insulin = insulinLog.filter(inPeriod).reduce((sum, x) => sum + Number(x.amount || 0), 0) / periodDays;
  const tir = timeInRange(readings);
  const tile = (icon, label, value, unit) =>
    `<div class="stat-tile"><span class="stat-tile-icon ${icon}" aria-hidden="true"></span><p>${escapeHtml(label)}</p><strong>${value}<small>${escapeHtml(unit)}</small></strong></div>`;
  const tiles = `<div class="stat-tiles">
    ${tile('food', t('statCarbsDay'), formatAmount(carbs), ' g')}
    ${tile('insulin', t('statInsulinDay'), formatAmount(insulin, 1), ` ${t('unitU')}`)}
    ${tile('glucose', t('statReadings'), String(readings.length), '')}
    ${tile('range', t('statDaysLogged'), String(loggedDays), '')}
  </div>`;
  const tirSection = `<section class="statistics-tir-card"><div class="tir-head"><p>${t('tirTitle')}</p><small>${tir.total ? t('tirBasedOn').replace('{n}', tir.total) : t('tirNoData')}</small></div>${
    tir.total
      ? `<div class="tir-bar" role="img" aria-label="${escapeHtml(t('tirTitle'))}: ${tir.pct.range}%">${tirBands()
          .map(band => `<i class="tir-${band.key}" style="flex-basis:${tir.pct[band.key]}%"></i>`)
          .join('')}</div><div class="tir-rows">${tirBands()
          .slice()
          .reverse()
          .map(
            band =>
              `<div class="tir-row"><span class="tir-dot tir-${band.key}"></span><span class="tir-label"><strong>${escapeHtml(band.label)}</strong><small>${escapeHtml(band.range)}</small></span><b>${tir.pct[band.key]}%</b></div>`
          )
          .join('')}</div>`
      : ''
  }</section>`;
  root.innerHTML = `<section class="stat-hero">
    <div class="stat-hero-head"><div><p>${t('averageDailyGlucose')}</p><strong>${glucoseText(mean)}<small>${glucoseUnitText()}</small></strong></div></div>
    <div class="statistics-period-switch" role="group" aria-label="${tx('Period', 'Laikotarpis')}">${ranges.map(([key, label]) => `<button class="${statisticsPeriod === key ? 'active' : ''}" data-stat-period="${key}" type="button" aria-pressed="${statisticsPeriod === key}">${label}</button>`).join('')}</div>
    <div class="week-bars" role="img" aria-label="${escapeHtml(t('statLast7'))}">${bars}</div>
    <p class="week-bars-note">${t('statLast7')} · ${glucoseUnitText()}</p>
  </section>${tiles}${tirSection}${statisticsPeriod === 'today' ? '' : agpCard(readings)}`;
}

let historyQuery = '';
function renderHistory() {
  updateHistoryDateUi();
  renderStatisticsSummary();
  renderHomeSummary();
  renderCare();
  scheduleWeeklySummarySoon();
  // A selected tag or a search shows matching entries of the last 3 months instead of one day
  const wide = !!historyQuery;
  const start = wide ? historyEarliestDate() : startOfDay(selectedHistoryDate);
  const end = wide ? Date.now() : endOfDay(start);
  const pick = x => x.timestamp >= start && x.timestamp <= end;
  $('#history-range-note').textContent = t(wide ? 'historySearchNote' : 'historyRange');
  $('#history-modal .history-date-nav')?.classList.toggle('hidden', wide);
  const events = [
    ...glucoseHistory.filter(pick).map(x => ({
      type: 'glucose',
      id: x.id,
      timestamp: x.timestamp,
      note: x.note,
      title: formatGlucose(x.value),
      subtitle: `${x.source === 'healthconnect' ? t('cgmSource') : t('glucose')}${Number.isFinite(x.ketones) ? ` · ${t('ketonesShort')} ${decimal(x.ketones, 1)}` : ''}`
    })),
    ...insulinLog.filter(pick).map(x => ({
      type: 'insulin',
      id: x.id,
      timestamp: x.timestamp,
      note: x.note,
      title: `${decimal(x.amount, 1)} ${t('unitU')}`,
      subtitle: x.name
    })),
    ...foodLog
      .filter(pick)
      .map(x => ({
        type: 'food',
        id: x.id,
        timestamp: x.timestamp,
        note: x.note,
        title: foodEntryName(x),
        subtitle: `${x.aiEstimate || Number.isFinite(x.protein) || Number.isFinite(x.fat) ? `${t('carbAbbr')} ${decimal(Number(x.carbs || 0), 1)} g · ${t('protAbbr')} ${decimal(Number(x.protein || 0), 1)} g · ${t('fatAbbr')} ${decimal(Number(x.fat || 0), 1)} g` : `${decimal(Number(x.carbs || 0), 1)} g ${t('carbs')}${x.gi === null ? '' : ` · GI ${x.gi}`}`}${x.portionLabel ? ` · ${x.portionLabel}` : ''}${x.mealType ? ` · ${t({ breakfast: 'mealBreakfast', lunch: 'mealLunch', dinner: 'mealDinner', snack: 'mealSnack' }[x.mealType] || 'mealSnack')}` : ''}`,
        components: Array.isArray(x.components) ? x.components : []
      })),
    ...exerciseLog.filter(pick).map(x => ({
      type: 'exercise',
      id: x.id,
      timestamp: x.timestamp,
      note: x.note,
      title: exerciseName(x),
      subtitle: `${x.minutes} ${t('minutesShort')} · ${t('intensity_' + (x.intensity || 'moderate'))}`
    })),
    ...careLog.filter(pick).map(x => ({
      type: 'care',
      id: x.id,
      timestamp: x.timestamp,
      note: x.note,
      title: t('care_' + x.kind),
      subtitle: t('careChanges')
    }))
  ]
    .filter(e => !historyQuery || normalizeFoodQuery([e.title, e.subtitle, e.note || '', ...(e.components || []).map(c => c.name)].join(' ')).includes(historyQuery))
    .sort((a, b) => b.timestamp - a.timestamp);
  DOM.historyList.innerHTML = events.length
    ? events
        .map(
          e => `
          <div class="history-item" data-edit-type="${e.type}" data-edit-id="${e.id}" role="button" tabindex="0">

            <div class="history-item-main">

              <strong>
                ${escapeHtml(e.title)}
              </strong>

              <small>
                ${escapeHtml(e.subtitle)}
                ·
                ${wide ? `${formatDateOnly(e.timestamp)} ` : ''}${formatClock(e.timestamp)}
              </small>

              ${e.note ? `<small class="history-note">${escapeHtml(e.note)}</small>` : ''}

              ${e.components?.length ? `<details class="history-food-breakdown"><summary>${t('photoBreakdown')}</summary><div>${e.components.map(item => `<div class="history-food-component"><strong>${escapeHtml(item.name)}</strong><small>${decimal(Number(item.amount || 0), 0)} g · ${t('carbAbbr')} ${decimal(Number(item.carbs || 0), 1)} g · ${t('protAbbr')} ${decimal(Number(item.protein || 0), 1)} g · ${t('fatAbbr')} ${decimal(Number(item.fat || 0), 1)} g</small></div>`).join('')}</div></details>` : ''}

            </div>

            <button
              class="history-delete"
              data-history-type="${e.type}"
              data-history-id="${e.id}"
              type="button"
            >
              ×
            </button>

          </div>
        `
        )
        .join('')
    : `
        <div class="page-card history-empty-card">
          ${t(historyQuery ? 'historyNoMatch' : 'noEvents')}
        </div>
      `;
}

function renderFoodCatalog() {
  const previous = DOM.foodProduct.value;
  const groups = new Map();
  foodCatalog.forEach(f => {
    const c = foodCategory(f);
    if (!groups.has(c)) {
      groups.set(c, []);
    }
    groups.get(c).push(f);
  });
  DOM.foodProduct.innerHTML =
    `<option value="">${t('chooseProduct')}</option>` +
    [...groups.entries()]
      .map(
        ([cat, foods]) =>
          `<optgroup label="${escapeHtml(cat)}">${foods
            .map(f => `<option value="${f.id}">${escapeHtml(foodName(f))}</option>`)
            .join('')}</optgroup>`
      )
      .join('') +
    `<option value="custom">${t('customProduct')}</option>`;
  if ([...DOM.foodProduct.options].some(o => o.value === previous)) {
    DOM.foodProduct.value = previous;
  }
}

let lastFoodBrowserPage = '';
function renderExpandedFoodPage(root = $('#food-browser')) {
  // A short slide-in when moving to another catalogue page (not while typing in the search box)
  if (root && root.id === 'food-browser') {
    const page = `${foodBrowserMode}|${selectedRestaurant}|${selectedFoodCategory}`;
    if (page !== lastFoodBrowserPage) {
      lastFoodBrowserPage = page;
      root.classList.remove('debo-page-in');
      void root.offsetWidth;
      root.classList.add('debo-page-in');
    }
  }
  const englishLabels = {
        back: 'Back',
        title: 'Food',
        kicker: 'FOOD',
        restaurants: 'Restaurants',
        products: 'Food products',
        restaurantsText: 'Menus and nutrition values.',
        productsText: 'Foods by category.',
        daily: 'Today',
        dailyText: 'Carbs and meals today.',
        dailyTotal: 'Carbohydrates today',
        empty: 'No food logged today.',
        search: 'Search products',
        categories: 'Categories',
        official: 'Official serving',
        per100: 'per 100 g',
        add: 'Add manually',
        note: 'Values are estimates. Check the label.'
      },
    lithuanianLabels = {
        back: 'Atgal',
        title: 'Maistas',
        kicker: 'MAISTAS',
        restaurants: 'Restoranai',
        products: 'Maisto produktai',
        restaurantsText: 'Meniu ir maistinės vertės.',
        productsText: 'Maistas pagal kategoriją.',
        daily: 'Šiandien',
        dailyText: 'Šiandienos angliavandeniai ir valgiai.',
        dailyTotal: 'Angliavandeniai šiandien',
        empty: 'Šiandien įrašų nėra.',
        search: 'Ieškoti produktų',
        categories: 'Kategorijos',
        official: 'Oficiali porcija',
        per100: '100 g produkto',
        add: 'Įvesti ranka',
        note: 'Vertės orientacinės. Patikrinkite etiketę.'
      };
  const labels = Object.fromEntries(Object.entries(englishLabels).map(([key, en]) => [key, tx(en, lithuanianLabels[key])]));
  const header = (title, sub = '', logo = '') =>
    `<div class="page-header food-browser-header">${foodBrowserMode === 'home' ? '<span class="food-header-spacer"></span>' : `<button class="food-back-button" data-food-back type="button" aria-label="${labels.back}">‹</button>`}<div class="page-title-wrap"><p class="page-kicker">${labels.kicker}</p><h1 class="page-title">${logo ? `<span class="food-title-logo ${logo}" aria-hidden="true">${{ mcdonalds: 'M', hesburger: 'H', burgerking: 'BK', kfc: 'KFC', lidl: 'L' }[logo] || ''}</span>` : ''}${escapeHtml(title)}</h1>${sub ? `<p class="food-browser-subtitle">${escapeHtml(sub)}</p>` : ''}</div><div class="food-header-actions">${foodBrowserMode === 'home' ? `<button class="food-catalog-shortcut" data-food-mode="product-categories" type="button">${tx('Catalog', 'Katalogas')}</button>` : ''}<button class="header-action" data-food-photo type="button" aria-label="${tx('Analyze food photo', 'Analizuoti maisto nuotrauką')}"><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path class="duo" d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/></svg></button></div></div>`;
  const searchBar = () =>
    `<div class="food-catalog-search"><input id="food-catalog-search" type="search" value="${escapeHtml(foodSearchQuery)}" placeholder="${labels.search}"><button id="food-catalog-add-manual" type="button">+ ${labels.add}</button></div>`;
  const card = (f, restaurant = false) =>
    `<article class="food-catalog-card"><div class="food-card-main"><div class="food-card-title"><span class="food-card-category">${restaurant ? escapeHtml(f.restaurantCategory || f.restaurantLt) : escapeHtml(foodCategory(f))}</span><h3>${escapeHtml(foodName(f))}</h3><small>${restaurant && !f.per100 ? (f.weight === 1 ? labels.official : `${f.weight} g · ${labels.official}`) : labels.per100}</small></div><button class="food-add-button" ${restaurant ? `data-restaurant-food="${f.id}"` : `data-common-food="${f.id}"`} ${!Number.isFinite(f.carbs) ? 'disabled' : ''} type="button" aria-label="${tx('Add', 'Pridėti')}">+</button></div><div class="food-macros"><span class="food-carb-focus"><b>${Number.isFinite(f.carbs) ? `${f.carbs} g` : '—'}</b><small>${tx('CARBS', 'ANGL.')}</small></span><span><b>${Number.isFinite(f.protein) ? `${f.protein} g` : '—'}</b><small>${tx('PROTEIN', 'BALTYMAI')}</small></span><span><b>${Number.isFinite(f.fat) ? `${f.fat} g` : '—'}</b><small>${tx('FAT', 'RIEBALAI')}</small></span></div>${restaurant ? `${!Number.isFinite(f.carbs) ? `<small class="food-macro-unavailable">${escapeHtml(f.macroUnavailableReason ? (language === 'lt' ? f.macroUnavailableReason.lt : f.macroUnavailableReason.en) : tx('Nutrition values are unavailable in the source.', 'Oficialiame šaltinyje maistinės vertės nepateiktos.'))}</small>` : ''}${f.nutritionSource ? `<a class="food-source-link" href="${f.nutritionSource}" target="_blank" rel="noopener">${tx('Nutrition reference', 'Makroelementų šaltinis')}</a>` : ''}<a class="food-source-link" href="${f.source}" target="_blank" rel="noopener">${tx('Official product list and nutrition', 'Oficialus produktų sąrašas ir maistinė vertė')}</a>` : ''}${!restaurant && f.source ? `<a class="food-source-link" href="${f.source}" target="_blank" rel="noopener">${f.fdcId ? (tx('Source: USDA FoodData Central', 'Šaltinis: USDA FoodData Central')) : tx('Official product page', 'Oficialus produkto puslapis')}</a>` : ''}</article>`;
  const categoryGroups = [
    {
      key: 'produce',
      lt: 'Vaisiai ir daržovės',
      en: 'Fruit & vegetables',
      ltCats: ['Vaisiai', 'Daržovės'],
      enCats: ['Fruit', 'Vegetables']
    },
    {
      key: 'grains',
      lt: 'Duona, grūdai ir pusryčiai',
      en: 'Bread, grains & breakfast',
      ltCats: ['Duona', 'Grūdai', 'Pusryčių dribsniai', 'Pusryčių patiekalai'],
      enCats: ['Bread', 'Grains', 'Breakfast cereal', 'Breakfast foods']
    },
    {
      key: 'protein',
      lt: 'Mėsa, žuvis, kiaušiniai ir ankštiniai',
      en: 'Meat, fish, eggs & legumes',
      ltCats: ['Mėsa ir žuvis', 'Kiaušiniai', 'Ankštiniai'],
      enCats: ['Meat & fish', 'Eggs', 'Legumes']
    },
    { key: 'dairy', lt: 'Pieno produktai', en: 'Dairy', ltCats: ['Pieno produktai'], enCats: ['Dairy'] },
    { key: 'nuts', lt: 'Riešutai ir sėklos', en: 'Nuts & seeds', ltCats: ['Riešutai ir sėklos'], enCats: ['Nuts & seeds'] },
    {
      key: 'snacks',
      lt: 'Užkandžiai ir saldumynai',
      en: 'Snacks & sweets',
      ltCats: ['Užkandžiai', 'Saldumynai', 'Desertai'],
      enCats: ['Snacks', 'Sweets', 'Desserts']
    },
    { key: 'drinks', lt: 'Gėrimai', en: 'Drinks', ltCats: ['Gėrimai'], enCats: ['Drinks'] }
  ];
  const categoryGroupFor = f => categoryGroups.find(g => g.ltCats.includes(f.catLt) || g.enCats.includes(f.catEn));
  const groupItems = g => foodCatalog.filter(f => categoryGroupFor(f)?.key === g.key);
  const productCount = n =>
    language === 'en'
      ? `${n} ${n === 1 ? 'item' : 'items'}`
      : language !== 'lt'
      ? tx('{n} items').replace('{n}', n)
      : `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'produktas' : n % 10 >= 2 && n % 10 <= 9 && !(n % 100 >= 12 && n % 100 <= 19) ? 'produktai' : 'produktų'}`;
  const brandDesc = tx('Lithuanian menu', 'Lietuvos meniu');
  const brands = [
    // Plain text initials, not the companies' logos (trademarks)
    { id: 'mcdonalds', name: 'McDonald’s', mark: 'M', desc: brandDesc, className: 'mcdonalds' },
    { id: 'hesburger', name: 'Hesburger', mark: 'H', desc: brandDesc, className: 'hesburger' },
    { id: 'burgerking', name: 'Burger King', mark: 'BK', desc: brandDesc, className: 'burgerking' },
    { id: 'kfc', name: 'KFC', mark: 'KFC', desc: brandDesc, className: 'kfc' },
    { id: 'lidl', name: 'Lidl', mark: 'L', desc: tx('Bakery products', 'Kepyklėlės gaminiai'), className: 'lidl' }
  ];
  const q = foodSearchQuery.trim().toLocaleLowerCase(locale());
  if (foodBrowserMode === 'home') {
    const todayStart = startOfDay(Date.now()),
      todayFoods = foodLog.filter(x => x.timestamp >= todayStart && x.timestamp <= endOfDay(todayStart)),
      todayCarbs = todayFoods.reduce((sum, x) => sum + Number(x.carbs || 0), 0);
    const mealTotals = [
      ['breakfast', tx('Breakfast', 'Pusryčiai')],
      ['lunch', tx('Lunch', 'Pietūs')],
      ['dinner', tx('Dinner', 'Vakarienė')],
      ['snack', tx('Snacks', 'Užkandžiai')]
    ]
      .map(([key, label]) => {
        const amount = todayFoods.filter(x => (x.mealType || 'snack') === key).reduce((sum, x) => sum + Number(x.carbs || 0), 0);
        return `<div class="food-meal-carb"><span>${label}</span><strong>${decimal(amount, 1)} <small>g</small></strong></div>`;
      })
      .join('');
    root.innerHTML =
      header(labels.title) +
      `<div class="food-home-dashboard"><button class="food-carb-hero" data-food-mode="daily-summary" type="button" aria-label="${labels.daily}: ${decimal(todayCarbs, 1)} g ${tx('carbohydrates', 'angliavandenių')}"><span class="food-carb-hero-title">${labels.daily}</span><span class="food-carb-circle"><strong>${decimal(todayCarbs, 1)}</strong><small>g ${tx('carbohydrates', 'angliavandenių')}</small></span><span class="food-meal-carb-row">${mealTotals}</span></button><div class="food-nav-grid"><button class="food-nav-card" data-food-mode="restaurant-list" type="button"><span class="food-nav-icon" aria-hidden="true"><svg class="ui-icon" viewBox="0 0 24 24"><path class="duo" d="M17 21a1 1 0 0 0 1-1v-5.35c0-.46.32-.84.73-1.04a4 4 0 0 0-2.13-7.59 5 5 0 0 0-9.19 0 4 4 0 0 0-2.13 7.59c.41.2.73.58.73 1.04V20a1 1 0 0 0 1 1z"/><path d="M6 17h12"/></svg></span><strong>${labels.restaurants}</strong><span>${labels.restaurantsText}</span><b aria-hidden="true">›</b></button><button class="food-nav-card" data-food-mode="product-categories" type="button"><span class="food-nav-icon food-avocado-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M12 6.53V3a1 1 0 0 1 1-1"/><path class="duo" d="M18.24 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.47A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.76 10 3 3 0 0 0 3.65.65 5.5 5.5 0 0 1 5.18 0 3 3 0 0 0 3.65-.65"/></svg></span><strong>${labels.products}</strong><span>${labels.productsText}</span><b aria-hidden="true">›</b></button></div></div>`;
    return;
  }
  if (foodBrowserMode === 'daily-summary') {
    const todayStart = startOfDay(Date.now()),
      items = foodLog
        .filter(x => x.timestamp >= todayStart && x.timestamp <= endOfDay(todayStart))
        .sort((a, b) => a.timestamp - b.timestamp),
      total = items.reduce((sum, x) => sum + Number(x.carbs || 0), 0),
      groups = [
        ['breakfast', tx('Breakfast', 'Pusryčiai')],
        ['lunch', tx('Lunch', 'Pietūs')],
        ['dinner', tx('Dinner', 'Vakarienė')],
        ['snack', tx('Snacks', 'Užkandžiai')]
      ];
    const rows = groups
      .map(([key, label]) => {
        const foods = items.filter(x => (x.mealType || 'snack') === key),
          subtotal = foods.reduce((sum, x) => sum + Number(x.carbs || 0), 0);
        return `<section class="daily-food-group"><header><strong>${label}</strong><b>${decimal(subtotal, 1)} g ${tx('carbs', 'angl.')}</b></header>${foods.length ? foods.map(x => `<div class="daily-food-entry"><span>${escapeHtml(foodEntryName(x))}<small>${escapeHtml(x.portionLabel || `${x.amount || ''} ${x.unit === 'porcija' ? tx('serving', 'porcija') : x.unit || ''}`)}</small></span><b>${decimal(Number(x.carbs || 0), 1)} g</b><button class="history-delete daily-food-delete" data-food-delete="${escapeHtml(x.id)}" type="button" aria-label="${tx('Delete food entry', 'Ištrinti maisto įrašą')}">×</button></div>`).join('') : `<small class="daily-food-empty">—</small>`}</section>`;
      })
      .join('');
    root.innerHTML =
      header(labels.daily, labels.dailyText) +
      `<section class="daily-food-total"><span>${labels.dailyTotal}</span><strong>${decimal(total, 1)} <small>g</small></strong></section>${items.length ? rows : `<div class="page-card daily-food-no-items">${labels.empty}</div>`}`;
    return;
  }
  if (foodBrowserMode === 'restaurant-list') {
    root.innerHTML =
      header(labels.restaurants, tx('Choose a restaurant', 'Pasirinkite restoraną')) +
      `<div class="restaurant-list">${brands.map(b => `<button class="restaurant-list-card" data-restaurant="${b.id}" type="button"><span class="brand-logo ${b.className}" aria-hidden="true">${b.mark}</span><span class="restaurant-list-copy"><strong>${b.name}</strong><small>${b.desc}</small></span><span class="restaurant-item-count">${productCount(restaurantFoods.filter(f => f.restaurant === b.id).length).replace(/produkt\S*/, m => (b.id === 'lidl' ? { produktas: 'gaminys', produktai: 'gaminiai', produktų: 'gaminių' } : { produktas: 'patiekalas', produktai: 'patiekalai', produktų: 'patiekalų' })[m] || m)}</span><b class="restaurant-chevron" aria-hidden="true">›</b></button>`).join('')}</div><p class="food-catalog-note">${labels.note}</p>`;
    return;
  }
  if (foodBrowserMode === 'restaurant-menu') {
    const brand = brands.find(b => b.id === selectedRestaurant);
    const allItems = restaurantFoods.filter(f => f.restaurant === selectedRestaurant);
    const categories = [...new Set(allItems.flatMap(f => f.restaurantCategories || [f.restaurantCategory]).filter(Boolean))];
    const items = allItems.filter(
      f =>
        (selectedRestaurantCategory === 'all' || (f.restaurantCategories || [f.restaurantCategory]).includes(selectedRestaurantCategory)) &&
        (!q || foodName(f).toLocaleLowerCase().includes(q))
    );
    const categoryFilters = `<div class="restaurant-category-filters"><button class="food-filter-chip ${selectedRestaurantCategory === 'all' ? 'active' : ''}" data-restaurant-category="all" type="button">${tx('All', 'Visi')}</button>${categories.map(cat => `<button class="food-filter-chip ${selectedRestaurantCategory === cat ? 'active' : ''}" data-restaurant-category="${escapeHtml(cat)}" type="button">${escapeHtml(cat)}</button>`).join('')}</div>`;
    root.innerHTML =
      header(
        brand?.name || labels.restaurants,
        tx('Official Lithuanian product list', 'Oficialus Lietuvos produktų sąrašas'),
        brand?.className
      ) +
      searchBar() +
      categoryFilters +
      `<div class="food-card-list" id="food-catalog-cards">${items.map(f => card(f, true)).join('') || `<div class="page-card">${tx('No dishes in this section.', 'Šioje skiltyje patiekalų nėra.')}</div>`}</div><p class="food-catalog-note">${labels.note}</p>`;
    return;
  }
  if (foodBrowserMode === 'product-categories') {
    const visibleCategories = categoryGroups.filter(
      g =>
        !q || tx(g.en, g.lt).toLocaleLowerCase().includes(q) || groupItems(g).some(f => foodName(f).toLocaleLowerCase().includes(q))
    );
    root.innerHTML =
      header(labels.products, labels.productsText) +
      searchBar() +
      `<div class="food-section-heading"><h2>${labels.categories}</h2></div><div class="food-category-grid">${visibleCategories.map(g => `<button class="food-category-card" data-food-category="${g.key}" type="button"><span>${tx(g.en, g.lt)}</span><small>${productCount(groupItems(g).length)}</small><b>›</b></button>`).join('') || `<div class="page-card">${tx('No matching categories.', 'Kategorijų nerasta.')}</div>`}</div><p class="food-catalog-note">${labels.note}</p>`;
    return;
  }
  const activeGroup = categoryGroups.find(g => g.key === selectedFoodCategory);
  const groupCategoryNames = [...new Set(groupItems(activeGroup || categoryGroups[0]).map(foodCategory))];
  const categoryFoods = foodCatalog.filter(
    f =>
      categoryGroupFor(f)?.key === selectedFoodCategory &&
      (selectedFoodSubcategory === 'all' || foodCategory(f) === selectedFoodSubcategory) &&
      (!q || foodName(f).toLocaleLowerCase().includes(q))
  );
  const subcategoryFilters =
    groupCategoryNames.length > 1
      ? `<div class="food-chip-row food-group-filters"><button class="food-filter-chip ${selectedFoodSubcategory === 'all' ? 'active' : ''}" data-food-subcategory="all" type="button">${tx('All', 'Visi')}</button>${groupCategoryNames.map(cat => `<button class="food-filter-chip ${selectedFoodSubcategory === cat ? 'active' : ''}" data-food-subcategory="${escapeHtml(cat)}" type="button">${escapeHtml(cat)}</button>`).join('')}</div>`
      : '';
  root.innerHTML =
    header(activeGroup ? tx(activeGroup.en, activeGroup.lt) : labels.products, labels.productsText) +
    searchBar() +
    subcategoryFilters +
    `<div class="food-card-list" id="food-catalog-cards">${categoryFoods.map(f => card(f)).join('') || `<div class="page-card">${tx('No foods in this category.', 'Šioje kategorijoje produktų nerasta.')}</div>`}</div><p class="food-catalog-note">${labels.note}</p>`;
}
function addFoodCatalogItem(item, amount, portionMode = false, mealType = 'snack', portionLabel = '', timestamp = Date.now()) {
  const factor = portionMode ? amount : amount / 100,
    logAmount = portionMode ? (item.weight === 1 ? amount : Number((item.weight * amount).toFixed(1))) : amount;
  foodLog.push({
    id: createId('food'),
    foodId: item.id,
    name: foodName(item),
    nameLt: item.lt,
    nameEn: item.en,
    amount: logAmount,
    unit: portionMode ? (item.weight === 1 ? 'porcija' : 'g') : item.unit || 'g',
    portionLabel,
    carbs: Number((item.carbs * factor).toFixed(1)),
    ...(Number.isFinite(item.protein) ? { protein: Number((item.protein * factor).toFixed(1)) } : {}),
    ...(Number.isFinite(item.fat) ? { fat: Number((item.fat * factor).toFixed(1)) } : {}),
    gi: item.gi ?? null,
    mealType,
    timestamp
  });
  foodLog.sort((a, b) => a.timestamp - b.timestamp);
  writeJSON('debo-food-log', foodLog);
  renderHistory();
  toast(t('addedToLog'));
  schedulePostMealReminder(timestamp);
}
function openCatalogMealPicker(item, amount, portionMode = false) {
  pendingCatalogFood = { item, amount, portionMode };
  $('#catalog-meal-title').textContent = foodName(item);
  const options = portionMode
    ? [
        [0.5, t('servHalf')],
        [1, t('servOne')],
        [1.5, t('servOneHalf')],
        [2, t('servTwo')]
      ]
    : item.portions.map(p => [Number(p[0]), portionText(p, item.unit)]);
  const selector = $('#catalog-portion-select'),
    preferred = portionMode
      ? 1
      : options.findIndex(([, label]) => /vidut|medium|1 stiklin|1 cup|1 delno/i.test(label)) >= 0
        ? options.findIndex(([, label]) => /vidut|medium|1 stiklin|1 cup|1 delno/i.test(label))
        : Math.floor((options.length - 1) / 2);
  selector.innerHTML =
    options
      .map(([value, label], index) => `<option value="${value}" ${index === preferred ? 'selected' : ''}>${escapeHtml(label)}</option>`)
      .join('') + `<option value="manual">${t('enterExactAmount')}</option>`;
  $('#catalog-portion-exact-label').textContent =
    `${tx('Exact amount', 'Tikslus kiekis')} (${portionMode ? tx('servings', 'porcijomis') : item.unit || 'g'})`;
  $('#catalog-portion-note').textContent = language === 'lt' ? item.prepLt || '' : item.prepEn || '';
  $('#catalog-portion-exact').value = '';
  $('#catalog-portion-exact-wrap').classList.add('hidden');
  $('#catalog-time').value = currentTimeInputValue();
  updateCatalogPortionPreview();
  $('#catalog-meal-modal').showModal();
}

function selectCatalogMeal(mealType) {
  if (!pendingCatalogFood) {
    foodBrowserMode = 'product-categories';
    foodSearchQuery = '';
    selectedFoodCategory = 'all';
    selectedFoodSubcategory = 'all';
    selectedRestaurant = 'all';
    const modal = $('#catalog-meal-modal');
    if (modal.open) modal.close();
    showView('food');
    return false;
  }
  const { item, portionMode } = pendingCatalogFood,
    manual = $('#catalog-portion-select').value === 'manual',
    amount = manual ? parseNumber($('#catalog-portion-exact').value) : Number($('#catalog-portion-select').value);
  if (!Number.isFinite(amount) || amount <= 0) {
    toast(t('portionInvalid'));
    return;
  }
  const portionLabel = manual
    ? `${amount} ${portionMode ? 'porc.' : item.unit || 'g'}`
    : $('#catalog-portion-select').selectedOptions[0]?.textContent || '';
  const timestamp = foodTimestamp($('#catalog-time'));
  if (!Number.isFinite(timestamp)) {
    toast(t('chooseTime'));
    return false;
  }
  try {
    addFoodCatalogItem(item, amount, portionMode, mealType, portionLabel, timestamp);
  } catch (error) {
    console.error('Could not save catalog food', error);
    toast(t('foodSaveFailed'));
  }
  // Stay on the same list (category, restaurant menu or search) so the next item can be added right away
  pendingCatalogFood = null;
  const modal = $('#catalog-meal-modal');
  if (modal.open) modal.close();
  if ($('#view-food')?.classList.contains('active')) renderExpandedFoodPage();
  else showView('food');
  return false;
}

function updateCatalogPortionPreview() {
  const pending = pendingCatalogFood;
  if (!pending) return;
  const { item, portionMode } = pending,
    select = $('#catalog-portion-select'),
    manual = select.value === 'manual';
  $('#catalog-portion-exact-wrap').classList.toggle('hidden', !manual);
  const amount = manual ? parseNumber($('#catalog-portion-exact').value) : Number(select.value),
    valid = Number.isFinite(amount) && amount > 0;
  const factor = valid ? (portionMode ? amount : amount / 100) : 0;
  const amountLabel = manual
    ? `${amount || '—'} ${portionMode ? 'porc.' : item.unit || 'g'}`
    : select.selectedOptions[0]?.textContent || '';
  $('#catalog-portion-preview').innerHTML = valid
    ? `<small>${escapeHtml(amountLabel)}</small><strong>${decimal(item.carbs * factor, 1)} g ${t('carbsWord')}</strong><span>${t('proteinWord')} ${decimal(Number(item.protein || 0) * factor, 1)} g · ${t('fatWord')} ${decimal(Number(item.fat || 0) * factor, 1)} g</span>`
    : '';
  $$('#catalog-meal-modal [data-catalog-meal]').forEach(button => (button.disabled = !valid));
}

function openPhotoAnalysis() {
  DOM.photoStatus.textContent = '';
  DOM.photoResults.replaceChildren();
  DOM.photoSaveButton.classList.add('hidden');
  photoMealEstimate = null;
  if (!DOM.photoModal.open) DOM.photoModal.showModal();
  requestCreditProducts();
}

function bindFoodCatalogPage() {
  $('#food-browser')?.addEventListener('input', event => {
    if (event.target.id === 'food-catalog-search') {
      foodSearchQuery = event.target.value;
      // Only the results below the search box are replaced: rebuilding the box itself while typing
      // breaks the Android keyboard's word suggestions (letters get lost or doubled)
      const page = $('#food-browser'),
        box = event.target.closest('.food-catalog-search'),
        scratch = document.createElement('div');
      renderExpandedFoodPage(scratch);
      const fresh = scratch.querySelector('.food-catalog-search');
      if (!box || !fresh || box.parentElement !== page) return renderExpandedFoodPage();
      while (box.nextSibling) box.nextSibling.remove();
      const rest = [];
      for (let node = fresh.nextSibling; node; node = node.nextSibling) rest.push(node);
      box.after(...rest);
    }
  });
  $('#food-browser')?.addEventListener('click', event => {
    const deleteFood = event.target.closest('[data-food-delete]');
    if (deleteFood) {
      quickDeleteEvent('food', deleteFood.dataset.foodDelete);
      return;
    }
    const back = event.target.closest('[data-food-back]');
    if (back) {
      foodBrowserMode =
        foodBrowserMode === 'restaurant-menu' ? 'restaurant-list' : foodBrowserMode === 'category-products' ? 'product-categories' : 'home';
      foodSearchQuery = '';
      selectedFoodSubcategory = 'all';
      renderExpandedFoodPage();
      return;
    }
    const branch = event.target.closest('[data-food-mode]');
    if (branch) {
      foodBrowserMode = branch.dataset.foodMode;
      foodSearchQuery = '';
      selectedFoodCategory = 'all';
      selectedFoodSubcategory = 'all';
      renderExpandedFoodPage();
      return;
    }
    const category = event.target.closest('[data-food-category]');
    if (category) {
      selectedFoodCategory = category.dataset.foodCategory;
      selectedFoodSubcategory = 'all';
      foodBrowserMode = 'category-products';
      renderExpandedFoodPage();
      return;
    }
    const foodSubcategory = event.target.closest('[data-food-subcategory]');
    if (foodSubcategory) {
      selectedFoodSubcategory = foodSubcategory.dataset.foodSubcategory;
      renderExpandedFoodPage();
      return;
    }
    const restaurant = event.target.closest('[data-restaurant]');
    if (restaurant) {
      selectedRestaurant = restaurant.dataset.restaurant;
      selectedRestaurantCategory = 'all';
      foodSearchQuery = '';
      foodBrowserMode = 'restaurant-menu';
      renderExpandedFoodPage();
      return;
    }
    const restaurantCategory = event.target.closest('[data-restaurant-category]');
    if (restaurantCategory) {
      selectedRestaurantCategory = restaurantCategory.dataset.restaurantCategory;
      renderExpandedFoodPage();
      return;
    }
    const restaurantButton = event.target.closest('[data-restaurant-food]');
    if (restaurantButton) {
      const item = restaurantFoods.find(x => x.id === restaurantButton.dataset.restaurantFood);
      if (item) openCatalogMealPicker(item, item.per100 ? 100 : 1, !item.per100);
      return;
    }
    const commonButton = event.target.closest('[data-common-food]');
    if (commonButton) {
      const item = foodCatalog.find(x => x.id === commonButton.dataset.commonFood);
      if (item) openCatalogMealPicker(item, 100, false);
      return;
    }
    if (event.target.closest('#food-catalog-add-manual')) {
      setFoodEntryMode('manual');
      openEntry('food');
      return;
    }
    if (event.target.closest('[data-food-photo]')) {
      if (requirePremium()) openPhotoAnalysis();
    }
  });
  $('#catalog-portion-select')?.addEventListener('change', updateCatalogPortionPreview);
  $('#catalog-portion-exact')?.addEventListener('input', updateCatalogPortionPreview);
  $('#catalog-meal-modal')?.addEventListener('close', () => {
    pendingCatalogFood = null;
  });
}
function selectedFood() {
  const id = DOM.foodProduct.value;
  if (!id) return null;
  if (id === 'custom') {
    const name = DOM.customFoodName.value.trim();
    const carbsText = DOM.customFoodCarbs.value.trim();
    const proteinText = DOM.customFoodProtein.value.trim();
    const fatText = DOM.customFoodFat.value.trim();
    const carbs = carbsText ? parseNumber(carbsText) : NaN;
    const protein = proteinText ? parseNumber(proteinText) : NaN;
    const fat = fatText ? parseNumber(fatText) : NaN;
    if (!name || !Number.isFinite(carbs)) {
      return null;
    }
    return {
      id: 'custom',
      lt: name,
      en: name,
      carbs,
      protein: Number.isFinite(protein) ? protein : null,
      fat: Number.isFinite(fat) ? fat : null,
      gi: null,
      unit: 'g',
      portions: []
    };
  }
  return foodCatalog.find(x => x.id === id);
}

function updateFoodPortions() {
  const food = selectedFood();
  const custom = DOM.foodProduct.value === 'custom';
  DOM.customFoodFields.classList.toggle('hidden', !custom);
  if (custom) {
    DOM.foodPortion.innerHTML = `<option value="manual">${t('exactAmountOption')}</option>`;
  } else if (food) {
    const preferred = food.portions.findIndex(option =>
      /vidut|medium|1 stiklin|1 cup|1 delno/i.test(`${option[1]} ${option[2]}`)
    );
    DOM.foodPortion.innerHTML =
      food.portions
        .map(
          (p, index) =>
            `<option value="${p[0]}" ${index === (preferred >= 0 ? preferred : Math.floor((food.portions.length - 1) / 2)) ? 'selected' : ''}>${escapeHtml(portionText(p, food.unit))}</option>`
        )
        .join('') + `<option value="manual">${t('exactAmountOption')}</option>`;
  } else {
    DOM.foodPortion.innerHTML = `<option value="">${t('chooseProduct')}</option>`;
  }
  DOM.foodPreparationNote.textContent = food ? (language === 'lt' ? food.prepLt || '' : food.prepEn || '') : '';
  DOM.foodGramsLabel.classList.toggle('hidden', DOM.foodPortion.value !== 'manual');
  syncFoodEntryUi();
  updateCarbPreview();
}

function updateCarbPreview() {
  const food = selectedFood();
  if (!food) {
    DOM.carbPreview.textContent = t('chooseProduct');
    return;
  }
  const amount = DOM.foodPortion.value === 'manual' ? parseNumber(DOM.foodGrams.value) : parseNumber(DOM.foodPortion.value);
  if (!Number.isFinite(amount) || amount <= 0) {
    DOM.carbPreview.innerHTML = renderGi(food);
    return;
  }
  const carbs = (amount * food.carbs) / 100;
  const macroSummary =
    Number.isFinite(food.protein) && Number.isFinite(food.fat)
      ? '<small>' +
        t('photoProtein') +
        ' ' +
        decimal((amount * food.protein) / 100, 1) +
        ' g · ' +
        t('photoFat') +
        ' ' +
        decimal((amount * food.fat) / 100, 1) +
        ' g</small>'
      : '';
  DOM.carbPreview.innerHTML = `
    <small>
      ${escapeHtml(foodName(food))}
      ·
      ${decimal(amount, 0)}
      ${food.unit}
    </small>

    <strong>
      ${decimal(carbs, 1)} g
      ${t('carbs')}
    </strong>

    ${macroSummary}

    ${renderGi(food)}
  `;
}

function setFoodEntryMode(mode) {
  $$('.food-entry-tool').forEach(button =>
    button.classList.toggle('active', button.id === 'food-mode-' + mode || (mode === 'photo' && button.id === 'open-photo-analysis'))
  );
}

function requirePremium() {
  if (!PREMIUM) return false;
  if (getMembership().active) return true;
  openMembership();
  return false;
}

function defaultMealType(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 17 && hour < 21) return 'dinner';
  return 'snack';
}

function setMealType(value) {
  const select = $('#food-meal-type');
  if (!select) return;
  select.value = value;
  $$('[data-meal-chip]').forEach(chip => {
    const active = chip.dataset.mealChip === value;
    chip.classList.toggle('active', active);
    chip.setAttribute('aria-checked', String(active));
  });
  // The "save as favorite" offer depends on the meal type
  if (entryMode === 'food' && !DOM.foodProduct.value && !$('#food-search-input')?.value) renderFoodSearch();
}

function syncFoodEntryUi() {
  const value = DOM.foodProduct.value;
  const food = selectedFood();
  const hasSelection = !!value;
  $('#food-details')?.classList.toggle('hidden', !hasSelection);
  $('#food-selected')?.classList.toggle('hidden', !hasSelection || value === 'custom');
  $('#food-search')?.classList.toggle('hidden', hasSelection && value !== 'custom');
  $('#food-mode-manual')?.classList.toggle('hidden', hasSelection);
  $('.food-smart')?.classList.toggle('hidden', hasSelection);
  if (hasSelection && value !== 'custom') {
    $('#food-search-results')?.classList.add('hidden');
    const name = $('#food-selected-name');
    if (name) name.textContent = food ? foodName(food) : '';
  }
}

function renderFoodSearch() {
  const input = $('#food-search-input');
  const list = $('#food-search-results');
  if (!input || !list) return;
  const query = normalizeFoodQuery(input.value);
  if (!query) {
    renderRecentFoods(list);
    return;
  }
  const words = query.split(' ');
  const matches = foodCatalog
    .map(food => {
      const names = [food.lt, food.en, food[language] || ''].map(normalizeFoodQuery);
      const best = Math.max(...names.map(name => (name.startsWith(query) ? 3 : words.every(word => name.includes(word)) ? 2 : 0)));
      return { food, best };
    })
    .filter(item => item.best > 0)
    .sort((a, b) => b.best - a.best || foodName(a.food).localeCompare(foodName(b.food), locale()))
    .slice(0, 8);
  list.innerHTML = matches.length
    ? matches
        .map(
          ({ food }) =>
            `<button class="food-search-item" type="button" role="option" data-food-pick="${escapeHtml(food.id)}"><span><strong>${escapeHtml(foodName(food))}</strong><small>${escapeHtml(foodCategory(food) || '')}</small></span><b>${decimal(Number(food.carbs), 1)} g<small>${t('per100Short')}</small></b></button>`
        )
        .join('')
    : `<div class="food-search-empty"><p>${t('foodSearchEmpty')}</p><button class="text-link" type="button" data-food-custom>${t('customProductLink')}</button></div>`;
  list.classList.remove('hidden');
}

function pickFoodFromSearch(id, amount = null) {
  DOM.foodProduct.value = id;
  const input = $('#food-search-input');
  if (input) input.value = '';
  updateFoodPortions();
  if (!amount) return;
  const option = [...DOM.foodPortion.options].find(o => Number(o.value) === amount);
  if (option) DOM.foodPortion.value = option.value;
  else if ([...DOM.foodPortion.options].some(o => o.value === 'manual')) {
    DOM.foodPortion.value = 'manual';
    DOM.foodGrams.value = String(amount);
    DOM.foodGramsLabel.classList.remove('hidden');
  }
  updateCarbPreview();
}

function recentFoods(limit = 5) {
  const seen = new Set(),
    out = [];
  for (let i = foodLog.length - 1; i >= 0 && out.length < limit; i--) {
    const entry = foodLog[i];
    const food = foodCatalog.find(f => f.id === entry.foodId) || foodCatalog.find(f => f.lt === entry.nameLt);
    if (!food || seen.has(food.id)) continue;
    seen.add(food.id);
    out.push({ food, amount: Number(entry.amount) || null, unit: entry.unit || food.unit });
  }
  return out;
}

function renderRecentFoods(list) {
  const items = recentFoods();
  const top = favoritesHtml();
  if (!items.length && !top) {
    list.classList.add('hidden');
    list.innerHTML = '';
    return;
  }
  list.innerHTML =
    top +
    (items.length ? `<p class="food-recent-title">${t('recentFoods')}</p>` : '') +
    items
      .map(
        ({ food, amount, unit }) =>
          `<button class="food-search-item" type="button" role="option" data-food-pick="${escapeHtml(food.id)}"${amount ? ` data-food-amount="${amount}"` : ''}><span><strong>${escapeHtml(foodName(food))}</strong><small>${amount ? `${decimal(amount, 0)} ${escapeHtml(unit || 'g')}` : ''}</small></span><b>${amount ? decimal((amount * food.carbs) / 100, 1) : decimal(Number(food.carbs), 1)} g<small>${amount ? t('carbsShort') : t('per100Short')}</small></b></button>`
      )
      .join('');
  list.classList.remove('hidden');
}

function resetFoodSelection() {
  DOM.foodProduct.value = '';
  DOM.foodModeStatus.classList.add('hidden');
  DOM.foodBarcodeManual.classList.add('hidden');
  updateFoodPortions();
  setTimeout(() => $('#food-search-input')?.focus(), 60);
}

function bindFoodEntryEvents() {
  $('#food-search-input')?.addEventListener('input', renderFoodSearch);
  $('#food-search-input')?.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    $('#food-search-results [data-food-pick]')?.click();
  });
  $('#food-search-results')?.addEventListener('click', event => {
    const pick = event.target.closest('[data-food-pick]');
    if (pick) return pickFoodFromSearch(pick.dataset.foodPick, Number(pick.dataset.foodAmount) || null);
    if (event.target.closest('[data-food-custom]')) {
      const name = $('#food-search-input')?.value.trim() || '';
      startManualFoodEntry();
      if (name) DOM.customFoodName.value = name;
    }
  });
  $('#food-change')?.addEventListener('click', resetFoodSelection);
  $$('[data-meal-chip]').forEach(chip =>
    chip.addEventListener('click', () => {
      mealTypeChosen = true;
      setMealType(chip.dataset.mealChip);
    })
  );
  // Until a meal is picked by hand, it follows the time: 08:00 is breakfast, 13:00 lunch
  $('#food-time')?.addEventListener('input', () => {
    const minute = minutesOfTime($('#food-time').value);
    if (!mealTypeChosen && minute !== null) setMealType(defaultMealType(Math.floor(minute / 60)));
  });
}
let mealTypeChosen = false;

// The meal time field: empty means now; a time later than now is yesterday (like the other entry times)
function foodTimestamp(input) {
  if (!input?.value) return Date.now();
  return entryTimestamp(input.value);
}

function startManualFoodEntry() {
  setFoodEntryMode('manual');
  DOM.foodModeStatus.classList.add('hidden');
  DOM.foodBarcodeManual.classList.add('hidden');
  DOM.foodProduct.value = 'custom';
  updateFoodPortions();
  DOM.customFoodName.focus();
}

function setManualFoodValues({ name = '', carbs = '', protein = '', fat = '', amount = '' }) {
  DOM.foodProduct.value = 'custom';
  updateFoodPortions();
  DOM.customFoodName.value = name;
  DOM.customFoodCarbs.value = carbs;
  DOM.customFoodProtein.value = protein;
  DOM.customFoodFat.value = fat;
  DOM.foodPortion.value = 'manual';
  DOM.foodGramsLabel.classList.remove('hidden');
  DOM.foodGrams.value = amount;
  updateCarbPreview();
}

function normalizeFoodQuery(value) {
  return String(value || '')
    .toLocaleLowerCase('lt')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function findCatalogFoodByName(name) {
  const query = normalizeFoodQuery(name);
  if (!query) return null;
  return (
    foodCatalog.find(food => {
      const names = [food.lt, food.en, food[language] || ''].map(normalizeFoodQuery);
      return names.some(
        candidate =>
          candidate === query ||
          candidate.includes(query) ||
          query.includes(candidate) ||
          (query.length >= 5 && candidate.startsWith(query.slice(0, 5)))
      );
    }) || null
  );
}

function useVoiceFoodTranscript(transcript) {
  setFoodEntryMode('manual');
  const amountMatch = transcript.match(/(\d+(?:[.,]\d+)?)\s*(kg|gram(?:as|ų|ais)?|g)/i);
  let amount = '';
  let productText = transcript.trim();
  if (amountMatch) {
    const n = Number(amountMatch[1].replace(',', '.'));
    amount = String(Math.round(n * (/^kg$/i.test(amountMatch[2]) ? 1000 : 1)));
    productText = (transcript.slice(0, amountMatch.index) + ' ' + transcript.slice(amountMatch.index + amountMatch[0].length)).trim();
  }
  productText = productText
    .replace(/\b(?:kiek|kilogram(?:as|ų|ais)?|gram(?:as|ų|ais)?|kg|g|porcija|įvesti|pridėti|maisto|maistą)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const matched = findCatalogFoodByName(productText);
  if (matched) {
    DOM.foodProduct.value = matched.id;
    updateFoodPortions();
    DOM.foodPortion.value = 'manual';
    DOM.foodGramsLabel.classList.remove('hidden');
    DOM.foodGrams.value = amount;
    updateCarbPreview();
    DOM.foodModeStatus.textContent = t('foodNeedsMacros');
  } else {
    setManualFoodValues({ name: productText, amount });
    DOM.foodModeStatus.textContent = productText ? t('productNotFound') : t('voiceFailed');
  }
  DOM.foodModeStatus.classList.remove('hidden');
}

async function lookupFoodBarcode(code) {
  const barcode = String(code || '').replace(/\D/g, '');
  if (!/^\d{8,14}$/.test(barcode)) {
    DOM.foodModeStatus.textContent = t('barcodeNotFound');
    DOM.foodModeStatus.classList.remove('hidden');
    return;
  }
  setFoodEntryMode('barcode');
  DOM.foodModeStatus.textContent = t('barcodeWorking');
  DOM.foodModeStatus.classList.remove('hidden');
  try {
    const url =
      'https://world.openfoodfacts.org/api/v2/product/' +
      encodeURIComponent(barcode) +
      '.json?fields=product_name,product_name_lt,product_name_en,brands,nutriments';
    const response = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!response.ok) throw new Error('lookup-failed');
    const data = await response.json();
    const product = data.status === 1 ? data.product : null;
    const nutriments = (product && product.nutriments) || {};
    const carbs = Number(nutriments.carbohydrates_100g ?? nutriments.carbs_100g);
    const protein = Number(nutriments.proteins_100g);
    const fat = Number(nutriments.fat_100g);
    const name =
      (language === 'en'
        ? (product && product.product_name_en) || (product && product.product_name)
        : (product && product[`product_name_${language}`]) || (product && product.product_name)) || '';
    if (!product || !name || !Number.isFinite(carbs)) throw new Error('not-found');
    setManualFoodValues({
      name,
      carbs: carbs.toFixed(1),
      protein: Number.isFinite(protein) ? protein.toFixed(1) : '',
      fat: Number.isFinite(fat) ? fat.toFixed(1) : ''
    });
    DOM.foodModeStatus.textContent = t('foodNeedsMacros');
    DOM.foodModeStatus.classList.remove('hidden');
    DOM.foodBarcodeManual.classList.add('hidden');
  } catch (error) {
    DOM.foodModeStatus.textContent = error.message === 'not-found' ? t('barcodeNotFound') : t('barcodeFailed');
    DOM.foodModeStatus.classList.remove('hidden');
  }
}

function reportFoodInputError(key) {
  DOM.foodModeStatus.textContent = t(key);
  DOM.foodModeStatus.classList.remove('hidden');
}

function startVoiceFoodEntry() {
  setFoodEntryMode('voice');
  DOM.foodBarcodeManual.classList.add('hidden');
  DOM.foodModeStatus.textContent = t('voicePrompt');
  DOM.foodModeStatus.classList.remove('hidden');
  if (window.NativeFoodTools?.startSpeechRecognition) {
    window.NativeFoodTools.startSpeechRecognition(language);
    return;
  }
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Speech) return reportFoodInputError('voiceUnavailable');
  const recognition = new Speech();
  recognition.lang = locale();
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = event => useVoiceFoodTranscript(event.results[0][0].transcript);
  recognition.onerror = () => reportFoodInputError('voiceFailed');
  try {
    recognition.start();
  } catch {
    reportFoodInputError('voiceFailed');
  }
}

function startBarcodeFoodEntry() {
  setFoodEntryMode('barcode');
  DOM.foodBarcodeManual.classList.remove('hidden');
  DOM.foodModeStatus.textContent = t('barcodePrompt');
  DOM.foodModeStatus.classList.remove('hidden');
  if (window.NativeFoodTools?.scanBarcode) {
    window.NativeFoodTools.scanBarcode();
  } else {
    DOM.foodModeStatus.textContent = t('barcodeManualPrompt');
    DOM.foodBarcodeInput.focus();
  }
}

window.onNativeBarcodeScanned = code => lookupFoodBarcode(code);
window.onNativeBarcodeError = () => reportFoodInputError('barcodeFailed');
window.onNativeSpeechResult = text => useVoiceFoodTranscript(String(text || ''));
window.onNativeSpeechError = () => reportFoodInputError('voiceFailed');

function saveFoodEntry() {
  const food = selectedFood();
  const amount = DOM.foodPortion.value === 'manual' ? parseNumber(DOM.foodGrams.value) : parseNumber(DOM.foodPortion.value);
  if (!food || !Number.isFinite(amount) || amount <= 0) {
    toast(t('chooseFood'));
    return false;
  }
  // Values typed by hand are per 100 g, so each must be between 0 and 100
  const per100 = value => value === null || value === undefined || (value >= 0 && value <= 100);
  if (food.id === 'custom' && (!per100(food.carbs) || !per100(food.protein) || !per100(food.fat))) {
    toast(t('enterValidValue'));
    return false;
  }
  const timestamp = foodTimestamp($('#food-time'));
  if (!Number.isFinite(timestamp)) {
    toast(t('chooseTime'));
    return false;
  }
  const carbs = (amount * food.carbs) / 100;
  const protein = Number.isFinite(food.protein) ? (amount * food.protein) / 100 : null;
  const fat = Number.isFinite(food.fat) ? (amount * food.fat) / 100 : null;
  foodLog.push({
    id: createId('food'),
    ...(food.id && food.id !== 'custom' ? { foodId: food.id } : {}),
    name: foodName(food),
    nameLt: food.lt,
    nameEn: food.en,
    amount,
    unit: food.unit,
    portionLabel:
      DOM.foodPortion.value === 'manual'
        ? `${amount} ${food.unit}`
        : DOM.foodPortion.selectedOptions[0]?.textContent || `${amount} ${food.unit}`,
    carbs,
    mealType: $('#food-meal-type')?.value || 'snack',
    ...(protein === null ? {} : { protein }),
    ...(fat === null ? {} : { fat }),
    gi: food.gi,
    timestamp,
    ...entryExtras()
  });
  foodLog.sort((a, b) => a.timestamp - b.timestamp);
  writeJSON('debo-food-log', foodLog);
  schedulePostMealReminder(timestamp);
  renderHistory();
  if (foodBrowserMode === 'daily-summary') renderExpandedFoodPage();
  return true;
}

function readMealPhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file),
      img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image-read-failed'));
    };
    img.src = url;
  });
}

function updatePhotoMealTotals() {
  const total = field =>
    [...DOM.photoResults.querySelectorAll(`[data-photo-field="${field}"]`)].reduce((sum, input) => {
      const value = parseNumber(input.value);
      return sum + (Number.isFinite(value) && value > 0 ? value : 0);
    }, 0);
  for (const [key, field] of Object.entries({ grams: 'estimatedGrams', carbs: 'carbohydratesG', protein: 'proteinG', fat: 'fatG' })) {
    const target = DOM.photoResults.querySelector(`[data-photo-total="${key}"]`);
    if (target) target.textContent = total(field).toFixed(1);
  }
}

function renderMealEstimate(result) {
  photoMealEstimate = result;
  const items = result.items || [];
  const breakdown = items
    .map(
      (item, index) => `
    <article class="photo-result-item" data-photo-item="${index}">
      <div class="photo-item-heading">
        <h3>${escapeHtml(item.name)}</h3>
        <span class="photo-confidence">${t('photoConfidence')}: ${t(`photo${item.confidence[0].toUpperCase()}${item.confidence.slice(1)}`)}</span>
      </div>
      <label class="photo-portion-field">${t('photoPortion')} (g)<input data-photo-field="estimatedGrams" inputmode="decimal" value="${decimal(Number(item.estimatedGrams), 0)}"></label>
      <div class="photo-item-macros">
        <label>${t('photoNutrition')}<input data-photo-field="carbohydratesG" inputmode="decimal" value="${decimal(Number(item.carbohydratesG), 1)}"><small>g</small></label>
        <label>${t('photoProtein')}<input data-photo-field="proteinG" inputmode="decimal" value="${decimal(Number(item.proteinG), 1)}"><small>g</small></label>
        <label>${t('photoFat')}<input data-photo-field="fatG" inputmode="decimal" value="${decimal(Number(item.fatG), 1)}"><small>g</small></label>
      </div>
      <label class="photo-gi-field">${t('photoGI')}<input data-photo-field="glycemicIndex" inputmode="numeric" value="${item.glycemicIndex ?? ''}" placeholder="${t('photoUnknownGI')}"></label>
      <p class="photo-result-note">${escapeHtml(item.glycemicIndexNote)} ${escapeHtml(item.uncertainty)}</p>
    </article>`
    )
    .join('');
  DOM.photoResults.innerHTML = items.length
    ? `
    <section class="photo-meal-summary" aria-label="${escapeHtml(t('photoWholePortion'))}">
      <p class="photo-summary-kicker">${t('photoWholePortion')}</p>
      <div class="photo-total-weight"><span>${t('photoPortionWeight')}</span><strong><span data-photo-total="grams">0.0</span> g</strong></div>
      <div class="photo-total-macros">
        <div class="photo-total-macro photo-total-carbs"><span>${t('photoNutrition')}</span><strong><span data-photo-total="carbs">0.0</span><small>g</small></strong></div>
        <div class="photo-total-macro photo-total-protein"><span>${t('photoProtein')}</span><strong><span data-photo-total="protein">0.0</span><small>g</small></strong></div>
        <div class="photo-total-macro photo-total-fat"><span>${t('photoFat')}</span><strong><span data-photo-total="fat">0.0</span><small>g</small></strong></div>
      </div>
      <p class="photo-result-note">${escapeHtml(result.overallNote || t('photoOverallNote'))}</p>
    </section>
    <details class="photo-breakdown">
      <summary><span class="photo-breakdown-copy"><strong>${t('photoBreakdown')}</strong><small>${items.length} ${t('photoBreakdownCount')}</small></span><span class="photo-breakdown-chevron" aria-hidden="true"><svg class="ui-icon" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></span></summary>
      <div class="photo-breakdown-items">${breakdown}</div>
    </details>`
    : '';
  DOM.photoResults.oninput = event => {
    if (event.target.matches('[data-photo-field]')) updatePhotoMealTotals();
  };
  updatePhotoMealTotals();
  DOM.photoSaveButton.classList.toggle('hidden', !items.length);
}

const MEMBERSHIP_PLANS = { membership_monthly: { amount: 8.99 }, membership_annual: { amount: 89.99 } };
const playProducts = {};
let selectedMembershipPlan = 'membership_annual';
let membershipPurchasePending = false;
let membershipPendingTimer = null;
let membershipStatusTimer = null;

function formatMoney(amount, currency = 'EUR') {
  try {
    return new Intl.NumberFormat(locale(), { style: 'currency', currency }).format(amount);
  } catch {
    return `€${Number(amount).toFixed(2)}`;
  }
}
function planPrice(productId) {
  return playProducts[productId]?.formattedPrice || formatMoney(MEMBERSHIP_PLANS[productId].amount);
}
function annualMonthlyPrice() {
  const product = playProducts.membership_annual;
  if (product?.priceMicros > 0 && product.currency) return formatMoney(product.priceMicros / 1e6 / 12, product.currency);
  return formatMoney(MEMBERSHIP_PLANS.membership_annual.amount / 12);
}
function getMembership() {
  const session = getSession();
  const until = Number(session?.membershipUntil) || 0;
  return { active: session?.mode === 'account' && until > Date.now(), until, product: session?.membershipProduct || '' };
}
function updateAccountState(user) {
  const session = getSession();
  if (session?.mode !== 'account' || !user) return;
  const next = { ...session };
  if (user.credits !== undefined && Number.isFinite(Number(user.credits))) next.credits = Number(user.credits);
  if ('membershipUntil' in user) next.membershipUntil = Number(user.membershipUntil) || 0;
  if ('membershipProduct' in user) next.membershipProduct = user.membershipProduct || '';
  writeJSON('debo-session', next);
  renderMembership();
}
function setMembershipStatus(text, isError = false) {
  const el = $('#membership-status');
  if (!el) return;
  clearTimeout(membershipStatusTimer);
  el.textContent = text || '';
  el.classList.toggle('error', !!isError);
}
function setMembershipPending(pending) {
  membershipPurchasePending = pending;
  clearTimeout(membershipPendingTimer);
  if (pending) membershipPendingTimer = setTimeout(() => setMembershipPending(false), 8000);
  renderMembership();
}
function renderMembership() {
  const session = getSession();
  const signedIn = session?.mode === 'account' && !!session.token;
  const { active, until, product } = getMembership();
  const planName = t(product === 'membership_monthly' ? 'membershipMonthlyName' : 'membershipAnnualName');
  const untilText = t('membershipUntil').replace('{date}', until ? formatDateOnly(until) : '—');
  const promoText = t('membershipProfileLead').replace('{price}', planPrice('membership_monthly'));
  $$('[data-plan-price]').forEach(el => (el.textContent = planPrice(el.dataset.planPrice)));
  const hint = $('#membership-annual-hint');
  if (hint) hint.textContent = t('membershipAnnualHint').replace('{price}', annualMonthlyPrice());
  $$('[data-membership-plan]').forEach(button =>
    button.setAttribute('aria-checked', String(button.dataset.membershipPlan === selectedMembershipPlan))
  );
  $('#membership-offer')?.classList.toggle('hidden', active);
  $('#membership-active')?.classList.toggle('hidden', !active);
  $('#membership-signin')?.classList.toggle('hidden', signedIn);
  $('#membership-restore')?.classList.toggle('hidden', !signedIn);
  const cta = $('#membership-cta');
  if (cta) {
    cta.textContent = signedIn
      ? t(selectedMembershipPlan === 'membership_annual' ? 'membershipCtaAnnual' : 'membershipCtaMonthly').replace(
          '{price}',
          planPrice(selectedMembershipPlan)
        )
      : t('membershipSignInCta');
    cta.disabled = membershipPurchasePending;
  }
  const activePlan = $('#membership-active-plan');
  if (activePlan) activePlan.textContent = planName;
  const activeUntil = $('#membership-active-until');
  if (activeUntil) activeUntil.textContent = untilText;
  const card = $('#profile-membership');
  if (card) {
    card.classList.toggle('active', active);
    $('#profile-membership-title').textContent = t(active ? 'membershipActive' : 'membership');
    $('#profile-membership-lead').textContent = active ? `${planName} · ${untilText}` : promoText;
  }
  $('#photo-credit-box')?.classList.toggle('is-member', active);
  $('#photo-member-chip')?.classList.toggle('hidden', !active);
  const photoLead = $('#photo-membership-lead');
  if (photoLead) photoLead.textContent = promoText;
  const note = $('.photo-credit-note');
  if (note) note.textContent = signedIn ? '' : t('photoCreditSignIn');
  DOM.profileButton?.classList.toggle('is-member', active);
  $('#food-label')?.classList.toggle('is-member', active);
}
function openMembership() {
  const modal = $('#membership-modal');
  if (!modal || !PREMIUM) return;
  if (DOM.profileModal.open) DOM.profileModal.close();
  setMembershipStatus('');
  renderMembership();
  if (!modal.open) modal.showModal();
  requestCreditProducts();
}
function closeMembershipForAuth() {
  $('#membership-modal')?.close();
  DOM.photoModal?.close();
  showAuthScreen();
}
function startMembershipPurchase() {
  const session = getSession();
  if (session?.mode !== 'account' || !session.token) return closeMembershipForAuth();
  if (getMembership().active) return renderMembership();
  if (!window.AndroidBilling?.purchase) return setMembershipStatus(t('photoBillingUnavailable'), true);
  setMembershipStatus('');
  setMembershipPending(true);
  window.AndroidBilling.purchase(selectedMembershipPlan, session.userId || '');
}
function restoreMembership() {
  const session = getSession();
  if (session?.mode !== 'account' || !session.token) return closeMembershipForAuth();
  setMembershipStatus(t('membershipRestoring'));
  requestCreditProducts();
  membershipStatusTimer = setTimeout(() => setMembershipStatus(''), 6000);
}
function manageMembership() {
  const { product } = getMembership();
  if (window.AndroidBilling?.manageSubscription) return window.AndroidBilling.manageSubscription(product || '');
  window.open('https://play.google.com/store/account/subscriptions', '_blank', 'noopener');
}
function bindMembershipEvents() {
  $('#close-membership')?.addEventListener('click', () => $('#membership-modal').close());
  $$('[data-membership-plan]').forEach(button =>
    button.addEventListener('click', () => {
      selectedMembershipPlan = button.dataset.membershipPlan;
      setMembershipStatus('');
      renderMembership();
    })
  );
  $('.membership-plans')?.addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const plans = $$('[data-membership-plan]');
    const index = plans.findIndex(button => button.dataset.membershipPlan === selectedMembershipPlan);
    const next = plans[(index + (['ArrowUp', 'ArrowLeft'].includes(event.key) ? plans.length - 1 : 1)) % plans.length];
    selectedMembershipPlan = next.dataset.membershipPlan;
    renderMembership();
    next.focus();
  });
  $('#membership-cta')?.addEventListener('click', startMembershipPurchase);
  $('#membership-restore')?.addEventListener('click', restoreMembership);
  $('#membership-manage')?.addEventListener('click', manageMembership);
  $('#photo-membership-promo')?.addEventListener('click', openMembership);
  $('#profile-membership')?.addEventListener('click', openMembership);
}

function setPhotoCredits(value) {
  const el = $('#photo-credit-balance');
  const number = value === null || value === undefined || value === '' ? NaN : Number(value);
  if (el) el.textContent = Number.isFinite(number) ? String(Math.max(0, number)) : '—';
  renderMembership();
}
async function refreshPhotoCredits() {
  if (!PREMIUM) return;
  const session = getSession();
  if (session?.mode !== 'account' || !session.token) {
    setPhotoCredits(null);
    return;
  }
  try {
    const result = await mealApi('/api/auth/balance', { method: 'POST', token: session.token, body: '{}' });
    updateAccountState(result);
    setPhotoCredits(result.credits);
  } catch (error) {
    console.warn('Credit balance unavailable:', error.message);
  }
}
function requestCreditProducts() {
  if (!PREMIUM) return;
  const session = getSession();
  if (!session?.token) {
    setPhotoCredits(null);
    return;
  }
  if (window.AndroidBilling?.loadProducts) window.AndroidBilling.loadProducts(session.userId || '');
  refreshPhotoCredits();
}
window.onPlayProducts = function (raw) {
  try {
    const products = JSON.parse(raw);
    for (const item of products) {
      playProducts[item.productId] = item;
    }
    renderMembership();
  } catch (error) {
    console.warn('Could not read Play product list:', error);
  }
};
window.onPlayPurchase = function (raw) {
  if (!PREMIUM) return;
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return;
  }
  const membershipOpen = () => !!$('#membership-modal')?.open;
  const notify = (text, isError = false) => {
    if (event.restored) return;
    if (membershipOpen()) setMembershipStatus(text, isError);
    else if (DOM.photoModal?.open) DOM.photoStatus.textContent = text;
    else toast(text);
  };
  if (!event.restored) setMembershipPending(false);
  if (event.cancelled) return;
  // Native billing errors are written in Lithuanian; other languages get a translated generic message
  if (event.error) return notify(language === 'lt' ? event.error : t('purchaseFailed'), true);
  if (!event.subscription) return;
  if (event.state === 'pending') return notify(t('photoPurchasePending'));
  const session = getSession();
  if (!session?.token) return notify(t('photoCreditLoginRequired'), true);
  if (event.subscription && !event.restored && membershipOpen()) setMembershipStatus(t('membershipProcessing'));
  mealApi('/api/purchase/verify', {
    method: 'POST',
    token: session.token,
    body: JSON.stringify({ productId: event.productId, purchaseToken: event.purchaseToken })
  })
    .then(result => {
      updateAccountState(result);
      setPhotoCredits(result.credits);
      if (!event.acknowledged) window.AndroidBilling?.acknowledge?.(event.purchaseToken);
      if (!event.restored && result.member) {
        setMembershipStatus('');
        toast(t('membershipDone'));
      }
    })
    .catch(error => notify(serverText(error, 'purchaseFailed'), true));
};

async function analyzeMealPhoto() {
  const file = selectedMealPhotoFile;
  if (!file) {
    DOM.photoStatus.textContent = t('photoPickFirst');
    return;
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) {
    DOM.photoStatus.textContent =
      t('photoTypeError');
    return;
  }
  const base = (window.DEBO_CONFIG?.mealAnalysisApiBaseUrl || '').trim().replace(/\/$/, '');
  if (!base) {
    DOM.photoStatus.textContent = t('photoApiMissing');
    return;
  }
  const session = getSession();
  if (session?.mode !== 'account' || !session.token) {
    DOM.photoStatus.textContent = t('photoCreditLoginRequired');
    return;
  }
  DOM.photoAnalyzeButton.disabled = true;
  DOM.photoStatus.textContent = t('photoWorking');
  DOM.photoResults.replaceChildren();
  DOM.photoSaveButton.classList.add('hidden');
  try {
    const imageDataUrl = await readMealPhoto(file);
    const payload = await mealApi('/api/analyze-meal', {
      method: 'POST',
      token: session.token,
      body: JSON.stringify({ imageDataUrl, language })
    });
    if (Number.isFinite(payload.credits)) setPhotoCredits(payload.credits);
    if (!payload.requiresConfirmation || !Array.isArray(payload.items)) throw new Error('invalid-response');
    renderMealEstimate(payload);
    DOM.photoStatus.textContent = payload.items.length ? '' : t('photoNoFood');
  } catch (error) {
    console.warn('Photo analysis failed:', error);
    if (error.status === 402) openMembership();
    DOM.photoStatus.textContent =
      error.status === 402
        ? t('photoCreditLow')
        : serverText(error, 'photoFailed');
  } finally {
    DOM.photoAnalyzeButton.disabled = false;
  }
}

function saveMealPhotoEstimate(event) {
  event?.preventDefault();
  if (!photoMealEstimate?.items?.length) return;
  const cards = [...DOM.photoResults.querySelectorAll('[data-photo-item]')];
  const entries = cards.map((card, index) => {
    const item = photoMealEstimate.items[index],
      value = field => parseNumber(card.querySelector(`[data-photo-field="${field}"]`).value);
    const giRaw = card.querySelector('[data-photo-field="glycemicIndex"]').value.trim();
    const gi = giRaw === '' ? null : parseNumber(giRaw);
    return {
      ...item,
      estimatedGrams: value('estimatedGrams'),
      carbohydratesG: value('carbohydratesG'),
      proteinG: value('proteinG'),
      fatG: value('fatG'),
      glycemicIndex: gi
    };
  });
  if (
    entries.some(
      x =>
        ['estimatedGrams', 'carbohydratesG', 'proteinG', 'fatG'].some(k => !Number.isFinite(x[k]) || x[k] < 0) ||
        (x.glycemicIndex !== null && (!Number.isInteger(x.glycemicIndex) || x.glycemicIndex < 0 || x.glycemicIndex > 100))
    )
  ) {
    toast(t('photoCheckValues'));
    return;
  }
  const timestamp = Date.now();
  const totals = entries.reduce(
    (sum, item) => ({
      amount: sum.amount + item.estimatedGrams,
      carbs: sum.carbs + item.carbohydratesG,
      protein: sum.protein + item.proteinG,
      fat: sum.fat + item.fatG
    }),
    { amount: 0, carbs: 0, protein: 0, fat: 0 }
  );
  foodLog.push({
    id: createId('food-photo-meal'),
    name: t('photoMealName'),
    nameLt: language === 'lt' ? t('photoMealName') : '',
    nameEn: language === 'en' ? t('photoMealName') : '',
    ...totals,
    unit: 'g',
    gi: null,
    aiEstimate: true,
    mealType: $('#photo-meal-type')?.value || 'snack',
    timestamp,
    components: entries.map(item => ({
      name: item.name,
      amount: item.estimatedGrams,
      unit: 'g',
      carbs: item.carbohydratesG,
      protein: item.proteinG,
      fat: item.fatG,
      gi: item.glycemicIndex
    }))
  });
  writeJSON('debo-food-log', foodLog);
  schedulePostMealReminder();
  renderHistory();
  DOM.photoModal.close();
  photoMealEstimate = null;
  selectedMealPhotoFile = null;
  DOM.photoCameraInput.value = '';
  DOM.photoGalleryInput.value = '';
  DOM.photoPreview.classList.add('hidden');
  DOM.photoResults.replaceChildren();
  toast(t('photoSaveDone'));
}

function getTodayInsulinDoses() {
  const start = startOfDay(Date.now()),
    now = Date.now();
  return insulinLog.filter(x => x.timestamp >= start && x.timestamp <= now);
}

function renderActiveInsulin() {
  const doses = getTodayInsulinDoses();
  if (!doses.length) {
    DOM.activeDoseMain.textContent = t('noActiveDoseDescription');
    DOM.activeDoseSub.textContent = '';
    DOM.noActiveDose.classList.add('hidden');
    DOM.multiActivity.classList.add('hidden');
    DOM.toggleActiveDoses.classList.add('hidden');
    DOM.reminderStatus.textContent = renderReminderText();
    return;
  }
  const newest = [...doses].sort((a, b) => b.timestamp - a.timestamp);
  const unit = t('unitU');
  const total = doses.reduce((sum, x) => sum + Number(x.amount || 0), 0);
  DOM.activeDoseMain.textContent = `${decimal(total, 1)} ${unit}`;
  DOM.activeDoseSub.textContent =
    language === 'en' && doses.length === 1 ? 'Today · 1 dose' : t('dosesToday').replace('{n}', doses.length);
  DOM.noActiveDose.classList.add('hidden');
  DOM.multiActivity.classList.remove('hidden');
  const visible = showAllActiveDoses ? newest : newest.slice(0, 3);
  DOM.activeDoseList.innerHTML = visible
    .map(
      d => `
          <div class="active-dose-row">

            <div class="active-dose-row-left">

              <div>

                <strong>
                  ${decimal(d.amount, 1)}
                  ${unit}
                  ·
                  ${escapeHtml(d.name)}
                </strong>

                <small>
                  ${t(d.type === 'rapid' ? 'rapid' : 'long')}
                </small>

              </div>

            </div>

            <span class="active-dose-time">
              ${formatClock(d.timestamp)}
            </span>

          </div>
        `
    )
    .join('');
  if (newest.length > 3) {
    DOM.toggleActiveDoses.classList.remove('hidden');
    DOM.toggleActiveDoses.textContent = showAllActiveDoses ? t('showLess') : `${t('seeMore')} (${newest.length - 3})`;
  } else {
    DOM.toggleActiveDoses.classList.add('hidden');
    showAllActiveDoses = false;
  }
  DOM.reminderStatus.textContent = renderReminderText();
}

function getSelectedInsulin(type) {
  const s = getSettings();
  const name = type === 'rapid' ? s.rapid || DOM.rapidSelect.value : s.long || DOM.longSelect.value;
  return insulinDatabase[type].find(x => x.name === name) || insulinDatabase[type][0];
}

function syncInsulinEntryTherapy() {
  const pump = getSettings().therapy === 'pump';
  DOM.insulinType.disabled = pump;
  if (pump) {
    DOM.insulinType.value = 'rapid';
  }
  DOM.pumpInsulinNote.classList.toggle('hidden', !pump);
  DOM.pumpInsulinNote.textContent = t('pumpInsulinNote');
}

function entryTimestamp(timeValue) {
  const ts = timeInputToTodayTimestamp(timeValue);
  if (!Number.isFinite(ts)) return NaN;
  return ts > Date.now() + 120000 ? ts - 86400000 : ts;
}

function saveInsulinEntry(amount) {
  const s = getSettings();
  let type = DOM.insulinType.value;
  if (s.therapy === 'pump') {
    type = 'rapid';
  }
  const insulin = getSelectedInsulin(type);
  const ts = entryTimestamp(DOM.insulinTime.value);
  if (!Number.isFinite(ts)) {
    toast(t('chooseTime'));
    return false;
  }
  insulinLog.push({
    id: createId('insulin'),
    amount,
    type,
    name: insulin.name,
    timestamp: ts,
    ...entryExtras()
  });
  insulinLog.sort((a, b) => a.timestamp - b.timestamp);
  writeJSON('debo-insulin-log', insulinLog);
  chartShouldScrollToLatest = true;
  showAllActiveDoses = false;
  renderActiveInsulin();
  renderTimelineGraph();
  renderHistory();
  return true;
}

function openEntry(mode) {
  entryMode = mode;
  const kicker = tx('NEW ENTRY', 'NAUJAS ĮRAŠAS'),
    example = tx('e.g.', 'pvz.:');
  const cfg = {
    glucose: {
      k: kicker,
      title: tx('Glucose', 'Gliukozė'),
      desc: tx('Value and time measured.', 'Rodmuo ir matavimo laikas.'),
      label: `${tx('Glucose', 'Gliukozė')} (${glucoseUnitText()})`,
      ph: `${example} ${getGlucoseUnit() === 'mg' ? '108' : decimal(6, 1)}`
    },
    insulin: {
      k: kicker,
      title: tx('Insulin dose', 'Insulino dozė'),
      desc: tx('Dose and injection time.', 'Dozė ir suleidimo laikas.'),
      label: `${tx('Insulin', 'Insulinas')} (${t('unitU')})`,
      ph: `${example} 2`
    },
    food: {
      k: kicker,
      title: tx('Food', 'Maistas'),
      desc: tx('Find or add a food.', 'Raskite arba įveskite produktą.'),
      label: '',
      ph: ''
    }
  }[mode];
  DOM.modalKicker.textContent = cfg.k;
  DOM.modalTitle.textContent = cfg.title;
  DOM.modalDescription.textContent = cfg.desc;
  DOM.amountLabelText.textContent = cfg.label;
  DOM.entryAmount.placeholder = cfg.ph;
  DOM.entryAmount.value = '';
  DOM.amountLabel.classList.toggle('hidden', mode === 'food');
  DOM.typeLabel.classList.toggle('hidden', mode !== 'insulin');
  DOM.insulinTimeLabel.classList.toggle('hidden', mode !== 'insulin');
  DOM.glucoseTimeLabel.classList.toggle('hidden', mode !== 'glucose');
  DOM.foodLabel.classList.toggle('hidden', mode !== 'food');
  // Glucose is entered with its time only: no ketones or note
  $('#ketone-label').classList.add('hidden');
  $('#entry-modal .entry-note-label')?.classList.toggle('hidden', mode === 'glucose');
  $('#ketone-amount').value = '';
  $('#entry-note').value = '';
  if (mode === 'glucose') {
    DOM.glucoseEntryTime.value = currentTimeInputValue();
  }
  if (mode === 'insulin') {
    DOM.insulinTime.value = currentTimeInputValue();
    syncInsulinEntryTherapy();
  }
  if (mode === 'food') {
    DOM.foodProduct.value = '';
    DOM.foodGrams.value = '';
    DOM.customFoodName.value = '';
    DOM.customFoodCarbs.value = '';
    DOM.customFoodProtein.value = '';
    DOM.customFoodFat.value = '';
    DOM.foodModeStatus.classList.add('hidden');
    DOM.foodBarcodeManual.classList.add('hidden');
    const search = $('#food-search-input');
    if (search) search.value = '';
    renderFoodSearch();
    setFoodEntryMode('');
    $('#food-time').value = currentTimeInputValue();
    mealTypeChosen = false;
    setMealType(defaultMealType());
    updateFoodPortions();
  }
  if (mode === 'insulin' && getSettings().therapy !== 'pump') {
    const lastType = insulinLog.at(-1)?.type;
    if (lastType === 'rapid' || lastType === 'long') DOM.insulinType.value = lastType;
  }
  DOM.entryModal.showModal();
  if (mode === 'food') renderFoodSearch();
  else setTimeout(() => DOM.entryAmount.focus(), 80);
}

function saveEntry() {
  if (entryMode === 'food') {
    return saveFoodEntry();
  }
  let value = parseNumber(DOM.entryAmount.value);
  if (!Number.isFinite(value) || value <= 0) {
    toast(t('enterValidValue'));
    return false;
  }
  if (entryMode === 'glucose') {
    if (!DOM.glucoseEntryTime.value) {
      toast(t('enterValidValue'));
      return false;
    }
    if (getGlucoseUnit() === 'mg') {
      value = mgToMmol(value);
    }
    if (value < 1 || value > 35) {
      toast(t('glucoseOutOfRange'));
      return false;
    }
    const readingTime = entryTimestamp(DOM.glucoseEntryTime.value);
    if (!Number.isFinite(readingTime)) {
      toast(t('chooseTime'));
      return false;
    }
    const ketonesText = $('#ketone-amount').value.trim();
    const ketones = parseNumber(ketonesText);
    if (ketonesText && !(ketones >= 0 && ketones <= 10)) {
      toast(t('ketonesInvalid'));
      return false;
    }
    recordGlucose(value, readingTime, { ...entryExtras(), ...(ketonesText ? { ketones } : {}) });
    return true;
  }
  if (value > 100) {
    toast(t('insulinTooHigh'));
    return false;
  }
  return saveInsulinEntry(value);
}

function renderProfile() {
  const p = readJSON('debo-profile', {});
  const s = getSettings();
  const session = getSession();
  const initial = (p.name || session?.name || 'B').charAt(0).toUpperCase();
  const photo = p.photo || '';
  const canRename = nameCanChange(p);
  const nextRename = nextNameChangeDate(p);
  pendingProfilePhoto = null;
  DOM.profileName.value = p.name || session?.name || '';
  DOM.profileName.disabled = !canRename && !!p.name;
  if (DOM.profileNameNote) {
    DOM.profileNameNote.textContent = canRename ? '' : `${t('nameChangeLocked')} ${formatDateOnly(nextRename)}`;
    DOM.profileNameNote.classList.toggle('locked', !canRename);
  }
  if (DOM.profileAvatar) {
    DOM.profileAvatar.textContent = initial;
    DOM.profileAvatar.style.backgroundImage = photo ? `url(${JSON.stringify(photo).slice(1, -1)})` : '';
    DOM.profileAvatar.classList.toggle('has-photo', !!photo);
  }
  const homeName = $('#home-user-name');
  if (homeName) homeName.textContent = p.name || session?.name || 'Debo';
  DOM.profileButton.textContent = photo ? '' : initial;
  DOM.profileButton.style.backgroundImage = photo ? `url(${JSON.stringify(photo).slice(1, -1)})` : '';
  DOM.profileButton.style.backgroundSize = photo ? 'cover' : '';
  DOM.profileButton.style.backgroundPosition = photo ? 'center' : '';
  const isAccount = session?.mode === 'account';
  DOM.accountSummary.innerHTML = isAccount
    ? `<strong>${t('signedInAccount')}</strong><br>${escapeHtml(session.email || '—')}`
    : ACCOUNTS
      ? `<strong>${t('guestAccount')}</strong><br>${t(PREMIUM ? 'guestAccountNote' : 'guestStorageNote')}`
      : t('guestStorageNote');
  DOM.profileCreateAccount.classList.toggle('hidden', isAccount);
  DOM.profileAccountFields?.classList.toggle('hidden', !isAccount);
  DOM.profilePasswordDetails?.classList.toggle('hidden', !isAccount || session?.provider === 'google');
  $('#profile-delete-account')?.classList.toggle('hidden', !isAccount);
  if (DOM.profileEmail) DOM.profileEmail.value = isAccount ? session.email || getLocalAccount()?.email || '' : '';
  if (DOM.profileCurrentPassword) DOM.profileCurrentPassword.value = '';
  if (DOM.profileNewPassword) DOM.profileNewPassword.value = '';
  if (DOM.profileNewPasswordRepeat) DOM.profileNewPasswordRepeat.value = '';
  if (DOM.profilePasswordDetails) DOM.profilePasswordDetails.open = false;
  renderMembership();
}

async function processProfilePhoto(file) {
  if (!file) return null;
  if (!file.type.startsWith('image/')) throw new Error('invalid-image');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const size = 256,
      canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const scale = Math.max(size / img.width, size / img.height);
    const w = img.width * scale,
      h = img.height * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function saveProfile() {
  const session = getSession();
  const current = readJSON('debo-profile', {});
  const nextName = DOM.profileName.value.trim();
  const nameChanged = nextName && nextName !== (current.name || '');
  if (!nextName) return toast(t('nameRequired'));
  if (nameChanged && !nameCanChange(current)) return toast(`${t('nameChangeLocked')} ${formatDateOnly(nextNameChangeDate(current))}`);
  const newPassword = DOM.profileNewPassword?.value || '';
  if (session?.mode === 'account' && newPassword) {
    if (newPassword.length < 8) return toast(t('passwordTooShort'));
    if (newPassword !== DOM.profileNewPasswordRepeat.value) return toast(t('passwordMismatch'));
    if (!DOM.profileCurrentPassword.value) return toast(t('currentPasswordWrong'));
    const button = $('#save-profile');
    button.disabled = true;
    try {
      const changed = await mealApi('/api/auth/password', {
        method: 'POST',
        token: session.token,
        body: JSON.stringify({ currentPassword: DOM.profileCurrentPassword.value, newPassword })
      });
      if (changed?.token) {
        session.token = changed.token;
        writeJSON('debo-session', { ...(getSession() || session), token: changed.token });
      }
      toast(t('passwordChanged'));
    } catch (error) {
      button.disabled = false;
      return toast(error.status === 403 ? t('currentPasswordWrong') : authErrorMessage(error));
    }
    button.disabled = false;
  }
  if (session) writeJSON('debo-session', { ...session, name: nextName });
  const nextProfile = { ...current, name: nextName };
  if (nameChanged) nextProfile.nameChangedAt = Date.now();
  if (pendingProfilePhoto) nextProfile.photo = pendingProfilePhoto;
  writeJSON('debo-profile', nextProfile);
  renderProfile();
  DOM.profileModal.close();
  toastSaved();
}

const LOCAL_DATA_KEYS = [
  'debo-glucose-history',
  'debo-insulin-log',
  'debo-food-log',
  'debo-favorite-meals',
  'debo-custom-reminders',
  'debo-care-log',
  'debo-exercise-log',
  'debo-care-settings',
  'debo-supplies',
  'debo-profile',
  'gluco-insulin-setup',
  'debo-carb-ratios',
  'debo-hypo-session',
  'debo-hyper-session',
  'debo-hypo-source',
  'debo-last-glucose-reminder',
  'debo-health-sync',
  'debo-post-meal-at',
  'debo-hypo-timer'
];

function openDeleteAccount() {
  const modal = $('#confirm-delete-account');
  if (DOM.profileModal.open) DOM.profileModal.close();
  $('#delete-local-data').checked = false;
  $('#delete-account-error').classList.add('hidden');
  modal.showModal();
}

async function confirmDeleteAccount() {
  const session = getSession();
  if (session?.mode !== 'account') return;
  const button = $('#delete-account-confirm');
  const errorBox = $('#delete-account-error');
  button.disabled = true;
  errorBox.classList.add('hidden');
  try {
    await mealApi('/api/auth/delete', { method: 'POST', token: session.token, body: '{}' });
  } catch (error) {
    button.disabled = false;
    if (error.status === 401) return;
    errorBox.textContent = authErrorMessage(error);
    errorBox.classList.remove('hidden');
    return;
  }
  button.disabled = false;
  try {
    window.AndroidReminders?.cancel?.(GLUCOSE_REMINDER_ID);
    window.AndroidReminders?.cancel?.(LONG_REMINDER_ID);
  } catch {}
  if ($('#delete-local-data').checked) {
    LOCAL_DATA_KEYS.forEach(key => localStorage.removeItem(key));
    clearLogs();
    glucoseHistory = [];
    insulinLog = [];
    foodLog = [];
  }
  localStorage.removeItem('debo-last-email');
  $('#confirm-delete-account').close();
  logout();
  toast(t('accountDeleted'));
  if ($('#delete-local-data').checked) setTimeout(() => flushLogs().finally(() => location.reload()), 900);
}

function logout() {
  localStorage.removeItem('debo-session');
  pushWidgetState();
  if (typeof configureBackgroundSync === 'function') configureBackgroundSync();
  pendingProfilePhoto = null;
  DOM.profileModal.close();
  DOM.setupModal?.close();
  DOM.guideModal?.close();
  showView('home');
  openAuthMode('choice');
  DOM.authScreen.classList.remove('hidden');
}

// Two linked fields: typing in one updates the other
const CONVERTER_PRESETS = [3.9, 5.5, 7.8, 10, 13.9];
function updateConverter(from = 'mmol') {
  const source = from === 'mmol' ? DOM.converterMmol : DOM.converterMg;
  const target = from === 'mmol' ? DOM.converterMg : DOM.converterMmol;
  const value = parseNumber(source.value);
  target.value = Number.isFinite(value) && value > 0 ? (from === 'mmol' ? String(Math.round(mmolToMg(value))) : decimal(mgToMmol(value), 1)) : '';
  DOM.converterPresets.innerHTML = CONVERTER_PRESETS.map(
    v => `<button class="conv-preset" type="button" data-conv="${v}"><b>${decimal(v, 1)}</b><small>${Math.round(mmolToMg(v))}</small></button>`
  ).join('');
}

function insulinLabel(insulin) {
  if (['human', 'nph'].includes(insulin.substance)) return insulin.name;
  const substance = t('insulinSubstance_' + insulin.substance);
  const firstWord = substance.split(' ')[0].toLocaleLowerCase();
  const english = String(insulin.substance).toLocaleLowerCase();
  const name = insulin.name.toLocaleLowerCase();
  return name.includes(english) || name.includes(firstWord) ? insulin.name : `${insulin.name} (${substance})`;
}

function insulinOptions(list, current) {
  const visible = list.filter(x => !x.hidden || x.name === current);
  const groups = [...new Set(visible.map(x => x.group))];
  return groups
    .map(
      group =>
        `<optgroup label="${escapeHtml(t('insulinGroup_' + group))}">${visible
          .filter(x => x.group === group)
          .map(x => `<option value="${escapeHtml(x.name)}">${escapeHtml(insulinLabel(x))}</option>`)
          .join('')}</optgroup>`
    )
    .join('');
}

function populateInsulinSelects() {
  const s = getSettings();
  const rapid = DOM.rapidSelect.value || s.rapid,
    long = DOM.longSelect.value || s.long;
  DOM.rapidSelect.innerHTML = insulinOptions(insulinDatabase.rapid, rapid);
  DOM.longSelect.innerHTML = insulinOptions(insulinDatabase.long, long);
  if (rapid) DOM.rapidSelect.value = rapid;
  if (long) DOM.longSelect.value = long;
}

function loadStoredSetup() {
  const s = getSettings();
  if (!Object.keys(s).length) {
    return null;
  }
  const radio = $(`input[name="therapy"][value="${s.therapy}"]`);
  if (radio) {
    radio.checked = true;
  }
  if (s.rapid) {
    DOM.rapidSelect.value = s.rapid;
  }
  if (s.long) {
    DOM.longSelect.value = s.long;
  }
  DOM.profileAge.value = s.age || '';
  DOM.reminderEnabled.checked = !!s.reminderEnabled;
  DOM.reminderTime.value = s.reminderTime || '22:00';
  DOM.glucoseReminderEnabled.checked = !!s.glucoseReminderEnabled;
  if ($('#post-meal-reminder')) $('#post-meal-reminder').checked = !!s.postMealReminder;
  $('#weekly-summary').checked = !!s.weeklySummary;
  DOM.glucoseUnitSelect.value = s.glucoseUnit || 'mmol';
  if (LANGUAGES.includes(s.language)) {
    language = s.language;
  }
  DOM.settingsLanguage.value = language;
  DOM.themeSelect.value = ['light', 'dark', 'system'].includes(s.theme) ? s.theme : getThemePreference();
  return s;
}

function setTherapyUi() {
  const pump = ($('input[name="therapy"]:checked')?.value || 'injections') === 'pump';
  DOM.longField.classList.toggle('hidden', pump);
  DOM.reminderField.classList.toggle('hidden', pump);
  DOM.reminderTimeWrap.classList.toggle('hidden', pump || !DOM.reminderEnabled.checked);
  DOM.therapyNote.textContent = pump ? t('pumpSummary') : t('penSummary');
  syncInsulinEntryTherapy();
}

const GLUCOSE_REMINDER_ID = 4116,
  LONG_REMINDER_ID = 4117,
  TWO_HOURS = 7200000,
  ONE_DAY = 86400000;
// Night pause for the 2-hourly glucose reminder, in minutes after midnight (on by default, 22:00–07:00)
const minutesOfTime = value => {
  const [h, m] = String(value || '').split(':').map(Number);
  return Number.isInteger(h) && h >= 0 && h < 24 ? h * 60 + (Number.isInteger(m) ? m : 0) : null;
};
function glucoseQuietWindow(s = getSettings()) {
  if (s.glucoseQuiet === false) return null;
  const from = minutesOfTime(s.quietFrom || '22:00'),
    to = minutesOfTime(s.quietTo || '07:00');
  return from === null || to === null || from === to ? null : { from, to };
}
function inQuietWindow(ts, quiet) {
  if (!quiet) return false;
  const d = new Date(ts),
    minute = d.getHours() * 60 + d.getMinutes();
  return quiet.from < quiet.to ? minute >= quiet.from && minute < quiet.to : minute >= quiet.from || minute < quiet.to;
}
function quietWindowEnd(ts, quiet) {
  const end = new Date(ts);
  end.setHours(Math.floor(quiet.to / 60), quiet.to % 60, 0, 0);
  if (end.getTime() <= ts) end.setDate(end.getDate() + 1);
  return end.getTime();
}

function syncNativeReminders() {
  const native = window.AndroidReminders;
  if (!native?.scheduleRepeating) return false;
  const s = getSettings();
  try {
    if (s.glucoseReminderEnabled) {
      const last = glucoseHistory.at(-1)?.timestamp || Date.now();
      let first = last + TWO_HOURS;
      while (first <= Date.now()) first += TWO_HOURS;
      const quiet = glucoseQuietWindow(s);
      if (inQuietWindow(first, quiet)) first = quietWindowEnd(first, quiet);
      // Older app builds without the night-pause bridge get the plain repeating reminder
      if (quiet && native.scheduleRepeatingQuiet)
        native.scheduleRepeatingQuiet(GLUCOSE_REMINDER_ID, first, TWO_HOURS, t('reminderGlucoseTitle'), t('reminderGlucoseBody'), quiet.from, quiet.to);
      else native.scheduleRepeating(GLUCOSE_REMINDER_ID, first, TWO_HOURS, t('reminderGlucoseTitle'), t('reminderGlucoseBody'));
    } else native.cancel(GLUCOSE_REMINDER_ID);
    if (s.therapy !== 'pump' && s.reminderEnabled) {
      const [hours, minutes] = String(s.reminderTime || '22:00')
        .split(':')
        .map(Number);
      const next = new Date();
      next.setHours(hours || 0, minutes || 0, 0, 0);
      if (next.getTime() <= Date.now()) next.setTime(next.getTime() + ONE_DAY);
      const weekly = insulinDatabase.long.find(x => x.name === s.long)?.weekly;
      native.scheduleRepeating(
        LONG_REMINDER_ID,
        next.getTime(),
        weekly ? ONE_DAY * 7 : ONE_DAY,
        t('reminderLongTitle'),
        t('reminderLongBody')
      );
    } else native.cancel(LONG_REMINDER_ID);
  } catch {}
  return true;
}

const POST_MEAL_REMINDER_ID = 4120;
const POST_MEAL_KEY = 'debo-post-meal-at';
// Two hours after the meal itself: a meal logged later still reminds on time, and one logged
// more than two hours late does not remind at all
function schedulePostMealReminder(mealAt = Date.now()) {
  const native = window.AndroidReminders;
  if (!native?.schedule || !getSettings().postMealReminder) return;
  if (getHealthState().enabled && healthStatus() === 'granted') return;
  const at = mealAt + TWO_HOURS;
  if (at <= Date.now() + 60000) return;
  try {
    native.schedule(POST_MEAL_REMINDER_ID, at, t('reminderPostMealTitle'), t('reminderPostMealBody'));
    localStorage.setItem(POST_MEAL_KEY, String(at));
  } catch {}
}
function cancelPostMealIfChecked(timestamp) {
  const at = Number(localStorage.getItem(POST_MEAL_KEY) || 0);
  if (!at || timestamp < at - 45 * 60000) return;
  try {
    window.AndroidReminders?.cancel(POST_MEAL_REMINDER_ID);
  } catch {}
  localStorage.removeItem(POST_MEAL_KEY);
}

function updateNotificationNote() {
  DOM.notificationNote.textContent = window.AndroidReminders?.scheduleRepeating
    ? t('notificationNative')
    : 'Notification' in window
      ? t('notificationOpenOnly')
      : t('notificationUnsupported');
}

async function configureGlucoseReminder(enabled) {
  if (syncNativeReminders()) return;
  clearInterval(notificationTimer);
  notificationTimer = null;
  if (!enabled || !('Notification' in window)) {
    return;
  }
  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch {}
  }
  if (Notification.permission !== 'granted') {
    return;
  }
  const check = () => {
    const s = getSettings();
    const last = Number(localStorage.getItem('debo-last-glucose-reminder') || 0);
    if (!s.glucoseReminderEnabled || Date.now() - last < 7200000 || inQuietWindow(Date.now(), glucoseQuietWindow(s))) {
      return;
    }
    try {
      new Notification(t('reminderGlucoseTitle'), {
        body: t('reminderGlucoseBody')
      });
      localStorage.setItem('debo-last-glucose-reminder', String(Date.now()));
    } catch {}
  };
  notificationTimer = setInterval(check, 60000);
}

async function saveSetup(event) {
  const therapy = $('input[name="therapy"]:checked')?.value || 'injections';
  language = DOM.settingsLanguage.value;
  const age = parseNumber(DOM.profileAge.value);
  if (initialSetupMissing && getSession()?.mode === 'account' && (!Number.isFinite(age) || age < 1 || age > 120)) {
    event?.preventDefault();
    return toast(t('ageRequired'));
  }
  const settings = {
    therapy,
    age: Number.isFinite(age) && age >= 1 && age <= 120 ? Math.round(age) : null,
    rapid: DOM.rapidSelect.value,
    long: DOM.longSelect.value,
    reminderEnabled: therapy === 'pump' ? false : DOM.reminderEnabled.checked,
    reminderTime: DOM.reminderTime.value || '22:00',
    glucoseReminderEnabled: DOM.glucoseReminderEnabled.checked,
    glucoseQuiet: !!$('#glucose-quiet-enabled')?.checked,
    quietFrom: $('#glucose-quiet-from')?.value || '22:00',
    quietTo: $('#glucose-quiet-to')?.value || '07:00',
    postMealReminder: !!$('#post-meal-reminder')?.checked,
    weeklySummary: !!$('#weekly-summary')?.checked,
    glucoseUnit: DOM.glucoseUnitSelect.value,
    language,
    theme: DOM.themeSelect.value
  };
  writeJSON('gluco-insulin-setup', settings);
  initialSetupMissing = false;
  localStorage.setItem('debo-language', language);
  applyTheme(settings.theme);
  await configureGlucoseReminder(settings.glucoseReminderEnabled);
  scheduleWeeklySummary();
  syncCareReminders();
  applyLanguage();
  setTherapyUi();
  renderActiveInsulin();
  renderProfile();
  toastSaved();
}

// The night-pause options show only while the 2-hourly reminder is on; the times only while the pause is on
function syncGlucoseQuietUi() {
  $('#glucose-quiet-wrap').classList.toggle('hidden', !DOM.glucoseReminderEnabled.checked);
  $('#glucose-quiet-times').classList.toggle('hidden', !$('#glucose-quiet-enabled').checked);
}

function renderReminderText() {
  const s = getSettings();
  if (s.therapy === 'pump' || !s.reminderEnabled) {
    return '';
  }
  return `${tx('Long-acting insulin reminder', 'Ilgo veikimo insulino priminimas')} · ${s.reminderTime || '22:00'}`;
}

function guideStep(n, title, text) {
  return `
    <div class="guide-step">

      <span class="guide-step-number">
        ${n}
      </span>

      <div>

        <strong>
          ${escapeHtml(title)}
        </strong>

        <p>
          ${escapeHtml(text)}
        </p>

      </div>

    </div>
  `;
}

const SPORT_TYPE_CONFIGS={
  aerobic:{title:'sportAerobicTitle',examples:'sportAerobicExamples',response:'sportAerobicResponse',before:'sportAerobicBefore',during:'sportAerobicDuring',after:'sportAerobicAfter',direction:'down',symbol:'↓'},
  anaerobic:{title:'sportAnaerobicTitle',examples:'sportAnaerobicExamples',response:'sportAnaerobicResponse',before:'sportAnaerobicBefore',during:'sportAnaerobicDuring',after:'sportAnaerobicAfter',direction:'up',symbol:'↑'},
  mixed:{title:'sportMixedShortTitle',examples:'sportMixedExamples',response:'sportMixedResponse',before:'sportMixedBefore',during:'sportMixedDuring',after:'sportMixedAfter',direction:'mixed',symbol:'↘/↔'},
  light:{title:'sportLightTitle',examples:'sportLightExamples',response:'sportLightResponse',before:'sportLightBefore',during:'sportLightDuring',after:'sportLightAfter',direction:'soft',symbol:'→'}
};

const SPORTS=[
  {id:'walking',type:'aerobic',name:{lt:'Ėjimas',en:'Walking'},
    response:{lt:'Dažniausiai lėtas, tolygus kritimas – didesnis per ilgą ar greitą ėjimą.',en:'Usually a slow, steady fall – more on long or brisk walks.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Turėkite greitų angliavandenių ir vandens.',en:'Check glucose and trend. Carry fast carbohydrates and water.'},
    during:{lt:'Ilgo ėjimo metu retkarčiais pasitikrinkite. Pajutę simptomus – sustokite ir gydykite.',en:'Check now and then on long walks. If you feel symptoms, stop and treat.'},
    after:{lt:'Gliukozė gali kristi dar kelias valandas.',en:'Glucose can keep falling for a few hours.'},
    risk:{lt:['Greitų angliavandenių turėkite net trumpam pasivaikščiojimui.','Ėjimas po valgio gliukozę dažnai sumažina labiau.','Po ilgo ėjimo apžiūrėkite pėdas.'],en:['Carry fast carbohydrates even on short walks.','A walk after a meal often lowers glucose more.','Check your feet after long walks.']}},
  {id:'running',type:'aerobic',name:{lt:'Bėgimas',en:'Running'},
    response:{lt:'Tolygus bėgimas dažniausiai mažina gliukozę. Varžybose adrenalinas gali ją trumpam pakelti.',en:'Steady running usually lowers glucose. Race adrenaline can raise it briefly.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Greitus angliavandenius laikykite kišenėje ar diržo krepšelyje. Ilgam bėgimui praneškite kam nors maršrutą.',en:'Check glucose and trend. Keep fast carbohydrates in a pocket or belt. On long runs, tell someone your route.'},
    during:{lt:'Ilgo bėgimo metu pasitikrinkite numatytose vietose. Pajutę simptomus – sustokite ir gydykite.',en:'On long runs, check at planned points. If you feel low, stop and treat.'},
    after:{lt:'Žema gliukozė gali pasireikšti po kelių valandų ir naktį.',en:'Lows can come hours later and overnight.'},
    risk:{lt:['Ilgų bėgimų ir varžybų planą aptarkite su gydytoju.','Po varžybų adrenalino pakilimo neskubėkite koreguoti.','Gerkite reguliariai.'],en:['Plan long runs and races with your care team.','Do not rush corrections after a race-day adrenaline rise.','Drink regularly.']}},
  {id:'cycling',type:'aerobic',name:{lt:'Dviratis',en:'Cycling'},
    response:{lt:'Ilgas važiavimas dažniausiai tolygiai mažina gliukozę. Įkalnės ir spurtai gali ją trumpam pakelti.',en:'Long rides usually lower glucose steadily. Climbs and sprints can raise it briefly.'},
    before:{lt:'Patikrinkite gliukozę. Pasiimkite greitų angliavandenių, vandens ir telefoną.',en:'Check glucose. Pack fast carbohydrates, water and your phone.'},
    during:{lt:'Pasitikrinkite per sustojimus arba stebėkite CGM. Pajutę simptomus – nevažiuokite toliau, sustokite ir gydykite.',en:'Check at stops or watch your CGM. If you feel low, do not ride on – stop and treat.'},
    after:{lt:'Po ilgo važiavimo stebėkite kelias valandas ir naktį.',en:'After long rides, watch for several hours and overnight.'},
    risk:{lt:['Angliavandenius laikykite taip, kad pasiektumėte nesustoję.','Naujais ar ilgais maršrutais tikrinkitės dažniau.','Užsirašykite atstumą ir intensyvumą – greičiau pamatysite savo dėsningumus.'],en:['Keep carbohydrates where you can reach them while riding.','Check more often on new or long routes.','Note distance and intensity to learn your pattern.']}},
  {id:'swimming',type:'aerobic',name:{lt:'Plaukimas',en:'Swimming'},
    response:{lt:'Dažniausiai mažina gliukozę. Vėsiame vandenyje žemos gliukozės simptomus pastebėti sunkiau.',en:'Usually lowers glucose. In cool water, low symptoms are harder to notice.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Greitus angliavandenius palikite prie baseino. Praneškite gelbėtojui ar draugui.',en:'Check glucose and trend. Leave fast carbohydrates at the poolside. Tell the lifeguard or a friend.'},
    during:{lt:'Darykite pertraukas prie krašto ir įsivertinkite savijautą. Pajutę simptomus – išlipkite ir gydykite.',en:'Take breaks at the edge to check how you feel. If low, get out and treat.'},
    after:{lt:'Gliukozė gali kristi dar kelias valandas.',en:'Glucose may keep falling for hours.'},
    risk:{lt:['Neplaukite vieni.','Vandenyje CGM gali prarasti ryšį – pasitikrinkite išlipę.','Angliavandenius laikykite pasiekiamus nuo baseino.'],en:['Never swim alone.','Your CGM may lose signal in water – check when you get out.','Keep carbohydrates within reach of the pool.']}},
  {id:'gym',type:'anaerobic',name:{lt:'Sporto salė / svoriai',en:'Gym / weights'},
    response:{lt:'Sunkūs serijų pratimai gali trumpam pakelti gliukozę, vėliau ji gali kristi.',en:'Heavy sets can raise glucose briefly; it may fall later.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Turėkite greitų angliavandenių ir vandens.',en:'Check glucose and trend. Have fast carbohydrates and water.'},
    during:{lt:'Ilgos treniruotės metu pasitikrinkite tarp pratimų. Pajutę simptomus – sustokite ir gydykite.',en:'On long sessions, check between exercises. If low, stop and treat.'},
    after:{lt:'Vėliau pasitikrinkite dar kartą – galimas uždelstas kritimas.',en:'Recheck later – a delayed drop is possible.'},
    risk:{lt:['Pakilimas dažnai laikinas – neskubėkite koreguoti.','Kardio po svorių gliukozę gali sumažinti labiau.','Užsirašykite treniruotę – greičiau pamatysite dėsningumus.'],en:['Rises are often temporary – do not rush corrections.','Cardio after weights may lower glucose more.','Note what you trained to spot your patterns.']}},
  {id:'basketball',type:'mixed',name:{lt:'Krepšinis',en:'Basketball'},
    response:{lt:'Spurtai ir pertraukos keičia kryptį – gliukozė gali kristi, nekisti ar trumpam pakilti. Vėliau galimas kritimas.',en:'Sprints and pauses make it vary – it can fall, hold or rise briefly. A later drop is possible.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Ant suolelio turėkite greitų angliavandenių ir vandens. Praneškite komandos draugui ar treneriui.',en:'Check glucose and trend. Keep fast carbohydrates and water on the bench. Tell a teammate or coach.'},
    during:{lt:'Pasitikrinkite per minutės pertraukas ir pertraukas tarp kėlinių. Pajutę simptomus – sustokite ir gydykite.',en:'Use timeouts and breaks to check. If you have hypo symptoms, stop and treat.'},
    after:{lt:'Stebėkite kelias valandas ir naktį. Užsirašykite, kaip sekėsi.',en:'Keep watching for several hours and overnight. Note how this session went.'},
    risk:{lt:['Visada turėkite greitų angliavandenių.','Naujos ar ilgos treniruotės ir turnyrai – tikrinkitės dažniau.','Po adrenalino pakilimo neskubėkite koreguoti.'],en:['Always carry fast carbohydrates.','Check more often in new or long sessions and tournaments.','No rushed corrections after an adrenaline rise.']}},
  {id:'football',type:'mixed',name:{lt:'Futbolas',en:'Football'},
    response:{lt:'Bėgimas ir spurtai kaitaliojasi – gliukozė gali kristi, nekisti ar trumpam pakilti. Vėliau galimas kritimas.',en:'Running and sprints alternate – glucose can fall, hold or rise briefly. A later drop is possible.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Prie aikštės turėkite greitų angliavandenių ir vandens. Praneškite komandos draugui ar treneriui.',en:'Check glucose and trend. Keep fast carbohydrates and water by the pitch. Tell a teammate or coach.'},
    during:{lt:'Pasitikrinkite per kėlinių pertrauką ir kitas pertraukas. Pajutę simptomus – sustokite ir gydykite.',en:'Check at half-time and other breaks. If you feel low, stop and treat.'},
    after:{lt:'Stebėkite kelias valandas ir naktį.',en:'Keep watching for several hours and overnight.'},
    risk:{lt:['Visada turėkite greitų angliavandenių.','Turnyrų ir ilgų rungtynių metu tikrinkitės dažniau.','Po adrenalino pakilimo neskubėkite koreguoti.'],en:['Always carry fast carbohydrates.','Check more often during tournaments and long matches.','No rushed corrections after an adrenaline rise.']}},
  {id:'tennis',type:'mixed',name:{lt:'Tenisas',en:'Tennis'},
    response:{lt:'Trumpi kirčių epizodai ir pauzės – dažniausiai lėtas kritimas. Varžybos gali gliukozę trumpam pakelti.',en:'Short rallies and pauses – usually a gradual fall. Competition can raise it briefly.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Krepšyje turėkite greitų angliavandenių ir vandens.',en:'Check glucose and trend. Keep fast carbohydrates and water in your bag.'},
    during:{lt:'Pasitikrinkite keisdamiesi aikštės pusėmis. Pajutę simptomus – sustokite ir gydykite.',en:'Check at changeovers. If you feel low, stop and treat.'},
    after:{lt:'Po ilgų mačų stebėkite ir vėliau.',en:'Keep watching later, especially after long matches.'},
    risk:{lt:['Visada turėkite greitų angliavandenių.','Ilgų mačų metu tikrinkitės dažniau.','Karštyje gerkite daugiau vandens.'],en:['Always carry fast carbohydrates.','Check more often during long matches.','Drink more water in the heat.']}},
  {id:'hockey',type:'mixed',name:{lt:'Ledo ritulys',en:'Hockey'},
    response:{lt:'Intensyvios pamainos ir poilsis ant suolelio – kryptis kinta. Vėsioje arenoje simptomus pastebėti sunkiau.',en:'Intense shifts and bench rests make it vary. In a cold rink, symptoms are harder to notice.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Ant suolelio turėkite greitų angliavandenių ir vandens. Praneškite treneriui.',en:'Check glucose and trend. Keep fast carbohydrates and water on the bench. Tell your coach.'},
    during:{lt:'Pasitikrinkite tarp kėlinių. Pajutę simptomus – sustokite ir gydykite.',en:'Check between periods. If you feel low, stop and treat.'},
    after:{lt:'Stebėkite kelias valandas ir naktį.',en:'Keep watching for several hours and overnight.'},
    risk:{lt:['Apranga trukdo tikrintis – suplanuokite patikras tarp kėlinių.','Sensorių apsaugokite nuo smūgių.','Po adrenalino pakilimo neskubėkite koreguoti.'],en:['Gear makes checking harder – plan checks between periods.','Protect your sensor from impacts.','No rushed corrections after an adrenaline rise.']}},
  {id:'martial',type:'mixed',name:{lt:'Kovos menai',en:'Martial arts'},
    response:{lt:'Intensyvūs raundai gali trumpam pakelti gliukozę, ilga treniruotė dažniau ją mažina.',en:'Intense rounds can raise glucose briefly; long training usually lowers it.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Prie tatamio turėkite greitų angliavandenių ir vandens. Praneškite treneriui ar partneriui.',en:'Check glucose and trend. Keep fast carbohydrates and water by the mat. Tell your coach or partner.'},
    during:{lt:'Pasitikrinkite tarp raundų. Žemos gliukozės simptomai gali priminti nuovargį – abejodami pasitikrinkite.',en:'Check between rounds. Low symptoms can feel like fatigue – check if unsure.'},
    after:{lt:'Stebėkite vėliau – galimas uždelstas kritimas.',en:'Keep watching later – a delayed drop is possible.'},
    risk:{lt:['Partneriui papasakokite, kaip atpažinti žemą gliukozę.','Sensorių apsaugokite nuo kontakto.','Po sparingo adrenalino neskubėkite koreguoti.'],en:['Tell your partner how to recognize a low.','Protect your sensor from contact.','No rushed corrections after sparring adrenaline.']}},
  {id:'hiit',type:'mixed',name:{lt:'HIIT',en:'HIIT'},
    response:{lt:'Trumpi intensyvūs intervalai gali pakelti gliukozę treniruotės metu, vėliau ji gali kristi.',en:'Short intense intervals can raise glucose during the session; it may fall afterwards.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Turėkite greitų angliavandenių ir vandens.',en:'Check glucose and trend. Have fast carbohydrates and water.'},
    during:{lt:'Jei jaučiatės keistai, pasitikrinkite tarp intervalų. Pajutę simptomus – sustokite ir gydykite.',en:'If you feel off, check between intervals. If low, stop and treat.'},
    after:{lt:'Vėliau pasitikrinkite dar kartą – galimas uždelstas kritimas.',en:'Recheck later – a delayed drop is possible.'},
    risk:{lt:['Pakilimas dažnai laikinas – neskubėkite koreguoti.','Nauja programa – tikrinkitės dažniau.','Užsirašykite treniruotę ir reakciją.'],en:['Rises are often temporary – do not rush corrections.','Check more often on a new program.','Note the session and your response.']}},
  {id:'yoga',type:'light',name:{lt:'Joga',en:'Yoga'},
    response:{lt:'Dažniausiai nedidelis pokytis arba lėtas kritimas. Karšta joga gali sumažinti labiau.',en:'Usually little change or a slow fall. Hot yoga may lower it more.'},
    before:{lt:'Patikrinkite gliukozę. Šalia kilimėlio turėkite greitų angliavandenių ir vandens.',en:'Check glucose. Keep fast carbohydrates and water by your mat.'},
    during:{lt:'Pajutę silpnumą – pailsėkite ir pasitikrinkite. Esant simptomams gydykite.',en:'If you feel weak, rest and check. Treat if you have symptoms.'},
    after:{lt:'Po ilgos ar karštos sesijos pasitikrinkite.',en:'Check after long or hot sessions.'},
    risk:{lt:['Galvos svaigimą atsistojus pasitikrinkite, o ne spėliokite.','Karštoje salėje gerkite vandens.','Greitų angliavandenių turėkite ir lengvai sesijai.'],en:['Dizziness when standing? Check rather than guess.','Drink water in hot rooms.','Carry fast carbohydrates even for gentle sessions.']}},
  {id:'skiing',type:'mixed',name:{lt:'Slidinėjimas',en:'Skiing'},
    response:{lt:'Ilga diena kalnuose dažniausiai mažina gliukozę. Šaltis ir adrenalinas gali ją trumpam pakelti.',en:'A long day usually lowers glucose. Cold and adrenaline can raise it briefly.'},
    before:{lt:'Patikrinkite gliukozę. Angliavandenius ir prietaisus laikykite vidinėje kišenėje. Praneškite kartu slidinėjantiems.',en:'Check glucose. Keep carbohydrates and devices in an inside pocket. Tell the people you ski with.'},
    during:{lt:'Pasitikrinkite keltuose ir per pertraukas. Pajutę simptomus – sustokite ir gydykite.',en:'Check on lifts and during breaks. If you feel low, stop and treat.'},
    after:{lt:'Po visos dienos žema gliukozė galima ir naktį.',en:'After a full day, lows are possible overnight.'},
    risk:{lt:['Šaltis gali paveikti gliukometrą ir insuliną – laikykite juos šiltai.','Šaltyje simptomus pastebėti sunkiau.','Slidinėkite ne vieni.'],en:['Cold can affect meters and insulin – keep them warm.','Symptoms are harder to notice in the cold.','Ski with company.']}},
  {id:'dancing',type:'aerobic',name:{lt:'Šokiai',en:'Dancing'},
    response:{lt:'Nuolatinis judėjimas dažniausiai mažina gliukozę. Pasirodymo jaudulys gali ją trumpam pakelti.',en:'Continuous movement usually lowers glucose. Performance nerves can raise it briefly.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Turėkite greitų angliavandenių ir vandens.',en:'Check glucose and trend. Have fast carbohydrates and water.'},
    during:{lt:'Pasitikrinkite per pertraukas tarp šokių. Pajutę simptomus – sustokite ir gydykite.',en:'Check during breaks between dances. If you feel low, stop and treat.'},
    after:{lt:'Po ilgos repeticijos ar vakaro stebėkite kelias valandas.',en:'After a long rehearsal or night out, keep watching for a few hours.'},
    risk:{lt:['Greitų angliavandenių turėkite kišenėje ar krepšyje.','Ilgų repeticijų metu tikrinkitės dažniau.','Šokdami vakare atkreipkite dėmesį į alkoholio poveikį gliukozei.'],en:['Keep fast carbohydrates in a pocket or bag.','Check more often during long rehearsals.','On nights out, remember alcohol can affect glucose.']}},
  {id:'hiking',type:'aerobic',name:{lt:'Žygiai',en:'Hiking'},
    response:{lt:'Ilgos, tolygios pastangos dažniausiai mažina gliukozę kelias valandas. Įkalnės prideda krūvio.',en:'Long, steady effort usually lowers glucose for hours. Climbs add effort.'},
    before:{lt:'Patikrinkite gliukozę. Pasiimkite daugiau greitų angliavandenių, užkandžių ir vandens. Praneškite kam nors maršrutą.',en:'Check glucose. Pack extra fast carbohydrates, snacks and water. Share your route with someone.'},
    during:{lt:'Pasitikrinkite per reguliarius sustojimus. Simptomus gydykite iš karto.',en:'Check at regular stops. Treat symptoms early.'},
    after:{lt:'Žema gliukozė gali pasireikšti po kelių valandų ir naktį.',en:'Lows can come hours later and overnight.'},
    risk:{lt:['Pasiimkite daugiau angliavandenių, nei manote, kad reikės.','Ryšys gali būti silpnas – eikite ne vieni.','Po ilgo žygio apžiūrėkite pėdas.'],en:['Bring more carbohydrates than you think you need.','Signal may be weak – hike with company.','Check your feet after long hikes.']}},
  {id:'volleyball',type:'mixed',name:{lt:'Tinklinis',en:'Volleyball'},
    response:{lt:'Šuoliai ir pauzės – gliukozė dažnai kinta nedaug, varžybose gali trumpam pakilti.',en:'Jumps and pauses – glucose often changes little; matches can raise it briefly.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Prie aikštės turėkite greitų angliavandenių ir vandens.',en:'Check glucose and trend. Keep fast carbohydrates and water by the court.'},
    during:{lt:'Pasitikrinkite tarp setų. Pajutę simptomus – sustokite ir gydykite.',en:'Check between sets. If you feel low, stop and treat.'},
    after:{lt:'Po ilgų treniruočių ar turnyrų stebėkite vėliau.',en:'Watch later after long sessions or tournaments.'},
    risk:{lt:['Visada turėkite greitų angliavandenių.','Paplūdimio tinklinis karštyje – gerkite daugiau.','Po adrenalino pakilimo neskubėkite koreguoti.'],en:['Always carry fast carbohydrates.','Beach volleyball in the heat – drink more.','No rushed corrections after an adrenaline rise.']}},
  {id:'handball',type:'mixed',name:{lt:'Rankinis',en:'Handball'},
    response:{lt:'Greiti spurtai ir kontaktas – gliukozė gali kristi, nekisti ar trumpam pakilti. Vėliau galimas kritimas.',en:'Fast sprints and contact – glucose can fall, hold or rise briefly. A later drop is possible.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Ant suolelio turėkite greitų angliavandenių ir vandens. Praneškite treneriui.',en:'Check glucose and trend. Keep fast carbohydrates and water on the bench. Tell your coach.'},
    during:{lt:'Pasitikrinkite per minutės ir kėlinių pertraukas. Pajutę simptomus – sustokite ir gydykite.',en:'Check at timeouts and half-time. If you feel low, stop and treat.'},
    after:{lt:'Stebėkite kelias valandas ir naktį.',en:'Keep watching for several hours and overnight.'},
    risk:{lt:['Sensorių apsaugokite nuo kontakto.','Turnyrų metu tikrinkitės dažniau.','Po adrenalino pakilimo neskubėkite koreguoti.'],en:['Protect your sensor from contact.','Check more often during tournaments.','No rushed corrections after an adrenaline rise.']}},
  {id:'badminton',type:'mixed',name:{lt:'Badmintonas',en:'Badminton'},
    response:{lt:'Trumpi greiti epizodai – dažniausiai lėtas kritimas, varžybose galimas trumpas pakilimas.',en:'Short fast rallies – usually a gradual fall; matches may raise it briefly.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Krepšyje turėkite greitų angliavandenių ir vandens.',en:'Check glucose and trend. Keep fast carbohydrates and water in your bag.'},
    during:{lt:'Pasitikrinkite tarp setų. Pajutę simptomus – sustokite ir gydykite.',en:'Check between games. If you feel low, stop and treat.'},
    after:{lt:'Po ilgos sesijos stebėkite vėliau.',en:'Keep watching after a long session.'},
    risk:{lt:['Visada turėkite greitų angliavandenių.','Ilgų sesijų metu tikrinkitės dažniau.','Gerkite reguliariai.'],en:['Always carry fast carbohydrates.','Check more often during long sessions.','Drink regularly.']}},
  {id:'padel',type:'mixed',name:{lt:'Padelis',en:'Padel'},
    response:{lt:'Kaitaliojasi intensyvūs kirčiai ir pauzės – dažniausiai lėtas kritimas.',en:'Intense rallies and pauses alternate – usually a gradual fall.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Krepšyje turėkite greitų angliavandenių ir vandens.',en:'Check glucose and trend. Keep fast carbohydrates and water in your bag.'},
    during:{lt:'Pasitikrinkite keisdamiesi pusėmis. Pajutę simptomus – sustokite ir gydykite.',en:'Check at changeovers. If you feel low, stop and treat.'},
    after:{lt:'Po ilgų mačų stebėkite ir vėliau.',en:'Keep watching later after long matches.'},
    risk:{lt:['Visada turėkite greitų angliavandenių.','Lauke karštyje gerkite daugiau.','Partneriui papasakokite, kaip atpažinti žemą gliukozę.'],en:['Always carry fast carbohydrates.','Drink more when playing outdoors in heat.','Tell your partner how to recognize a low.']}},
  {id:'rowing',type:'aerobic',name:{lt:'Irklavimas',en:'Rowing'},
    response:{lt:'Tolygus irklavimas dažniausiai mažina gliukozę. Intensyvūs intervalai gali trumpam pakelti.',en:'Steady rowing usually lowers glucose. Hard intervals can raise it briefly.'},
    before:{lt:'Patikrinkite gliukozę. Greitus angliavandenius laikykite vandeniui atsparioje vietoje.',en:'Check glucose. Keep fast carbohydrates in a waterproof place.'},
    during:{lt:'Ilgos treniruotės metu pasitikrinkite per pertraukas. Pajutę simptomus – sustokite ir gydykite.',en:'On long sessions, check during breaks. If you feel low, stop and treat.'},
    after:{lt:'Gliukozė gali kristi kelias valandas ir naktį.',en:'Glucose may fall for hours and overnight.'},
    risk:{lt:['Ant vandens neirkluokite vieni.','Telefoną ir angliavandenius laikykite sausai.','Užsirašykite trukmę ir intensyvumą.'],en:['Do not row alone on open water.','Keep your phone and carbohydrates dry.','Note duration and intensity.']}},
  {id:'climbing',type:'anaerobic',name:{lt:'Laipiojimas',en:'Climbing'},
    response:{lt:'Trumpos stiprios pastangos ir jaudulys gali trumpam pakelti gliukozę, ilga sesija – sumažinti.',en:'Short hard efforts and nerves can raise glucose briefly; a long session may lower it.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Greitus angliavandenius laikykite šalia sienos ar kuprinėje.',en:'Check glucose and trend. Keep fast carbohydrates by the wall or in your pack.'},
    during:{lt:'Pasitikrinkite tarp maršrutų. Pajutę simptomus – nelipkite toliau, gydykite.',en:'Check between routes. If you feel low, do not climb on – treat first.'},
    after:{lt:'Vėliau pasitikrinkite dar kartą.',en:'Recheck later.'},
    risk:{lt:['Saugotojui papasakokite, kaip atpažinti žemą gliukozę.','Žema gliukozė aukštyje pavojinga – abejodami nelipkite.','Sensorių apsaugokite nuo trinties.'],en:['Tell your belayer how to recognize a low.','A low at height is dangerous – if unsure, do not climb.','Protect your sensor from rubbing.']}},
  {id:'crossfit',type:'mixed',name:{lt:'CrossFit',en:'CrossFit'},
    response:{lt:'Intensyvūs kompleksai gali pakelti gliukozę treniruotės metu, vėliau ji gali kristi.',en:'Intense workouts can raise glucose during the session; it may fall later.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Turėkite greitų angliavandenių ir vandens.',en:'Check glucose and trend. Have fast carbohydrates and water.'},
    during:{lt:'Pasitikrinkite tarp dalių. Pajutę simptomus – sustokite ir gydykite.',en:'Check between parts of the workout. If you feel low, stop and treat.'},
    after:{lt:'Vėliau pasitikrinkite – galimas uždelstas kritimas.',en:'Recheck later – a delayed drop is possible.'},
    risk:{lt:['Pakilimas dažnai laikinas – neskubėkite koreguoti.','Treneriui papasakokite apie diabetą.','Užsirašykite kompleksą ir reakciją.'],en:['Rises are often temporary – do not rush corrections.','Tell your coach about your diabetes.','Note the workout and your response.']}},
  {id:'boxing',type:'mixed',name:{lt:'Boksas',en:'Boxing'},
    response:{lt:'Intensyvūs raundai gali trumpam pakelti gliukozę, ilga treniruotė dažniau ją mažina.',en:'Intense rounds can raise glucose briefly; long training usually lowers it.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Prie ringo turėkite greitų angliavandenių ir vandens. Praneškite treneriui.',en:'Check glucose and trend. Keep fast carbohydrates and water by the ring. Tell your coach.'},
    during:{lt:'Pasitikrinkite tarp raundų. Simptomai gali priminti nuovargį – abejodami pasitikrinkite.',en:'Check between rounds. Low symptoms can feel like fatigue – check if unsure.'},
    after:{lt:'Stebėkite vėliau – galimas uždelstas kritimas.',en:'Keep watching later – a delayed drop is possible.'},
    risk:{lt:['Sensorių apsaugokite nuo smūgių.','Po sparingo adrenalino neskubėkite koreguoti.','Partneriui papasakokite, kaip atpažinti žemą gliukozę.'],en:['Protect your sensor from impacts.','No rushed corrections after sparring adrenaline.','Tell your partner how to recognize a low.']}},
  {id:'pilates',type:'light',name:{lt:'Pilatesas',en:'Pilates'},
    response:{lt:'Dažniausiai nedidelis pokytis arba lėtas kritimas.',en:'Usually little change or a slow fall.'},
    before:{lt:'Patikrinkite gliukozę. Šalia kilimėlio turėkite greitų angliavandenių.',en:'Check glucose. Keep fast carbohydrates by your mat.'},
    during:{lt:'Pajutę silpnumą – pailsėkite ir pasitikrinkite.',en:'If you feel weak, rest and check.'},
    after:{lt:'Po ilgos sesijos pasitikrinkite.',en:'Check after a long session.'},
    risk:{lt:['Greitų angliavandenių turėkite ir lengvai sesijai.','Pratimai ant pilvo gali spausti sensorių – rinkitės vietą.','Gerkite vandens.'],en:['Carry fast carbohydrates even for gentle sessions.','Floor exercises can press on your sensor – choose its site.','Drink water.']}},
  {id:'golf',type:'light',name:{lt:'Golfas',en:'Golf'},
    response:{lt:'Ilgas ėjimas aikštyne dažniausiai lėtai mažina gliukozę.',en:'Long walking on the course usually lowers glucose slowly.'},
    before:{lt:'Patikrinkite gliukozę. Krepšyje turėkite greitų angliavandenių, užkandžių ir vandens.',en:'Check glucose. Keep fast carbohydrates, snacks and water in your bag.'},
    during:{lt:'Pasitikrinkite kas kelias duobutes. Pajutę simptomus – sustokite ir gydykite.',en:'Check every few holes. If you feel low, stop and treat.'},
    after:{lt:'Po viso raundo stebėkite kelias valandas.',en:'After a full round, keep watching for a few hours.'},
    risk:{lt:['Karštyje gerkite daugiau.','Žaidimo partneriui papasakokite apie diabetą.','Po raundo prie baro atkreipkite dėmesį į alkoholio poveikį.'],en:['Drink more in the heat.','Tell your playing partners about your diabetes.','After the round, remember alcohol can affect glucose.']}},
  {id:'skating',type:'aerobic',name:{lt:'Čiuožimas',en:'Ice skating'},
    response:{lt:'Tolygus čiuožimas dažniausiai mažina gliukozę. Šaltyje simptomus pastebėti sunkiau.',en:'Steady skating usually lowers glucose. Symptoms are harder to notice in the cold.'},
    before:{lt:'Patikrinkite gliukozę. Angliavandenius ir prietaisus laikykite vidinėje kišenėje.',en:'Check glucose. Keep carbohydrates and devices in an inside pocket.'},
    during:{lt:'Pasitikrinkite per pertraukas. Pajutę simptomus – išeikite nuo ledo ir gydykite.',en:'Check during breaks. If you feel low, leave the ice and treat.'},
    after:{lt:'Stebėkite kelias valandas.',en:'Keep watching for a few hours.'},
    risk:{lt:['Šaltis gali paveikti gliukometrą – laikykite jį šiltai.','Čiuožkite ne vieni.','Greitų angliavandenių turėkite su savimi.'],en:['Cold can affect your meter – keep it warm.','Skate with company.','Carry fast carbohydrates with you.']}},
  {id:'nordic',type:'aerobic',name:{lt:'Šiaurietiškas ėjimas',en:'Nordic walking'},
    response:{lt:'Tolygus krūvis dažniausiai lėtai mažina gliukozę – kiek labiau nei paprastas ėjimas.',en:'Steady effort usually lowers glucose slowly – a bit more than plain walking.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Turėkite greitų angliavandenių ir vandens.',en:'Check glucose and trend. Carry fast carbohydrates and water.'},
    during:{lt:'Ilgo ėjimo metu retkarčiais pasitikrinkite. Pajutę simptomus – sustokite ir gydykite.',en:'Check now and then on long walks. If you feel low, stop and treat.'},
    after:{lt:'Gliukozė gali kristi dar kelias valandas.',en:'Glucose can keep falling for a few hours.'},
    risk:{lt:['Greitų angliavandenių turėkite net trumpam išėjimui.','Naujais maršrutais tikrinkitės dažniau.','Po ilgo ėjimo apžiūrėkite pėdas.'],en:['Carry fast carbohydrates even on short outings.','Check more often on new routes.','Check your feet after long walks.']}},
  {id:'stretching',type:'light',name:{lt:'Tempimas',en:'Stretching'},
    response:{lt:'Dažniausiai gliukozė beveik nekinta.',en:'Glucose usually changes very little.'},
    before:{lt:'Patikrinkite gliukozę. Šalia turėkite greitų angliavandenių.',en:'Check glucose. Keep fast carbohydrates nearby.'},
    during:{lt:'Pajutę silpnumą, pailsėkite ir pasitikrinkite.',en:'If you feel weak, rest and check.'},
    after:{lt:'Papildomos stebėsenos dažniausiai nereikia.',en:'Extra monitoring is usually not needed.'},
    risk:{lt:['Greitų angliavandenių turėkite ir lengvai veiklai.','Galvos svaigimą atsistojus pasitikrinkite, o ne spėliokite.','Gerkite vandens.'],en:['Carry fast carbohydrates even for light activity.','If you feel dizzy when standing up, check rather than guess.','Drink water.']}},
  {id:'taichi',type:'light',name:{lt:'Taiči',en:'Tai chi'},
    response:{lt:'Lėti judesiai – dažniausiai nedidelis pokytis arba lėtas kritimas.',en:'Slow movements – usually little change or a slow fall.'},
    before:{lt:'Patikrinkite gliukozę. Turėkite greitų angliavandenių.',en:'Check glucose. Carry fast carbohydrates.'},
    during:{lt:'Pajutę silpnumą, sustokite ir pasitikrinkite.',en:'If you feel weak, stop and check.'},
    after:{lt:'Po ilgos sesijos pasitikrinkite.',en:'Check after a long session.'},
    risk:{lt:['Greitų angliavandenių turėkite ir lengvai veiklai.','Užsiimdami lauke, karštyje gerkite daugiau.','Instruktoriui papasakokite apie diabetą.'],en:['Carry fast carbohydrates even for light activity.','Outdoors in the heat, drink more.','Tell your instructor about your diabetes.']}},
  {id:'aquaaerobics',type:'aerobic',name:{lt:'Vandens aerobika',en:'Aqua aerobics'},
    response:{lt:'Dažniausiai mažina gliukozę. Vandenyje simptomus pastebėti sunkiau.',en:'Usually lowers glucose. Symptoms are harder to notice in water.'},
    before:{lt:'Patikrinkite gliukozę. Greitų angliavandenių palikite prie baseino. Praneškite instruktoriui.',en:'Check glucose. Leave fast carbohydrates at the poolside. Tell the instructor.'},
    during:{lt:'Pajutę simptomus, išlipkite iš vandens ir gydykite.',en:'If you have symptoms, get out of the water and treat.'},
    after:{lt:'Gliukozė gali kristi dar kelias valandas.',en:'Glucose may keep falling for several hours.'},
    risk:{lt:['Vandenyje CGM gali prarasti ryšį – pasitikrinkite išlipę.','Greitus angliavandenius laikykite pasiekiamus.','Nesportuokite vandenyje vieni.'],en:['Your CGM may lose signal in water; check when you get out.','Keep fast carbohydrates within reach.','Do not exercise in water alone.']}},
  {id:'spinning',type:'aerobic',name:{lt:'Spiningas',en:'Indoor cycling'},
    response:{lt:'Tolygus krūvis mažina gliukozę. Intensyvūs intervalai gali ją trumpam pakelti.',en:'Steady effort lowers glucose. Hard intervals can raise it briefly.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Prie dviračio turėkite greitų angliavandenių ir vandens.',en:'Check glucose and trend. Keep fast carbohydrates and water by the bike.'},
    during:{lt:'Pasitikrinkite per lengvesnes dalis. Pajutę simptomus, sustokite ir gydykite.',en:'Check during easier parts. If you have symptoms, stop and treat.'},
    after:{lt:'Gliukozė gali kristi kelias valandas.',en:'Glucose may fall for several hours.'},
    risk:{lt:['Gerkite reguliariai.','Instruktoriui papasakokite apie diabetą.','Užsirašykite treniruotės intensyvumą.'],en:['Drink regularly.','Tell the instructor about your diabetes.','Note the intensity of the session.']}},
  {id:'trailrunning',type:'aerobic',name:{lt:'Bėgimas bekele',en:'Trail running'},
    response:{lt:'Ilgos įkalnės ir nuokalnės dažniausiai mažina gliukozę kelias valandas.',en:'Long climbs and descents usually lower glucose for hours.'},
    before:{lt:'Patikrinkite gliukozę. Pasiimkite daugiau greitų angliavandenių ir vandens. Praneškite maršrutą.',en:'Check glucose. Carry extra fast carbohydrates and water. Share your route.'},
    during:{lt:'Pasitikrinkite per reguliarius sustojimus. Simptomus gydykite iš karto.',en:'Check at regular stops. Treat symptoms immediately.'},
    after:{lt:'Žema gliukozė galima po kelių valandų ir naktį.',en:'Lows can occur hours later and overnight.'},
    risk:{lt:['Bėkite ne vieni arba praneškite maršrutą.','Ryšys gali būti silpnas.','Pasiimkite daugiau angliavandenių, nei manote, kad reikės.'],en:['Run with company or share your route.','Signal may be weak.','Carry more carbohydrates than you expect to need.']}},
  {id:'crosscountry',type:'aerobic',name:{lt:'Lygumų slidinėjimas',en:'Cross-country skiing'},
    response:{lt:'Ilga tolygi veikla dažniausiai mažina gliukozę. Šaltyje simptomus pastebėti sunkiau.',en:'Long steady activity usually lowers glucose. Symptoms are harder to notice in the cold.'},
    before:{lt:'Patikrinkite gliukozę. Angliavandenius ir prietaisus laikykite vidinėje kišenėje.',en:'Check glucose. Keep carbohydrates and devices in an inside pocket.'},
    during:{lt:'Pasitikrinkite per sustojimus. Pajutę simptomus, sustokite ir gydykite.',en:'Check at stops. If you have symptoms, stop and treat.'},
    after:{lt:'Po ilgos dienos žema gliukozė galima ir naktį.',en:'After a long day, lows are possible overnight.'},
    risk:{lt:['Šaltis gali paveikti gliukometrą ir insuliną – laikykite juos šiltai.','Slidinėkite ne vieni.','Gerkite reguliariai.'],en:['Cold can affect meters and insulin; keep them warm.','Ski with company.','Drink regularly.']}},
  {id:'snowboarding',type:'mixed',name:{lt:'Snieglentė',en:'Snowboarding'},
    response:{lt:'Ilga diena dažniausiai mažina gliukozę. Šaltis ir adrenalinas gali ją trumpam pakelti.',en:'A long day usually lowers glucose. Cold and adrenaline can raise it briefly.'},
    before:{lt:'Patikrinkite gliukozę. Angliavandenius ir prietaisus laikykite vidinėje kišenėje. Praneškite draugams.',en:'Check glucose. Keep carbohydrates and devices in an inside pocket. Tell your companions.'},
    during:{lt:'Pasitikrinkite keltuose ir per pertraukas. Pajutę simptomus, sustokite ir gydykite.',en:'Check on lifts and during breaks. If you have symptoms, stop and treat.'},
    after:{lt:'Po visos dienos žema gliukozė galima ir naktį.',en:'After a full day, lows are possible overnight.'},
    risk:{lt:['Sensorių apsaugokite nuo kritimų.','Šaltyje simptomus pastebėti sunkiau.','Po adrenalino pakilimo neskubėkite koreguoti.'],en:['Protect your sensor from falls.','Symptoms are harder to notice in the cold.','Do not rush corrections after an adrenaline rise.']}},
  {id:'surfing',type:'mixed',name:{lt:'Banglenčių sportas',en:'Surfing'},
    response:{lt:'Irklavimas ir laukimas kaitaliojasi – dažniausiai gliukozė krenta.',en:'Paddling and waiting alternate – glucose usually falls.'},
    before:{lt:'Patikrinkite gliukozę. Greitus angliavandenius palikite krante. Praneškite draugui.',en:'Check glucose. Leave fast carbohydrates on shore. Tell a friend.'},
    during:{lt:'Pajutę simptomus, plaukite į krantą ir gydykite.',en:'If you have symptoms, return to shore and treat.'},
    after:{lt:'Gliukozė gali kristi kelias valandas.',en:'Glucose may fall for several hours.'},
    risk:{lt:['Nesportuokite vandenyje vieni.','Vandenyje CGM gali prarasti ryšį.','Saulėje gerkite daugiau.'],en:['Do not surf alone.','Your CGM may lose signal in water.','Drink more in the sun.']}},
  {id:'kayaking',type:'aerobic',name:{lt:'Baidarės',en:'Kayaking'},
    response:{lt:'Ilgas irklavimas dažniausiai tolygiai mažina gliukozę.',en:'Long paddling usually lowers glucose steadily.'},
    before:{lt:'Patikrinkite gliukozę. Angliavandenius ir telefoną laikykite vandeniui atsparioje pakuotėje.',en:'Check glucose. Keep carbohydrates and your phone in a waterproof bag.'},
    during:{lt:'Pasitikrinkite per sustojimus. Pajutę simptomus, plaukite į krantą ir gydykite.',en:'Check at stops. If you have symptoms, go ashore and treat.'},
    after:{lt:'Gliukozė gali kristi kelias valandas ir naktį.',en:'Glucose may fall for hours and overnight.'},
    risk:{lt:['Neplaukite vieni.','Dėvėkite gelbėjimosi liemenę.','Pasiimkite daugiau angliavandenių ir vandens.'],en:['Do not paddle alone.','Wear a life jacket.','Carry extra carbohydrates and water.']}},
  {id:'rugby',type:'mixed',name:{lt:'Regbis',en:'Rugby'},
    response:{lt:'Spurtai ir kontaktas – gliukozė gali kristi, nekisti ar trumpam pakilti. Vėliau galimas kritimas.',en:'Sprints and contact – glucose can fall, hold or rise briefly. A later drop is possible.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Prie aikštės turėkite greitų angliavandenių ir vandens. Praneškite treneriui.',en:'Check glucose and trend. Keep fast carbohydrates and water by the pitch. Tell your coach.'},
    during:{lt:'Pasitikrinkite per kėlinių pertrauką. Pajutę simptomus, sustokite ir gydykite.',en:'Check at half-time. If you have symptoms, stop and treat.'},
    after:{lt:'Stebėkite kelias valandas ir naktį.',en:'Keep monitoring for several hours and overnight.'},
    risk:{lt:['Sensorių apsaugokite nuo smūgių.','Po adrenalino pakilimo neskubėkite koreguoti.','Komandos draugams papasakokite, kaip atpažinti žemą gliukozę.'],en:['Protect your sensor from impacts.','Do not rush corrections after an adrenaline rise.','Tell teammates how to recognize a low.']}},
  {id:'squash',type:'mixed',name:{lt:'Skvošas',en:'Squash'},
    response:{lt:'Labai intensyvūs epizodai gali trumpam pakelti gliukozę, vėliau ji gali kristi.',en:'Very intense rallies can raise glucose briefly; it may fall later.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Prie aikštelės turėkite greitų angliavandenių ir vandens.',en:'Check glucose and trend. Keep fast carbohydrates and water by the court.'},
    during:{lt:'Pasitikrinkite tarp geimų. Pajutę simptomus, sustokite ir gydykite.',en:'Check between games. If you have symptoms, stop and treat.'},
    after:{lt:'Vėliau pasitikrinkite dar kartą.',en:'Recheck later.'},
    risk:{lt:['Pakilimas dažnai laikinas – neskubėkite koreguoti.','Gerkite reguliariai.','Partneriui papasakokite, kaip atpažinti žemą gliukozę.'],en:['Rises are often temporary; do not rush corrections.','Drink regularly.','Tell your partner how to recognize a low.']}},
  {id:'tabletennis',type:'light',name:{lt:'Stalo tenisas',en:'Table tennis'},
    response:{lt:'Dažniausiai nedidelis pokytis arba lėtas kritimas.',en:'Usually little change or a slow fall.'},
    before:{lt:'Patikrinkite gliukozę. Turėkite greitų angliavandenių.',en:'Check glucose. Carry fast carbohydrates.'},
    during:{lt:'Ilgos sesijos metu pasitikrinkite. Pajutę simptomus, sustokite ir gydykite.',en:'Check during long sessions. If you have symptoms, stop and treat.'},
    after:{lt:'Po turnyro pasitikrinkite dar kartą.',en:'Recheck after a tournament.'},
    risk:{lt:['Greitų angliavandenių turėkite ir lengvai veiklai.','Turnyro metu tikrinkitės dažniau.','Gerkite vandens.'],en:['Carry fast carbohydrates even for light activity.','Check more often during tournaments.','Drink water.']}},
  {id:'sprinting',type:'anaerobic',name:{lt:'Sprintas',en:'Sprinting'},
    response:{lt:'Trumpi maksimalūs bėgimai gali trumpam pakelti gliukozę, vėliau ji gali kristi.',en:'Short maximal runs can raise glucose briefly; it may fall later.'},
    before:{lt:'Patikrinkite gliukozę ir kryptį. Turėkite greitų angliavandenių ir vandens.',en:'Check glucose and trend. Have fast carbohydrates and water.'},
    during:{lt:'Pasitikrinkite tarp serijų. Pajutę simptomus, sustokite ir gydykite.',en:'Check between sets. If you have symptoms, stop and treat.'},
    after:{lt:'Vėliau pasitikrinkite – galimas uždelstas kritimas.',en:'Recheck later; a delayed drop is possible.'},
    risk:{lt:['Pakilimas dažnai laikinas – neskubėkite koreguoti.','Treneriui papasakokite apie diabetą.','Užsirašykite treniruotę ir reakciją.'],en:['Rises are often temporary; do not rush corrections.','Tell your coach about your diabetes.','Note the session and your response.']}}
];

Object.entries(LANGUAGE_PACKS).forEach(([code, pack]) =>
  SPORTS.forEach(sport => Object.entries(pack.sports?.[sport.id] || {}).forEach(([field, text]) => (sport[field][code] = text)))
);

function sportText(value) {
  return value[language] || value.en;
}

function renderSportPicker() {
  const chips = $('#sport-chips');
  if (!chips) return;
  const normalize = text => text.toLocaleLowerCase(locale());
  const query = normalize(($('#sport-search')?.value || '').trim());
  const visible = SPORTS.filter(sport => !query || normalize(sportText(sport.name)).startsWith(query));
  chips.innerHTML = visible
    .map(sport => {
      const config = SPORT_TYPE_CONFIGS[sport.type];
      return `<button class="sport-chip" type="button" data-sport-pick="${sport.id}"><span class="sport-chip-dot ${config.direction}" aria-hidden="true">${config.symbol}</span>${escapeHtml(sportText(sport.name))}</button>`;
    })
    .join('');
  $('#sport-chips-empty').hidden = visible.length > 0;
}

function openSportGuide(id) {
  const sport = SPORTS.find(item => item.id === id);
  if (!sport) return;
  const config = SPORT_TYPE_CONFIGS[sport.type];
  const phase = (label, text) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(text)}</dd></div>`;
  DOM.guideContent.innerHTML = `
    <div class="sg">
      <p class="eyebrow">${t('sportGuideKicker')}</p>
      <div class="sg-head"><h2>${escapeHtml(sportText(sport.name))}</h2><button class="sport-type-link" type="button" data-sport-type-link="${sport.type}"><span class="sport-direction ${config.direction}">${config.symbol}</span>${escapeHtml(t(config.title))}</button></div>
      <div class="sg-response"><span class="sg-label">${t('sportDetailResponse')}</span><p>${escapeHtml(sportText(sport.response))}</p></div>
      <dl class="sg-phases">
        ${phase(t('sportBeforeShort'), sportText(sport.before))}
        ${phase(t('sportDuringShort'), sportText(sport.during))}
        ${phase(t('sportAfterShort'), sportText(sport.after))}
      </dl>
      <div class="sg-risk"><span class="sg-label">${t('sportRiskTitle')}</span><ul>${sportText(sport.risk)
        .map(item => `<li>${escapeHtml(item)}</li>`)
        .join('')}</ul></div>
      <div class="sg-postpone"><span class="sg-label">${t('sportKetoneTitle')}</span><p>${t('sportWarning')}</p></div>
      <button class="primary full-button sg-log" type="button" data-log-sport="${sport.id}">${t('exerciseLogThis')}</button>
      <p class="guide-disclaimer">${t('sportDisclaimer')}</p>
    </div>
  `;
  if (!DOM.guideModal.open) DOM.guideModal.showModal();
  DOM.guideModal.querySelector('.modal-card')?.scrollTo({ top: 0 });
}
function bindSportPickerEvents() {
  $('#sport-search')?.addEventListener('input', renderSportPicker);
  $('#sport-chips')?.addEventListener('click', event => {
    const chip = event.target.closest('[data-sport-pick]');
    if (!chip) return;
    hideChartTooltip();
    openSportGuide(chip.dataset.sportPick);
  });
  DOM.guideContent.addEventListener('click', event => {
    const link = event.target.closest('[data-sport-type-link]');
    if (link) openSportTypeGuide(link.dataset.sportTypeLink);
    if (event.target.closest('[data-start-hypo-timer]')) startHypoTimer();
    if (event.target.closest('[data-log-ketones]')) {
      openFrom(DOM.guideModal, () => openEntry('glucose'));
      // Ketones only when asked for from the high-glucose guide
      $('#ketone-label').classList.remove('hidden');
      setTimeout(() => $('#ketone-amount').focus(), 120);
    }
  });
}

/* Hypo timer: started only by the user from the guide. A general 15-minute countdown with a reminder to re-check, no reading-based logic */
const HYPO_TIMER_KEY = 'debo-hypo-timer',
  HYPO_TIMER_ID = 4121,
  HYPO_TIMER_MS = 15 * 60000,
  TIMER_RING = 326.73;
let hypoTimerTick = 0,
  hypoTimerDoneFor = 0;
function hypoTimerEnd() {
  try {
    return Number(localStorage.getItem(HYPO_TIMER_KEY) || 0);
  } catch {
    return 0;
  }
}
function startHypoTimer() {
  const end = Date.now() + HYPO_TIMER_MS;
  try {
    localStorage.setItem(HYPO_TIMER_KEY, String(end));
  } catch {}
  try {
    window.AndroidReminders?.schedule?.(HYPO_TIMER_ID, end, t('timerDoneTitle'), t('timerDoneBody'));
  } catch {}
  if (!window.AndroidReminders && 'Notification' in window && Notification.permission === 'default') {
    try {
      Notification.requestPermission();
    } catch {}
  }
  openHypoTimer();
}
function stopHypoTimer() {
  try {
    localStorage.removeItem(HYPO_TIMER_KEY);
  } catch {}
  try {
    window.AndroidReminders?.cancel?.(HYPO_TIMER_ID);
  } catch {}
  renderHypoTimer();
}
function openHypoTimer() {
  hideChartTooltip();
  $$('dialog[open]').forEach(dialog => dialog.close());
  renderHypoTimer();
  $('#hypo-timer-modal').showModal();
}
function renderHypoTimer() {
  const end = hypoTimerEnd(),
    running = end > 0,
    left = running ? Math.max(0, end - Date.now()) : 0,
    done = running && !left;
  const clock = ms => {
    const s = Math.ceil(ms / 1000);
    return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
  };
  $('#hero-timer').hidden = !running;
  $('#hero-timer').classList.toggle('done', done);
  $('#hero-timer-clock').textContent = done ? t('timerDoneShort') : clock(left);
  $('#timer-clock').textContent = running ? clock(left) : clock(HYPO_TIMER_MS);
  $('#timer-state').textContent = done ? t('timerDoneShort') : running ? t('timerLeft') : t('timerReady');
  $('#timer-progress').style.strokeDashoffset = String(running ? TIMER_RING * (1 - left / HYPO_TIMER_MS) : 0);
  $('#hypo-timer-modal').classList.toggle('done', done);
  $('#timer-restart').textContent = running ? t('timerRestart') : t('timerStartShort');
  $('#timer-stop').hidden = !running;
  if (done && hypoTimerDoneFor !== end) {
    hypoTimerDoneFor = end;
    try {
      navigator.vibrate?.([200, 100, 200]);
    } catch {}
    toast(t('timerDoneTitle'));
    if (!window.AndroidReminders && 'Notification' in window && Notification.permission === 'granted' && document.hidden) {
      try {
        new Notification(t('timerDoneTitle'), { body: t('timerDoneBody') });
      } catch {}
    }
  }
  if (running && !done && !hypoTimerTick) hypoTimerTick = setInterval(renderHypoTimer, 1000);
  if ((!running || done) && hypoTimerTick) {
    clearInterval(hypoTimerTick);
    hypoTimerTick = 0;
  }
}
function bindHypoTimerEvents() {
  $('#hero-timer').addEventListener('click', openHypoTimer);
  $('#close-hypo-timer').addEventListener('click', () => $('#hypo-timer-modal').close());
  $('#timer-restart').addEventListener('click', startHypoTimer);
  $('#timer-stop').addEventListener('click', () => {
    stopHypoTimer();
    $('#hypo-timer-modal').close();
  });
  $('#timer-check').addEventListener('click', () => {
    if (hypoTimerEnd() && hypoTimerEnd() <= Date.now()) stopHypoTimer();
    // Back to the timer only while it is still running
    openFrom($('#hypo-timer-modal'), () => openEntry('glucose'), () => hypoTimerEnd() && openHypoTimer());
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderHypoTimer();
  });
  renderHypoTimer();
}

function openSportTypeGuide(type) {
  const config = SPORT_TYPE_CONFIGS[type];
  if (!config) return;
  DOM.guideContent.innerHTML = `
    <p class="eyebrow">${t('sportDetailKicker')}</p>
    <h2>${escapeHtml(t(config.title))}</h2>
    <div class="guide-note"><strong>${t('sportDetailActivities')}</strong>${escapeHtml(t(config.examples))}</div>
    <div class="sport-detail-response">
      <span class="sport-direction ${config.direction}">${config.symbol}</span>
      <div><strong>${t('sportDetailResponse')}</strong><p>${escapeHtml(t(config.response))}</p></div>
    </div>
    <div class="guide-steps">
      ${guideStep(1, t('sportDetailBefore'), t(config.before))}
      ${guideStep(2, t('sportDetailDuring'), t(config.during))}
      ${guideStep(3, t('sportDetailAfter'), t(config.after))}
    </div>
    <div class="guide-emergency"><strong>${t('sportKetoneTitle')}</strong>${t('sportWarning')}</div>
    <p class="guide-disclaimer">${t('sportDisclaimer')}</p>
  `;
  if (!DOM.guideModal.open) DOM.guideModal.showModal();
  DOM.guideModal.querySelector('.modal-card')?.scrollTo({ top: 0 });
}

function openGuide(type) {
  if (type === 'sport') {
    DOM.guideContent.innerHTML = `
      <p class="eyebrow">${t('sportKicker')}</p>
      <h2>${t('sportTitle')}</h2>
      <p class="guide-intro">${t('sportIntro')}</p>
      <div class="guide-steps">
        ${guideStep(1, t('sportStep1Title'), t('sportStep1Text'))}
        ${guideStep(2, t('sportStep2Title'), t('sportStep2Text'))}
        ${guideStep(3, t('sportStep3Title'), t('sportStep3Text'))}
      </div>
      <div class="guide-emergency"><strong>${t('sportKetoneTitle')}</strong>${t('sportWarning')}</div>
      <p class="guide-disclaimer">${t('guideDisclaimer')}</p>
    `;
  } else if (type === 'hypo') {
    DOM.guideContent.innerHTML = `
      <p class="eyebrow">${t('hypoKicker')}</p>
      <h2>${t('hypoTitle')}</h2>
      <button class="primary guide-timer-start" type="button" data-start-hypo-timer>${t('timerStart')}</button>
      <div class="guide-steps">
        ${guideStep(1, t('hypoStep1Title'), t('hypoStep1Text'))}
        ${guideStep(2, t('hypoStep2Title'), t('hypoStep2Text'))}
        ${guideStep(3, t('hypoStep3Title'), t('hypoStep3Text'))}
        ${guideStep(4, t('hypoStep4Title'), t('hypoStep4Text'))}
        ${guideStep(5, t('hypoStep5Title'), t('hypoStep5Text'))}
      </div>
      <div class="guide-note"><strong>${t('hypoExtraTitle')}</strong>${t('hypoExtraText')}</div>
      <div class="guide-emergency"><strong>${t('emergencyLabel')}</strong>${t('hypoEmergency')}</div>
      <p class="guide-disclaimer">${t('guideDisclaimer')}</p>
    `;
  } else {
    DOM.guideContent.innerHTML = `
      <p class="eyebrow">${t('hyperKicker')}</p>
      <h2>${t('hyperTitle')}</h2>
      <div class="guide-steps">
        ${guideStep(1, t('hyperStep1Title'), t('hyperStep1Text'))}
        ${guideStep(2, t('hyperStep2Title'), t('hyperStep2Text'))}
        ${guideStep(3, t('hyperStep3Title'), t('hyperStep3Text'))}
        ${guideStep(4, t('hyperStep4Title'), t('hyperStep4Text'))}
      </div>
      <button class="secondary guide-ketone-log" type="button" data-log-ketones>${t('logKetones')}</button>
      <div class="guide-note guide-move"><strong>${t('hyperMoveTitle')}</strong><ul>${['hyperMove1', 'hyperMove2', 'hyperMove3'].map(key => `<li>${t(key)}</li>`).join('')}</ul><p>${t('hyperMoveCaution')}</p></div>
      <div class="guide-emergency"><strong>${t('urgentHelp')}</strong>${t('hyperEmergency')}</div>
      <p class="guide-disclaimer">${t('guideDisclaimer')}</p>
    `;
  }
  DOM.guideModal.showModal();
}

function setupBottomNavScroll() {
  let prev = Math.max(0, scrollY);
  let offset = 0;
  let navHeight = DOM.bottomNav.offsetHeight || 70;
  let lastOffset = -1;
  let lastHidden = false;
  addEventListener(
    'resize',
    () => {
      navHeight = DOM.bottomNav.offsetHeight || 70;
    },
    { passive: true }
  );
  addEventListener(
    'scroll',
    () => {
      if (navFrame) return;
      navFrame = requestAnimationFrame(() => {
        navFrame = 0;
        const y = Math.max(0, scrollY);
        const delta = y - prev;
        const h = navHeight;
        if (delta > 0) {
          offset = Math.min(h + 44, offset + delta * 1.25);
        } else if (delta < 0) {
          offset = Math.max(0, offset + delta * 1.7);
        }
        if (y < 5) {
          offset = 0;
        }
        const r = clamp(offset / h, 0, 1);
        prev = y;
        const rounded = Math.round(offset);
        if (rounded === lastOffset) return;
        lastOffset = rounded;
        DOM.bottomNav.style.transform = `translate3d(-50%,${rounded}px,0)`;
        DOM.bottomNav.style.opacity = String(1 - r * 0.96);
        const hidden = r > 0.92;
        if (hidden !== lastHidden) {
          lastHidden = hidden;
          DOM.bottomNav.style.pointerEvents = hidden ? 'none' : '';
        }
      });
    },
    {
      passive: true
    }
  );
}

function bindEvents() {
  DOM.glucoseCard.addEventListener('click', event => {
    if (!event.target.closest('#glucose-updated,#calendar-open,#quick-glucose-add,.hero-guide,#hero-timer')) openGlucoseChart();
  });
  $('#quick-glucose-add').addEventListener('click', () => {
    hideChartTooltip();
    openEntry('glucose');
  });
  DOM.glucoseCard.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target === DOM.glucoseCard) {
      event.preventDefault();
      openGlucoseChart();
    }
  });
  $('#close-glucose-chart').addEventListener('click', () => DOM.glucoseChartModal.close());
  DOM.glucoseChartModal.addEventListener('close', hideChartTooltip);
  $$('[data-auth-language]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.authLanguage)));
  $('#language-toggle').addEventListener('click', openLanguagePicker);
  $('#language-list').addEventListener('click', event => {
    const option = event.target.closest('[data-language]');
    if (!option) return;
    setLanguage(option.dataset.language);
    $('#language-modal').close();
  });
  DOM.authOpenLogin.addEventListener('click', () => openAuthMode('login'));
  DOM.authOpenSignup.addEventListener('click', () => openAuthMode('signup'));
  DOM.continueGuest.addEventListener('click', () => openAuthMode('guest'));
  DOM.authBack.addEventListener('click', () => openAuthMode('choice'));
  DOM.authSubmit.addEventListener('click', submitAuthForm);
  [DOM.authName, DOM.authEmail, DOM.authPassword, DOM.authPasswordRepeat].forEach(input => {
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && authMode !== 'choice') {
        event.preventDefault();
        submitAuthForm();
      }
    });
    input.addEventListener('input', () => {
      setFieldError(input);
      if (input === DOM.authPassword) renderPasswordStrength();
    });
  });
  $$('[data-toggle-password]').forEach(button =>
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.togglePassword);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.classList.toggle('showing', show);
      button.setAttribute('aria-label', t(show ? 'hidePassword' : 'showPassword'));
      input.focus();
    })
  );
  $('#auth-switch-button')?.addEventListener('click', () => openAuthMode(authMode === 'signup' ? 'login' : 'signup'));
  $$('[data-auth-provider="Google"]').forEach(button => button.addEventListener('click', () => beginGoogleSignIn(button)));
  DOM.profileCreateAccount.addEventListener('click', showAuthScreen);
  DOM.profileLogout?.addEventListener('click', logout);
  $('#profile-delete-account')?.addEventListener('click', openDeleteAccount);
  $('#delete-account-confirm')?.addEventListener('click', confirmDeleteAccount);
  $$('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog')?.close()));
  DOM.profilePhotoInput?.addEventListener('change', async () => {
    const file = DOM.profilePhotoInput.files?.[0];
    if (!file) return;
    try {
      pendingProfilePhoto = await processProfilePhoto(file);
      if (DOM.profileAvatar) {
        DOM.profileAvatar.style.backgroundImage = `url(${JSON.stringify(pendingProfilePhoto).slice(1, -1)})`;
        DOM.profileAvatar.classList.add('has-photo');
      }
    } catch {
      pendingProfilePhoto = null;
      toast(t('profilePhotoTooLarge'));
    } finally {
      DOM.profilePhotoInput.value = '';
    }
  });
  DOM.themeSelect.addEventListener('change', () => applyTheme(DOM.themeSelect.value));
  systemTheme.addEventListener?.('change', () => {
    if (getThemePreference() === 'system') applyTheme('system');
  });
  $$('[data-view-nav]').forEach(b =>
    b.addEventListener('click', () => {
      hideChartTooltip();
      // A tab always opens its main page
      if (b.dataset.viewNav === 'food') {
        foodBrowserMode = 'home';
        foodSearchQuery = '';
      }
      showView(b.dataset.viewNav);
    })
  );
  $$('[data-go-home]').forEach(b =>
    b.addEventListener('click', () => {
      hideChartTooltip();
      showView('home');
    })
  );
  $$('[data-open-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.openView)));
  DOM.profileButton.addEventListener('click', () => {
    hideChartTooltip();
    renderProfile();
    DOM.profileModal.showModal();
  });
  DOM.settingsButton.addEventListener('click', () => {
    hideChartTooltip();
    if (DOM.profileModal.open) {
      DOM.profileModal.close();
      returnTo = () => {
        renderProfile();
        DOM.profileModal.showModal();
      };
    }
    const s = getSettings();
    DOM.settingsLanguage.value = language;
    DOM.glucoseUnitSelect.value = s.glucoseUnit || 'mmol';
    DOM.glucoseReminderEnabled.checked = !!s.glucoseReminderEnabled;
    $('#glucose-quiet-enabled').checked = s.glucoseQuiet !== false;
    $('#glucose-quiet-from').value = s.quietFrom || '22:00';
    $('#glucose-quiet-to').value = s.quietTo || '07:00';
    syncGlucoseQuietUi();
    if ($('#post-meal-reminder')) $('#post-meal-reminder').checked = !!s.postMealReminder;
    $('#weekly-summary').checked = !!s.weeklySummary;
    renderCustomReminders();
    DOM.themeSelect.value = getThemePreference();
    DOM.accountProfileFields.classList.remove('hidden');
    updateNotificationNote();
    DOM.setupModal.showModal();
  });
  $('#add-insulin').addEventListener('click', () => {
    hideChartTooltip();
    openEntry('insulin');
  });
  $('#add-food').addEventListener('click', () => {
    hideChartTooltip();
    openEntry('food');
  });
  $('#add-glucose').addEventListener('click', () => {
    hideChartTooltip();
    openEntry('glucose');
  });
  DOM.glucoseUpdated.addEventListener('click', () => {
    if (DOM.glucoseUpdated.disabled) return;
    hideChartTooltip();
    openEntry('glucose');
  });
  $('#save-entry').addEventListener('click', event => {
    event.preventDefault();
    if (!saveEntry()) return;
    DOM.entryModal.close();
    toastSaved();
    try {
      navigator.vibrate?.(12);
    } catch {}
  });
  DOM.entryAmount.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    $('#save-entry').click();
  });
  DOM.foodProduct.addEventListener('change', updateFoodPortions);
  $('#food-mode-manual').addEventListener('click', startManualFoodEntry);
  $('#food-mode-voice').addEventListener('click', () => {
    if (requirePremium()) startVoiceFoodEntry();
  });
  $('#food-mode-barcode').addEventListener('click', () => {
    if (requirePremium()) startBarcodeFoodEntry();
  });
  $('#lookup-food-barcode').addEventListener('click', () => lookupFoodBarcode(DOM.foodBarcodeInput.value));
  DOM.foodBarcodeInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      lookupFoodBarcode(DOM.foodBarcodeInput.value);
    }
  });
  bindFoodCatalogPage();
  $('#open-photo-analysis').addEventListener('click', () => {
    if (!requirePremium()) return;
    setFoodEntryMode('photo');
    openPhotoAnalysis();
  });
  $('#close-photo-analysis').addEventListener('click', () => DOM.photoModal.close());
  $('#take-meal-photo').addEventListener('click', () => {
    DOM.photoCameraInput.value = '';
    DOM.photoCameraInput.click();
  });
  $('#pick-meal-photo').addEventListener('click', () => {
    DOM.photoGalleryInput.value = '';
    DOM.photoGalleryInput.click();
  });
  const onMealPhotoPicked = event => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      DOM.photoPreview.classList.add('hidden');
      return;
    }
    selectedMealPhotoFile = file;
    if (DOM.photoPreview.dataset.objectUrl) URL.revokeObjectURL(DOM.photoPreview.dataset.objectUrl);
    DOM.photoPreview.dataset.objectUrl = URL.createObjectURL(file);
    DOM.photoPreview.src = DOM.photoPreview.dataset.objectUrl;
    DOM.photoPreview.classList.remove('hidden');
    DOM.photoStatus.textContent = '';
  };
  DOM.photoCameraInput.addEventListener('change', onMealPhotoPicked);
  DOM.photoGalleryInput.addEventListener('change', onMealPhotoPicked);
  DOM.photoAnalyzeButton.addEventListener('click', analyzeMealPhoto);
  DOM.photoSaveButton.addEventListener('click', saveMealPhotoEstimate);
  DOM.foodPortion.addEventListener('change', () => {
    DOM.foodGramsLabel.classList.toggle('hidden', DOM.foodPortion.value !== 'manual');
    updateCarbPreview();
  });
  [DOM.foodGrams, DOM.customFoodName, DOM.customFoodCarbs, DOM.customFoodProtein, DOM.customFoodFat].forEach(x =>
    x.addEventListener('input', updateCarbPreview)
  );
  $$('[data-chart-hours]').forEach(b =>
    b.addEventListener('click', () => {
      hideChartTooltip();
      chartViewHours = +b.dataset.chartHours;
      $$('[data-chart-hours]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      chartShouldScrollToLatest = true;
      renderTimelineGraph();
    })
  );
  DOM.chartScroll.addEventListener(
    'scroll',
    () => {
      if (chartScrollFrame) return;
      chartScrollFrame = requestAnimationFrame(() => {
        chartScrollFrame = 0;
      });
    },
    {
      passive: true
    }
  );
  // Hover only with a mouse; on touch screens a tap shows and hides the bubble
  DOM.timelineSvg.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    const target = e.target.closest('[data-tooltip]');
    if (target) showChartTooltip(target);
  });
  DOM.timelineSvg.addEventListener('pointerout', e => {
    if (e.pointerType !== 'mouse') return;
    if (e.target.closest('[data-tooltip]')) hideChartTooltip();
  });
  DOM.timelineSvg.addEventListener('click', e => {
    const target = e.target.closest('[data-event-id]');
    if (!target) {
      hideChartTooltip();
      return;
    }
    e.stopPropagation();
    const id = target.dataset.eventId;
    if (lastChartTap.id === id && !DOM.chartTooltip.classList.contains('hidden')) {
      hideChartTooltip();
      lastChartTap = { id: null, time: 0 };
      return;
    }
    showChartTooltip(target, e);
    lastChartTap = { id, time: Date.now() };
  });
  document.addEventListener('pointerdown', e => {
    if (!e.target.closest('[data-tooltip]')) {
      hideChartTooltip();
    }
  });
  DOM.chartScroll.addEventListener(
    'pointerdown',
    e => {
      const target = e.target.closest('[data-tooltip]');
      if (!target) {
        hideChartTooltip();
      }
    },
    {
      passive: true
    }
  );
  window.addEventListener('scroll', hideChartTooltip, {
    passive: true
  });
  DOM.visibleEventList.addEventListener('click', e => {
    hideChartTooltip();
    const x = e.target.closest('[data-event-id]');
    if (!x) return;
    if (e.target.closest('[data-event-delete]')) {
      quickDeleteEvent(x.dataset.eventType, x.dataset.eventId);
      return;
    }
    openEditEntry(x.dataset.eventType, x.dataset.eventId);
  });
  $('#undo-button').addEventListener('click', runUndo);
  $('#statistics-summary').addEventListener('click', event => {
    const period = event.target.closest('[data-stat-period]');
    if (period) {
      statisticsPeriod = period.dataset.statPeriod;
      renderStatisticsSummary();
    }
  });
  // The × deletes; tapping anywhere else on the entry opens it for editing
  DOM.historyList.addEventListener('click', e => {
    const del = e.target.closest('[data-history-id]');
    if (del) return quickDeleteEvent(del.dataset.historyType, del.dataset.historyId);
    if (e.target.closest('details')) return;
    const item = e.target.closest('[data-edit-id]');
    if (item) openEditEntry(item.dataset.editType, item.dataset.editId);
  });
  DOM.historyList.addEventListener('keydown', e => {
    const item = e.target.closest('[data-edit-id]');
    if (item && e.target === item && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openEditEntry(item.dataset.editType, item.dataset.editId);
    }
  });
  DOM.historyPrev.addEventListener('click', () => {
    selectedHistoryDate = Math.max(historyEarliestDate(), shiftCalendarDay(selectedHistoryDate, -1));
    renderHistory();
  });
  DOM.historyNext.addEventListener('click', () => {
    selectedHistoryDate = Math.min(startOfDay(Date.now()), shiftCalendarDay(selectedHistoryDate, 1));
    renderHistory();
  });
  DOM.historyDateInput.addEventListener('change', () => {
    const ts = new Date(`${DOM.historyDateInput.value}T00:00:00`).getTime();
    if (Number.isFinite(ts)) {
      selectedHistoryDate = Math.max(historyEarliestDate(), Math.min(startOfDay(Date.now()), startOfDay(ts)));
      renderHistory();
    }
  });
  $('#save-profile').addEventListener('click', saveProfile);
  $$('[data-guide]').forEach(b =>
    b.addEventListener('click', () => {
      hideChartTooltip();
      openGuide(b.dataset.guide);
    })
  );
  $$('[data-sport-guide]').forEach(button =>
    button.addEventListener('click', () => {
      hideChartTooltip();
      openSportTypeGuide(button.dataset.sportGuide);
    })
  );
  $('#close-guide').addEventListener('click', () => DOM.guideModal.close());
  $('#guide-done').addEventListener('click', () => DOM.guideModal.close());
  $$('input[name="therapy"]').forEach(x => x.addEventListener('change', setTherapyUi));
  DOM.reminderEnabled.addEventListener('change', setTherapyUi);
  DOM.glucoseReminderEnabled.addEventListener('change', syncGlucoseQuietUi);
  $('#glucose-quiet-enabled').addEventListener('change', syncGlucoseQuietUi);
  $('#save-setup').addEventListener('click', saveSetup);
  DOM.converterMmol.addEventListener('input', () => updateConverter('mmol'));
  DOM.converterMg.addEventListener('input', () => updateConverter('mg'));
  DOM.converterPresets.addEventListener('click', event => {
    const preset = event.target.closest('[data-conv]');
    if (!preset) return;
    DOM.converterMmol.value = decimal(Number(preset.dataset.conv), 1);
    updateConverter('mmol');
  });
  DOM.toggleActiveDoses.addEventListener('click', () => {
    showAllActiveDoses = !showAllActiveDoses;
    renderActiveInsulin();
  });
  addEventListener(
    'resize',
    () => {
      hideChartTooltip();
      if (resizeFrame) {
        cancelAnimationFrame(resizeFrame);
      }
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        chartShouldScrollToLatest = true;
        renderTimelineGraph();
      });
    },
    {
      passive: true
    }
  );
  setupBottomNavScroll();
}

let reportDays = 14;

function reportNumber(value, digits = 1) {
  return value === null || value === undefined || !Number.isFinite(value)
    ? '—'
    : new Intl.NumberFormat(locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}
function reportGlucose(mmol) {
  if (mmol === null || !Number.isFinite(mmol)) return '—';
  return getGlucoseUnit() === 'mg' ? String(Math.round(mmolToMg(mmol))) : reportNumber(mmol);
}

function buildDoctorReport(days) {
  const now = Date.now();
  const start = shiftCalendarDay(startOfDay(now), -(days - 1));
  const inRange = x => x.timestamp >= start && x.timestamp <= now;
  const readings = glucoseHistory.filter(inRange);
  const insulin = insulinLog.filter(inRange);
  const foods = foodLog.filter(inRange);
  const values = readings.map(x => x.value);
  // A loop, not Math.min(...values): a 1-minute CGM gives ~130 000 readings in 90 days, too many function arguments
  const lowest = values.length ? values.reduce((a, b) => (b < a ? b : a)) : null,
    highest = values.length ? values.reduce((a, b) => (b > a ? b : a)) : null;
  const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const sd = values.length > 1 ? Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1)) : null;
  const cv = mean && sd !== null ? (sd / mean) * 100 : null;
  const readingDays = new Set(readings.map(x => startOfDay(x.timestamp)));
  const tir = timeInRange(readings);
  const lows = readings.filter(x => x.value < 3.9).sort((a, b) => b.timestamp - a.timestamp);
  const veryHighCount = readings.filter(x => x.value > 13.9).length;
  const settings = getSettings();
  const profile = readJSON('debo-profile', {});
  const session = getSession();
  const unit = glucoseUnitText();
  const dayKeys = [...new Set([...readings, ...insulin, ...foods].map(x => startOfDay(x.timestamp)))].sort((a, b) => b - a);
  const rows = dayKeys.map(day => {
    const end = endOfDay(day);
    const inDay = x => x.timestamp >= day && x.timestamp <= end;
    const dayReadings = readings.filter(inDay).map(x => x.value);
    const dayInsulin = insulin.filter(inDay);
    const rapid = dayInsulin.filter(x => x.type === 'rapid').reduce((sum, x) => sum + Number(x.amount || 0), 0);
    const basal = dayInsulin.filter(x => x.type !== 'rapid').reduce((sum, x) => sum + Number(x.amount || 0), 0);
    const carbs = foods.filter(inDay).reduce((sum, x) => sum + Number(x.carbs || 0), 0);
    const avg = dayReadings.length ? dayReadings.reduce((a, b) => a + b, 0) / dayReadings.length : null;
    return {
      day,
      count: dayReadings.length,
      avg,
      min: dayReadings.length ? Math.min(...dayReadings) : null,
      max: dayReadings.length ? Math.max(...dayReadings) : null,
      rapid,
      basal,
      carbs
    };
  });
  const loggedDays = Math.max(1, dayKeys.length);
  const totalRapid = rows.reduce((s, r) => s + r.rapid, 0),
    totalBasal = rows.reduce((s, r) => s + r.basal, 0),
    totalCarbs = rows.reduce((s, r) => s + r.carbs, 0);
  const therapy = settings.therapy === 'pump' ? t('pumpSummary') : t('penSummary');
  const insulins = [
    settings.rapid && `${t('rapidInsulin')}: ${settings.rapid}`,
    settings.therapy !== 'pump' && settings.long && `${t('longInsulin')}: ${settings.long}`
  ]
    .filter(Boolean)
    .join(' · ');
  const stat = (label, value, note = '') =>
    `<div class="rp-stat"><span>${label}</span><strong>${value}</strong>${note ? `<small>${note}</small>` : ''}</div>`;
  const body = `
    <header class="rp-header">
      <div><h1>${t('reportTitle')}</h1><p>${escapeHtml(profile.name || session?.name || '')}${session?.email ? ` · ${escapeHtml(session.email)}` : ''}</p></div>
      <div class="rp-meta"><span>${t('reportPeriod')}: ${escapeHtml(formatDateOnly(start))} – ${escapeHtml(formatDateOnly(now))}</span><span>${t('reportGenerated')}: ${escapeHtml(formatDateOnly(now))}</span></div>
    </header>
    <section class="rp-section"><h2>${t('reportTherapy')}</h2><p>${escapeHtml(therapy)}${insulins ? ` · ${escapeHtml(insulins)}` : ''}</p></section>
    <section class="rp-section"><h2>${t('reportGlucose')}</h2>
      <div class="rp-stats">
        ${stat(t('reportAverage'), `${reportGlucose(mean)} ${unit}`)}
        ${stat(t('reportVariability'), cv === null ? '—' : `${reportNumber(cv, 0)}%`)}
        ${stat(t('reportReadings'), `${readings.length}`, t('reportDaysWithReadings').replace('{n}', readingDays.size))}
      </div>
      ${(() => {
        const profile = agpProfile(readings);
        if (!profile) return '';
        return `<div class="rp-agp"><h3>${t('agpTitle')}</h3>${agpSvg(profile)}<p class="rp-small">${t('agpMedian')} · 25–75 % · 10–90 %</p></div>`;
      })()}
      ${
        tir.total
          ? `<div class="rp-tir"><div class="tir-bar">${tirBands()
              .map(band => `<i class="tir-${band.key}" style="flex-basis:${tir.pct[band.key]}%"></i>`)
              .join('')}</div><table class="rp-table"><tbody>${tirBands()
              .slice()
              .reverse()
              .map(
                band =>
                  `<tr><td><span class="tir-dot tir-${band.key}"></span>${escapeHtml(band.label)} <small>${escapeHtml(band.range)}</small></td><td class="num">${tir.pct[band.key]}%</td></tr>`
              )
              .join('')}</tbody></table></div>`
          : `<p class="rp-small">${t('tirNoData')}</p>`
      }
    </section>
    <section class="rp-section"><h2>${t('reportEvents')}</h2>
      <div class="rp-stats">
        ${stat(t('reportLows'), String(lows.length), `< ${reportGlucose(3.9)} ${unit}`)}
        ${stat(t('reportLowest'), values.length ? `${reportGlucose(lowest)} ${unit}` : '—')}
        ${stat(t('reportVeryHighs'), String(veryHighCount), `> ${reportGlucose(13.9)} ${unit}`)}
        ${stat(t('reportHighest'), values.length ? `${reportGlucose(highest)} ${unit}` : '—')}
      </div>
      ${
        lows.length
          ? `<p class="rp-small"><strong>${t('reportLowList')}:</strong> ${lows
              .slice(0, 12)
              .map(
                x =>
                  `${escapeHtml(new Intl.DateTimeFormat(locale(), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(x.timestamp)))} (${reportGlucose(x.value)})`
              )
              .join(', ')}${lows.length > 12 ? ' …' : ''}</p>`
          : ''
      }
    </section>
    <section class="rp-section"><h2>${t('reportInsulinFood')}</h2>
      <div class="rp-stats">
        ${stat(t('reportAvgRapid'), `${reportNumber(totalRapid / loggedDays)} ${t('unitU')}`)}
        ${stat(t('reportAvgBasal'), `${reportNumber(totalBasal / loggedDays)} ${t('unitU')}`)}
        ${stat(t('reportAvgCarbs'), `${reportNumber(totalCarbs / loggedDays, 0)} g`)}
      </div>
    </section>
    <section class="rp-section"><h2>${t('reportDaily')}</h2>
      ${rows.length ? `<table class="rp-table rp-daily"><thead><tr><th>${t('reportDate')}</th><th class="num">${t('reportAvgShort')}</th><th class="num">${t('reportMinMax')}</th><th class="num">${t('reportRapidShort')}</th><th class="num">${t('reportBasalShort')}</th><th class="num">${t('reportCarbsShort')}</th></tr></thead><tbody>${rows.map(r => `<tr><td>${escapeHtml(new Intl.DateTimeFormat(locale(), { month: 'short', day: 'numeric', weekday: 'short' }).format(new Date(r.day)))}</td><td class="num">${r.avg === null ? '—' : `${reportGlucose(r.avg)} <small>(${r.count})</small>`}</td><td class="num">${r.min === null ? '—' : `${reportGlucose(r.min)}–${reportGlucose(r.max)}`}</td><td class="num">${r.rapid ? reportNumber(r.rapid) : '—'}</td><td class="num">${r.basal ? reportNumber(r.basal) : '—'}</td><td class="num">${r.carbs ? reportNumber(r.carbs, 0) : '—'}</td></tr>`).join('')}</tbody></table>` : `<p class="rp-small">${t('reportNoData')}</p>`}
    </section>
    <p class="rp-disclaimer">${t('reportDisclaimer')}</p>`;
  return body;
}

const REPORT_STYLES = `
  .rp{font-family:"Nunito","Roboto",-apple-system,"Segoe UI",sans-serif;color:#1F2D2B;font-size:13px;line-height:1.45}
  .rp h1{margin:0;font-size:22px}.rp h2{margin:0 0 8px;font-size:15px;color:#2E7466}
  .rp-header{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-bottom:10px;border-bottom:2px solid #2E7466}
  .rp-header p{margin:2px 0 0;color:#5C6C68}.rp-meta{display:grid;gap:2px;color:#5C6C68;font-size:12px;text-align:right}
  .rp-section{margin-top:14px;break-inside:avoid}
  .rp-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}
  .rp-stat{display:grid;gap:2px;padding:8px 10px;border:1px solid #E1E8E3;border-radius:10px}
  .rp-stat span{color:#5C6C68;font-size:11px}.rp-stat strong{font-size:16px}.rp-stat small{color:#8A9894;font-size:10.5px}
  .rp-small{margin:8px 0 0;color:#3D4B49;font-size:12px}
  .rp-table{width:100%;margin-top:8px;border-collapse:collapse;font-size:12px}
  .rp-table th,.rp-table td{padding:5px 6px;border-bottom:1px solid #E1E8E3;text-align:left;vertical-align:top}
  .rp-table th{color:#5C6C68;font-size:11px;font-weight:700}.rp-table .num{text-align:right;white-space:nowrap}
  .rp-table small{color:#8A9894}
  .rp-goal{font-size:11px}.rp-goal.met{color:#2E7466}.rp-goal.missed{color:#B87C17}
  .rp .tir-bar{display:flex;height:14px;overflow:hidden;border-radius:999px;background:#EEF3EF}
  .rp .tir-bar i{display:block;height:100%}
  .rp .tir-veryLow{background:#B23A48}.rp .tir-low{background:#E08A8F}.rp .tir-range{background:#4FA78E}.rp .tir-high{background:#E3B35A}.rp .tir-veryHigh{background:#C0782A}
  .rp .tir-dot{display:inline-block;width:9px;height:9px;margin-right:6px;border-radius:50%}
  .rp-disclaimer{margin-top:16px;color:#8A9894;font-size:10.5px}
  .rp-agp{margin-top:12px}.rp-agp h3{margin:0 0 4px;font-size:13px;color:#3D4B49}
  .rp .agp-svg{display:block;width:100%;max-width:520px;height:auto}
  .rp .agp-target{fill:#E5F2EC}.rp .agp-grid{stroke:#CFDAD4;stroke-width:1}.rp .agp-grid-low{stroke:#E08A8F}
  .rp .agp-outer{fill:#4F86BC;opacity:.18}.rp .agp-inner{fill:#4F86BC;opacity:.38}.rp .agp-median{fill:none;stroke:#1F4F7A;stroke-width:2;stroke-linejoin:round}
  .rp .agp-axis{fill:#5C6C68;font-size:9px}
`;

function reportDocument() {
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(t('reportTitle'))}</title><style>@page{margin:14mm}body{margin:0;background:#fff}${REPORT_STYLES}</style></head><body><div class="rp">${buildDoctorReport(reportDays)}</div></body></html>`;
}

function renderReportPreview() {
  const preview = $('#report-preview');
  if (!preview) return;
  preview.innerHTML = `<div class="rp">${buildDoctorReport(reportDays)}</div>`;
  $$('[data-report-days]').forEach(button => {
    const active = Number(button.dataset.reportDays) === reportDays;
    button.textContent = t('reportDays').replace('{n}', button.dataset.reportDays);
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function openDoctorReport() {
  renderReportPreview();
  $('#report-modal').showModal();
}

function printDoctorReport() {
  const html = reportDocument();
  const title = `${t('reportTitle')} ${new Date().toISOString().slice(0, 10)}`;
  if (window.AndroidPrint?.print) {
    try {
      window.AndroidPrint.print(html, title);
      return;
    } catch {}
  }
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(frame);
  frame.srcdoc = html;
  frame.onload = () => {
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch {
      toast(t('reportPrintFailed'));
    }
    setTimeout(() => frame.remove(), 60000);
  };
}

function bindReportEvents() {
  document.head.insertAdjacentHTML('beforeend', `<style>${REPORT_STYLES}</style>`);
  $$('[data-open-report]').forEach(button => button.addEventListener('click', openDoctorReport));
  $$('[data-report-days]').forEach(button =>
    button.addEventListener('click', () => {
      reportDays = Number(button.dataset.reportDays);
      renderReportPreview();
    })
  );
  $('#report-print')?.addEventListener('click', printDoctorReport);
}

function openHistoryModal() {
  const modal = $('#history-modal');
  if (!modal) return;
  renderHistory();
  if (!modal.open) modal.showModal();
}
function bindHistoryModal() {
  $('#close-history')?.addEventListener('click', () => $('#history-modal').close());
  $$('[data-open-history]').forEach(button => button.addEventListener('click', openHistoryModal));
}

const BACKUP_FORMAT = 'debo-backup';
// Backups made before the rename to Debo still restore
const BACKUP_FORMATS = [BACKUP_FORMAT, 'gliukis-backup'];
const BACKUP_SETTINGS_KEYS = ['debo-profile', 'gluco-insulin-setup', 'debo-favorite-meals', 'debo-custom-reminders', 'debo-care-log', 'debo-care-settings', 'debo-supplies', 'debo-exercise-log'];
function renderBackupStats() {
  const box = $('#backup-stats');
  if (!box) return;
  const items = [
    [glucoseHistory.length, t('glucose')],
    [insulinLog.length, t('backupInsulin')],
    [foodLog.length, t('backupFood')]
  ];
  box.innerHTML = items.map(([n, label]) => `<div><strong>${n}</strong><small>${escapeHtml(label)}</small></div>`).join('');
}
function openBackup() {
  renderBackupStats();
  const modal = $('#backup-modal');
  if (!modal.open) modal.showModal();
}
function buildBackup() {
  const settings = {};
  BACKUP_SETTINGS_KEYS.forEach(key => {
    const value = readJSON(key, null);
    if (value !== null) settings[key] = value;
  });
  return {
    format: BACKUP_FORMAT,
    version: 1,
    createdAt: new Date().toISOString(),
    glucose: glucoseHistory,
    insulin: insulinLog,
    food: foodLog,
    settings
  };
}
function backupFileName() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `debo-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}
function exportBackup() {
  const text = JSON.stringify(buildBackup());
  const name = backupFileName();
  if (window.AndroidFiles?.saveText) {
    try {
      window.AndroidFiles.saveText(name, 'application/json', text);
      return;
    } catch {}
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast(t('backupSaved'));
}
window.onFileSaved = function (result) {
  if (result === 'ok') toast(t('backupSaved'));
  else if (result !== 'cancel') toast(t('backupSaveFailed'));
};
// A backup file can be edited by hand: ids and type-like fields end up in HTML attributes, so keep them to safe characters
const IMPORT_NUMBER_KEYS = ['timestamp', 'value', 'amount', 'carbs', 'protein', 'fat', 'minutes', 'weight', 'grams', 'kcal'];
const IMPORT_TOKEN_KEYS = ['type', 'intensity', 'kind', 'source', 'mealType', 'substance', 'sport'];
const safeToken = v => String(v ?? '').replace(/[^\w.:-]/g, '');
function cleanImportedEntry(entry, prefix) {
  const clean = { ...entry, id: safeToken(entry.id) || createId(prefix) };
  IMPORT_NUMBER_KEYS.forEach(key => {
    if (clean[key] != null && clean[key] !== '') clean[key] = Number(clean[key]);
  });
  IMPORT_TOKEN_KEYS.forEach(key => {
    if (typeof clean[key] === 'string') clean[key] = safeToken(clean[key]);
  });
  return clean;
}
function cleanImportedIds(value) {
  if (Array.isArray(value)) return value.map(cleanImportedIds);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  Object.entries(value).forEach(([key, v]) => (out[key] = key === 'id' ? safeToken(v) : cleanImportedIds(v)));
  return out;
}
function mergeEntries(current, incoming, valid) {
  const ids = new Set(current.map(x => x.id));
  const keys = new Set(current.map(x => `${x.timestamp}|${x.value ?? x.amount ?? x.carbs}`));
  const added = [];
  (Array.isArray(incoming) ? incoming : []).forEach(entry => {
    if (!entry || typeof entry !== 'object' || !Number.isFinite(Number(entry.timestamp)) || !valid(entry)) return;
    const key = `${entry.timestamp}|${entry.value ?? entry.amount ?? entry.carbs}`;
    if (ids.has(entry.id) || keys.has(key)) return;
    ids.add(entry.id);
    keys.add(key);
    added.push(cleanImportedEntry(entry, 'import'));
  });
  return added;
}
function importBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return toast(t('backupInvalid'));
  }
  if (!BACKUP_FORMATS.includes(data?.format)) return toast(t('backupInvalid'));
  const glucose = mergeEntries(glucoseHistory, data.glucose, x => Number.isFinite(Number(x.value)) && x.value >= 1 && x.value <= 35);
  const insulin = mergeEntries(insulinLog, data.insulin, x => Number.isFinite(Number(x.amount)) && x.amount > 0 && x.amount <= 100);
  const food = mergeEntries(foodLog, data.food, x => typeof x.name === 'string' || typeof x.nameLt === 'string');
  writeJSON(
    'debo-glucose-history',
    [...glucoseHistory, ...glucose].sort((a, b) => a.timestamp - b.timestamp)
  );
  writeJSON(
    'debo-insulin-log',
    [...insulinLog, ...insulin].sort((a, b) => a.timestamp - b.timestamp)
  );
  writeJSON(
    'debo-food-log',
    [...foodLog, ...food].sort((a, b) => a.timestamp - b.timestamp)
  );
  const settings = data.settings && typeof data.settings === 'object' ? data.settings : {};
  // Workout and device-change logs are entries, so they merge by id like the other logs
  let logged = 0;
  ['debo-exercise-log', 'debo-care-log'].forEach(key => {
    const current = readJSON(key, []);
    const ids = new Set(current.map(x => x.id));
    const added = (Array.isArray(settings[key]) ? settings[key] : [])
      .filter(x => x && typeof x === 'object' && x.id && Number.isFinite(Number(x.timestamp)))
      .map(x => cleanImportedEntry(x, 'import'))
      .filter(x => !ids.has(x.id));
    if (!added.length) return;
    writeJSON(key, [...current, ...added].sort((a, b) => a.timestamp - b.timestamp));
    logged += added.length;
  });
  BACKUP_SETTINGS_KEYS.forEach(key => {
    if (key === 'debo-exercise-log' || key === 'debo-care-log') return;
    if (localStorage.getItem(key) === null && settings[key] != null) writeJSON(key, cleanImportedIds(settings[key]));
  });
  const total = glucose.length + insulin.length + food.length + logged;
  try {
    sessionStorage.setItem('debo-import-result', String(total));
  } catch {}
  flushLogs().finally(() => location.reload());
}
function bindBackupEvents() {
  $$('[data-open-backup]').forEach(button => button.addEventListener('click', openBackup));
  $('#backup-export')?.addEventListener('click', exportBackup);
  $('#backup-import')?.addEventListener('click', () => $('#backup-file').click());
  $('#backup-file')?.addEventListener('change', event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return toast(t('backupInvalid'));
    const reader = new FileReader();
    reader.onload = () => importBackup(String(reader.result || ''));
    reader.onerror = () => toast(t('backupInvalid'));
    reader.readAsText(file);
  });
  let imported = null;
  try {
    imported = sessionStorage.getItem('debo-import-result');
    sessionStorage.removeItem('debo-import-result');
  } catch {}
  if (imported !== null)
    setTimeout(() => toast(Number(imported) ? t('backupImported').replace('{n}', imported) : t('backupNothingNew')), 400);
}

const HEALTH_KEY = 'debo-health-sync';
const HEALTH_MIN_INTERVAL = 60000;
let healthSyncing = false;
let healthManual = false;
function healthBridge() {
  return window.AndroidHealth || null;
}
function getHealthState() {
  return readJSON(HEALTH_KEY, { enabled: false, lastSync: 0, lastReading: 0, error: '' });
}
function saveHealthState(patch) {
  const next = { ...getHealthState(), ...patch };
  writeJSON(HEALTH_KEY, next);
  renderHealthSync();
  return next;
}
function healthStatus() {
  const bridge = healthBridge();
  if (!bridge) return 'noapp';
  try {
    return bridge.status();
  } catch {
    return 'unavailable';
  }
}
function formatSyncAgo(ts) {
  if (!ts) return '';
  const minutes = Math.round((Date.now() - ts) / 60000);
  if (minutes < 1) return t('cgmJustNow');
  if (minutes < 60) return t('cgmMinutesAgo').replace('{n}', minutes);
  const date = new Date(ts);
  return date.toLocaleString(locale(), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function renderHealthSync() {
  const box = $('#cgm-sync');
  if (!box) return;
  const state = getHealthState();
  const status = healthStatus();
  const connected = state.enabled && status === 'granted';
  const supported = status === 'available' || status === 'granted';
  let text;
  if (status === 'noapp') text = t('cgmNoApp');
  else if (status === 'unsupported') text = t('cgmUnsupported');
  else if (status === 'unavailable') text = t('cgmUnavailable');
  else if (status === 'install') text = t('cgmInstall');
  else if (state.enabled && status !== 'granted') text = t('cgmPermissionLost');
  else if (healthSyncing) text = t('cgmSyncing');
  else if (connected && state.error) text = t('cgmReadError');
  else if (connected)
    text = state.lastSync
      ? `${t('cgmLastSync')}: ${formatSyncAgo(state.lastSync)}${state.lastReading ? ` · ${t('cgmLastReading')}: ${formatSyncAgo(state.lastReading)}` : ''}`
      : t('cgmConnected');
  else text = t('cgmOff');
  $('#cgm-status').textContent = text;
  box.classList.toggle('is-on', connected && !state.error);
  box.classList.toggle('is-error', (state.enabled && status !== 'granted') || (connected && !!state.error));
  $('#cgm-connect').hidden = connected || !(supported || status === 'install');
  $('#cgm-connect').textContent = status === 'install' ? t('cgmInstallButton') : t('cgmConnect');
  $('#cgm-sync-now').hidden = !connected;
  $('#cgm-sync-now').disabled = healthSyncing;
  $('#cgm-disconnect').hidden = !state.enabled;
  $('#cgm-permissions').hidden = !supported;
  const bgVisible = connected && !!healthBgStatus && healthBgStatus !== 'unsupported';
  $('#cgm-background-row').hidden = !bgVisible;
  $('#cgm-background-note').hidden = !bgVisible;
  $('#cgm-background').checked = bgVisible && !!state.background && healthBgStatus === 'granted';
}
let healthBgStatus = null;
let lastBackgroundConfig = '';
function refreshBackgroundStatus() {
  const bridge = healthBridge();
  if (!bridge?.backgroundStatus || !getHealthState().enabled) {
    renderHealthSync();
    return;
  }
  setTimeout(() => {
    try {
      healthBgStatus = bridge.backgroundStatus();
    } catch {
      healthBgStatus = 'unsupported';
    }
    renderHealthSync();
    configureBackgroundSync();
  }, 0);
}
function configureBackgroundSync() {
  const bridge = healthBridge();
  if (!bridge?.configureBackground) return;
  const state = getHealthState();
  const config = {
    enabled: !!(state.enabled && state.background && getSession()),
    alerts: false,
    unit: getGlucoseUnit(),
    decimalComma: language !== 'en',
    strings: {
      unit: glucoseUnitText(),
      stale: t('readingStale'),
      trendStable: t('trendStable'),
      trendRisingSlow: t('trendRisingSlow'),
      trendRising: t('trendRising'),
      trendRisingFast: t('trendRisingFast'),
      trendFallingSlow: t('trendFallingSlow'),
      trendFalling: t('trendFalling'),
      trendFallingFast: t('trendFallingFast')
    }
  };
  const json = JSON.stringify(config);
  if (json === lastBackgroundConfig) return;
  lastBackgroundConfig = json;
  try {
    bridge.configureBackground(json);
  } catch {}
}
function toggleBackground(event) {
  const bridge = healthBridge();
  if (!event.target.checked) {
    saveHealthState({ background: false });
    configureBackgroundSync();
    return;
  }
  if (healthBgStatus === 'granted') {
    saveHealthState({ background: true });
    configureBackgroundSync();
    toast(t('bgEnabled'));
    return;
  }
  event.target.checked = false;
  try {
    bridge.requestBackgroundPermission();
  } catch {
    toast(t('bgDenied'));
  }
}
window.onHealthBackgroundPermission = function (status) {
  healthBgStatus = status;
  if (status === 'granted') {
    saveHealthState({ background: true });
    configureBackgroundSync();
    toast(t('bgEnabled'));
  } else {
    saveHealthState({ background: false });
    configureBackgroundSync();
    toast(status === 'unsupported' ? t('bgUnsupported') : t('bgDenied'));
  }
};
function connectHealth() {
  const bridge = healthBridge();
  if (!bridge) return toast(t('cgmNoApp'));
  const status = healthStatus();
  if (status === 'unsupported') return toast(t('cgmUnsupported'));
  if (status === 'unavailable') return toast(t('cgmUnavailable'));
  if (status === 'install') {
    try {
      bridge.install();
    } catch {}
    return;
  }
  saveHealthState({ enabled: true, error: '' });
  if (status === 'granted') return syncHealth(true);
  try {
    bridge.requestPermission();
  } catch {
    toast(t('cgmUnavailable'));
  }
}
function disconnectHealth() {
  saveHealthState({ enabled: false, error: '' });
  configureBackgroundSync();
  toast(t('cgmDisabled'));
}
function syncHealth(manual = false) {
  const bridge = healthBridge();
  const state = getHealthState();
  if (!bridge || !state.enabled || healthSyncing) return;
  if (healthStatus() !== 'granted') {
    renderHealthSync();
    return;
  }
  if (!manual && Date.now() - (state.lastSync || 0) < HEALTH_MIN_INTERVAL) return;
  healthSyncing = true;
  healthManual = manual;
  renderHealthSync();
  const since = state.lastReading ? state.lastReading - 6 * 60 * 60 * 1000 : Date.now() - 30 * 24 * 60 * 60 * 1000;
  try {
    bridge.readGlucose(since);
  } catch {
    window.onHealthGlucose(JSON.stringify({ ok: false, error: 'read' }));
  }
}
function importHealthReadings(records) {
  const known = new Set(glucoseHistory.filter(x => x.hcId).map(x => x.hcId));
  // Older readings no longer keep their Health Connect id (see compactHealthReadings): match those by time instead
  const knownTimes = new Set(glucoseHistory.filter(x => x.source === 'healthconnect' && !x.hcId).map(x => x.timestamp));
  const added = [];
  records.forEach(record => {
    const mmol = Math.round(Number(record.mmol) * 10) / 10;
    const ts = Number(record.ts);
    const id = String(record.id || `${ts}-${mmol}`);
    if (known.has(id) || knownTimes.has(ts) || !Number.isFinite(mmol) || !Number.isFinite(ts) || mmol < 1 || mmol > 35 || ts > Date.now() + 60000) return;
    known.add(id);
    added.push({ id: createId('glucose'), value: mmol, timestamp: ts, source: 'healthconnect', hcId: id });
  });
  if (!added.length) return added;
  glucoseHistory.push(...added);
  glucoseHistory.sort((a, b) => a.timestamp - b.timestamp);
  writeJSON('debo-glucose-history', glucoseHistory);
  syncNativeReminders();
  chartShouldScrollToLatest = true;
  renderCurrentGlucose();
  renderTimelineGraph();
  renderHistory();
  return added;
}
window.onHealthPermission = function (result) {
  if (result === 'granted') {
    saveHealthState({ enabled: true, error: '' });
    refreshBackgroundStatus();
    toast(t('cgmConnectedToast'));
    syncHealth(true);
  } else {
    saveHealthState({ enabled: false });
    toast(result === 'unsupported' ? t('cgmUnsupported') : result === 'install' ? t('cgmInstall') : t('cgmDenied'));
  }
};
window.onHealthGlucose = function (raw) {
  if (!logsReady) return void logsLoaded.then(() => window.onHealthGlucose(raw));
  healthSyncing = false;
  const manual = healthManual;
  healthManual = false;
  let data;
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    data = { ok: false };
  }
  if (!data?.ok) {
    saveHealthState({ error: data?.error || 'read' });
    if (manual) toast(data?.error === 'permission' ? t('cgmPermissionLost') : t('cgmReadError'));
    return;
  }
  const added = importHealthReadings(Array.isArray(data.records) ? data.records : []);
  const newest = added.reduce((max, x) => Math.max(max, x.timestamp), getHealthState().lastReading || 0);
  saveHealthState({ lastSync: Date.now(), lastReading: newest, error: '' });
  if (manual) toast(added.length ? t('cgmImported').replace('{n}', added.length) : t('cgmNothingNew'));
};
window.onAppResume = function () {
  if (!logsReady) return;
  renderHealthSync();
  syncHealth(false);
};
function bindHealthEvents() {
  $('#cgm-connect')?.addEventListener('click', connectHealth);
  $('#cgm-sync-now')?.addEventListener('click', () => syncHealth(true));
  $('#cgm-disconnect')?.addEventListener('click', disconnectHealth);
  $('#cgm-permissions')?.addEventListener('click', () => {
    try {
      healthBridge()?.openSettings();
    } catch {}
  });
  $('#cgm-background')?.addEventListener('change', toggleBackground);
  refreshBackgroundStatus();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      refreshBackgroundStatus();
      syncHealth(false);
    }
  });
  setInterval(() => syncHealth(false), 5 * 60 * 1000);
  renderHealthSync();
  syncHealth(false);
}

/* Gestures: swipe sheets down to close, swipe the week strip, long-press chart entries to delete */
function bindGestures() {
  const ignore = target => target.closest('input,select,textarea,.chart-scroll,.visible-event-list,.sport-chips');
  $$('dialog').forEach(dialog => {
    const card = dialog.firstElementChild;
    if (!card) return;
    let startX = 0,
      startY = 0,
      dy = 0,
      tracking = false;
    card.addEventListener(
      'touchstart',
      event => {
        if (card.scrollTop > 0 || ignore(event.target)) {
          tracking = false;
          return;
        }
        const touch = event.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        dy = 0;
        tracking = true;
        card.style.transition = 'none';
      },
      { passive: true }
    );
    card.addEventListener(
      'touchmove',
      event => {
        if (!tracking) return;
        const touch = event.touches[0],
          dx = touch.clientX - startX;
        dy = touch.clientY - startY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
          tracking = false;
          card.style.transform = '';
          return;
        }
        if (dy > 0) card.style.transform = `translateY(${dy}px)`;
      },
      { passive: true }
    );
    card.addEventListener('touchend', () => {
      if (!tracking) return;
      tracking = false;
      card.style.transition = '';
      if (dy > 110) dialog.close();
      card.style.transform = '';
    });
    dialog.addEventListener('close', () => {
      card.style.transform = '';
      card.style.transition = '';
    });
  });
  const month = $('#cal-grid');
  let monthX = 0,
    monthY = 0;
  month.addEventListener(
    'touchstart',
    event => {
      monthX = event.touches[0].clientX;
      monthY = event.touches[0].clientY;
    },
    { passive: true }
  );
  month.addEventListener('touchend', event => {
    const touch = event.changedTouches[0],
      dx = touch.clientX - monthX,
      dy = touch.clientY - monthY;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0 && !$('#cal-prev').disabled) $('#cal-prev').click();
    else if (dx < 0 && !$('#cal-next').disabled) $('#cal-next').click();
  });
  const events = DOM.visibleEventList;
  let pressTimer = 0,
    pressStart = null,
    longPressed = false;
  const cancelPress = () => {
    clearTimeout(pressTimer);
    pressTimer = 0;
    pressStart = null;
  };
  events.addEventListener('pointerdown', event => {
    const pill = event.target.closest('[data-event-id]');
    if (!pill) return;
    longPressed = false;
    pressStart = { x: event.clientX, y: event.clientY };
    pill.classList.add('pressing');
    pressTimer = setTimeout(() => {
      longPressed = true;
      pill.classList.remove('pressing');
      try {
        navigator.vibrate?.(18);
      } catch {}
      quickDeleteEvent(pill.dataset.eventType, pill.dataset.eventId);
    }, 550);
  });
  events.addEventListener('pointermove', event => {
    if (pressStart && Math.hypot(event.clientX - pressStart.x, event.clientY - pressStart.y) > 10) {
      cancelPress();
      $$('.event-pill.pressing').forEach(p => p.classList.remove('pressing'));
    }
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(type =>
    events.addEventListener(type, () => {
      cancelPress();
      $$('.event-pill.pressing').forEach(p => p.classList.remove('pressing'));
    })
  );
  events.addEventListener(
    'click',
    event => {
      if (longPressed) {
        event.stopImmediatePropagation();
        event.preventDefault();
        longPressed = false;
      }
    },
    true
  );
  events.addEventListener('contextmenu', event => {
    if (event.target.closest('[data-event-id]')) event.preventDefault();
  });
}

function clearRemovedFeatureState() {
  ['debo-hypo-session', 'debo-hyper-session', 'debo-hypo-source', 'debo-carb-ratios'].forEach(key => localStorage.removeItem(key));
  [4115, 4118, 4119].forEach(id => {
    try {
      window.AndroidReminders?.cancel?.(id);
    } catch {}
  });
}

/* ---------- Notes, favorite meals, first-launch intro, weekly summary, custom reminders ---------- */

function entryExtras() {
  const note = ($('#entry-note')?.value || '').trim().slice(0, 140);
  return note ? { note } : {};
}

const FAVORITES_KEY = 'debo-favorite-meals';
const mealLabelKey = type => ({ breakfast: 'mealBreakfast', lunch: 'mealLunch', dinner: 'mealDinner' })[type] || 'mealSnack';
const favoriteMeals = () => readJSON(FAVORITES_KEY, []);
// Logged foods keep their Lithuanian and English names; other languages look up the catalogue translation,
// unless the user renamed the entry (renaming clears both stored names)
const foodEntryName = x => {
  if (language === 'lt') return x.nameLt || x.name;
  if (language === 'en' || (!x.nameLt && !x.nameEn)) return x.nameEn || x.name;
  return (x.foodId && foodCatalog.find(f => f.id === x.foodId)?.[language]) || x.nameEn || x.name;
};
const mealSignature = items => items.map(i => `${i.nameLt || i.name}|${i.amount}`).sort().join(',');

function todaysMeal(type) {
  const start = startOfDay(Date.now());
  return foodLog.filter(x => x.timestamp >= start && (x.mealType || 'snack') === type);
}

function favoritesHtml() {
  const type = $('#food-meal-type')?.value || 'snack';
  const today = todaysMeal(type);
  const favs = favoriteMeals();
  const canSave = today.length && !favs.some(f => mealSignature(f.items) === mealSignature(today));
  const save = canSave ? `<button class="fav-save" type="button" data-fav-save>☆ ${escapeHtml(t('favSave').replace('{meal}', t(mealLabelKey(type)).toLowerCase()))}</button>` : '';
  if (!favs.length) return save;
  return (
    save +
    `<p class="food-recent-title">${t('favoritesTitle')}</p>` +
    favs
      .map(
        f => `<div class="fav-row"><button class="food-search-item" type="button" data-fav-log="${f.id}"><span><strong>${escapeHtml(f.items.map(foodEntryName).join(', '))}</strong><small>${t(mealLabelKey(f.mealType))} · ${f.items.length} ${t('entriesShort')}</small></span><b>${decimal(f.items.reduce((sum, i) => sum + Number(i.carbs || 0), 0), 1)} g<small>${t('carbsShort')}</small></b></button><button class="fav-delete" type="button" data-fav-del="${f.id}" aria-label="${t('favDelete')}">×</button></div>`
      )
      .join('')
  );
}

function saveFavoriteMeal() {
  const type = $('#food-meal-type')?.value || 'snack';
  const items = todaysMeal(type).map(({ foodId, name, nameLt, nameEn, amount, unit, portionLabel, carbs, protein, fat, gi }) => ({ foodId, name, nameLt, nameEn, amount, unit, portionLabel, carbs, protein, fat, gi }));
  if (!items.length) return;
  writeJSON(FAVORITES_KEY, [{ id: createId('fav'), mealType: type, items }, ...favoriteMeals()].slice(0, 20));
  toast(t('favSaved'));
  renderFoodSearch();
}

function logFavoriteMeal(id) {
  const fav = favoriteMeals().find(f => f.id === id);
  if (!fav) return;
  const mealType = $('#food-meal-type')?.value || fav.mealType;
  const at = foodTimestamp($('#food-time'));
  if (!Number.isFinite(at)) return toast(t('chooseTime'));
  fav.items.forEach((item, i) => foodLog.push({ ...item, id: createId('food'), name: foodEntryName(item), mealType, timestamp: at + i, ...entryExtras() }));
  foodLog.sort((a, b) => a.timestamp - b.timestamp);
  writeJSON('debo-food-log', foodLog);
  schedulePostMealReminder(at);
  renderHistory();
  DOM.entryModal.close();
  toast(t('favLogged').replace('{n}', fav.items.length));
  try {
    navigator.vibrate?.(12);
  } catch {}
}

// Each slide's illustration is built from the app's own elements: logo, glucose card, guides
const INTRO_ICONS = {
  drop: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  fork: '<path d="M4.5 2v6a3 3 0 0 0 6 0V2M7.5 2v20M19 22V2c-2.2 1.4-3.5 4.2-3.5 8v2.5c0 .8.7 1.5 1.5 1.5H19"/>',
  pen: '<path d="m18 2 4 4M17 7l3-3M19 9 8.7 19.3c-.9.9-2.5.9-3.4 0l-.6-.6c-.9-.9-.9-2.5 0-3.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>'
};
const introIcon = name => `<svg viewBox="0 0 24 24">${INTRO_ICONS[name]}</svg>`;
const INTRO_SLIDES = [
  {
    title: 'intro1Title',
    text: 'intro1Text',
    art: () =>
      `<div class="intro-logo"><svg viewBox="0 0 128 128"><path d="M30 22H60C86 22 104 40 104 64.5C104 89 86 107 60 107H30Z"/><path d="M104 68H88C81 68 79 62 73 62C66 62 65 75 58 75H49"/><circle cx="49" cy="75" r="6.5"/></svg></div>` +
      `<div class="intro-pills"><span>${introIcon('drop')}${t('glucose')}</span><span>${introIcon('fork')}${t('food')}</span><span>${introIcon('pen')}${t('insulin')}</span></div>`
  },
  {
    title: 'intro2Title',
    text: 'intro2Text',
    art: () =>
      `<div class="intro-mock"><div class="intro-mock-head"><span>${introIcon('drop')}${t('glucose')}</span><b>+</b></div><strong>6,4<small>mmol/L</small></strong><i class="intro-mock-strip"></i></div>` +
      `<div class="intro-pills"><span>☆ ${t('favoritesTitle')}</span></div>`
  },
  {
    title: 'intro3Title',
    text: 'intro3Text',
    art: () => `<div class="intro-shield">${introIcon('shield')}</div>`
  },
  {
    title: 'intro4Title',
    text: 'intro4Text',
    art: () => introSetupHtml()
  }
];
// The last slide asks for therapy and units so the app is ready before the first entry
let introChoices = null;
function introSetupHtml() {
  const group = (label, key, values) =>
    `<div class="intro-choice"><span>${escapeHtml(label)}</span><div class="intro-segment">${values
      .map(([value, text]) => `<button type="button" class="${introChoices[key] === value ? 'active' : ''}" data-intro-choice="${key}" data-value="${value}" aria-pressed="${introChoices[key] === value}">${escapeHtml(text)}</button>`)
      .join('')}</div></div>`;
  return (
    group(t('introTherapyQ'), 'therapy', [['injections', t('penTherapy')], ['pump', t('pumpTherapy')]]) +
    group(t('glucoseUnit'), 'unit', [['mmol', 'mmol/L'], ['mg', 'mg/dL']])
  );
}

function afterIntroSetup() {
  if (introChoices?.confirmed) {
    const radio = $(`input[name="therapy"][value="${introChoices.therapy}"]`);
    if (radio) radio.checked = true;
    DOM.glucoseUnitSelect.value = introChoices.unit;
    setTherapyUi();
    // Guests have nothing else required, so their settings are saved straight away
    if (getSession()?.mode !== 'account') return saveSetup();
  }
  DOM.setupModal.showModal();
}
let introStep = 0,
  introNext = null;

function showIntroThen(next) {
  let seen = false;
  try {
    seen = localStorage.getItem('debo-intro-done') === '1';
  } catch {}
  if (seen) return next();
  const settings = getSettings();
  // mg/dL is the usual unit in Poland and Germany
  introChoices = { therapy: settings.therapy || 'injections', unit: settings.glucoseUnit || (['pl', 'de'].includes(language) ? 'mg' : 'mmol'), confirmed: false };
  introStep = 0;
  introNext = next;
  renderIntro();
  $('#intro-modal').showModal();
}

function renderIntro() {
  const slide = INTRO_SLIDES[introStep];
  $('#intro-art').innerHTML = slide.art();
  const box = $('#intro-slide');
  box.classList.remove('enter');
  void box.offsetWidth; // restart the slide-in animation
  box.classList.add('enter');
  $('#intro-title').textContent = t(slide.title);
  $('#intro-text').textContent = t(slide.text);
  $$('#intro-dots i').forEach((dot, i) => dot.classList.toggle('active', i === introStep));
  $('#intro-next').textContent = t(introStep === INTRO_SLIDES.length - 1 ? 'introStart' : 'introNext');
}

function finishIntro() {
  try {
    localStorage.setItem('debo-intro-done', '1');
  } catch {}
  const next = introNext;
  introNext = null;
  if ($('#intro-modal').open) $('#intro-modal').close();
  next?.();
}

// The weekly summary is a one-shot notification for next Sunday 19:00, refreshed whenever data changes
const WEEKLY_SUMMARY_ID = 4130;
let weeklySummaryTimer = 0;
function scheduleWeeklySummarySoon() {
  clearTimeout(weeklySummaryTimer);
  weeklySummaryTimer = setTimeout(scheduleWeeklySummary, 1500);
}

function scheduleWeeklySummary() {
  const native = window.AndroidReminders;
  if (!native?.schedule) return;
  try {
    if (!getSettings().weeklySummary) return native.cancel(WEEKLY_SUMMARY_ID);
    const next = new Date();
    next.setHours(19, 0, 0, 0);
    next.setDate(next.getDate() + ((7 - next.getDay()) % 7));
    if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 7);
    const from = Date.now() - 7 * ONE_DAY;
    const readings = glucoseHistory.filter(x => x.timestamp >= from);
    const entries = [...glucoseHistory, ...insulinLog, ...foodLog].filter(x => x.timestamp >= from).length;
    const average = readings.reduce((sum, x) => sum + x.value, 0) / readings.length;
    const inRange = Math.round((readings.filter(x => x.value >= 3.9 && x.value <= 10).length / readings.length) * 100);
    const body = readings.length ? t('weeklyBody').replace('{avg}', formatGlucose(average)).replace('{tir}', inRange).replace('{n}', entries) : t('weeklyNoData');
    native.schedule(WEEKLY_SUMMARY_ID, next.getTime(), t('weeklyTitle'), body);
  } catch {}
}

const CUSTOM_REMINDERS_KEY = 'debo-custom-reminders',
  CUSTOM_REMINDER_ID = 4140,
  CUSTOM_REMINDER_MAX = 10;
const customReminders = () => readJSON(CUSTOM_REMINDERS_KEY, []);

function renderCustomReminders() {
  const list = customReminders();
  $('#custom-reminder-list').innerHTML = list
    .map(
      (r, i) => `<div class="custom-reminder" data-reminder="${i}"><input type="time" value="${escapeHtml(r.time)}" data-reminder-time aria-label="${t('reminderTime')}"><input value="${escapeHtml(r.text)}" placeholder="${t('customReminderPlaceholder')}" maxlength="60" data-reminder-text><button class="fav-delete" type="button" data-reminder-del aria-label="${t('favDelete')}">×</button></div>`
    )
    .join('');
  $('#custom-reminder-add').classList.toggle('hidden', list.length >= CUSTOM_REMINDER_MAX);
}

function saveCustomReminders(list) {
  writeJSON(CUSTOM_REMINDERS_KEY, list);
  syncCustomReminders();
}

function syncCustomReminders() {
  const native = window.AndroidReminders;
  if (!native?.scheduleRepeating) return;
  try {
    for (let i = 0; i < CUSTOM_REMINDER_MAX; i++) native.cancel(CUSTOM_REMINDER_ID + i);
    customReminders().forEach((r, i) => {
      const [hours, minutes] = String(r.time || '08:00').split(':').map(Number);
      const next = new Date();
      next.setHours(hours || 0, minutes || 0, 0, 0);
      if (next.getTime() <= Date.now()) next.setTime(next.getTime() + ONE_DAY);
      native.scheduleRepeating(CUSTOM_REMINDER_ID + i, next.getTime(), ONE_DAY, 'Debo', r.text || t('customReminderDefault'));
    });
  } catch {}
}

function bindExtraFeatures() {
  $('#food-search-results').addEventListener('click', event => {
    if (event.target.closest('[data-fav-save]')) return saveFavoriteMeal();
    const del = event.target.closest('[data-fav-del]');
    if (del) {
      writeJSON(FAVORITES_KEY, favoriteMeals().filter(f => f.id !== del.dataset.favDel));
      return renderFoodSearch();
    }
    const log = event.target.closest('[data-fav-log]');
    if (log) logFavoriteMeal(log.dataset.favLog);
  });
  $('#intro-next').addEventListener('click', () => {
    if (introStep === INTRO_SLIDES.length - 1) {
      if (introChoices) introChoices.confirmed = true;
      return finishIntro();
    }
    introStep++;
    renderIntro();
  });
  $('#intro-skip').addEventListener('click', finishIntro);
  $('#intro-art').addEventListener('click', event => {
    const choice = event.target.closest('[data-intro-choice]');
    if (!choice || !introChoices) return;
    introChoices[choice.dataset.introChoice] = choice.dataset.value;
    choice.parentElement.querySelectorAll('button').forEach(button => {
      button.classList.toggle('active', button === choice);
      button.setAttribute('aria-pressed', String(button === choice));
    });
  });
  let introX = 0;
  const introCard = $('#intro-modal .intro-card');
  introCard.addEventListener('touchstart', event => (introX = event.touches[0].clientX), { passive: true });
  introCard.addEventListener('touchend', event => {
    const dx = event.changedTouches[0].clientX - introX;
    if (Math.abs(dx) < 50) return;
    const step = introStep + (dx < 0 ? 1 : -1);
    if (step < 0 || step >= INTRO_SLIDES.length) return;
    introStep = step;
    renderIntro();
  });
  $('#intro-modal').addEventListener('close', () => introNext && finishIntro());
  $('#custom-reminder-add').addEventListener('click', () => {
    saveCustomReminders([...customReminders(), { time: '08:00', text: '' }]);
    renderCustomReminders();
  });
  $('#custom-reminder-list').addEventListener('change', event => {
    const row = event.target.closest('[data-reminder]');
    if (!row) return;
    const list = customReminders();
    list[row.dataset.reminder] = { time: row.querySelector('[data-reminder-time]').value || '08:00', text: row.querySelector('[data-reminder-text]').value.trim() };
    saveCustomReminders(list);
  });
  $('#custom-reminder-list').addEventListener('click', event => {
    const row = event.target.closest('[data-reminder-del]')?.closest('[data-reminder]');
    if (!row) return;
    saveCustomReminders(customReminders().filter((_, i) => i !== Number(row.dataset.reminder)));
    renderCustomReminders();
  });
  syncCustomReminders();
  scheduleWeeklySummary();
}

/* ---------- Device changes and supplies ---------- */

const CARE_SETTINGS_KEY = 'debo-care-settings',
  SUPPLIES_KEY = 'debo-supplies',
  CARE_REMINDER_ID = 4150,
  SUPPLY_REMINDER_ID = 4160,
  SUPPLY_MAX = 10;
// Default change intervals in days; the user can set their own
const CARE_DEVICES = { sensor: 14, pumpset: 3, pen: 28 };
const SUPPLY_KINDS = ['sensor', 'strips', 'pen', 'needles', 'pumpset', 'reservoir', 'lancets'];
const SUPPLY_LOW_DEFAULT = { sensor: 1, strips: 25, pen: 1, needles: 10, pumpset: 3, reservoir: 3, lancets: 10 };
const CARE_ICONS = {
  sensor: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/>',
  pumpset: '<rect x="4" y="3" width="11" height="14" rx="3"/><path d="M9.5 17v1.5a2.5 2.5 0 0 0 2.5 2.5h8"/>',
  pen: INTRO_ICONS.pen,
  supplies: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>'
};
let careLog = readJSON('debo-care-log', []);
const careSettings = () => readJSON(CARE_SETTINGS_KEY, {});
const supplies = () => readJSON(SUPPLIES_KEY, []);
const careIcon = name => `<span class="care-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${CARE_ICONS[name]}</svg></span>`;
const supplyName = s => (s.kind === 'custom' ? s.name || t('supplyCustom') : t('sup_' + s.kind));
const isLowSupply = s => s.low > 0 && s.count <= s.low;
const shortDate = ts => new Intl.DateTimeFormat(locale(), { month: 'long', day: 'numeric' }).format(ts);
const lastCare = kind => careLog.filter(x => x.kind === kind).reduce((last, x) => (!last || x.timestamp > last.timestamp ? x : last), null);

// Pen users track pens, pump users infusion sets; everyone may wear a sensor
function careDevices() {
  return ['sensor', getSettings().therapy === 'pump' ? 'pumpset' : 'pen'];
}

function deviceConfig(kind) {
  const saved = careSettings()[kind] || {};
  return { days: Number(saved.days) > 0 ? Number(saved.days) : CARE_DEVICES[kind], remind: saved.remind !== false };
}

function daysAgoText(ts) {
  const days = Math.round((startOfDay(Date.now()) - startOfDay(ts)) / ONE_DAY);
  return days <= 0 ? t('agoToday') : days === 1 ? t('agoYesterday') : t('agoDays').replace('{n}', days);
}

function deviceStatus(kind) {
  const last = lastCare(kind);
  if (!last) return t('careNever');
  const due = last.timestamp + deviceConfig(kind).days * ONE_DAY;
  return `${t('careChangedAgo').replace('{ago}', daysAgoText(last.timestamp))} · ${due > Date.now() ? t('careNext').replace('{date}', shortDate(due)) : t('careDuePassed')}`;
}

function supplySummary() {
  const list = supplies();
  if (!list.length) return t('supplyNone');
  const low = list.filter(isLowSupply);
  if (low.length) return `${t('supplyLow')}: ${low.map(s => `${supplyName(s)} (${s.count})`).join(', ')}`;
  const expiring = list.find(s => s.expiry && new Date(`${s.expiry}T00:00`).getTime() - Date.now() < 14 * ONE_DAY);
  if (expiring) return `${supplyName(expiring)} · ${t('supplyExpires').replace('{date}', shortDate(new Date(`${expiring.expiry}T00:00`)))}`;
  return list.map(s => `${supplyName(s)} ${s.count}`).join(' · ');
}

function renderCare() {
  const row = (section, icon, title, detail) =>
    `<button class="care-row" type="button" data-care-open="${section}">${careIcon(icon)}<span class="meal-copy"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(detail)}</small></span><b aria-hidden="true">›</b></button>`;
  $('#care-list').innerHTML = [
    ...careDevices().map(kind => row(kind, kind, t('dev_' + kind), deviceStatus(kind))),
    row('supplies', 'supplies', t('suppliesTitle'), supplySummary())
  ].join('');
}

function renderCareDevices() {
  $('#care-devices').innerHTML = [careSection]
    .filter(kind => kind in CARE_DEVICES)
    .map(kind => {
      const last = lastCare(kind),
        config = deviceConfig(kind);
      return `<div class="care-device" data-device="${kind}">
        <div class="care-device-head">${careIcon(kind)}<span class="meal-copy"><strong>${escapeHtml(deviceStatus(kind))}</strong></span><button class="secondary care-now" type="button" data-care-now>${t('careNow')}</button></div>
        <div class="care-fields">
          <label><span>${t('careLastChange')}</span><input type="date" data-care-date value="${last ? isoDate(last.timestamp) : ''}" max="${isoDate(Date.now())}"></label>
          <label><span>${t('careInterval')}</span><input inputmode="numeric" data-care-days value="${config.days}"></label>
        </div>
        <label class="setting-toggle"><input type="checkbox" data-care-remind${config.remind ? ' checked' : ''}><span>${t('careRemind')}</span></label>
      </div>`;
    })
    .join('');
}

function renderSupplies() {
  const list = supplies();
  $('#supply-list').innerHTML = list.length
    ? list
        .map(s => {
          const state = [isLowSupply(s) ? t('supplyLow') : '', s.expiry ? t('supplyExpires').replace('{date}', shortDate(new Date(`${s.expiry}T00:00`))) : ''].filter(Boolean).join(' · ');
          return `<div class="supply${isLowSupply(s) ? ' low' : ''}" data-supply="${s.id}">
          <div class="supply-head">${s.kind === 'custom' ? `<input class="supply-name" data-supply-name value="${escapeHtml(s.name || '')}" placeholder="${t('supplyCustom')}" maxlength="40">` : `<span class="meal-copy"><strong>${supplyName(s)}</strong>${state ? `<small>${escapeHtml(state)}</small>` : ''}</span>`}
            <div class="supply-stepper"><button type="button" data-supply-step="-1" aria-label="−1">−</button><b>${s.count}</b><button type="button" data-supply-step="1" aria-label="+1">+</button></div>
            <button class="fav-delete" type="button" data-supply-del aria-label="${t('favDelete')}">×</button>
          </div>
          <div class="care-fields">
            <label><span>${t('supplyExpiry')}</span><input type="date" data-supply-expiry value="${escapeHtml(s.expiry || '')}"></label>
            <label><span>${t('supplyLowAt')}</span><input inputmode="numeric" data-supply-low value="${s.low || ''}" placeholder="0"></label>
          </div>
        </div>`;
        })
        .join('')
    : `<p class="care-hint">${t('supplyNone')}</p>`;
  const added = new Set(list.map(s => s.kind));
  $('#supply-add').innerHTML =
    list.length >= SUPPLY_MAX
      ? ''
      : [...SUPPLY_KINDS.filter(kind => !added.has(kind)), 'custom'].map(kind => `<button class="tag-chip" type="button" data-supply-add="${kind}">+ ${t(kind === 'custom' ? 'supplyOther' : 'sup_' + kind)}</button>`).join('');
}

// Each home row opens only its own part: one device or the supplies
let careSection = 'supplies';
function openCare(section) {
  careSection = section;
  const device = section in CARE_DEVICES;
  $('#care-title').textContent = device ? t('dev_' + section) : t('suppliesTitle');
  $('#care-changes').hidden = !device;
  $('#care-supplies').hidden = section !== 'supplies';
  renderCareDevices();
  renderSupplies();
  const modal = $('#care-modal');
  if (!modal.open) modal.showModal();
  modal.querySelector('.care-card').scrollTop = 0;
}

function refreshCare() {
  syncCareReminders();
  renderHistory();
  if (!$('#care-modal').open) return;
  renderCareDevices();
  renderSupplies();
}

function saveSupplies(list) {
  writeJSON(SUPPLIES_KEY, list);
  syncCareReminders();
  renderCare();
}

function saveCareLog() {
  careLog.sort((a, b) => a.timestamp - b.timestamp);
  writeJSON('debo-care-log', careLog);
}

// Logging a change also takes one item from the matching supply; undo puts both back
function logCare(entry, message) {
  const item = { id: createId('care'), timestamp: Date.now(), ...entry };
  careLog.push(item);
  saveCareLog();
  const list = supplies();
  const used = list.find(s => s.kind === item.kind && s.count > 0);
  if (used) {
    used.count--;
    writeJSON(SUPPLIES_KEY, list);
  }
  refreshCare();
  try {
    navigator.vibrate?.(12);
  } catch {}
  showUndo(message, () => {
    careLog = careLog.filter(x => x.id !== item.id);
    saveCareLog();
    const current = supplies();
    const supply = used && current.find(s => s.id === used.id);
    if (supply) {
      supply.count++;
      writeJSON(SUPPLIES_KEY, current);
    }
    refreshCare();
  });
}

function nextMorning() {
  const next = new Date();
  next.setHours(10, 0, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  return next.getTime();
}

function syncCareReminders() {
  const native = window.AndroidReminders;
  if (!native?.schedule) return;
  try {
    Object.keys(CARE_DEVICES).forEach((kind, i) => {
      const last = lastCare(kind),
        config = deviceConfig(kind);
      const at = last ? last.timestamp + config.days * ONE_DAY : 0;
      if (careDevices().includes(kind) && config.remind && at > Date.now()) native.schedule(CARE_REMINDER_ID + i, at, 'Debo', t('careDueBody').replace('{item}', t('dev_' + kind)).replace('{n}', config.days));
      else native.cancel(CARE_REMINDER_ID + i);
    });
    const list = supplies();
    for (let i = 0; i < SUPPLY_MAX; i++) {
      const s = list[i];
      const expiryAt = s?.expiry ? new Date(`${s.expiry}T10:00`).getTime() - 7 * ONE_DAY : 0;
      if (s && isLowSupply(s)) native.schedule(SUPPLY_REMINDER_ID + i, nextMorning(), 'Debo', t('supplyLowBody').replace('{name}', supplyName(s)).replace('{n}', s.count));
      else native.cancel(SUPPLY_REMINDER_ID + i);
      if (expiryAt > Date.now()) native.schedule(SUPPLY_REMINDER_ID + SUPPLY_MAX + i, expiryAt, 'Debo', t('supplyExpiryBody').replace('{name}', supplyName(s)).replace('{date}', shortDate(new Date(`${s.expiry}T00:00`))));
      else native.cancel(SUPPLY_REMINDER_ID + SUPPLY_MAX + i);
    }
  } catch {}
}

function bindCareEvents() {
  $('#care-list').addEventListener('click', event => {
    const row = event.target.closest('[data-care-open]');
    if (row) openCare(row.dataset.careOpen);
  });
  $('#care-devices').addEventListener('click', event => {
    const kind = event.target.closest('[data-care-now]')?.closest('[data-device]')?.dataset.device;
    if (kind) logCare({ kind }, t('careLoggedMsg').replace('{item}', t('dev_' + kind)));
  });
  $('#care-devices').addEventListener('change', event => {
    const kind = event.target.closest('[data-device]')?.dataset.device;
    if (!kind) return;
    const input = event.target;
    if (input.matches('[data-care-date]')) {
      // The date field corrects the last change instead of adding a new one
      if (!input.value) return;
      const day = new Date(`${input.value}T00:00`),
        now = new Date();
      day.setHours(now.getHours(), now.getMinutes(), 0, 0);
      const timestamp = Math.min(day.getTime(), Date.now());
      const last = lastCare(kind);
      if (last) last.timestamp = timestamp;
      else careLog.push({ id: createId('care'), kind, timestamp });
      saveCareLog();
    } else {
      const all = careSettings();
      const config = deviceConfig(kind);
      if (input.matches('[data-care-days]')) config.days = clamp(Math.round(parseNumber(input.value)) || CARE_DEVICES[kind], 1, 90);
      if (input.matches('[data-care-remind]')) config.remind = input.checked;
      writeJSON(CARE_SETTINGS_KEY, { ...all, [kind]: config });
    }
    refreshCare();
  });
  $('#supply-add').addEventListener('click', event => {
    const kind = event.target.closest('[data-supply-add]')?.dataset.supplyAdd;
    if (!kind) return;
    saveSupplies([...supplies(), { id: createId('supply'), kind, name: '', count: 0, expiry: '', low: SUPPLY_LOW_DEFAULT[kind] || 0 }]);
    renderSupplies();
    if (kind === 'custom') $('#supply-list .supply:last-child [data-supply-name]')?.focus();
  });
  $('#supply-list').addEventListener('click', event => {
    const id = event.target.closest('[data-supply]')?.dataset.supply;
    if (!id) return;
    const list = supplies();
    const index = list.findIndex(s => s.id === id);
    const step = event.target.closest('[data-supply-step]');
    if (step) {
      list[index].count = Math.max(0, list[index].count + Number(step.dataset.supplyStep));
      saveSupplies(list);
      renderSupplies();
    }
    if (event.target.closest('[data-supply-del]')) {
      const [removed] = list.splice(index, 1);
      saveSupplies(list);
      renderSupplies();
      showUndo(t('eventDeleted'), () => {
        const current = supplies();
        current.splice(Math.min(index, current.length), 0, removed);
        saveSupplies(current);
        if ($('#care-modal').open) renderSupplies();
      });
    }
  });
  $('#supply-list').addEventListener('change', event => {
    const id = event.target.closest('[data-supply]')?.dataset.supply;
    const list = supplies();
    const supply = list.find(s => s.id === id);
    if (!supply) return;
    const input = event.target;
    if (input.matches('[data-supply-name]')) supply.name = input.value.trim();
    if (input.matches('[data-supply-expiry]')) supply.expiry = input.value;
    if (input.matches('[data-supply-low]')) supply.low = clamp(Math.round(parseNumber(input.value)) || 0, 0, 999);
    saveSupplies(list);
    if (!input.matches('[data-supply-name]')) renderSupplies();
  });
  $('#history-search').addEventListener('input', event => {
    historyQuery = normalizeFoodQuery(event.target.value);
    renderHistory();
  });
  $('#history-modal').addEventListener('close', () => {
    $('#history-search').value = '';
    historyQuery = '';
  });
  syncCareReminders();
}

/* ---------- Exercise entries ---------- */

const INTENSITIES = ['light', 'moderate', 'hard'];
const EXERCISE_PRESETS = [15, 30, 45, 60, 90];
let exerciseIntensity = 'moderate',
  exerciseStartTouched = false;

function exerciseName(entry) {
  const sport = SPORTS.find(s => s.id === entry.sport);
  return sport ? sportText(sport.name) : t('exerciseOther');
}

function exerciseOptions(current) {
  const sports = SPORTS.map(s => [s.id, sportText(s.name)]).sort((a, b) => a[1].localeCompare(b[1], locale()));
  return [...sports, ['other', t('exerciseOther')]].map(([id, name]) => `<option value="${id}"${id === current ? ' selected' : ''}>${escapeHtml(name)}</option>`).join('');
}

// The start time follows the duration (now minus duration) until the user sets it themselves
function syncExerciseStart() {
  if (exerciseStartTouched) return;
  const minutes = clamp(Math.round(parseNumber($('#exercise-minutes').value)) || 0, 0, 600);
  const start = new Date(Date.now() - minutes * 60000);
  $('#exercise-start').value = `${pad2(start.getHours())}:${pad2(start.getMinutes())}`;
}

function renderExerciseChips() {
  const minutes = Math.round(parseNumber($('#exercise-minutes').value));
  $('#exercise-presets').innerHTML = EXERCISE_PRESETS.map(m => `<button class="tag-chip${m === minutes ? ' active' : ''}" type="button" data-exercise-minutes="${m}">${m} ${t('minutesShort')}</button>`).join('');
  $('#exercise-intensity').innerHTML = INTENSITIES.map(
    v => `<button class="tag-chip${v === exerciseIntensity ? ' active' : ''}" type="button" role="radio" aria-checked="${v === exerciseIntensity}" data-exercise-intensity="${v}">${t('intensity_' + v)}</button>`
  ).join('');
}

function openExerciseEntry(sportId = '') {
  const last = exerciseLog.at(-1);
  $('#exercise-sport').innerHTML = exerciseOptions(sportId || last?.sport || 'walking');
  $('#exercise-minutes').value = String(last?.minutes || 30);
  $('#exercise-note').value = '';
  exerciseIntensity = last?.intensity || 'moderate';
  exerciseStartTouched = false;
  syncExerciseStart();
  renderExerciseChips();
  $('#exercise-modal').showModal();
}

function saveExerciseEntry() {
  const minutes = parseNumber($('#exercise-minutes').value);
  if (!(Number.isInteger(minutes) && minutes >= 1 && minutes <= 600)) return toast(t('exerciseInvalid'));
  const timestamp = entryTimestamp($('#exercise-start').value);
  if (!Number.isFinite(timestamp)) return toast(t('chooseTime'));
  const note = $('#exercise-note').value.trim().slice(0, 140);
  exerciseLog.push({ id: createId('exercise'), timestamp, sport: $('#exercise-sport').value, minutes, intensity: exerciseIntensity, ...(note ? { note } : {}) });
  exerciseLog.sort((a, b) => a.timestamp - b.timestamp);
  writeJSON('debo-exercise-log', exerciseLog);
  chartShouldScrollToLatest = true;
  renderTimelineGraph();
  renderHistory();
  $('#exercise-modal').close();
  toastSaved();
}

function bindExerciseEvents() {
  $$('[data-log-exercise]').forEach(button => button.addEventListener('click', () => openExerciseEntry()));
  $('#exercise-presets').addEventListener('click', event => {
    const chip = event.target.closest('[data-exercise-minutes]');
    if (!chip) return;
    $('#exercise-minutes').value = chip.dataset.exerciseMinutes;
    syncExerciseStart();
    renderExerciseChips();
  });
  $('#exercise-intensity').addEventListener('click', event => {
    const chip = event.target.closest('[data-exercise-intensity]');
    if (!chip) return;
    exerciseIntensity = chip.dataset.exerciseIntensity;
    renderExerciseChips();
  });
  $('#exercise-minutes').addEventListener('input', () => {
    syncExerciseStart();
    renderExerciseChips();
  });
  $('#exercise-start').addEventListener('input', () => (exerciseStartTouched = true));
  $('#exercise-save').addEventListener('click', saveExerciseEntry);
  // The sport guide offers to log the sport it describes
  DOM.guideContent.addEventListener('click', event => {
    const button = event.target.closest('[data-log-sport]');
    if (!button) return;
    openFrom(DOM.guideModal, () => openExerciseEntry(button.dataset.logSport));
  });
}

/* ---------- Editing entries ---------- */

let editing = null;
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

function editTitle(type, item) {
  if (type === 'care') return t('care_' + item.kind);
  if (type === 'exercise') return exerciseName(item);
  return t({ glucose: 'glucose', insulin: 'insulin', food: 'food' }[type]);
}

function openEditEntry(type, id) {
  const item = EVENT_STORES[type]?.get().find(x => x.id === id);
  if (!item) return;
  hideChartTooltip();
  const field = (label, control) => `<label><span>${escapeHtml(label)}</span>${control}</label>`;
  const options = (values, current, label) => values.map(v => `<option value="${v}"${v === current ? ' selected' : ''}>${escapeHtml(label(v))}</option>`).join('');
  // Initial texts are kept so an untouched value is saved unchanged instead of re-rounded
  const initial = {
    value: type === 'glucose' ? String(displayGlucose(item.value)) : type === 'insulin' ? decimal(item.amount, 1) : type === 'food' ? decimal(Number(item.carbs || 0), 1) : type === 'exercise' ? String(item.minutes) : '',
    ketones: Number.isFinite(item.ketones) ? decimal(item.ketones, 1) : '',
    name: type === 'food' ? foodEntryName(item) : ''
  };
  const specific = {
    glucose: () =>
      field(`${t('glucose')} (${glucoseUnitText()})`, `<input id="edit-value" inputmode="decimal" value="${escapeHtml(initial.value)}">`) +
      // Ketones only for a reading that already has them
      (initial.ketones ? field(t('ketonesLabel'), `<input id="edit-ketones" inputmode="decimal" value="${escapeHtml(initial.ketones)}">`) : ''),
    insulin: () =>
      field(`${t('insulin')} (${t('unitU')})`, `<input id="edit-value" inputmode="decimal" value="${escapeHtml(initial.value)}">`) +
      field(t('insulinType'), `<select id="edit-insulin-type">${options(['rapid', 'long'], item.type, v => t(v))}</select>`),
    food: () =>
      field(t('productName'), `<input id="edit-name" maxlength="80" value="${escapeHtml(initial.name)}">`) +
      field(`${t('photoNutrition')} (g)`, `<input id="edit-value" inputmode="decimal" value="${escapeHtml(initial.value)}">`) +
      field(t('mealType'), `<select id="edit-meal">${options(MEAL_TYPES, item.mealType || 'snack', mealLabel)}</select>`),
    exercise: () =>
      field(t('exerciseActivity'), `<select id="edit-sport">${exerciseOptions(item.sport)}</select>`) +
      field(t('exerciseDuration'), `<input id="edit-value" inputmode="numeric" value="${escapeHtml(initial.value)}">`) +
      field(t('exerciseIntensity'), `<select id="edit-intensity">${options(INTENSITIES, item.intensity || 'moderate', v => t('intensity_' + v))}</select>`),
    care: () => ''
  }[type];
  const when = new Date(item.timestamp);
  $('#edit-fields').innerHTML =
    specific() +
    `<div class="care-fields edit-when">${field(t('editDate'), `<input type="date" id="edit-date" value="${isoDate(item.timestamp)}" max="${isoDate(Date.now())}">`)}${field(t('editTime'), `<input type="time" id="edit-time" value="${pad2(when.getHours())}:${pad2(when.getMinutes())}">`)}</div>`;
  $('#edit-title').textContent = editTitle(type, item);
  $('#edit-note').value = item.note || '';
  // Glucose readings have no note, unless an older one was saved with it
  $('#edit-modal .entry-note-label')?.classList.toggle('hidden', type === 'glucose' && !item.note);
  editing = { type, id, initial };
  const modal = $('#edit-modal');
  if (!modal.open) modal.showModal();
  modal.querySelector('.modal-card').scrollTop = 0;
}

const mealLabel = type => t({ breakfast: 'mealBreakfast', lunch: 'mealLunch', dinner: 'mealDinner' }[type] || 'mealSnack');

// Returns the updated copy of the entry, or null after showing why it cannot be saved
function editedEntry(before) {
  const { type, initial } = editing;
  const next = { ...before };
  const day = $('#edit-date').value,
    time = $('#edit-time').value;
  const original = new Date(before.timestamp);
  const unchanged = day === isoDate(before.timestamp) && time === `${pad2(original.getHours())}:${pad2(original.getMinutes())}`;
  // An untouched date and time keep the exact original (CGM readings have seconds that the time field drops)
  const timestamp = unchanged ? before.timestamp : new Date(`${day}T${time}`).getTime();
  if (!day || !time || !Number.isFinite(timestamp) || (!unchanged && timestamp > Date.now() + 120000)) return toast(t('chooseTime')), null;
  next.timestamp = timestamp;
  const valueText = $('#edit-value')?.value.trim() ?? '';
  const value = parseNumber(valueText);
  const changed = valueText !== initial.value;
  if (type === 'glucose' && changed) {
    if (!(value > 0)) return toast(t('enterValidValue')), null;
    const mmol = getGlucoseUnit() === 'mg' ? mgToMmol(value) : value;
    if (mmol < 1 || mmol > 35) return toast(t('glucoseOutOfRange')), null;
    next.value = mmol;
  }
  if (type === 'glucose') {
    const ketonesText = ($('#edit-ketones')?.value ?? initial.ketones).trim();
    if (!ketonesText) delete next.ketones;
    else if (ketonesText !== initial.ketones) {
      const ketones = parseNumber(ketonesText);
      if (!(ketones >= 0 && ketones <= 10)) return toast(t('ketonesInvalid')), null;
      next.ketones = ketones;
    }
  }
  if (type === 'insulin') {
    if (changed) {
      if (!(value > 0)) return toast(t('enterValidValue')), null;
      if (value > 100) return toast(t('insulinTooHigh')), null;
      next.amount = value;
    }
    const insulinType = $('#edit-insulin-type').value;
    if (insulinType !== before.type) {
      next.type = insulinType;
      next.name = getSelectedInsulin(insulinType)?.name || before.name;
    }
  }
  if (type === 'food') {
    const name = $('#edit-name').value.trim();
    if (!name) return toast(t('enterValidValue')), null;
    // A renamed food keeps one name for every language
    if (name !== initial.name) Object.assign(next, { name, nameLt: '', nameEn: '' });
    if (changed) {
      if (!(value >= 0 && value <= 1000)) return toast(t('enterValidValue')), null;
      next.carbs = value;
    }
    next.mealType = $('#edit-meal').value;
  }
  if (type === 'exercise') {
    if (changed) {
      if (!(Number.isInteger(value) && value >= 1 && value <= 600)) return toast(t('exerciseInvalid')), null;
      next.minutes = value;
    }
    next.sport = $('#edit-sport').value;
    next.intensity = $('#edit-intensity').value;
  }
  const note = $('#edit-note').value.trim().slice(0, 140);
  if (note) next.note = note;
  else delete next.note;
  return next;
}

function saveEditEntry() {
  if (!editing) return;
  const store = EVENT_STORES[editing.type];
  const before = store.get().find(x => x.id === editing.id);
  if (!before) return $('#edit-modal').close();
  const next = editedEntry(before);
  if (!next) return;
  const replace = entry => {
    store.set(store.get().map(x => (x.id === entry.id ? entry : x)).sort((a, b) => a.timestamp - b.timestamp));
    writeJSON(store.key, store.get());
    refreshStore(store);
  };
  replace(next);
  $('#edit-modal').close();
  toastSaved();
}

function bindEditEvents() {
  $('#edit-save').addEventListener('click', saveEditEntry);
  $('#edit-delete').addEventListener('click', () => {
    const { type, id } = editing || {};
    $('#edit-modal').close();
    if (type) quickDeleteEvent(type, id);
  });
  $('#edit-modal').addEventListener('close', () => (editing = null));
}

function initializeApp() {
  applyTheme();
  populateInsulinSelects();
  const saved = loadStoredSetup();
  initialSetupMissing = !saved;
  DOM.settingsLanguage.value = language;
  renderFoodCatalog();
  setTherapyUi();
  renderProfile();
  clearRemovedFeatureState();
  bindEvents();
  bindHomeSummaryEvents();
  bindGestures();
  bindHypoTimerEvents();
  bindExtraFeatures();
  bindCareEvents();
  bindEditEvents();
  ['#entry-modal', '#setup-modal', '#exercise-modal'].forEach(selector => $(selector).addEventListener('close', returnToPrevious));
  bindExerciseEvents();
  bindSportPickerEvents();
  bindMembershipEvents();
  bindFoodEntryEvents();
  bindHistoryModal();
  bindReportEvents();
  bindHealthEvents();
  bindBackupEvents();
  bindPasswordResetEvents();
  applyLanguage();
  renderHistory();
  updateConverter();
  requestAnimationFrame(renderTimelineGraph);
  configureGlucoseReminder(!!getSettings().glucoseReminderEnabled);
  setInterval(() => {
    if (document.hidden) return;
    renderCurrentGlucose();
    renderActiveInsulin();
    renderHeaderDate();
    renderHomeSummary();
    renderCare();
  }, 20000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    renderCurrentGlucose();
    renderHeaderDate();
  });
  let session = getSession();
  if (session?.mode === 'account' && !session.token) {
    localStorage.removeItem('debo-session');
    session = null;
  }
  DOM.authScreen.classList.toggle('hidden', !!session);
  if (session?.mode === 'account') refreshPhotoCredits();
  if (!saved && session) {
    prepareInitialSetup();
    setTimeout(() => showIntroThen(afterIntroSetup), 250);
  }
}

logsLoaded
  .then(() => {
    loadLogs();
    initializeApp();
  })
  .finally(() => (document.documentElement.style.visibility = ''));
