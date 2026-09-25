import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { Ayah } from '../services/quranData';
import { useUserStore } from '../store/userStore';
import { ChevronRight, BookOpen } from 'lucide-react-native';
import { AudioPlayer } from './AudioPlayer';
import { AyahActionBar } from './AyahActionBar';
import { useTranslation } from 'react-i18next';
import { splitBismillah, isSajdahAyah, hasBismillah } from '../utils/quranHelpers';

interface AyahCardProps {
    ayah: Ayah;
    surahName: string;
    surahNumber: number;
    onAudioInteractionChange?: (isInteracting: boolean) => void;
    isLastAyah?: boolean;
    nextSurahName?: string;
    onNextSurah?: () => void;
}

export const AyahCard = React.memo(function AyahCard({ ayah, surahName, surahNumber, onAudioInteractionChange, isLastAyah, nextSurahName, onNextSurah }: AyahCardProps) {
    const { language, showArabicTranslation, arabicTranslationLang, selectedArabicScript, fontSizeScale } = useUserStore();
    const { theme } = useAppTheme();
    const [audioProgress, setAudioProgress] = useState(0);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const nextSurahAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isLastAyah) {
            Animated.spring(nextSurahAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 60,
                friction: 8,
                delay: 300,
            }).start();
        } else {
            nextSurahAnim.setValue(0);
        }
    }, [isLastAyah]);
    const [seekProgress, setSeekProgress] = useState<number | null>(null);
    const { t } = useTranslation();

    // Arapca kullanici: meal tercihine gore goster/gizle
    const isArabicUser = language === 'ar';
    const displayLang = isArabicUser ? arabicTranslationLang : language;
    const translationText = ayah.translations[displayLang];
    const shouldShowTranslation = !isArabicUser || showArabicTranslation;

    const rawArabicText = (selectedArabicScript === 'diyanet' && ayah.arabicDiyanet) ? ayah.arabicDiyanet : ayah.arabic;

    // Besmele ayrıştırma
    let bismillahToRender: string | null = null;
    let finalArabicText = rawArabicText;
    
    if (ayah.number === 1 && hasBismillah(surahNumber)) {
        const splitResult = splitBismillah(rawArabicText);
        bismillahToRender = splitResult.bismillah;
        finalArabicText = splitResult.ayahText;
    }

    // Lafzatullah renklendirme (Allah ve lillah lafizlari) - Arapça hat bütünlüğünü korumak için kelimeler bölünmez
    const renderArabicText = (text: string) => {
        const words = text.split(/\s+/);

        return words.map((word, index) => {
            // Arapcadaki Allah ve Lillah kelimeleri (farkli harekelere ve harflere gore)
            const cleanWord = word.replace(/[^\u0621-\u064A\u0671-\u06D3]/g, '');
            const isAllah = cleanWord === 'الله' || cleanWord === 'اللَّه' || cleanWord === 'لله' || cleanWord === 'لِلَّهِ' || cleanWord === 'للَّه';

            return (
                <Text 
                    key={index} 
                    style={{ 
                        color: isAllah ? '#D32F2F' : theme.text,
                        fontWeight: isAllah ? 'bold' : 'normal'
                    }}
                >
                    {word}{index < words.length - 1 ? ' ' : ''}
                </Text>
            );
        });
    };

    const isSajdah = isSajdahAyah(surahNumber, ayah.number);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentInner}
                showsVerticalScrollIndicator={false}
            >
                {bismillahToRender && (
                    <View style={styles.bismillahContainer}>
                        <Text style={[styles.bismillahText, { color: theme.text }]}>
                            {bismillahToRender}
                        </Text>
                    </View>
                )}

                {isSajdah && (
                    <View style={[styles.sajdahBadge, { backgroundColor: 'rgba(182, 154, 115, 0.15)', borderColor: theme.primary }]}>
                        <Text style={[styles.sajdahBadgeText, { color: theme.primary }]}>
                            ۩ {t('common.sajdah', 'Secde Ayeti')}
                        </Text>
                    </View>
                )}

                <Text
                    style={[
                        styles.arabicText,
                        {
                            color: theme.text,
                            fontSize: Math.round(34 * (fontSizeScale || 1.0)),
                            lineHeight: Math.round(56 * (fontSizeScale || 1.0)),
                        }
                    ]}
                >
                    {renderArabicText(finalArabicText.replace(/\s+/g, '\u2002'))}
                </Text>

                {shouldShowTranslation && translationText ? (
                    <View style={{ alignItems: 'center' }}>
                        <Text
                            style={[
                                styles.translationText,
                                {
                                    color: theme.secondary,
                                    fontSize: Math.round(18 * (fontSizeScale || 1.0)),
                                    lineHeight: Math.round(28 * (fontSizeScale || 1.0)),
                                }
                            ]}
                        >
                            {translationText}
                        </Text>
                        {isSajdah && (
                            <Text style={styles.sajdahWarningText}>
                                ⚠️ {t('common.sajdah_warning', 'Bu ayet okunduğunda veya dinlendiğinde Tilavet Secdesi yapılması gerekir.')}
                            </Text>
                        )}
                    </View>
                ) : null}
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.metaRow}>
                    <Text style={[styles.metaText, { color: theme.muted }]}>
                        {surahName} • {t('common.ayah')} {ayah.number}
                    </Text>
                </View>

                <AudioPlayer
                    globalAyahNumber={ayah.globalNumber}
                    onProgressChange={setAudioProgress}
                    seekProgress={seekProgress}
                    onPlayingChange={setIsAudioPlaying}
                    onScrubbingChange={onAudioInteractionChange}
                />

                <AyahActionBar
                    surahNumber={surahNumber}
                    ayahNumber={ayah.number}
                    surahName={surahName}
                    translation={translationText || rawArabicText}
                    analyticsScreen="single_verse"
                />
            </View>

            {/* Son ayet: Sonraki Sure kartı */}
            {isLastAyah && nextSurahName && onNextSurah && (
                <Animated.View
                    style={[
                        styles.nextSurahBanner,
                        { backgroundColor: theme.card, borderColor: theme.primary },
                        {
                            opacity: nextSurahAnim,
                            transform: [{
                                translateY: nextSurahAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [24, 0],
                                }),
                            }],
                        },
                    ]}
                >
                    <View style={styles.nextSurahLabel}>
                        <BookOpen size={14} color={theme.muted} />
                        <Text style={[styles.nextSurahLabelText, { color: theme.muted }]}>
                            {t('common.next_surah', 'Sonraki Sure')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.nextSurahBtn, { backgroundColor: theme.primary }]}
                        onPress={onNextSurah}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.nextSurahBtnText}>{nextSurahName}</Text>
                        <ChevronRight size={18} color="#fff" />
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        paddingTop: 16,
        paddingBottom: 20,
        paddingHorizontal: 16,
    },
    content: {
        flex: 1,
        width: '100%',
    },
    contentInner: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 24,
        paddingRight: 36,
        paddingLeft: 8,
    },
    bismillahContainer: {
        marginBottom: 20,
        alignItems: 'center',
        width: '100%',
    },
    bismillahText: {
        fontFamily: 'Amiri_700Bold',
        fontSize: 28,
        lineHeight: 48,
        textAlign: 'center',
        writingDirection: 'rtl',
    },
    sajdahBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sajdahBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    sajdahWarningText: {
        fontSize: 12,
        color: '#D32F2F',
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic',
        fontWeight: '600',
        paddingHorizontal: 20,
    },
    arabicText: {
        fontFamily: 'Amiri_700Bold',
        fontSize: 34,
        lineHeight: 78,
        textAlign: 'center',
        writingDirection: 'rtl',
        marginBottom: 40,
    },
    translationText: {
        fontSize: 18,
        lineHeight: 28,
        textAlign: 'center',
    },
    footer: {
        paddingTop: 8,
        paddingBottom: 4,
        gap: 10,
        width: '100%',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 2,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    nextSurahBanner: {
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        padding: 14,
        gap: 10,
    },
    nextSurahLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    nextSurahLabelText: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    nextSurahBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
    },
    nextSurahBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
