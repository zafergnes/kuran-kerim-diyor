import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, useColorScheme } from 'react-native';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';
import { Award, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export function CelebrationModal() {
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const activeCelebration = useUserStore((state) => state.activeCelebration);
    const setActiveCelebration = useUserStore((state) => state.setActiveCelebration);

    if (!activeCelebration) return null;

    const handleClose = () => {
        setActiveCelebration(null);
    };

    return (
        <Modal transparent visible={!!activeCelebration} animationType="fade" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
                    {/* Icon Container with glowing aesthetics */}
                    <View style={[styles.iconWrapper, { backgroundColor: theme.primary + '15' }]}>
                        <Award color={theme.primary} size={48} />
                        <Star size={16} color="#fbbf24" style={styles.starIcon} />
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: theme.text }]}>
                        {t('achievements.modal_title', 'Tebrikler!')}
                    </Text>
                    
                    <Text style={[styles.subtitle, { color: theme.primary }]}>
                        {t('achievements.modal_subtitle', 'Yeni bir başarı kilidi açıldı!')}
                    </Text>

                    {/* Badge Info Box */}
                    <View style={[styles.badgeBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <Text style={[styles.badgeTitle, { color: theme.text }]}>
                            {t(`achievements.badge_${activeCelebration}_title`)}
                        </Text>
                        <Text style={[styles.badgeDesc, { color: theme.secondary }]}>
                            {t(`achievements.badge_${activeCelebration}_desc`)}
                        </Text>
                    </View>

                    {/* Close Button */}
                    <TouchableOpacity 
                        style={[styles.closeBtn, { backgroundColor: theme.primary }]} 
                        onPress={handleClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.closeBtnText}>
                            {t('achievements.modal_close', 'Harika')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalBox: {
        width: '100%',
        maxWidth: 320,
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    iconWrapper: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    starIcon: {
        position: 'absolute',
        top: 6,
        right: 6,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    badgeBox: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    badgeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 6,
    },
    badgeDesc: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
    },
    closeBtn: {
        width: '100%',
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    closeBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
});
