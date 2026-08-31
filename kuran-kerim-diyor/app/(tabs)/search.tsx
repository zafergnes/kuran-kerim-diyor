import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { searchAyahs } from '../../services/quranData';
import { useUserStore } from '../../store/userStore';
import { useProgress } from '../../hooks/useProgress';
import { useAyahStats } from '../../hooks/useAyahStats';
import { Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';

const formatFavCount = (n: number) => {
    if (n < 1000) return n.toString();
    return (n / 1000).toFixed(1) + 'k';
};

const SearchResultItem = ({ item, theme, language, onPress }: any) => {
    const { t } = useTranslation();
    const ayahId = `${item.surahNumber}_${item.ayah.number}`;
    const { favoriteCount } = useAyahStats(item.surahNumber, item.ayah.number);
    const { favorites, userId } = useUserStore();
    
    // Yalnızca giriş yapmış kullanıcılar için (lokalde varsa ve henüz global'e yansımadıysa) 1 göster. Misafirler için sadece gerçek db verisini göster.
    const displayCount = userId ? Math.max(favoriteCount, favorites[ayahId] ? 1 : 0) : favoriteCount;
    
    return (
        <TouchableOpacity
            style={[styles.resultCard, { borderBottomColor: theme.border }]}
            onPress={onPress}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[styles.meta, { color: theme.primary, marginBottom: 0 }]}>
                    {item.surahName} • {t('common.ayah')} {item.ayah.number}
                </Text>
                {displayCount > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: theme.primary, marginRight: 4, fontSize: 12, fontWeight: 'bold' }}>
                            {formatFavCount(displayCount)} {t('common.person')}
                        </Text>
                        <Heart size={14} color={theme.primary} fill={theme.primary} />
                    </View>
                )}
            </View>
            <Text style={[styles.arabic, { color: theme.text }]} numberOfLines={2}>
                {item.ayah.arabic}
            </Text>
            <Text style={[styles.translation, { color: theme.secondary }]} numberOfLines={3}>
                {item.ayah.translations[language]}
            </Text>
        </TouchableOpacity>
    );
};

export default function SearchScreen() {
    const { theme } = useAppTheme();
    const { language } = useUserStore();
    const router = useRouter();
    const { setProgress } = useProgress();
    const { t } = useTranslation();

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
                    placeholder={t('search.placeholder')}
                    placeholderTextColor={theme.muted}
                    value={query}
                    onChangeText={handleSearch}
                />
            </View>

            <FlatList
                data={results}
                keyExtractor={(item) => item.ayah.globalNumber.toString()}
                contentContainerStyle={{ paddingBottom: 24 }}
                renderItem={({ item }) => (
                    <SearchResultItem 
                        item={item} 
                        theme={theme} 
                        language={language} 
                        onPress={() => handleResultPress(item.surahNumber, item.ayah.number)} 
                    />
                )}
                ListEmptyComponent={
                    query.length > 2 ? (
                        <Text style={[styles.empty, { color: theme.muted }]}>{t('search.no_results')}</Text>
                    ) : (
                        <Text style={[styles.empty, { color: theme.muted }]}>{t('search.min_chars')}</Text>
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
