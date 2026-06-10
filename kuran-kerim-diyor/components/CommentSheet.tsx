import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, useColorScheme, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/colors';
import { useComments } from '../hooks/useComments';
import { useUserStore } from '../store/userStore';
import { Heart, MessageSquare, Trash2, Reply, Send } from 'lucide-react-native';
import { maskName } from '../utils/privacy';

interface CommentSheetProps {
    surahNo: number;
    ayahNo: number;
    onClose: () => void;
}

export function CommentSheet({ surahNo, ayahNo, onClose }: CommentSheetProps) {
    const { comments, loading, addComment, toggleLike, deleteComment, refresh } = useComments(surahNo, ayahNo);
    const { userId, isAnonymous, language, displayName } = useUserStore();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
    const router = useRouter();
    const { t } = useTranslation();

    const [text, setText] = useState('');
    const [sendAsAnonymous, setSendAsAnonymous] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<string | 'all'>('all');
    const [replyToId, setReplyToId] = useState<string | null>(null);
    const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
    const inputRef = useRef<TextInput>(null);

    // Otomatik Yenileme (Polling): Bekleyen yorum varsa her 10 sn'de bir tazele
    useEffect(() => {
        const hasPending = comments.some(c => c.status === 'PENDING');
        if (!hasPending) return;

        const interval = setInterval(() => {
            refresh(true); // Sessiz tazeleme
        }, 5000); // 10 saniyeden 5 saniyeye dusuruldu
        return () => clearInterval(interval);
    }, [comments, refresh]);

    const isRealUser = userId && !isAnonymous;
    const { email } = useUserStore();
    const effectiveName = displayName || (email ? email.split('@')[0] : t('common.user'));

    // Grouping by reply structure could be done here if needed. For flat UI, replies just show up indented.
    // Filtreleme Mantigi
    const rawFiltered = selectedLanguage === 'all'
        ? comments
        : comments.filter(c => {
            // EGER yorum bana aitse ve hala incelemedeyse DAIMA GÖSTER (Dil farketmeksizin)
            if (c.userId === userId && c.status === 'PENDING') return true;
            
            if (!c.replyToId) {
                return c.language === selectedLanguage;
            }
            return true;
        });

    // Mevcut dilleri bul (Sadece yorumu olan diller)
    const availableLanguages: string[] = ['all', ...Array.from(new Set(comments.map(c => c.language).filter((l): l is string => !!l)))];

    const buildThreads = (commentsList: any[]) => {
        const rootItems = commentsList.filter(c => !c.replyToId);
        const childrenMap: Record<string, any[]> = {};

        commentsList.forEach(c => {
            if (c.replyToId) {
                if (!childrenMap[c.replyToId]) childrenMap[c.replyToId] = [];
                childrenMap[c.replyToId].push(c);
            }
        });

        // Ortak bir hiyerarşi oluştururken yanıtları eskiden yeniye sıralayalım
        Object.keys(childrenMap).forEach(key => {
            childrenMap[key].sort((a, b) => {
                const timeA = a.createdAt?.toMillis?.() || 0;
                const timeB = b.createdAt?.toMillis?.() || 0;
                return timeA - timeB;
            });
        });

        const result: any[] = [];

        const addChildren = (parentId: string) => {
            if (childrenMap[parentId]) {
                childrenMap[parentId].forEach(child => {
                    result.push(child);
                    addChildren(child.id);
                });
            }
        };

        rootItems.forEach(root => {
            root.replyCount = childrenMap[root.id] ? childrenMap[root.id].length : 0;
            result.push(root);

            if (expandedThreads[root.id]) {
                addChildren(root.id);
            }
        });

        return result;
    };

    const toggleThread = (id: string) => {
        setExpandedThreads(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredComments = buildThreads(rawFiltered);

    const formatDate = (timestamp: string) => {
        if (!timestamp) return t('comments.just_now');
        const d = new Date(timestamp);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const handleSend = async () => {
        if (!text.trim() || !isRealUser) return;
        const currentText = text.trim();
        const currentReplyToId = replyToId;

        // Optimistic UI: Kullanıcıyı bekletmemek için anında temizliyoruz.
        setText('');
        setReplyToId(null);

        try {
            await addComment(currentText, sendAsAnonymous, currentReplyToId ? Number(currentReplyToId) : undefined);
        } catch (e) {
            console.error(e);
            // Hata olursa metni geri getirebiliriz
            setText(currentText);
            setReplyToId(currentReplyToId);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            t('comments.delete_confirm_title'),
            t('comments.delete_confirm_message'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.delete'), style: 'destructive', onPress: () => deleteComment(id) }
            ]
        );
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={[styles.header, { borderBottomColor: theme.border, flexDirection: 'column', alignItems: 'flex-start' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 12 }}>
                    <Text style={[styles.title, { color: theme.text }]}>{t('comments.title')}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{t('common.close')}</Text>
                    </TouchableOpacity>
                </View>

                <FlatList<string>
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={availableLanguages}
                    keyExtractor={(item) => item}
                    contentContainerStyle={{ paddingBottom: 8 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setSelectedLanguage(item)}
                            style={[
                                styles.langTab,
                                { backgroundColor: theme.card, borderColor: theme.border },
                                selectedLanguage === item && [styles.langTabSelected, { borderColor: theme.primary }]
                            ]}
                        >
                            <Text style={[
                                styles.langTabText,
                                { color: theme.muted },
                                selectedLanguage === item && { color: theme.primary, fontWeight: 'bold' }
                            ]}>
                                {item === 'all' ? t('comments.all_languages') : item.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {loading && comments.length === 0 && (
                <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <Text style={{ color: theme.muted, fontSize: 12 }}>{t('comments.loading')}</Text>
                </View>
            )}
            <FlatList
                data={filteredComments}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={() => refresh(false)}
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                    />
                }
                renderItem={({ item }) => {
                    const isReply = !!item.replyToId;
                    return (
                        <View style={[styles.commentCard, { borderBottomColor: theme.border, marginLeft: isReply ? 32 : 0, borderLeftWidth: isReply ? 2 : 0, borderLeftColor: theme.border }]}>
                            <View style={styles.commentHeader}>
                                <Text style={[styles.userName, { color: item.userId === userId ? theme.primary : (item.isAnonymous ? theme.muted : theme.text) }]}>
                                    {maskName(item.user.name)}
                                    {item.userId === userId && <Text style={[styles.ownerBadge, { color: theme.primary }]}> {`(${t('common.you')})`}</Text>}
                                    {isReply && <Text style={{ fontSize: 12, fontWeight: 'normal', color: theme.muted }}> {`(${t('comments.reply_label')})`}</Text>}
                                    {item.status === 'PENDING' && <Text style={{ fontSize: 10, color: '#f39c12' }}> • {t('comments.status_preparing')}</Text>}
                                </Text>
                                <Text style={{ fontSize: 12, color: theme.muted }}>{item.language ? item.language.toUpperCase() : ''}</Text>
                            </View>

                            {item.isDeletedUser ? (
                                <Text style={[styles.commentText, { color: theme.muted, fontStyle: 'italic' }]}>
                                    {t('comments.deleted_user')}
                                </Text>
                            ) : item.status === 'REMOVED_BY_MODERATOR' ? (
                                <View style={{ backgroundColor: theme.muted + '15', padding: 10, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#e74c3c', marginTop: 6 }}>
                                    <Text style={[styles.commentText, { color: theme.muted, fontSize: 13, fontStyle: 'italic' }]}>
                                        {item.text}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={[styles.commentText, { color: theme.text }]}>{item.text}</Text>
                            )}

                            <View style={styles.commentActions}>
                                <TouchableOpacity disabled={item.isDeletedUser || item.isDeletedMod} style={styles.actionBtn} onPress={() => {
                                    if (!isRealUser) {
                                        Alert.alert(t('comments.login_prompt_title', 'Giriş Gerekli'), t('comments.login_to_like', 'Yorumları beğenmek için giriş yapmalısınız.'));
                                        return;
                                    }
                                    toggleLike(item.id);
                                }}>
                                    <Heart
                                        size={16}
                                        color={item.isLikedByMe ? '#e74c3c' : theme.muted}
                                        fill={item.isLikedByMe ? '#e74c3c' : 'transparent'}
                                    />
                                    <Text style={[styles.actionText, { color: theme.muted }]}>{item.likeCount || 0}</Text>
                                </TouchableOpacity>

                                {!item.isDeletedUser && !item.isDeletedMod && (
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => {
                                        if (!isRealUser) return;
                                        setReplyToId(item.id);
                                        inputRef.current?.focus();
                                    }}>
                                        <Reply size={16} color={theme.muted} />
                                        <Text style={[styles.actionText, { color: theme.muted }]}>{t('comments.reply')}</Text>
                                    </TouchableOpacity>
                                )}

                                {userId === item.userId && !item.isDeletedUser && !item.isDeletedMod ? (
                                    <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 11, color: theme.muted, marginRight: 12 }}>{formatDate(item.createdAt)}</Text>
                                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                                            <Trash2 size={16} color={theme.muted} />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={{ marginLeft: 'auto', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 11, color: theme.muted }}>{formatDate(item.createdAt)}</Text>
                                    </View>
                                )}
                            </View>

                            {!isReply && item.replyCount > 0 && (
                                <TouchableOpacity
                                    style={{ marginTop: 12, paddingVertical: 4 }}
                                    onPress={() => toggleThread(item.id)}
                                >
                                    <Text style={{ color: theme.muted, fontWeight: 'bold', fontSize: 13 }}>
                                        {expandedThreads[item.id]
                                            ? t('comments.hide_replies')
                                            : t('comments.show_replies', { count: item.replyCount })}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: theme.muted, fontSize: 16 }]}>{t('comments.empty')}</Text>
                }
            />

            {isRealUser ? (
                <View style={[styles.inputContainer, { borderTopColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <TouchableOpacity
                            style={styles.anonToggle}
                            onPress={() => setSendAsAnonymous(!sendAsAnonymous)}
                        >
                            <Text style={{ color: sendAsAnonymous ? theme.primary : theme.muted, fontSize: 12 }}>
                                {sendAsAnonymous ? `👁️ ${t('comments.hide_identity')}` : t('comments.show_identity')}
                            </Text>
                        </TouchableOpacity>
                        {replyToId && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Reply size={12} color={theme.primary} />
                                <Text style={{ color: theme.primary, fontSize: 12, marginLeft: 4, flex: 1 }} numberOfLines={1}>
                                    {(() => {
                                        const targetComment = comments.find(c => String(c.id) === String(replyToId));
                                        const targetName = targetComment ? maskName(targetComment.user.name) : '...';
                                        return t('comments.replying_to', { name: targetName });
                                    })()}
                                </Text>
                                <TouchableOpacity onPress={() => setReplyToId(null)}>
                                    <Text style={{ color: '#e74c3c', fontSize: 12, fontWeight: 'bold' }}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.inputRow}>
                        <TextInput
                            ref={inputRef}
                            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                            placeholder={replyToId ? t('comments.placeholder_reply') : t('comments.placeholder')}
                            placeholderTextColor={theme.muted}
                            value={text}
                            onChangeText={setText}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, { backgroundColor: text.trim() ? theme.primary : theme.muted }]}
                            onPress={handleSend}
                        >
                            <Send size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    {!sendAsAnonymous && (
                        <Text style={{ color: theme.muted, fontSize: 10, marginTop: 8, fontStyle: 'italic' }}>
                            🛡️ {t('comments.privacy_note', { name: maskName(effectiveName) })}
                        </Text>
                    )}
                </View>
            ) : (
                <View style={[styles.loginPrompt, { backgroundColor: theme.card }]}>
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                        {t('comments.login_prompt_title')}
                    </Text>
                    <Text style={{ color: theme.muted, textAlign: 'center', fontSize: 13, marginBottom: 16 }}>
                        {t('comments.login_prompt_desc')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.authBtn, { backgroundColor: theme.primary }]}
                        onPress={() => { onClose(); router.push('/(tabs)/profile'); }}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('comments.login_button')}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    loading: {
        padding: 24,
        textAlign: 'center',
    },
    emptyText: {
        padding: 24,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    commentCard: {
        padding: 16,
        borderBottomWidth: 1,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    userName: {
        fontWeight: 'bold',
    },
    ownerBadge: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    commentText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 12,
    },
    commentActions: {
        flexDirection: 'row',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    actionText: {
        marginLeft: 6,
        fontSize: 14,
    },
    inputContainer: {
        padding: 16,
        borderTopWidth: 1,
    },
    anonToggle: {
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        maxHeight: 100,
        minHeight: 40,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    loginPrompt: {
        padding: 24,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    authBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    langTab: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    langTabSelected: {
        borderWidth: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    langTabText: {
        fontSize: 13,
    }
});
