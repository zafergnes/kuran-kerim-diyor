import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import apiClient from '../services/apiClient';
import { useUserStore } from '../store/userStore';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface MyComment {
    id: string;
    ayahId: string;
    surahNo: number;
    ayahNo: number;
    text: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED_BY_MODERATOR';
    moderationReason?: string;
    createdAt: string;
    isDeletedUser?: boolean;
}

export default function MyCommentsScreen() {
    const { theme } = useAppTheme();
    const { userId } = useUserStore();
    const router = useRouter();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const [comments, setComments] = useState<MyComment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchMyComments = async () => {
            try {
                const response = await apiClient.get('/comments/my');
                // Backend returns list where ayahId is "surahNo_ayahNo"
                // Let's parse it if needed or just use as is.
                const enriched = response.data.map((c: any) => {
                    const [s, a] = c.ayahId.split('_');
                    return {
                        ...c,
                        surahNo: parseInt(s),
                        ayahNo: parseInt(a)
                    };
                });
                setComments(enriched);
            } catch (error) {
                console.error("Yorumlarım çekilemedi:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyComments();
    }, [userId]);


    const handleNavigateToAyah = async (surahNo: number, ayahNo: number) => {
        try {
            const { useUserStore } = await import('../store/userStore');
            useUserStore.getState().setProgress(surahNo, ayahNo);

            // AsyncStorage'a onceden yaz — tab mount olunca loadData dogru degeri okur.
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            await AsyncStorage.setItem('@kuran_progress', JSON.stringify({ surah: surahNo, ayah: ayahNo }));
        } catch (e) {
            console.error('Navigation prep failed:', e);
        }

        // navigate() ile push yerine tab'a don, yeni instance olusturmaz.
        router.navigate('/(tabs)');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen 
                options={{ 
                    title: t('my_comments.title'),
                    headerShadowVisible: false,
                    headerTintColor: theme.text,
                    headerStyle: { backgroundColor: theme.background },
                }} 
            />

            {loading ? (
                <View style={[styles.center, { flex: 1 }]}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={comments}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: Math.max(24, insets.bottom + 16) }}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={[styles.commentCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={() => handleNavigateToAyah(item.surahNo, item.ayahNo)}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={[styles.surahTitle, { color: theme.primary }]}>
                                    {t('my_comments.surah_label')} {item.surahNo} • {t('common.ayah')} {item.ayahNo}
                                </Text>
                                <View style={styles.statusRow}>
                                    {item.status === 'PENDING' && (
                                        <Text style={[styles.statusText, { color: '#f39c12' }]}>{t('comments.status_preparing')}</Text>
                                    )}
                                    {item.status === 'REMOVED_BY_MODERATOR' && (
                                        <Text style={[styles.statusText, { color: '#e74c3c' }]}>{t('comments.status_removed')}</Text>
                                    )}
                                    {item.status === 'REJECTED' && (
                                        <Text style={[styles.statusText, { color: '#e74c3c' }]}>{t('comments.status_rejected')}</Text>
                                    )}
                                </View>
                            </View>
                            
                            <Text style={[styles.commentText, { color: (item.status === 'REMOVED_BY_MODERATOR' || item.status === 'REJECTED') ? theme.muted : theme.text }]} numberOfLines={3}>
                                {item.text}
                            </Text>

                            {(item.status === 'REMOVED_BY_MODERATOR' || item.status === 'REJECTED') && item.moderationReason && (
                                <View style={[styles.reasonBox, { backgroundColor: theme.background + '50' }]}>
                                    <Text style={[styles.reasonText, { color: '#e74c3c' }]}>
                                        ⚠️ {t(`comments.moderation_reasons.${item.moderationReason}`)}
                                    </Text>
                                </View>
                            )}

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                                <MessageSquare size={14} color={theme.secondary} />
                                <Text style={{ color: theme.secondary, fontSize: 12, marginLeft: 6 }}>{t('common.go_to_verse')}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={[styles.emptyText, { color: theme.muted }]}>{t('my_comments.empty')}</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { alignItems: 'center', justifyContent: 'center', padding: 24, marginTop: 40 },
    emptyText: { fontSize: 16, textAlign: 'center' },
    commentCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    surahTitle: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    commentText: {
        fontSize: 15,
        lineHeight: 22,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    reasonBox: {
        marginTop: 10,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e74c3c33',
    },
    reasonText: {
        fontSize: 13,
        fontStyle: 'italic',
    }
});
