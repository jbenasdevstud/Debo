import Foundation
import HealthKit
import UIKit

// window.AndroidHealth on iOS: blood glucose comes from Apple Health instead of Health Connect. Read only.
// Results go back to the same JavaScript callbacks the Android app uses (onHealthPermission, onHealthGlucose).
final class HealthBridge {
    private static let askedKey = "debo.health.asked"
    private static let maxRecords = 20_000

    private let store = HKHealthStore()
    private let glucoseType = HKQuantityType.quantityType(forIdentifier: .bloodGlucose)!
    private let send: (String) -> Void

    init(send: @escaping (String) -> Void) {
        self.send = send
    }

    // iOS never tells an app whether reading was allowed (privacy), so once the permission sheet has been shown
    // the status is "granted"; if the person said no, the readings simply come back empty.
    var status: String {
        guard HKHealthStore.isHealthDataAvailable() else { return "unavailable" }
        return UserDefaults.standard.bool(forKey: Self.askedKey) ? "granted" : "available"
    }

    func handle(_ body: [String: Any]) {
        switch body["op"] as? String {
        case "request":
            requestPermission()
        case "read":
            read(since: (body["since"] as? NSNumber)?.doubleValue ?? 0)
        case "settings":
            // Opens the Health app, where Sources → Debo lists what Debo may read
            if let url = URL(string: "x-apple-health://") {
                DispatchQueue.main.async { UIApplication.shared.open(url) }
            }
        default:
            break
        }
    }

    private func requestPermission() {
        guard HKHealthStore.isHealthDataAvailable() else {
            emit("onHealthPermission", "unavailable")
            return
        }
        store.requestAuthorization(toShare: nil, read: [glucoseType]) { success, _ in
            if success {
                UserDefaults.standard.set(true, forKey: Self.askedKey)
            }
            self.emit("onHealthPermission", success ? "granted" : "denied")
        }
    }

    private func read(since: Double) {
        guard HKHealthStore.isHealthDataAvailable() else {
            emitResult(nil, error: "unavailable")
            return
        }
        let now = Date()
        // Same window as Android: never more than 30 days back
        let start = max(Date(timeIntervalSince1970: since / 1000), now.addingTimeInterval(-30 * 86_400))
        let predicate = HKQuery.predicateForSamples(withStart: start, end: now.addingTimeInterval(60), options: [])
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        let unit = HKUnit.moleUnit(with: .milli, molarMass: HKUnitMolarMassBloodGlucose).unitDivided(by: .liter())
        let query = HKSampleQuery(sampleType: glucoseType, predicate: predicate, limit: Self.maxRecords,
                                  sortDescriptors: [sort]) { _, samples, error in
            if error != nil {
                self.emitResult(nil, error: "read")
                return
            }
            let records: [[String: Any]] = (samples as? [HKQuantitySample] ?? []).map { sample in
                [
                    "id": sample.uuid.uuidString,
                    "ts": Int64(sample.startDate.timeIntervalSince1970 * 1000),
                    "mmol": sample.quantity.doubleValue(for: unit),
                    "origin": sample.sourceRevision.source.bundleIdentifier
                ]
            }
            self.emitResult(records, error: nil)
        }
        store.execute(query)
    }

    private func emitResult(_ records: [[String: Any]]?, error: String?) {
        var result: [String: Any] = ["ok": records != nil, "records": records ?? []]
        if let error = error {
            result["error"] = error
        }
        guard let data = try? JSONSerialization.data(withJSONObject: result),
              let json = String(data: data, encoding: .utf8) else { return }
        emit("onHealthGlucose", json)
    }

    // Updates the status the web app reads synchronously, then calls window[callback](value)
    private func emit(_ callback: String, _ value: String) {
        let script = "window.__deboNative && (window.__deboNative.healthStatus = \(Self.quote(status)));"
            + "window.\(callback) && window.\(callback)(\(Self.quote(value)))"
        DispatchQueue.main.async { self.send(script) }
    }

    // A JavaScript string literal for any text (JSON string rules are valid JavaScript)
    private static func quote(_ text: String) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: [text]),
              let array = String(data: data, encoding: .utf8) else { return "\"\"" }
        return String(array.dropFirst().dropLast())
    }
}
