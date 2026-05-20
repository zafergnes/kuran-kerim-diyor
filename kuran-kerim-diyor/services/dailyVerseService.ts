import axios from 'axios';
import * as Localization from 'expo-localization';
import Constants from 'expo-constants';

// Backend URL'i - Geliştirme aşamasında localhost için uygun IP'yi ayarlar
const getBaseUrl = () => {
  // Eğer emulator kullanılıyorsa 10.0.2.2, değilse yerel IP
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3001`;
  }
  return 'http://localhost:3001';
};

const BASE_URL = getBaseUrl();

export interface DailyVerse {
  text: string;
  reference: string;
}

export const DailyVerseService = {
  getDailyVerse: async (): Promise<DailyVerse> => {
    try {
      // Cihazın dilini al (tr, en, de vb.)
      const lang = Localization.getLocales()[0]?.languageCode || 'tr';
      
      const response = await axios.get(`${BASE_URL}/api/daily-context`, {
        params: { lang }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching daily verse:', error);
      throw error;
    }
  }
};
