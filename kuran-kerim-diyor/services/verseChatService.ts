import apiClient from './apiClient';
import { AppLanguage } from '../constants/languages';

export type VerseChatMessage = { role: 'user' | 'assistant'; text: string };

export type VerseChatResponse = {
  id: string;
  answer: string;
  keyPoints: string[];
  reflectionQuestion: string;
  safetyNote: string;
  reference: string;
};

export const VerseChatService = {
  async discuss(input: {
    surahNumber: number;
    ayahNumber: number;
    language: AppLanguage;
    message: string;
    history: VerseChatMessage[];
  }): Promise<VerseChatResponse> {
    return (await apiClient.post('/verse-chat', input)).data;
  },

  async report(input: {
    responseId: string;
    surahNumber: number;
    ayahNumber: number;
    reason: 'INACCURATE' | 'UNSAFE';
    details?: string;
  }) {
    await apiClient.post('/verse-chat/feedback', input);
  },
};
