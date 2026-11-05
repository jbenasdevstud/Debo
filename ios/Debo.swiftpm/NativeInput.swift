import UIKit
import WebKit

/// Native iOS text field / picker placed over the web field being edited (see Web/ios-native.js).
@MainActor
final class NativeInput: NSObject, UITextFieldDelegate {
    private weak var webView: WKWebView?
    private let field = PaddedTextField()
    private var token = 0
    private var kind = "text"
    private var type = "text"
    private var maxLength = 0
    private var datePicker: UIDatePicker?
    private var closingFromPage = false

    init(webView: WKWebView) {
        self.webView = webView
        super.init()
        field.delegate = self
        field.isHidden = true
        field.borderStyle = .none
        field.backgroundColor = .clear
        field.addTarget(self, action: #selector(textChanged), for: .editingChanged)
        webView.addSubview(field)
    }

    // MARK: Messages from the page

    func handle(_ body: [String: Any]) {
        let action = body["action"] as? String ?? ""
        let messageToken = (body["token"] as? NSNumber)?.intValue ?? 0
        switch action {
        case "open":
            open(body, token: messageToken)
        case "show":
            if messageToken == token, !field.isFirstResponder, kind != "select" { field.becomeFirstResponder() }
        case "move":
            if messageToken == token, let rect = body["rect"] as? [String: Any] { place(rect) }
        case "close":
            if messageToken == token { close(notifyPage: false) }
        default:
            break
        }
    }

    private func open(_ info: [String: Any], token newToken: Int) {
        if field.isFirstResponder { close(notifyPage: true) }
        token = newToken
        kind = info["kind"] as? String ?? "text"
        type = info["type"] as? String ?? "text"
        maxLength = (info["maxLength"] as? NSNumber)?.intValue ?? 0
        let value = info["value"] as? String ?? ""
        let rect = info["rect"] as? [String: Any] ?? [:]

        if kind == "select" {
            showOptions(info, rect: rect)
            return
        }

        configureKeyboard(info)
        field.text = value
        field.placeholder = kind == "text" ? (info["placeholder"] as? String) : nil
        if kind == "picker" {
            // The web field keeps showing its own value; the native field only carries the picker
            field.textColor = .clear
            field.tintColor = .clear
            field.inputView = makePicker(value: value, info: info)
        } else {
            field.inputView = nil
            datePicker = nil
            field.tintColor = nil
            let size = CGFloat((info["fontSize"] as? NSNumber)?.doubleValue ?? 16) * zoom
            let weight = (info["fontWeight"] as? NSNumber)?.intValue ?? 400
            let base = UIFont.systemFont(ofSize: size, weight: weight >= 600 ? .semibold : (weight >= 500 ? .medium : .regular))
            field.font = base.fontDescriptor.withDesign(.rounded).map { UIFont(descriptor: $0, size: size) } ?? base
            field.textColor = Self.color(info["color"] as? String) ?? .label
            switch info["align"] as? String {
            case "center": field.textAlignment = .center
            case "right", "end": field.textAlignment = .right
            default: field.textAlignment = .natural
            }
            field.insets = UIEdgeInsets(top: 0,
                                        left: CGFloat((info["paddingLeft"] as? NSNumber)?.doubleValue ?? 0) * zoom,
                                        bottom: 0,
                                        right: CGFloat((info["paddingRight"] as? NSNumber)?.doubleValue ?? 0) * zoom)
        }
        field.inputAccessoryView = needsDoneBar ? makeDoneBar() : nil
        place(rect)
        field.isHidden = false
        field.becomeFirstResponder()
        if kind == "text" {
            let end = field.endOfDocument
            field.selectedTextRange = field.textRange(from: end, to: end)
        }
    }

    private var needsDoneBar: Bool {
        kind == "picker" || [.numberPad, .decimalPad, .phonePad].contains(field.keyboardType)
    }

    private var zoom: CGFloat { webView?.scrollView.zoomScale ?? 1 }

    private func configureKeyboard(_ info: [String: Any]) {
        let inputmode = info["inputmode"] as? String ?? ""
        field.isSecureTextEntry = type == "password"
        field.textContentType = nil
        switch (inputmode, type) {
        case ("numeric", _): field.keyboardType = .numberPad
        case ("decimal", _), (_, "number"): field.keyboardType = .decimalPad
        case ("email", _), (_, "email"): field.keyboardType = .emailAddress
        case ("tel", _), (_, "tel"): field.keyboardType = .phonePad
        case ("url", _), (_, "url"): field.keyboardType = .URL
        default: field.keyboardType = .default
        }
        switch info["autocapitalize"] as? String ?? "" {
        case "words": field.autocapitalizationType = .words
        case "characters": field.autocapitalizationType = .allCharacters
        case "none", "off": field.autocapitalizationType = .none
        default:
            field.autocapitalizationType = [.emailAddress, .URL].contains(field.keyboardType) || type == "password" ? .none : .sentences
        }
        field.autocorrectionType = [.emailAddress, .URL].contains(field.keyboardType) || type == "password" ? .no : .default
        switch info["autocomplete"] as? String ?? "" {
        case "given-name": field.textContentType = .givenName
        case "name": field.textContentType = .name
        case "email", "username": field.textContentType = .emailAddress
        case "current-password": field.textContentType = .password
        case "new-password": field.textContentType = .newPassword
        default: break
        }
        switch info["enterkeyhint"] as? String ?? "" {
        case "next": field.returnKeyType = .next
        case "search": field.returnKeyType = .search
        case "send": field.returnKeyType = .send
        case "go": field.returnKeyType = .go
        default: field.returnKeyType = type == "search" ? .search : .done
        }
    }

    /// Page coordinates (CSS px from the top-left of the visible page) → web view coordinates
    private func place(_ rect: [String: Any]) {
        guard let webView else { return }
        func value(_ key: String) -> CGFloat { CGFloat((rect[key] as? NSNumber)?.doubleValue ?? 0) }
        let inset = webView.scrollView.adjustedContentInset
        field.frame = CGRect(x: value("x") * zoom + inset.left,
                             y: value("y") * zoom + inset.top,
                             width: max(value("w") * zoom, 1),
                             height: max(value("h") * zoom, 1))
    }

    // MARK: Pickers

    private func makePicker(value: String, info: [String: Any]) -> UIView {
        let picker = UIDatePicker()
        picker.preferredDatePickerStyle = .wheels
        picker.locale = Locale.current
        switch type {
        case "time": picker.datePickerMode = .time
        case "datetime-local": picker.datePickerMode = .dateAndTime
        default: picker.datePickerMode = .date
        }
        if let date = Self.parse(value, type: type) { picker.date = date }
        if let min = Self.parse(info["min"] as? String ?? "", type: type) { picker.minimumDate = min }
        if let max = Self.parse(info["max"] as? String ?? "", type: type) { picker.maximumDate = max }
        picker.addTarget(self, action: #selector(pickerChanged), for: .valueChanged)
        datePicker = picker
        return picker
    }

    @objc private func pickerChanged() {
        guard let picker = datePicker else { return }
        send("window.__deboInput.input(\(token), \(Self.js(Self.format(picker.date, type: type))))")
    }

    private func showOptions(_ info: [String: Any], rect: [String: Any]) {
        guard let webView, let options = info["options"] as? [[String: Any]] else { return }
        let title = (info["label"] as? String).flatMap { $0.isEmpty ? nil : $0 }
        let sheet = UIAlertController(title: title, message: nil, preferredStyle: .actionSheet)
        let current = token
        for option in options where (option["disabled"] as? Bool) != true {
            let index = (option["index"] as? NSNumber)?.intValue ?? 0
            let selected = (option["selected"] as? Bool) == true
            let label = option["label"] as? String ?? ""
            sheet.addAction(UIAlertAction(title: selected ? "✓ \(label)" : label, style: .default) { [weak self] _ in
                self?.send("window.__deboInput.select(\(current), \(index))")
            })
        }
        sheet.addAction(UIAlertAction(title: Self.cancelTitle, style: .cancel) { [weak self] _ in
            self?.send("window.__deboInput.end(\(current))")
        })
        place(rect)
        if let popover = sheet.popoverPresentationController {
            popover.sourceView = webView
            popover.sourceRect = field.frame
        }
        guard var top = webView.window?.rootViewController else { return }
        while let next = top.presentedViewController { top = next }
        top.present(sheet, animated: true)
    }

    // MARK: Text field

    @objc private func textChanged() {
        send("window.__deboInput.input(\(token), \(Self.js(field.text ?? "")))")
    }

    func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
        guard kind == "text", maxLength > 0, let text = textField.text, let swiftRange = Range(range, in: text) else { return true }
        return text.replacingCharacters(in: swiftRange, with: string).count <= maxLength
    }

    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        send("window.__deboInput.enter(\(token))")
        return false
    }

    func textFieldDidEndEditing(_ textField: UITextField) {
        if !closingFromPage { send("window.__deboInput.end(\(token))") }
        field.isHidden = true
    }

    private func close(notifyPage: Bool) {
        closingFromPage = !notifyPage
        if field.isFirstResponder { field.resignFirstResponder() } else { field.isHidden = true }
        closingFromPage = false
    }

    private func makeDoneBar() -> UIToolbar {
        let bar = UIToolbar(frame: CGRect(x: 0, y: 0, width: 320, height: 44))
        let done = UIBarButtonItem(systemItem: .done, primaryAction: UIAction { [weak self] _ in
            self?.close(notifyPage: true)
        })
        bar.items = [UIBarButtonItem(systemItem: .flexibleSpace), done]
        bar.sizeToFit()
        return bar
    }

    // MARK: Helpers

    private func send(_ script: String) {
        webView?.evaluateJavaScript(script, completionHandler: nil)
    }

    private static var cancelTitle: String {
        switch Locale.preferredLanguages.first?.prefix(2) {
        case "lt": return "Atšaukti"
        case "lv": return "Atcelt"
        case "pl": return "Anuluj"
        case "de": return "Abbrechen"
        default: return "Cancel"
        }
    }

    /// A Swift string as a JavaScript string literal
    private static func js(_ text: String) -> String {
        let data = (try? JSONSerialization.data(withJSONObject: [text])) ?? Data("[\"\"]".utf8)
        let array = String(data: data, encoding: .utf8) ?? "[\"\"]"
        return String(array.dropFirst().dropLast())
    }

    private static func formatter(_ type: String) -> DateFormatter {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.calendar = Calendar(identifier: .gregorian)
        f.timeZone = .current
        switch type {
        case "time": f.dateFormat = "HH:mm"
        case "datetime-local": f.dateFormat = "yyyy-MM-dd'T'HH:mm"
        case "month": f.dateFormat = "yyyy-MM"
        default: f.dateFormat = "yyyy-MM-dd"
        }
        return f
    }

    private static func parse(_ value: String, type: String) -> Date? {
        guard !value.isEmpty else { return nil }
        let trimmed = type == "time" ? String(value.prefix(5)) : (type == "datetime-local" ? String(value.prefix(16)) : value)
        return formatter(type).date(from: trimmed)
    }

    private static func format(_ date: Date, type: String) -> String {
        formatter(type).string(from: date)
    }

    /// "rgb(17, 72, 60)" / "rgba(…)" → UIColor
    private static func color(_ css: String?) -> UIColor? {
        guard let css, let open = css.firstIndex(of: "("), let close = css.lastIndex(of: ")") else { return nil }
        let parts = css[css.index(after: open)..<close]
            .split(whereSeparator: { $0 == "," || $0 == " " || $0 == "/" })
            .compactMap { Double($0) }
        guard parts.count >= 3 else { return nil }
        let alpha = parts.count >= 4 ? parts[3] : 1
        return UIColor(red: parts[0] / 255, green: parts[1] / 255, blue: parts[2] / 255, alpha: alpha == 0 ? 1 : alpha)
    }
}

final class PaddedTextField: UITextField {
    var insets = UIEdgeInsets.zero

    override func textRect(forBounds bounds: CGRect) -> CGRect { bounds.inset(by: insets) }
    override func editingRect(forBounds bounds: CGRect) -> CGRect { bounds.inset(by: insets) }
    override func placeholderRect(forBounds bounds: CGRect) -> CGRect { bounds.inset(by: insets) }
}
