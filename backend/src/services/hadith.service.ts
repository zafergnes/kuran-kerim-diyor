import fs from 'fs';
import path from 'path';

export const HADITH_LANGUAGES = ['tr', 'en', 'ar', 'de', 'fr', 'es'] as const;
export type HadithLanguage = typeof HADITH_LANGUAGES[number];

export type Hadith = {
  id: string;
  collection: 'bukhari' | 'nawawi';
  number: number;
  grade: 'sahih' | 'hasan';
  sources: string[];
  text: Record<HadithLanguage, string>;
};

type HadithFile = { version: number; hadiths: Hadith[] };

const SOURCE_NAMES: Record<string, Record<HadithLanguage, string>> = {
  bukhari: { tr: 'Buhârî', en: 'al-Bukhari', ar: 'البخاري', de: 'al-Buchari', fr: 'al-Boukhari', es: 'al-Bujari' },
  muslim: { tr: 'Müslim', en: 'Muslim', ar: 'مسلم', de: 'Muslim', fr: 'Mouslim', es: 'Muslim' },
  tirmidhi: { tr: 'Tirmizî', en: 'at-Tirmidhi', ar: 'الترمذي', de: 'at-Tirmidhi', fr: 'at-Tirmidhi', es: 'at-Tirmidhi' },
  nasai: { tr: 'Nesâî', en: "an-Nasa'i", ar: 'النسائي', de: "an-Nasa'i", fr: 'an-Nasaï', es: "an-Nasa'i" },
  abudawud: { tr: 'Ebû Dâvûd', en: 'Abu Dawud', ar: 'أبو داود', de: 'Abu Dawud', fr: 'Abou Dawoud', es: 'Abu Dawud' },
  ibnmajah: { tr: 'İbn Mâce', en: 'Ibn Majah', ar: 'ابن ماجه', de: 'Ibn Madscha', fr: 'Ibn Majah', es: 'Ibn Mayah' },
  ahmad: { tr: 'Ahmed b. Hanbel', en: 'Ahmad', ar: 'أحمد', de: 'Ahmad', fr: 'Ahmad', es: 'Ahmad' },
  darimi: { tr: 'Dârimî', en: 'ad-Darimi', ar: 'الدارمي', de: 'ad-Darimi', fr: 'ad-Darimi', es: 'ad-Darimi' },
  daraqutni: { tr: 'Dârekutnî', en: 'ad-Daraqutni', ar: 'الدارقطني', de: 'ad-Daraqutni', fr: 'ad-Daraqutni', es: 'ad-Daraqutni' },
  bayhaqi: { tr: 'Beyhakî', en: 'al-Bayhaqi', ar: 'البيهقي', de: 'al-Baihaqi', fr: 'al-Bayhaqi', es: 'al-Bayhaqi' },
};

const NAWAWI_TITLE: Record<HadithLanguage, string> = {
  tr: 'Nevevî, Kırk Hadis',
  en: "An-Nawawi's Forty",
  ar: 'الأربعون النووية',
  de: 'An-Nawawis Vierzig',
  fr: "Les Quarante d'an-Nawawi",
  es: 'Los Cuarenta de an-Nawawi',
};

let cache: Hadith[] | null = null;

/** quran.json ile aynı klasörde (kuran-ne-diyor-web/data) tutulur; Docker'da bu klasör konteynere bağlanır. */
function loadHadiths(): Hadith[] {
  if (cache) return cache;
  const relative = 'kuran-ne-diyor-web/data/hadiths.json';
  const candidates: string[] = [];
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    candidates.push(path.join(dir, relative));
    dir = path.dirname(dir);
  }
  candidates.push(path.join(process.cwd(), relative), path.join(process.cwd(), '..', relative));
  const file = candidates.find((candidate) => fs.existsSync(candidate));
  if (!file) throw new Error('hadiths.json bulunamadı.');
  const data = JSON.parse(fs.readFileSync(file, 'utf-8')) as HadithFile;
  cache = data.hadiths;
  return cache;
}

export const normalizeHadithLanguage = (value: unknown): HadithLanguage =>
  HADITH_LANGUAGES.includes(value as HadithLanguage) ? (value as HadithLanguage) : 'tr';

/** Verilen saat diliminde bugünün takvim günü; geçersiz bölgede UTC kullanılır. */
function localDayNumber(date: Date, timeZone?: string): number {
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  let day = date.getUTCDate();
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date);
      year = Number(parts.find((part) => part.type === 'year')?.value);
      month = Number(parts.find((part) => part.type === 'month')?.value);
      day = Number(parts.find((part) => part.type === 'day')?.value);
    } catch {
      // Geçersiz saat dilimi: UTC tarihinde kal.
    }
  }
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

/**
 * Bildirim, widget ve kısa gösterimler için hadisin Peygamber'e ait sözünü çıkarır.
 * Tırnak bulunamazsa metnin başını kelime sınırında kısaltır.
 */
export function hadithExcerpt(text: string, maxLength = 180): string {
  const pairs: Array<[string, string]> = [['“', '”'], ['«', '»'], ['„', '“'], ['"', '"']];
  let quote = '';
  for (const [open, close] of pairs) {
    const start = text.indexOf(open);
    if (start < 0) continue;
    const end = text.indexOf(close, start + 1);
    const candidate = (end > start ? text.slice(start + 1, end) : text.slice(start + 1)).trim();
    if (candidate.length >= 20) {
      quote = candidate;
      break;
    }
  }
  const body = (quote || text).replace(/\s+/g, ' ').trim();
  if (body.length <= maxLength) return body;
  const cut = body.slice(0, maxLength);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), maxLength - 20)).replace(/[,;:،\s]+$/, '')}…`;
}

export function hadithReference(hadith: Hadith, lang: HadithLanguage): string {
  const sources = hadith.sources.map((source) => SOURCE_NAMES[source]?.[lang] ?? source).join(', ');
  if (hadith.collection === 'bukhari') return `${SOURCE_NAMES.bukhari[lang]}, ${hadith.number}`;
  return `${NAWAWI_TITLE[lang]} ${hadith.number} · ${sources}`;
}

export class HadithService {
  static all(): Hadith[] {
    return loadHadiths();
  }

  static getById(id: string): Hadith | undefined {
    return loadHadiths().find((hadith) => hadith.id === id);
  }

  static getDaily(timeZone?: string, now = new Date()): Hadith {
    const hadiths = loadHadiths();
    return hadiths[localDayNumber(now, timeZone) % hadiths.length];
  }

  static present(hadith: Hadith, lang: HadithLanguage) {
    return {
      id: hadith.id,
      collection: hadith.collection,
      number: hadith.number,
      grade: hadith.grade,
      sources: hadith.sources,
      language: lang,
      text: hadith.text[lang],
      arabic: hadith.text.ar,
      excerpt: hadithExcerpt(hadith.text[lang]),
      reference: hadithReference(hadith, lang),
    };
  }
}
