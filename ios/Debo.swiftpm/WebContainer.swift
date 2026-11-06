import UIKit
import WebKit

/// Holds the web view and makes room for the keyboard the way native apps do: the page area
/// shrinks together with the keyboard (same duration and curve), so a text field is never hidden
/// and iOS has no reason to jump-scroll the page. While a window (dialog) is open the page itself
/// cannot scroll at all, so any scroll iOS still attempts is undone at once.
@MainActor
final class WebContainer: UIView {
    let webView: WKWebView
    private var keyboardOverlap: CGFloat = 0
    private var offsetObservation: NSKeyValueObservation?
    private var resettingOffset = false

    /// Set from the page (Web/ios-native.js) while a window is open
    var pinScroll = false {
        didSet { if pinScroll { resetOffsetIfPinned() } }
    }

    init(webView: WKWebView) {
        self.webView = webView
        super.init(frame: .zero)
        backgroundColor = webView.backgroundColor
        addSubview(webView)
        let center = NotificationCenter.default
        center.addObserver(self, selector: #selector(keyboardWillChange(_:)),
                           name: UIResponder.keyboardWillChangeFrameNotification, object: nil)
        center.addObserver(self, selector: #selector(keyboardWillChange(_:)),
                           name: UIResponder.keyboardWillHideNotification, object: nil)
        offsetObservation = webView.scrollView.observe(\.contentOffset, options: [.new]) { [weak self] _, _ in
            MainActor.assumeIsolated { self?.resetOffsetIfPinned() }
        }
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }

    override func layoutSubviews() {
        super.layoutSubviews()
        webView.frame = CGRect(x: 0, y: 0, width: bounds.width, height: max(0, bounds.height - keyboardOverlap))
    }

    @objc private func keyboardWillChange(_ note: Notification) {
        guard let info = note.userInfo, let window else { return }
        var overlap: CGFloat = 0
        if note.name != UIResponder.keyboardWillHideNotification,
           let end = (info[UIResponder.keyboardFrameEndUserInfoKey] as? NSValue)?.cgRectValue {
            let keyboard = convert(end, from: window.screen.coordinateSpace)
            // A keyboard that is off screen or undocked (floating on iPad) takes no room
            if keyboard.minY < bounds.maxY, keyboard.maxY >= bounds.maxY - 1 {
                overlap = max(0, bounds.maxY - keyboard.minY)
            }
        }
        guard abs(overlap - keyboardOverlap) > 0.5 else { return }
        keyboardOverlap = overlap
        let duration = (info[UIResponder.keyboardAnimationDurationUserInfoKey] as? NSNumber)?.doubleValue ?? 0.25
        let curve = (info[UIResponder.keyboardAnimationCurveUserInfoKey] as? NSNumber)?.uintValue ?? 7
        UIView.animate(withDuration: duration, delay: 0,
                       options: [UIView.AnimationOptions(rawValue: curve << 16), .beginFromCurrentState, .allowUserInteraction]) {
            self.setNeedsLayout()
            self.layoutIfNeeded()
        }
    }

    private func resetOffsetIfPinned() {
        guard pinScroll, !resettingOffset else { return }
        let scrollView = webView.scrollView
        let resting = CGPoint(x: -scrollView.adjustedContentInset.left, y: -scrollView.adjustedContentInset.top)
        guard abs(scrollView.contentOffset.y - resting.y) > 0.5 || abs(scrollView.contentOffset.x - resting.x) > 0.5 else { return }
        resettingOffset = true
        scrollView.setContentOffset(resting, animated: false)
        resettingOffset = false
    }
}
