import { PAGE_START_MAP } from './pageMapping';
import { quranData } from './quranData';
import type { AppLanguage, Ayah } from '@/types/quran';

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

// 14 Tilavet Secdesi ayetinin listesi (Sure No -> Ayet No Seti)
const SAJDAH_MAP: Record<number, Set<number>> = {
  7: new Set([206]),   // A'raf
  13: new Set([15]),   // Ra'd
  16: new Set([49]),   // Nahl
  17: new Set([109]),  // Isra
  19: new Set([58]),   // Meryem
  22: new Set([18]),   // Hac
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

export const BISMILLAH_ARABIC = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
export const BISMILLAH_ARABIC_UTHMANI = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

export const hasBismillah = (surahNumber: number): boolean => {
  return surahNumber !== 1 && surahNumber !== 9;
};

export const splitBismillah = (text: string): { bismillah: string | null; ayahText: string } => {
  let trimmed = text.trim();
  trimmed = trimmed.replace(/^[\u200B-\u200D\uFEFF]/g, '');

  if (trimmed.startsWith(BISMILLAH_ARABIC_UTHMANI)) {
    let remaining = trimmed.substring(BISMILLAH_ARABIC_UTHMANI.length).trim();
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

