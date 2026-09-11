import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Share2, ShieldCheck, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../hooks/useAppTheme';
import { useUserStore } from '../store/userStore';
import { getAyah } from '../services/quranData';
import { AudioPlayer } from '../components/AudioPlayer';
import { VerseShareCard } from '../components/VerseShareCard';

const AYETEL_KURSI = getAyah(2, 255);

export default function AyetelKursiScreen() {
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    const router = useRouter();
    const language = useUserStore((state) => state.language);
    const arabicTranslationLang = useUserStore((state) => state.arabicTranslationLang);
    const selectedArabicScript = useUserStore((state) => state.selectedArabicScript);
    const [showShare, setShowShare] = useState(false);

    const translation = useMemo(() => {
        if (!AYETEL_KURSI) return '';
        const displayLanguage = language === 'ar' ? arabicTranslationLang : language;
        return AYETEL_KURSI.translations[displayLanguage] || AYETEL_KURSI.translations.tr;
    }, [language, arabicTranslationLang]);

    if (!AYETEL_KURSI) return null;

    const arabic = selectedArabicScript === 'diyanet' && AYETEL_KURSI.arabicDiyanet
        ? AYETEL_KURSI.arabicDiyanet
        : AYETEL_KURSI.arabic;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel={t('common.back', 'Geri')}>
                    <ChevronLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{t('ayat_al_kursi.title', 'Ayetel Kürsî')}</Text>
                <ShieldCheck size={22} color={theme.primary} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.hero, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={[styles.heroIcon, { backgroundColor: 'rgba(182,154,115,0.14)' }]}>
                        <ShieldCheck size={26} color={theme.primary} />
                    </View>
                    <Text style={[styles.eyebrow, { color: theme.primary }]}>{t('ayat_al_kursi.subtitle', 'Bakara Sûresi · 255. Ayet')}</Text>
                    <Text style={[styles.arabic, { color: theme.text }]}>{arabic}</Text>
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <Text style={[styles.translation, { color: theme.secondary }]}>{translation}</Text>
                    <View style={styles.audioRow}>
                        <AudioPlayer globalAyahNumber={AYETEL_KURSI.globalNumber} />
                        <View style={styles.audioCopy}>
                            <Text style={[styles.audioTitle, { color: theme.text }]}>{t('ayat_al_kursi.listen', 'Ayetel Kürsî’yi dinle')}</Text>
                            <Text style={[styles.audioSubtitle, { color: theme.muted }]}>{t('ayat_al_kursi.listen_subtitle', 'Seçtiğiniz okuyucuyla')}</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.note, { backgroundColor: 'rgba(182,154,115,0.1)', borderColor: 'rgba(182,154,115,0.25)' }]}>
                    <Text style={[styles.noteTitle, { color: theme.primary }]}>{t('ayat_al_kursi.reflection_title', 'Bir an dur, anlamını düşün')}</Text>
                    <Text style={[styles.noteText, { color: theme.secondary }]}>{t('ayat_al_kursi.reflection', 'Allah’ın ilmi, kudreti ve koruyuculuğu üzerine tefekkür etmek için bu ayeti saklayabilir ve paylaşabilirsiniz.')}</Text>
                </View>

                <TouchableOpacity
                    onPress={() => setShowShare(true)}
                    style={[styles.shareButton, { backgroundColor: theme.primary }]}
                    activeOpacity={0.85}
                >
                    <Share2 size={18} color="#fff" />
                    <Text style={styles.shareButtonText}>{t('common.share', 'Paylaş')}</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal visible={showShare} animationType="slide" transparent onRequestClose={() => setShowShare(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('common.share_verse', 'Ayeti Paylaş')}</Text>
                            <TouchableOpacity onPress={() => setShowShare(false)} accessibilityLabel={t('common.close', 'Kapat')}>
                                <X size={22} color={theme.muted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
                            <VerseShareCard
                                text={translation}
                                reference="Bakara 2:255"
                                onClose={() => setShowShare(false)}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, borderBottomWidth: 1 },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 16, paddingBottom: 40 },
    hero: { borderRadius: 22, borderWidth: 1, padding: 20, alignItems: 'center' },
    heroIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 0.7, marginBottom: 18 },
    arabic: { fontFamily: 'NotoNaskhArabic_700Bold', fontSize: 29, lineHeight: 58, textAlign: 'center' },
    divider: { width: 48, height: 2, marginVertical: 18 },
    translation: { fontSize: 16, lineHeight: 28, textAlign: 'center' },
    audioRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginTop: 22, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(182,154,115,0.22)' },
    audioCopy: { marginLeft: 6, flex: 1 },
    audioTitle: { fontSize: 13, fontWeight: '700' },
    audioSubtitle: { fontSize: 11, marginTop: 2 },
    note: { borderRadius: 14, borderWidth: 1, padding: 15, marginTop: 14 },
    noteTitle: { fontSize: 13, fontWeight: '800', marginBottom: 5 },
    noteText: { fontSize: 13, lineHeight: 20 },
    shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 16 },
    shareButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { maxHeight: '92%', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 8 },
    modalTitle: { fontSize: 17, fontWeight: '800' },
});
