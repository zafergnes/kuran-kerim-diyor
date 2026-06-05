import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';
import { Ayah } from '../services/quranData';
import { useUserStore } from '../store/userStore';
import { MessageSquare } from 'lucide-react-native';
import { CommentSheet } from './CommentSheet';
import { AudioPlayer } from './AudioPlayer';
import { useTranslation } from 'react-i18next';
import { useAyahStats } from '../hooks/useAyahStats';

interface AyahCardProps {
    ayah: Ayah;
    surahName: string;
    surahNumber: number;
}

export function AyahCard({ ayah, surahName, surahNumber }: AyahCardProps) {
    const { language, showArabicTranslation, arabicTranslationLang, selectedArabicScript } = useUserStore();
    const { stats, refresh } = useAyahStats(surahNumber, ayah.number);
    const theme = Colors.light;
    const [showComments, setShowComments] = useState(false);
    const { t } = useTranslation();

    // Arapca kullanici: meal tercihine gore goster/gizle
    const isArabicUser = language === 'ar';
    const displayLang = isArabicUser ? arabicTranslationLang : language;
    const translationText = ayah.translations[displayLang];
    const shouldShowTranslation = !isArabicUser || showArabicTranslation;

    const arabicText = (selectedArabicScript === 'diyanet' && ayah.arabicDiyanet) ? ayah.arabicDiyanet : ayah.arabic;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentInner}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.arabicText, { color: theme.text }]}>
                    {arabicText.replace(/\s+/g, '\u2002')}
                </Text>
                {shouldShowTranslation && translationText ? (
                    <Text style={[styles.translationText, { color: theme.secondary }]}>
                        {translationText}
                    </Text>
                ) : null}
            </ScrollView>

            <View style={styles.footer}>
                <AudioPlayer globalAyahNumber={ayah.globalNumber} />

                <Text style={[styles.metaText, { color: theme.muted, marginHorizontal: 16 }]}>
                    {surahName} • {t('common.ayah')} {ayah.number}
                </Text>

                <TouchableOpacity style={styles.commentBtn} onPress={() => setShowComments(true)}>
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
    commentBtn: {
        padding: 8,
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
