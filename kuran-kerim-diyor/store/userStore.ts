import { create } from 'zustand';
import { AppLanguage } from '../constants/languages';
import type { ThemePreference } from '../hooks/useAppTheme';

export interface Collection {
    id: string;
    name: string;
    ayahs: Record<string, number>;
}

interface UserState {
    language: AppLanguage;
    themePreference: ThemePreference;
    currentSurah: number;
    currentAyah: number;
    completedSurahs: number[];
    favorites: Record<string, number>;
    collections: Record<string, Collection>;
    hideFavoriteDeleteWarning: boolean;
    // Arapca kullanicilar icin ceviri ayarlari
    showArabicTranslation: boolean;
    arabicTranslationLang: AppLanguage;

    // Okuyucu ayari
    selectedReciter: string;

    // Okuma düzeni ve font ayarları
    readingLayout: 'single' | 'page';
    arabicFontFamily: 'noto-naskh' | 'amiri';
    selectedArabicScript: 'uthmani' | 'diyanet';
    fontSizeScale: number;

    // Auth state
    userId: string | null;
    isAnonymous: boolean;
    displayName: string | null;
    email: string | null;

    isInitialProgressLoad: boolean;
    seenAchievements: string[];
    hatimCount: number;
    readCounts: Record<string, number>;
    activeCelebration: string | null;
    setActiveCelebration: (badge: string | null) => void;

    setLanguage: (lang: AppLanguage) => void;
    setThemePreference: (theme: ThemePreference) => void;
    setProgress: (surah: number, ayah: number, ayahCount?: number) => Promise<void>;
    addCompletedSurah: (surah: number) => void;
    setCompletedSurahs: (surahs: number[]) => void;
    setAuth: (userId: string | null, isAnonymous: boolean, displayName: string | null, email: string | null) => void;
    
    toggleFavorite: (id: string) => void; // Used for general
    setFavorites: (favs: Record<string, number>) => void;
    loadFavorites: () => Promise<void>;

    // Collection specific actions
    setHideFavoriteDeleteWarning: (hide: boolean) => void;
    setShowArabicTranslation: (show: boolean) => void;
    setArabicTranslationLang: (lang: AppLanguage) => void;
    setSelectedReciter: (reciter: string) => void;
    setReadingLayout: (layout: 'single' | 'page') => void;
    setArabicFontFamily: (font: 'noto-naskh' | 'amiri') => void;
    setSelectedArabicScript: (script: 'uthmani' | 'diyanet') => void;
    setFontSizeScale: (scale: number) => void;
    addCollection: (name: string, initialAyahId?: string) => void;
    deleteCollection: (colId: string) => void;
    addAyahToCollection: (ayahId: string, colId: string) => void;
    removeAyahFromCollection: (ayahId: string, colId: string) => void;
    removeFromAllCollections: (ayahId: string) => void; // Called when removed from general favs
    setCollections: (cols: Record<string, Collection>) => void;
    syncAllLocalData: () => Promise<void>;

    // Streak (Günlük Seri)
    streakCount: number;
    lastActiveDate: string | null;
    longestStreak: number;
    streakHistory: Record<string, boolean>;
    todayCompleted: boolean;
    recordDailyActivity: () => Promise<{ streakCount: number; isNewDay: boolean }>;
}

const getTodayDateStr = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getDiffDays = (dateStr1: string, dateStr2: string): number => {
    const d1 = new Date(dateStr1 + 'T00:00:00');
    const d2 = new Date(dateStr2 + 'T00:00:00');
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

const saveLocal = (key: string, data: any) => {
    import('@react-native-async-storage/async-storage').then(AsyncStorage => {
        AsyncStorage.default.setItem(key, JSON.stringify(data));
    });
};

const calculateUnlockedAchievements = (state: {
    currentSurah: number;
    currentAyah: number;
    completedSurahs: number[];
    readCounts: Record<string, number>;
    hatimCount: number;
}) => {
    const unlocked: string[] = [];
    if (state.currentSurah > 1 || state.currentAyah > 1 || state.completedSurahs.length > 0 || state.hatimCount > 0) {
        unlocked.push("first_step");
    }
    if (state.completedSurahs.length >= 1 || state.hatimCount > 0) {
        unlocked.push("first_surah");
    }
    if (state.completedSurahs.length >= 30 || state.hatimCount > 0) {
        unlocked.push("regular");
    }
    const hasFaithful = Object.values(state.readCounts).some((count) => count >= 10);
    if (hasFaithful) {
        unlocked.push("faithful_reader");
    }
    if (state.hatimCount >= 1) {
        unlocked.push("hatim");
    }
    if (state.hatimCount >= 2) {
        unlocked.push("double_hatim");
    }
    if (state.hatimCount >= 5) {
        unlocked.push("hatim_guardian");
    }
    return unlocked;
};

export const useUserStore = create<UserState>((set, get) => ({
    language: 'tr', // Default
    themePreference: 'sepia',
    currentSurah: 1,
    currentAyah: 1,
    completedSurahs: [],
    favorites: {},
    collections: {},
    hideFavoriteDeleteWarning: false,
    showArabicTranslation: false,
    arabicTranslationLang: 'en',
    selectedReciter: 'ar.alafasy',
    readingLayout: 'page',
    arabicFontFamily: 'noto-naskh',
    selectedArabicScript: 'diyanet',
    fontSizeScale: 1.4,

    isInitialProgressLoad: true,
    seenAchievements: [],
    hatimCount: 0,
    readCounts: {},
    activeCelebration: null,
    setActiveCelebration: (badge) => set({ activeCelebration: badge }),

    // Streak initial state
    streakCount: 0,
    lastActiveDate: null,
    longestStreak: 0,
    streakHistory: {},
    todayCompleted: false,

    userId: null,
    isAnonymous: false,
    displayName: null,
    email: null,

    setLanguage: (lang) => {
        set({ language: lang });
        import('../services/widgetSyncService').then(({ WidgetSyncService }) => {
            const state = get();
            void WidgetSyncService.sync({
                streak: state.streakCount,
                todayCompleted: state.lastActiveDate === getTodayDateStr(),
                longestStreak: state.longestStreak,
                language: lang,
            });
        });
        // i18n ve AsyncStorage'i de senkronize et
        import('../services/i18n').then(({ default: i18n, applyRTL }) => {
            i18n.changeLanguage(lang);
            applyRTL(lang);
        });
        import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
            AsyncStorage.setItem('@app_language', lang);
        });
        // İzin zaten verilmişse sunucudaki bildirim dilini güncelle; izin isteme.
        import('../services/notificationService').then(({ NotificationService }) => {
            NotificationService.refreshRegistrationIfGranted().catch(() => {});
        });
    },
    setThemePreference: (themePreference) => {
        set({ themePreference });
        import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
            AsyncStorage.setItem('@app_theme', themePreference);
        });
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
            import('../services/analyticsService').then(({ AnalyticsService }) => {
                void AnalyticsService.track('READING_PROGRESS', {
                    screen: 'quran_reader',
                    metadata: { surah, ayah, uniqueAyahs: Object.keys(nextReadCounts).length },
                    throttleMs: 30000,
                });
            });
            void get().recordDailyActivity();
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

        saveLocal('@kuran_progress', { surah, ayah });
        saveLocal('@kuran_completed', nextCompletedSurahs);
        saveLocal('@seen_achievements', nextSeenAchievements);
        saveLocal('@hatim_count', nextHatimCount);
        saveLocal('@read_counts', nextReadCounts);

        // Sync to remote if logged in
        if (state.userId && !state.isAnonymous) {
            try {
                const { default: apiClient } = await import('../services/apiClient');
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
    addCompletedSurah: (surah) => set((state) => {
        const list = state.completedSurahs || [];
        if (!list.includes(surah)) {
            return { completedSurahs: [...list, surah] };
        }
        return state;
    }),
    setCompletedSurahs: (surahs) => set({ completedSurahs: surahs }),
    setAuth: (userId, isAnonymous, displayName, email) => {
        set({ userId, isAnonymous, displayName, email });
        import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
            if (userId) {
                AsyncStorage.setItem('@user_profile', JSON.stringify({ userId, isAnonymous, displayName, email }));
            } else {
                AsyncStorage.removeItem('@user_profile');
            }
        }).catch(err => console.error("Failed to save auth to AsyncStorage:", err));
    },
    
    toggleFavorite: (id: string) => {
        set((state) => {
            const newFavs = { ...state.favorites };
            let removing = false;
            
            if (newFavs[id]) {
                delete newFavs[id];
                removing = true;
            } else {
                newFavs[id] = Date.now();
            }
            
            saveLocal('userFavorites', newFavs);
            
            // API CALL ONLY IF LOGGED IN
            if (state.userId) {
                import('../services/apiClient').then(apiClient => {
                    if (removing) {
                        apiClient.default.delete(`/favorites/${id}`).catch(() => {});
                    } else {
                        const [surah, ayah] = id.includes('_') ? id.split('_') : id.split(':');
                        apiClient.default.post('/favorites', {
                            ayahId: id,
                            surahNumber: parseInt(surah),
                            ayahNumber: parseInt(ayah)
                        }).catch(() => {});
                    }
                });
            }

            // If removing from global, also remove from all collections immediately
            if (removing) {
                const newCols = { ...state.collections };
                let  changedCols = false;
                Object.keys(newCols).forEach(colId => {
                    if (newCols[colId].ayahs[id]) {
                        delete newCols[colId].ayahs[id];
                        changedCols = true;
                    }
                });
                
                if (changedCols) {
                    saveLocal('userCollections', newCols);
                    return { favorites: newFavs, collections: newCols };
                }
            }

            return { favorites: newFavs };
        });
    },

    setFavorites: (favs) => set({ favorites: favs }),
    
    loadFavorites: async () => {
        try {
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            
            const storedFavs = await AsyncStorage.getItem('userFavorites');
            if (storedFavs) set({ favorites: JSON.parse(storedFavs) });

            const storedTheme = await AsyncStorage.getItem('@app_theme');
            if (storedTheme === 'system' || storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'sepia') {
                set({ themePreference: storedTheme });
            }
            
            const storedCols = await AsyncStorage.getItem('userCollections');
            if (storedCols) set({ collections: JSON.parse(storedCols) });

            // Load achievements and progress fields
            const storedProg = await AsyncStorage.getItem('@kuran_progress');
            if (storedProg) {
                const { surah, ayah } = JSON.parse(storedProg);
                set({ currentSurah: surah, currentAyah: ayah });
            }
            const storedComp = await AsyncStorage.getItem('@kuran_completed');
            if (storedComp) {
                set({ completedSurahs: JSON.parse(storedComp) || [] });
            }
            const storedSeen = await AsyncStorage.getItem('@seen_achievements');
            if (storedSeen) {
                set({ seenAchievements: JSON.parse(storedSeen) || [] });
            }
            const storedHatim = await AsyncStorage.getItem('@hatim_count');
            if (storedHatim) {
                set({ hatimCount: parseInt(storedHatim) || 0 });
            }
            const storedCounts = await AsyncStorage.getItem('@read_counts');
            if (storedCounts) {
                set({ readCounts: JSON.parse(storedCounts) || {} });
            }

            const storedProfile = await AsyncStorage.getItem('@user_profile');
            if (storedProfile) {
                try {
                    const parsed = JSON.parse(storedProfile);
                    set({ 
                        userId: parsed.userId, 
                        isAnonymous: parsed.isAnonymous, 
                        displayName: parsed.displayName, 
                        email: parsed.email 
                    });

                    // Sync remote progress if logged in
                    if (parsed.userId && !parsed.isAnonymous) {
                        const { default: apiClient } = await import('../services/apiClient');
                        const progressResponse = await apiClient.get('/users/progress').catch(() => null);
                        if (progressResponse && progressResponse.data) {
                            const data = progressResponse.data;
                            set({
                                currentSurah: data.currentSurah ?? 1,
                                currentAyah: data.currentAyah ?? 1,
                                completedSurahs: data.completedSurahs ?? [],
                                seenAchievements: data.seenAchievements ?? [],
                                hatimCount: data.hatimCount ?? 0,
                                readCounts: data.readCounts ?? {}
                            });
                            saveLocal('@kuran_progress', { surah: data.currentSurah, ayah: data.currentAyah });
                            saveLocal('@kuran_completed', data.completedSurahs);
                            saveLocal('@seen_achievements', data.seenAchievements);
                            saveLocal('@hatim_count', data.hatimCount);
                            saveLocal('@read_counts', data.readCounts);
                        }
                    }
                } catch (pe) {
                    console.error('Failed to parse user profile or sync progress', pe);
                }
            }

            const storedWarn = await AsyncStorage.getItem('hideFavWarning');
            if (storedWarn) set({ hideFavoriteDeleteWarning: storedWarn === 'true' });

            const storedArabicTranslation = await AsyncStorage.getItem('@arabic_show_translation');
            if (storedArabicTranslation !== null) set({ showArabicTranslation: storedArabicTranslation === 'true' });

            const storedArabicLang = await AsyncStorage.getItem('@arabic_translation_lang');
            if (storedArabicLang) set({ arabicTranslationLang: storedArabicLang as AppLanguage });

            const storedReciter = await AsyncStorage.getItem('@app_selected_reciter');
            if (storedReciter) set({ selectedReciter: storedReciter });

            const storedLayout = await AsyncStorage.getItem('@app_reading_layout');
            if (storedLayout) {
                set({ readingLayout: storedLayout as 'single' | 'page' });
            } else {
                set({ readingLayout: 'page' });
            }

            const storedFont = await AsyncStorage.getItem('@app_arabic_font');
            if (storedFont) set({ arabicFontFamily: storedFont as 'noto-naskh' | 'amiri' });

            const storedScript = await AsyncStorage.getItem('@app_arabic_script');
            if (storedScript) {
                set({ selectedArabicScript: storedScript as 'uthmani' | 'diyanet' });
            } else {
                const currentLang = await AsyncStorage.getItem('@app_language') || 'tr';
                set({ selectedArabicScript: currentLang === 'tr' ? 'diyanet' : 'uthmani' });
            }

            const storedScale = await AsyncStorage.getItem('@app_font_size_scale');
            if (storedScale) {
                const parsed = parseFloat(storedScale);
                if (!isNaN(parsed) && parsed >= 0.75 && parsed <= 1.7) {
                    set({ fontSizeScale: parsed });
                }
            }

            // Streak yükleme
            const storedStreak = await AsyncStorage.getItem('@app_streak_count');
            const storedLastActive = await AsyncStorage.getItem('@app_last_active_date');
            const storedLongest = await AsyncStorage.getItem('@app_longest_streak');
            const storedHistory = await AsyncStorage.getItem('@app_streak_history');

            const todayStr = getTodayDateStr();
            let initialStreak = storedStreak ? parseInt(storedStreak, 10) : 0;
            const initialLastActive = storedLastActive || null;
            let initialLongest = storedLongest ? parseInt(storedLongest, 10) : initialStreak;
            const initialHistory = storedHistory ? JSON.parse(storedHistory) : {};

            let isTodayCompleted = false;
            if (initialLastActive) {
                if (initialLastActive === todayStr) {
                    isTodayCompleted = true;
                } else {
                    const diff = getDiffDays(initialLastActive, todayStr);
                    if (diff > 1) {
                        initialStreak = 0;
                    }
                }
            }

            set({
                streakCount: initialStreak,
                lastActiveDate: initialLastActive,
                longestStreak: initialLongest,
                streakHistory: initialHistory,
                todayCompleted: isTodayCompleted,
                isInitialProgressLoad: false,
            });

            import('../services/widgetSyncService').then(({ WidgetSyncService }) => {
                WidgetSyncService.sync({
                    streak: initialStreak,
                    todayCompleted: isTodayCompleted,
                    longestStreak: initialLongest,
                });
            });
        } catch (e) {
            console.error('Failed to load favorites/collections', e);
            set({ isInitialProgressLoad: false });
        }
    },

    setHideFavoriteDeleteWarning: (hide: boolean) => {
        set({ hideFavoriteDeleteWarning: hide });
        saveLocal('hideFavWarning', hide);
    },

    setShowArabicTranslation: (show: boolean) => {
        set({ showArabicTranslation: show });
        import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
            AsyncStorage.setItem('@arabic_show_translation', show ? 'true' : 'false');
        });
    },

    setArabicTranslationLang: (lang: AppLanguage) => {
        set({ arabicTranslationLang: lang });
        import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
            AsyncStorage.setItem('@arabic_translation_lang', lang);
        });
    },

    setSelectedReciter: (reciter: string) => {
        set({ selectedReciter: reciter });
        import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
            AsyncStorage.setItem('@app_selected_reciter', reciter);
        });
    },

    setReadingLayout: (layout: 'single' | 'page') => {
        set({ readingLayout: layout });
        import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
            AsyncStorage.setItem('@app_reading_layout', layout);
        });
    },

    setArabicFontFamily: (font: 'noto-naskh' | 'amiri') => {
        set({ arabicFontFamily: font });
        import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
            AsyncStorage.setItem('@app_arabic_font', font);
        });
    },

    setSelectedArabicScript: (script: 'uthmani' | 'diyanet') => {
        set({ selectedArabicScript: script });
        import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
            AsyncStorage.setItem('@app_arabic_script', script);
        });
    },

    setFontSizeScale: (scale: number) => {
        const clamped = Math.min(2.0, Math.max(0.8, Math.round(scale * 100) / 100));
        set({ fontSizeScale: clamped });
        import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
            AsyncStorage.setItem('@app_font_size_scale', String(clamped));
        });
    },

    recordDailyActivity: async () => {
        const state = get();
        const todayStr = getTodayDateStr();

        if (state.lastActiveDate === todayStr) {
            return { streakCount: state.streakCount, isNewDay: false };
        }

        let newStreak = 1;
        let newLongest = state.longestStreak || 0;

        if (state.lastActiveDate) {
            const diff = getDiffDays(state.lastActiveDate, todayStr);
            if (diff === 1) {
                newStreak = (state.streakCount || 0) + 1;
            } else if (diff === 0) {
                newStreak = state.streakCount || 1;
            } else {
                newStreak = 1;
            }
        }

        newLongest = Math.max(newLongest, newStreak);
        const updatedHistory = { ...state.streakHistory, [todayStr]: true };

        set({
            streakCount: newStreak,
            lastActiveDate: todayStr,
            longestStreak: newLongest,
            streakHistory: updatedHistory,
            todayCompleted: true,
        });

        import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
            AsyncStorage.setItem('@app_streak_count', String(newStreak));
            AsyncStorage.setItem('@app_last_active_date', todayStr);
            AsyncStorage.setItem('@app_longest_streak', String(newLongest));
            AsyncStorage.setItem('@app_streak_history', JSON.stringify(updatedHistory));
        });

        import('../services/widgetSyncService').then(({ WidgetSyncService }) => {
            WidgetSyncService.sync({
                streak: newStreak,
                todayCompleted: true,
                longestStreak: newLongest,
                language: state.language,
            });
        });

        return { streakCount: newStreak, isNewDay: true };
    },

    addCollection: (name: string, initialAyahId?: string) => {
        set((state) => {
            const id = 'col_' + Date.now().toString(); // Temporary local ID
            
            // Initial ayahs if provided
            const initialAyahs: Record<string, number> = {};
            if (initialAyahId) {
                initialAyahs[initialAyahId] = Date.now();
            }

            const newCols = { ...state.collections, [id]: { id, name, ayahs: initialAyahs } };
            
            // If we added an ayah, we might need to update favorites too (mirroring addAyahToCollection logic)
            let newFavs = { ...state.favorites };
            let favsChanged = false;
            
            if (initialAyahId && !newFavs[initialAyahId]) {
                newFavs[initialAyahId] = Date.now();
                favsChanged = true;
                saveLocal('userFavorites', newFavs);
            }

            saveLocal('userCollections', newCols);
            
            // API CALL ONLY IF LOGGED IN
            if (state.userId) {
                import('../services/apiClient').then(apiClient => {
                    apiClient.default.post('/collections', { name }).then(res => {
                        const realId = res.data.id.toString();
                        set(innerState => {
                            const cols = { ...innerState.collections };
                            if (cols[id]) {
                                // Replace temp ID with real ID
                                cols[realId] = { ...cols[id], id: realId };
                                delete cols[id];
                                saveLocal('userCollections', cols);
                            }
                            return { collections: cols };
                        });

                        // If initialAyahId was provided, we also need to add it to the backend collection
                        if (initialAyahId) {
                            const [surah, ayah] = initialAyahId.includes('_') ? initialAyahId.split('_') : initialAyahId.split(':');
                            // We might need a combined endpoint or chain these. 
                            apiClient.default.post(`/collections/${realId}/items`, {
                                ayahId: initialAyahId,
                                surahNumber: parseInt(surah),
                                ayahNumber: parseInt(ayah)
                            }).catch(err => console.error("Error adding initial ayah to backend collection:", err));
                            
                            // Also ensure it's in global favorites on backend
                            if (favsChanged) {
                                apiClient.default.post('/favorites', {
                                    ayahId: initialAyahId,
                                    surahNumber: parseInt(surah),
                                    ayahNumber: parseInt(ayah)
                                }).catch(() => {});
                            }
                        }
                    }).catch(() => {});
                });
            }
            
            if (favsChanged) {
                return { collections: newCols, favorites: newFavs };
            }
            return { collections: newCols };
        });
    },

    deleteCollection: (colId: string) => {
        set((state) => {
            const newCols = { ...state.collections };
            delete newCols[colId];
            saveLocal('userCollections', newCols);
            
            // API CALL ONLY IF LOGGED IN
            if (state.userId) {
                import('../services/apiClient').then(apiClient => {
                    apiClient.default.delete(`/collections/${colId}`).catch(() => {});
                });
            }

            return { collections: newCols };
        });
    },

    addAyahToCollection: (ayahId: string, colId: string) => {
        set((state) => {
            const col = state.collections[colId];
            if (!col) return state;

            const newCols = {
                ...state.collections,
                [colId]: { ...col, ayahs: { ...col.ayahs, [ayahId]: Date.now() } }
            };

            // Also ensure it is in global favorites
            const newFavs = { ...state.favorites };
            let favsChanged = false;
            if (!newFavs[ayahId]) {
                newFavs[ayahId] = Date.now();
                favsChanged = true;
                saveLocal('userFavorites', newFavs);
                
                // Add to global favorites API ONLY IF LOGGED IN
                if (state.userId) {
                    import('../services/apiClient').then(apiClient => {
                        const [surah, ayah] = ayahId.split('_');
                        apiClient.default.post('/favorites', {
                            ayahId, surahNumber: parseInt(surah), ayahNumber: parseInt(ayah)
                        }).catch(() => {});
                    });
                }
            }

            saveLocal('userCollections', newCols);
            
            // API CALL ONLY IF LOGGED IN
            if (state.userId) {
                import('../services/apiClient').then(apiClient => {
                    // Requires favoriteId. Will be implemented fully when data structures are fully mapped.
                });
            }

            if (favsChanged) {
                return { collections: newCols, favorites: newFavs };
            }
            return { collections: newCols };
        });
    },

    removeAyahFromCollection: (ayahId: string, colId: string) => {
        set((state) => {
            const col = state.collections[colId];
            if (!col || !col.ayahs[ayahId]) return state;

            const newColAyahs = { ...col.ayahs };
            delete newColAyahs[ayahId];

            const newCols = {
                ...state.collections,
                [colId]: { ...col, ayahs: newColAyahs }
            };

            saveLocal('userCollections', newCols);
            
            // API CALL ONLY IF LOGGED IN
            if (state.userId) {
                import('../services/apiClient').then(apiClient => {
                    // Again, requires favoriteId. Will be implemented fully when data structures are fully mapped.
                });
            }
            
            return { collections: newCols };
        });
    },

    removeFromAllCollections: (ayahId: string) => {
        set((state) => {
            const newCols = { ...state.collections };
            let changed = false;
            Object.keys(newCols).forEach(colId => {
                if (newCols[colId].ayahs[ayahId]) {
                    delete newCols[colId].ayahs[ayahId];
                    changed = true;
                }
            });

            // Remove from global favorites
            const newFavs = { ...state.favorites };
            let favsChanged = false;
            if (newFavs[ayahId]) {
                delete newFavs[ayahId];
                favsChanged = true;
                saveLocal('userFavorites', newFavs);
            }

            if (changed) {
                saveLocal('userCollections', newCols);
                return { collections: newCols, favorites: newFavs };
            }
            if (favsChanged) {
                return { favorites: newFavs };
            }
            return state;
        });
    },

    setCollections: (cols) => set({ collections: cols }),

    syncAllLocalData: async () => {
        const state = get();
        if (!state.userId || state.isAnonymous) return;

        try {
            const { default: apiClient } = await import('../services/apiClient');
            
            // 1. Sync Favorites
            const favIds = Object.keys(state.favorites);
            if (favIds.length > 0) {
                const favPayload = favIds.map(id => {
                    const [surah, ayah] = id.includes('_') ? id.split('_') : id.split(':');
                    return { ayahId: id, surahNumber: parseInt(surah), ayahNumber: parseInt(ayah) };
                });
                await apiClient.post('/favorites/sync', favPayload).catch(() => {});
            }

            // 2. Sync Collections
            const cols = Object.values(state.collections);
            const localCols = cols.filter(c => c.id.startsWith('col_'));
            
            if (localCols.length > 0) {
                const colPayload = localCols.map(c => ({
                    localId: c.id,
                    name: c.name,
                    ayahs: Object.keys(c.ayahs)
                }));
                
                const response = await apiClient.post('/collections/sync', colPayload);
                const mapping = response.data.mapping; // { "col_123": 5 }

                if (mapping) {
                    set(innerState => {
                        const newCols = { ...innerState.collections };
                        let changed = false;
                        for (const localId of Object.keys(mapping)) {
                            if (newCols[localId]) {
                                const realIdStr = mapping[localId].toString();
                                newCols[realIdStr] = { ...newCols[localId], id: realIdStr };
                                delete newCols[localId];
                                changed = true;
                            }
                        }
                        if (changed) {
                            saveLocal('userCollections', newCols);
                            return { collections: newCols };
                        }
                        return innerState;
                    });
                }
            }
        } catch (error) {
            console.error("Error syncing local data:", error);
        }
    }
}));
