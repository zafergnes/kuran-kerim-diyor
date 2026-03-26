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
    translations: Record<AppLanguage, string>;
}

export interface Surah {
    number: number;
    name: {
        ar: string;
        tr: string;
        en: string;
    };
    englishNameTranslation: string;
    revelationType: string;
    ayahs: Ayah[];
}

export const quranData = quranDataJson as Surah[];

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

/**
 * Kapsamlı normalize fonksiyonu – fonetik eşleştirme için:
 *  1. lowercase
 *  2. Türkçe / diacritic → ASCII  (ş→s, ç→c, ğ→g, ı→i, ö→o, ü→u …)
 *  3. Arapça yazı karakterlerini sil
 *  4. Fonetik digraph düzleştirme  (sh→s, kh→h, gh→g, th→t, dh→d)
 *  5. Doubled vowel kısaltma       (aa→a, ee→e, oo→o, ii→i, uu→u)
 *  6. Yaygın transliterasyon prefix'lerini sil (al-, ash-, adh-, …)
 *  7. Tire, apostrof, boşluk sil
 */
const CHAR_MAP: Record<string, string> = {
    'ş': 's', 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ü': 'u',
    'â': 'a', 'î': 'i', 'û': 'u', 'é': 'e', 'è': 'e', 'ê': 'e',
    'à': 'a', 'ñ': 'n', 'ä': 'a',
};

const normalize = (s: string): string => {
    let o = s.toLowerCase();
    // 2 – Türkçe / diacritic
    o = o.replace(/[^\x00-\x7F]/g, ch => CHAR_MAP[ch] || ch);
    // 3 – Arapça Unicode bloklarını sil
    o = o.replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
    // 6 – Prefix sil  (adh-, ash-, al-, an-, ar-, ad-, at-, az-, aal-)
    o = o.replace(/^(adh|ash|al|an|ar|ad|at|az|aal)[-\s]*/i, '');
    // 7 – Tire, apostrof, boşluk sil
    o = o.replace(/[-'\s]/g, '');
    // 4 – Fonetik digraph düzleştirme
    o = o.replace(/sh/g, 's');
    o = o.replace(/kh/g, 'h');
    o = o.replace(/gh/g, 'g');
    o = o.replace(/th/g, 't');
    o = o.replace(/dh/g, 'd');
    // 5 – Doubled vowel kısalt
    o = o.replace(/(.)\1+/g, '$1');
    return o;
};

/* ── Türkçe / alternatif sure isim haritası ────────────────────── */
const SURAH_ALIASES: Record<string, number> = {};

// Alias ekle (normalize ederek key olarak kullan)
const addAlias = (names: string[], surahNo: number) => {
    for (const n of names) {
        SURAH_ALIASES[normalize(n)] = surahNo;
    }
};

// 114 sure – Türkçe yaygın isimler + alternatifler
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
addAlias(['hakka', 'hâkka', 'hâkka'], 69);
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
addAlias(['kevser', 'kövsêr'], 108);
addAlias(['kafirun', 'kâfirûn', 'kâfirun'], 109);
addAlias(['nasr'], 110);
addAlias(['tebbet', 'mesed', 'leheb'], 111);
addAlias(['ihlas', 'ihlâs'], 112);
addAlias(['felak', 'felâk'], 113);
addAlias(['nas', 'nâs'], 114);

/**
 * Alias haritasından sure numarası bul.
 * Girdiyi normalize edip SURAH_ALIASES'ta arar.
 */
const findSurahByAlias = (name: string): number | null => {
    const key = normalize(name);
    if (SURAH_ALIASES[key] !== undefined) return SURAH_ALIASES[key];

    // Partial match: alias key starts with input or input starts with alias key
    if (key.length >= 3) {
        for (const [aliasKey, num] of Object.entries(SURAH_ALIASES)) {
            if (aliasKey.startsWith(key) || key.startsWith(aliasKey)) {
                return num;
            }
        }
    }
    return null;
};

/* ── Sure adı ile ayet bulmak için parseReference ──────────────── */

const parseReference = (
    query: string,
): { surahNumber: number; ayahNumber: number } | null => {
    const trimmed = query.trim();

    if (trimmed.length < 3) return null;

    // Sondaki sayıyı bul  (ör: "sebe 50" → "50",  "34:50" → "50")
    const tailDigits = trimmed.match(/(\d{1,3})$/);

    if (!tailDigits) return null;

    const ayahNumber = parseInt(tailDigits[1], 10);


    // Sayıdan önceki kısmı al ve separator'ları temizle
    let before = trimmed.substring(0, tailDigits.index!).trim();
    // Sondaki : . - gibi ayırıcıları sil
    before = before.replace(/[:\.\-]+$/, '').trim();


    if (!before) return null;

    // Eğer öndeki kısım da saf sayı ise → sure numarası + ayet numarası
    if (/^\d{1,3}$/.test(before)) {

        return {
            surahNumber: parseInt(before, 10),
            ayahNumber,
        };
    }

    // ── İlk önce alias haritasından ara (Türkçe isimler) ──
    const aliasMatch = findSurahByAlias(before);
    if (aliasMatch) {

        return { surahNumber: aliasMatch, ayahNumber };
    }

    // ── Sonra normalize tabanlı eşleştirme (data.json isimleri) ──
    const ni = normalize(before);

    if (!ni) return null;

    for (const surah of quranData) {
        const candidates = [
            surah.name.tr,
            surah.name.en,
            surah.name.ar,
            surah.englishNameTranslation,
        ];

        // a) Tam eşleşme
        for (const c of candidates) {
            if (normalize(c) === ni) {

                return { surahNumber: surah.number, ayahNumber };
            }
        }

        // b) startsWith / includes  (min 3 karakter)
        if (ni.length >= 3) {
            for (const c of candidates) {
                const nc = normalize(c);
                if (nc.length === 0) continue; // Arapça isimler boş string olur, atla
                if (
                    nc.startsWith(ni) ||
                    ni.startsWith(nc) ||
                    nc.includes(ni)
                ) {

                    return { surahNumber: surah.number, ayahNumber };
                }
            }
        }

        // c) Ünsüz iskelet eşleştirmesi  (min 3 karakter)
        //    "sebe"→sb  ===  "Saba"→sb   ✓
        //    "nisa"→ns  ===  "Nisaa"→ns   ✓
        if (ni.length >= 3) {
            const ic = ni.replace(/[aeiou]/g, '');
            if (ic.length >= 2) {
                for (const c of candidates) {
                    const cc = normalize(c).replace(/[aeiou]/g, '');
                    if (cc.length >= 2 && (
                        cc === ic ||
                        cc.startsWith(ic) ||
                        ic.startsWith(cc)
                    )) {

                        return { surahNumber: surah.number, ayahNumber };
                    }
                }
            }
        }
    }

    return null;
};

/* ── Ana arama fonksiyonu ──────────────────────────────────────── */

export const searchAyahs = (query: string, language: AppLanguage) => {
    const results: { surahName: string; surahNumber: number; ayah: Ayah }[] = [];

    // 1) Referans tabanlı arama  (34:50, sebe 50 …)
    const ref = parseReference(query);

    if (ref) {
        const surah = getSurah(ref.surahNumber);
        if (surah) {
            const ayah = surah.ayahs.find(a => a.number === ref.ayahNumber);
            if (ayah) {
                const sName =
                    language === 'ar'
                        ? surah.name.ar
                        : language === 'en'
                            ? surah.name.en
                            : surah.name.tr;
                results.push({
                    surahName: sName || surah.name.ar,
                    surahNumber: surah.number,
                    ayah,
                });
                return results;
            }
        }
    }

    // 2) Mevcut metin araması (en az 3 karakter, meal + Arapça)
    const lowerQuery = query.toLowerCase();

    quranData.forEach(surah => {
        surah.ayahs.forEach(ayah => {
            if (
                ayah.translations[language]?.toLowerCase().includes(lowerQuery) ||
                ayah.arabic.includes(query)
            ) {
                const sName =
                    language === 'ar'
                        ? surah.name.ar
                        : language === 'en'
                            ? surah.name.en
                            : surah.name.tr;
                results.push({
                    surahName: sName || surah.name.ar,
                    surahNumber: surah.number,
                    ayah,
                });
            }
        });
    });

    return results;
};
