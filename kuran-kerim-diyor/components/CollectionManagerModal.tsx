import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { Check, Plus, X } from 'lucide-react-native';
import { useUserStore } from '../store/userStore';
import { useTranslation } from 'react-i18next';

interface CollectionManagerModalProps {
    visible: boolean;
    ayahId: string | null;
    onClose: () => void;
}

export function CollectionManagerModal({ visible, ayahId, onClose }: CollectionManagerModalProps) {
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    const { collections, addCollection, addAyahToCollection, removeAyahFromCollection } = useUserStore();
    const [newColName, setNewColName] = useState('');

    if (!visible || !ayahId) return null;

    const handleCreateCol = () => {
        if (newColName.trim().length > 0) {
            addCollection(newColName.trim(), ayahId);
            setNewColName('');
            onClose(); // Automatically close after creation
        }
    };

    const toggleCollection = (colId: string, isCurrentlyIn: boolean) => {
        if (isCurrentlyIn) {
            removeAyahFromCollection(ayahId, colId);
        } else {
            addAyahToCollection(ayahId, colId);
            onClose(); // Close modal after adding
        }
    };

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
                style={styles.overlay}
            >
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                <View style={[styles.bottomSheet, { backgroundColor: theme.background }]}>
                        
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: theme.text }]}>{t('favorites.add_to_collections')}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
                            {Object.values(collections).map(col => {
                                const isAdded = !!col.ayahs[ayahId];
                                return (
                                    <TouchableOpacity 
                                        key={col.id}
                                        style={[styles.colRow, { borderBottomColor: theme.border }]}
                                        onPress={() => toggleCollection(col.id, isAdded)}
                                    >
                                        <Text style={[styles.colName, { color: theme.text }]}>{col.name}</Text>
                                        <View style={[styles.checkbox, { borderColor: theme.border, backgroundColor: isAdded ? theme.primary : 'transparent' }]}>
                                            {isAdded && <Check size={16} color="#fff" />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <View style={[styles.newColContainer, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder={t('favorites.create_new_collection')}
                                placeholderTextColor={theme.muted}
                                value={newColName}
                                onChangeText={setNewColName}
                            />
                            <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={handleCreateCol}>
                                <Plus size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        width: '100%',
        height: SCREEN_HEIGHT * 0.5,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 16,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeBtn: {
        position: 'absolute',
        right: 20,
        top: 0,
        padding: 4,
    },
    list: {
        flex: 1,
        paddingHorizontal: 20,
    },
    colRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    colName: {
        fontSize: 16,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    newColContainer: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginRight: 12,
        fontSize: 16,
    },
    addBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
