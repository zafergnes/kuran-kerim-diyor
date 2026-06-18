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
  selectedArabicScript: "uthmani" | "diyanet";
  isInitialProgressLoad: boolean;
  seenAchievements: string[];
  hatimCount: number;
  readCounts: Record<string, number>;
  activeCelebration: string | null;
  setActiveCelebration: (badge: string | null) => void;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthResponse | undefined>;
  register: (name: string, email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  setLanguage: (language: AppLanguage) => void;
  setProgress: (surah: number, ayah: number, ayahCount?: number) => Promise<void>;
  setShowArabicTranslation: (show: boolean) => void;
  setArabicTranslationLang: (language: AppLanguage) => void;
  setHideFavoriteDeleteWarning: (hide: boolean) => void;
  setSelectedReciter: (reciter: string) => void;
  setReadingLayout: (layout: "single" | "page") => void;
  setArabicFontFamily: (font: "noto-naskh" | "amiri") => void;
  setSelectedArabicScript: (script: "uthmani" | "diyanet") => void;
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

const calculateUnlockedAchievements = (state: {
  currentSurah: number;
  currentAyah: number;
  completedSurahs: number[];
  readCounts: Record<string, number>;
  hatimCount: number;
}) => {
  const unlocked: string[] = [];

  // 1. First Step: If we read anything beyond the very first ayah (or completed a surah)
  if (state.currentSurah > 1 || state.currentAyah > 1 || state.completedSurahs.length > 0 || state.hatimCount > 0) {
    unlocked.push("first_step");
  }

  // 2. First Surah: At least 1 surah completed
  if (state.completedSurahs.length >= 1 || state.hatimCount > 0) {
    unlocked.push("first_surah");
  }

  // 3. Regular (Azimli Okuyucu): At least 30 surahs completed
  if (state.completedSurahs.length >= 30 || state.hatimCount > 0) {
    unlocked.push("regular");
  }

  // 4. Faithful Reader (Sadık Okuyucu): Any ayah read 10+ times
  const hasFaithful = Object.values(state.readCounts).some((count) => count >= 10);
  if (hasFaithful) {
    unlocked.push("faithful_reader");
  }

  // 5. Hatim: Quran finished 1+ times
  if (state.hatimCount >= 1) {
    unlocked.push("hatim");
  }

  // 6. Double Hatim: Quran finished 2+ times
  if (state.hatimCount >= 2) {
    unlocked.push("double_hatim");
  }

  // 7. Hatim Guardian: Quran finished 5+ times
  if (state.hatimCount >= 5) {
    unlocked.push("hatim_guardian");
  }

  return unlocked;
};

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
  selectedArabicScript: "diyanet",
  isInitialProgressLoad: true,
  seenAchievements: [],
  hatimCount: 0,
  readCounts: {},
  activeCelebration: null,
  setActiveCelebration: (badge) => set({ activeCelebration: badge }),

  initialize: async () => {
    if (!canUseStorage() || get().initialized) return;

    const progress = readJson<Progress>(PROGRESS_KEY, { surah: 1, ayah: 1 });
    const cachedUser = readJson<ApiUser | null>("@user_profile", null);
    const seenAchievements = readJson<string[]>("@seen_achievements", []);
    const hatimCount = readJson<number>("@hatim_count", 0);
    const readCounts = readJson<Record<string, number>>("@read_counts", {});

    set({
      initialized: true,
      user: cachedUser,
      language: (window.localStorage.getItem(LANGUAGE_KEY) as AppLanguage | null) ?? "tr",
      currentSurah: progress.surah,
      currentAyah: progress.ayah,
      completedSurahs: readJson<number[]>(COMPLETED_KEY, []),
      seenAchievements,
      hatimCount,
      readCounts,
      favorites: readJson<UserState["favorites"]>(FAVORITES_KEY, {}),
      collections: readJson<Record<string, LocalCollection>>(COLLECTIONS_KEY, {}),
      showArabicTranslation: window.localStorage.getItem(ARABIC_SHOW_KEY) === "true",
      arabicTranslationLang: (window.localStorage.getItem(ARABIC_LANG_KEY) as AppLanguage | null) ?? "en",
      selectedReciter: window.localStorage.getItem(RECITER_KEY) ?? "ar.alafasy",
      hideFavoriteDeleteWarning: window.localStorage.getItem("hideFavWarning") === "true",
      readingLayout: (window.localStorage.getItem("@app_reading_layout") as "single" | "page" | null) ?? "single",
      arabicFontFamily: (window.localStorage.getItem("@app_arabic_font") as "noto-naskh" | "amiri" | null) ?? "noto-naskh",
      selectedArabicScript: (window.localStorage.getItem("@app_arabic_script") as "uthmani" | "diyanet" | null) ?? 
        (((window.localStorage.getItem(LANGUAGE_KEY) as AppLanguage | null) ?? "tr") === "tr" ? "diyanet" : "uthmani"),
      isInitialProgressLoad: true,
    });

    if (window.localStorage.getItem("userToken")) {
      await get().refreshMe();
      await get().loadRemoteData();
    }

    set({ isInitialProgressLoad: false });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<AuthResponse>("/auth/login", { email, password });
      persistAuth(response.data);
      writeJson("@user_profile", response.data.user);
      set({ user: response.data.user, loading: false });
      await get().loadRemoteData();
      return response.data;
    } catch (error) {
      set({ loading: false, error: "auth_errors.invalid_credential" });
      throw error;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<AuthResponse>("/auth/register", { name, email, password });
      persistAuth(response.data);
      writeJson("@user_profile", response.data.user);
      set({ user: response.data.user, loading: false });
      await get().loadRemoteData();
    } catch (error) {
      set({ loading: false, error: "auth_errors.email_in_use" });
      throw error;
    }
  },

  guestLogin: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<AuthResponse>("/auth/guest");
      persistAuth(response.data);
      writeJson("@user_profile", response.data.user);
      set({ user: response.data.user, loading: false });
      await get().loadRemoteData();
    } catch (error) {
      set({ loading: false, error: "auth_errors.generic" });
      throw error;
    }
  },

  logout: () => {
    if (canUseStorage()) {
      window.localStorage.removeItem("userToken");
      window.localStorage.removeItem("refreshToken");
      window.localStorage.removeItem(FAVORITES_KEY);
      window.localStorage.removeItem(COLLECTIONS_KEY);
      window.localStorage.removeItem("@user_profile");
    }
    set({ user: null, favorites: {}, collections: {} });
  },

  refreshMe: async () => {
    try {
      const response = await apiClient.get<{ user: ApiUser }>("/auth/me");
      writeJson("@user_profile", response.data.user);
      set({ user: response.data.user });
    } catch (error: any) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        get().logout();
      }
    }
  },

  setLanguage: (language) => {
    set({ language });
    if (canUseStorage()) window.localStorage.setItem(LANGUAGE_KEY, language);
  },

  setProgress: async (surah, ayah, ayahCount) => {
    const state = get();
    
    // Guard 1: If it's the initial progress load, we DO NOT increment counts, just update position.
    // Guard 2: If we are calling setProgress with the same position as before, we DO NOT increment read counts.
    const isSamePosition = state.currentSurah === surah && state.currentAyah === ayah;
    const shouldIncrement = !state.isInitialProgressLoad && !isSamePosition;

    const nextReadCounts = { ...state.readCounts };
    if (shouldIncrement) {
      const key = `${surah}:${ayah}`;
      nextReadCounts[key] = (nextReadCounts[key] || 0) + 1;
    }

    // Determine completion of Surah
    let nextCompletedSurahs = [...state.completedSurahs];
    let nextHatimCount = state.hatimCount;

    if (ayahCount && ayah === ayahCount && !nextCompletedSurahs.includes(surah)) {
      nextCompletedSurahs.push(surah);
      
      // If we finished all 114 surahs, increment hatim count and reset completedSurahs!
      if (nextCompletedSurahs.length === 114) {
        nextHatimCount += 1;
        nextCompletedSurahs = [];
      }
    }

    // Now calculate unlocked achievements
    const unlocked = calculateUnlockedAchievements({
      currentSurah: surah,
      currentAyah: ayah,
      completedSurahs: nextCompletedSurahs,
      readCounts: nextReadCounts,
      hatimCount: nextHatimCount,
    });

    // Find new achievements that aren't marked seen yet
    const newCelebration = unlocked.find(badge => !state.seenAchievements.includes(badge)) || null;
    const nextSeenAchievements = [...state.seenAchievements];
    
    if (newCelebration) {
      nextSeenAchievements.push(newCelebration);
    }

    set({
      currentSurah: surah,
      currentAyah: ayah,
      completedSurahs: nextCompletedSurahs,
      hatimCount: nextHatimCount,
      readCounts: nextReadCounts,
      seenAchievements: nextSeenAchievements,
      activeCelebration: newCelebration ? newCelebration : state.activeCelebration,
    });

    writeJson(PROGRESS_KEY, { surah, ayah });
    writeJson(COMPLETED_KEY, nextCompletedSurahs);
    writeJson("@seen_achievements", nextSeenAchievements);
    writeJson("@hatim_count", nextHatimCount);
    writeJson("@read_counts", nextReadCounts);

    // Sync to remote if logged in
    if (state.user && !state.user.isGuest) {
      try {
        await apiClient.post("/users/progress", {
          currentSurah: surah,
          currentAyah: ayah,
          completedSurahs: nextCompletedSurahs,
          seenAchievements: nextSeenAchievements,
          hatimCount: nextHatimCount,
          readCounts: nextReadCounts,
        });
      } catch (err) {
        console.error("Failed to sync progress to remote:", err);
      }
    }
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

    const [favoritesResponse, collectionsResponse, progressResponse] = await Promise.all([
      apiClient.get<Favorite[]>("/favorites").catch(() => ({ data: [] as Favorite[] })),
      apiClient.get<Collection[]>("/collections").catch(() => ({ data: [] as Collection[] })),
      apiClient.get<{
        currentSurah: number;
        currentAyah: number;
        completedSurahs: number[];
        seenAchievements: string[];
        hatimCount: number;
        readCounts: Record<string, number>;
      }>("/users/progress").catch(() => null),
    ]);

    const favorites = Object.fromEntries(favoritesResponse.data.map((favorite) => [favorite.ayahId, favorite]));
    const collections = normalizeCollections(collectionsResponse.data);
    set({ favorites, collections });
    writeJson(FAVORITES_KEY, favorites);
    writeJson(COLLECTIONS_KEY, collections);

    if (progressResponse && progressResponse.data) {
      const { currentSurah, currentAyah, completedSurahs, seenAchievements, hatimCount, readCounts } = progressResponse.data;
      set({
        currentSurah: currentSurah ?? 1,
        currentAyah: currentAyah ?? 1,
        completedSurahs: completedSurahs ?? [],
        seenAchievements: seenAchievements ?? [],
        hatimCount: hatimCount ?? 0,
        readCounts: readCounts ?? {},
      });
      writeJson(PROGRESS_KEY, { surah: currentSurah ?? 1, ayah: currentAyah ?? 1 });
      writeJson(COMPLETED_KEY, completedSurahs ?? []);
      writeJson("@seen_achievements", seenAchievements ?? []);
      writeJson("@hatim_count", hatimCount ?? 0);
      writeJson("@read_counts", readCounts ?? {});
    }
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

  setSelectedArabicScript: (script) => {
    set({ selectedArabicScript: script });
    if (canUseStorage()) window.localStorage.setItem("@app_arabic_script", script);
  },
}));
