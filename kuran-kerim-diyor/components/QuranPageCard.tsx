import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
} from 'react-native';
import { Colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';
import { AppLanguage } from '../constants/languages';
import { getPageAyahs, PageAyahItem } from '../utils/quranHelpers';

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
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
    
    const { language, arabicFontFamily } = useUserStore();
    
    // Fetch all ayahs on this page
    const pageAyahs = useMemo(() => {
        return getPageAyahs(pageNumber, language);
    }, [pageNumber, language]);

    // Primary surah name on this page (first ayah's surah)
    const pageTitle = useMemo(() => {
        if (pageAyahs.length === 0) return '';
        return pageAyahs[0].surahName;
    }, [pageAyahs]);

    const isArabic = activeMode === 'arabic';

    const getArabicFont = (weight: 'regular' | 'bold' = 'regular') => {
        if (arabicFontFamily === 'noto-naskh') {
            return weight === 'bold' ? 'NotoNaskhArabic_700Bold' : 'NotoNaskhArabic_400Regular';
        }
        return weight === 'bold' ? 'Amiri_700Bold' : 'Amiri_400Regular';
    };

    return (
        <View style={[styles.cardContainer, { height: containerHeight }]}>
            {/* Header Information */}
            <View style={[styles.pageHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.surahTitle, { color: theme.text }]}>
                    {pageTitle}
                </Text>
                <Text style={[styles.pageNumberText, { color: theme.muted }]}>
                    {language === 'tr' ? `Sayfa ${pageNumber}` : `Page ${pageNumber}`}
                </Text>
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
                        {pageAyahs.map((item, index) => {
                            const isNewSurah = item.ayah.number === 1;
                            const isHighlighted = highlightedAyahId === `${item.surahNumber}_${item.ayah.number}`;
                            
                            return (
                                <React.Fragment key={item.ayah.globalNumber}>
                                    {isNewSurah && (
                                        <View style={[styles.surahDivider, { borderColor: theme.border, backgroundColor: theme.card }]}>
                                            <Text style={[styles.surahDividerText, { color: theme.primary }]}>
                                                {item.surahName}
                                            </Text>
                                        </View>
                                    )}
                                    <Text style={{ textAlign: 'right', writingDirection: 'rtl' }}>
                                        <Text
                                            style={[
                                                styles.arabicWordText,
                                                {
                                                    fontFamily: getArabicFont(isHighlighted ? 'bold' : 'regular'),
                                                    color: isHighlighted ? theme.primary : theme.text,
                                                    fontSize: arabicFontFamily === 'noto-naskh' ? 24 : 26,
                                                    lineHeight: arabicFontFamily === 'noto-naskh' ? 44 : 48,
                                                }
                                            ]}
                                        >
                                            {item.ayah.arabic}
                                        </Text>
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
                                            {` ﴾${item.ayah.number}﴿ `}
                                        </Text>
                                    </Text>
                                </React.Fragment>
                            );
                        })}
                    </View>
                ) : (
                    /* TRANSLATION VERTICAL LIST */
                    <View style={styles.translationContainer}>
                        {pageAyahs.map((item, index) => {
                            const isNewSurah = item.ayah.number === 1;
                            const isHighlighted = highlightedAyahId === `${item.surahNumber}_${item.ayah.number}`;
                            
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
                                                borderColor: isHighlighted ? theme.primary : 'transparent',
                                                borderWidth: 1,
                                                borderRadius: 12,
                                                padding: isHighlighted ? 12 : 4,
                                            }
                                        ]}
                                    >
                                        <Text style={[styles.translationText, { color: theme.text }]}>
                                            <Text style={[styles.translationAyahNo, { color: theme.primary }]}>
                                                {`[${item.ayah.number}] `}
                                            </Text>
                                            {item.ayah.translations[language as AppLanguage] || item.ayah.translations.tr}
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
                            {language === 'tr' ? 'Arapça' : 'Arabic'}
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
                            {language === 'tr' ? 'Meal' : 'Translation'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
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
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 100, // Toggle pill bottom padding
    },
    arabicFlowContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        alignItems: 'center',
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
