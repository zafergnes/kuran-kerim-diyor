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
 */
export const getPageFromSurahAyah = (surah: number, ayah: number): number => {
    for (let i = PAGE_START_MAP.length - 1; i >= 0; i--) {
        const start = PAGE_START_MAP[i];
        if (isAfterOrEqual(surah, ayah, start.surah, start.ayah)) {
            return i + 1; // 1-indexed page number
        }
    }
    return 1;
};

/**
 * Returns all ayahs contained in a specific page (1-604) along with their surah name.
 */
export const getPageAyahs = (pageNumber: number, language: AppLanguage = 'tr'): PageAyahItem[] => {
    if (pageNumber < 1 || pageNumber > 604) return [];
    
    const startIndex = pageNumber - 1;
    const start = PAGE_START_MAP[startIndex];
    const end = pageNumber < 604 ? PAGE_START_MAP[pageNumber] : null;
    
    const pageAyahs: PageAyahItem[] = [];
    
    for (const surah of quranData) {
        if (surah.number < start.surah) continue;
        if (end && surah.number > end.surah) break;
        
        for (const ayah of surah.ayahs) {
            const isAfterStart = isAfterOrEqual(surah.number, ayah.number, start.surah, start.ayah);
            const isBeforeEnd = end ? isBefore(surah.number, ayah.number, end.surah, end.ayah) : true;
            
            if (isAfterStart && isBeforeEnd) {
                pageAyahs.push({
                    surahNumber: surah.number,
                    surahName: surah.name[language] || surah.name.tr,
                    ayah
                });
            }
        }
    }
    
    return pageAyahs;
};
