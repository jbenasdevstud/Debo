import Foundation
import UserNotifications

// window.AndroidReminders on iOS: the web app's reminders become local notifications.
// Daily and weekly reminders repeat by themselves. Shorter intervals (the 2-hourly glucose reminder) are scheduled
// as the next few occurrences and renewed every time the web app reschedules them, because iOS has no
// "every N hours" trigger that also skips a night pause.
final class RemindersBridge {
    private static let day: TimeInterval = 86_400
    // iOS keeps at most 64 pending notifications per app; 12 two-hourly ones cover a full day
    private static let maxOccurrences = 12

    private let center = UNUserNotificationCenter.current()
    // Every operation runs here one after another, so "cancel" and "schedule" for the same reminder can never interleave
    private let queue = DispatchQueue(label: "com.debo.reminders")
    private var askedPermission = false

    func handle(_ body: [String: Any]) {
        let id = (body["id"] as? NSNumber)?.intValue ?? 0
        let at = Date(timeIntervalSince1970: ((body["at"] as? NSNumber)?.doubleValue ?? 0) / 1000)
        let title = body["title"] as? String ?? ""
        let text = body["body"] as? String ?? ""
        let interval = ((body["interval"] as? NSNumber)?.doubleValue ?? 0) / 1000
        let quiet = Self.quietWindow(from: body["quietFrom"], to: body["quietTo"])
        let operation = body["op"] as? String ?? ""
        if operation == "schedule" || operation == "repeat" {
            askPermission()
        }
        queue.async {
            self.remove(id)
            switch operation {
            case "schedule":
                self.add(identifier: Self.identifier(id), at: at, title: title, body: text)
            case "repeat":
                self.scheduleRepeating(id: id, first: at, interval: interval, title: title, body: text, quiet: quiet)
            default:
                break
            }
        }
    }

    private static func identifier(_ id: Int) -> String {
        "debo-\(id)"
    }

    // The night pause sent by the web app (minutes after midnight), or nil when there is none
    private static func quietWindow(from: Any?, to: Any?) -> (from: Int, to: Int)? {
        guard let start = (from as? NSNumber)?.intValue, let end = (to as? NSNumber)?.intValue,
              start >= 0, end >= 0, start != end else { return nil }
        return (from: start, to: end)
    }

    private func askPermission() {
        guard !askedPermission else { return }
        askedPermission = true
        center.requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
    }

    private func content(title: String, body: String) -> UNMutableNotificationContent {
        let content = UNMutableNotificationContent()
        content.title = title.isEmpty ? "Debo" : title
        content.body = body
        content.sound = .default
        return content
    }

    // Runs on `queue` and waits until iOS has stored the request
    private func add(identifier: String, trigger: UNNotificationTrigger, title: String, body: String) {
        let done = DispatchSemaphore(value: 0)
        let request = UNNotificationRequest(identifier: identifier, content: content(title: title, body: body), trigger: trigger)
        center.add(request) { _ in done.signal() }
        done.wait()
    }

    private func add(identifier: String, at date: Date, title: String, body: String) {
        guard date > Date() else { return }
        let parts = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
        add(identifier: identifier, trigger: UNCalendarNotificationTrigger(dateMatching: parts, repeats: false), title: title, body: body)
    }

    private func scheduleRepeating(id: Int, first: Date, interval: TimeInterval, title: String, body: String,
                                   quiet: (from: Int, to: Int)?) {
        guard interval > 0 else { return }
        if quiet == nil, interval == Self.day || interval == Self.day * 7 {
            var parts = Calendar.current.dateComponents([.hour, .minute], from: first)
            if interval == Self.day * 7 {
                parts.weekday = Calendar.current.component(.weekday, from: first)
            }
            add(identifier: Self.identifier(id), trigger: UNCalendarNotificationTrigger(dateMatching: parts, repeats: true),
                title: title, body: body)
            return
        }
        var at = first
        let now = Date()
        while at <= now {
            at = at.addingTimeInterval(interval)
        }
        for index in 0..<Self.maxOccurrences {
            // Same rule as Android: a reminder that falls in the night pause waits until the pause ends
            if let quiet = quiet, Self.inQuiet(at, from: quiet.from, to: quiet.to) {
                at = Self.quietEnd(after: at, to: quiet.to)
            }
            add(identifier: "\(Self.identifier(id))-\(index)", at: at, title: title, body: body)
            at = at.addingTimeInterval(interval)
        }
    }

    // Runs on `queue`: removes every pending and shown notification of this reminder before returning
    private func remove(_ id: Int) {
        let base = Self.identifier(id)
        let matches: (String) -> Bool = { $0 == base || $0.hasPrefix(base + "-") }
        let done = DispatchSemaphore(value: 0)
        var pending: [String] = []
        var shown: [String] = []
        center.getPendingNotificationRequests { requests in
            pending = requests.map { $0.identifier }.filter(matches)
            done.signal()
        }
        done.wait()
        center.getDeliveredNotifications { notifications in
            shown = notifications.map { $0.request.identifier }.filter(matches)
            done.signal()
        }
        done.wait()
        if !pending.isEmpty {
            center.removePendingNotificationRequests(withIdentifiers: pending)
        }
        if !shown.isEmpty {
            center.removeDeliveredNotifications(withIdentifiers: shown)
        }
    }

    // Quiet window in minutes after midnight; it may cross midnight (e.g. 22:00–07:00)
    static func inQuiet(_ date: Date, from: Int, to: Int) -> Bool {
        let parts = Calendar.current.dateComponents([.hour, .minute], from: date)
        let minute = (parts.hour ?? 0) * 60 + (parts.minute ?? 0)
        return from < to ? (minute >= from && minute < to) : (minute >= from || minute < to)
    }

    static func quietEnd(after date: Date, to: Int) -> Date {
        let calendar = Calendar.current
        var end = calendar.date(bySettingHour: to / 60, minute: to % 60, second: 0, of: date) ?? date
        if end <= date {
            end = calendar.date(byAdding: .day, value: 1, to: end) ?? end.addingTimeInterval(Self.day)
        }
        return end
    }
}
