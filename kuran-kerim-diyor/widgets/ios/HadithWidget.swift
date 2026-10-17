import WidgetKit
import SwiftUI

// Günün Hadisi widget'ı. Uygulama önümüzdeki 14 günün hadisini App Group'a yazar;
// widget bunları günün başında değişen zaman çizelgesi girdilerine dönüştürür.

struct HadithEntry: TimelineEntry {
    let date: Date
    let id: String
    let text: String
    let reference: String
    let gradeLabel: String
    let title: String
    let language: String
}

private struct HadithWidgetStore {
    let title: String
    let language: String
    let gradeLabels: [String: String]
    let days: [(date: String, id: String, text: String, reference: String, grade: String)]

    static func load() -> HadithWidgetStore {
        let suite = getAppUserDefaults()
        let raw = suite.string(forKey: "MyData")
            ?? suite.string(forKey: "widgetdata")
            ?? UserDefaults.standard.string(forKey: "MyData")
        let json = raw.flatMap { $0.data(using: .utf8) }
            .flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] } ?? [:]
        let language = json["language"] as? String ?? getSystemLanguage()
        let hadith = json["hadith"] as? [String: Any] ?? [:]
        let rawDays = hadith["days"] as? [[String: Any]] ?? []
        let days = rawDays.compactMap { day -> (String, String, String, String, String)? in
            guard let date = day["date"] as? String, let id = day["id"] as? String,
                  let text = day["text"] as? String, !text.isEmpty else { return nil }
            return (date, id, text, day["reference"] as? String ?? "", day["grade"] as? String ?? "")
        }
        return HadithWidgetStore(
            title: hadith["title"] as? String ?? defaultHadithTitle(language),
            language: language,
            gradeLabels: hadith["gradeLabels"] as? [String: String] ?? [:],
            days: days.map { (date: $0.0, id: $0.1, text: $0.2, reference: $0.3, grade: $0.4) }
        )
    }

    func entry(for day: (date: String, id: String, text: String, reference: String, grade: String), at date: Date) -> HadithEntry {
        HadithEntry(
            date: date,
            id: day.id,
            text: day.text,
            reference: day.reference,
            gradeLabel: gradeLabels[day.grade] ?? day.grade.capitalized,
            title: title,
            language: language
        )
    }
}

private func defaultHadithTitle(_ lang: String) -> String {
    switch lang {
    case "en": return "HADITH OF THE DAY"
    case "de": return "HADITH DES TAGES"
    case "fr": return "HADITH DU JOUR"
    case "es": return "HADIZ DEL DÍA"
    case "ar": return "حديث اليوم"
    default: return "GÜNÜN HADİSİ"
    }
}

private let hadithDayFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.timeZone = .current
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter
}()

private let sampleHadith = HadithEntry(
    date: Date(),
    id: "bukhari-69",
    text: "Kolaylaştırın, zorlaştırmayın; müjdeleyin, nefret ettirmeyin.",
    reference: "Buhârî, 69",
    gradeLabel: "Sahih",
    title: "GÜNÜN HADİSİ",
    language: "tr"
)

struct HadithProvider: TimelineProvider {
    func placeholder(in context: Context) -> HadithEntry {
        sampleHadith
    }

    func getSnapshot(in context: Context, completion: @escaping (HadithEntry) -> ()) {
        let store = HadithWidgetStore.load()
        let today = hadithDayFormatter.string(from: Date())
        if let day = store.days.first(where: { $0.date == today }) ?? store.days.first {
            completion(store.entry(for: day, at: Date()))
        } else {
            completion(sampleHadith)
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HadithEntry>) -> ()) {
        let store = HadithWidgetStore.load()
        let todayKey = hadithDayFormatter.string(from: Date())

        // Bugünden itibaren her gün için gece yarısında değişen bir girdi oluştur.
        var entries: [HadithEntry] = []
        for day in store.days where day.date >= todayKey {
            guard let dayStart = hadithDayFormatter.date(from: day.date) else { continue }
            entries.append(store.entry(for: day, at: day.date == todayKey ? Date() : dayStart))
        }

        if !entries.isEmpty, store.days.contains(where: { $0.date == todayKey }) {
            let refresh = Calendar.current.date(byAdding: .day, value: 1, to: entries.last!.date) ?? Date().addingTimeInterval(86_400)
            completion(Timeline(entries: entries, policy: .after(Calendar.current.startOfDay(for: refresh))))
            return
        }

        // Uygulama uzun süredir açılmadı: günün hadisini sunucudan al, olmazsa son bilineni göster.
        fetchDailyHadith(language: store.language) { response in
            let entry: HadithEntry
            if let response = response {
                entry = HadithEntry(
                    date: Date(),
                    id: response.id,
                    text: response.excerpt,
                    reference: response.reference,
                    gradeLabel: store.gradeLabels[response.grade] ?? response.grade.capitalized,
                    title: store.title,
                    language: store.language
                )
            } else if let last = store.days.last(where: { $0.date <= todayKey }) {
                entry = store.entry(for: last, at: Date())
            } else {
                entry = sampleHadith
            }
            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 3, to: Date()) ?? Date().addingTimeInterval(10_800)
            completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
        }
    }

    private struct DailyHadithResponse: Codable {
        let id: String
        let excerpt: String
        let reference: String
        let grade: String
    }

    private func fetchDailyHadith(language: String, completion: @escaping (DailyHadithResponse?) -> Void) {
        var components = URLComponents(string: "https://api.kurannediyor.com.tr/api/hadith/daily")
        components?.queryItems = [
            URLQueryItem(name: "lang", value: language),
            URLQueryItem(name: "tz", value: TimeZone.current.identifier),
        ]
        guard let url = components?.url else {
            completion(nil)
            return
        }
        URLSession.shared.dataTask(with: url) { data, _, error in
            guard let data = data, error == nil else {
                completion(nil)
                return
            }
            completion(try? JSONDecoder().decode(DailyHadithResponse.self, from: data))
        }.resume()
    }
}

struct HadithWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: HadithEntry

    private var deepLink: URL? {
        var components = URLComponents()
        components.scheme = "kuran-kerim-diyor"
        components.host = "hadith"
        components.queryItems = entry.id.isEmpty ? nil : [URLQueryItem(name: "id", value: entry.id)]
        return components.url
    }

    var body: some View {
        content
            .environment(\.layoutDirection, entry.language == "ar" ? .rightToLeft : .leftToRight)
            .widgetURL(deepLink)
    }

    @ViewBuilder
    private var content: some View {
        switch family {
        case .accessoryInline:
            Text("\(entry.reference)")
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.title).font(.caption2).fontWeight(.bold).lineLimit(1)
                Text(entry.text).font(.caption2).lineLimit(3)
            }
        case .systemMedium:
            card(textSize: 15, lines: 4)
        default:
            card(textSize: 12.5, lines: 5)
        }
    }

    private func card(textSize: CGFloat, lines: Int) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Text(entry.title)
                    .font(.system(size: 9.5, weight: .bold))
                    .foregroundColor(Color(hex: "B69A73"))
                    .lineLimit(1)
                Spacer(minLength: 4)
                if !entry.gradeLabel.isEmpty {
                    Text(entry.gradeLabel)
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(Color(hex: "9E7D47"))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color(hex: "B69A73").opacity(0.18))
                        .clipShape(Capsule())
                }
            }

            Text("“\(entry.text)”")
                .font(.system(size: textSize, weight: .medium, design: .serif))
                .lineLimit(lines)
                .minimumScaleFactor(0.8)
                .foregroundColor(.primary)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)

            Text(entry.reference)
                .font(.system(size: 9.5, weight: .bold))
                .foregroundColor(Color(hex: "B69A73"))
                .lineLimit(1)
        }
        .padding(14)
    }
}

struct HadithWidget: Widget {
    let kind: String = "HadithWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HadithProvider()) { entry in
            HadithWidgetEntryView(entry: entry)
                .compatibleWidgetBackground()
        }
        .configurationDisplayName(hadithWidgetName(getSystemLanguage()))
        .description(hadithWidgetDescription(getSystemLanguage()))
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryInline, .accessoryRectangular])
    }
}

private func hadithWidgetName(_ lang: String) -> String {
    switch lang {
    case "en": return "Hadith of the Day"
    case "de": return "Hadith des Tages"
    case "fr": return "Hadith du jour"
    case "es": return "Hadiz del día"
    case "ar": return "حديث اليوم"
    default: return "Günün Hadisi"
    }
}

private func hadithWidgetDescription(_ lang: String) -> String {
    switch lang {
    case "en": return "One hadith a day from authentic sources."
    case "de": return "Jeden Tag ein Hadith aus authentischen Quellen."
    case "fr": return "Un hadith par jour issu de sources authentiques."
    case "es": return "Un hadiz al día de fuentes auténticas."
    case "ar": return "حديث كل يوم من المصادر الصحيحة."
    default: return "Sahih kaynaklardan her gün bir hadis."
    }
}
