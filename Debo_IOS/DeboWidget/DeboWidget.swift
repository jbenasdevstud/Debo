import SwiftUI
import UIKit
import WidgetKit

// Home-screen widget: latest glucose value, trend arrow and time, like the Android widget.
// The app writes the same JSON payload it sends to Android (see WidgetBridge.swift) into the shared App Group.

private enum Shared {
    static let appGroup = "group.com.debo.app"
    static let payloadKey = "debo.widget"
    static let openApp = URL(string: "debo-app://open")!
    static let addGlucose = URL(string: "debo-app://glucose")!
    // Same as Android: after 2 hours the reading is shown greyed out with the "stale" text
    static let staleAfter: TimeInterval = 2 * 60 * 60
}

private enum Texts {
    private static var language: String {
        let code = Locale.preferredLanguages.first?.prefix(2).lowercased() ?? "en"
        return ["lt", "lv", "pl", "de"].contains(code) ? code : "en"
    }

    static var description: String {
        ["lt": "Paskutinis gliukozės rodmuo ir tendencija", "lv": "Pēdējais glikozes rādījums un tendence",
         "pl": "Ostatni pomiar glukozy i trend", "de": "Letzter Glukosewert und Trend"][language]
            ?? "Latest glucose reading and trend"
    }

    static var empty: String {
        ["lt": "Rodmenų dar nėra", "lv": "Rādījumu vēl nav", "pl": "Brak pomiarów", "de": "Noch kein Wert"][language]
            ?? "No reading yet"
    }

    static var add: String {
        ["lt": "Įvesti gliukozę", "lv": "Ievadīt glikozi", "pl": "Wpisz glukozę", "de": "Glukose eintragen"][language]
            ?? "Add glucose"
    }
}

private enum Palette {
    private static func dynamic(_ light: UInt32, _ dark: UInt32) -> Color {
        Color(UIColor { traits in
            let hex = traits.userInterfaceStyle == .dark ? dark : light
            return UIColor(red: CGFloat((hex >> 16) & 0xFF) / 255,
                           green: CGFloat((hex >> 8) & 0xFF) / 255,
                           blue: CGFloat(hex & 0xFF) / 255,
                           alpha: 1)
        })
    }

    // The Android widget's colours (res/values and res/values-night)
    static let background = dynamic(0xFFFFFF, 0x1C1C1E)
    static let ink = dynamic(0x000000, 0xFFFFFF)
    static let muted = dynamic(0x8A8A8E, 0x98989F)
    static let accent = dynamic(0x1E9A5A, 0x30D158)
    static let buttonBackground = dynamic(0xE2F6EA, 0x16301F)
    static let low = dynamic(0xDC4B55, 0xF07A82)
    static let target = dynamic(0x1F8A55, 0x5FD39A)
    static let high = dynamic(0xB47C12, 0xF2C25C)
}

struct WidgetPayload {
    var value = ""
    var unit = ""
    var arrow = ""
    var state = "normal"
    var timestamp: Double = 0
    var meta = ""
    var staleText = ""
    var emptyText = ""

    var hasReading: Bool { timestamp > 0 && !value.isEmpty }

    var readingDate: Date { Date(timeIntervalSince1970: timestamp / 1000) }

    func isStale(at date: Date) -> Bool {
        hasReading && date.timeIntervalSince(readingDate) > Shared.staleAfter
    }

    static func load() -> WidgetPayload {
        guard let json = UserDefaults(suiteName: Shared.appGroup)?.string(forKey: Shared.payloadKey),
              let data = json.data(using: .utf8),
              let object = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else {
            return WidgetPayload()
        }
        var payload = WidgetPayload()
        payload.value = object["value"] as? String ?? ""
        payload.unit = object["unit"] as? String ?? ""
        payload.arrow = object["arrow"] as? String ?? ""
        payload.state = object["state"] as? String ?? "normal"
        payload.timestamp = (object["timestamp"] as? NSNumber)?.doubleValue ?? 0
        payload.meta = object["meta"] as? String ?? ""
        payload.staleText = object["staleText"] as? String ?? ""
        payload.emptyText = object["emptyText"] as? String ?? ""
        return payload
    }

    static let sample = WidgetPayload(value: "6.4", unit: "mmol/L", arrow: "→", state: "normal",
                                      timestamp: Date().timeIntervalSince1970 * 1000, meta: "12:30")
}

struct GlucoseEntry: TimelineEntry {
    let date: Date
    let payload: WidgetPayload
}

struct GlucoseProvider: TimelineProvider {
    func placeholder(in context: Context) -> GlucoseEntry {
        GlucoseEntry(date: Date(), payload: .sample)
    }

    func getSnapshot(in context: Context, completion: @escaping (GlucoseEntry) -> Void) {
        let payload = WidgetPayload.load()
        completion(GlucoseEntry(date: Date(), payload: context.isPreview && !payload.hasReading ? .sample : payload))
    }

    // One entry now and, if the reading will turn stale, one at that moment; the app reloads the widget on every new reading
    func getTimeline(in context: Context, completion: @escaping (Timeline<GlucoseEntry>) -> Void) {
        let payload = WidgetPayload.load()
        let now = Date()
        var entries = [GlucoseEntry(date: now, payload: payload)]
        if payload.hasReading {
            let staleAt = payload.readingDate.addingTimeInterval(Shared.staleAfter + 1)
            if staleAt > now {
                entries.append(GlucoseEntry(date: staleAt, payload: payload))
            }
        }
        completion(Timeline(entries: entries, policy: .never))
    }
}

struct GlucoseWidgetView: View {
    let entry: GlucoseEntry
    @Environment(\.widgetFamily) private var family

    private var payload: WidgetPayload { entry.payload }
    private var stale: Bool { payload.isStale(at: entry.date) }

    private var valueColor: Color {
        if stale { return Palette.muted }
        switch payload.state {
        case "low": return Palette.low
        case "high": return Palette.high
        default: return Palette.target
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(alignment: .center) {
                Text("Debo")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundColor(Palette.muted)
                Spacer(minLength: 4)
                if family != .systemSmall {
                    Link(destination: Shared.addGlucose) {
                        HStack(spacing: 4) {
                            Image(systemName: "plus")
                                .font(.system(size: 13, weight: .bold))
                            Text(Texts.add)
                                .font(.system(size: 13, weight: .semibold, design: .rounded))
                        }
                        .foregroundColor(Palette.accent)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Capsule().fill(Palette.buttonBackground))
                    }
                }
            }
            Spacer(minLength: 0)
            if payload.hasReading {
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(payload.value)
                        .font(.system(size: 42, weight: .bold, design: .rounded))
                        .foregroundColor(valueColor)
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                    if !stale && !payload.arrow.isEmpty {
                        Text(payload.arrow)
                            .font(.system(size: 26, weight: .bold))
                            .foregroundColor(valueColor)
                    }
                }
                Text(payload.unit)
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundColor(Palette.ink.opacity(0.7))
                Text(stale ? payload.staleText : payload.meta)
                    .font(.system(size: 12, design: .rounded))
                    .foregroundColor(Palette.muted)
                    .lineLimit(2)
            } else {
                Text("—")
                    .font(.system(size: 42, weight: .bold, design: .rounded))
                    .foregroundColor(Palette.muted)
                Text(payload.emptyText.isEmpty ? Texts.empty : payload.emptyText)
                    .font(.system(size: 12, design: .rounded))
                    .foregroundColor(Palette.muted)
                    .lineLimit(2)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        // Tapping the widget opens Debo; the "+" button (medium size) opens the glucose entry
        .widgetURL(Shared.openApp)
    }
}

private extension View {
    // iOS 17 requires widgets to declare their background this way (otherwise the widget shows a warning instead)
    @ViewBuilder
    func deboWidgetBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(Palette.background, for: .widget)
        } else {
            padding(16).background(Palette.background)
        }
    }
}

@main
struct DeboWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "DeboGlucoseWidget", provider: GlucoseProvider()) { entry in
            GlucoseWidgetView(entry: entry)
                .deboWidgetBackground()
        }
        .configurationDisplayName("Debo")
        .description(Texts.description)
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
