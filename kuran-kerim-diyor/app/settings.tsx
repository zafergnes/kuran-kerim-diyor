import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    useColorScheme,
    Modal,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
    Bell,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    Globe,
    Check,
    Headphones,
    Play,
    Pause,
    Type,
} from 'lucide-react-native';
import { Audio } from 'expo-av';
import { Colors } from '../constants/colors';
import { useUserStore } from '../store/userStore';
import { LANGUAGES, AppLanguage } from '../constants/languages';

// Arapca kullanicilar icin meal dilinden hariclenenler
const TRANSLATION_LANGS = (Object.keys(LANGUAGES) as AppLanguage[]).filter(l => l !== 'ar');

export default function SettingsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
    const { t } = useTranslation();

    const {
        language,
        showArabicTranslation,
        arabicTranslationLang,
        setShowArabicTranslation,
        setArabicTranslationLang,
        selectedReciter,
        setSelectedReciter,
        readingLayout,
        setReadingLayout,
        arabicFontFamily,
        setArabicFontFamily,
    } = useUserStore();

    const isArabicUser = language === 'ar';
    const [showLangPicker, setShowLangPicker] = useState(false);
    const [showReciterPicker, setShowReciterPicker] = useState(false);
    const [showLayoutPicker, setShowLayoutPicker] = useState(false);
    const [showFontPicker, setShowFontPicker] = useState(false);

    const [previewSound, setPreviewSound] = useState<Audio.Sound | null>(null);
    const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    useEffect(() => {
        return () => {
            if (previewSound) {
                previewSound.unloadAsync();
            }
        };
    }, [previewSound]);

    const handlePreviewPlayPause = async (reciterId: string) => {
        if (isPreviewLoading) return;

        if (previewSound && playingPreviewId === reciterId) {
            await previewSound.unloadAsync();
            setPreviewSound(null);
            setPlayingPreviewId(null);
            return;
        }

        if (previewSound) {
            await previewSound.unloadAsync();
            setPreviewSound(null);
            setPlayingPreviewId(null);
        }

        setIsPreviewLoading(true);
        setPlayingPreviewId(reciterId);

        try {
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
            });

            const url = `https://cdn.islamic.network/quran/audio/64/${reciterId}/1.mp3`;

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: true }
            );

            setPreviewSound(newSound);

            newSound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded && status.didJustFinish) {
                    setPlayingPreviewId(null);
                    setPreviewSound(null);
                }
            });
        } catch (e) {
            console.error("Preview playback error:", e);
            setPlayingPreviewId(null);
            setPreviewSound(null);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleCloseReciterPicker = async () => {
        setShowReciterPicker(false);
        if (previewSound) {
            await previewSound.unloadAsync();
            setPreviewSound(null);
            setPlayingPreviewId(null);
        }
    };

    const RECITERS = [
        { id: 'ar.alafasy', initials: 'MA' },
        { id: 'ar.sudais', initials: 'AS' },
        { id: 'ar.ghamadi', initials: 'SG' },
        { id: 'ar.abdulbasitmurattal', initials: 'AB' }
    ];

    const handleNotificationPress = () => {
        // Bildirim izni isteme - ilerleyen sureclerde implement edilecek
        Alert.alert('', t('settings.coming_soon'));
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ChevronLeft size={24} color={theme.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {t('settings.title')}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* ── BİLDİRİMLER ── */}
                <Text style={[styles.sectionHeader, { color: theme.muted }]}>
                    {t('settings.notifications_section')}
                </Text>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <TouchableOpacity style={styles.row} onPress={handleNotificationPress}>
                        <View style={styles.rowLeft}>
                            <View style={[styles.iconWrap, { backgroundColor: 'rgba(255, 149, 0, 0.12)' }]}>
                                <Bell size={20} color="#FF9500" />
                            </View>
                            <View>
                                <Text style={[styles.rowTitle, { color: theme.text }]}>
                                    {t('settings.notification_permission')}
                                </Text>
                                <Text style={[styles.rowSub, { color: theme.muted }]}>
                                    {t('settings.notification_permission_sub')}
                                </Text>
                            </View>
                        </View>
                        <ChevronRight size={18} color={theme.muted} />
                    </TouchableOpacity>
                </View>

                {/* ── OKUMA TERCİHLERİ ── */}
                <Text style={[styles.sectionHeader, { color: theme.muted }]}>
                    {t('settings.reading_section')}
                </Text>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>

                    {/* Arapça kullanıcıya özel: Meal Toggle */}
                    {isArabicUser && (
                        <>
                            <View style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
                                <View style={styles.rowLeft}>
                                    <View style={[styles.iconWrap, { backgroundColor: 'rgba(182, 154, 115, 0.12)' }]}>
                                        <BookOpen size={20} color={theme.primary} />
                                    </View>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={[styles.rowTitle, { color: theme.text }]}>
                                            {t('settings.show_translation')}
                                        </Text>
                                        <Text style={[styles.rowSub, { color: theme.muted }]}>
                                            {t('settings.show_translation_sub')}
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={showArabicTranslation}
                                    onValueChange={setShowArabicTranslation}
                                    trackColor={{ false: theme.border, true: theme.primary }}
                                    thumbColor="#fff"
                                />
                            </View>

                            {/* Meal dili seçici — sadece toggle açıkken aktif */}
                            <TouchableOpacity
                                style={[styles.row, !showArabicTranslation && styles.rowDisabled, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}
                                onPress={() => showArabicTranslation && setShowLangPicker(true)}
                                activeOpacity={showArabicTranslation ? 0.6 : 1}
                            >
                                <View style={styles.rowLeft}>
                                    <View style={[styles.iconWrap, { backgroundColor: 'rgba(52, 199, 89, 0.12)' }]}>
                                        <Globe size={20} color={showArabicTranslation ? '#34C759' : theme.muted} />
                                    </View>
                                    <View>
                                        <Text style={[styles.rowTitle, { color: showArabicTranslation ? theme.text : theme.muted }]}>
                                            {t('settings.translation_lang')}
                                        </Text>
                                        <Text style={[styles.rowSub, { color: theme.muted }]}>
                                            {LANGUAGES[arabicTranslationLang]?.nativeName}
                                        </Text>
                                    </View>
                                </View>
                                <ChevronRight size={18} color={showArabicTranslation ? theme.muted : theme.border} />
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Okuma Düzeni Seçimi */}
                    <TouchableOpacity
                        style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}
                        onPress={() => setShowLayoutPicker(true)}
                    >
                        <View style={styles.rowLeft}>
                            <View style={[styles.iconWrap, { backgroundColor: 'rgba(10, 132, 255, 0.12)' }]}>
                                <BookOpen size={20} color={theme.primary} />
                            </View>
                            <View>
                                <Text style={[styles.rowTitle, { color: theme.text }]}>
                                    {t('settings.reading_layout')}
                                </Text>
                                <Text style={[styles.rowSub, { color: theme.muted }]}>
                                    {readingLayout === 'page' ? t('settings.layout_page') : t('settings.layout_single')}
                                </Text>
                            </View>
                        </View>
                        <ChevronRight size={18} color={theme.muted} />
                    </TouchableOpacity>

                    {/* Arapça Font Seçimi */}
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => setShowFontPicker(true)}
                    >
                        <View style={styles.rowLeft}>
                            <View style={[styles.iconWrap, { backgroundColor: 'rgba(90, 200, 250, 0.12)' }]}>
                                <Type size={20} color="#5AC8FA" />
                            </View>
                            <View>
                                <Text style={[styles.rowTitle, { color: theme.text }]}>
                                    {t('settings.arabic_font')}
                                </Text>
                                <Text style={[styles.rowSub, { color: theme.muted }]}>
                                    {arabicFontFamily === 'noto-naskh' ? t('settings.font_noto_naskh') : t('settings.font_amiri')}
                                </Text>
                            </View>
                        </View>
                        <ChevronRight size={18} color={theme.muted} />
                    </TouchableOpacity>
                </View>

                {/* ── SES TERCİHLERİ ── */}
                <Text style={[styles.sectionHeader, { color: theme.muted }]}>
                    {t('settings.audio_section')}
                </Text>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <TouchableOpacity style={styles.row} onPress={() => setShowReciterPicker(true)}>
                        <View style={styles.rowLeft}>
                            <View style={[styles.iconWrap, { backgroundColor: 'rgba(10, 132, 255, 0.12)' }]}>
                                <Headphones size={20} color={theme.primary} />
                            </View>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={[styles.rowTitle, { color: theme.text }]}>
                                    {t('settings.selected_reciter')}
                                </Text>
                                <Text style={[styles.rowSub, { color: theme.muted }]}>
                                    {t(`reciters.${selectedReciter.replace('.', '_')}_name`)}
                                </Text>
                            </View>
                        </View>
                        <ChevronRight size={18} color={theme.muted} />
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* ── Meal Dili Seçici Modal ── */}
            <Modal
                visible={showLangPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLangPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowLangPicker(false)}
                >
                    <View style={[styles.langModal, { backgroundColor: theme.card }]}>
                        <Text style={[styles.langModalTitle, { color: theme.text }]}>
                            {t('settings.translation_lang')}
                        </Text>
                        {TRANSLATION_LANGS.map(lang => (
                            <TouchableOpacity
                                key={lang}
                                style={[styles.langItem, { borderBottomColor: theme.border }]}
                                onPress={() => {
                                    setArabicTranslationLang(lang);
                                    setShowLangPicker(false);
                                }}
                            >
                                <View>
                                    <Text style={[styles.langName, { color: theme.text }]}>
                                        {LANGUAGES[lang].nativeName}
                                    </Text>
                                    <Text style={[styles.langSub, { color: theme.muted }]}>
                                        {LANGUAGES[lang].name}
                                    </Text>
                                </View>
                                {arabicTranslationLang === lang && (
                                    <Check size={20} color={theme.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── Okuyucu Seçici Modal ── */}
            <Modal
                visible={showReciterPicker}
                transparent
                animationType="fade"
                onRequestClose={handleCloseReciterPicker}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={handleCloseReciterPicker}
                >
                    <View style={[styles.langModal, { backgroundColor: theme.card, width: 320 }]}>
                        <Text style={[styles.langModalTitle, { color: theme.text }]}>
                            {t('settings.select_reciter_title')}
                        </Text>
                        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                            {RECITERS.map(reciter => {
                                const reciterKey = reciter.id.replace('.', '_');
                                const isSelected = selectedReciter === reciter.id;
                                const isPlayingPreview = playingPreviewId === reciter.id;

                                return (
                                    <View
                                        key={reciter.id}
                                        style={[styles.reciterItem, { borderBottomColor: theme.border }]}
                                    >
                                        <TouchableOpacity
                                            style={styles.reciterItemLeft}
                                            onPress={() => {
                                                setSelectedReciter(reciter.id);
                                                handleCloseReciterPicker();
                                            }}
                                        >
                                            <View style={[styles.avatarCircle, { backgroundColor: theme.primary + '15' }]}>
                                                <Text style={[styles.avatarText, { color: theme.primary }]}>
                                                    {reciter.initials}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 1, paddingRight: 4 }}>
                                                <Text style={[styles.langName, { color: theme.text }]} numberOfLines={1}>
                                                    {t(`reciters.${reciterKey}_name`)}
                                                </Text>
                                                <Text style={[styles.langSub, { color: theme.muted, fontSize: 11 }]} numberOfLines={2}>
                                                    {t(`reciters.${reciterKey}_style`)}
                                                </Text>
                                            </View>
                                            {isSelected && (
                                                <Check size={20} color={theme.primary} style={{ marginRight: 4 }} />
                                            )}
                                        </TouchableOpacity>

                                        {/* Preview Button */}
                                        <TouchableOpacity
                                            style={[
                                                styles.previewButton,
                                                { borderColor: theme.primary }
                                            ]}
                                            onPress={() => handlePreviewPlayPause(reciter.id)}
                                        >
                                            {isPlayingPreview ? (
                                                isPreviewLoading ? (
                                                    <ActivityIndicator size="small" color={theme.primary} />
                                                ) : (
                                                    <View style={[styles.stopSquare, { backgroundColor: theme.primary }]} />
                                                )
                                            ) : (
                                                <Play size={12} color={theme.primary} fill={theme.primary} />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── Okuma Düzeni Seçici Modal ── */}
            <Modal
                visible={showLayoutPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowLayoutPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowLayoutPicker(false)}
                >
                    <View style={[styles.langModal, { backgroundColor: theme.card }]}>
                        <Text style={[styles.langModalTitle, { color: theme.text }]}>
                            {t('settings.select_layout_title')}
                        </Text>
                        
                        {/* Ayet Ayet */}
                        <TouchableOpacity
                            style={[styles.langItem, { borderBottomColor: theme.border }]}
                            onPress={() => {
                                setReadingLayout('single');
                                setShowLayoutPicker(false);
                            }}
                        >
                            <View>
                                <Text style={[styles.langName, { color: theme.text }]}>
                                    {t('settings.layout_single')}
                                </Text>
                            </View>
                            {readingLayout === 'single' && (
                                <Check size={20} color={theme.primary} />
                            )}
                        </TouchableOpacity>

                        {/* Sayfa Sayfa */}
                        <TouchableOpacity
                            style={[styles.langItem, { borderBottomWidth: 0 }]}
                            onPress={() => {
                                setReadingLayout('page');
                                setShowLayoutPicker(false);
                            }}
                        >
                            <View>
                                <Text style={[styles.langName, { color: theme.text }]}>
                                    {t('settings.layout_page')}
                                </Text>
                            </View>
                            {readingLayout === 'page' && (
                                <Check size={20} color={theme.primary} />
                            )}
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── Arapça Yazı Tipi Seçici Modal ── */}
            <Modal
                visible={showFontPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowFontPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowFontPicker(false)}
                >
                    <View style={[styles.langModal, { backgroundColor: theme.card }]}>
                        <Text style={[styles.langModalTitle, { color: theme.text }]}>
                            {t('settings.select_font_title')}
                        </Text>
                        
                        {/* Diyanet Nesih */}
                        <TouchableOpacity
                            style={[styles.langItem, { borderBottomColor: theme.border }]}
                            onPress={() => {
                                setArabicFontFamily('noto-naskh');
                                setShowFontPicker(false);
                            }}
                        >
                            <View>
                                <Text style={[styles.langName, { color: theme.text }]}>
                                    {t('settings.font_noto_naskh')}
                                </Text>
                            </View>
                            {arabicFontFamily === 'noto-naskh' && (
                                <Check size={20} color={theme.primary} />
                            )}
                        </TouchableOpacity>

                        {/* Amiri */}
                        <TouchableOpacity
                            style={[styles.langItem, { borderBottomWidth: 0 }]}
                            onPress={() => {
                                setArabicFontFamily('amiri');
                                setShowFontPicker(false);
                            }}
                        >
                            <View>
                                <Text style={[styles.langName, { color: theme.text }]}>
                                    {t('settings.font_amiri')}
                                </Text>
                            </View>
                            {arabicFontFamily === 'amiri' && (
                                <Check size={20} color={theme.primary} />
                            )}
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
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
        paddingTop: 56,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginTop: 24,
        marginBottom: 8,
        marginLeft: 4,
    },
    card: {
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        minHeight: 64,
    },
    rowDisabled: {
        opacity: 0.4,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowTitle: {
        fontSize: 15,
        fontWeight: '500',
    },
    rowSub: {
        fontSize: 12,
        marginTop: 2,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    langModal: {
        width: 300,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    langModalTitle: {
        fontSize: 16,
        fontWeight: '700',
        padding: 16,
        paddingBottom: 10,
    },
    langItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    langName: {
        fontSize: 15,
        fontWeight: '500',
    },
    langSub: {
        fontSize: 12,
        marginTop: 2,
    },
    reciterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    reciterItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    avatarCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 12,
        fontWeight: '700',
    },
    previewButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stopSquare: {
        width: 10,
        height: 10,
        borderRadius: 1.5,
    },
});
