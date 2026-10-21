package com.debo.app;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.util.TypedValue;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.Locale;

public final class HealthPrivacyActivity extends Activity {
    private static final String PRIVACY_URL = "https://debo-privacy.pages.dev/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        String language = Locale.getDefault().getLanguage();
        TextView text = new TextView(this);
        int pad = (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 24, getResources().getDisplayMetrics());
        text.setPadding(pad, pad, pad, pad);
        text.setTextSize(TypedValue.COMPLEX_UNIT_SP, 17);
        text.setLineSpacing(0, 1.3f);
        text.setTextColor(Color.rgb(31, 41, 39));
        text.setAutoLinkMask(android.text.util.Linkify.WEB_URLS);
        text.setLinkTextColor(Color.rgb(46, 116, 102));
        text.setText(privacyText(language));
        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(Color.rgb(245, 247, 244));
        scroll.addView(text);
        setContentView(scroll);
    }

    // Shown from the Health Connect permission screen; follows the phone's language, English otherwise
    private static String privacyText(String language) {
        switch (language) {
            case "lt":
                return "Kaip Debo naudoja Health Connect duomenis\n\n"
                        + "Debo skaito tik kraujo gliukozės rodmenis, kuriuos į Health Connect įrašo jūsų CGM ar gliukomačio programėlė.\n\n"
                        + "Rodmenys naudojami tik programėlėje: gliukozės grafikui, statistikai, laikui tiksliniame intervale ir ataskaitai gydytojui.\n\n"
                        + "Įjungus „Veikti fone“, rodmenys maždaug kas 15 min. skaitomi ir uždarius programėlę – tik pagrindinio ekrano valdikliui atnaujinti.\n\n"
                        + "Duomenys saugomi tik jūsų telefone. Debo jų nesiunčia į serverius, neparduoda, nenaudoja reklamai ir neperduoda trečiosioms šalims. Debo į Health Connect nieko nerašo.\n\n"
                        + "Leidimą bet kada galite atšaukti Health Connect nustatymuose, o sinchronizavimą išjungti Debo nustatymuose.\n\n"
                        + "Visa privatumo politika: " + PRIVACY_URL + "?lang=lt";
            case "lv":
                return "Kā Debo izmanto Health Connect datus\n\n"
                        + "Debo nolasa tikai asins glikozes rādījumus, ko Health Connect ieraksta jūsu CGM vai glikometra lietotne.\n\n"
                        + "Rādījumi tiek izmantoti tikai lietotnē: glikozes grafikam, statistikai, laikam mērķa diapazonā un atskaitei ārstam.\n\n"
                        + "Ja ieslēgta „Darbība fonā“, rādījumi aptuveni ik pēc 15 min tiek nolasīti arī tad, kad lietotne ir aizvērta – tikai sākuma ekrāna logrīka atjaunināšanai.\n\n"
                        + "Dati paliek jūsu tālrunī. Debo tos nesūta uz serveriem, nepārdod, neizmanto reklāmai un nenodod trešajām personām. Debo neko neieraksta Health Connect.\n\n"
                        + "Piekļuvi jebkurā laikā varat atsaukt Health Connect iestatījumos un izslēgt sinhronizāciju Debo iestatījumos.\n\n"
                        + "Pilna privātuma politika: " + PRIVACY_URL + "?lang=lv";
            case "pl":
                return "Jak Debo korzysta z danych Health Connect\n\n"
                        + "Debo odczytuje wyłącznie pomiary glukozy we krwi, które Twoja aplikacja CGM lub glukometru zapisuje w Health Connect.\n\n"
                        + "Pomiary są używane tylko w aplikacji: do wykresu glukozy, statystyk, czasu w zakresie i raportu dla lekarza.\n\n"
                        + "Gdy włączone jest „Działanie w tle”, pomiary są odczytywane mniej więcej co 15 minut także po zamknięciu aplikacji – wyłącznie w celu odświeżenia widżetu na ekranie głównym.\n\n"
                        + "Dane pozostają na Twoim telefonie. Debo nie wysyła ich na serwery, nie sprzedaje, nie używa do reklam ani nie udostępnia osobom trzecim. Debo niczego nie zapisuje w Health Connect.\n\n"
                        + "Dostęp możesz w każdej chwili cofnąć w ustawieniach Health Connect, a synchronizację wyłączyć w ustawieniach Debo.\n\n"
                        + "Pełna polityka prywatności: " + PRIVACY_URL + "?lang=pl";
            case "de":
                return "Wie Debo Daten aus Health Connect nutzt\n\n"
                        + "Debo liest ausschließlich Blutzuckerwerte, die Ihre CGM- oder Messgerät-App in Health Connect speichert.\n\n"
                        + "Die Werte werden nur in der App verwendet: für den Glukoseverlauf, die Statistik, die Zeit im Zielbereich und den Bericht für die Arztpraxis.\n\n"
                        + "Ist „Im Hintergrund ausführen“ aktiviert, werden die Werte etwa alle 15 Minuten auch bei geschlossener App gelesen – nur um das Widget auf dem Startbildschirm zu aktualisieren.\n\n"
                        + "Die Daten bleiben auf Ihrem Telefon. Debo sendet sie nicht an Server, verkauft sie nicht, nutzt sie nicht für Werbung und gibt sie nicht an Dritte weiter. Debo schreibt nichts in Health Connect.\n\n"
                        + "Sie können den Zugriff jederzeit in den Health-Connect-Einstellungen widerrufen und die Synchronisierung in den Debo-Einstellungen ausschalten.\n\n"
                        + "Vollständige Datenschutzerklärung: " + PRIVACY_URL + "?lang=de";
            default:
                return "How Debo uses Health Connect data\n\n"
                        + "Debo only reads blood glucose readings that your CGM or meter app writes to Health Connect.\n\n"
                        + "Readings are used only inside the app: for the glucose chart, statistics, time in range, and the report for your doctor.\n\n"
                        + "With “Run in background” on, readings are also read about every 15 minutes while the app is closed – only to update the home screen widget.\n\n"
                        + "Data stays on your phone. Debo does not send it to servers, sell it, use it for advertising, or share it with third parties. Debo does not write anything to Health Connect.\n\n"
                        + "You can revoke access at any time in Health Connect settings and turn syncing off in Debo settings.\n\n"
                        + "Full privacy policy: " + PRIVACY_URL + "?lang=en";
        }
    }
}
