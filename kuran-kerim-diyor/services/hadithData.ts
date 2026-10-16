import { AppLanguage } from '../constants/languages';

// kuran-ne-diyor-web/data/hadiths.json ile birebir aynı dosyadır; çevrimdışı çalışmak için paketlenir.
const HADITH_FILE = require('../assets/hadith/hadiths.json') as { hadiths: Hadith[] };

export type Hadith = {
  id: string;
  collection: 'bukhari' | 'nawawi';
  number: number;
  grade: 'sahih' | 'hasan';
  sources: string[];
  text: Record<AppLanguage, string>;
};

export const HADITHS: Hadith[] = HADITH_FILE.hadiths;

const SOURCE_NAMES: Record<string, Record<AppLanguage, string>> = {
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

const NAWAWI_TITLE: Record<AppLanguage, string> = {
  tr: 'Nevevî, Kırk Hadis',
  en: "An-Nawawi's Forty",
  ar: 'الأربعون النووية',
  de: 'An-Nawawis Vierzig',
  fr: "Les Quarante d'an-Nawawi",
  es: 'Los Cuarenta de an-Nawawi',
};

export const HADITH_STRINGS: Record<AppLanguage, {
  title: string; daily: string; subtitle: string; sahih: string; hasan: string; previous: string; next: string;
  today: string; share: string; notifyTitle: string; notifyBody: string; sourceNote: string; editorialNote: string;
}> = {
  tr: {
    title: 'Hadisler', daily: 'Günün Hadisi', subtitle: 'Sahih kaynaklardan her gün bir hadis',
    sahih: 'Sahih', hasan: 'Hasen', previous: 'Önceki', next: 'Sonraki', today: 'Bugüne dön', share: 'Paylaş',
    notifyTitle: 'Akşam hadis bildirimi', notifyBody: 'Her akşam 19:00’da günün hadisini gönder.',
    sourceNote: 'Hadisler Sahîh-i Buhârî ve İmam Nevevî’nin Kırk Hadis’inden seçilmiştir. Sened zinciri sadeleştirilmiş, metin ve kaynak numarası korunmuştur.',
    editorialNote: '',
  },
  en: {
    title: 'Hadith', daily: 'Hadith of the Day', subtitle: 'One hadith a day from authentic sources',
    sahih: 'Sahih', hasan: 'Hasan', previous: 'Previous', next: 'Next', today: 'Back to today', share: 'Share',
    notifyTitle: 'Evening hadith notification', notifyBody: 'Send the hadith of the day every evening at 7 PM.',
    sourceNote: 'Selected from Sahih al-Bukhari and Imam an-Nawawi’s Forty Hadith. The chain of narrators is shortened; the text and reference number are preserved.',
    editorialNote: '',
  },
  ar: {
    title: 'الأحاديث', daily: 'حديث اليوم', subtitle: 'حديث كل يوم من المصادر الصحيحة',
    sahih: 'صحيح', hasan: 'حسن', previous: 'السابق', next: 'التالي', today: 'العودة إلى اليوم', share: 'مشاركة',
    notifyTitle: 'إشعار حديث المساء', notifyBody: 'أرسل حديث اليوم كل مساء في الساعة 7.',
    sourceNote: 'مختارة من صحيح البخاري والأربعين النووية. اختُصر الإسناد مع الحفاظ على المتن ورقم الحديث.',
    editorialNote: '',
  },
  de: {
    title: 'Hadithe', daily: 'Hadith des Tages', subtitle: 'Jeden Tag ein Hadith aus authentischen Quellen',
    sahih: 'Sahih', hasan: 'Hasan', previous: 'Zurück', next: 'Weiter', today: 'Zu heute', share: 'Teilen',
    notifyTitle: 'Abendlicher Hadith', notifyBody: 'Jeden Abend um 19 Uhr den Hadith des Tages senden.',
    sourceNote: 'Ausgewählt aus Sahih al-Buchari und den Vierzig Hadithen von an-Nawawi. Die Überliefererkette ist gekürzt; Text und Quellennummer bleiben erhalten.',
    editorialNote: 'Die deutsche Übersetzung ist eine redaktionelle Übertragung aus dem Arabischen mit der englischen Ausgabe als Referenz.',
  },
  fr: {
    title: 'Hadiths', daily: 'Hadith du jour', subtitle: 'Un hadith par jour issu de sources authentiques',
    sahih: 'Sahih', hasan: 'Hasan', previous: 'Précédent', next: 'Suivant', today: 'Revenir à aujourd’hui', share: 'Partager',
    notifyTitle: 'Hadith du soir', notifyBody: 'Recevoir le hadith du jour chaque soir à 19 h.',
    sourceNote: 'Sélectionnés dans le Sahih d’al-Boukhari et les Quarante hadiths d’an-Nawawi. La chaîne de transmission est abrégée ; le texte et le numéro de référence sont conservés.',
    editorialNote: '',
  },
  es: {
    title: 'Hadices', daily: 'Hadiz del día', subtitle: 'Un hadiz al día de fuentes auténticas',
    sahih: 'Sahih', hasan: 'Hasan', previous: 'Anterior', next: 'Siguiente', today: 'Volver a hoy', share: 'Compartir',
    notifyTitle: 'Hadiz de la tarde', notifyBody: 'Enviar el hadiz del día cada tarde a las 19:00.',
    sourceNote: 'Seleccionados del Sahih de al-Bujari y los Cuarenta hadices de an-Nawawi. La cadena de transmisores se ha abreviado; se conservan el texto y el número de referencia.',
    editorialNote: 'La traducción al español es una traducción editorial del árabe con la edición inglesa como referencia.',
  },
};

/** Cihazın yerel takvim günü; backend aynı formülü saat dilimine göre uygular. */
export function getDailyHadithIndex(date = new Date()) {
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return dayNumber % HADITHS.length;
}

export function getHadithById(id?: string | null) {
  if (!id) return undefined;
  return HADITHS.find((hadith) => hadith.id === id);
}

export function hadithReference(hadith: Hadith, lang: AppLanguage) {
  if (hadith.collection === 'bukhari') return `${SOURCE_NAMES.bukhari[lang]}, ${hadith.number}`;
  const sources = hadith.sources.map((source) => SOURCE_NAMES[source]?.[lang] ?? source).join(', ');
  return `${NAWAWI_TITLE[lang]} ${hadith.number} · ${sources}`;
}

/** Peygamber'e ait sözü (ilk tırnak içi) çıkarır; widget ve paylaşım gibi kısa yüzeyler için. */
export function hadithExcerpt(text: string, maxLength = 180) {
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
