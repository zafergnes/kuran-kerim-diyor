import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from './apiClient';

export type AnalyticsEvent =
  | 'APP_OPEN' | 'APP_BACKGROUND' | 'SCREEN_VIEW'
  | 'ONBOARDING_VIEW' | 'ONBOARDING_COMPLETE' | 'ONBOARDING_SKIP'
  | 'AUTH_LOGIN' | 'AUTH_REGISTER' | 'AUTH_LOGOUT'
  | 'READING_PROGRESS' | 'AI_CHAT_OPEN' | 'AI_CHAT_MESSAGE';

const INSTALL_ID_KEY = '@privacy_install_id';
const ENABLED_KEY = '@privacy_analytics_enabled';
const sessionId = Crypto.randomUUID();
let installIdPromise: Promise<string> | null = null;
const lastSentAt = new Map<AnalyticsEvent, number>();

const getInstallId = () => {
  if (!installIdPromise) {
    installIdPromise = (async () => {
      const existing = await AsyncStorage.getItem(INSTALL_ID_KEY);
      if (existing) return existing;
      const created = Crypto.randomUUID();
      await AsyncStorage.setItem(INSTALL_ID_KEY, created);
      return created;
    })();
  }
  return installIdPromise;
};

export const AnalyticsService = {
  async setEnabled(enabled: boolean) {
    await AsyncStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false');
  },

  async isEnabled() {
    return (await AsyncStorage.getItem(ENABLED_KEY)) === 'true';
  },

  async track(event: AnalyticsEvent, options?: {
    screen?: string;
    metadata?: Record<string, string | number | boolean | null>;
    throttleMs?: number;
  }) {
    try {
      if (!(await this.isEnabled())) return;
      const now = Date.now();
      if (options?.throttleMs && now - (lastSentAt.get(event) || 0) < options.throttleMs) return;
      lastSentAt.set(event, now);
      await apiClient.post('/analytics', {
        events: [{
          event,
          installId: await getInstallId(),
          sessionId,
          platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'unknown',
          appVersion: Constants.expoConfig?.version,
          screen: options?.screen,
          metadata: options?.metadata,
        }],
      });
    } catch {
      // Analytics must never interrupt reading or authentication.
    }
  },
};
