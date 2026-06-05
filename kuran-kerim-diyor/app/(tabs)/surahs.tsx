import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { getAllSurahs } from '../../services/quranData';
import { useProgress } from '../../hooks/useProgress';
import { useTranslation } from 'react-i18next';

export default function SurahsScreen() {
    const { t } = useTranslation();
    const surahs = getAllSurahs();
    const theme = Colors.light;
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
                renderItem={({ item }) => {
                    const isCompleted = completedSurahs?.includes(item.number) ?? false;

                    return (
                        <TouchableOpacity
                            onPress={() => handlePress(item.number)}
                            style={[styles.surahCard, { borderBottomColor: theme.border, backgroundColor: isCompleted ? 'rgba(182, 154, 115, 0.03)' : 'transparent' }]}
                        >
                            <View style={[styles.numberCircle, isCompleted && { backgroundColor: theme.primary }]}>
                                {isCompleted ? (
                                    <CheckCircle2 size={20} color="#fff" />
                                ) : (
                                    <Text style={styles.numberText}>{item.number}</Text>
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
});
