import UIKit
import WebKit

// Hosts the same web app as the Android version. The native parts are reached through the
// window.Android* objects that BridgeScripts defines, so app.js runs unchanged on both platforms.
final class WebViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    private static let lightBackground = UIColor(red: 245 / 255, green: 247 / 255, blue: 244 / 255, alpha: 1)
    private static let darkBackground = UIColor(red: 20 / 255, green: 26 / 255, blue: 25 / 255, alpha: 1)
    private static let messageNames = ["reminders", "health", "print", "files", "ui", "widget"]
    private static let entryActions: Set<String> = ["glucose", "food", "insulin"]

    private var webView: WKWebView!
    private var darkTheme = false
    private var pageLoaded = false
    // A widget tap that arrived before the page finished loading
    private var pendingAction: String?
    private let reminders = RemindersBridge()
    private lazy var health = HealthBridge(send: { [weak self] script in self?.run(script) })
    private lazy var printer = PrintBridge(presenter: self)
    private lazy var files = FilesBridge(presenter: self, send: { [weak self] script in self?.run(script) })

    override var preferredStatusBarStyle: UIStatusBarStyle {
        darkTheme ? .lightContent : .darkContent
    }

    override func loadView() {
        let container = UIView()
        container.backgroundColor = Self.lightBackground

        let config = WKWebViewConfiguration()
        let root = Bundle.main.resourceURL!.appendingPathComponent("www", isDirectory: true)
        config.setURLSchemeHandler(AppSchemeHandler(root: root), forURLScheme: AppSchemeHandler.scheme)
        let content = config.userContentController
        installUserScripts(in: content)
        for name in Self.messageNames {
            content.add(WeakMessageHandler(self), name: name)
        }

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        // Like the Android app (OVER_SCROLL_NEVER): no rubber-band bounce at the top and bottom
        webView.scrollView.bounces = false
        webView.allowsBackForwardNavigationGestures = false
        webView.navigationDelegate = self
        webView.uiDelegate = self
        #if DEBUG
        // Test builds can be inspected from Safari on the Mac (Develop menu)
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
        #endif
        container.addSubview(webView)
        // The page stays inside the safe area (clear of the notch and the home indicator)
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            webView.topAnchor.constraint(equalTo: container.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: container.safeAreaLayoutGuide.bottomAnchor)
        ])
        self.webView = webView
        view = container
        webView.load(URLRequest(url: AppSchemeHandler.startURL))
    }

    // The bridge script carries the current Apple Health status, so it is rebuilt whenever the page loads again
    private func installUserScripts(in content: WKUserContentController) {
        content.removeAllUserScripts()
        content.addUserScript(WKUserScript(source: BridgeScripts.native(healthStatus: health.status),
                                           injectionTime: .atDocumentStart, forMainFrameOnly: true))
        content.addUserScript(WKUserScript(source: BridgeScripts.iosTexts,
                                           injectionTime: .atDocumentEnd, forMainFrameOnly: true))
    }

    func appDidResume() {
        run("window.onAppResume && window.onAppResume()")
    }

    // Same as Android's widget/shortcut entry: opens the glucose, food or insulin form (window.onAppAction)
    func openEntry(_ action: String) {
        guard Self.entryActions.contains(action) else { return }
        guard pageLoaded else {
            pendingAction = action
            return
        }
        run("window.onAppAction && window.onAppAction('\(action)')")
    }

    private func run(_ script: String) {
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(script, completionHandler: nil)
        }
    }

    private func setTheme(dark: Bool) {
        darkTheme = dark
        view.backgroundColor = dark ? Self.darkBackground : Self.lightBackground
        setNeedsStatusBarAppearanceUpdate()
    }

    // MARK: - Messages from the web app

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any] else { return }
        switch message.name {
        case "reminders":
            reminders.handle(body)
        case "health":
            health.handle(body)
        case "print":
            printer.print(html: body["html"] as? String ?? "", title: body["title"] as? String ?? "Debo")
        case "files":
            files.save(name: body["name"] as? String ?? "debo.json", text: body["text"] as? String ?? "")
        case "ui":
            setTheme(dark: (body["theme"] as? String) == "dark")
        case "widget":
            WidgetBridge.update(json: body["json"] as? String ?? "{}")
        default:
            break
        }
    }

    // MARK: - Navigation

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        pageLoaded = true
        if let action = pendingAction {
            pendingAction = nil
            openEntry(action)
        }
    }

    // Web links (privacy policy, nutrition sources) open in Safari; the app itself stays on debo://
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url, let scheme = url.scheme?.lowercased() else {
            decisionHandler(.cancel)
            return
        }
        if [AppSchemeHandler.scheme, "about", "blob", "data"].contains(scheme) {
            decisionHandler(.allow)
            return
        }
        UIApplication.shared.open(url)
        decisionHandler(.cancel)
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url {
            UIApplication.shared.open(url)
        }
        return nil
    }

    // iOS can stop the page's process when memory is low: load it again instead of showing a blank screen
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        pageLoaded = false
        installUserScripts(in: webView.configuration.userContentController)
        webView.load(URLRequest(url: AppSchemeHandler.startURL))
    }
}

// WKUserContentController keeps a strong reference to its handlers; this breaks the cycle with the controller
final class WeakMessageHandler: NSObject, WKScriptMessageHandler {
    private weak var target: WKScriptMessageHandler?

    init(_ target: WKScriptMessageHandler) {
        self.target = target
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        target?.userContentController(userContentController, didReceive: message)
    }
}
