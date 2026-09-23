import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReadingGoal = 1 | 2 | 5;

export type DailyReadingProgress = {
  date: string;
  pages: number[];
};

const GOAL_KEY = '@reading_goal_pages';
const PROGRESS_KEY = '@reading_goal_progress';

const todayKey = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export const ReadingJourneyService = {
  async getGoal(): Promise<ReadingGoal> {
    const stored = Number(await AsyncStorage.getItem(GOAL_KEY));
    return stored === 2 || stored === 5 ? stored : 1;
  },

  async setGoal(goal: ReadingGoal): Promise<void> {
    await AsyncStorage.setItem(GOAL_KEY, String(goal));
  },

  async getTodayProgress(): Promise<DailyReadingProgress> {
    const today = todayKey();
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    if (!raw) return { date: today, pages: [] };

    try {
      const parsed = JSON.parse(raw) as DailyReadingProgress;
      if (parsed.date !== today || !Array.isArray(parsed.pages)) {
        return { date: today, pages: [] };
      }
      return parsed;
    } catch {
      return { date: today, pages: [] };
    }
  },

  async recordPage(page: number): Promise<DailyReadingProgress> {
    const progress = await this.getTodayProgress();
    if (!progress.pages.includes(page)) {
      progress.pages.push(page);
      progress.pages.sort((a, b) => a - b);
      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    }
    return progress;
  },
};
