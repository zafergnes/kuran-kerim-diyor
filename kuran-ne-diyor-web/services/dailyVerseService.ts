import { getSurah, getAyah } from "@/services/quranData";

export interface DailyVerse {
  text: string;
  reference: string;
  arabic?: string;
  surahNumber?: number;
  startAyah?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Çevrimdışı veya API gecikmesinde gösterilecek ilham verici tefekkür ayetleri havuzu
const CURATED_VERSES: Array<{ surah: number; ayah: number }> = [
  { surah: 2, ayah: 152 },  // Bakara 152: Beni anın ki ben de sizi anayım
  { surah: 2, ayah: 255 },  // Âyetel Kürsî
  { surah: 2, ayah: 286 },  // Bakara 286: Allah hiç kimseye gücünün yettiğinden fazlasını yüklemez
  { surah: 3, ayah: 139 },  // Âl-i İmrân 139: Gevşemeyin, üzülmeyin; inanıyorsanız üstünsünüz
  { surah: 13, ayah: 28 },  // Ra'd 28: Kalpler ancak Allah'ı anmakla huzur bulur
  { surah: 14, ayah: 7 },   // İbrâhîm 7: Şükrederseniz elbette artırırım
  { surah: 21, ayah: 87 },  // Enbiyâ 87: Lâ ilâhe illâ ente sübhâneke innî küntü mine'z-zâlimîn
  { surah: 25, ayah: 74 },  // Furkân 74: Rabbimiz! Bize göz aydınlığı eşler ve nesiller bağışla
  { surah: 39, ayah: 53 },  // Zümer 53: Allah'ın rahmetinden ümidinizi kesmeyin
  { surah: 55, ayah: 60 },  // Rahmân 60: İyiliğin karşılığı ancak iyilik değil midir?
  { surah: 65, ayah: 3 },   // Talâk 3: Kim Allah'a tevekkül ederse O kendisine yeter
  { surah: 93, ayah: 3 },   // Duhâ 3: Rabbin seni terk etmedi ve sana darılmadı
  { surah: 94, ayah: 5 },   // İnşirâh 5: Şüphesiz güçlükle beraber bir kolaylık vardır
  { surah: 2, ayah: 186 },  // Bakara 186: Ben onlara çok yakınım
  { surah: 49, ayah: 10 },  // Hucurât 10: Müminler ancak kardeştirler
];

function getFallbackVerse(lang: string = 'tr'): DailyVerse {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const picked = CURATED_VERSES[Math.abs(dayOfYear) % CURATED_VERSES.length];
  const surah = getSurah(picked.surah);
  const ayah = getAyah(picked.surah, picked.ayah);

  if (surah && ayah) {
    const validLang = (lang as 'tr' | 'en' | 'ar' | 'de' | 'fr' | 'es');
    const text = ayah.translations[validLang] || ayah.translations.tr || ayah.arabic;
    const surahName = surah.name[validLang] || surah.name.tr;
    return {
      text,
      reference: `${surahName} ${picked.surah}:${picked.ayah}`,
      arabic: ayah.arabic,
      surahNumber: picked.surah,
      startAyah: picked.ayah,
    };
  }

  return {
    text: "Şüphesiz güçlükle beraber bir kolaylık vardır.",
    reference: "İnşirâh 94:5",
    arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
    surahNumber: 94,
    startAyah: 5,
  };
}

export const DailyVerseService = {
  getDailyVerse: async (lang: string = 'tr'): Promise<DailyVerse> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(`${API_BASE_URL}/daily-context?lang=${lang}`, {
        next: { revalidate: 3600 },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to fetch daily verse');

      const data = await response.json();
      
      // Gelen veride surah/ayah numarasi varsa Arapcasini zenginlestir
      if (data.surahNumber && data.startAyah) {
        const ayahObj = getAyah(Number(data.surahNumber), Number(data.startAyah));
        if (ayahObj && !data.arabic) {
          data.arabic = ayahObj.arabic;
        }
      }

      return data;
    } catch (error) {
      // API erisilemezse kesintisiz kullanici deneyimi icin kaliteli fallback dondur
      return getFallbackVerse(lang);
    }
  },

  getVerseByRef: async (surah: string | number, ayah: string | number, lang: string = 'tr'): Promise<DailyVerse & { arabic?: string }> => {
    const sNum = Number(surah);
    const aNum = Number(ayah);
    const ayahObj = getAyah(sNum, aNum);
    const surahObj = getSurah(sNum);
    const validLang = (lang as 'tr' | 'en' | 'ar' | 'de' | 'fr' | 'es');

    try {
      const response = await fetch(`${API_BASE_URL}/daily-context/verse/${surah}/${ayah}?lang=${lang}`);
      if (response.ok) {
        const data = await response.json();
        if (ayahObj && !data.arabic) data.arabic = ayahObj.arabic;
        return data;
      }
    } catch (error) {
      // Fallback to local
    }

    if (surahObj && ayahObj) {
      const text = ayahObj.translations[validLang] || ayahObj.translations.tr;
      const surahName = surahObj.name[validLang] || surahObj.name.tr;
      return {
        text,
        reference: `${surahName} ${sNum}:${aNum}`,
        arabic: ayahObj.arabic,
        surahNumber: sNum,
        startAyah: aNum,
      };
    }

    return {
      text: "",
      reference: `${surah}:${ayah}`,
    };
  }
};

