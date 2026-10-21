import UIKit

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    // Links from the home-screen widget: debo-app://open and debo-app://glucose
    private static let linkScheme = "debo-app"

    var window: UIWindow?
    private weak var webController: WebViewController?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let controller = WebViewController()
        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = controller
        window.makeKeyAndVisible()
        self.window = window
        webController = controller
        // Debo was started by tapping the widget
        if let url = connectionOptions.urlContexts.first?.url {
            handle(url)
        }
    }

    // The widget was tapped while Debo was already running
    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        if let url = URLContexts.first?.url {
            handle(url)
        }
    }

    // Same as Android's onResume: the web app re-checks Apple Health and redraws the time-based parts
    func sceneWillEnterForeground(_ scene: UIScene) {
        webController?.appDidResume()
    }

    private func handle(_ url: URL) {
        guard url.scheme?.lowercased() == Self.linkScheme, let action = url.host?.lowercased() else { return }
        webController?.openEntry(action)
    }
}
