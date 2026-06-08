export interface DailyVerse {
  text: string;
  reference: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const DailyVerseService = {
  getDailyVerse: async (lang: string = 'tr'): Promise<DailyVerse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/daily-context?lang=${lang}`, {
        next: { revalidate: 3600 } // Cache for 1 hour
      });
      
      if (!response.ok) throw new Error('Failed to fetch daily verse');
      
      return response.json();
    } catch (error) {
      console.error('Error fetching daily verse:', error);
      throw error;
    }
  },
  getVerseByRef: async (surah: string | number, ayah: string | number, lang: string = 'tr'): Promise<DailyVerse & { arabic?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/daily-context/verse/${surah}/${ayah}?lang=${lang}`);
      if (!response.ok) throw new Error('Failed to fetch verse');
      return response.json();
    } catch (error) {
      console.error('Error fetching verse by ref:', error);
      throw error;
    }
  }
};
