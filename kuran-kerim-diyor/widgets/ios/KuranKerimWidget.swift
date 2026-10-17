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
func getAppUserDefaults() -> UserDefaults {
    return UserDefaults(suiteName: "group.com.kurankerimdiyor.expowidgets") ?? UserDefaults.standard
}

func getSystemLanguage() -> String {
    let suite = getAppUserDefaults()
    let cached = suite.string(forKey: "MyData") 
        ?? UserDefaults.standard.string(forKey: "MyData") 
        ?? suite.string(forKey: "widgetdata")
    let payload = cached.flatMap { $0.data(using: .utf8) }.flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] }
    let lang = payload?["language"] as? String ?? Locale.preferredLanguages.first.map { String($0.prefix(2)) } ?? "tr"
    let supported = ["tr", "en", "de", "fr", "es", "ar"]
    return supported.contains(lang) ? lang : "tr"
}

func getTranslation(for key: String) -> String {
    let lang = getSystemLanguage()
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

struct SimpleEntry: TimelineEntry {
    let date: Date
    let text: String
    let reference: String
    let surah: Int
    let ayah: Int
    let streak: Int
    let todayCompleted: Bool
    let streakBadge: String
    let title: String
}

struct UserWidgetData {
    let streak: Int
    let todayCompleted: Bool
    let streakBadge: String
    let title: String
    let language: String
    let text: String
    let reference: String
    let surah: Int
    let ayah: Int
    let cachedDate: String
}

func loadUserData() -> UserWidgetData {
    let suite = getAppUserDefaults()
    let jsonString = suite.string(forKey: "MyData") 
        ?? UserDefaults.standard.string(forKey: "MyData") 
        ?? suite.string(forKey: "widgetdata")
        ?? UserDefaults.standard.string(forKey: "widgetdata")
    
    let defaultTitle = getTranslation(for: "title")
    let defaultLang = getSystemLanguage()
    
    guard let str = jsonString,
          let data = str.data(using: .utf8),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
        return UserWidgetData(
            streak: 0,
            todayCompleted: false,
            streakBadge: "",
            title: defaultTitle,
            language: defaultLang,
            text: "",
            reference: "",
            surah: 94,
            ayah: 5,
            cachedDate: ""
        )
    }

    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = "yyyy-MM-dd"
    let todayStr = formatter.string(from: Date())

    let rawStreak = json["streak"] as? Int ?? 0
    let lastActiveDate = json["lastActiveDate"] as? String ?? ""
    let cachedDate = json["cachedDate"] as? String ?? ""
    let text = json["text"] as? String ?? ""
    let reference = json["reference"] as? String ?? ""
    let surah = json["surahNumber"] as? Int ?? 94
    let ayah = json["startAyah"] as? Int ?? 5
    let labels = json["labels"] as? [String: Any]
    let lang = json["language"] as? String ?? defaultLang
    let title = labels?["title"] as? String ?? defaultTitle

    var activeStreak = rawStreak
    var todayDone = json["todayCompleted"] as? Bool ?? false
    var streakBadge = labels?["streakBadge"] as? String ?? ""

    // Calculate streak status: if read today or yesterday, streak is intact
    if !lastActiveDate.isEmpty {
        if lastActiveDate == todayStr {
            todayDone = true
        } else {
            todayDone = false
            let calendar = Calendar.current
            if let lastDate = formatter.date(from: lastActiveDate) {
                let lastStart = calendar.startOfDay(for: lastDate)
                let todayStart = calendar.startOfDay(for: Date())
                let diff = calendar.dateComponents([.day], from: lastStart, to: todayStart).day ?? 0
                if diff <= 1 {
                    activeStreak = rawStreak
                } else {
                    activeStreak = 0
                }
            }
        }
    }

    if streakBadge.isEmpty && activeStreak > 0 {
        streakBadge = "🔥 \(activeStreak) Gün"
    } else if activeStreak == 0 {
        streakBadge = ""
    }

    return UserWidgetData(
        streak: activeStreak,
        todayCompleted: todayDone,
        streakBadge: streakBadge,
        title: title,
        language: lang,
        text: text,
        reference: reference,
        surah: surah,
        ayah: ayah,
        cachedDate: cachedDate
    )
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        let user = loadUserData()
        return SimpleEntry(
            date: Date(),
            text: user.text.isEmpty ? "Şüphesiz her zorlukla beraber bir kolaylık vardır." : user.text,
            reference: user.reference.isEmpty ? "İnşirah 94:5" : user.reference,
            surah: user.surah,
            ayah: user.ayah,
            streak: max(user.streak, 1),
            todayCompleted: user.todayCompleted,
            streakBadge: user.streakBadge.isEmpty ? "🔥 1 Gün" : user.streakBadge,
            title: user.title
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let user = loadUserData()
        completion(SimpleEntry(
            date: Date(),
            text: user.text.isEmpty ? "Şüphesiz her zorlukla beraber bir kolaylık vardır." : user.text,
            reference: user.reference.isEmpty ? "İnşirah 94:5" : user.reference,
            surah: user.surah,
            ayah: user.ayah,
            streak: max(user.streak, 3),
            todayCompleted: user.todayCompleted,
            streakBadge: user.streakBadge.isEmpty ? "🔥 3 Gün" : user.streakBadge,
            title: user.title
        ))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let user = loadUserData()
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        let todayStr = formatter.string(from: Date())

        // 1. Önce yerel veride bugünün ayeti varsa anında göster
        if user.cachedDate == todayStr && !user.text.isEmpty {
            let nextUpdate = Calendar.current.date(byAdding: .day, value: 1, to: Calendar.current.startOfDay(for: Date()))!
            let entry = SimpleEntry(
                date: Date(),
                text: user.text,
                reference: user.reference,
                surah: user.surah,
                ayah: user.ayah,
                streak: user.streak,
                todayCompleted: user.todayCompleted,
                streakBadge: user.streakBadge,
                title: user.title
            )
            completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
            return
        }

        // 2. Yeni gün ise API'den çek ama kullanıcının serisini ASLA SIFIRLAMA
        fetchDailyVerse(language: user.language) { response in
            let entry: SimpleEntry
            if let res = response {
                entry = SimpleEntry(
                    date: Date(),
                    text: res.text,
                    reference: res.reference,
                    surah: res.surahNumber,
                    ayah: res.startAyah,
                    streak: user.streak,
                    todayCompleted: user.todayCompleted,
                    streakBadge: user.streakBadge,
                    title: user.title
                )
            } else if !user.text.isEmpty {
                entry = SimpleEntry(
                    date: Date(),
                    text: user.text,
                    reference: user.reference,
                    surah: user.surah,
                    ayah: user.ayah,
                    streak: user.streak,
                    todayCompleted: user.todayCompleted,
                    streakBadge: user.streakBadge,
                    title: user.title
                )
            } else {
                entry = SimpleEntry(
                    date: Date(),
                    text: getTranslation(for: "error"),
                    reference: "",
                    surah: 1,
                    ayah: 1,
                    streak: user.streak,
                    todayCompleted: user.todayCompleted,
                    streakBadge: user.streakBadge,
                    title: user.title
                )
            }
            
            let nextUpdate = Calendar.current.date(byAdding: .minute, value: 60, to: Date())!
            completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
        }
    }
    
    private func fetchDailyVerse(language: String, completion: @escaping (DailyVerseResponse?) -> Void) {
        let lang = language.isEmpty ? getSystemLanguage() : language
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
                completion(nil)
            }
        }.resume()
    }
}

struct KuranKerimWidgetEntryView : View {
    @Environment(\.widgetFamily) var family
    var entry: Provider.Entry

    var body: some View {
        switch family {
        case .accessoryInline:
            Text("🔥 \(entry.streak) · \(entry.reference)")
                .widgetURL(URL(string: "kuran-kerim-diyor://ayet?id=\(entry.surah):\(entry.ayah)"))
        case .accessoryCircular:
            ZStack {
                AccessoryWidgetBackground()
                VStack(spacing: 0) {
                    Image(systemName: "flame.fill")
                    Text("\(entry.streak)").font(.headline).fontWeight(.bold)
                }
            }
            .widgetURL(URL(string: "kuran-kerim-diyor://ayet?id=\(entry.surah):\(entry.ayah)"))
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(entry.reference).font(.caption).fontWeight(.bold)
                    Spacer()
                    Text("🔥 \(entry.streak)").font(.caption2).fontWeight(.bold)
                }
                Text(entry.text)
                    .font(.caption2)
                    .lineLimit(2)
            }
            .widgetURL(URL(string: "kuran-kerim-diyor://ayet?id=\(entry.surah):\(entry.ayah)"))
        case .systemMedium:
            mediumView
        default:
            smallView
        }
    }

    // Küçük Widget (SystemSmall)
    private var smallView: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(entry.title)
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(Color(hex: "B69A73"))
                    .lineLimit(1)
                Spacer()
                if !entry.streakBadge.isEmpty {
                    Text(entry.streakBadge)
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(Color(hex: "9E7D47"))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color(hex: "B69A73").opacity(0.18))
                        .clipShape(Capsule())
                }
            }

            Spacer()

            Text("“\(entry.text)”")
                .font(.system(size: 13, weight: .medium, design: .serif))
                .italic()
                .lineLimit(4)
                .minimumScaleFactor(0.8)
                .foregroundColor(.primary)

            Spacer()

            HStack {
                Text(entry.reference)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(Color(hex: "B69A73"))
                Spacer()
                if entry.todayCompleted {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 11))
                        .foregroundColor(Color(hex: "2E7D32"))
                }
            }
        }
        .padding(14)
        .widgetURL(URL(string: "kuran-kerim-diyor://ayet?id=\(entry.surah):\(entry.ayah)"))
    }

    // Orta Boy Widget (SystemMedium)
    private var mediumView: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(entry.title)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(Color(hex: "9E7D47"))
                    .lineLimit(1)
                Spacer()
                if !entry.streakBadge.isEmpty {
                    Text(entry.streakBadge)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(Color(hex: "9E7D47"))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color(hex: "B69A73").opacity(0.18))
                        .clipShape(Capsule())
                }
            }
            Text("“\(entry.text)”")
                .font(.system(size: 16, weight: .medium, design: .serif))
                .lineLimit(4)
                .minimumScaleFactor(0.85)
                .foregroundColor(.primary)

            Spacer()

            HStack {
                Text(entry.reference)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(Color(hex: "B69A73"))
                    .lineLimit(1)
                Spacer()
                Image(systemName: entry.todayCompleted ? "checkmark.circle.fill" : "arrow.up.forward")
                    .foregroundColor(Color(hex: "9E7D47"))
            }
        }
        .padding(14)
        .widgetURL(URL(string: "kuran-kerim-diyor://ayet?id=\(entry.surah):\(entry.ayah)"))
    }
}

struct KuranKerimWidget: Widget {
    let kind: String = "KuranKerimWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            KuranKerimWidgetEntryView(entry: entry)
                .compatibleWidgetBackground()
        }
        .configurationDisplayName(verseWidgetName(getSystemLanguage()))
        .description(verseWidgetDescription(getSystemLanguage()))
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryInline, .accessoryCircular, .accessoryRectangular])
    }
}

func verseWidgetName(_ lang: String) -> String {
    switch lang {
    case "en": return "Verse of the Day"
    case "de": return "Vers des Tages"
    case "fr": return "Verset du jour"
    case "es": return "Versículo del día"
    case "ar": return "آية اليوم"
    default: return "Günün Ayeti"
    }
}

func verseWidgetDescription(_ lang: String) -> String {
    switch lang {
    case "en": return "Today's verse and your reading streak."
    case "de": return "Der Vers des Tages und deine Leseserie."
    case "fr": return "Le verset du jour et votre série de lecture."
    case "es": return "El versículo del día y tu racha de lectura."
    case "ar": return "آية اليوم وسلسلة قراءتك."
    default: return "Günün ayeti ve okuma seriniz."
    }
}

extension View {
    @ViewBuilder
    func compatibleWidgetBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            self.containerBackground(.background, for: .widget)
        } else {
            self.background(Color(hex: "F7F3EA"))
        }
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
