import UIKit
import VisionKit

/// Camera barcode scanner for food (EAN / UPC). Returns the code, or nil when cancelled.
@MainActor
final class BarcodeScanner: NSObject, DataScannerViewControllerDelegate {
    static var isAvailable: Bool {
        DataScannerViewController.isSupported && DataScannerViewController.isAvailable
    }

    private var finish: ((String?) -> Void)?
    private var scanner: DataScannerViewController?
    private var keepAlive: BarcodeScanner?

    init(finish: @escaping (String?) -> Void) {
        self.finish = finish
    }

    func makeController() -> UIViewController {
        let scanner = DataScannerViewController(
            recognizedDataTypes: [.barcode(symbologies: [.ean13, .ean8, .upce, .code128])],
            qualityLevel: .balanced,
            recognizesMultipleItems: false,
            isHighFrameRateTrackingEnabled: false,
            isHighlightingEnabled: true
        )
        scanner.delegate = self
        self.scanner = scanner
        keepAlive = self // the scanner holds its delegate weakly

        let close = UIBarButtonItem(systemItem: .cancel, primaryAction: UIAction { [weak self] _ in self?.done(nil) })
        scanner.navigationItem.leftBarButtonItem = close
        let navigation = ScannerNavigationController(rootViewController: scanner)
        navigation.onAppear = { [weak scanner] in try? scanner?.startScanning() }
        navigation.onDisappear = { [weak self] in self?.done(nil, dismiss: false) }
        navigation.modalPresentationStyle = .fullScreen
        return navigation
    }

    func dataScanner(_ dataScanner: DataScannerViewController, didAdd addedItems: [RecognizedItem], allItems: [RecognizedItem]) {
        for item in addedItems {
            if case .barcode(let barcode) = item, let code = barcode.payloadStringValue, !code.isEmpty {
                done(code)
                return
            }
        }
    }

    func dataScanner(_ dataScanner: DataScannerViewController, becameUnavailableWithError error: DataScannerViewController.ScanningUnavailable) {
        done(nil)
    }

    private func done(_ code: String?, dismiss: Bool = true) {
        guard let finish else { return }
        self.finish = nil
        scanner?.stopScanning()
        if dismiss { scanner?.navigationController?.dismiss(animated: true) }
        finish(code)
        keepAlive = nil
    }
}

private final class ScannerNavigationController: UINavigationController {
    var onAppear: (() -> Void)?
    var onDisappear: (() -> Void)?

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        onAppear?()
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        onDisappear?()
    }
}
