import axios from 'axios';
import * as Localization from 'expo-localization';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend URL'i - Geliştirme aşamasında localhost için uygun IP'yi ayarlar
const getBaseUrl = () => {
  // Eğer emulator kullanılıyorsa 10.0.2.2, değilse yerel IP
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3001`;
  }
  return 'https://api.kurannediyor.com.tr';
};

const BASE_URL = getBaseUrl();

export interface DailyVerse {
  text: string;
  reference: string;
}

export const DailyVerseService = {
  getCachedDailyVerse: async (): Promise<DailyVerse | null> => {
    try {
      const cachedStr = await AsyncStorage.getItem('@daily_verse');
      return cachedStr ? JSON.parse(cachedStr) : null;
    } catch (error) {
      console.error('Error reading daily verse from cache:', error);
      return null;
    }
  },

  getDailyVerse: async (): Promise<DailyVerse> => {
    try {
      // Cihazın dilini al (tr, en, de vb.)
      const lang = Localization.getLocales()[0]?.languageCode || 'tr';
      
      const response = await axios.get(`${BASE_URL}/api/daily-context`, {
        params: { lang },
        timeout: 5000
      });
      
      const freshVerse = response.data;
      if (freshVerse && freshVerse.text) {
        await AsyncStorage.setItem('@daily_verse', JSON.stringify(freshVerse));
      }
      return freshVerse;
    } catch (error) {
      console.error('Error fetching daily verse:', error);
      throw error;
    }
  }
};
