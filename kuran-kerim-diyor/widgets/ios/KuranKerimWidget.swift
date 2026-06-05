import WidgetKit
import SwiftUI

// API Response Struct
struct DailyVerseResponse: Codable {
    let text: String
    let reference: String
    let surahNumber: Int
    let startAyah: Int
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), text: "Gunun Ayeti yukleniyor...", reference: "", surah: 1, ayah: 1)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        completion(SimpleEntry(date: Date(), text: "Suphesiz her zorlukla beraber bir kolaylik vardir.", reference: "Insirah 5", surah: 94, ayah: 5))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        fetchDailyVerse { response in
            let entry: SimpleEntry
            if let res = response {
                entry = SimpleEntry(date: Date(), text: res.text, reference: res.reference, surah: res.surahNumber, ayah: res.startAyah)
            } else {
                entry = SimpleEntry(date: Date(), text: "Gunun Ayeti yuklenemedi. Lutfen internet baglantinizi kontrol edin.", reference: "", surah: 1, ayah: 1)
            }
            
            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 12, to: Date())!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }
    
    private func fetchDailyVerse(completion: @escaping (DailyVerseResponse?) -> Void) {
        guard let url = URL(string: "https://api.kurannediyor.com.tr/api/daily-context?lang=tr") else {
            completion(nil)
            return
        }
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            guard let data = data, error == nil else {
                completion(nil)
                return
            }
            
            do {
                let decoded = try JSONDecoder().decode(DailyVerseResponse.self, from: data)
                completion(decoded)
            } catch {
                print("Decoding failed: \(error)")
                completion(nil)
            }
        }.resume()
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let text: String
    let reference: String
    let surah: Int
    let ayah: Int
}

struct KuranKerimWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("GUNUN AYETI")
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(Color(hex: "B69A73"))
                .tracking(1)
            
            Text("“\(entry.text)”")
                .font(.system(size: 14, weight: .medium, design: .serif))
                .italic()
                .lineLimit(4)
                .minimumScaleFactor(0.8)
                .foregroundColor(.primary)
            
            Spacer()
            
            HStack {
                Spacer()
                Text(entry.reference)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(Color(hex: "B69A73"))
            }
        }
        .padding()
        .widgetURL(URL(string: "kuran-kerim-diyor://ayet/\(entry.surah):\(entry.ayah)"))
    }
}

struct KuranKerimWidget: Widget {
    let kind: String = "KuranKerimWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            KuranKerimWidgetEntryView(entry: entry)
                .containerBackground(.background, for: .widget)
        }
        .configurationDisplayName("Kuran Kerim Diyor")
        .description("Gunun ayetini ana ekraninizda gorun.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8 * 17) & 0xff, (int >> 4 & 0xff) * 17, (int & 0xf) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, (int >> 16) & 0xff, (int >> 8) & 0xff, (int & 0xff))
        case 8: // ARGB (32-bit)
            (a, r, g, b) = ((int >> 24) & 0xff, (int >> 16) & 0xff, (int >> 8) & 0xff, (int & 0xff))
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
