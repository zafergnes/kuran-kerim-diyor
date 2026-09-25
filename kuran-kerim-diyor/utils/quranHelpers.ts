import { AppLanguage } from '../constants/languages';
import { PAGE_START_MAP } from './pageMapping';
import { quranData, Ayah } from '../services/quranData';

export interface PageAyahItem {
    surahNumber: number;
    surahName: string;
    ayah: Ayah;
}

const isAfterOrEqual = (s1: number, a1: number, s2: number, a2: number): boolean => {
    if (s1 > s2) return true;
    if (s1 === s2 && a1 >= a2) return true;
    return false;
};

const isBefore = (s1: number, a1: number, s2: number, a2: number): boolean => {
    if (s1 < s2) return true;
    if (s1 === s2 && a1 < a2) return true;
    return false;
};

/**
 * Find which page (1-604) a given surah and ayah belongs to.
 * Binary search: O(log 604) <= 10 comparisons instead of linear 604 iterations.
 */
export const getPageFromSurahAyah = (surah: number, ayah: number): number => {
    let low = 0;
    let high = PAGE_START_MAP.length - 1;
    let result = 0;

    while (low <= high) {
        const mid = (low + high) >> 1;
        const start = PAGE_START_MAP[mid];
        if (isAfterOrEqual(surah, ayah, start.surah, start.ayah)) {
            result = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return result + 1;
};

// In-memory cache for fast 0ms retrieval of computed pages
const PAGE_AYAH_CACHE = new Map<string, PageAyahItem[]>();

/**
 * Returns all ayahs contained in a specific page (1-604) along with their surah name.
 * Uses direct surah slicing and memory cache (avoids scanning 6,236 verses on every call).
 */
export const getPageAyahs = (pageNumber: number, language: AppLanguage = 'tr'): PageAyahItem[] => {
    if (pageNumber < 1 || pageNumber > 604) return [];
    
    const cacheKey = `${pageNumber}_${language}`;
    const cached = PAGE_AYAH_CACHE.get(cacheKey);
    if (cached) return cached;

    const startIndex = pageNumber - 1;
    const start = PAGE_START_MAP[startIndex];
    const end = pageNumber < 604 ? PAGE_START_MAP[pageNumber] : null;
    
    const pageAyahs: PageAyahItem[] = [];
    const endSurah = end ? end.surah : 114;

    for (let s = start.surah; s <= endSurah; s++) {
        const surah = quranData[s - 1];
        if (!surah) continue;

        const surahName = surah.name[language] || surah.name.tr;
        const startAyahIndex = (s === start.surah) ? Math.max(0, start.ayah - 1) : 0;
        const endAyahIndex = (end && s === end.surah) ? end.ayah - 1 : surah.ayahs.length;

        for (let a = startAyahIndex; a < endAyahIndex; a++) {
            const ayah = surah.ayahs[a];
            if (ayah) {
                pageAyahs.push({
                    surahNumber: surah.number,
                    surahName,
                    ayah
                });
            }
        }
    }
    
    PAGE_AYAH_CACHE.set(cacheKey, pageAyahs);
    return pageAyahs;
};

// 14 Tilavet Secdesi ayetinin listesi (Sure No -> Ayet No Seti)
const SAJDAH_MAP: Record<number, Set<number>> = {
    7: new Set([206]),   // A'raf
    13: new Set([15]),   // Ra'd
    16: new Set([49]),   // Nahl
    17: new Set([109]),  // Isra
    19: new Set([58]),   // Meryem
    22: new Set([18]),   // Hac (Bazi mezheplerde 77 de secde sayilir ama resmi mushaflarda 18'dir)
    25: new Set([60]),   // Furkan
    27: new Set([25]),   // Neml
    32: new Set([15]),   // Secde
    38: new Set([24]),   // Sad
    41: new Set([38]),   // Fussilet
    53: new Set([62]),   // Necm
    84: new Set([21]),   // Insikak
    96: new Set([19]),   // Alak
};

export const isSajdahAyah = (surahNumber: number, ayahNumber: number): boolean => {
    return SAJDAH_MAP[surahNumber]?.has(ayahNumber) || false;
};

// Standart Besmele metni (Diyanet ve Uthmani imlalarina gore unicode normalize edilmis arama kalibi)
export const BISMILLAH_ARABIC = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
export const BISMILLAH_ARABIC_UTHMANI = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

export const hasBismillah = (surahNumber: number): boolean => {
    // Fatiha (1) suresinde besmele 1. ayet kabul edilir, ayrica eklenmez.
    // Tevbe (9) suresinde besmele yoktur.
    return surahNumber !== 1 && surahNumber !== 9;
};

export const splitBismillah = (text: string): { bismillah: string | null; ayahText: string } => {
    let trimmed = text.trim();
    // Bazi verilerde basinda sifir genislikli bosluklar (ZWNBSP/FEFF) veya diger kontrol karakterleri olabilir, temizleyelim.
    trimmed = trimmed.replace(/^[\u200B-\u200D\uFEFF]/g, '');

    if (trimmed.startsWith(BISMILLAH_ARABIC_UTHMANI)) {
        let remaining = trimmed.substring(BISMILLAH_ARABIC_UTHMANI.length).trim();
        // Basindaki gizli arapca bosluk veya harfleri temizle
        remaining = remaining.replace(/^[\s\u2002\u2009\u200A\u00A0]+/g, '');
        return { bismillah: BISMILLAH_ARABIC_UTHMANI, ayahText: remaining };
    }
    if (trimmed.startsWith(BISMILLAH_ARABIC)) {
        let remaining = trimmed.substring(BISMILLAH_ARABIC.length).trim();
        remaining = remaining.replace(/^[\s\u2002\u2009\u200A\u00A0]+/g, '');
        return { bismillah: BISMILLAH_ARABIC, ayahText: remaining };
    }
    return { bismillah: null, ayahText: trimmed };
};

