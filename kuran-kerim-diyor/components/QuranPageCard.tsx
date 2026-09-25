import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    PanResponder,
    Modal,
} from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useUserStore } from '../store/userStore';
import { AppLanguage } from '../constants/languages';
import { useTranslation } from 'react-i18next';
import { getPageAyahs, PageAyahItem } from '../utils/quranHelpers';
import { Audio, CompatSound as AudioSound } from '../services/audioCompat';
import { Play, Pause, Sparkles, RotateCcw, RotateCw, Repeat2, X, ChevronLeft, ChevronRight, ChevronUp, Compass } from 'lucide-react-native';
import { GlobalAudioController } from '../services/globalAudioController';
import { getAyahAudioTrack, WordTiming } from '../services/quranAudioTimingService';
import { VerseChatModal } from './VerseChatModal';
import { AyahActionBar } from './AyahActionBar';
import { AnalyticsService } from '../services/analyticsService';
import { OfflineAudioService } from '../services/offlineAudioService';

const toArabicDigits = (num: number): string => {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.toString().split('').map(digit => {
        const d = parseInt(digit, 10);
        return isNaN(d) ? digit : arabicDigits[d];
    }).join('');
};

interface QuranPageCardProps {
    pageNumber: number;
    containerHeight: number;
    highlightedAyahId?: string | null;
    activeMode: 'arabic' | 'translation';
    onToggleMode: (mode: 'arabic' | 'translation') => void;
    onAudioInteractionChange?: (isInteracting: boolean) => void;
    onNextPage?: () => void;
    onPrevPage?: () => void;
    onAyahChange?: (surahNumber: number, ayahNumber: number) => void;
}

export const QuranPageCard = React.memo<QuranPageCardProps>(({
    pageNumber,
    containerHeight,
    highlightedAyahId,
    activeMode,
    onToggleMode,
    onAudioInteractionChange,
    onNextPage,
    onPrevPage,
    onAyahChange,
}) => {
    const { t } = useTranslation();
    const { theme, colorScheme } = useAppTheme();
    const activeBlue = colorScheme === 'dark' ? '#60A5FA' : (colorScheme === 'sepia' ? '#1D6FB8' : '#2563EB');
    const inactiveBlue = colorScheme === 'dark' ? '#64748B' : (colorScheme === 'sepia' ? '#8C7E70' : '#94A3B8');
    const activeBlueBg = colorScheme === 'dark'
        ? 'rgba(96, 165, 250, 0.16)'
        : (colorScheme === 'sepia' ? 'rgba(29, 111, 184, 0.12)' : 'rgba(37, 99, 235, 0.12)');
    
    const {
        language,
        arabicTranslationLang,
        arabicFontFamily,
        setArabicFontFamily,
        selectedReciter,
        fontSizeScale,
        setFontSizeScale,
    } = useUserStore();
    const translationLanguage = language === 'ar' ? arabicTranslationLang : language;

    const baseArabicSize = arabicFontFamily === 'noto-naskh' ? 21 : 23;
    const arabicFontSize = Math.round(baseArabicSize * (fontSizeScale || 1.0));
    const translationFontSize = Math.round(15 * (fontSizeScale || 1.0));
    
    const [sound, setSound] = useState<AudioSound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);
    const [playProgress, setPlayProgress] = useState(0);
    const [durationMillis, setDurationMillis] = useState(0);
    const [positionMillis, setPositionMillis] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [repeatCount, setRepeatCount] = useState(1);
    const [pageTrackWidth, setPageTrackWidth] = useState(300);
    const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
    const [chatAyah, setChatAyah] = useState<PageAyahItem | null>(null);
    const [selectedAyahId, setSelectedAyahId] = useState<string | null>(null);
    const wordTimingsRef = useRef<WordTiming[]>([]);
    const playbackRequestRef = useRef(0);
    const repeatRemainingRef = useRef(1);
    const repeatCountRef = useRef(1);

    const scrollViewRef = useRef<ScrollView>(null);
    const stripScrollRef = useRef<ScrollView>(null);
    const ayahYOffsetsRef = useRef<Record<number, number>>({});
    const [showBackToTop, setShowBackToTop] = useState(false);
    const hasInitialScrolledRef = useRef(false);

    // Fetch all ayahs on this page
    const pageAyahs = useMemo(() => {
        return getPageAyahs(pageNumber, language);
    }, [pageNumber, language]);

    // Primary surah name on this page (first ayah's surah)
    const pageTitle = useMemo(() => {
        if (pageAyahs.length === 0) return '';
        return pageAyahs[0].surahName;
    }, [pageAyahs]);

    const scrollToAyah = useCallback((ayahNum: number, animated = true) => {
        const targetY = ayahYOffsetsRef.current[ayahNum];
        if (typeof targetY === 'number') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, targetY - 14),
                animated,
            });
        }
    }, []);

    useEffect(() => {
        if (highlightedAyahId) {
            setSelectedAyahId(highlightedAyahId);
            const parts = highlightedAyahId.split('_');
            if (parts.length === 2) {
                const ayahNum = Number(parts[1]);
                setTimeout(() => {
                    scrollToAyah(ayahNum, true);
                }, 150);
            }
        } else if (pageAyahs.length > 0 && !selectedAyahId) {
            setSelectedAyahId(`${pageAyahs[0].surahNumber}_${pageAyahs[0].ayah.number}`);
        }
    }, [highlightedAyahId, pageAyahs, scrollToAyah]);

    useEffect(() => {
        if (currentPlayingIndex !== null && pageAyahs[currentPlayingIndex]) {
            const playing = pageAyahs[currentPlayingIndex];
            setSelectedAyahId(`${playing.surahNumber}_${playing.ayah.number}`);
        }
    }, [currentPlayingIndex, pageAyahs]);

    const selectedAyah = useMemo(() => {
        if (!pageAyahs || pageAyahs.length === 0) return null;
        if (selectedAyahId) {
            const found = pageAyahs.find(item => `${item.surahNumber}_${item.ayah.number}` === selectedAyahId);
            if (found) return found;
        }
        return pageAyahs[0];
    }, [pageAyahs, selectedAyahId]);

    // Üstteki yatay ayet şeridini seçili ayete göre ortala
    useEffect(() => {
        if (selectedAyah && pageAyahs.length > 1) {
            const idx = pageAyahs.findIndex(
                (item) => item.ayah.number === selectedAyah.ayah.number && item.surahNumber === selectedAyah.surahNumber
            );
            if (idx >= 0 && stripScrollRef.current) {
                stripScrollRef.current.scrollTo({
                    x: Math.max(0, idx * 46 - 80),
                    animated: true,
                });
            }
        }
    }, [selectedAyah, pageAyahs]);

    const ownerId = `page_${pageNumber}`;

    const formatTime = (milliseconds: number) => {
        const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
        return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
    };

    useEffect(() => {
        return () => {
            playbackRequestRef.current += 1;
            GlobalAudioController.stop(ownerId);
        };
    }, [pageNumber]);

    useEffect(() => {
        playbackRequestRef.current += 1;
        if (sound) {
            GlobalAudioController.stop(ownerId);
        }
    }, [selectedReciter]);

    const playAyahAtIndex = async (
        index: number,
        startProgress = 0,
        isSequenceContinuation = false,
        targetWordIndex?: number,
    ) => {
        if (index < 0 || index >= pageAyahs.length) {
            await GlobalAudioController.stop(ownerId);
            return;
        }

        setIsLoading(true);
        setCurrentPlayingIndex(index);
        setPlayProgress(0);
        setPositionMillis(0);
        setActiveWordIndex(null);
        wordTimingsRef.current = [];
        const playbackRequest = ++playbackRequestRef.current;
        if (!isSequenceContinuation) repeatRemainingRef.current = repeatCountRef.current;

        try {
            const ayah = pageAyahs[index];
            const track = await OfflineAudioService.getTrack(selectedReciter, ayah.ayah.globalNumber)
                || await getAyahAudioTrack(
                    selectedReciter,
                    ayah.surahNumber,
                    ayah.ayah.number,
                    ayah.ayah.globalNumber,
                );
            if (playbackRequestRef.current !== playbackRequest) return;
            wordTimingsRef.current = track.wordTimings;
            const targetWord = targetWordIndex
                ? track.wordTimings.find((segment) => segment.wordIndex === targetWordIndex)
                : undefined;

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: track.url },
                { shouldPlay: false }
            );

            await newSound.setRateAsync(playbackRate);
            await GlobalAudioController.play(newSound, ownerId, () => {
                setIsPlaying(false);
                setCurrentPlayingIndex(null);
                setPlayProgress(0);
                setPositionMillis(0);
                setDurationMillis(0);
                setActiveWordIndex(null);
                setSound(null);
            });

            if (targetWord) {
                await newSound.setPositionAsync(targetWord.startMillis);
            } else if (startProgress > 0) {
                const status = await newSound.getStatusAsync();
                if (status.isLoaded && status.durationMillis) {
                    await newSound.setPositionAsync(startProgress * status.durationMillis);
                }
            }

            setSound(newSound);
            setCurrentPlayingIndex(index);
            setPlayProgress(startProgress);
            let wordEndMillis = targetWord?.endMillis ?? null;

            newSound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded) {
                    const currentPosition = status.positionMillis || 0;
                    setDurationMillis(status.durationMillis || 0);
                    setPositionMillis(currentPosition);
                    if (status.durationMillis) {
                        setPlayProgress(currentPosition / status.durationMillis);
                    }
                    const activeSegment = wordTimingsRef.current.find(
                        (segment) => currentPosition >= segment.startMillis && currentPosition < segment.endMillis,
                    );
                    setActiveWordIndex(activeSegment?.wordIndex ?? null);
                    if (wordEndMillis !== null && currentPosition >= wordEndMillis) {
                        wordEndMillis = null;
                        void newSound.pauseAsync().then(() => {
                            setIsPlaying(false);
                            setActiveWordIndex(null);
                            if (repeatRemainingRef.current > 1 && targetWordIndex) {
                                repeatRemainingRef.current -= 1;
                                void playAyahAtIndex(index, 0, true, targetWordIndex);
                            }
                        });
                        return;
                    }
                    if (status.didJustFinish) {
                        setActiveWordIndex(null);
                        if (repeatRemainingRef.current > 1) {
                            repeatRemainingRef.current -= 1;
                            void playAyahAtIndex(index, 0, true);
                        } else {
                            repeatRemainingRef.current = repeatCountRef.current;
                            void playAyahAtIndex(index + 1, 0, true);
                        }
                    }
                }
            });

            await newSound.playAsync();
            setIsPlaying(true);
        } catch (e) {
            console.error("Page playback error:", e);
            setIsPlaying(false);
            setCurrentPlayingIndex(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayPause = async () => {
        if (isLoading) return;

        if (isPlaying) {
            await GlobalAudioController.pause(ownerId);
            setIsPlaying(false);
        } else {
            if (sound) {
                await GlobalAudioController.play(sound, ownerId, () => {
                    setIsPlaying(false);
                    setCurrentPlayingIndex(null);
                    setPlayProgress(0);
                    setPositionMillis(0);
                    setDurationMillis(0);
                    setActiveWordIndex(null);
                    setSound(null);
                });
                await sound.playAsync();
                setIsPlaying(true);
            } else {
                playAyahAtIndex(0);
            }
        }
    };

    const seekBy = async (seconds: number) => {
        if (!sound) return;
        const status = await sound.getStatusAsync();
        if (!status.isLoaded || !status.durationMillis) return;
        const nextPosition = Math.min(
            status.durationMillis,
            Math.max(0, status.positionMillis + seconds * 1000),
        );
        await sound.setPositionAsync(nextPosition);
        setPositionMillis(nextPosition);
        setPlayProgress(nextPosition / status.durationMillis);
    };

    const cyclePlaybackRate = async () => {
        const rates = [0.75, 1, 1.25];
        const currentIndex = rates.indexOf(playbackRate);
        const nextRate = rates[(currentIndex + 1) % rates.length];
        setPlaybackRate(nextRate);
        if (sound) await sound.setRateAsync(nextRate);
    };

    const cycleRepeatCount = () => {
        const options = [1, 3, 5, 10];
        const next = options[(options.indexOf(repeatCount) + 1) % options.length];
        repeatRemainingRef.current = next;
        repeatCountRef.current = next;
        setRepeatCount(next);
    };

    const handleStopAudio = async () => {
        playbackRequestRef.current += 1;
        await GlobalAudioController.stop(ownerId);
        setSound(null);
        setIsPlaying(false);
        setCurrentPlayingIndex(null);
        setPlayProgress(0);
        setPositionMillis(0);
        setDurationMillis(0);
        setActiveWordIndex(null);
    };

    const isPageScrubbingRef = useRef(false);
    const initialPageXRef = useRef(0);
    const pageTrackWidthRef = useRef(pageTrackWidth);
    pageTrackWidthRef.current = pageTrackWidth;
    const pageSoundRef = useRef(sound);
    pageSoundRef.current = sound;
    const onAudioInteractionChangeRef = useRef(onAudioInteractionChange);
    onAudioInteractionChangeRef.current = onAudioInteractionChange;

    const pagePanResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onStartShouldSetPanResponderCapture: () => true,
                onMoveShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponderCapture: () => true,
                onPanResponderGrant: (evt) => {
                    isPageScrubbingRef.current = true;
                    onAudioInteractionChangeRef.current?.(true);
                    const locX = evt.nativeEvent.locationX;
                    initialPageXRef.current = locX;
                    const w = pageTrackWidthRef.current > 0 ? pageTrackWidthRef.current : 300;
                    const percentage = Math.min(1, Math.max(0, locX / w));
                    setPlayProgress(percentage);
                    if (pageSoundRef.current) {
                        pageSoundRef.current.getStatusAsync().then((status) => {
                            if (status.isLoaded && status.durationMillis) {
                                const targetPos = percentage * status.durationMillis;
                                pageSoundRef.current?.setPositionAsync(targetPos).catch(() => {});
                            }
                        });
                    }
                },
                onPanResponderMove: (evt, gestureState) => {
                    const w = pageTrackWidthRef.current > 0 ? pageTrackWidthRef.current : 300;
                    const currentX = initialPageXRef.current + gestureState.dx;
                    const percentage = Math.min(1, Math.max(0, currentX / w));
                    setPlayProgress(percentage);
                    if (pageSoundRef.current) {
                        pageSoundRef.current.getStatusAsync().then((status) => {
                            if (status.isLoaded && status.durationMillis) {
                                const targetPos = percentage * status.durationMillis;
                                pageSoundRef.current?.setPositionAsync(targetPos).catch(() => {});
                            }
                        });
                    }
                },
                onPanResponderRelease: () => {
                    isPageScrubbingRef.current = false;
                    onAudioInteractionChangeRef.current?.(false);
                },
                onPanResponderTerminate: () => {
                    isPageScrubbingRef.current = false;
                    onAudioInteractionChangeRef.current?.(false);
                },
                onPanResponderTerminationRequest: () => false,
            }),
        []
    );

    const seekToProgress = (progress: number) => {
        if (!isPlaying || !sound) return;

        const normalizedProgress = Math.min(1, Math.max(0, progress));
        setPlayProgress(normalizedProgress);
        sound.getStatusAsync().then((status) => {
            if (status.isLoaded && status.durationMillis) {
                sound.setPositionAsync(normalizedProgress * status.durationMillis).catch(() => {});
            }
        }).catch(() => {});
    };

    const isArabic = activeMode === 'arabic';

    const getArabicFont = (weight: 'regular' | 'bold' = 'regular') => {
        if (arabicFontFamily === 'noto-naskh') {
            return weight === 'bold' ? 'NotoNaskhArabic_700Bold' : 'NotoNaskhArabic_400Regular';
        }
        return weight === 'bold' ? 'Amiri_700Bold' : 'Amiri_400Regular';
    };

    const activeHighlightId = currentPlayingIndex !== null
        ? `${pageAyahs[currentPlayingIndex].surahNumber}_${pageAyahs[currentPlayingIndex].ayah.number}`
        : highlightedAyahId;

    return (
        <View style={[styles.cardContainer, { height: containerHeight, backgroundColor: theme.background }]}>
            {/* Header Information */}
            <View style={[styles.pageHeader, { borderBottomColor: theme.border }]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.surahTitle, { color: theme.text }]} numberOfLines={1}>
                        {pageTitle}
                    </Text>
                    <Text style={[styles.pageNumberText, { color: theme.muted }]}>
                        {language === 'tr' ? `Sayfa ${pageNumber}` : `Page ${pageNumber}`}
                    </Text>
                </View>

                {/* Header Action Buttons (Swapped: Arabic -> AI | Translation -> Play) */}
                <View style={styles.pageHeaderRight}>
                    {isArabic ? (
                        /* Arapça modunda: Sağ üstte Yapay Zeka Sohbet butonu */
                        <TouchableOpacity
                            style={[styles.headerAiButton, { backgroundColor: theme.primary }]}
                            onPress={() => {
                                const target = selectedAyah || pageAyahs[0];
                                setChatAyah(target || null);
                                if (target) void AnalyticsService.track('AI_CHAT_OPEN', { screen: 'page_reader', metadata: { surahNumber: target.surahNumber, ayahNumber: target.ayah.number } });
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={t('verse_chat.title', 'Ayet Üzerine Konuş')}
                        >
                            <Sparkles size={18} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        /* Meal modunda: Sağ üstte Sayfayı Dinle (Play) butonu */
                        <TouchableOpacity
                            style={[
                                styles.headerPlayBtn,
                                {
                                    backgroundColor: isPlaying ? theme.primary : theme.card,
                                    borderColor: theme.border,
                                }
                            ]}
                            onPress={handlePlayPause}
                            accessibilityRole="button"
                            accessibilityLabel={isPlaying ? t('common.pause', 'Durdur') : t('common.listen', 'Sayfayı Dinle')}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={isPlaying ? '#fff' : theme.primary} size="small" />
                            ) : isPlaying ? (
                                <Pause size={18} color="#fff" />
                            ) : (
                                <Play size={18} color={theme.primary} style={{ marginLeft: 2 }} />
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Hızlı Ayet Atlama Şeridi (Quick Ayah Navigation Strip) */}
            {pageAyahs.length > 1 && (
                <View style={[styles.ayahStripContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                    <View style={styles.ayahStripLabelWrap}>
                        <Compass size={13} color={theme.muted} style={{ marginRight: 4 }} />
                        <Text style={[styles.ayahStripLabel, { color: theme.muted }]}>
                            {t('common.ayah_short', 'Ayet')}:
                        </Text>
                    </View>
                    <ScrollView
                        ref={stripScrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.ayahStripScroll}
                    >
                        {pageAyahs.map((item) => {
                            const isSelected = selectedAyah?.ayah.number === item.ayah.number && selectedAyah?.surahNumber === item.surahNumber;
                            return (
                                <TouchableOpacity
                                    key={`${item.surahNumber}_${item.ayah.number}`}
                                    style={[
                                        styles.ayahChip,
                                        {
                                            backgroundColor: isSelected ? theme.primary : `${theme.primary}12`,
                                            borderColor: isSelected ? theme.primary : `${theme.primary}25`,
                                        }
                                    ]}
                                    onPress={() => {
                                        setSelectedAyahId(`${item.surahNumber}_${item.ayah.number}`);
                                        onAyahChange?.(item.surahNumber, item.ayah.number);
                                        scrollToAyah(item.ayah.number);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.ayahChipText, { color: isSelected ? '#fff' : theme.text }]}>
                                        {item.ayah.number}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Scrollable Content */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollArea}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: (sound || isPlaying || isLoading) ? 310 : 200 }
                ]}
                showsVerticalScrollIndicator={true}
                scrollEventThrottle={32}
                onScroll={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    if (y > 180 && !showBackToTop) {
                        setShowBackToTop(true);
                    } else if (y <= 180 && showBackToTop) {
                        setShowBackToTop(false);
                    }
                }}
            >
                {isArabic ? (
                    /* ARABIC FLOW LAYOUT */
                    <View style={styles.arabicFlowContainer}>
                        {(() => {
                            const { splitBismillah, isSajdahAyah, hasBismillah } = require('../utils/quranHelpers');
                            
                            // Group ayahs by surah to render surah dividers correctly
                            const groups: { surahName: string; surahNumber: number; items: typeof pageAyahs }[] = [];
                            pageAyahs.forEach(item => {
                                let lastGroup = groups[groups.length - 1];
                                if (!lastGroup || lastGroup.items[0].surahNumber !== item.surahNumber) {
                                    lastGroup = { surahName: item.surahName, surahNumber: item.surahNumber, items: [] };
                                    groups.push(lastGroup);
                                }
                                lastGroup.items.push(item);
                            });

                            const renderArabicWordText = (
                                word: string,
                                isWordActive: boolean,
                            ) => {
                                const cleanWord = word.replace(/[^\u0621-\u064A\u0671-\u06D3]/g, '');
                                const isAllah = cleanWord === 'الله' || cleanWord === 'اللَّه' || cleanWord === 'لله' || cleanWord === 'لِلَّهِ' || cleanWord === 'للَّه';
                                return (
                                    <Text
                                        style={[
                                            styles.arabicWordText,
                                            {
                                                fontFamily: getArabicFont(isWordActive ? 'bold' : 'regular'),
                                                color: isAllah ? '#D32F2F' : (isWordActive ? theme.primary : theme.text),
                                                fontSize: arabicFontSize,
                                                fontWeight: isAllah || isWordActive ? 'bold' : 'normal',
                                                backgroundColor: isWordActive ? `${theme.primary}18` : 'transparent',
                                            }
                                        ]}
                                    >
                                        {word}
                                    </Text>
                                );
                            };

                            return groups.map((group, gIdx) => {
                                const showPageBismillah = group.items[0].ayah.number === 1 && hasBismillah(group.surahNumber);
                                
                                return (
                                    <View key={`g_${gIdx}`} style={{ width: '100%', alignItems: 'flex-end' }}>
                                        {group.items[0].ayah.number === 1 && (
                                             <View style={[styles.surahDivider, { borderColor: theme.border, backgroundColor: theme.card }]}>
                                                 <Text style={[styles.surahDividerText, { color: theme.primary }]}>
                                                     {group.surahName}
                                                 </Text>
                                             </View>
                                        )}
                                        {showPageBismillah && (
                                             <View style={styles.pageBismillahContainer}>
                                                 <Text style={[styles.pageBismillahText, { color: theme.text, fontFamily: getArabicFont('bold') }]}>
                                                     {require('../utils/quranHelpers').BISMILLAH_ARABIC_UTHMANI}
                                                 </Text>
                                             </View>
                                        )}
                                        <Text style={[styles.arabicParagraphText, { lineHeight: Math.round(arabicFontSize * 1.85) }]}>
                                             {group.items.map((item) => {
                                                 const isHighlighted = activeHighlightId === `${item.surahNumber}_${item.ayah.number}`;
                                                 const isSajdah = isSajdahAyah(item.surahNumber, item.ayah.number);

                                                 let textToRender = item.ayah.arabic;
                                                 if (item.ayah.number === 1 && hasBismillah(item.surahNumber)) {
                                                     textToRender = splitBismillah(item.ayah.arabic).ayahText;
                                                 }

                                                 const words = textToRender.replace(/\s+/g, ' ').split(' ');
                                                 const pageAyahIndex = pageAyahs.findIndex(
                                                     (pageAyah) => pageAyah.ayah.globalNumber === item.ayah.globalNumber,
                                                 );

                                                 const isSelected = selectedAyahId === `${item.surahNumber}_${item.ayah.number}`;
                                                 return (
                                                     <React.Fragment key={item.ayah.globalNumber}>
                                                         <Text
                                                             style={[
                                                                 styles.ayahStartBadge,
                                                                 {
                                                                     fontFamily: getArabicFont('bold'),
                                                                     color: isHighlighted || isSelected ? activeBlue : inactiveBlue,
                                                                     backgroundColor: isHighlighted || isSelected ? activeBlueBg : 'transparent',
                                                                     borderRadius: 6,
                                                                     fontSize: Math.round(16 * (fontSizeScale || 1.0)),
                                                                 }
                                                             ]}
                                                             onLayout={(e) => {
                                                                 ayahYOffsetsRef.current[item.ayah.number] = e.nativeEvent.layout.y;
                                                             }}
                                                             onPress={() => {
                                                                 setSelectedAyahId(`${item.surahNumber}_${item.ayah.number}`);
                                                                 onAyahChange?.(item.surahNumber, item.ayah.number);
                                                                 if (pageAyahIndex >= 0) {
                                                                     void playAyahAtIndex(pageAyahIndex);
                                                                 }
                                                             }}
                                                         >
                                                             {` ﴿ `}
                                                         </Text>
                                                         {words.map((word, wIdx) => {
                                                             const isWordActive = isHighlighted && activeWordIndex === wIdx + 1;
                                                             return (
                                                                 <React.Fragment key={wIdx}>
                                                                     <Text onPress={() => {
                                                                         setSelectedAyahId(`${item.surahNumber}_${item.ayah.number}`);
                                                                         if (pageAyahIndex >= 0) {
                                                                             void playAyahAtIndex(pageAyahIndex, 0, false, wIdx + 1);
                                                                         }
                                                                     }}>
                                                                         {renderArabicWordText(word, isWordActive)}
                                                                     </Text>
                                                                     <Text> </Text>
                                                                 </React.Fragment>
                                                             );
                                                         })}
                                                         <Text
                                                             style={[
                                                                 styles.ayahNumberBadge,
                                                                 {
                                                                     fontFamily: getArabicFont('bold'),
                                                                     color: isHighlighted || isSelected ? activeBlue : inactiveBlue,
                                                                     backgroundColor: isHighlighted || isSelected ? activeBlueBg : 'transparent',
                                                                     borderRadius: 8,
                                                                     fontSize: Math.round(16 * (fontSizeScale || 1.0)),
                                                                 }
                                                             ]}
                                                             onPress={() => {
                                                                 setSelectedAyahId(`${item.surahNumber}_${item.ayah.number}`);
                                                                 if (pageAyahIndex >= 0) {
                                                                     void playAyahAtIndex(pageAyahIndex);
                                                                 }
                                                             }}
                                                         >
                                                             {` ﴾${toArabicDigits(item.ayah.number)}﴿ `}
                                                         </Text>
                                                         {isSajdah && (
                                                             <Text style={{ fontSize: Math.round(18 * (fontSizeScale || 1.0)), color: '#D32F2F', marginLeft: 2 }}>
                                                                 ۩
                                                             </Text>
                                                         )}
                                                     </React.Fragment>
                                                 );
                                             })}
                                        </Text>
                                    </View>
                                );
                            });
                        })()}
                    </View>
                ) : (
                    /* TRANSLATION VERTICAL LIST */
                    <View style={styles.translationContainer}>
                        {pageAyahs.map((item, index) => {
                            const { isSajdahAyah } = require('../utils/quranHelpers');
                            const isNewSurah = item.ayah.number === 1;
                            const isHighlighted = activeHighlightId === `${item.surahNumber}_${item.ayah.number}`;
                            const isSelected = selectedAyahId === `${item.surahNumber}_${item.ayah.number}`;
                            const isSajdah = isSajdahAyah(item.surahNumber, item.ayah.number);
                            
                            return (
                                <View key={item.ayah.globalNumber} style={styles.translationRow} onLayout={(e) => { ayahYOffsetsRef.current[item.ayah.number] = e.nativeEvent.layout.y; }}>
                                    {isNewSurah && (
                                        <View style={[styles.surahDivider, { borderColor: theme.border, backgroundColor: theme.card, marginBottom: 16 }]}>
                                            <Text style={[styles.surahDividerText, { color: theme.primary }]}>
                                                {item.surahName}
                                            </Text>
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        activeOpacity={0.75}
                                        onPress={() => { setSelectedAyahId(`${item.surahNumber}_${item.ayah.number}`); onAyahChange?.(item.surahNumber, item.ayah.number); }}
                                        style={[
                                            styles.translationCard,
                                            {
                                                backgroundColor: isHighlighted 
                                                    ? activeBlueBg 
                                                    : isSelected 
                                                        ? `${activeBlue}15` 
                                                        : 'transparent',
                                                borderColor: isHighlighted 
                                                    ? activeBlue 
                                                    : isSelected 
                                                        ? activeBlue 
                                                        : (isSajdah ? 'rgba(211, 47, 47, 0.3)' : 'transparent'),
                                                borderWidth: isHighlighted || isSelected ? 1.5 : 1,
                                                borderRadius: 12,
                                                padding: isHighlighted || isSelected || isSajdah ? 12 : 6,
                                            }
                                        ]}
                                    >
                                        <Text style={[styles.translationText, { color: theme.text, fontSize: translationFontSize, lineHeight: Math.round(translationFontSize * 1.6) }]}>
                                            <Text style={[styles.translationAyahNo, { color: isHighlighted || isSelected ? activeBlue : inactiveBlue, fontSize: Math.round(14 * (fontSizeScale || 1.0)) }]}>
                                                {`[${item.ayah.number}] `}
                                            </Text>
                                            {item.ayah.translations[translationLanguage as AppLanguage] || item.ayah.translations.tr}
                                            <Text style={[styles.translationAyahNo, { color: isHighlighted || isSelected ? activeBlue : inactiveBlue, fontWeight: '700', fontSize: Math.round(14 * (fontSizeScale || 1.0)) }]}>
                                                {` ﴾${item.ayah.number}﴿`}
                                            </Text>
                                            {isSajdah && (
                                                <Text style={{ color: '#D32F2F', fontWeight: 'bold', fontSize: Math.round(12 * (fontSizeScale || 1.0)) }}>
                                                    {` [۩ ${t('common.sajdah_warning_short', 'Secde Ayeti')}]`}
                                                </Text>
                                            )}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* Sabit Alt Kontrol Paneli (Ses Çalar Paneli + Seçili Ayet Aksiyon Barı + Footer Toggle) */}
            <View style={[styles.bottomControlPanel, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                {/* Aktif Ses Oynatıcı Paneli (Sayfa Modu İçin Ergonomik Alt Panel) */}
                {(sound || isPlaying || isLoading) && (
                    <View style={[styles.pageAudioDeck, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        {/* Üst Satır: Çalan Ayet + Tekrar + Hız + Kapat */}
                        <View style={styles.pageAudioDeckTop}>
                            <View style={styles.playingAyahIndicator}>
                                <View style={[styles.playingPulseDot, { backgroundColor: isPlaying ? '#4CAF50' : theme.primary }]} />
                                <Text style={[styles.playingAyahText, { color: theme.text }]} numberOfLines={1}>
                                    {currentPlayingIndex !== null && pageAyahs[currentPlayingIndex]
                                        ? `${pageAyahs[currentPlayingIndex].surahName} ${pageAyahs[currentPlayingIndex].ayah.number}`
                                        : `${pageTitle} (${language === 'tr' ? 'Sayfa' : 'Page'} ${pageNumber})`}
                                </Text>
                            </View>

                            <View style={styles.deckTopControls}>
                                <TouchableOpacity
                                    onPress={cycleRepeatCount}
                                    style={[styles.deckChip, { borderColor: theme.border, backgroundColor: theme.card }]}
                                    accessibilityLabel="Ayet tekrarı"
                                >
                                    <Repeat2 size={12} color={theme.primary} />
                                    <Text style={[styles.deckChipText, { color: theme.primary }]}>{repeatCount}x</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => void cyclePlaybackRate()}
                                    style={[styles.deckChip, { borderColor: theme.border, backgroundColor: theme.card }]}
                                    accessibilityLabel="Okuma hızı"
                                >
                                    <Text style={[styles.deckChipText, { color: theme.primary }]}>{playbackRate}×</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleStopAudio}
                                    style={styles.closeDeckBtn}
                                    accessibilityLabel="Durdur ve kapat"
                                >
                                    <X size={16} color={theme.muted} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Geniş İlerleme Çubuğu — PanResponder ve Geniş HitSlop ile Sayfa Kaydırmayı Önler */}
                        <View
                            style={styles.deckScrubberWrapper}
                            hitSlop={{ top: 16, bottom: 16, left: 12, right: 12 }}
                            onLayout={(e) => setPageTrackWidth(e.nativeEvent.layout.width)}
                            {...pagePanResponder.panHandlers}
                        >
                            <View style={[styles.deckTrackBg, { backgroundColor: theme.primary + '20' }]}>
                                <View style={[styles.deckTrackFill, { width: `${playProgress * 100}%`, backgroundColor: theme.primary }]} />
                                <View style={[styles.deckTrackThumb, { left: `${playProgress * 100}%`, backgroundColor: theme.primary }]} />
                            </View>
                        </View>

                        {/* Alt Kontroller: Geri/İleri 5s, Oynat/Duraklat, Süreler */}
                        <View style={styles.deckTransportRow}>
                            <Text style={[styles.deckTimeText, { color: theme.muted }]}>
                                {formatTime(positionMillis)}
                            </Text>

                            <View style={styles.deckTransportCluster}>
                                <TouchableOpacity
                                    onPress={() => void seekBy(-5)}
                                    style={[styles.deckSeekBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                                    accessibilityLabel="5 saniye geri"
                                    activeOpacity={0.7}
                                >
                                    <RotateCcw size={15} color={theme.primary} />
                                    <Text style={[styles.deckSeekNum, { color: theme.primary }]}>5</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handlePlayPause}
                                    style={[styles.deckMainPlayBtn, { backgroundColor: theme.primary }]}
                                    accessibilityLabel={isPlaying ? 'Durdur' : 'Oynat'}
                                    activeOpacity={0.8}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : isPlaying ? (
                                        <Pause size={20} color="#fff" />
                                    ) : (
                                        <Play size={20} color="#fff" style={{ marginLeft: 2 }} />
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => void seekBy(5)}
                                    style={[styles.deckSeekBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                                    accessibilityLabel="5 saniye ileri"
                                    activeOpacity={0.7}
                                >
                                    <RotateCw size={15} color={theme.primary} />
                                    <Text style={[styles.deckSeekNum, { color: theme.primary }]}>5</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.deckTimeText, { color: theme.muted }]}>
                                {formatTime(durationMillis)}
                            </Text>
                        </View>
                    </View>
                )}

                {selectedAyah && (
                    <View style={styles.selectedAyahContainer}>
                        <View style={styles.selectedAyahInfoRow}>
                            <Text style={[styles.selectedAyahInfoText, { color: theme.muted }]}>
                                {t('common.selected_ayah', 'Seçili Ayet')}: <Text style={{ color: theme.text, fontWeight: '700' }}>{selectedAyah.surahName} {selectedAyah.ayah.number}</Text>
                            </Text>
                        </View>
                        <AyahActionBar
                            surahNumber={selectedAyah.surahNumber}
                            ayahNumber={selectedAyah.ayah.number}
                            surahName={selectedAyah.surahName}
                            translation={selectedAyah.ayah.translations[translationLanguage as AppLanguage] || selectedAyah.ayah.translations.tr}
                            analyticsScreen="page_reader"
                            primaryAction={isArabic ? "play" : "ai"}
                            isPlaying={isPlaying && currentPlayingIndex !== null && pageAyahs[currentPlayingIndex]?.ayah.number === selectedAyah.ayah.number}
                            onPlayPress={() => {
                                const idx = pageAyahs.findIndex(p => p.ayah.number === selectedAyah.ayah.number && p.surahNumber === selectedAyah.surahNumber);
                                if (idx >= 0) {
                                    void playAyahAtIndex(idx);
                                } else {
                                    void handlePlayPause();
                                }
                            }}
                        />
                    </View>
                )}

                <View style={styles.pageBottomNavRow}>
                    <TouchableOpacity
                        style={[
                            styles.pageNavBtn,
                            {
                                backgroundColor: theme.background,
                                borderColor: theme.border,
                                opacity: pageNumber <= 1 ? 0.35 : 1,
                            }
                        ]}
                        disabled={pageNumber <= 1}
                        onPress={onPrevPage}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.prev_page', 'Önceki Sayfa')}
                        activeOpacity={0.7}
                    >
                        <ChevronLeft size={16} color={theme.text} />
                        <Text style={[styles.pageNavBtnText, { color: theme.text }]}>
                            {t('common.prev', 'Önceki')}
                        </Text>
                    </TouchableOpacity>

                    <View style={[styles.pillContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <TouchableOpacity
                            style={[
                                styles.pillButton,
                                isArabic && { backgroundColor: theme.primary }
                            ]}
                            onPress={() => onToggleMode('arabic')}
                        >
                            <Text
                                style={[
                                    styles.pillButtonText,
                                    { color: isArabic ? '#fff' : theme.muted }
                                ]}
                            >
                                {t('common.arabic')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.pillButton,
                                !isArabic && { backgroundColor: theme.primary }
                            ]}
                            onPress={() => onToggleMode('translation')}
                        >
                            <Text
                                style={[
                                    styles.pillButtonText,
                                    { color: !isArabic ? '#fff' : theme.muted }
                                ]}
                            >
                                {t('common.translation')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.pageNavBtn,
                            {
                                backgroundColor: theme.background,
                                borderColor: theme.border,
                                opacity: pageNumber >= 604 ? 0.35 : 1,
                            }
                        ]}
                        disabled={pageNumber >= 604}
                        onPress={onNextPage}
                        accessibilityRole="button"
                        accessibilityLabel={t('common.next_page', 'Sonraki Sayfa')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.pageNavBtnText, { color: theme.text }]}>
                            {t('common.next', 'Sonraki')}
                        </Text>
                        <ChevronRight size={16} color={theme.text} />
                    </TouchableOpacity>
                </View>
            </View>
            {/* Kayan Yukarı Çık Butonu (Floating Back-to-Top Button) */}
            {showBackToTop && (
                <TouchableOpacity
                    style={[
                        styles.floatingBackToTop,
                        {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                            bottom: (sound || isPlaying || isLoading)
                                ? (selectedAyah ? 295 : 240)
                                : 160,
                        }
                    ]}
                    onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}
                    activeOpacity={0.8}
                    accessibilityLabel={t("common.scroll_to_top", "Yukarı Çık")}
                >
                    <ChevronUp size={20} color={theme.primary} />
                </TouchableOpacity>
            )}

            {chatAyah && (
                <VerseChatModal
                    visible
                    onClose={() => setChatAyah(null)}
                    surahNumber={chatAyah.surahNumber}
                    ayahNumber={chatAyah.ayah.number}
                    reference={`${chatAyah.surahName} ${chatAyah.ayah.number}`}
                    translation={chatAyah.ayah.translations[translationLanguage as AppLanguage] || chatAyah.ayah.translations.tr}
                />
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    cardContainer: {
        width: '100%',
        flex: 1,
    },
    pageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    surahTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    pageNumberText: {
        fontSize: 13,
        fontWeight: '600',
    },
    pageHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerAiButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerPlayBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageAudioDeck: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
    },
    pageAudioDeckTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    playingAyahIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    playingPulseDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    playingAyahText: {
        fontSize: 12,
        fontWeight: '700',
    },
    deckTopControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    deckChip: {
        paddingHorizontal: 8,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },
    deckChipText: {
        fontSize: 11,
        fontWeight: '800',
    },
    closeDeckBtn: {
        padding: 4,
        marginLeft: 2,
        zIndex: 100,
    },
    deckScrubberWrapper: {
        width: '100%',
        height: 42,
        justifyContent: 'center',
    },
    deckTrackBg: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        position: 'relative',
    },
    deckTrackFill: {
        height: '100%',
        borderRadius: 3,
    },
    deckTrackThumb: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        top: -4,
        marginLeft: -7,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    deckTransportRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    deckTimeText: {
        fontSize: 11,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
        minWidth: 36,
    },
    deckTransportCluster: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    deckSeekBtn: {
        width: 34,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
    },
    deckSeekNum: {
        fontSize: 10,
        fontWeight: '800',
    },
    deckMainPlayBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 190, // Bottom control panel padding
    },
    arabicFlowContainer: {
        width: '100%',
    },
    pageBismillahContainer: {
        width: '100%',
        alignItems: 'center',
        marginVertical: 12,
        paddingBottom: 8,
    },
    pageBismillahText: {
        fontSize: 24,
        lineHeight: 38,
        textAlign: 'center',
    },
    arabicParagraphText: {
        textAlign: 'right',
        writingDirection: 'rtl',
        width: '100%',
    },
    arabicWordText: {
        textAlign: 'right',
    },
    ayahStartBadge: {
        textAlign: 'center',
    },
    ayahNumberBadge: {
        textAlign: 'center',
    },
    surahDivider: {
        width: '100%',
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 16,
    },
    surahDividerText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    translationContainer: {
        width: '100%',
        gap: 12,
    },
    translationRow: {
        width: '100%',
    },
    translationCard: {
        width: '100%',
    },
    translationText: {
        fontSize: 15,
        lineHeight: 23,
    },
    translationAyahNo: {
        fontWeight: '700',
        fontSize: 14,
    },
    bottomControlPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        gap: 10,
        alignItems: 'center',
    },
    selectedAyahContainer: {
        width: '100%',
        gap: 6,
    },
    selectedAyahInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    selectedAyahInfoText: {
        fontSize: 12,
        fontWeight: '500',
    },
    pageBottomNavRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 2,
    },
    pageNavBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        gap: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
    },
    pageNavBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    pillContainer: {
        flexDirection: 'row',
        borderRadius: 24,
        borderWidth: 1,
        padding: 4,
        width: 172,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    pillButton: {
        flex: 1,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pillButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    ayahStripContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    ayahStripLabelWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    ayahStripLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    ayahStripScroll: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingRight: 16,
    },
    ayahChip: {
        minWidth: 34,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    ayahChipText: {
        fontSize: 12,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    floatingBackToTop: {
        position: 'absolute',
        right: 18,
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99,
    },
});