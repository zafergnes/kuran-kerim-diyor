import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { searchAyahs } from '../../services/quranData';
import { useUserStore } from '../../store/userStore';
import { useProgress } from '../../hooks/useProgress';

export default function SearchScreen() {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
    const { language } = useUserStore();
    const router = useRouter();
    const { setProgress } = useProgress();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);

    const handleSearch = (text: string) => {
        setQuery(text);
        // Sondaki kısım rakamla bitiyorsa referans olabilir (sebe 50, 34:50 vb.)
        const endsWithDigit = /\d$/.test(text.trim());
        if (text.length > 2 || (endsWithDigit && text.trim().length >= 3)) {
            const res = searchAyahs(text, language);
            setResults(res);
        } else {
            setResults([]);
        }
    };

    const handleResultPress = (surahNumber: number, ayahNumber: number) => {
        setProgress(surahNumber, ayahNumber);
        router.push('/(tabs)');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.searchBox}>
                <TextInput
                    style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
                    placeholder="Kur'an'da ara..."
                    placeholderTextColor={theme.muted}
                    value={query}
                    onChangeText={handleSearch}
                />
            </View>

            <FlatList
                data={results}
                keyExtractor={(item) => item.ayah.globalNumber.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.resultCard, { borderBottomColor: theme.border }]}
                        onPress={() => handleResultPress(item.surahNumber, item.ayah.number)}
                    >
                        <Text style={[styles.meta, { color: theme.primary }]}>
                            {item.surahName} • Ayet {item.ayah.number}
                        </Text>
                        <Text style={[styles.arabic, { color: theme.text }]} numberOfLines={2}>
                            {item.ayah.arabic}
                        </Text>
                        <Text style={[styles.translation, { color: theme.secondary }]} numberOfLines={3}>
                            {item.ayah.translations[language]}
                        </Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    query.length > 2 ? (
                        <Text style={[styles.empty, { color: theme.muted }]}>Sonuç bulunamadı.</Text>
                    ) : (
                        <Text style={[styles.empty, { color: theme.muted }]}>Aramak için en az 3 harf girin.</Text>
                    )
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchBox: { padding: 16 },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    resultCard: {
        padding: 16,
        borderBottomWidth: 1,
    },
    meta: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    arabic: {
        fontFamily: 'Amiri_400Regular',
        fontSize: 22,
        textAlign: 'right',
        marginBottom: 8,
    },
    translation: {
        fontSize: 14,
        lineHeight: 20,
    },
    empty: {
        textAlign: 'center',
        padding: 24,
        fontStyle: 'italic',
    }
});
