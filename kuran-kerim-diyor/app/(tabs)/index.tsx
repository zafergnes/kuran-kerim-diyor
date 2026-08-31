import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent, Text, PanResponder, GestureResponderEvent, I18nManager, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, Heart, Sparkles } from 'lucide-react-native';
import { DailyVerseService, DailyVerse } from '../../services/dailyVerseService';
import { VerseShareCard } from '../../components/VerseShareCard';
import { Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSurah } from '../../services/quranData';
import { AyahCard } from '../../components/AyahCard';
import { useProgress } from '../../hooks/useProgress';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useUserStore } from '../../store/userStore';
import { DeleteWarningModal } from '../../components/DeleteWarningModal';
import { useAyahStats } from '../../hooks/useAyahStats';
import { QuranPageCard } from '../../components/QuranPageCard';
import { getPageFromSurahAyah } from '../../utils/quranHelpers';
import { PAGE_START_MAP } from '../../utils/pageMapping';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';

const formatFavCount = (n: number) => {
    if (n < 1000) return n.toString();
    return (n / 1000).toFixed(1) + 'k';
};

const { width } = Dimensions.get('window');

export default function MainFeedScreen() {
    const navigation = useNavigation();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    const { currentSurah, currentAyah, setProgress } = useProgress();
    const surah = getSurah(currentSurah || 1);

    const PAGES_ARRAY = useMemo(() => Array.from({ length: 604 }, (_, i) => i + 1), []);
    const currentPage = useMemo(() => {
        return getPageFromSurahAyah(currentSurah || 1, currentAyah || 1);
    }, [currentSurah, currentAyah]);

    const [containerHeight, setContainerHeight] = useState(Dimensions.get('window').height);
    const [showSwipeHint, setShowSwipeHint] = useState(false);
    const [uiAyah, setUiAyah] = useState(currentAyah);
    const [barHeight, setBarHeight] = useState(0);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const { 
        favorites, 
        toggleFavorite, 
        hideFavoriteDeleteWarning, 
        setHideFavoriteDeleteWarning,
        readingLayout,
        arabicFontFamily,
    } = useUserStore();
    const [showDeleteWarning, setShowDeleteWarning] = useState(false);
    const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
    const [showDailyModal, setShowDailyModal] = useState(false);
    const [activePageMode, setActivePageMode] = useState<'arabic' | 'translation'>('arabic');
    const [highlightedAyahId, setHighlightedAyahId] = useState<string | null>(null);

    useEffect(() => {
        setHighlightedAyahId(`${currentSurah}_${currentAyah}`);
        const timer = setTimeout(() => {
            setHighlightedAyahId(null);
        }, 2000);
        return () => clearTimeout(timer);
    }, [currentSurah, currentAyah]);

    useEffect(() => {
        // Cihaz internetsiz veya yavaşken önbellekteki veriyi anında göster
        DailyVerseService.getCachedDailyVerse().then(cached => {
            if (cached) setDailyVerse(cached);
        });

        // Güncel veriyi arka planda çekip arayüzü güncelle
        DailyVerseService.getDailyVerse().then(setDailyVerse).catch(() => {});
    }, []);

    useEffect(() => {
        if (params.showDaily === 'true') {
            setShowDailyModal(true);
        }
    }, [params.showDaily]);

    const flatListRef = useRef<FlatList>(null);
    const scrubTimer = useRef<NodeJS.Timeout | null>(null);
    const currentIndexRef = useRef(Math.max(0, (currentAyah || 1) - 1));
    const storeRef = useRef({ barHeight: 0, surah, uiAyah, isScrubbing });

    useEffect(() => {
        storeRef.current = { barHeight, surah, uiAyah, isScrubbing };
    }, [barHeight, surah, uiAyah, isScrubbing]);

    const processScrub = (locationY: number) => {
        const currentStore = storeRef.current;
        if (currentStore.barHeight === 0 || !currentStore.surah) return;

        let percentage = locationY / currentStore.barHeight;
        if (percentage < 0) percentage = 0;
        if (percentage > 1) percentage = 1;

        const targetIndex = Math.floor(percentage * currentStore.surah.ayahs.length);
        const safeIndex = Math.min(Math.max(0, targetIndex), currentStore.surah.ayahs.length - 1);

        const targetAyahNumber = currentStore.surah.ayahs[safeIndex].number;
        if (targetAyahNumber !== currentStore.uiAyah) {
            currentIndexRef.current = safeIndex;
            setUiAyah(targetAyahNumber);
            flatListRef.current?.scrollToIndex({ index: safeIndex, animated: false });
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                const startY = evt.nativeEvent.locationY;
                scrubTimer.current = setTimeout(() => {
                    setIsScrubbing(true);
                    processScrub(startY);
                }, 300);
            },
            onPanResponderMove: (evt, gestureState) => {
                if (!storeRef.current.isScrubbing) {
                    if (Math.abs(gestureState.dy) > 5 || Math.abs(gestureState.dx) > 5) {
                        if (scrubTimer.current) clearTimeout(scrubTimer.current);
                    }
                    return;
                }
                processScrub(evt.nativeEvent.locationY);
            },
            onPanResponderRelease: () => {
                if (scrubTimer.current) clearTimeout(scrubTimer.current);
                setIsScrubbing(false);
            },
            onPanResponderTerminate: () => {
                if (scrubTimer.current) clearTimeout(scrubTimer.current);
                setIsScrubbing(false);
            }
        })
    ).current;

    // Bu effect hem sure değişimini (arama/profil) hem de aynı sure içinde dışaridan gelen
    // navigasyonları yakalar. onViewableItemsChanged swipe'ta currentIndexRef'i
    // SENKRON olarak günceller, bu yüzden swipe trigger’ında currentIndexRef zaten
    // doğru değerddedir ve aşağıdaki kontrol false döner → duplicate scroll olmaz.
    useEffect(() => {
        if (readingLayout === 'page') {
            const targetPage = getPageFromSurahAyah(currentSurah || 1, currentAyah || 1);
            const targetIndex = targetPage - 1;
            
            if (currentIndexRef.current === targetIndex) return;
            currentIndexRef.current = targetIndex;
            
            setTimeout(() => {
                try {
                    flatListRef.current?.scrollToIndex({ index: targetIndex, animated: false });
                } catch (e) {
                    console.log('Page scroll error:', e);
                }
            }, 100);
        } else {
            const surahObj = surah;
            if (!surahObj || !surahObj.ayahs.length) return;

            // Hedef indexi ayet numarasından doğru bul
            let targetIndex = surahObj.ayahs.findIndex(a => a.number === currentAyah);
            if (targetIndex < 0) {
                targetIndex = Math.min(Math.max(0, (currentAyah || 1) - 1), surahObj.ayahs.length - 1);
            }

            // onViewableItemsChanged swipe sırasında ref'i önceden güncellediyse
            // bu iki değer eşittir ve scroll tetiklenmez. Dışarıdan navigasyonda
            // ref eski yerdedir → scroll gerçekleşir.
            if (currentIndexRef.current === targetIndex) return;

            currentIndexRef.current = targetIndex;
            setUiAyah(currentAyah);
            setTimeout(() => {
                try {
                    flatListRef.current?.scrollToIndex({ index: targetIndex, animated: false });
                } catch (e) {
                    console.log('Scroll sınır hatası engellendi:', e);
                }
            }, 100);
        }
    }, [currentSurah, currentAyah, readingLayout]);

    useEffect(() => {
        AsyncStorage.getItem('hasSeenSwipeHint').then(val => {
            if (val !== 'true') setShowSwipeHint(true);
        });
    }, []);

    const favoriteId = surah ? `${surah.number}_${uiAyah}` : null;
    // Map içinde key var mı kontrolü
    const isFavorited = favoriteId ? !!favorites[favoriteId] : false;
    
    const { favoriteCount: globalFavCount, incrementOptimistic } = useAyahStats(surah?.number || 0, uiAyah);
    
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const executeToggle = React.useCallback(() => {
        if (!favoriteId) return;
        toggleFavorite(favoriteId);
        incrementOptimistic(isFavorited ? -1 : 1);
        
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1.3,
                useNativeDriver: true,
                speed: 20
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                speed: 20
            })
        ]).start();
    }, [favoriteId, toggleFavorite, incrementOptimistic, isFavorited, scaleAnim]);

    const handleToggleFavorite = React.useCallback(() => {
        if (!favoriteId) return;
        // Eğer favoriden çikariyorsak ve uyarilmasini gizlemediyse uyar
        if (isFavorited && !hideFavoriteDeleteWarning) {
            setShowDeleteWarning(true);
        } else {
            executeToggle();
        }
    }, [favoriteId, isFavorited, hideFavoriteDeleteWarning, executeToggle]);

    const handleConfirmDelete = (dontAskAgain: boolean) => {
        if (dontAskAgain) {
            setHideFavoriteDeleteWarning(true);
        }
        setShowDeleteWarning(false);
        executeToggle();
    };

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {dailyVerse && (
                        <TouchableOpacity onPress={() => setShowDailyModal(true)} style={{ marginRight: 8, padding: 4 }}>
                            <Sparkles size={24} color={theme.primary} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleToggleFavorite} style={{ marginRight: 16, padding: 4 }}>
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <Heart 
                                size={24} 
                                color={theme.primary} 
                                fill={isFavorited ? theme.primary : 'transparent'} 
                            />
                        </Animated.View>
                    </TouchableOpacity>
                    {globalFavCount > 0 && (
                        <Text style={{ fontSize: 10, color: theme.primary, marginRight: 16, marginTop: -4, fontWeight: 'bold' }}>
                            {formatFavCount(globalFavCount)}
                        </Text>
                    )}
                </View>
            ),
        });
    }, [navigation, isFavorited, handleToggleFavorite, theme.primary, scaleAnim, globalFavCount]);

    if (!surah) return null;

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (showSwipeHint) {
            setShowSwipeHint(false);
            AsyncStorage.setItem('hasSeenSwipeHint', 'true');
        }
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems && viewableItems.length > 0) {
            const centerItem = viewableItems[0];
            if (centerItem && typeof centerItem.index === 'number') {
                const newIndex = centerItem.index;
                const layout = useUserStore.getState().readingLayout;
                
                if (layout === 'page') {
                    const startRef = PAGE_START_MAP[newIndex];
                    if (startRef && currentIndexRef.current !== newIndex) {
                        currentIndexRef.current = newIndex;
                        setProgress(startRef.surah, startRef.ayah);
                        setUiAyah(startRef.ayah);
                    }
                } else {
                    const currentSurahObj = storeRef.current.surah;
                    
                    if (currentSurahObj && currentSurahObj.ayahs[newIndex]) {
                        if (currentIndexRef.current !== newIndex) {
                            currentIndexRef.current = newIndex;
                            const visibleAyahNumber = currentSurahObj.ayahs[newIndex].number;
                            setUiAyah(visibleAyahNumber);
                            // isProgrammaticJump'u false bırak: bu kullanıcı swipe'i,
                            // useEffect bu değişikliğe tepki VERMEYECEK.
                            setProgress(currentSurahObj.number, visibleAyahNumber);
                        }
                    }
                }
            }
        }
    }).current;

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    return (
        <View
            style={[styles.container, { backgroundColor: theme.background }]}
            onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
        >
            <FlatList
                ref={flatListRef}
                data={readingLayout === 'page' ? PAGES_ARRAY : surah.ayahs}
                keyExtractor={(item) => readingLayout === 'page' ? item.toString() : (item as any).globalNumber.toString()}
                renderItem={({ item }) => {
                    if (readingLayout === 'page') {
                        return (
                            <View style={{ height: containerHeight, width }}>
                                <QuranPageCard
                                    pageNumber={item as number}
                                    containerHeight={containerHeight}
                                    highlightedAyahId={highlightedAyahId}
                                    activeMode={activePageMode}
                                    onToggleMode={setActivePageMode}
                                />
                            </View>
                        );
                    } else {
                        const { language } = useUserStore.getState();
                        const surahName = language === 'ar' ? surah.name.ar : language === 'tr' ? surah.name.tr : surah.name.en;
                        return (
                            <View style={{ height: containerHeight, width }}>
                                <AyahCard ayah={item as any} surahName={surahName} surahNumber={surah.number} />
                            </View>
                        );
                    }
                }}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={width}
                snapToAlignment="start"
                decelerationRate="fast"
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                initialScrollIndex={readingLayout === 'page' ? Math.max(0, currentPage - 1) : Math.max(0, currentAyah - 1)}
                onScrollToIndexFailed={(info) => {
                    setTimeout(() => {
                        flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
                    }, 300);
                }}
                getItemLayout={(data, index) => (
                    { length: width, offset: width * index, index }
                )}
            />
            {/* Vertical Progress Bar */}
            {readingLayout === 'single' && (
                <View style={[styles.progressContainer, { top: '25%', bottom: '25%', opacity: isScrubbing ? 1 : 0.8 }]} {...panResponder.panHandlers}>
                    <View
                        style={[styles.progressBarBg, { backgroundColor: 'rgba(182, 154, 115, 0.2)', width: isScrubbing ? 10 : 4, borderRadius: isScrubbing ? 5 : 2 }]}
                        onLayout={(e) => setBarHeight(e.nativeEvent.layout.height)}
                        pointerEvents="none"
                    >
                        <View style={[styles.progressBarFill, { height: `${(uiAyah / surah.ayahs.length) * 100}%`, backgroundColor: theme.primary, borderRadius: isScrubbing ? 5 : 2 }]} />
                    </View>
                    <View style={[styles.progressPill, { backgroundColor: theme.card, borderColor: theme.border, transform: [{ scale: isScrubbing ? 1.1 : 1 }] }]} pointerEvents="none">
                        <Text style={[styles.progressText, { color: theme.text }]}>{uiAyah}</Text>
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        <Text style={[styles.progressText, { color: theme.muted }]}>{surah.ayahs.length}</Text>
                    </View>
                </View>
            )}
            {showSwipeHint && (
                <View style={styles.swipeHintOverlay} pointerEvents="none">
                    <ChevronLeft size={48} color="#fff" style={{ marginBottom: 16 }} />
                    <Text style={styles.swipeHintText}>{t('common.swipe_hint')}</Text>
                </View>
            )}
            <DeleteWarningModal 
                visible={showDeleteWarning}
                onCancel={() => setShowDeleteWarning(false)}
                onConfirm={handleConfirmDelete}
            />

            {/* Günün Ayeti Modalı */}
            <Modal
                visible={showDailyModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDailyModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('daily_verse.title')}</Text>
                            <TouchableOpacity onPress={() => setShowDailyModal(false)}>
                                <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{t('common.close')}</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ paddingBottom: Math.max(40, insets.bottom + 20) }}>
                            {dailyVerse && (
                                <VerseShareCard 
                                    text={dailyVerse.text} 
                                    reference={dailyVerse.reference} 
                                />
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    swipeHintOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    swipeHintText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 28,
    },
    progressContainer: {
        position: 'absolute',
        right: 0,
        width: 50,
        paddingRight: 10,
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 50,
        backgroundColor: 'transparent',
    },
    progressBarBg: {
        flex: 1,
        width: 4,
        borderRadius: 2,
        marginBottom: 8,
        justifyContent: 'flex-start',
    },
    progressBarFill: {
        width: '100%',
        borderRadius: 2,
    },
    progressPill: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    progressText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    divider: {
        width: 16,
        height: 1,
        marginVertical: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
