import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Modal,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, X, Share2, Sparkles, BookOpen } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../hooks/useAppTheme';
import namesData from '../constants/names99.json';
import { NameShareCard } from '../components/NameShareCard';

interface NameItem {
    id: number;
    arabic: string;
    transliteration: Record<string, string>;
    meaning: Record<string, string>;
    explanation: Record<string, string>;
    quranReference: string;
}

const allNames: NameItem[] = namesData as NameItem[];

export default function Names99Screen() {
    const { t, i18n } = useTranslation();
    const { theme } = useAppTheme();
    const router = useRouter();

    const [search, setSearch] = useState('');
    const [selectedName, setSelectedName] = useState<NameItem | null>(null);
    const [shareName, setShareName] = useState<NameItem | null>(null);

    const lang = useMemo(() => {
        const raw = (i18n.language || 'tr').toLowerCase().slice(0, 2);
        return ['tr', 'en', 'ar', 'de', 'fr', 'es'].includes(raw) ? raw : 'tr';
    }, [i18n.language]);

    const filteredNames = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return allNames;

        return allNames.filter((item) => {
            const trans = (item.transliteration[lang] || item.transliteration.tr || '').toLowerCase();
            const meaning = (item.meaning[lang] || item.meaning.tr || '').toLowerCase();
            const arabic = item.arabic;
            const ref = item.quranReference.toLowerCase();
            const idStr = item.id.toString();

            return (
                trans.includes(query) ||
                meaning.includes(query) ||
                arabic.includes(query) ||
                ref.includes(query) ||
                idStr === query
            );
        });
    }, [search, lang]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {t('names.title', "Esma-ül Hüsna")}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Subheader / Verse */}
            <View style={[styles.verseBanner, { backgroundColor: 'rgba(182, 154, 115, 0.1)', borderColor: 'rgba(182, 154, 115, 0.25)' }]}>
                <Text style={[styles.verseArabic, { color: theme.primary }]}>
                    وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا
                </Text>
                <Text style={[styles.verseTranslation, { color: theme.secondary }]}>
                    {t('names.verse_quote', "“En güzel isimler Allah’ındır; O’na o güzel isimlerle dua edin.” (A'râf, 7/180)")}
                </Text>
            </View>

            {/* Search Input */}
            <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Search size={18} color={theme.muted} />
                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder={t('names.search_placeholder', "İsim, okunuş veya anlam ile ara...")}
                    placeholderTextColor={theme.muted}
                    style={[styles.searchInput, { color: theme.text }]}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <X size={16} color={theme.muted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* List */}
            <FlatList
                data={filteredNames}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    const trans = item.transliteration[lang] || item.transliteration.tr;
                    const meaning = item.meaning[lang] || item.meaning.tr;

                    return (
                        <TouchableOpacity
                            onPress={() => setSelectedName(item)}
                            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.numberBadge, { backgroundColor: 'rgba(182, 154, 115, 0.15)' }]}>
                                    <Text style={[styles.numberText, { color: theme.primary }]}>{item.id}</Text>
                                </View>
                                <Text style={[styles.referenceText, { color: theme.muted }]}>{item.quranReference}</Text>
                            </View>

                            <View style={styles.cardCenter}>
                                <Text style={[styles.cardArabic, { color: theme.primary }]}>{item.arabic}</Text>
                                <Text style={[styles.cardTransliteration, { color: theme.text }]}>{trans}</Text>
                            </View>

                            <Text style={[styles.cardMeaning, { color: theme.secondary }]} numberOfLines={2}>
                                {meaning}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Detail Modal */}
            <Modal
                visible={selectedName !== null}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setSelectedName(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <TouchableOpacity
                            onPress={() => setSelectedName(null)}
                            style={styles.closeBtn}
                        >
                            <X size={22} color={theme.muted} />
                        </TouchableOpacity>

                        {selectedName && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.modalHeader}>
                                    <View style={[styles.numberBadgeLarge, { backgroundColor: 'rgba(182, 154, 115, 0.15)' }]}>
                                        <Text style={[styles.numberTextLarge, { color: theme.primary }]}>
                                            {selectedName.id}
                                        </Text>
                                    </View>
                                    <Text style={[styles.modalArabic, { color: theme.primary }]}>
                                        {selectedName.arabic}
                                    </Text>
                                    <Text style={[styles.modalTitle, { color: theme.text }]}>
                                        {selectedName.transliteration[lang] || selectedName.transliteration.tr}
                                    </Text>
                                    <View style={[styles.meaningPill, { backgroundColor: 'rgba(182, 154, 115, 0.12)' }]}>
                                        <Text style={[styles.meaningPillText, { color: theme.primary }]}>
                                            {selectedName.meaning[lang] || selectedName.meaning.tr}
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.explanationCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                    <View style={styles.sectionTitleRow}>
                                        <BookOpen size={16} color={theme.primary} />
                                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                            {t('names.detail_heading', "Derin Anlamı ve Tefekkürü")}
                                        </Text>
                                    </View>
                                    <Text style={[styles.explanationText, { color: theme.secondary }]}>
                                        {selectedName.explanation[lang] || selectedName.explanation.tr}
                                    </Text>
                                </View>

                                <View style={[styles.referenceCard, { borderColor: theme.border }]}>
                                    <Text style={[styles.refLabel, { color: theme.muted }]}>
                                        {t('names.quran_ref_label', "Kur'an-ı Kerim Referansı")}
                                    </Text>
                                    <Text style={[styles.refValue, { color: theme.primary }]}>
                                        {selectedName.quranReference}
                                    </Text>
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            // Native platformlarda modal üstüne modal bazı cihazlarda dokunmayı yutar.
                                            // Detay modalını kapatıp görsel paylaşım kartını tek modal olarak açıyoruz.
                                            setSelectedName(null);
                                            setShareName(selectedName);
                                        }}
                                        style={[styles.shareBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
                                    >
                                        <Share2 size={18} color={theme.text} />
                                        <Text style={[styles.btnText, { color: theme.text }]}>
                                            {t('common.share', "Paylaş")}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={() => {
                                            const nameParam = encodeURIComponent(
                                                selectedName.transliteration[lang] || selectedName.transliteration.tr
                                            );
                                            setSelectedName(null);
                                            router.push(`/dua-generator?name=${nameParam}`);
                                        }}
                                        style={[styles.prayBtn, { backgroundColor: theme.primary }]}
                                    >
                                        <Sparkles size={18} color="#fff" />
                                        <Text style={styles.prayBtnText}>
                                            {t('names.pray_with_name', "Bu İsimle Dua İste")}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            <Modal
                visible={shareName !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShareName(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                {t('names.share_title', 'Esma-ül Hüsna paylaş')}
                            </Text>
                            <TouchableOpacity onPress={() => setShareName(null)}>
                                <X size={22} color={theme.muted} />
                            </TouchableOpacity>
                        </View>
                        {shareName && (
                            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
                                <NameShareCard
                                    id={shareName.id}
                                    arabic={shareName.arabic}
                                    transliteration={shareName.transliteration[lang] || shareName.transliteration.tr}
                                    meaning={shareName.meaning[lang] || shareName.meaning.tr}
                                    explanation={shareName.explanation[lang] || shareName.explanation.tr}
                                    reference={shareName.quranReference}
                                />
                            </ScrollView>
                        )}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 52,
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
    verseBanner: {
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginVertical: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        padding: 0,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
        paddingTop: 4,
    },
    card: {
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    numberBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    numberText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    referenceText: {
        fontSize: 11,
    },
    cardCenter: {
        alignItems: 'center',
        marginVertical: 4,
    },
    cardArabic: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    cardTransliteration: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    cardMeaning: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        width: '100%',
        maxHeight: '85%',
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
    },
    closeBtn: {
        alignSelf: 'flex-end',
        padding: 4,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    numberBadgeLarge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    numberTextLarge: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    modalArabic: {
        fontSize: 42,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    meaningPill: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 16,
    },
    meaningPillText: {
        fontSize: 13,
        fontWeight: '600',
    },
    explanationCard: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    explanationText: {
        fontSize: 13,
        lineHeight: 20,
    },
    referenceCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 18,
    },
    refLabel: {
        fontSize: 12,
    },
    refValue: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
    },
    shareBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        gap: 6,
    },
    btnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    prayBtn: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    prayBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
});
