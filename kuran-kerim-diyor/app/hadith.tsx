import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronLeft, ChevronRight, ScrollText, Share2 } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useUserStore } from '../store/userStore';
import { NotificationService } from '../services/notificationService';
import {
    getDailyHadithIndex,
    getHadithById,
    HADITH_STRINGS,
    HADITHS,
    hadithExcerpt,
    hadithReference,
} from '../services/hadithData';

export default function HadithScreen() {
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const language = useUserStore((state) => state.language);
    const arabicTranslationLang = useUserStore((state) => state.arabicTranslationLang);
    const strings = HADITH_STRINGS[language] ?? HADITH_STRINGS.tr;

    const todayIndex = useMemo(() => getDailyHadithIndex(), []);
    const [index, setIndex] = useState(() => {
        const linked = getHadithById(typeof id === 'string' ? id : undefined);
        return linked ? HADITHS.indexOf(linked) : todayIndex;
    });
    const [notifyEnabled, setNotifyEnabled] = useState(true);

    // Bildirimden ya da paylaşılan bağlantıdan gelen hadisi aç.
    useEffect(() => {
        const linked = getHadithById(typeof id === 'string' ? id : undefined);
        if (linked) setIndex(HADITHS.indexOf(linked));
    }, [id]);

    useEffect(() => {
        NotificationService.isDailyHadithEnabled().then(setNotifyEnabled);
    }, []);

    const hadith = HADITHS[index];
    const isToday = index === todayIndex;
    const isArabicUi = language === 'ar';
    // Arapça arayüzde asıl metin zaten gösterildiği için çeviri seçili meal dilinden gelir.
    const translationLang = isArabicUi ? (arabicTranslationLang && arabicTranslationLang !== 'ar' ? arabicTranslationLang : null) : language;
    const translation = translationLang ? hadith.text[translationLang] : null;
    const reference = hadithReference(hadith, language);

    const step = (delta: number) => setIndex((current) => (current + delta + HADITHS.length) % HADITHS.length);

    const toggleNotify = (enabled: boolean) => {
        setNotifyEnabled(enabled);
        NotificationService.setDailyHadithEnabled(enabled).catch(() => setNotifyEnabled(!enabled));
    };

    const share = () => {
        const shareLang = translationLang ?? 'ar';
        Share.share({
            message: `${strings.daily}\n\n“${hadithExcerpt(hadith.text[shareLang], 400)}”\n— ${hadithReference(hadith, shareLang)}\n\nhttps://kurannediyor.com.tr/hadis?id=${hadith.id}`,
        }).catch(() => {});
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton} accessibilityRole="button" accessibilityLabel={t('common.back', 'Geri')}>
                    <ChevronLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{strings.title}</Text>
                <ScrollText size={22} color={theme.primary} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.hero, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.eyebrow, { color: theme.primary }]}>
                        {isToday ? strings.daily : `${index + 1} / ${HADITHS.length}`}
                    </Text>

                    <Text style={[styles.arabic, { color: theme.text }]}>{hadith.text.ar}</Text>

                    {translation ? (
                        <>
                            <View style={[styles.divider, { backgroundColor: theme.border }]} />
                            <Text
                                style={[styles.translation, { color: theme.secondary, writingDirection: 'ltr' }]}
                                selectable
                            >
                                {translation}
                            </Text>
                        </>
                    ) : null}

                    <View style={[styles.referenceRow, { borderTopColor: theme.border }]}>
                        <Text style={[styles.reference, { color: theme.muted }]} numberOfLines={2}>{reference}</Text>
                        <View style={[styles.gradeChip, { backgroundColor: hadith.grade === 'sahih' ? 'rgba(46,125,50,0.12)' : 'rgba(182,154,115,0.16)' }]}>
                            <Text style={[styles.gradeText, { color: hadith.grade === 'sahih' ? '#2E7D32' : theme.primary }]}>
                                {hadith.grade === 'sahih' ? strings.sahih : strings.hasan}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.navRow}>
                    <TouchableOpacity onPress={() => step(-1)} style={[styles.navButton, { borderColor: theme.border, backgroundColor: theme.card }]} accessibilityRole="button">
                        <ChevronLeft size={18} color={theme.text} />
                        <Text style={[styles.navText, { color: theme.text }]}>{strings.previous}</Text>
                    </TouchableOpacity>
                    {!isToday ? (
                        <TouchableOpacity onPress={() => setIndex(todayIndex)} style={styles.todayButton} accessibilityRole="button">
                            <Text style={[styles.todayText, { color: theme.primary }]}>{strings.today}</Text>
                        </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity onPress={() => step(1)} style={[styles.navButton, { borderColor: theme.border, backgroundColor: theme.card }]} accessibilityRole="button">
                        <Text style={[styles.navText, { color: theme.text }]}>{strings.next}</Text>
                        <ChevronRight size={18} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={share} style={[styles.shareButton, { backgroundColor: theme.primary }]} activeOpacity={0.85} accessibilityRole="button">
                    <Share2 size={18} color="#fff" />
                    <Text style={styles.shareButtonText}>{strings.share}</Text>
                </TouchableOpacity>

                <View style={[styles.notifyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={[styles.notifyIcon, { backgroundColor: 'rgba(182,154,115,0.14)' }]}>
                        <Bell size={18} color={theme.primary} />
                    </View>
                    <View style={styles.notifyCopy}>
                        <Text style={[styles.notifyTitle, { color: theme.text }]}>{strings.notifyTitle}</Text>
                        <Text style={[styles.notifyBody, { color: theme.muted }]}>{strings.notifyBody}</Text>
                    </View>
                    <Switch
                        value={notifyEnabled}
                        onValueChange={toggleNotify}
                        trackColor={{ false: theme.border, true: theme.primary }}
                        thumbColor="#fff"
                        accessibilityLabel={strings.notifyTitle}
                    />
                </View>

                <Text style={[styles.sourceNote, { color: theme.muted }]}>
                    {strings.sourceNote}{strings.editorialNote ? ` ${strings.editorialNote}` : ''}
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, borderBottomWidth: 1 },
    iconButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 16, paddingBottom: 40 },
    hero: { borderRadius: 22, borderWidth: 1, padding: 20 },
    eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 0.7, marginBottom: 16, textAlign: 'center', textTransform: 'uppercase' },
    arabic: { fontFamily: 'NotoNaskhArabic_700Bold', fontSize: 23, lineHeight: 46, textAlign: 'right', writingDirection: 'rtl' },
    divider: { width: 48, height: 2, marginVertical: 18, alignSelf: 'center' },
    translation: { fontSize: 16, lineHeight: 27 },
    referenceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, paddingTop: 14, borderTopWidth: 1 },
    reference: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },
    gradeChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    gradeText: { fontSize: 11, fontWeight: '800' },
    navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
    navButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
    navText: { fontSize: 13, fontWeight: '700' },
    todayButton: { paddingVertical: 10, paddingHorizontal: 8 },
    todayText: { fontSize: 13, fontWeight: '800' },
    shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 14 },
    shareButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
    notifyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14, marginTop: 14 },
    notifyIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    notifyCopy: { flex: 1 },
    notifyTitle: { fontSize: 14, fontWeight: '800' },
    notifyBody: { fontSize: 12, lineHeight: 17, marginTop: 2 },
    sourceNote: { fontSize: 11, lineHeight: 17, marginTop: 18, textAlign: 'center' },
});
