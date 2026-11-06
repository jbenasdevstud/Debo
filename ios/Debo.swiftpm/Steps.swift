import Foundation
import CoreMotion

/// Step counts from the phone's motion sensor (no Apple Health needed). Today plus the six days
/// before, which is as far back as the motion sensor keeps them. Nothing leaves the device.
@MainActor
final class Steps {
    static let shared = Steps()
    private let pedometer = CMPedometer()

    /// Calls back with JSON: {"status":"ok","days":[{"date":ms,"steps":n,"distance":m}, …]} newest first,
    /// or {"status":"denied"} / {"status":"unavailable"}
    func load(reply: @escaping (String) -> Void) {
        guard CMPedometer.isStepCountingAvailable() else {
            reply(#"{"status":"unavailable"}"#)
            return
        }
        switch CMPedometer.authorizationStatus() {
        case .denied, .restricted:
            reply(#"{"status":"denied"}"#)
            return
        default:
            break
        }
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let results = StepResults(count: 7)
        let group = DispatchGroup()
        for offset in 0..<7 {
            guard let start = calendar.date(byAdding: .day, value: -offset, to: today) else { continue }
            let end = offset == 0 ? Date() : (calendar.date(byAdding: .day, value: 1, to: start) ?? Date())
            results.setDate(offset, start)
            group.enter()
            pedometer.queryPedometerData(from: start, to: end) { data, error in
                if let error = error as NSError?, error.domain == CMErrorDomain,
                   error.code == Int(CMErrorMotionActivityNotAuthorized.rawValue) {
                    results.markDenied()
                }
                results.set(offset, steps: data?.numberOfSteps.intValue ?? 0, distance: data?.distance?.doubleValue ?? 0)
                group.leave()
            }
        }
        group.notify(queue: .main) {
            reply(results.json())
        }
    }
}

/// Collects the answers of the seven queries, which arrive on a background queue
private final class StepResults: @unchecked Sendable {
    private let lock = NSLock()
    private var dates: [Date]
    private var steps: [Int]
    private var distances: [Double]
    private var denied = false

    init(count: Int) {
        dates = Array(repeating: Date(), count: count)
        steps = Array(repeating: 0, count: count)
        distances = Array(repeating: 0, count: count)
    }

    func setDate(_ index: Int, _ date: Date) {
        lock.lock(); dates[index] = date; lock.unlock()
    }

    func set(_ index: Int, steps value: Int, distance: Double) {
        lock.lock(); steps[index] = value; distances[index] = distance; lock.unlock()
    }

    func markDenied() {
        lock.lock(); denied = true; lock.unlock()
    }

    func json() -> String {
        lock.lock(); defer { lock.unlock() }
        if denied { return #"{"status":"denied"}"# }
        let days = (0..<dates.count).map { i in
            "{\"date\":\(Int(dates[i].timeIntervalSince1970 * 1000)),\"steps\":\(steps[i]),\"distance\":\(Int(distances[i]))}"
        }
        return "{\"status\":\"ok\",\"days\":[\(days.joined(separator: ","))]}"
    }
}
