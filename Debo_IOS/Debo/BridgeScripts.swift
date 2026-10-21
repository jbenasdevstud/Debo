import Foundation

// JavaScript injected into the web app.
// The web app talks to Android through window.AndroidReminders, AndroidHealth, AndroidPrint, AndroidFiles, AndroidUi
// and AndroidWidget.
// On iOS the same objects are defined here and forward each call to Swift (WKScriptMessageHandler), so app.js needs no changes.
// Calls the web app reads synchronously (AndroidHealth.status) return a value that Swift keeps up to date in window.__deboNative.
enum BridgeScripts {
    static func native(healthStatus: String) -> String {
        #"""
        (function () {
          var post = function (name, body) {
            try { window.webkit.messageHandlers[name].postMessage(body); } catch (e) {}
          };
          var state = window.__deboNative = { platform: 'ios', healthStatus: '\#(healthStatus)' };
          window.DeboPlatform = 'ios';
          window.AndroidReminders = {
            schedule: function (id, at, title, body) {
              post('reminders', { op: 'schedule', id: id, at: at, title: title || '', body: body || '' });
            },
            scheduleRepeating: function (id, at, interval, title, body) {
              post('reminders', { op: 'repeat', id: id, at: at, interval: interval, title: title || '', body: body || '' });
            },
            scheduleRepeatingQuiet: function (id, at, interval, title, body, quietFrom, quietTo) {
              post('reminders', { op: 'repeat', id: id, at: at, interval: interval, title: title || '', body: body || '',
                                  quietFrom: quietFrom, quietTo: quietTo });
            },
            cancel: function (id) { post('reminders', { op: 'cancel', id: id }); }
          };
          window.AndroidPrint = {
            print: function (html, title) { post('print', { html: html || '', title: title || 'Debo' }); }
          };
          window.AndroidFiles = {
            saveText: function (name, mime, text) { post('files', { name: name || 'debo.json', mime: mime || '', text: text || '' }); }
          };
          window.AndroidUi = {
            setTheme: function (theme) { post('ui', { theme: theme }); }
          };
          window.AndroidWidget = {
            update: function (json) { post('widget', { json: json || '{}' }); }
          };
          window.AndroidHealth = {
            status: function () { return state.healthStatus; },
            requestPermission: function () { post('health', { op: 'request' }); },
            openSettings: function () { post('health', { op: 'settings' }); },
            readGlucose: function (since) { post('health', { op: 'read', since: since }); },
            install: function () {},
            // Apple Health has no background reading for a web view app: the "Run in background" row stays hidden
            backgroundStatus: function () { return 'unsupported'; },
            requestBackgroundPermission: function () {
              setTimeout(function () {
                if (window.onHealthBackgroundPermission) window.onHealthBackgroundPermission('unsupported');
              }, 0);
            },
            configureBackground: function () {}
          };
        })();
        """#
    }

    // Runs when the page has loaded.
    // The shared texts name Android's Health Connect and say some features need "the Android app".
    // On iPhone: Health Connect becomes Apple Health, and sentences about Android or Google Play are left out
    // (App Review rejects apps that mention other platforms). The app redraws its texts once it has started.
    static let iosTexts = #"""
    (function () {
      // iOS zooms the page into any input whose text is under 16px and leaves it zoomed; an app keeps 100 %
      var viewport = document.querySelector('meta[name="viewport"]');
      if (viewport && !/maximum-scale/.test(viewport.content)) viewport.content += ',maximum-scale=1';
      var platformWords = /Android|Google Play|Play Store|Play Console/;
      var fix = function (text) {
        if (typeof text !== 'string') return text;
        text = text.replace(/Health Connect/g, 'Apple Health');
        if (platformWords.test(text)) {
          var sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
          text = sentences.filter(function (s) { return !platformWords.test(s); }).join('').trim();
        }
        return text;
      };
      var walk = function (object, depth) {
        if (!object || typeof object !== 'object' || depth > 4) return;
        Object.keys(object).forEach(function (key) {
          var value = object[key];
          if (typeof value === 'string') object[key] = fix(value);
          else walk(value, depth + 1);
        });
      };
      try { if (typeof translations !== 'undefined') walk(translations, 0); } catch (e) {}
      try { walk(window.DEBO_LANGS, 0); } catch (e) {}
      try {
        if (typeof logsLoaded !== 'undefined' && typeof applyLanguage === 'function') {
          logsLoaded.then(function () { setTimeout(function () { try { applyLanguage(); } catch (e) {} }, 0); });
        }
      } catch (e) {}
    })();
    """#
}
