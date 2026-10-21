import UIKit
import WebKit

// window.AndroidPrint on iOS: the doctor report opens in the system print sheet,
// which can also save it as a PDF or share it (pinch out on the preview).
final class PrintBridge: NSObject, WKNavigationDelegate {
    private weak var presenter: UIViewController?
    private var reportView: WKWebView?
    private var jobName = "Debo"

    init(presenter: UIViewController) {
        self.presenter = presenter
    }

    func print(html: String, title: String) {
        guard let host = presenter?.view else { return }
        jobName = title.isEmpty ? "Debo" : title
        reportView?.removeFromSuperview()
        // A4 width in points, placed off screen: a web view must be in the window to render its pages for printing
        let view = WKWebView(frame: CGRect(x: -host.bounds.width - 700, y: 0, width: 595, height: 842))
        view.isUserInteractionEnabled = false
        view.navigationDelegate = self
        host.addSubview(view)
        reportView = view
        view.loadHTMLString(html, baseURL: nil)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        let info = UIPrintInfo(dictionary: nil)
        info.outputType = .general
        info.jobName = jobName
        let controller = UIPrintInteractionController.shared
        controller.printInfo = info
        controller.printFormatter = webView.viewPrintFormatter()
        controller.present(animated: true) { [weak self] _, _, _ in
            self?.reportView?.removeFromSuperview()
            self?.reportView = nil
        }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        webView.removeFromSuperview()
        reportView = nil
    }
}
