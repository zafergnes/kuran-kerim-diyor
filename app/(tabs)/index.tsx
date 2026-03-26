import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent, Text, PanResponder, GestureResponderEvent, I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, Heart } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { getSurah } from '../../services/quranData';
import { AyahCard } from '../../components/AyahCard';
import { useProgress } from '../../hooks/useProgress';
import { useAchievements } from '../../hooks/useAchievements';
import { HatimCelebration } from '../../components/HatimCelebration';
import { useNavigation } from 'expo-router';
import { TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');

export default function MainFeedScreen() {
    const navigation = useNavigation();
    const { currentSurah, currentAyah, setProgress } = useProgress();
    const surah = getSurah(currentSurah || 1);
    const theme = Colors.light;

    const { showHatim, setShowHatim } = useAchievements();
    const [containerHeight, setContainerHeight] = useState(Dimensions.get('window').height);
    const [showSwipeHint, setShowSwipeHint] = useState(false);
    const [uiAyah, setUiAyah] = useState(currentAyah);
    const [barHeight, setBarHeight] = useState(0);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

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

    useEffect(() => {
        const newIndex = Math.max(0, (currentAyah || 1) - 1);
        currentIndexRef.current = newIndex;
        setUiAyah(currentAyah);
        // Arama sonucundan gelince doğru ayete scroll et
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: newIndex, animated: false });
        }, 50);
    }, [currentSurah, currentAyah]);

    useEffect(() => {
        AsyncStorage.getItem('hasSeenSwipeHint').then(val => {
            if (val !== 'true') setShowSwipeHint(true);
        });
    }, []);

    const favoriteId = surah ? `${surah.number}:${uiAyah}` : null;
    const isFavorited = favoriteId ? favorites.has(favoriteId) : false;

    const toggleFavorite = React.useCallback(() => {
        if (!favoriteId) return;
        setFavorites(prev => {
            const newSet = new Set(prev);
            if (newSet.has(favoriteId)) {
                newSet.delete(favoriteId);
            } else {
                newSet.add(favoriteId);
            }
            return newSet;
        });
    }, [favoriteId]);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={toggleFavorite} style={{ marginRight: 16, padding: 4 }}>
                    <Heart 
                        size={24} 
                        color={theme.primary} 
                        fill={isFavorited ? theme.primary : 'transparent'} 
                    />
                </TouchableOpacity>
            ),
        });
    }, [navigation, isFavorited, toggleFavorite, theme.primary]);

    if (!surah) return null;

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (showSwipeHint) {
            setShowSwipeHint(false);
            AsyncStorage.setItem('hasSeenSwipeHint', 'true');
        }
    };

    const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const rawIndex = Math.round(offsetX / width);
        const prev = currentIndexRef.current;

        // Sadece ±1 adım izin ver (tek ayet geçiş)
        let newIndex = prev;
        if (rawIndex > prev) newIndex = prev + 1;
        else if (rawIndex < prev) newIndex = prev - 1;

        // Sınırları kontrol et
        newIndex = Math.max(0, Math.min(newIndex, surah.ayahs.length - 1));
        currentIndexRef.current = newIndex;

        // Eğer FlatList fazla ileri/geri gittiyse düzelt
        if (rawIndex !== newIndex) {
            flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
        }

        // UI ve progress güncelle
        const visibleAyahNumber = surah.ayahs[newIndex].number;
        setUiAyah(visibleAyahNumber);
        setProgress(surah.number, visibleAyahNumber);
    };

    return (
        <View
            style={[styles.container, { backgroundColor: theme.background }]}
            onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
        >
            <FlatList
                ref={flatListRef}
                data={surah.ayahs}
                keyExtractor={(item) => item.globalNumber.toString()}
                renderItem={({ item }) => (
                    <View style={{ height: containerHeight, width }}>
                        <AyahCard ayah={item} surahName={surah.name.tr} surahNumber={surah.number} />
                    </View>
                )}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={width}
                snapToAlignment="start"
                decelerationRate="fast"
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onMomentumScrollEnd={handleMomentumEnd}
                initialScrollIndex={Math.max(0, currentAyah - 1)}
                getItemLayout={(data, index) => (
                    { length: width, offset: width * index, index }
                )}
            />
            {/* Vertical Progress Bar */}
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
            {showSwipeHint && (
                <View style={styles.swipeHintOverlay} pointerEvents="none">
                    <ChevronLeft size={48} color="#fff" style={{ marginBottom: 16 }} />
                    <Text style={styles.swipeHintText}>Sıradaki ayet için{'\n'}sola kaydırın</Text>
                </View>
            )}
            <HatimCelebration visible={showHatim} onClose={() => setShowHatim(false)} />
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
});
