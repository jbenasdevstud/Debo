import SwiftUI
import WebKit
import UIKit

/// Shows the Debo web app and gives it the same native helpers the Android app has
/// (window.AndroidReminders, AndroidPrint, AndroidFiles, AndroidUi, NativeFoodTools),
/// so app.js runs unchanged.
@MainActor
struct DeboWebView: UIViewRepresentable {
    let indexURL: URL

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        KeyboardFocus.allowProgrammaticFocus()
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default() // keeps localStorage (all Debo data) between launches
        config.allowsInlineMediaPlayback = true
        config.dataDetectorTypes = []

        let controller = config.userContentController
        for name in Coordinator.messageNames {
            controller.add(context.coordinator, name: name)
        }
        controller.addUserScript(WKUserScript(source: Coordinator.bridgeScript(barcode: BarcodeScanner.isAvailable),
                                              injectionTime: .atDocumentStart,
                                              forMainFrameOnly: true))
        controller.addUserScript(WKUserScript(source: Coordinator.pageScript,
                                              injectionTime: .atDocumentEnd,
                                              forMainFrameOnly: true))

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = false
        webView.allowsLinkPreview = false
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0xF5 / 255, green: 0xF7 / 255, blue: 0xF4 / 255, alpha: 1)
        webView.scrollView.backgroundColor = webView.backgroundColor
        context.coordinator.webView = webView
        Reminders.shared.setUp()

        webView.loadFileURL(indexURL, allowingReadAccessTo: indexURL.deletingLastPathComponent())
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    @MainActor
    final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate {
        weak var webView: WKWebView?
        private var printView: WKWebView?
        private var printTitle = "Debo"
        private var lastThemeDark: Bool?

        static let messageNames = ["deboPrint", "deboSaveFile", "deboReminder", "deboTheme", "deboBarcode"]

        static func bridgeScript(barcode: Bool) -> String {
            """
            (function () {
              var post = function (name, body) { window.webkit.messageHandlers[name].postMessage(body); };
              window.AndroidPrint = {
                print: function (html, title) { post('deboPrint', { html: String(html), title: String(title || 'Debo') }); }
              };
              window.AndroidFiles = {
                saveText: function (name, mime, text) { post('deboSaveFile', { name: String(name), text: String(text) }); }
              };
              window.AndroidUi = {
                setTheme: function (theme) { post('deboTheme', { theme: String(theme) }); }
              };
              window.AndroidReminders = {
                schedule: function (id, at, title, body) {
                  post('deboReminder', { action: 'schedule', id: id, at: at, interval: 0, title: String(title), body: String(body) });
                },
                scheduleRepeating: function (id, at, interval, title, body) {
                  post('deboReminder', { action: 'schedule', id: id, at: at, interval: interval, title: String(title), body: String(body) });
                },
                scheduleRepeatingQuiet: function (id, at, interval, title, body, quietFrom, quietTo) {
                  post('deboReminder', { action: 'schedule', id: id, at: at, interval: interval, title: String(title), body: String(body), quietFrom: quietFrom, quietTo: quietTo });
                },
                cancel: function (id) { post('deboReminder', { action: 'cancel', id: id }); }
              };
              \(barcode ? "window.NativeFoodTools = { scanBarcode: function () { post('deboBarcode', {}); } };" : "")
            })();
            """
        }

        /// Runs once the page has loaded.
        static let pageScript = """
        (function () {
          document.documentElement.classList.add('ios-app');
          var style = document.createElement('style');
          // Android-only parts: Health Connect, voice input (no Web Speech in WKWebView), Android notes
          style.textContent =
            '#cgm-sync, #food-mode-voice, [data-i18n="careNote"], [data-i18n="customRemindersNote"] { display: none !important; }' +
            'html { -webkit-text-size-adjust: 100%; } body { -webkit-tap-highlight-color: transparent; }';
          document.head.appendChild(style);
          // Fallback if the native focus fix is unavailable: a tap or trackpad click on an already
          // focused field blurs it first, so the click focuses it again as a real user action.
          var refocus = function (event) {
            var field = event.target && event.target.closest &&
              event.target.closest('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=button]):not([type=submit]), textarea, [contenteditable="true"]');
            if (field && field === document.activeElement) field.blur();
          };
          document.addEventListener('touchstart', refocus, { capture: true, passive: true });
          document.addEventListener('pointerdown', function (event) {
            if (event.pointerType !== 'touch') refocus(event);
          }, { capture: true, passive: true });
        })();
        """

        // MARK: JS -> Swift

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            let body = message.body as? [String: Any] ?? [:]
            switch message.name {
            case "deboPrint":
                printReport(html: body["html"] as? String ?? "", title: body["title"] as? String ?? "Debo")
            case "deboSaveFile":
                saveFile(name: body["name"] as? String ?? "debo.json", text: body["text"] as? String ?? "")
            case "deboReminder":
                Reminders.shared.handle(body)
            case "deboTheme":
                let dark = (body["theme"] as? String) == "dark"
                lastThemeDark = dark
                webView?.window?.overrideUserInterfaceStyle = dark ? .dark : .light
                let color = dark
                    ? UIColor(red: 0x14 / 255, green: 0x1A / 255, blue: 0x19 / 255, alpha: 1)
                    : UIColor(red: 0xF5 / 255, green: 0xF7 / 255, blue: 0xF4 / 255, alpha: 1)
                webView?.backgroundColor = color
                webView?.scrollView.backgroundColor = color
            case "deboBarcode":
                scanBarcode()
            default:
                break
            }
        }

        // MARK: Doctor report

        private func printReport(html: String, title: String) {
            // A separate web view renders the report exactly as on screen (charts included)
            let view = WKWebView(frame: CGRect(x: 0, y: 0, width: 800, height: 1100))
            view.navigationDelegate = self
            printView = view
            printTitle = title
            view.loadHTMLString(html, baseURL: nil)
        }

        private func showPrintDialog(for view: WKWebView) {
            let info = UIPrintInfo(dictionary: nil)
            info.jobName = printTitle
            info.outputType = .general
            let controller = UIPrintInteractionController.shared
            controller.printInfo = info
            controller.printFormatter = view.viewPrintFormatter()
            let done: UIPrintInteractionController.CompletionHandler = { [weak self] _, _, _ in self?.printView = nil }
            if let host = webView, UIDevice.current.userInterfaceIdiom == .pad {
                let rect = CGRect(x: host.bounds.midX, y: host.bounds.midY, width: 1, height: 1)
                controller.present(from: rect, in: host, animated: true, completionHandler: done)
            } else {
                controller.present(animated: true, completionHandler: done)
            }
        }

        // MARK: Backup export

        private func saveFile(name: String, text: String) {
            let safeName = name.replacingOccurrences(of: "/", with: "-")
            let url = FileManager.default.temporaryDirectory.appendingPathComponent(safeName)
            do {
                try text.write(to: url, atomically: true, encoding: .utf8)
            } catch {
                callJS("window.onFileSaved && window.onFileSaved('error')")
                return
            }
            let sheet = UIActivityViewController(activityItems: [url], applicationActivities: nil)
            sheet.completionWithItemsHandler = { [weak self] _, completed, _, error in
                let result = error != nil ? "error" : (completed ? "ok" : "cancel")
                self?.callJS("window.onFileSaved && window.onFileSaved('\(result)')")
            }
            present(sheet)
        }

        // MARK: Barcode

        private func scanBarcode() {
            let scanner = BarcodeScanner { [weak self] code in
                guard let self else { return }
                if let code {
                    let digits = code.filter(\.isNumber)
                    self.callJS("window.onNativeBarcodeScanned && window.onNativeBarcodeScanned('\(digits)')")
                }
                // Cancelled: the manual EAN field stays open
            }
            if !present(scanner.makeController()) {
                callJS("window.onNativeBarcodeError && window.onNativeBarcodeError()")
            }
        }

        // MARK: Navigation, links, alerts

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            if webView === printView {
                showPrintDialog(for: webView)
            } else if let dark = lastThemeDark {
                // The first theme message can arrive before the view is in a window
                webView.window?.overrideUserInterfaceStyle = dark ? .dark : .light
            }
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            // Web links (privacy policy, Open Food Facts, …) open in Safari; the app's own files stay inside
            if webView !== printView,
               let url = navigationAction.request.url,
               let scheme = url.scheme?.lowercased(),
               ["http", "https", "mailto", "tel"].contains(scheme),
               navigationAction.navigationType == .linkActivated || navigationAction.targetFrame?.isMainFrame == true {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                     for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = navigationAction.request.url { UIApplication.shared.open(url) }
            return nil
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            webView.reload()
        }

        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
            if !present(alert) { completionHandler() }
        }

        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                     initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) })
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
            if !present(alert) { completionHandler(false) }
        }

        // MARK: Helpers

        private func callJS(_ script: String) {
            DispatchQueue.main.async { self.webView?.evaluateJavaScript(script, completionHandler: nil) }
        }

        @discardableResult
        private func present(_ controller: UIViewController) -> Bool {
            guard var top = webView?.window?.rootViewController else { return false }
            while let next = top.presentedViewController { top = next }
            if let popover = controller.popoverPresentationController, let view = webView {
                popover.sourceView = view
                popover.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
                popover.permittedArrowDirections = []
            }
            top.present(controller, animated: true)
            return true
        }
    }
}
