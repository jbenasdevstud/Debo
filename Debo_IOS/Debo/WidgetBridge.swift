import Foundation
import WidgetKit

// window.AndroidWidget on iOS: the web app's widget payload (latest value, unit, arrow, state, time…) is stored in the
// App Group shared with the DeboWidget extension, and the widget is redrawn.
enum WidgetBridge {
    static let appGroup = "group.com.debo.app"
    static let payloadKey = "debo.widget"

    static func update(json: String) {
        guard let defaults = UserDefaults(suiteName: appGroup) else { return }
        if defaults.string(forKey: payloadKey) == json { return }
        defaults.set(json, forKey: payloadKey)
        WidgetCenter.shared.reloadAllTimelines()
    }
}
