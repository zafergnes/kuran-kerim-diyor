import React, { useMemo, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useUserStore } from '../store/userStore';
import { AppLanguage } from '../constants/languages';
import { useTranslation } from 'react-i18next';
import { getPageAyahs, PageAyahItem } from '../utils/quranHelpers';
import { Audio } from 'expo-av';
import { Play, Pause, Sparkles } from 'lucide-react-native';
import { GlobalAudioController } from '../services/globalAudioController';
import { VerseChatModal } from './VerseChatModal';
import { AnalyticsService } from '../services/analyticsService';

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
    highlightedAyahId: string | null;
    activeMode: 'arabic' | 'translation';
    onToggleMode: (mode: 'arabic' | 'translation') => void;
}

export const QuranPageCard: React.FC<QuranPageCardProps> = ({
    pageNumber,
    containerHeight,
    highlightedAyahId,
    activeMode,
    onToggleMode,
}) => {
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    
    const { language, arabicTranslationLang, arabicFontFamily, selectedReciter } = useUserStore();
    const translationLanguage = language === 'ar' ? arabicTranslationLang : language;
    
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);
    const [playProgress, setPlayProgress] = useState(0);
    const [chatAyah, setChatAyah] = useState<PageAyahItem | null>(null);

    // Fetch all ayahs on this page
    const pageAyahs = useMemo(() => {
        return getPageAyahs(pageNumber, language);
    }, [pageNumber, language]);

    // Primary surah name on this page (first ayah's surah)
    const pageTitle = useMemo(() => {
        if (pageAyahs.length === 0) return '';
        return pageAyahs[0].surahName;
    }, [pageAyahs]);

    const ownerId = `page_${pageNumber}`;

    useEffect(() => {
        return () => {
            GlobalAudioController.stop(ownerId);
        };
    }, [pageNumber]);

    useEffect(() => {
        if (sound) {
            GlobalAudioController.stop(ownerId);
        }
    }, [selectedReciter]);

    const playAyahAtIndex = async (index: number) => {
        if (index < 0 || index >= pageAyahs.length) {
            await GlobalAudioController.stop(ownerId);
            return;
        }

        setIsLoading(true);
        setCurrentPlayingIndex(index);
        setPlayProgress(0);

        try {
            const ayah = pageAyahs[index];
            const url = `https://cdn.islamic.network/quran/audio/64/${selectedReciter}/${ayah.ayah.globalNumber}.mp3`;

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: true }
            );

            setSound(newSound);
            setIsPlaying(true);

            newSound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded) {
                    if (status.durationMillis) {
                        setPlayProgress(status.positionMillis / status.durationMillis);
                    }
                    if (status.didJustFinish) {
                        newSound.unloadAsync().then(() => {
                            setSound(null);
                            playAyahAtIndex(index + 1);
                        });
                    }
                }
            });

            await GlobalAudioController.play(newSound, ownerId, () => {
                setIsPlaying(false);
                setCurrentPlayingIndex(null);
                setPlayProgress(0);
                setSound(null);
            });
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
            await GlobalAudioController.stop(ownerId);
        } else {
            if (sound) {
                await GlobalAudioController.play(sound, ownerId, () => {
                    setIsPlaying(false);
                    setCurrentPlayingIndex(null);
                    setPlayProgress(0);
                    setSound(null);
                });
                await sound.playAsync();
                setIsPlaying(true);
            } else {
                playAyahAtIndex(0);
            }
        }
    };

    const handleResponderGrantOrMove = (evt: any) => {
        const { locationX } = evt.nativeEvent;
        const width = 120;
        const percentage = Math.min(1, Math.max(0, locationX / width));
        
        setPlayProgress(percentage);

        if (sound) {
            sound.getStatusAsync().then(status => {
                if (status.isLoaded && status.durationMillis) {
                    const targetPos = percentage * status.durationMillis;
                    sound.setPositionAsync(targetPos).catch(() => {});
                }
            });
        }
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
                <View>
                    <Text style={[styles.surahTitle, { color: theme.text }]}>
                        {pageTitle}
                    </Text>
                    <Text style={[styles.pageNumberText, { color: theme.muted }]}>
                        {language === 'tr' ? `Sayfa ${pageNumber}` : `Page ${pageNumber}`}
                    </Text>
                </View>

                {/* Page Audio Player Controls */}
                <View style={styles.pageAudioControls}>
                    <TouchableOpacity
                        style={styles.compactAiButton}
                        onPress={() => {
                            const highlighted = pageAyahs.find((item) => `${item.surahNumber}_${item.ayah.number}` === activeHighlightId);
                            setChatAyah(highlighted || pageAyahs[0] || null);
                            const target = highlighted || pageAyahs[0];
                            if (target) void AnalyticsService.track('AI_CHAT_OPEN', { screen: 'page_reader', metadata: { surahNumber: target.surahNumber, ayahNumber: target.ayah.number } });
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={t('verse_chat.title', 'Ayet Üzerine Konuş')}
                    >
                        <Sparkles size={17} color={theme.primary} />
                    </TouchableOpacity>
                    {isPlaying && (
                        <View 
                            style={styles.progressBarContainer}
                            onStartShouldSetResponder={() => true}
                            onMoveShouldSetResponder={() => true}
                            onResponderGrant={handleResponderGrantOrMove}
                            onResponderMove={handleResponderGrantOrMove}
                        >
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${playProgress * 100}%`, backgroundColor: theme.primary }]} />
                                <View style={[styles.progressThumb, { left: `${playProgress * 100}%`, backgroundColor: theme.primary }]} />
                            </View>
                        </View>
                    )}
                    <TouchableOpacity style={styles.pageAudioBtn} onPress={handlePlayPause}>
                        {isLoading ? (
                            <ActivityIndicator color={theme.primary} size="small" />
                        ) : isPlaying ? (
                            <Pause size={20} color={theme.primary} />
                        ) : (
                            <Play size={20} color={theme.primary} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Scrollable Content */}
            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
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

                            const renderArabicWordText = (word: string, isHighlighted: boolean) => {
                                const cleanWord = word.replace(/[^\u0621-\u064A\u0671-\u06D3]/g, '');
                                const isAllah = cleanWord === 'الله' || cleanWord === 'اللَّه' || cleanWord === 'لله' || cleanWord === 'لِلَّهِ' || cleanWord === 'للَّه';
                                return (
                                    <Text
                                        style={[
                                            styles.arabicWordText,
                                            {
                                                fontFamily: getArabicFont(isHighlighted ? 'bold' : 'regular'),
                                                color: isHighlighted ? theme.primary : (isAllah ? '#D32F2F' : theme.text),
                                                fontSize: arabicFontFamily === 'noto-naskh' ? 21 : 23,
                                                fontWeight: isAllah ? 'bold' : 'normal',
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
                                        <Text style={styles.arabicParagraphText}>
                                            {group.items.map((item) => {
                                                const isHighlighted = activeHighlightId === `${item.surahNumber}_${item.ayah.number}`;
                                                const isSajdah = isSajdahAyah(item.surahNumber, item.ayah.number);

                                                let textToRender = item.ayah.arabic;
                                                if (item.ayah.number === 1 && hasBismillah(item.surahNumber)) {
                                                    textToRender = splitBismillah(item.ayah.arabic).ayahText;
                                                }

                                                const words = textToRender.replace(/\s+/g, ' ').split(' ');

                                                return (
                                                    <React.Fragment key={item.ayah.globalNumber}>
                                                        {words.map((word, wIdx) => (
                                                            <React.Fragment key={wIdx}>
                                                                {renderArabicWordText(word, isHighlighted)}
                                                                <Text> </Text>
                                                            </React.Fragment>
                                                        ))}
                                                        <Text
                                                            style={[
                                                                styles.ayahNumberBadge,
                                                                {
                                                                    fontFamily: getArabicFont('bold'),
                                                                    color: isHighlighted ? theme.primary : theme.muted,
                                                                    fontSize: 16,
                                                                }
                                                            ]}
                                                        >
                                                            {` ﴾${toArabicDigits(item.ayah.number)}﴿ `}
                                                        </Text>
                                                        {isSajdah && (
                                                            <Text style={{ fontSize: 18, color: theme.primary, marginLeft: 2 }}>
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
                            const isSajdah = isSajdahAyah(item.surahNumber, item.ayah.number);
                            
                            return (
                                <View key={item.ayah.globalNumber} style={styles.translationRow}>
                                    {isNewSurah && (
                                        <View style={[styles.surahDivider, { borderColor: theme.border, backgroundColor: theme.card, marginBottom: 16 }]}>
                                            <Text style={[styles.surahDividerText, { color: theme.primary }]}>
                                                {item.surahName}
                                            </Text>
                                        </View>
                                    )}
                                    <View
                                        style={[
                                            styles.translationCard,
                                            {
                                                backgroundColor: isHighlighted ? theme.primary + '10' : 'transparent',
                                                borderColor: isHighlighted ? theme.primary : (isSajdah ? 'rgba(211, 47, 47, 0.3)' : 'transparent'),
                                                borderWidth: 1,
                                                borderRadius: 12,
                                                padding: isHighlighted || isSajdah ? 12 : 4,
                                            }
                                        ]}
                                    >
                                        <Text style={[styles.translationText, { color: theme.text }]}>
                                            <Text style={[styles.translationAyahNo, { color: theme.primary }]}>
                                                {`[${item.ayah.number}] `}
                                            </Text>
                                            {item.ayah.translations[translationLanguage as AppLanguage] || item.ayah.translations.tr}
                                            {isSajdah && (
                                                <Text style={{ color: '#D32F2F', fontWeight: 'bold', fontSize: 12 }}>
                                                    {` [۩ ${t('common.sajdah_warning_short', 'Secde Ayeti')}]`}
                                                </Text>
                                            )}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* Sabit Alt Kontrol Paneli (Footer Toggle) */}
            <View style={[styles.footerToggleContainer, { borderTopColor: theme.border }]}>
                <View style={[styles.pillContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
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
            </View>
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
};

const styles = StyleSheet.create({
    cardContainer: {
        width: '100%',
        flex: 1,
    },
    pageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
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
    pageAudioControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pageAudioBtn: {
        padding: 6,
        marginLeft: 4,
    },
    compactAiButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(182, 154, 115, 0.10)',
        marginRight: 4,
    },
    progressBarContainer: {
        width: 120,
        height: 24,
        justifyContent: 'center',
        marginRight: 4,
    },
    progressBarBg: {
        width: 120,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(182, 154, 115, 0.2)',
        position: 'relative',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressThumb: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        top: -3,
        marginLeft: -6,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 100, // Toggle pill bottom padding
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
    footerToggleContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 16,
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        backgroundColor: 'transparent',
    },
    pillContainer: {
        flexDirection: 'row',
        borderRadius: 24,
        borderWidth: 1,
        padding: 4,
        width: 220,
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
});
