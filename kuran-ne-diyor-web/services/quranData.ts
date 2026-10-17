import quranDataJson from "@/data/quran.json";
import type { AppLanguage, Ayah, Surah, SurahSummary } from "@/types/quran";

const TURKISH_NAMES = [
  "Fatiha", "Bakara", "Âl-i İmrân", "Nisâ", "Mâide", "En'âm", "A'râf", "Enfâl", "Tevbe", "Yûnus",
  "Hûd", "Yûsuf", "Ra'd", "İbrâhîm", "Hicr", "Nahl", "İsrâ", "Kehf", "Meryem", "Tâhâ",
  "Enbiyâ", "Hac", "Mü'minûn", "Nûr", "Furkân", "Şuarâ", "Neml", "Kasas", "Ankebût", "Rûm",
  "Lokmân", "Secde", "Ahzâb", "Sebe'", "Fâtır", "Yâsîn", "Sâffât", "Sâd", "Zümer", "Mü'min (Gāfir)",
  "Fussilet", "Şûrâ", "Zuhruf", "Duhân", "Câsiye", "Ahkâf", "Muhammed", "Fetih", "Hucurât", "Kâf",
  "Zâriyât", "Tûr", "Necm", "Kamer", "Rahmân", "Vâkıa", "Hadîd", "Mücâdele", "Haşr", "Mümtehine",
  "Saf", "Cuma", "Münâfikûn", "Tegābün", "Talâk", "Tahrîm", "Mülk", "Kalem", "Hâkka", "Meâric",
  "Nûh", "Cin", "Müzzemmil", "Müddessir", "Kıyâmet", "İnsân", "Mürselât", "Nebe'", "Nâziât", "Abese",
  "Tekvîr", "İnfitâr", "Mutaffifîn", "İnşikâk", "Bürûc", "Târık", "A'lâ", "Gâşiye", "Fecr", "Beled",
  "Şems", "Leyl", "Duhâ", "İnşirâh", "Tîn", "Alak", "Kadr", "Beyyine", "Zilzâl", "Âdiyât",
  "Kâria", "Tekâsür", "Asr", "Hümeze", "Fîl", "Kureyş", "Mâûn", "Kevser", "Kâfirûn", "Nasr",
  "Tebbet", "İhlâs", "Felak", "Nâs"
];

const LATIN_NAMES = [
  "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa'", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus",
  "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra'", "Al-Kahf", "Maryam", "Ta-Ha",
  "Al-Anbiya'", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara'", "An-Naml", "Al-Qasas", "Al-'Ankabut", "Ar-Rum",
  "Luqman", "As-Sajdah", "Al-Ahzab", "Saba'", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir",
  "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
  "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah",
  "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij",
  "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba'", "An-Nazi'at", "'Abasa",
  "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad",
  "Ash-Shams", "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat",
  "Al-Qari'ah", "At-Takathur", "Al-'Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kauthar", "Al-Kafirun", "An-Nasr",
  "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

export const quranData = (quranDataJson as Surah[]).map((surah) => {
  const trName = TURKISH_NAMES[surah.number - 1];
  const latinName = LATIN_NAMES[surah.number - 1];
  return {
    ...surah,
    name: {
      ar: surah.name.ar,
      tr: trName || surah.name.tr,
      en: latinName || surah.name.en,
      de: latinName || surah.name.en,
      fr: latinName || surah.name.en,
      es: latinName || surah.name.en,
    },
  };
});

export const getAllSurahs = (): SurahSummary[] =>
  quranData.map((surah) => ({
    number: surah.number,
    name: surah.name,
    englishNameTranslation: surah.englishNameTranslation,
    revelationType: surah.revelationType,
    ayahsCount: surah.ayahs.length,
  }));

export const getSurah = (surahNumber: number): Surah | undefined =>
  quranData.find((surah) => surah.number === surahNumber);

export const getAyah = (surahNumber: number, ayahNumber: number): Ayah | undefined =>
  getSurah(surahNumber)?.ayahs.find((ayah) => ayah.number === ayahNumber);

const charMap: Record<string, string> = {
  ş: "s",
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
};

export const foldSearchText = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/[âàáäã]/g, 'a')
    .replace(/[îìíï]/g, 'i')
    .replace(/[ûùúü]/g, 'u')
    .replace(/[ôòóöõ]/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ı/g, 'i')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/['`’‘\-]/g, '');
};

export const tokenizeWords = (str: string): Set<string> => {
  const folded = foldSearchText(str);
  const words = folded.split(/[^a-z0-9]+/i).filter((w) => w.length > 0);
  return new Set(words);
};

const SURAH_ALIASES: Record<string, number> = {};

const addAlias = (names: string[], surahNo: number) => {
  for (const n of names) {
    const key = foldSearchText(n).replace(/\s+/g, '');
    SURAH_ALIASES[key] = surahNo;
  }
};

addAlias(['fatiha', 'el-fatiha'], 1);
addAlias(['bakara', 'bekara', 'el-bakara'], 2);
addAlias(['ali imran', 'al-i imran', 'âl-i imrân', 'imran'], 3);
addAlias(['nisa', 'nissa', 'en-nisa'], 4);
addAlias(['maide', 'el-maide'], 5);
addAlias(['enam', 'el-enam'], 6);
addAlias(['araf', 'el-araf'], 7);
addAlias(['enfal', 'el-enfal'], 8);
addAlias(['tevbe', 'tövbe', 'et-tevbe', 'berae'], 9);
addAlias(['yunus'], 10);
addAlias(['hud'], 11);
addAlias(['yusuf'], 12);
addAlias(['rad', 'er-rad'], 13);
addAlias(['ibrahim'], 14);
addAlias(['hicr', 'el-hicr'], 15);
addAlias(['nahl', 'en-nahl'], 16);
addAlias(['isra', 'israa', 'el-isra', 'beni israil'], 17);
addAlias(['kehf', 'el-kehf'], 18);
addAlias(['meryem'], 19);
addAlias(['taha'], 20);
addAlias(['enbiya', 'el-enbiya'], 21);
addAlias(['hac', 'hacc', 'el-hac'], 22);
addAlias(['muminun', 'müminun', 'el-müminun'], 23);
addAlias(['nur', 'en-nur'], 24);
addAlias(['furkan', 'el-furkan'], 25);
addAlias(['suara', 'şuara', 'es-suara'], 26);
addAlias(['neml', 'en-neml'], 27);
addAlias(['kasas', 'el-kasas'], 28);
addAlias(['ankebut', 'el-ankebut'], 29);
addAlias(['rum', 'er-rum'], 30);
addAlias(['lokman', 'luqman'], 31);
addAlias(['secde', 'es-secde'], 32);
addAlias(['ahzab', 'el-ahzab'], 33);
addAlias(['sebe', 'saba'], 34);
addAlias(['fatir', 'el-fatir'], 35);
addAlias(['yasin'], 36);
addAlias(['saffat', 'es-saffat'], 37);
addAlias(['sad'], 38);
addAlias(['zumer', 'zümer', 'ez-zumer'], 39);
addAlias(['mumin', 'mümin', 'gafir', 'ghafir'], 40);
addAlias(['fussilet'], 41);
addAlias(['sura', 'şura', 'es-sura'], 42);
addAlias(['zuhruf', 'ez-zuhruf'], 43);
addAlias(['duhan', 'ed-duhan'], 44);
addAlias(['casiye', 'el-casiye'], 45);
addAlias(['ahkaf', 'el-ahkaf'], 46);
addAlias(['muhammed'], 47);
addAlias(['fetih', 'el-fetih'], 48);
addAlias(['hucurat', 'el-hucurat'], 49);
addAlias(['kaf', 'qaf'], 50);
addAlias(['zariyat', 'ez-zariyat'], 51);
addAlias(['tur', 'et-tur'], 52);
addAlias(['necm', 'en-necm'], 53);
addAlias(['kamer', 'el-kamer'], 54);
addAlias(['rahman', 'er-rahman'], 55);
addAlias(['vakia', 'el-vakia'], 56);
addAlias(['hadid', 'el-hadid'], 57);
addAlias(['mucadele', 'mücadele'], 58);
addAlias(['hasr', 'haşr', 'el-hasr'], 59);
addAlias(['mumtehine', 'mümtehine'], 60);
addAlias(['saf', 'es-saf'], 61);
addAlias(['cuma', 'el-cuma'], 62);
addAlias(['munafikun', 'münafikun'], 63);
addAlias(['tegabun', 'et-tegabun'], 64);
addAlias(['talak', 'et-talak'], 65);
addAlias(['tahrim', 'et-tahrim'], 66);
addAlias(['mulk', 'mülk', 'el-mulk', 'tebareke'], 67);
addAlias(['kalem', 'el-kalem'], 68);
addAlias(['hakka', 'el-hakka'], 69);
addAlias(['mearic', 'el-mearic'], 70);
addAlias(['nuh'], 71);
addAlias(['cin', 'el-cin'], 72);
addAlias(['muzzemmil', 'müzzemmil'], 73);
addAlias(['muddessir', 'müddessir'], 74);
addAlias(['kiyamet', 'kıyamet', 'el-kiyamet'], 75);
addAlias(['insan', 'el-insan', 'dehr'], 76);
addAlias(['murselat', 'mürselat'], 77);
addAlias(['nebe', 'en-nebe', 'amme'], 78);
addAlias(['naziat', 'en-naziat'], 79);
addAlias(['abese'], 80);
addAlias(['tekvir', 'et-tekvir'], 81);
addAlias(['infitar', 'el-infitar'], 82);
addAlias(['mutaffifin'], 83);
addAlias(['insikak', 'inşikak'], 84);
addAlias(['buruc', 'büruc', 'el-buruc'], 85);
addAlias(['tarik', 'tarık', 'et-tarik'], 86);
addAlias(['ala', 'el-ala'], 87);
addAlias(['gasiye', 'gaşiye', 'el-gasiye'], 88);
addAlias(['fecr', 'el-fecr'], 89);
addAlias(['beled'], 90);
addAlias(['sems', 'şems', 'es-sems'], 91);
addAlias(['leyl', 'el-leyl'], 92);
addAlias(['duha', 'ed-duha'], 93);
addAlias(['insirah', 'inşirah', 'serh', 'şerh'], 94);
addAlias(['tin', 'et-tin'], 95);
addAlias(['alak', 'el-alak'], 96);
addAlias(['kadir', 'el-kadir', 'kadr'], 97);
addAlias(['beyyine', 'el-beyyine'], 98);
addAlias(['zilzal', 'zelzele', 'ez-zilzal'], 99);
addAlias(['adiyat', 'el-adiyat'], 100);
addAlias(['karia', 'el-karia'], 101);
addAlias(['tekasur', 'tekasür'], 102);
addAlias(['asr', 'el-asr'], 103);
addAlias(['humeze', 'hümeze', 'el-humeze'], 104);
addAlias(['fil', 'el-fil'], 105);
addAlias(['kureys', 'kureyş', 'el-kureys'], 106);
addAlias(['maun', 'el-maun'], 107);
addAlias(['kevser', 'el-kevser'], 108);
addAlias(['kafirun', 'el-kafirun'], 109);
addAlias(['nasr', 'en-nasr'], 110);
addAlias(['tebbet', 'mesed', 'leheb'], 111);
addAlias(['ihlas', 'el-ihlas'], 112);
addAlias(['felak', 'el-felak'], 113);
addAlias(['nas', 'en-nas'], 114);

for (const surah of quranData) {
  const names = [surah.name.tr, surah.name.en, surah.name.de, surah.name.fr, surah.name.es];
  for (const n of names) {
    if (n) {
      const key = foldSearchText(n).replace(/\s+/g, '');
      if (SURAH_ALIASES[key] === undefined) {
        SURAH_ALIASES[key] = surah.number;
      }
      const withoutAl = key.replace(/^(al|el|an|ar|ad|at|az|as|ash|adh)/, '');
      if (withoutAl.length >= 3 && SURAH_ALIASES[withoutAl] === undefined) {
        SURAH_ALIASES[withoutAl] = surah.number;
      }
    }
  }
}

export const findSurahByNameOrAlias = (name: string): number | null => {
  const key = foldSearchText(name).replace(/\s+/g, '');
  if (SURAH_ALIASES[key] !== undefined) return SURAH_ALIASES[key];
  const keyWithoutSuffix = key.replace(/suresi$/, '').replace(/sure$/, '');
  if (SURAH_ALIASES[keyWithoutSuffix] !== undefined) return SURAH_ALIASES[keyWithoutSuffix];
  return null;
};

const getLocalizedSurahName = (surah: Surah, language: AppLanguage) => {
  const nameObj = surah.name as Record<string, string>;
  return nameObj[language] || nameObj.tr;
};

interface SearchIndexEntry {
  surahNumber: number;
  surahName: string;
  ayah: Ayah;
  foldedText: string;
  wordSet: Set<string>;
  arabicClean: string;
}

const SEARCH_INDEX_CACHE: Partial<Record<AppLanguage, SearchIndexEntry[]>> = {};

const getSearchIndex = (language: AppLanguage): SearchIndexEntry[] => {
  if (!SEARCH_INDEX_CACHE[language]) {
    const list: SearchIndexEntry[] = [];
    for (let sIdx = 0; sIdx < quranData.length; sIdx++) {
      const surah = quranData[sIdx];
      const surahName = getLocalizedSurahName(surah, language);
      for (let aIdx = 0; aIdx < surah.ayahs.length; aIdx++) {
        const ayah = surah.ayahs[aIdx];
        const trans = ayah.translations[language] || ayah.translations.tr || '';
        list.push({
          surahNumber: surah.number,
          surahName,
          ayah,
          foldedText: foldSearchText(trans),
          wordSet: tokenizeWords(trans),
          arabicClean: ayah.arabic.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, ''),
        });
      }
    }
    SEARCH_INDEX_CACHE[language] = list;
  }
  return SEARCH_INDEX_CACHE[language]!;
};

export interface SearchResultItemData {
  surahName: string;
  surahNumber: number;
  ayah: Ayah;
  matchType?: 'ref' | 'surah' | 'text';
}

export const searchAyahs = (query: string, language: AppLanguage = "tr", limit: number = 50): SearchResultItemData[] => {
  const cleaned = query.trim();
  if (cleaned.length < 2 && !/^\d+$/.test(cleaned)) return [];

  const constructItem = (
    surahNumber: number,
    surahName: string,
    ayah: Ayah,
    matchType: 'ref' | 'surah' | 'text' = 'text'
  ): SearchResultItemData => ({
    surahName,
    surahNumber,
    ayah,
    matchType,
  });

  // 1. Ayah reference search (ends with number, e.g. "nisa 26", "2:255", "36:1", "bakara 255")
  const tailDigits = cleaned.match(/(\d{1,3})$/);
  if (tailDigits) {
    const ayahNumber = parseInt(tailDigits[1], 10);
    let surahPart = cleaned.substring(0, tailDigits.index).trim();
    surahPart = surahPart.replace(/[:.\-\s]+$/, '').trim();

    if (surahPart) {
      let surahNumber: number | null = null;
      if (/^\d{1,3}$/.test(surahPart)) {
        surahNumber = parseInt(surahPart, 10);
      } else {
        surahNumber = findSurahByNameOrAlias(surahPart);
      }

      if (surahNumber && surahNumber >= 1 && surahNumber <= 114) {
        const surah = getSurah(surahNumber);
        if (surah) {
          const ayah = surah.ayahs.find((a) => a.number === ayahNumber);
          if (ayah) {
            return [constructItem(surahNumber, getLocalizedSurahName(surah, language), ayah, 'ref')];
          }
        }
      }
    }
  }

  // 2. Direct Surah number search (e.g. "36", "112", "1")
  if (/^\d{1,3}$/.test(cleaned)) {
    const surahNumber = parseInt(cleaned, 10);
    if (surahNumber >= 1 && surahNumber <= 114) {
      const surah = getSurah(surahNumber);
      if (surah) {
        const surahName = getLocalizedSurahName(surah, language);
        const count = Math.min(surah.ayahs.length, limit);
        const results: SearchResultItemData[] = [];
        for (let i = 0; i < count; i++) {
          results.push(constructItem(surahNumber, surahName, surah.ayahs[i], 'surah'));
        }
        return results;
      }
    }
  }

  // 3. Exact Surah name search (e.g. "bakara", "bakara suresi", "yasin", "fatiha", "ihlas suresi")
  const isExplicitSurah = /suresi$/i.test(cleaned) || /sure$/i.test(cleaned);
  const surahNo = findSurahByNameOrAlias(cleaned);
  if (surahNo) {
    const rawKey = foldSearchText(cleaned).replace(/\s+/g, '');
    if (SURAH_ALIASES[rawKey] !== undefined || isExplicitSurah) {
      const surah = getSurah(surahNo);
      if (surah) {
        const surahName = getLocalizedSurahName(surah, language);
        const count = Math.min(surah.ayahs.length, limit);
        const results: SearchResultItemData[] = [];
        for (let i = 0; i < count; i++) {
          results.push(constructItem(surahNo, surahName, surah.ayahs[i], 'surah'));
        }
        return results;
      }
    }
  }

  // 4. Full-text search with relevance ranking across all verses
  const index = getSearchIndex(language);
  const foldedQuery = foldSearchText(cleaned);
  if (foldedQuery.length < 2) return [];

  const queryWords = foldedQuery.split(/\s+/).filter((w) => w.length > 0);
  const cleanArabicQuery = cleaned.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').trim();
  const scoredResults: { item: SearchResultItemData; score: number }[] = [];

  for (let i = 0; i < index.length; i++) {
    const entry = index[i];
    let score = 0;

    // Arabic search
    if (cleanArabicQuery && cleanArabicQuery.length >= 2 && entry.arabicClean.includes(cleanArabicQuery)) {
      score += 200;
    }

    // Translation search
    if (entry.foldedText.includes(foldedQuery)) {
      if (entry.wordSet.has(foldedQuery)) {
        score += 100;
      } else {
        let startsCount = 0;
        for (const w of entry.wordSet) {
          if (w.startsWith(foldedQuery)) startsCount++;
        }
        if (startsCount > 0) {
          score += 50 + startsCount * 5;
        } else {
          score += 25;
        }
      }

      const matchCount = entry.foldedText.split(foldedQuery).length - 1;
      score += (matchCount - 1) * 10;

      if (entry.foldedText.length < 150) {
        score += Math.max(0, 10 - Math.floor(entry.foldedText.length / 20));
      }
    } else if (queryWords.length > 1) {
      const allPresent = queryWords.every((qw) => entry.foldedText.includes(qw));
      if (allPresent) {
        score += 45;
        for (const qw of queryWords) {
          if (entry.wordSet.has(qw)) score += 20;
        }
      }
    }

    if (score > 0) {
      scoredResults.push({
        item: constructItem(entry.surahNumber, entry.surahName, entry.ayah, 'text'),
        score,
      });
    }
  }

  scoredResults.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.item.surahNumber !== b.item.surahNumber) return a.item.surahNumber - b.item.surahNumber;
    return a.item.ayah.number - b.item.ayah.number;
  });

  return scoredResults.slice(0, limit).map((r) => r.item);
};
