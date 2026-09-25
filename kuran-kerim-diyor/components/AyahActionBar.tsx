import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated } from 'react-native';
import { Sparkles, MessageSquare, Share2, Heart, Play, Pause } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../hooks/useAppTheme';
import { useUserStore } from '../store/userStore';
import { useAyahStats } from '../hooks/useAyahStats';
import { CommentSheet } from './CommentSheet';
import { VerseShareCard } from './VerseShareCard';
import { VerseChatModal } from './VerseChatModal';
import { DeleteWarningModal } from './DeleteWarningModal';
import { AnalyticsService } from '../services/analyticsService';

interface AyahActionBarProps {
    surahNumber: number;
    ayahNumber: number;
    surahName: string;
    translation: string;
    analyticsScreen: 'single_verse' | 'page_reader';
    primaryAction?: 'ai' | 'play';
    isPlaying?: boolean;
    onPlayPress?: () => void;
}

const formatCount = (n: number) => {
    if (n < 1000) return n.toString();
    return (n / 1000).toFixed(1) + 'k';
};

/**
 * Her iki okuma görünümünde (ayet ayet / sayfa sayfa) kullanılan
 * ortak ayet aksiyon barı. Etiketli butonlar:
 * AI Sor (Sparkles) — Yorumlar (MessageSquare) — Paylaş (Share2) — Kaydet (Heart)
 */
export function AyahActionBar({
    surahNumber,
    ayahNumber,
    surahName,
    translation,
    analyticsScreen,
    primaryAction = 'ai',
    isPlaying = false,
    onPlayPress,
}: AyahActionBarProps) {
    const { t } = useTranslation();
    const { theme } = useAppTheme();

    const { favorites, toggleFavorite, hideFavoriteDeleteWarning, setHideFavoriteDeleteWarning } = useUserStore();
    const { commentCount, favoriteCount, refresh, incrementOptimistic } = useAyahStats(surahNumber, ayahNumber);

    const [showComments, setShowComments] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showDeleteWarning, setShowDeleteWarning] = useState(false);

    const favoriteId = `${surahNumber}_${ayahNumber}`;
    const isFavorited = !!favorites[favoriteId];
    const heartScale = useRef(new Animated.Value(1)).current;

    const executeToggle = () => {
        toggleFavorite(favoriteId);
        incrementOptimistic(isFavorited ? -1 : 1);
        Animated.sequence([
            Animated.spring(heartScale, { toValue: 1.35, useNativeDriver: true, speed: 20 }),
            Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
        ]).start();
    };

    const handleToggleFavorite = () => {
        if (isFavorited && !hideFavoriteDeleteWarning) {
            setShowDeleteWarning(true);
        } else {
            executeToggle();
        }
    };

    const handleConfirmDelete = (dontAskAgain: boolean) => {
        if (dontAskAgain) setHideFavoriteDeleteWarning(true);
        setShowDeleteWarning(false);
        executeToggle();
    };

    const closeComments = () => {
        setShowComments(false);
        refresh();
    };

    const openChat = () => {
        setShowChat(true);
        void AnalyticsService.track('AI_CHAT_OPEN', { screen: analyticsScreen, metadata: { surahNumber, ayahNumber } });
    };

    return (
        <View style={styles.container}>
            {/* Sol Taraf: Dinle veya AI Sor pill butonu */}
            {primaryAction === 'play' ? (
                <TouchableOpacity
                    style={[
                        styles.aiButton,
                        {
                            backgroundColor: isPlaying ? theme.primary : theme.card,
                            borderColor: isPlaying ? theme.primary : theme.border,
                            borderWidth: 1,
                        }
                    ]}
                    onPress={onPlayPress}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={isPlaying ? t('common.pause', 'Durdur') : t('common.listen', 'Dinle')}
                >
                    {isPlaying ? <Pause size={16} color="#fff" /> : <Play size={16} color={theme.primary} />}
                    <Text style={[styles.aiLabel, { color: isPlaying ? '#fff' : theme.primary }]} numberOfLines={1}>
                        {isPlaying ? t('common.pause', 'Durdur') : t('common.listen', 'Dinle')}
                    </Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={[styles.aiButton, { backgroundColor: theme.primary }]}
                    onPress={openChat}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={t('verse_chat.title', 'Ayet Üzerine Konuş')}
                >
                    <Sparkles size={16} color="#fff" />
                    <Text style={styles.aiLabel} numberOfLines={1}>
                        {t('common.ask_ai', 'Sor')}
                    </Text>
                </TouchableOpacity>
            )}

            {/* Sağ Küme: Yorumlar, Paylaş, Kaydet — Diller arası asla taşmayan ikon + sayaç düzeni */}
            <View style={styles.actionsCluster}>
                {/* Yorumlar */}
                <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => setShowComments(true)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.comments', 'Yorumlar')}
                >
                    <MessageSquare size={17} color={commentCount > 0 ? theme.primary : theme.text} />
                    {commentCount > 0 && (
                        <Text style={[styles.countText, { color: theme.primary }]}>
                            {formatCount(commentCount)}
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Paylaş */}
                <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => setShowShare(true)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.share', 'Paylaş')}
                >
                    <Share2 size={17} color={theme.text} />
                </TouchableOpacity>

                {/* Kaydet / Favori */}
                <TouchableOpacity
                    style={[
                        styles.iconButton,
                        { backgroundColor: theme.card, borderColor: theme.border },
                        isFavorited && { backgroundColor: theme.primary + '14', borderColor: theme.primary + '50' }
                    ]}
                    onPress={handleToggleFavorite}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.save', 'Kaydet')}
                >
                    <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                        <Heart
                            size={17}
                            color={isFavorited ? '#E53935' : theme.text}
                            fill={isFavorited ? '#E53935' : 'transparent'}
                        />
                    </Animated.View>
                    {favoriteCount > 0 && (
                        <Text style={[styles.countText, { color: isFavorited ? '#E53935' : theme.text }]}>
                            {formatCount(favoriteCount)}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Yorumlar */}
            <Modal
                visible={showComments}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeComments}
            >
                <View style={{ flex: 1, backgroundColor: theme.background }}>
                    <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
                        <TouchableOpacity onPress={closeComments} style={{ padding: 16 }}>
                            <Text style={{ color: theme.primary, fontSize: 16, fontWeight: 'bold' }}>
                                {t('common.close')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <CommentSheet surahNo={surahNumber} ayahNo={ayahNumber} onClose={closeComments} />
                </View>
            </Modal>

            {/* Paylaş */}
            <Modal
                visible={showShare}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowShare(false)}
            >
                <View style={{ flex: 1, backgroundColor: theme.background }}>
                    <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
                        <TouchableOpacity onPress={() => setShowShare(false)} style={{ padding: 16 }}>
                            <Text style={{ color: theme.primary, fontSize: 16, fontWeight: 'bold' }}>
                                {t('common.close')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                        <VerseShareCard
                            text={translation}
                            reference={`${surahName} ${surahNumber}:${ayahNumber}`}
                            onClose={() => setShowShare(false)}
                        />
                    </ScrollView>
                </View>
            </Modal>

            {/* AI Sohbet */}
            <VerseChatModal
                visible={showChat}
                onClose={() => setShowChat(false)}
                surahNumber={surahNumber}
                ayahNumber={ayahNumber}
                reference={`${surahName} ${ayahNumber}`}
                translation={translation}
            />

            {/* Favoriden çıkarma uyarısı */}
            <DeleteWarningModal
                visible={showDeleteWarning}
                onConfirm={handleConfirmDelete}
                onCancel={() => setShowDeleteWarning(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: 10,
    },
    aiButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        height: 42,
        borderRadius: 21,
        paddingHorizontal: 16,
    },
    aiLabel: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    actionsCluster: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        height: 42,
        minWidth: 42,
        paddingHorizontal: 11,
        borderRadius: 21,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    },
    countText: {
        fontSize: 12,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    sheetHeader: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        alignItems: 'flex-start',
    },
});
