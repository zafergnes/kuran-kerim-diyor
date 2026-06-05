import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import tr from '../locales/tr.json';
import en from '../locales/en.json';
import ar from '../locales/ar.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';

export type AppLanguage = 'tr' | 'en' | 'ar' | 'de' | 'fr' | 'es';

const SUPPORTED_LANGUAGES: AppLanguage[] = ['tr', 'en', 'ar', 'de', 'fr', 'es'];

export function detectBrowserLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'tr';
  const browserLang = navigator.language.split('-')[0];
  const matched = SUPPORTED_LANGUAGES.find(lang => lang === browserLang);
  return matched ?? 'tr';
}

export function applyRTL(language: AppLanguage) {
  if (typeof document !== 'undefined') {
    const isRTL = language === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
      ar: { translation: ar },
      de: { translation: de },
      fr: { translation: fr },
      es: { translation: es },
    },
    lng: 'tr', // Will be overridden by userStore
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
