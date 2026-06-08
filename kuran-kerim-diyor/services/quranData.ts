/**
 * Quran Data Service
 * Reads and formats surahs and ayahs from the local JSON data.
 */

import quranDataJson from '../assets/quran/data.json';
import { AppLanguage } from '../constants/languages';

export interface Ayah {
    number: number;
    globalNumber: number;
    arabic: string;
    arabicDiyanet?: string;
    translations: Record<AppLanguage, string>;
}

export interface Surah {
    number: number;
    name: {
        ar: string;
        tr: string;
        en: string;
        de: string;
        fr: string;
        es: string;
    };
    englishNameTranslation: string;
    revelationType: string;
    ayahs: Ayah[];
}

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
}) as Surah[];

export const getAllSurahs = () => {
    return quranData.map(surah => ({
        number: surah.number,
        name: surah.name,
        englishNameTranslation: surah.englishNameTranslation,
        revelationType: surah.revelationType,
        ayahsCount: surah.ayahs.length,
    }));
};

export const getSurah = (surahNumber: number): Surah | undefined => {
    return quranData.find(s => s.number === surahNumber);
};

export const getAyah = (surahNumber: number, ayahNumber: number): Ayah | undefined => {
    const surah = getSurah(surahNumber);
    if (!surah) return undefined;
    return surah.ayahs.find(a => a.number === ayahNumber);
};

const CHAR_MAP: Record<string, string> = {
    'ş': 's', 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ü': 'u',
    'â': 'a', 'î': 'i', 'û': 'u', 'é': 'e', 'è': 'e', 'ê': 'e',
    'à': 'a', 'ñ': 'n', 'ä': 'a',
};

const normalize = (s: string): string => {
    let o = s.toLowerCase();
    o = o.replace(/[^\x00-\x7F]/g, ch => CHAR_MAP[ch] || ch);
    o = o.replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
    o = o.replace(/^(adh|ash|al|an|ar|ad|at|az|aal)(?=[-'\s]|$)/i, '');
    o = o.replace(/[-'\s]/g, '');
    o = o.replace(/sh/g, 's');
    o = o.replace(/kh/g, 'h');
    o = o.replace(/gh/g, 'g');
    o = o.replace(/th/g, 't');
    o = o.replace(/dh/g, 'd');
    o = o.replace(/(.)\1+/g, '$1');
    return o;
};

const SURAH_ALIASES: Record<string, number> = {};

const addAlias = (names: string[], surahNo: number) => {
    for (const n of names) {
        SURAH_ALIASES[normalize(n)] = surahNo;
    }
};

addAlias(['fatiha', 'el-fatiha'], 1);
addAlias(['bakara', 'bekara'], 2);
addAlias(['ali imran', 'al-i imran', 'imran'], 3);
addAlias(['nisa', 'nissa'], 4);
addAlias(['maide', 'ma\'ide'], 5);
addAlias(['enam', 'en\'am'], 6);
addAlias(['araf', 'a\'raf'], 7);
addAlias(['enfal'], 8);
addAlias(['tevbe', 'tövbe'], 9);
addAlias(['yunus'], 10);
addAlias(['hud', 'hûd'], 11);
addAlias(['yusuf'], 12);
addAlias(['rad', 'ra\'d'], 13);
addAlias(['ibrahim'], 14);
addAlias(['hicr'], 15);
addAlias(['nahl'], 16);
addAlias(['isra', 'israa'], 17);
addAlias(['kehf'], 18);
addAlias(['meryem'], 19);
addAlias(['taha', 'tâhâ'], 20);
addAlias(['enbiya', 'enbiyâ'], 21);
addAlias(['hac', 'hacc'], 22);
addAlias(['muminun', 'müminun', 'mu\'minun'], 23);
addAlias(['nur', 'nûr'], 24);
addAlias(['furkan', 'furkân'], 25);
addAlias(['şuara', 'suara', 'şu\'ara'], 26);
addAlias(['neml'], 27);
addAlias(['kasas'], 28);
addAlias(['ankebut', 'ankebût'], 29);
addAlias(['rum', 'rûm'], 30);
addAlias(['lokman', 'luqman'], 31);
addAlias(['secde', 'sajda'], 32);
addAlias(['ahzab', 'ahzâb', 'azhap', 'azhab'], 33);
addAlias(['sebe', 'seba', 'sebe\'', 'saba'], 34);
addAlias(['fatir', 'fâtır', 'fatır'], 35);
addAlias(['yasin', 'yâsin', 'yâsîn'], 36);
addAlias(['saffat', 'sâffât'], 37);
addAlias(['sad', 'sâd'], 38);
addAlias(['zümer', 'zumer', 'zumar'], 39);
addAlias(['mümin', 'mumin', 'gafir', 'ghafir'], 40);
addAlias(['fussilet', 'fussılet', 'ha mim secde'], 41);
addAlias(['şura', 'sura', 'şûra', 'şûrâ'], 42);
addAlias(['zuhruf', 'züHruf'], 43);
addAlias(['duhan', 'duhân'], 44);
addAlias(['casiye', 'câsiye'], 45);
addAlias(['ahkaf', 'ahkâf'], 46);
addAlias(['muhammed'], 47);
addAlias(['fetih', 'feth'], 48);
addAlias(['hucurat', 'hucurât'], 49);
addAlias(['kaf', 'qaf'], 50);
addAlias(['zariyat', 'zâriyât', 'zâriyat'], 51);
addAlias(['tur', 'tûr'], 52);
addAlias(['necm'], 53);
addAlias(['kamer'], 54);
addAlias(['rahman', 'rahmân'], 55);
addAlias(['vakia', 'vâkıa', 'vakıa'], 56);
addAlias(['hadid', 'hadîd'], 57);
addAlias(['mücadele', 'mucadele', 'mücâdele'], 58);
addAlias(['haşr', 'hasr', 'hashr'], 59);
addAlias(['mümtehine', 'mumtehine', 'mümtahine'], 60);
addAlias(['saf', 'saff'], 61);
addAlias(['cuma', 'cum\'a'], 62);
addAlias(['münafikun', 'munafikun', 'münâfıkûn'], 63);
addAlias(['tegabun', 'teğâbun', 'tegâbün'], 64);
addAlias(['talak', 'talâk'], 65);
addAlias(['tahrim', 'tahrîm'], 66);
addAlias(['mülk', 'mulk'], 67);
addAlias(['kalem'], 68);
addAlias(['hakka', 'hâkka'], 69);
addAlias(['mearic', 'meâric', 'me\'aric'], 70);
addAlias(['nuh', 'nûh'], 71);
addAlias(['cin', 'cinn'], 72);
addAlias(['müzzemmil', 'muzzemmil'], 73);
addAlias(['müddessir', 'muddessir', 'müddesir'], 74);
addAlias(['kıyamet', 'kiyamet', 'kıyâmet'], 75);
addAlias(['insan', 'insân'], 76);
addAlias(['mürselat', 'murselat', 'mürselât'], 77);
addAlias(['nebe', 'nebe\'', 'amme'], 78);
addAlias(['naziat', 'nâziât', 'naziât'], 79);
addAlias(['abese'], 80);
addAlias(['tekvir', 'tekvîr'], 81);
addAlias(['infitar', 'infitâr'], 82);
addAlias(['mutaffifin', 'mutaffifîn', 'tatfif'], 83);
addAlias(['inşikak', 'insikak', 'inşikâk'], 84);
addAlias(['büruc', 'buruc', 'bürûc'], 85);
addAlias(['tarık', 'tarik', 'târık'], 86);
addAlias(['ala', 'âlâ', 'a\'la'], 87);
addAlias(['gaşiye', 'gasiye', 'gâşiye'], 88);
addAlias(['fecr'], 89);
addAlias(['beled'], 90);
addAlias(['şems', 'sems'], 91);
addAlias(['leyl', 'leyil'], 92);
addAlias(['duha', 'duhâ'], 93);
addAlias(['inşirah', 'insirah', 'şerh', 'serh'], 94);
addAlias(['tin', 'tîn'], 95);
addAlias(['alak', 'alâk'], 96);
addAlias(['kadir', 'kadr'], 97);
addAlias(['beyyine', 'beyyina'], 98);
addAlias(['zilzal', 'zelzele', 'zilzâl'], 99);
addAlias(['adiyat', 'âdiyât'], 100);
addAlias(['karia', 'kâria', 'kâri\'a'], 101);
addAlias(['tekasür', 'tekasur', 'tekâsür'], 102);
addAlias(['asr'], 103);
addAlias(['hümeze', 'humeze', 'hümaza'], 104);
addAlias(['fil'], 105);
addAlias(['kureyş', 'kureys', 'kureyis'], 106);
addAlias(['maun', 'mâûn', 'mâ\'ûn'], 107);
addAlias(['kevser', 'kevser'], 108);
addAlias(['kafirun', 'kâfirûn', 'kâfirun'], 109);
addAlias(['nasr'], 110);
addAlias(['tebbet', 'mesed', 'leheb'], 111);
addAlias(['ihlas', 'ihlâs'], 112);
addAlias(['felak', 'felâk'], 113);
addAlias(['nas', 'nâs'], 114);

const findSurahByNameOrAlias = (name: string): number | null => {
    const key = normalize(name);
    if (SURAH_ALIASES[key] !== undefined) return SURAH_ALIASES[key];

    if (key.length >= 3) {
        for (const [aliasKey, num] of Object.entries(SURAH_ALIASES)) {
            if (aliasKey.startsWith(key) || key.startsWith(aliasKey)) {
                return num;
            }
        }
    }

    // Live lookup check
    for (const surah of quranData) {
        const candidates = [
            surah.name.tr,
            surah.name.en,
            surah.name.de,
            surah.name.fr,
            surah.name.es,
        ];
        for (const c of candidates) {
            if (c) {
                const nc = normalize(c);
                if (nc === key || (key.length >= 3 && (nc.startsWith(key) || key.startsWith(nc)))) {
                    return surah.number;
                }
            }
        }
    }

    return null;
};

const getLocalizedSurahName = (surah: Surah, language: AppLanguage) => {
    return surah.name[language] || surah.name.tr;
};

export const searchAyahs = (query: string, language: AppLanguage = "tr") => {
    const cleaned = query.trim();
    if (cleaned.length < 3) return [];

    const results: { surahName: string; surahNumber: number; ayah: Ayah }[] = [];

    const constructItem = (surah: Surah, ayah: Ayah) => ({
        surahName: getLocalizedSurahName(surah, language),
        surahNumber: surah.number,
        ayah,
    });

    // 1. Ayah reference search (ends with number, e.g. "nisa 26", "3:5")
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

            if (surahNumber) {
                const surah = getSurah(surahNumber);
                if (surah) {
                    const ayah = surah.ayahs.find((a) => a.number === ayahNumber);
                    if (ayah) {
                        results.push(constructItem(surah, ayah));
                        return results; // Return single specific ayah
                    }
                }
            }
        }
    }

    // 2. Surah name search (lists all verses of the matched Surah)
    let singleSurahNumber: number | null = null;
    if (/^\d{1,3}$/.test(cleaned)) {
        singleSurahNumber = parseInt(cleaned, 10);
    } else {
        singleSurahNumber = findSurahByNameOrAlias(cleaned);
    }

    if (singleSurahNumber) {
        const surah = getSurah(singleSurahNumber);
        if (surah) {
            surah.ayahs.forEach((ayah) => {
                results.push(constructItem(surah, ayah));
            });
            return results;
        }
    }

    // 3. Fallback: Full-text translation/arabic search
    const lowerQuery = cleaned.toLowerCase();
    quranData.forEach((surah) => {
        surah.ayahs.forEach((ayah) => {
            if (
                ayah.translations[language]?.toLowerCase().includes(lowerQuery) ||
                ayah.arabic.includes(cleaned)
            ) {
                results.push(constructItem(surah, ayah));
            }
        });
    });

    return results;
};
