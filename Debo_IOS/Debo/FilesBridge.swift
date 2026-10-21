import UIKit

// window.AndroidFiles on iOS: the backup file goes to "Save to Files" (iCloud Drive, On My iPhone, …).
// The result is reported to window.onFileSaved like on Android: "ok", "cancel" or "error".
final class FilesBridge: NSObject, UIDocumentPickerDelegate {
    private weak var presenter: UIViewController?
    private let send: (String) -> Void

    init(presenter: UIViewController, send: @escaping (String) -> Void) {
        self.presenter = presenter
        self.send = send
    }

    func save(name: String, text: String) {
        let safeName = name.isEmpty ? "debo.json" : name.replacingOccurrences(of: "/", with: "-")
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(safeName)
        do {
            try text.write(to: url, atomically: true, encoding: .utf8)
        } catch {
            finish("error")
            return
        }
        DispatchQueue.main.async {
            let picker = UIDocumentPickerViewController(forExporting: [url], asCopy: true)
            picker.delegate = self
            self.presenter?.present(picker, animated: true)
        }
    }

    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        finish("ok")
    }

    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        finish("cancel")
    }

    private func finish(_ result: String) {
        send("window.onFileSaved && window.onFileSaved(\"\(result)\")")
    }
}
