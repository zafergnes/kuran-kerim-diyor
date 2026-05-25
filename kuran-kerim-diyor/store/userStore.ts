import { create } from 'zustand';
import { AppLanguage } from '../constants/languages';

export interface Collection {
    id: string;
    name: string;
    ayahs: Record<string, number>;
}

interface UserState {
    language: AppLanguage;
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

    // Auth state
    userId: string | null;
    isAnonymous: boolean;
    displayName: string | null;
    email: string | null;

    setLanguage: (lang: AppLanguage) => void;
    setProgress: (surah: number, ayah: number) => void;
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
    addCollection: (name: string, initialAyahId?: string) => void;
    deleteCollection: (colId: string) => void;
    addAyahToCollection: (ayahId: string, colId: string) => void;
    removeAyahFromCollection: (ayahId: string, colId: string) => void;
    removeFromAllCollections: (ayahId: string) => void; // Called when removed from general favs
    setCollections: (cols: Record<string, Collection>) => void;
    syncAllLocalData: () => Promise<void>;
}

const saveLocal = (key: string, data: any) => {
    import('@react-native-async-storage/async-storage').then(AsyncStorage => {
        AsyncStorage.default.setItem(key, JSON.stringify(data));
    });
};

export const useUserStore = create<UserState>((set, get) => ({
    language: 'tr', // Default
    currentSurah: 1,
    currentAyah: 1,
    completedSurahs: [],
    favorites: {},
    collections: {},
    hideFavoriteDeleteWarning: false,
    showArabicTranslation: false,
    arabicTranslationLang: 'en',
    selectedReciter: 'ar.alafasy',
    readingLayout: 'single',
    arabicFontFamily: 'noto-naskh',
    selectedArabicScript: 'diyanet',

    userId: null,
    isAnonymous: false,
    displayName: null,
    email: null,

    setLanguage: (lang) => {
        set({ language: lang });
        // i18n ve AsyncStorage'i de senkronize et
        import('../services/i18n').then(({ default: i18n, applyRTL }) => {
            i18n.changeLanguage(lang);
            applyRTL(lang);
        });
        import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
            AsyncStorage.setItem('@app_language', lang);
        });
    },
    setProgress: (surah, ayah) => set({ currentSurah: surah, currentAyah: ayah }),
    addCompletedSurah: (surah) => set((state) => {
        const list = state.completedSurahs || [];
        if (!list.includes(surah)) {
            return { completedSurahs: [...list, surah] };
        }
        return state;
    }),
    setCompletedSurahs: (surahs) => set({ completedSurahs: surahs }),
    setAuth: (userId, isAnonymous, displayName, email) => set({ userId, isAnonymous, displayName, email }),
    
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
            
            const storedCols = await AsyncStorage.getItem('userCollections');
            if (storedCols) set({ collections: JSON.parse(storedCols) });

            const storedWarn = await AsyncStorage.getItem('hideFavWarning');
            if (storedWarn) set({ hideFavoriteDeleteWarning: storedWarn === 'true' });

            const storedArabicTranslation = await AsyncStorage.getItem('@arabic_show_translation');
            if (storedArabicTranslation !== null) set({ showArabicTranslation: storedArabicTranslation === 'true' });

            const storedArabicLang = await AsyncStorage.getItem('@arabic_translation_lang');
            if (storedArabicLang) set({ arabicTranslationLang: storedArabicLang as AppLanguage });

            const storedReciter = await AsyncStorage.getItem('@app_selected_reciter');
            if (storedReciter) set({ selectedReciter: storedReciter });

            const storedLayout = await AsyncStorage.getItem('@app_reading_layout');
            if (storedLayout) set({ readingLayout: storedLayout as 'single' | 'page' });

            const storedFont = await AsyncStorage.getItem('@app_arabic_font');
            if (storedFont) set({ arabicFontFamily: storedFont as 'noto-naskh' | 'amiri' });

            const storedScript = await AsyncStorage.getItem('@app_arabic_script');
            if (storedScript) {
                set({ selectedArabicScript: storedScript as 'uthmani' | 'diyanet' });
            } else {
                const currentLang = await AsyncStorage.getItem('@app_language') || 'tr';
                set({ selectedArabicScript: currentLang === 'tr' ? 'diyanet' : 'uthmani' });
            }

        } catch (e) {
            console.error('Failed to load favorites/collections', e);
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
