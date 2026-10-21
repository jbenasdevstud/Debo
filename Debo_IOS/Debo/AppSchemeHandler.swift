import Foundation
import UniformTypeIdentifiers
import WebKit

// Serves the bundled web app (the "www" folder) at debo://localhost/…
// A real origin keeps IndexedDB and localStorage available, which file:// pages do not reliably get on iOS.
final class AppSchemeHandler: NSObject, WKURLSchemeHandler {
    static let scheme = "debo"
    static let startURL = URL(string: "debo://localhost/index.html")!

    private let root: URL

    init(root: URL) {
        self.root = root.standardizedFileURL
    }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(URLError(.badURL))
            return
        }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let file = root.appendingPathComponent(String(path.dropFirst())).standardizedFileURL
        // Never serve anything outside the www folder
        guard file.path.hasPrefix(root.path), let data = try? Data(contentsOf: file) else {
            urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist))
            return
        }
        var mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        if mime.hasPrefix("text/") || mime.contains("javascript") || mime.contains("json") {
            mime += "; charset=utf-8"
        }
        let headers = [
            "Content-Type": mime,
            "Content-Length": String(data.count),
            "Cache-Control": "no-cache"
        ]
        guard let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers) else {
            urlSchemeTask.didFailWithError(URLError(.cannotParseResponse))
            return
        }
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}
}
