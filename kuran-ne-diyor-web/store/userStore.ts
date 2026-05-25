"use client";

import { create } from "zustand";
import apiClient from "@/services/apiClient";
import type { AppLanguage } from "@/types/quran";
import type { ApiUser, AuthResponse, Collection, Favorite } from "@/types/api";

const FAVORITES_KEY = "userFavorites";
const COLLECTIONS_KEY = "userCollections";
const PROGRESS_KEY = "@kuran_progress";
const COMPLETED_KEY = "@kuran_completed";
const LANGUAGE_KEY = "@app_language";
const ARABIC_SHOW_KEY = "@arabic_show_translation";
const ARABIC_LANG_KEY = "@arabic_translation_lang";
const RECITER_KEY = "@app_selected_reciter";

type LocalCollection = {
  id: string;
  name: string;
  ayahs: Record<string, number>;
};

type Progress = {
  surah: number;
  ayah: number;
};

type UserState = {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  user: ApiUser | null;
  language: AppLanguage;
  currentSurah: number;
  currentAyah: number;
  completedSurahs: number[];
  favorites: Record<string, Favorite | { ayahId: string; surahNumber: number; ayahNumber: number; createdAt: string }>;
  collections: Record<string, LocalCollection>;
  hideFavoriteDeleteWarning: boolean;
  showArabicTranslation: boolean;
  arabicTranslationLang: AppLanguage;
  selectedReciter: string;
  readingLayout: "single" | "page";
  arabicFontFamily: "noto-naskh" | "amiri";
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  setLanguage: (language: AppLanguage) => void;
  setProgress: (surah: number, ayah: number, ayahCount?: number) => void;
  setShowArabicTranslation: (show: boolean) => void;
  setArabicTranslationLang: (language: AppLanguage) => void;
  setHideFavoriteDeleteWarning: (hide: boolean) => void;
  setSelectedReciter: (reciter: string) => void;
  setReadingLayout: (layout: "single" | "page") => void;
  setArabicFontFamily: (font: "noto-naskh" | "amiri") => void;
  loadRemoteData: () => Promise<void>;
  toggleFavorite: (ayahId: string, surahNumber: number, ayahNumber: number) => Promise<void>;
  createCollection: (name: string, initialAyah?: { ayahId: string; surahNumber: number; ayahNumber: number }) => Promise<void>;
  deleteCollection: (collectionId: string) => Promise<void>;
  addAyahToCollection: (collectionId: string, ayahId: string, surahNumber: number, ayahNumber: number) => Promise<void>;
  removeAyahFromCollection: (collectionId: string, ayahId: string) => Promise<void>;
};

const canUseStorage = () => typeof window !== "undefined";

const readJson = <T,>(key: string, fallback: T): T => {
  if (!canUseStorage()) return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (canUseStorage()) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
};

const persistAuth = (response: AuthResponse) => {
  window.localStorage.setItem("userToken", response.accessToken);
  window.localStorage.setItem("refreshToken", response.refreshToken);
};

const favoritePayload = (ayahId: string, surahNumber: number, ayahNumber: number) => ({
  ayahId,
  surahNumber,
  ayahNumber,
});

const normalizeCollections = (collections: Collection[]): Record<string, LocalCollection> =>
  Object.fromEntries(
    collections.map((collection) => [
      String(collection.id),
      {
        id: String(collection.id),
        name: collection.name,
        ayahs: Object.fromEntries(
          (collection.items ?? []).map((item) => [item.favorite.ayahId, new Date(item.createdAt).getTime()]),
        ),
      },
    ]),
  );

export const useUserStore = create<UserState>((set, get) => ({
  initialized: false,
  loading: false,
  error: null,
  user: null,
  language: "tr",
  currentSurah: 1,
  currentAyah: 1,
  completedSurahs: [],
  favorites: {},
  collections: {},
  hideFavoriteDeleteWarning: false,
  showArabicTranslation: false,
  arabicTranslationLang: "en",
  selectedReciter: "ar.alafasy",
  readingLayout: "single",
  arabicFontFamily: "noto-naskh",

  initialize: async () => {
    if (!canUseStorage() || get().initialized) return;

    const progress = readJson<Progress>(PROGRESS_KEY, { surah: 1, ayah: 1 });
    set({
      initialized: true,
      language: (window.localStorage.getItem(LANGUAGE_KEY) as AppLanguage | null) ?? "tr",
      currentSurah: progress.surah,
      currentAyah: progress.ayah,
      completedSurahs: readJson<number[]>(COMPLETED_KEY, []),
      favorites: readJson<UserState["favorites"]>(FAVORITES_KEY, {}),
      collections: readJson<Record<string, LocalCollection>>(COLLECTIONS_KEY, {}),
      showArabicTranslation: window.localStorage.getItem(ARABIC_SHOW_KEY) === "true",
      arabicTranslationLang: (window.localStorage.getItem(ARABIC_LANG_KEY) as AppLanguage | null) ?? "en",
      selectedReciter: window.localStorage.getItem(RECITER_KEY) ?? "ar.alafasy",
      hideFavoriteDeleteWarning: window.localStorage.getItem("hideFavWarning") === "true",
      readingLayout: (window.localStorage.getItem("@app_reading_layout") as "single" | "page" | null) ?? "single",
      arabicFontFamily: (window.localStorage.getItem("@app_arabic_font") as "noto-naskh" | "amiri" | null) ?? "noto-naskh",
    });

    if (window.localStorage.getItem("userToken")) {
      await get().refreshMe();
      await get().loadRemoteData();
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<AuthResponse>("/auth/login", { email, password });
      persistAuth(response.data);
      set({ user: response.data.user, loading: false });
      await get().loadRemoteData();
    } catch (error) {
      set({ loading: false, error: "Giriş başarısız. Bilgileri kontrol edin." });
      throw error;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<AuthResponse>("/auth/register", { name, email, password });
      persistAuth(response.data);
      set({ user: response.data.user, loading: false });
      await get().loadRemoteData();
    } catch (error) {
      set({ loading: false, error: "Kayıt başarısız. E-posta kullanılıyor olabilir." });
      throw error;
    }
  },

  guestLogin: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<AuthResponse>("/auth/guest");
      persistAuth(response.data);
      set({ user: response.data.user, loading: false });
      await get().loadRemoteData();
    } catch (error) {
      set({ loading: false, error: "Misafir oturumu açılamadı." });
      throw error;
    }
  },

  logout: () => {
    if (canUseStorage()) {
      window.localStorage.removeItem("userToken");
      window.localStorage.removeItem("refreshToken");
      window.localStorage.removeItem(FAVORITES_KEY);
      window.localStorage.removeItem(COLLECTIONS_KEY);
    }
    set({ user: null, favorites: {}, collections: {} });
  },

  refreshMe: async () => {
    try {
      const response = await apiClient.get<{ user: ApiUser }>("/auth/me");
      set({ user: response.data.user });
    } catch {
      get().logout();
    }
  },

  setLanguage: (language) => {
    set({ language });
    if (canUseStorage()) window.localStorage.setItem(LANGUAGE_KEY, language);
  },

  setProgress: (surah, ayah, ayahCount) => {
    const completedSurahs =
      ayahCount && ayah === ayahCount && !get().completedSurahs.includes(surah)
        ? [...get().completedSurahs, surah]
        : get().completedSurahs;

    set({ currentSurah: surah, currentAyah: ayah, completedSurahs });
    writeJson(PROGRESS_KEY, { surah, ayah });
    writeJson(COMPLETED_KEY, completedSurahs);
  },

  setShowArabicTranslation: (show) => {
    set({ showArabicTranslation: show });
    if (canUseStorage()) window.localStorage.setItem(ARABIC_SHOW_KEY, String(show));
  },

  setArabicTranslationLang: (language) => {
    set({ arabicTranslationLang: language });
    if (canUseStorage()) window.localStorage.setItem(ARABIC_LANG_KEY, language);
  },

  setHideFavoriteDeleteWarning: (hide) => {
    set({ hideFavoriteDeleteWarning: hide });
    if (canUseStorage()) window.localStorage.setItem("hideFavWarning", String(hide));
  },

  setSelectedReciter: (reciter) => {
    set({ selectedReciter: reciter });
    if (canUseStorage()) window.localStorage.setItem(RECITER_KEY, reciter);
  },

  loadRemoteData: async () => {
    if (!canUseStorage() || !window.localStorage.getItem("userToken")) return;

    const [favoritesResponse, collectionsResponse] = await Promise.all([
      apiClient.get<Favorite[]>("/favorites").catch(() => ({ data: [] as Favorite[] })),
      apiClient.get<Collection[]>("/collections").catch(() => ({ data: [] as Collection[] })),
    ]);

    const favorites = Object.fromEntries(favoritesResponse.data.map((favorite) => [favorite.ayahId, favorite]));
    const collections = normalizeCollections(collectionsResponse.data);
    set({ favorites, collections });
    writeJson(FAVORITES_KEY, favorites);
    writeJson(COLLECTIONS_KEY, collections);
  },

  toggleFavorite: async (ayahId, surahNumber, ayahNumber) => {
    const state = get();
    const nextFavorites = { ...state.favorites };
    const wasFavorite = Boolean(nextFavorites[ayahId]);

    if (wasFavorite) {
      delete nextFavorites[ayahId];
      const nextCollections = Object.fromEntries(
        Object.entries(state.collections).map(([collectionId, collection]) => {
          const ayahs = { ...collection.ayahs };
          delete ayahs[ayahId];
          return [collectionId, { ...collection, ayahs }];
        }),
      );
      set({ favorites: nextFavorites, collections: nextCollections });
      writeJson(FAVORITES_KEY, nextFavorites);
      writeJson(COLLECTIONS_KEY, nextCollections);
    } else {
      nextFavorites[ayahId] = { ...favoritePayload(ayahId, surahNumber, ayahNumber), createdAt: new Date().toISOString() };
      set({ favorites: nextFavorites });
      writeJson(FAVORITES_KEY, nextFavorites);
    }

    try {
      if (state.user && !state.user.isGuest) {
        if (wasFavorite) {
          await apiClient.delete(`/favorites/${ayahId}`);
        } else {
          await apiClient.post("/favorites", favoritePayload(ayahId, surahNumber, ayahNumber));
        }
        await get().loadRemoteData();
      }
    } catch {
      set({ favorites: state.favorites });
      writeJson(FAVORITES_KEY, state.favorites);
    }
  },

  createCollection: async (name, initialAyah) => {
    const tempId = `col_${Date.now()}`;
    const localCollection: LocalCollection = {
      id: tempId,
      name,
      ayahs: initialAyah ? { [initialAyah.ayahId]: Date.now() } : {},
    };
    const collections = { ...get().collections, [tempId]: localCollection };
    set({ collections });
    writeJson(COLLECTIONS_KEY, collections);

    if (get().user && !get().user?.isGuest) {
      const response = await apiClient.post<Collection>("/collections", { name });
      if (initialAyah) {
        await apiClient.post(`/collections/${response.data.id}/items`, initialAyah);
      }
      await get().loadRemoteData();
    }
  },

  deleteCollection: async (collectionId) => {
    const collections = { ...get().collections };
    delete collections[collectionId];
    set({ collections });
    writeJson(COLLECTIONS_KEY, collections);

    if (get().user && !get().user?.isGuest && !collectionId.startsWith("col_")) {
      await apiClient.delete(`/collections/${collectionId}`);
      await get().loadRemoteData();
    }
  },

  addAyahToCollection: async (collectionId, ayahId, surahNumber, ayahNumber) => {
    const collection = get().collections[collectionId];
    if (!collection) return;

    const collections = {
      ...get().collections,
      [collectionId]: {
        ...collection,
        ayahs: { ...collection.ayahs, [ayahId]: Date.now() },
      },
    };
    set({ collections });
    writeJson(COLLECTIONS_KEY, collections);

    if (get().user && !get().user?.isGuest && !collectionId.startsWith("col_")) {
      await apiClient.post(`/collections/${collectionId}/items`, favoritePayload(ayahId, surahNumber, ayahNumber));
      await get().loadRemoteData();
    }
  },

  removeAyahFromCollection: async (collectionId, ayahId) => {
    const collection = get().collections[collectionId];
    if (!collection) return;

    const ayahs = { ...collection.ayahs };
    delete ayahs[ayahId];
    const collections = { ...get().collections, [collectionId]: { ...collection, ayahs } };
    set({ collections });
    writeJson(COLLECTIONS_KEY, collections);

    if (get().user && !get().user?.isGuest && !collectionId.startsWith("col_")) {
      const response = await apiClient.get<Collection[]>("/collections");
      const remoteCollection = response.data.find((item) => String(item.id) === collectionId);
      const favoriteId = remoteCollection?.items?.find((item) => item.favorite.ayahId === ayahId)?.favoriteId;
      if (favoriteId) {
        await apiClient.delete(`/collections/${collectionId}/items/${favoriteId}`);
      }
      await get().loadRemoteData();
    }
  },

  setReadingLayout: (layout) => {
    set({ readingLayout: layout });
    if (canUseStorage()) window.localStorage.setItem("@app_reading_layout", layout);
  },

  setArabicFontFamily: (font) => {
    set({ arabicFontFamily: font });
    if (canUseStorage()) window.localStorage.setItem("@app_arabic_font", font);
  },
}));
