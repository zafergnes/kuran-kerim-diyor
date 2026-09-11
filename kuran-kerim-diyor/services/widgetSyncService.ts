import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyVerseService } from './dailyVerseService';

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
          };
        }
      }

      const streakText = `🔥 ${params.streak} ${labelsConfig.streakSuffix}`;
      const statusText = params.todayCompleted ? labelsConfig.completed : labelsConfig.pending;

      const payload: WidgetPayload = {
        cachedDate: dailyVerse.cachedDate || '',
        lastActiveDate: (await AsyncStorage.getItem('@app_last_active_date')) || '',
        streak: params.streak,
        todayCompleted: params.todayCompleted,
        longestStreak: params.longestStreak || params.streak,
        text: dailyVerse.text || '',
        reference: dailyVerse.reference || '',
        surahNumber: (dailyVerse as any).surahNumber || 94,
        startAyah: (dailyVerse as any).startAyah || 5,
        language: lang,
        labels: {
          title: labelsConfig.title,
          streakBadge: streakText,
          todayStatus: statusText,
        },
      };

      const jsonString = JSON.stringify(payload);

      // Yerel AsyncStorage kopyası
      await AsyncStorage.setItem('@widget_synced_payload', jsonString);

      // Native @bittingz/expo-widgets modülü çağrısı
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        try {
          const { setWidgetData } = require('@bittingz/expo-widgets');
          if (typeof setWidgetData === 'function') {
            if (Platform.OS === 'android') {
              setWidgetData(jsonString, 'com.kurankerimdiyor');
            } else {
              setWidgetData(jsonString);
            }
          }
        } catch (nativeErr) {
          // Expo Go veya native modülün henüz linklenmediği ortamlarda sessizce tolere et
          console.log('WidgetSyncService: native setWidgetData skipped:', nativeErr);
        }
      }
    } catch (error) {
      console.warn('WidgetSyncService.sync failed:', error);
    }
  },
};
