import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { searchAyahs, SearchResultItemData } from '../../services/quranData';
import { useUserStore } from '../../store/userStore';
import { useProgress } from '../../hooks/useProgress';
import { useAyahStats } from '../../hooks/useAyahStats';
import { Heart, Search, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../hooks/useAppTheme';

const formatFavCount = (n: number) => {
    if (n < 1000) return n.toString();
    return (n / 1000).toFixed(1) + 'k';
};

const SearchResultItem = React.memo(({ item, theme, language, onPress }: any) => {
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
            activeOpacity={0.7}
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
});

export default function SearchScreen() {
    const { theme } = useAppTheme();
    const { language } = useUserStore();
    const router = useRouter();
    const { setProgress } = useProgress();
    const { t } = useTranslation();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResultItemData[]>([]);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = (text: string) => {
        setQuery(text);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        const trimmed = text.trim();
        const isDigitOnly = /^\d{1,3}$/.test(trimmed);
        const endsWithDigit = /\d$/.test(trimmed);

        if (trimmed.length >= 2 || isDigitOnly || (endsWithDigit && trimmed.length >= 3)) {
            debounceTimerRef.current = setTimeout(() => {
                const res = searchAyahs(text, language);
                setResults(res);
            }, 80);
        } else {
            setResults([]);
        }
    };

    const handleClear = () => {
        setQuery('');
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        setResults([]);
    };

    const handleResultPress = (surahNumber: number, ayahNumber: number) => {
        setProgress(surahNumber, ayahNumber);
        router.push('/(tabs)');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.searchBox}>
                <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.card }]}>
                    <Search size={18} color={theme.muted} style={{ marginRight: 8 }} />
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder={t('search.placeholder')}
                        placeholderTextColor={theme.muted}
                        value={query}
                        onChangeText={handleSearch}
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity
                            onPress={handleClear}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={{ padding: 4 }}
                        >
                            <X size={16} color={theme.muted} />
                        </TouchableOpacity>
                    )}
                </View>

                {query.trim().length >= 2 && results.length > 0 && (
                    <Text style={[styles.resultCount, { color: theme.muted }]}>
                        {results.length} {t('search.ayah', 'Ayet')}
                    </Text>
                )}
            </View>

            <FlatList
                data={results}
                keyExtractor={(item) => `${item.surahNumber}_${item.ayah.number}`}
                contentContainerStyle={{ paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                extraData={query}
                renderItem={({ item }) => (
                    <SearchResultItem 
                        item={item} 
                        theme={theme} 
                        language={language} 
                        onPress={() => handleResultPress(item.surahNumber, item.ayah.number)} 
                    />
                )}
                ListEmptyComponent={
                    query.trim().length >= 2 ? (
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
    searchBox: { padding: 16, paddingBottom: 8 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 48,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 8,
    },
    resultCount: {
        fontSize: 12,
        marginTop: 8,
        marginLeft: 4,
        fontWeight: '500',
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
