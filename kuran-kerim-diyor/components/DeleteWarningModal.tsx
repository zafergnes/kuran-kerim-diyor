import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { Check, TriangleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface DeleteWarningModalProps {
    visible: boolean;
    onConfirm: (dontAskAgain: boolean) => void;
    onCancel: () => void;
}

export function DeleteWarningModal({ visible, onConfirm, onCancel }: DeleteWarningModalProps) {
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    const [dontAskAgain, setDontAskAgain] = useState(false);

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
            <View style={styles.overlay}>
                <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
                    <TriangleAlert color={theme.primary} size={40} style={{ alignSelf: 'center', marginBottom: 12 }} />
                    <Text style={[styles.title, { color: theme.text }]}>{t('delete_warning.title')}</Text>
                    <Text style={[styles.subtitle, { color: theme.secondary }]}>
                        {t('delete_warning.message')}
                    </Text>

                    <TouchableOpacity 
                        style={styles.checkboxRow} 
                        onPress={() => setDontAskAgain(!dontAskAgain)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, { borderColor: theme.border, backgroundColor: dontAskAgain ? theme.primary : 'transparent' }]}>
                            {dontAskAgain && <Check size={14} color="#fff" />}
                        </View>
                        <Text style={{ color: theme.secondary, fontSize: 13 }}>{t('delete_warning.dont_ask')}</Text>
                    </TouchableOpacity>

                    <View style={styles.actions}>
                        <TouchableOpacity style={[styles.btn, styles.btnCancel, { borderColor: theme.border }]} onPress={onCancel}>
                            <Text style={{ color: theme.text, fontWeight: 'bold' }}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }]} onPress={() => onConfirm(dontAskAgain)}>
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('common.delete')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalBox: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 16,
        padding: 24,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        alignSelf: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1,
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    btn: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    btnCancel: {
        borderWidth: 1,
        marginRight: 12,
    }
});
