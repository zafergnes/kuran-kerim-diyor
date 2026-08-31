import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { Ayah } from '../services/quranData';
import { useUserStore } from '../store/userStore';
import { MessageSquare, Share2, Sparkles } from 'lucide-react-native';
import { CommentSheet } from './CommentSheet';
import { AudioPlayer } from './AudioPlayer';
import { VerseShareCard } from './VerseShareCard';
import { useTranslation } from 'react-i18next';
import { useAyahStats } from '../hooks/useAyahStats';
import { splitBismillah, isSajdahAyah, hasBismillah } from '../utils/quranHelpers';
import { VerseChatModal } from './VerseChatModal';
import { AnalyticsService } from '../services/analyticsService';
import { getHighlightedLetterCount, splitWordAtHighlightedLetter } from '../utils/audioTextProgress';

interface AyahCardProps {
    ayah: Ayah;
    surahName: string;
    surahNumber: number;
    onAudioInteractionChange?: (isInteracting: boolean) => void;
}

export function AyahCard({ ayah, surahName, surahNumber, onAudioInteractionChange }: AyahCardProps) {
    const { language, showArabicTranslation, arabicTranslationLang, selectedArabicScript } = useUserStore();
    const { stats, refresh } = useAyahStats(surahNumber, ayah.number);
    const { theme } = useAppTheme();
    const [showComments, setShowComments] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showVerseChat, setShowVerseChat] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [seekProgress, setSeekProgress] = useState<number | null>(null);
    const { t } = useTranslation();

    // Arapca kullanici: meal tercihine gore goster/gizle
    const isArabicUser = language === 'ar';
    const displayLang = isArabicUser ? arabicTranslationLang : language;
    const translationText = ayah.translations[displayLang];
    const shouldShowTranslation = !isArabicUser || showArabicTranslation;

    const rawArabicText = (selectedArabicScript === 'diyanet' && ayah.arabicDiyanet) ? ayah.arabicDiyanet : ayah.arabic;

    // Besmele ayrıştırma
    let bismillahToRender: string | null = null;
    let finalArabicText = rawArabicText;
    
    if (ayah.number === 1 && hasBismillah(surahNumber)) {
        const splitResult = splitBismillah(rawArabicText);
        bismillahToRender = splitResult.bismillah;
        finalArabicText = splitResult.ayahText;
    }

    // Lafzatullah renklendirme (Allah ve lillah lafizlari)
    const renderArabicText = (text: string) => {
        const words = text.split(/\s+/);
        const highlightedLetterCount = getHighlightedLetterCount(text, audioProgress);
        let consumedLetters = 0;

        return words.map((word, index) => {
            // Arapcadaki Allah ve Lillah kelimeleri (farkli harekelere ve harflere gore)
            const cleanWord = word.replace(/[^\u0621-\u064A\u0671-\u06D3]/g, '');
            const isAllah = cleanWord === 'الله' || cleanWord === 'اللَّه' || cleanWord === 'لله' || cleanWord === 'لِلَّهِ' || cleanWord === 'للَّه';
            const wordLetterCount = getHighlightedLetterCount(word, 1);
            const highlightedInWord = Math.min(wordLetterCount, Math.max(0, highlightedLetterCount - consumedLetters));
            const parts = splitWordAtHighlightedLetter(word, highlightedInWord);
            const wordStartProgress = consumedLetters / Math.max(1, getHighlightedLetterCount(text, 1));
            consumedLetters += wordLetterCount;
            
            return (
                <Text 
                    key={index} 
                    style={{ 
                        color: isAllah ? '#D32F2F' : theme.text,
                        fontWeight: isAllah ? 'bold' : 'normal'
                    }}
                    onPress={() => {
                        if (!isAudioPlaying) return;
                        setSeekProgress(null);
                        requestAnimationFrame(() => setSeekProgress(wordStartProgress));
                    }}
                >
                    {parts.highlighted ? (
                        <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{parts.highlighted}</Text>
                    ) : null}
                    {parts.remaining ? (
                        <Text style={{ color: isAllah ? '#D32F2F' : theme.text }}>{parts.remaining}</Text>
                    ) : null}
                    {index < words.length - 1 ? ' ' : ''}
                </Text>
            );
        });
    };

    const isSajdah = isSajdahAyah(surahNumber, ayah.number);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentInner}
                showsVerticalScrollIndicator={false}
            >
                {bismillahToRender && (
                    <View style={styles.bismillahContainer}>
                        <Text style={[styles.bismillahText, { color: theme.text }]}>
                            {bismillahToRender}
                        </Text>
                    </View>
                )}

                {isSajdah && (
                    <View style={[styles.sajdahBadge, { backgroundColor: 'rgba(182, 154, 115, 0.15)', borderColor: theme.primary }]}>
                        <Text style={[styles.sajdahBadgeText, { color: theme.primary }]}>
                            ۩ {t('common.sajdah', 'Secde Ayeti')}
                        </Text>
                    </View>
                )}

                <Text style={[styles.arabicText, { color: theme.text }]}>
                    {renderArabicText(finalArabicText.replace(/\s+/g, '\u2002'))}
                </Text>

                {shouldShowTranslation && translationText ? (
                    <View style={{ alignItems: 'center' }}>
                        <Text style={[styles.translationText, { color: theme.secondary }]}>
                            {translationText}
                        </Text>
                        {isSajdah && (
                            <Text style={styles.sajdahWarningText}>
                                ⚠️ {t('common.sajdah_warning', 'Bu ayet okunduğunda veya dinlendiğinde Tilavet Secdesi yapılması gerekir.')}
                            </Text>
                        )}
                    </View>
                ) : null}
            </ScrollView>

            <View style={styles.footer}>
                <AudioPlayer
                    globalAyahNumber={ayah.globalNumber}
                    onProgressChange={setAudioProgress}
                    seekProgress={seekProgress}
                    onPlayingChange={setIsAudioPlaying}
                    onScrubbingChange={onAudioInteractionChange}
                />

                <Text style={[styles.metaText, { color: theme.muted, marginHorizontal: 16 }]}>
                    {surahName} • {t('common.ayah')} {ayah.number}
                </Text>

                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.compactAiButton}
                        onPress={() => {
                            setShowVerseChat(true);
                            void AnalyticsService.track('AI_CHAT_OPEN', { screen: 'single_verse', metadata: { surahNumber, ayahNumber: ayah.number } });
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={t('verse_chat.title', 'Ayet Üzerine Konuş')}
                    >
                        <Sparkles size={18} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setShowShare(true)}>

                        <Share2 size={24} color={theme.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(true)}>
                        <View style={styles.commentBadgeContainer}>
                            <MessageSquare size={24} color={theme.primary} />
                            {stats && stats.commentCount > 0 && (
                                <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                                    <Text style={styles.badgeText}>{stats.commentCount}</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <Modal visible={showComments} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => {
                setShowComments(false);
                refresh();
            }}>
                <View style={{ flex: 1, backgroundColor: theme.background }}>
                    <View style={styles.sheetHeader}>
                        <TouchableOpacity onPress={() => {
                            setShowComments(false);
                            refresh();
                        }}>
                            <Text style={{ color: theme.primary, fontSize: 16, padding: 16, fontWeight: 'bold' }}>{t('common.close')}</Text>
                        </TouchableOpacity>
                    </View>
                    <CommentSheet surahNo={surahNumber} ayahNo={ayah.number} onClose={() => {
                        setShowComments(false);
                        refresh();
                    }} />
                </View>
            </Modal>

            <Modal visible={showShare} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowShare(false)}>
                <View style={{ flex: 1, backgroundColor: theme.background }}>
                    <View style={styles.sheetHeader}>
                        <TouchableOpacity onPress={() => setShowShare(false)}>
                            <Text style={{ color: theme.primary, fontSize: 16, padding: 16, fontWeight: 'bold' }}>{t('common.close')}</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                        <VerseShareCard 
                            text={translationText || rawArabicText} 
                            reference={`${surahName} ${surahNumber}:${ayah.number}`}
                            onClose={() => setShowShare(false)}
                        />
                    </ScrollView>
                </View>
            </Modal>

            <VerseChatModal
                visible={showVerseChat}
                onClose={() => setShowVerseChat(false)}
                surahNumber={surahNumber}
                ayahNumber={ayah.number}
                reference={`${surahName} ${ayah.number}`}
                translation={translationText || rawArabicText}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 24,
        paddingLeft: 24,
        paddingRight: 64,
    },
    content: {
        flex: 1,
        width: '100%',
    },
    contentInner: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    bismillahContainer: {
        marginBottom: 20,
        alignItems: 'center',
        width: '100%',
    },
    bismillahText: {
        fontFamily: 'Amiri_700Bold',
        fontSize: 28,
        lineHeight: 48,
        textAlign: 'center',
        writingDirection: 'rtl',
    },
    sajdahBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sajdahBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    sajdahWarningText: {
        fontSize: 12,
        color: '#D32F2F',
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic',
        fontWeight: '600',
        paddingHorizontal: 20,
    },
    arabicText: {
        fontFamily: 'Amiri_700Bold',
        fontSize: 34,
        lineHeight: 78,
        textAlign: 'center',
        writingDirection: 'rtl',
        marginBottom: 40,
    },
    translationText: {
        fontSize: 18,
        lineHeight: 28,
        textAlign: 'center',
    },
    footer: {
        paddingVertical: 24,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metaText: {
        fontSize: 14,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionBtn: {
        padding: 8,
    },
    compactAiButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(182, 154, 115, 0.10)',
    },
    commentBadgeContainer: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -8,
        right: -8,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    sheetHeader: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'flex-start',
    }
});
