import UIKit
import LocalAuthentication

/// Optional Face ID / passcode lock. When it is on, Debo is covered while it is in the app switcher
/// and asks for Face ID (or the device passcode) when it opens or comes back.
@MainActor
final class AppLock {
    static let shared = AppLock()

    private let key = "debo.appLock"
    private var cover: UIView?
    private var needsUnlock = false
    private var authenticating = false
    private var started = false

    var enabled: Bool {
        get { UserDefaults.standard.bool(forKey: key) }
        set { UserDefaults.standard.set(newValue, forKey: key) }
    }

    /// Face ID, Touch ID or at least a device passcode is set up
    static var isAvailable: Bool {
        LAContext().canEvaluatePolicy(.deviceOwnerAuthentication, error: nil)
    }

    func start() {
        guard !started else { return }
        started = true
        needsUnlock = enabled
        let center = NotificationCenter.default
        center.addObserver(forName: UIApplication.willResignActiveNotification, object: nil, queue: .main) { _ in
            MainActor.assumeIsolated { AppLock.shared.appWillResign() }
        }
        center.addObserver(forName: UIApplication.didBecomeActiveNotification, object: nil, queue: .main) { _ in
            MainActor.assumeIsolated { AppLock.shared.appDidBecomeActive() }
        }
    }

    /// Turning the lock on asks once, so nobody can switch it on by accident
    func setEnabled(_ on: Bool, reply: @escaping (Bool) -> Void) {
        guard on else {
            enabled = false
            removeCover()
            reply(false)
            return
        }
        guard Self.isAvailable else { reply(false); return }
        authenticating = true
        LAContext().evaluatePolicy(.deviceOwnerAuthentication, localizedReason: Self.reason) { ok, _ in
            DispatchQueue.main.async {
                AppLock.shared.authenticating = false
                if ok { AppLock.shared.enabled = true }
                reply(ok)
            }
        }
    }

    private func appWillResign() {
        // The Face ID prompt itself makes the app inactive; that must not lock again
        guard enabled, !authenticating else { return }
        needsUnlock = true
        showCover()
    }

    private func appDidBecomeActive() {
        guard enabled, needsUnlock else { return }
        showCover()
        authenticate()
    }

    private func authenticate() {
        guard !authenticating else { return }
        authenticating = true
        let context = LAContext()
        context.localizedCancelTitle = Self.cancelTitle
        context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: Self.reason) { ok, _ in
            DispatchQueue.main.async {
                let lock = AppLock.shared
                lock.authenticating = false
                if ok {
                    lock.needsUnlock = false
                    lock.removeCover()
                }
            }
        }
    }

    // MARK: Cover

    private func showCover() {
        guard cover == nil, let window = Self.keyWindow else { return }
        let blur = UIVisualEffectView(effect: UIBlurEffect(style: .systemThickMaterial))
        blur.frame = window.bounds
        blur.autoresizingMask = [.flexibleWidth, .flexibleHeight]

        let icon = UIImageView(image: UIImage(systemName: "lock.fill"))
        icon.tintColor = .label
        icon.preferredSymbolConfiguration = UIImage.SymbolConfiguration(pointSize: 34, weight: .semibold)
        let title = UILabel()
        title.text = "Debo"
        title.font = .systemFont(ofSize: 26, weight: .bold)
        var config = UIButton.Configuration.filled()
        config.title = Self.unlockTitle
        config.cornerStyle = .capsule
        config.baseBackgroundColor = .label
        config.baseForegroundColor = .systemBackground
        config.contentInsets = NSDirectionalEdgeInsets(top: 14, leading: 28, bottom: 14, trailing: 28)
        let button = UIButton(configuration: config, primaryAction: UIAction { _ in AppLock.shared.authenticate() })

        let stack = UIStackView(arrangedSubviews: [icon, title, button])
        stack.axis = .vertical
        stack.alignment = .center
        stack.spacing = 18
        stack.setCustomSpacing(36, after: title)
        stack.translatesAutoresizingMaskIntoConstraints = false
        blur.contentView.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.centerXAnchor.constraint(equalTo: blur.contentView.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: blur.contentView.centerYAnchor)
        ])
        window.addSubview(blur)
        cover = blur
    }

    private func removeCover() {
        guard let view = cover else { return }
        cover = nil
        UIView.animate(withDuration: 0.25, animations: { view.alpha = 0 }, completion: { _ in view.removeFromSuperview() })
    }

    private static var keyWindow: UIWindow? {
        let windows = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.flatMap(\.windows)
        return windows.first(where: \.isKeyWindow) ?? windows.first
    }

    // MARK: Texts

    private static var lang: String { String(Locale.preferredLanguages.first?.prefix(2) ?? "en") }

    private static var reason: String {
        switch lang {
        case "lt": return "Atrakinkite Debo"
        case "lv": return "Atbloķējiet Debo"
        case "pl": return "Odblokuj Debo"
        case "de": return "Debo entsperren"
        default: return "Unlock Debo"
        }
    }

    private static var unlockTitle: String {
        switch lang {
        case "lt": return "Atrakinti"
        case "lv": return "Atbloķēt"
        case "pl": return "Odblokuj"
        case "de": return "Entsperren"
        default: return "Unlock"
        }
    }

    private static var cancelTitle: String {
        switch lang {
        case "lt": return "Atšaukti"
        case "lv": return "Atcelt"
        case "pl": return "Anuluj"
        case "de": return "Abbrechen"
        default: return "Cancel"
        }
    }
}
