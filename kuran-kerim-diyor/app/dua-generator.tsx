import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Share,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ChevronLeft,
    Sparkles,
    Send,
    Share2,
    RotateCcw,
    BookOpen,
    Lightbulb,
    ShieldAlert,
    HelpCircle,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../hooks/useAppTheme';
import apiClient from '../services/apiClient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface InvokedName {
    arabic: string;
    transliteration: string;
    meaning: string;
}

interface GeneratedDua {
    inScope: boolean;
    title: string;
    introHamdSalavat: string;
    invokedNames: InvokedName[];
    quranOrHadithReference?: {
        arabic?: string;
        translation?: string;
        source?: string;
    };
    duaBody: string;
    conclusion: string;
    adabAdvice: string;
    refusalReason?: string;
}

export default function DuaGeneratorScreen() {
    const { t, i18n } = useTranslation();
    const { theme } = useAppTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ name?: string }>();

    const [intention, setIntention] = useState('');
    const [preferredName, setPreferredName] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<GeneratedDua | null>(null);
    const [error, setError] = useState<string | null>(null);

    const lang = useMemo(() => {
        const raw = (i18n.language || 'tr').toLowerCase().slice(0, 2);
        return ['tr', 'en', 'ar', 'de', 'fr', 'es'].includes(raw) ? raw : 'tr';
    }, [i18n.language]);

    useEffect(() => {
        if (params.name) {
            setPreferredName(decodeURIComponent(params.name));
        }
    }, [params.name]);

    const quickThemes = [
        {
            label: t('dua.theme_health', 'Şifa ve Sağlık'),
            text: t('dua.theme_health_text', 'Rabbimden bedenime ve ruhuma şifa, hastalıklarıma afiyet diliyorum.'),
            name: 'Eş-Şâfî',
        },
        {
            label: t('dua.theme_exam', 'Zihin Açıklığı ve Sınav'),
            text: t('dua.theme_exam_text', 'Gireceğim sınavda zihin açıklığı, heyecanımı yenmek ve muvaffakiyet diliyorum.'),
            name: 'El-Alîm',
        },
        {
            label: t('dua.theme_sustenance', 'Helal Rızık ve Bereket'),
            text: t('dua.theme_sustenance_text', 'İşimde bereket, helalinden bol kazanç ve borçlarımdan kurtulmak istiyorum.'),
            name: 'Er-Rezzâk',
        },
        {
            label: t('dua.theme_repentance', 'Tövbe ve Kalp Huzuru'),
            text: t('dua.theme_repentance_text', 'Geçmiş günahlarımdan pişmanım; kalbime inşirah, tevbemin kabulünü ve hidayet diliyorum.'),
            name: 'Et-Tevvâb',
        },
        {
            label: t('dua.theme_family', 'Aile ve Evlat'),
            text: t('dua.theme_family_text', 'Ailemde muhabbet, huzur ve hayırlı bir nesil nasip olmasını niyaz ediyorum.'),
            name: 'El-Vedûd',
        },
        {
            label: t('dua.theme_anxiety', 'Keder ve Kaygı'),
            text: t('dua.theme_anxiety_text', "İçimdeki daralma, keder ve gelecek endişesinden kurtulup Allah'a tevekkül etmek istiyorum."),
            name: 'El-Fettâh',
        },
    ];

    const handleSubmit = async () => {
        if (!intention.trim() || loading) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await apiClient.post('/dua-generator', {
                intention: intention.trim(),
                language: lang,
                preferredName: preferredName.trim() || undefined,
            }, { timeout: 60000 });
            setResult(res.data);
        } catch (err: any) {
            if (err.response?.status === 503) {
                setError(t('dua.error_not_configured', 'Yapay zeka dua servisi şu anda aktif değil. Lütfen daha sonra tekrar deneyiniz.'));
            } else if (err.response?.status === 429) {
                setError(t('dua.error_rate_limited', 'Çok fazla istek gönderdiniz. Lütfen birkaç dakika sonra tekrar deneyiniz.'));
            } else if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
                setError(t('dua.error_timeout', 'Dua hazırlanması beklenenden uzun sürdü. Lütfen tekrar deneyiniz.'));
            } else {
                setError(t('dua.error_general', 'Dua oluşturulurken bir sorun oluştu. Lütfen niyetinizi kontrol edip tekrar deneyiniz.'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!result) return;
        const namesStr = result.invokedNames
            .map((n) => `${n.arabic} (${n.transliteration} - ${n.meaning})`)
            .join(', ');

        const text = `${result.title}\n\n${result.introHamdSalavat}\n\n${
            namesStr ? `[Esma-ül Hüsna: ${namesStr}]\n\n` : ''
        }${
            result.quranOrHadithReference?.arabic
                ? `${result.quranOrHadithReference.arabic}\n${result.quranOrHadithReference.translation} (${result.quranOrHadithReference.source})\n\n`
                : ''
        }${result.duaBody}\n\n${result.conclusion}\n\n[Âdâb-ı Duâ: ${result.adabAdvice}]\n\nKur'an Ne Diyor?`;

        try {
            await Share.share({ message: text });
        } catch {
            // Ignore
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[
                styles.header, 
                { 
                    borderBottomColor: theme.border, 
                    backgroundColor: theme.card,
                    paddingTop: Math.max(insets.top, 16) + 10,
                }
            ]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {t('dua.title', 'AI Dua Asistanı')}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView 
                contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 40 }]} 
                showsVerticalScrollIndicator={false}
            >
                {/* Verse Banner */}
                <View style={[styles.verseBanner, { backgroundColor: 'rgba(182, 154, 115, 0.1)', borderColor: 'rgba(182, 154, 115, 0.25)' }]}>
                    <Text style={[styles.verseArabic, { color: theme.primary }]}>
                        وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ
                    </Text>
                    <Text style={[styles.verseTranslation, { color: theme.secondary }]}>
                        {t('dua.verse_quote', "“Rabbiniz buyurdu ki: Bana dua edin, size icabet edeyim.” (Mü’min, 40/60)")}
                    </Text>
                </View>

                {/* Form Card */}
                <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>
                        {t('dua.input_label', "Allah'tan Ne Dilemek İstiyorsunuz?")}
                    </Text>
                    <Text style={[styles.inputDesc, { color: theme.muted }]}>
                        {t('dua.input_desc_mobile', 'İçinizden geçen samimi arzunuzu veya niyetinizi yazın. Sistem İslami dua âdâbına uygun şekilde duanızı hazırlasın.')}
                    </Text>

                    <TextInput
                        value={intention}
                        onChangeText={setIntention}
                        multiline={true}
                        numberOfLines={4}
                        placeholder={t('dua.input_placeholder', 'Örneğin: Sınavımda zihin açıklığı, heyecanımı yenmek ve muvaffakiyet diliyorum...')}
                        placeholderTextColor={theme.muted}
                        style={[styles.textArea, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                    />

                    {/* Preferred Divine Name */}
                    <View style={styles.preferredNameRow}>
                        <Lightbulb size={15} color={theme.primary} />
                        <Text style={[styles.preferredNameLabel, { color: theme.secondary }]}>
                            {t('dua.preferred_name_short', 'Özel İsim (opsiyonel):')}
                        </Text>
                        <TextInput
                            value={preferredName}
                            onChangeText={setPreferredName}
                            placeholder="Örn: Er-Rezzâk"
                            placeholderTextColor={theme.muted}
                            style={[styles.preferredNameInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                        />
                    </View>

                    {/* Quick Suggestions */}
                    <Text style={[styles.quickTitle, { color: theme.muted }]}>
                        {t('dua.quick_themes', 'Hızlı Niyet Örnekleri:')}
                    </Text>
                    <View style={styles.quickChipsContainer}>
                        {quickThemes.map((item, idx) => (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => {
                                    setIntention(item.text);
                                    setPreferredName(item.name);
                                }}
                                style={[styles.chip, { backgroundColor: theme.background, borderColor: theme.border }]}
                            >
                                <Text style={[styles.chipText, { color: theme.secondary }]}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={!intention.trim() || loading}
                        style={[styles.submitButton, { backgroundColor: theme.primary }, (!intention.trim() || loading) && { opacity: 0.6 }]}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Sparkles size={18} color="#fff" />
                                <Text style={styles.submitButtonText}>
                                    {t('dua.generate_button', 'Dua Oluştur')}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Error */}
                {error && (
                    <View style={[styles.errorCard, { backgroundColor: 'rgba(211, 47, 47, 0.1)', borderColor: 'rgba(211, 47, 47, 0.25)' }]}>
                        <ShieldAlert size={20} color="#D32F2F" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Result Card */}
                {result && (
                    <View style={styles.resultWrapper}>
                        {!result.inScope ? (
                            <View style={[styles.refusalCard, { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                                <View style={styles.refusalHeader}>
                                    <HelpCircle size={18} color="#D97706" />
                                    <Text style={styles.refusalTitle}>{result.title}</Text>
                                </View>
                                <Text style={[styles.refusalText, { color: theme.secondary }]}>
                                    {result.refusalReason}
                                </Text>
                            </View>
                        ) : (
                            <View style={[styles.duaCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                {/* Header */}
                                <View style={styles.cardTop}>
                                    <View style={[styles.badge, { backgroundColor: 'rgba(182, 154, 115, 0.15)' }]}>
                                        <Sparkles size={13} color={theme.primary} />
                                        <Text style={[styles.badgeText, { color: theme.primary }]}>
                                            {t('dua.card_badge', 'Âdâb-ı Duâ')}
                                        </Text>
                                    </View>
                                    <View style={styles.topActions}>
                                        <TouchableOpacity onPress={handleShare} style={[styles.iconActionBtn, { borderColor: theme.border }]}>
                                            <Share2 size={16} color={theme.text} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setResult(null);
                                                setIntention('');
                                            }}
                                            style={[styles.iconActionBtn, { borderColor: theme.border }]}
                                        >
                                            <RotateCcw size={16} color={theme.muted} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <Text style={[styles.duaTitle, { color: theme.text }]}>
                                    {result.title}
                                </Text>

                                {/* 1. Hamd & Salavat */}
                                <View style={[styles.hamdBox, { backgroundColor: 'rgba(182, 154, 115, 0.08)', borderColor: 'rgba(182, 154, 115, 0.2)' }]}>
                                    <Text style={[styles.sectionLabel, { color: theme.primary }]}>
                                        {t('dua.hamd_heading', 'Hamd ve Salavat ile Başlangıç')}
                                    </Text>
                                    <Text style={[styles.hamdText, { color: theme.text }]}>
                                        {result.introHamdSalavat}
                                    </Text>
                                </View>

                                {/* 2. Invoked Names */}
                                {result.invokedNames && result.invokedNames.length > 0 && (
                                    <View style={styles.namesSection}>
                                        <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                                            {t('dua.invoked_names_heading', 'Tevessül Edilen Esma-ül Hüsna:')}
                                        </Text>
                                        <View style={styles.namesList}>
                                            {result.invokedNames.map((n, i) => (
                                                <View key={i} style={[styles.namePill, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[styles.nameTrans, { color: theme.text }]}>{n.transliteration}</Text>
                                                        <Text style={[styles.nameMeaning, { color: theme.muted }]} numberOfLines={1}>{n.meaning}</Text>
                                                    </View>
                                                    <Text style={[styles.nameArabic, { color: theme.primary }]}>{n.arabic}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* 3. Quran / Hadith Reference */}
                                {result.quranOrHadithReference?.arabic && (
                                    <View style={[styles.verseRefBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                        <View style={styles.verseRefHeader}>
                                            <BookOpen size={14} color={theme.primary} />
                                            <Text style={[styles.verseRefSource, { color: theme.primary }]}>
                                                {result.quranOrHadithReference.source}
                                            </Text>
                                        </View>
                                        <Text style={[styles.verseRefArabic, { color: theme.primary }]}>
                                            {result.quranOrHadithReference.arabic}
                                        </Text>
                                        <Text style={[styles.verseRefTranslation, { color: theme.secondary }]}>
                                            {result.quranOrHadithReference.translation}
                                        </Text>
                                    </View>
                                )}

                                {/* 4. Core Dua Body */}
                                <View style={styles.bodySection}>
                                    <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                                        {t('dua.body_heading', 'Gönülden Yakarış (Münacat):')}
                                    </Text>
                                    <View style={[styles.bodyCard, { backgroundColor: theme.background }]}>
                                        <Text style={[styles.duaBodyText, { color: theme.text }]}>
                                            {result.duaBody}
                                        </Text>
                                    </View>
                                </View>

                                {/* 5. Conclusion */}
                                <View style={[styles.conclusionBox, { backgroundColor: 'rgba(182, 154, 115, 0.08)' }]}>
                                    <Text style={[styles.conclusionText, { color: theme.text }]}>
                                        {result.conclusion}
                                    </Text>
                                </View>

                                {/* 6. Adab Tip */}
                                {result.adabAdvice && (
                                    <View style={[styles.adabCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                        <Lightbulb size={16} color={theme.primary} style={{ marginTop: 2 }} />
                                        <Text style={[styles.adabText, { color: theme.secondary }]}>
                                            <Text style={{ fontWeight: 'bold', color: theme.text }}>
                                                {t('dua.adab_tip', 'Sünnet Tavsiyesi')}:{' '}
                                            </Text>
                                            {result.adabAdvice}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 14,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    verseBanner: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 16,
    },
    verseArabic: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    verseTranslation: {
        fontSize: 12,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    formCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    inputDesc: {
        fontSize: 12,
        lineHeight: 17,
        marginBottom: 10,
    },
    textArea: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        fontSize: 14,
        minHeight: 90,
        textAlignVertical: 'top',
        marginBottom: 12,
    },
    preferredNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 14,
    },
    preferredNameLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    preferredNameInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        fontSize: 12,
    },
    quickTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    quickChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 16,
    },
    chip: {
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    chipText: {
        fontSize: 11,
        fontWeight: '500',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    errorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        gap: 10,
        marginBottom: 16,
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 13,
        flex: 1,
    },
    resultWrapper: {
        marginTop: 4,
    },
    refusalCard: {
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
    },
    refusalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    refusalTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#D97706',
    },
    refusalText: {
        fontSize: 13,
        lineHeight: 19,
    },
    duaCard: {
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    topActions: {
        flexDirection: 'row',
        gap: 6,
    },
    iconActionBtn: {
        padding: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    duaTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 14,
    },
    hamdBox: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 14,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    hamdText: {
        fontSize: 13,
        lineHeight: 19,
        fontWeight: '500',
    },
    namesSection: {
        marginBottom: 14,
    },
    namesList: {
        gap: 6,
    },
    namePill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    nameTrans: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    nameMeaning: {
        fontSize: 11,
    },
    nameArabic: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    verseRefBox: {
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 14,
    },
    verseRefHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    verseRefSource: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    verseRefArabic: {
        fontSize: 17,
        fontWeight: 'bold',
        textAlign: 'right',
        marginBottom: 4,
    },
    verseRefTranslation: {
        fontSize: 11,
        fontStyle: 'italic',
    },
    bodySection: {
        marginBottom: 14,
    },
    bodyCard: {
        padding: 14,
        borderRadius: 12,
    },
    duaBodyText: {
        fontSize: 15,
        lineHeight: 24,
    },
    conclusionBox: {
        padding: 12,
        borderRadius: 10,
        marginBottom: 14,
        alignItems: 'center',
    },
    conclusionText: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    adabCard: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        gap: 8,
    },
    adabText: {
        fontSize: 12,
        lineHeight: 18,
        flex: 1,
    },
});
