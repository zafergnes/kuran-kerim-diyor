import axios from 'axios';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ORIGIN } from './apiClient';

const BASE_URL = API_ORIGIN;

export interface DailyVerse {
  text: string;
  reference: string;
  surahNumber?: number;
  startAyah?: number;
  cachedDate?: string;
  language?: string;
}

export const localDateKey = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const DailyVerseService = {
  getCachedDailyVerse: async (language?: string): Promise<DailyVerse | null> => {
    try {
      const cachedStr = await AsyncStorage.getItem('@daily_verse');
      const cached = cachedStr ? JSON.parse(cachedStr) : null;
      return cached?.cachedDate === localDateKey() && (!language || cached.language === language) ? cached : null;
    } catch (error) {
      console.error('Error reading daily verse from cache:', error);
      return null;
    }
  },

  getDailyVerse: async (language?: string): Promise<DailyVerse> => {
    try {
      // Cihazın dilini al (tr, en, de vb.)
      const lang = language || await AsyncStorage.getItem('@app_language') || Localization.getLocales()[0]?.languageCode || 'tr';
      
      const response = await axios.get(`${BASE_URL}/api/daily-context`, {
        params: { lang },
        timeout: 5000
      });
      
      const freshVerse = { ...response.data, cachedDate: localDateKey(), language: lang };
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
