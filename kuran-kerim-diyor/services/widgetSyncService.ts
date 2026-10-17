import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyVerseService, localDateKey } from './dailyVerseService';
import { AppLanguage } from '../constants/languages';
import { getDailyHadithIndex, HADITH_STRINGS, HADITHS, hadithExcerpt, hadithReference } from './hadithData';

export interface WidgetPayload {
  cachedDate: string;
  lastActiveDate: string;
  streak: number;
  todayCompleted: boolean;
  longestStreak: number;
  text: string;
  reference: string;
  surahNumber: number;
  startAyah: number;
  language: string;
  labels: {
    title: string;
    streakBadge: string;
    todayStatus: string;
  };
  hadith: {
    title: string;
    gradeLabels: { sahih: string; hasan: string };
    days: Array<{ date: string; id: string; text: string; reference: string; grade: string }>;
  };
}

// Widget uygulama açılmadan da doğru hadisi gösterebilsin diye önümüzdeki günler önceden yazılır.
const HADITH_LOOKAHEAD_DAYS = 14;

function buildHadithWidgetData(lang: string): WidgetPayload['hadith'] {
  const language = (lang in HADITH_STRINGS ? lang : 'tr') as AppLanguage;
  const strings = HADITH_STRINGS[language];
  const days: WidgetPayload['hadith']['days'] = [];
  for (let offset = 0; offset < HADITH_LOOKAHEAD_DAYS; offset++) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const hadith = HADITHS[getDailyHadithIndex(date)];
    days.push({
      date: localDateKey(date),
      id: hadith.id,
      text: hadithExcerpt(hadith.text[language], 220),
      reference: hadithReference(hadith, language),
      grade: hadith.grade,
    });
  }
  return {
    title: strings.daily.toLocaleUpperCase(language),
    gradeLabels: { sahih: strings.sahih, hasan: strings.hasan },
    days,
  };
}

const WIDGET_LABELS: Record<string, { title: string; streakSuffix: string; completed: string; pending: string }> = {
  tr: {
    title: 'GÜNÜN AYETİ',
    streakSuffix: 'Gün',
    completed: 'Bugün Okundu ✓',
    pending: 'Serini Koru',
  },
  en: {
    title: 'VERSE OF THE DAY',
    streakSuffix: 'Days',
    completed: 'Completed Today ✓',
    pending: 'Keep Streak',
  },
  ar: {
    title: 'آية اليوم',
    streakSuffix: 'يوم',
    completed: 'تمت القراءة اليوم ✓',
    pending: 'حافظ على استمرارك',
  },
  de: {
    title: 'VERS DES TAGES',
    streakSuffix: 'Tage',
    completed: 'Heute gelesen ✓',
    pending: 'Serie fortsetzen',
  },
  fr: {
    title: 'VERSET DU JOUR',
    streakSuffix: 'Jours',
    completed: 'Lu aujourd’hui ✓',
    pending: 'Maintenir la série',
  },
  es: {
    title: 'VERSÍCULO DEL DÍA',
    streakSuffix: 'Días',
    completed: 'Leído hoy ✓',
    pending: 'Mantén la racha',
  },
};

export const WidgetSyncService = {
  sync: async (params: {
    streak: number;
    todayCompleted: boolean;
    longestStreak?: number;
    language?: string;
    lastActiveDate?: string | null;
  }): Promise<void> => {
    try {
      const lang = params.language || (await AsyncStorage.getItem('@app_language')) || 'tr';
      const labelsConfig = WIDGET_LABELS[lang] || WIDGET_LABELS.tr;

      // Önbellekteki veya taze günün ayetini al
      let dailyVerse = await DailyVerseService.getCachedDailyVerse(lang);
      if (!dailyVerse) {
        try {
          dailyVerse = await DailyVerseService.getDailyVerse(lang);
        } catch {
          dailyVerse = {
            text: 'Şüphesiz her zorlukla beraber bir kolaylık vardır.',
            reference: 'İnşirah 94:5',
            cachedDate: localDateKey(),
            surahNumber: 94,
            startAyah: 5,
          };
        }
      }

      const streakText = params.streak > 0 ? `🔥 ${params.streak} ${labelsConfig.streakSuffix}` : '';
      const statusText = params.todayCompleted ? labelsConfig.completed : labelsConfig.pending;
      const todayDate = localDateKey();
      const lastActiveDate = params.lastActiveDate || (await AsyncStorage.getItem('@app_last_active_date')) || (params.todayCompleted ? todayDate : '');

      const payload: WidgetPayload = {
        cachedDate: dailyVerse.cachedDate || todayDate,
        lastActiveDate: lastActiveDate,
        streak: params.streak,
        todayCompleted: params.todayCompleted,
        longestStreak: params.longestStreak || params.streak,
        text: dailyVerse.text || 'Şüphesiz her zorlukla beraber bir kolaylık vardır.',
        reference: dailyVerse.reference || 'İnşirah 94:5',
        surahNumber: (dailyVerse as any).surahNumber || 94,
        startAyah: (dailyVerse as any).startAyah || 5,
        language: lang,
        labels: {
          title: labelsConfig.title,
          streakBadge: streakText,
          todayStatus: statusText,
        },
        hadith: buildHadithWidgetData(lang),
      };

      const jsonString = JSON.stringify(payload);

      // Yerel AsyncStorage kopyası
      await AsyncStorage.setItem('@widget_synced_payload', jsonString);

      // Native @bittingz/expo-widgets modülü çağrısı
      const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
      if (!isExpoGo && (Platform.OS === 'android' || Platform.OS === 'ios')) {
        try {
          const { setWidgetData } = require('@bittingz/expo-widgets');
          if (typeof setWidgetData === 'function') {
            if (Platform.OS === 'android') {
              setWidgetData(jsonString, 'com.kurankerimdiyor');
            } else {
              setWidgetData(jsonString);
            }
          }
        } catch {
          // Widget native modülü yalnızca development/production build'lerde bulunur.
        }
      }
    } catch (error) {
      console.warn('WidgetSyncService.sync failed:', error);
    }
  },
};
