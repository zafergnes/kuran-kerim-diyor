export type AppLanguage = "ar" | "en" | "tr" | "de" | "es" | "fr";

export type Ayah = {
  number: number;
  globalNumber: number;
  arabic: string;
  arabicDiyanet?: string;
  translations: Record<string, string>;
};

export type Surah = {
  number: number;
  name: {
    ar: string;
    tr: string;
    en: string;
    de?: string;
    fr?: string;
    es?: string;
  };
  englishNameTranslation: string;
  revelationType: string;
  ayahs: Ayah[];
};

export type SurahSummary = Omit<Surah, "ayahs"> & {
  ayahsCount: number;
};
