import SwiftUI
import WebKit
import UIKit

struct ContentView: View {
    var body: some View {
        if let index = WebFiles.indexURL {
            DeboWebView(indexURL: index)
                .ignoresSafeArea(.container, edges: .bottom)
        } else {
            VStack(spacing: 12) {
                Image(systemName: "exclamationmark.triangle")
                    .font(.largeTitle)
                Text("Web/index.html not found")
                    .font(.headline)
                Text("Check that the Web folder is inside the app package.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding()
        }
    }
}

/// Finds Web/index.html in the app's resources.
enum WebFiles {
    static var indexURL: URL? {
        let bundles = [Bundle.main] + Bundle.allBundles + Bundle.allFrameworks
        for bundle in bundles {
            if let url = bundle.url(forResource: "index", withExtension: "html", subdirectory: "Web") {
                return url
            }
            if let resources = bundle.resourceURL {
                // SwiftPM resource bundle (Debo_AppModule.bundle) next to the app's files
                let candidates = (try? FileManager.default.contentsOfDirectory(at: resources, includingPropertiesForKeys: nil)) ?? []
                for item in candidates where item.pathExtension == "bundle" {
                    let index = item.appendingPathComponent("Web/index.html")
                    if FileManager.default.fileExists(atPath: index.path) {
                        return index
                    }
                }
            }
        }
        return nil
    }
}

struct DeboWebView: UIViewRepresentable {
    let indexURL: URL

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default() // keeps localStorage (all Debo data) between launches
        config.allowsInlineMediaPlayback = true

        let controller = config.userContentController
        controller.add(context.coordinator, name: "deboPrint")
        controller.add(context.coordinator, name: "deboSaveFile")
        // Same names the Android app uses, so app.js needs no changes
        controller.addUserScript(WKUserScript(source: Coordinator.bridgeScript,
                                              injectionTime: .atDocumentStart,
                                              forMainFrameOnly: true))

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = false
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        webView.isOpaque = false
        webView.backgroundColor = .systemBackground
        context.coordinator.webView = webView

        webView.loadFileURL(indexURL, allowingReadAccessTo: indexURL.deletingLastPathComponent())
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate {
        weak var webView: WKWebView?

        static let bridgeScript = """
        window.AndroidPrint = {
          print: function (html, title) {
            window.webkit.messageHandlers.deboPrint.postMessage({ html: String(html), title: String(title || 'Debo') });
          }
        };
        window.AndroidFiles = {
          saveText: function (name, mime, text) {
            window.webkit.messageHandlers.deboSaveFile.postMessage({ name: String(name), mime: String(mime), text: String(text) });
          }
        };
        """

        // MARK: JS -> Swift

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any] else { return }
            switch message.name {
            case "deboPrint":
                printReport(html: body["html"] as? String ?? "", title: body["title"] as? String ?? "Debo")
            case "deboSaveFile":
                saveFile(name: body["name"] as? String ?? "debo.json", text: body["text"] as? String ?? "")
            default:
                break
            }
        }

        private func printReport(html: String, title: String) {
            let info = UIPrintInfo(dictionary: nil)
            info.jobName = title
            info.outputType = .general
            let controller = UIPrintInteractionController.shared
            controller.printInfo = info
            controller.printFormatter = UIMarkupTextPrintFormatter(markupText: html)
            if let view = webView, UIDevice.current.userInterfaceIdiom == .pad {
                let rect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
                controller.present(from: rect, in: view, animated: true)
            } else {
                controller.present(animated: true)
            }
        }

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

        // MARK: Links, alerts, confirms

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            // Open web links (privacy policy, etc.) in Safari, keep the app's own files inside
            if let url = navigationAction.request.url,
               let scheme = url.scheme?.lowercased(),
               ["http", "https", "mailto", "tel"].contains(scheme),
               navigationAction.targetFrame?.isMainFrame != false {
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
