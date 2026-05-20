import fs from 'fs';
import path from 'path';
import { prisma } from '../utils/prisma';

const CATEGORY_MAP: Record<number, string> = {
  1: "MOTIVATION", // Pazartesi
  2: "WISDOM",     // Salı
  3: "PATIENCE",   // Çarşamba
  4: "MORALITY",   // Perşembe
  5: "PRAYER",     // Cuma
  6: "PEACE",      // Cumartesi
  0: "GRATITUDE"   // Pazar
};

export class DailyService {
  private static quranData: any = null;

  private static loadQuranData() {
    if (!this.quranData) {
      let currentDir = __dirname;
      let quranPath = "";

      // En fazla 5 seviye yukarı çıkarak dosyayı ara
      for (let i = 0; i < 5; i++) {
        const potentialPath = path.join(currentDir, "kuran-ne-diyor-web/data/quran.json");
        const siblingPath = path.join(path.dirname(currentDir), "kuran-ne-diyor-web/data/quran.json");
        
        if (fs.existsSync(potentialPath)) {
          quranPath = potentialPath;
          break;
        }
        if (fs.existsSync(siblingPath)) {
          quranPath = siblingPath;
          break;
        }
        currentDir = path.dirname(currentDir);
      }

      if (!quranPath) {
        // Son çare process.cwd() ve çevresi
        const fallbackPaths = [
          path.join(process.cwd(), "kuran-ne-diyor-web/data/quran.json"),
          path.join(process.cwd(), "../kuran-ne-diyor-web/data/quran.json")
        ];
        quranPath = fallbackPaths.find(p => fs.existsSync(p)) || "";
      }

      if (!quranPath) {
        throw new Error(`quran.json bulunamadı. Lütfen dosyanın yerini kontrol edin.`);
      }

      this.quranData = JSON.parse(fs.readFileSync(quranPath, 'utf-8'));
    }
    return this.quranData;
  }

  static async getDailyContext(lang: string) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const categoryKey = CATEGORY_MAP[dayOfWeek];

    // Günlük seed (YYYYMMDD)
    const seed = parseInt(today.toISOString().split('T')[0].replace(/-/g, ''));

    // Bu kategoriye ait tüm ayet gruplarını çek
    const themes = await prisma.verseTheme.findMany({
      where: { categoryKey },
      orderBy: [
        { surahNumber: 'asc' },
        { startAyah: 'asc' }
      ]
    });

    if (themes.length === 0) {
      throw new Error(`No verses found for category: ${categoryKey}`);
    }

    // Deterministik seçim
    const selectedTheme = themes[seed % themes.length];
    
    return this.formatThemeResponse(selectedTheme, lang);
  }

  static async getRandomContext(categoryKey: string, lang: string) {
    const themes = await prisma.verseTheme.findMany({
      where: { categoryKey }
    });

    if (themes.length === 0) {
      throw new Error(`No verses found for category: ${categoryKey}`);
    }

    const selectedTheme = themes[Math.floor(Math.random() * themes.length)];
    return this.formatThemeResponse(selectedTheme, lang);
  }

  private static formatThemeResponse(theme: any, lang: string) {
    const quran = this.loadQuranData();
    const surah = quran.find((s: any) => s.number === theme.surahNumber);
    
    if (!surah) throw new Error("Surah not found");

    const ayahs = surah.ayahs.filter(
      (a: any) => a.number >= theme.startAyah && a.number <= theme.endAyah
    );

    const combinedText = ayahs.map((a: any) => a.translations[lang] || a.translations['tr']).join(' ');
    
    // Referans formatı: "Bakara 155-157" veya "Al-Baqara 155"
    const surahName = surah.name[lang] || surah.name['tr'];
    const ayahRange = theme.startAyah === theme.endAyah 
      ? `${theme.startAyah}` 
      : `${theme.startAyah}-${theme.endAyah}`;

    return {
      text: combinedText,
      reference: `${surahName} ${ayahRange}`,
      // category: theme.categoryKey // Kullanıcıya göstermiyoruz
    };
  }

  static async getVerseByRef(surahNum: number, ayahNum: number, lang: string) {
    const quran = this.loadQuranData();
    const surah = quran.find((s: any) => s.number === surahNum);
    if (!surah) throw new Error("Surah not found");

    const ayah = surah.ayahs.find((a: any) => a.number === ayahNum);
    if (!ayah) throw new Error("Ayah not found");

    const text = ayah.translations[lang] || ayah.translations['tr'];
    const surahName = surah.name[lang] || surah.name['tr'];

    return {
      text,
      reference: `${surahName} ${ayahNum}`,
      arabic: ayah.arabic
    };
  }
}
