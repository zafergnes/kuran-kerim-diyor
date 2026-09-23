import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, Heart, Sparkles, ShieldCheck, Compass } from 'lucide-react-native';
import { getAllSurahs } from '../../services/quranData';
import { useProgress } from '../../hooks/useProgress';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function SurahsScreen() {
    const { t } = useTranslation();
    const surahs = getAllSurahs();
    const { theme } = useAppTheme();
    const router = useRouter();
    const { setProgress, completedSurahs } = useProgress();

    const handlePress = (surahNumber: number) => {
        setProgress(surahNumber, 1);
        router.push('/(tabs)');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <FlatList
                data={surahs}
                keyExtractor={(item) => item.number.toString()}
                contentContainerStyle={{ paddingBottom: 24 }}
                ListHeaderComponent={
                    <View style={styles.headerCardsContainer}>
                        <TouchableOpacity
                            onPress={() => router.push('/journey')}
                            style={[styles.journeyCard, { backgroundColor: '#063B43' }]}
                            activeOpacity={0.75}
                        >
                            <View style={styles.journeyIconCircle}>
                                <Compass size={22} color="#D9B76F" />
                            </View>
                            <View style={styles.quickCardTextContainer}>
                                <Text style={styles.journeyTitle}>{t('settings.journey_title')}</Text>
                                <Text style={styles.journeyDesc}>{t('settings.journey_subtitle')}</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/ayetel-kursi')}
                            style={[styles.quickCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(182, 154, 115, 0.15)' }]}>
                                <ShieldCheck size={20} color={theme.primary} />
                            </View>
                            <View style={styles.quickCardTextContainer}>
                                <Text style={[styles.quickCardTitle, { color: theme.text }]}>
                                    {t('ayat_al_kursi.title', 'Ayetel Kürsî')}
                                </Text>
                                <Text style={[styles.quickCardDesc, { color: theme.muted }]}>
                                    {t('ayat_al_kursi.subtitle_short', 'Oku, dinle ve tefekkür et')}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/names99')}
                            style={[styles.quickCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(182, 154, 115, 0.15)' }]}>
                                <Heart size={20} color={theme.primary} />
                            </View>
                            <View style={styles.quickCardTextContainer}>
                                <Text style={[styles.quickCardTitle, { color: theme.text }]}>
                                    {t('names.title', "Esma-ül Hüsna")}
                                </Text>
                                <Text style={[styles.quickCardDesc, { color: theme.muted }]}>
                                    {t('names.subtitle_short', "Allah'ın 99 İsmi ve Anlamları")}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push('/dua-generator')}
                            style={[styles.quickCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(182, 154, 115, 0.15)' }]}>
                                <Sparkles size={20} color={theme.primary} />
                            </View>
                            <View style={styles.quickCardTextContainer}>
                                <Text style={[styles.quickCardTitle, { color: theme.text }]}>
                                    {t('dua.title', "AI Dua Asistanı")}
                                </Text>
                                <Text style={[styles.quickCardDesc, { color: theme.muted }]}>
                                    {t('dua.subtitle_short', "İslami Âdâba Uygun Dua Oluştur")}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                }
                renderItem={({ item }) => {
                    const isCompleted = completedSurahs?.includes(item.number) ?? false;

                    return (
                        <TouchableOpacity
                            onPress={() => handlePress(item.number)}
                            style={[styles.surahCard, { borderBottomColor: theme.border, backgroundColor: isCompleted ? 'rgba(182, 154, 115, 0.03)' : 'transparent' }]}
                        >
                            <View style={[styles.numberCircle, { backgroundColor: theme.primary + '1A' }, isCompleted && { backgroundColor: theme.primary }]}>
                                {isCompleted ? (
                                    <CheckCircle2 size={20} color="#fff" />
                                ) : (
                                    <Text style={[styles.numberText, { color: theme.primary }]}>{item.number}</Text>
                                )}
                            </View>
                            <View style={styles.surahInfo}>
                                <Text style={[styles.surahName, { color: theme.text }]}>{item.name.tr}</Text>
                                <Text style={[styles.surahMeta, { color: theme.muted }]}>{item.englishNameTranslation} • {t('surahs.ayah_count', { count: item.ayahsCount })}</Text>
                            </View>
                            <Text style={[styles.surahNameAr, { color: theme.primary }]}>{item.name.ar}</Text>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    surahCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    numberCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(182, 154, 115, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    numberText: {
        color: '#B69A73',
        fontWeight: 'bold',
    },
    surahInfo: {
        flex: 1,
    },
    surahName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    surahMeta: {
        fontSize: 12,
    },
    surahNameAr: {
        fontFamily: 'Amiri_400Regular',
        fontSize: 24,
    },
    headerCardsContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
        gap: 10,
    },
    quickCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        gap: 12,
    },
    journeyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 18,
        gap: 12,
    },
    journeyIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(217, 183, 111, 0.14)',
        borderWidth: 1,
        borderColor: 'rgba(217, 183, 111, 0.28)',
    },
    journeyTitle: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 3,
    },
    journeyDesc: {
        color: '#BBD0D2',
        fontSize: 11,
    },
    quickIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickCardTextContainer: {
        flex: 1,
    },
    quickCardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    quickCardDesc: {
        fontSize: 11,
    },
});
