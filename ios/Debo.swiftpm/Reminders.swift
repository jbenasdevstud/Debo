import Foundation
import UserNotifications

/// iOS version of the Android ReminderBridge: local notifications for glucose checks, long-acting insulin,
/// post-meal checks, the hypo timer, weekly summary, custom, care and supply reminders.
@MainActor
final class Reminders: NSObject, UNUserNotificationCenterDelegate {
    static let shared = Reminders()

    private let center = UNUserNotificationCenter.current()
    private var askedPermission = false
    private let day: TimeInterval = 86_400
    /// iOS keeps at most 64 pending notifications, so short intervals (every 2 h) are scheduled as a
    /// series that covers about a day. The app schedules them again each time it is opened.
    private let seriesLength = 12

    func setUp() {
        center.delegate = self
    }

    func handle(_ body: [String: Any]) {
        guard let id = (body["id"] as? NSNumber)?.intValue else { return }
        if (body["action"] as? String) == "cancel" {
            cancel(id)
            return
        }
        let at = Date(timeIntervalSince1970: ((body["at"] as? NSNumber)?.doubleValue ?? 0) / 1000)
        let interval = ((body["interval"] as? NSNumber)?.doubleValue ?? 0) / 1000
        let quietFrom = (body["quietFrom"] as? NSNumber)?.intValue ?? -1
        let quietTo = (body["quietTo"] as? NSNumber)?.intValue ?? -1

        let content = UNMutableNotificationContent()
        content.title = body["title"] as? String ?? "Debo"
        content.body = body["body"] as? String ?? ""
        content.sound = .default

        requestPermissionIfNeeded()
        cancel(id)

        if interval <= 0 {
            guard at > Date() else { return }
            add("debo-\(id)", content, UNCalendarNotificationTrigger(dateMatching: fullDate(at), repeats: false))
        } else if quietFrom < 0, abs(interval - day) < 1 || abs(interval - day * 7) < 1 {
            // Daily / weekly at a fixed time
            var parts = Calendar.current.dateComponents([.hour, .minute], from: at)
            if abs(interval - day * 7) < 1 {
                parts.weekday = Calendar.current.component(.weekday, from: at)
            }
            add("debo-\(id)", content, UNCalendarNotificationTrigger(dateMatching: parts, repeats: true))
        } else {
            var next = at
            let now = Date()
            while next <= now { next.addTimeInterval(interval) }
            for n in 0..<seriesLength {
                if inQuiet(next, quietFrom, quietTo) { next = quietEnd(next, quietTo) }
                add("debo-\(id)-\(n)", content, UNCalendarNotificationTrigger(dateMatching: fullDate(next), repeats: false))
                next.addTimeInterval(interval)
            }
        }
    }

    func cancel(_ id: Int) {
        let ids = ["debo-\(id)"] + (0..<seriesLength).map { "debo-\(id)-\($0)" }
        center.removePendingNotificationRequests(withIdentifiers: ids)
        center.removeDeliveredNotifications(withIdentifiers: ids)
    }

    // MARK: Helpers

    private func add(_ identifier: String, _ content: UNNotificationContent, _ trigger: UNNotificationTrigger) {
        center.add(UNNotificationRequest(identifier: identifier, content: content, trigger: trigger))
    }

    private func requestPermissionIfNeeded() {
        guard !askedPermission else { return }
        askedPermission = true
        center.requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
    }

    private func fullDate(_ date: Date) -> DateComponents {
        Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
    }

    /// Quiet window in minutes after midnight, e.g. 1320 → 420 = 22:00–07:00 (same as Android)
    private func inQuiet(_ date: Date, _ from: Int, _ to: Int) -> Bool {
        if from < 0 || to < 0 || from == to { return false }
        let parts = Calendar.current.dateComponents([.hour, .minute], from: date)
        let minute = (parts.hour ?? 0) * 60 + (parts.minute ?? 0)
        return from < to ? (minute >= from && minute < to) : (minute >= from || minute < to)
    }

    private func quietEnd(_ date: Date, _ to: Int) -> Date {
        let calendar = Calendar.current
        var end = calendar.date(bySettingHour: to / 60, minute: to % 60, second: 0, of: date) ?? date
        if end <= date { end = calendar.date(byAdding: .day, value: 1, to: end) ?? end }
        return end
    }

    // Show reminders also while Debo is open
    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter,
                                            willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .list, .sound]
    }
}
