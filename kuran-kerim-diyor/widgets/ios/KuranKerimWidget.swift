import WidgetKit
import SwiftUI

// API Response Struct
struct DailyVerseResponse: Codable {
    let text: String
    let reference: String
    let surahNumber: Int
    let startAyah: Int
}

// Helper translation functions
func getSystemLanguage() -> String {
    let lang = Locale.preferredLanguages.first?.prefix(2).map(String.init) ?? "tr"
    let supported = ["tr", "en", "de", "fr", "es", "ar"]
    return supported.contains(lang) ? lang : "tr"
}

func getTranslation(for key: String) -> String {
    let lang = Locale.preferredLanguages.first?.prefix(2).map(String.init) ?? "tr"
    switch key {
    case "title":
        switch lang {
        case "tr": return "GÜNÜN AYETİ"
        case "de": return "VERS DES TAGES"
        case "fr": return "VERSET DU JOUR"
        case "es": return "VERSÍCULO DEL DÍA"
        case "ar": return "آية اليوم"
        default: return "VERSE OF THE DAY"
        }
    case "loading":
        switch lang {
        case "tr": return "Günün Ayeti yükleniyor..."
        case "de": return "Vers des Tages wird geladen..."
        case "fr": return "Chargement du verset du jour..."
        case "es": return "Cargando el versículo del día..."
        case "ar": return "جاري تحميل آية اليوم..."
        default: return "Loading daily verse..."
        }
    case "error":
        switch lang {
        case "tr": return "Günün Ayeti yüklenemedi. Lütfen internet bağlantınızı kontrol edin."
        case "de": return "Vers des Tages konnte nicht geladen werden. Bitte überprüfen Sie Ihre Internetverbindung."
        case "fr": return "Impossible de charger le verset du jour. Veuillez vérifier votre connexion Internet."
        case "es": return "No se pudo cargar el versículo del día. Por favor, verifique su conexión a Internet."
        case "ar": return "تعذر تحميل آية اليوم. يرجى التحقق من الاتصال بالإنترنت."
        default: return "Could not load daily verse. Please check your internet connection."
        }
    default:
        return ""
    }
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), text: getTranslation(for: "loading"), reference: "", surah: 1, ayah: 1)
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
                entry = SimpleEntry(date: Date(), text: getTranslation(for: "error"), reference: "", surah: 1, ayah: 1)
            }
            
            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 12, to: Date())!
            let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
            completion(timeline)
        }
    }
    
    private func fetchDailyVerse(completion: @escaping (DailyVerseResponse?) -> Void) {
        let lang = getSystemLanguage()
        guard let url = URL(string: "https://api.kurannediyor.com.tr/api/daily-context?lang=\(lang)") else {
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
            Text(getTranslation(for: "title"))
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
        .widgetURL(URL(string: "kuran-kerim-diyor://ayet?id=\(entry.surah):\(entry.ayah)"))
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
