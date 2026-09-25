import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, X, Check } from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useUserStore } from '../store/userStore';

interface FontSizeModalProps {
    visible: boolean;
    onClose: () => void;
}

const PRESETS = [
    { scale: 0.85, labelKey: 'font_modal.preset_small', defaultLabel: 'Küçük' },
    { scale: 1.0, labelKey: 'font_modal.preset_standard', defaultLabel: 'Standart' },
    { scale: 1.2, labelKey: 'font_modal.preset_medium', defaultLabel: 'Orta' },
    { scale: 1.4, labelKey: 'font_modal.preset_large', defaultLabel: 'Büyük' },
    { scale: 1.7, labelKey: 'font_modal.preset_xlarge', defaultLabel: 'Çok Büyük' },
    { scale: 2.0, labelKey: 'font_modal.preset_huge', defaultLabel: 'Dev Boyut' },
];

export const FontSizeModal: React.FC<FontSizeModalProps> = ({ visible, onClose }) => {
    const { t } = useTranslation();
    const { theme } = useAppTheme();
    const {
        fontSizeScale,
        setFontSizeScale,
        arabicFontFamily,
        setArabicFontFamily,
    } = useUserStore();

    const currentScale = fontSizeScale || 1.4;
    const percentage = Math.round(currentScale * 100);

    const handleStep = (delta: number) => {
        const next = Math.round((currentScale + delta) * 100) / 100;
        setFontSizeScale(next);
    };

    const previewArabicSize = Math.round((arabicFontFamily === 'noto-naskh' ? 22 : 24) * currentScale);
    const previewArabicFont = arabicFontFamily === 'noto-naskh' ? 'NotoNaskhArabic_700Bold' : 'Amiri_700Bold';
    const previewTranslationSize = Math.round(15 * currentScale);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            {/* Header */}
                            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                                <View style={styles.headerTitleWrap}>
                                    <View style={[styles.iconWrap, { backgroundColor: `${theme.primary}18` }]}>
                                        <Text style={[styles.iconSmallA, { color: theme.primary }]}>a</Text>
                                        <Text style={[styles.iconBigA, { color: theme.primary }]}>A</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                                            {t('font_modal.title', 'Metin Boyutu ve Hat Stili')}
                                        </Text>
                                        <Text style={[styles.subtitle, { color: theme.muted }]} numberOfLines={1}>
                                            %{percentage} • {percentage >= 135 && percentage <= 145 ? t('font_modal.default_badge', 'Varsayılan') : t('font_modal.custom_badge', 'Özel Boyut')}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={[styles.closeBtn, { backgroundColor: theme.background }]}
                                    onPress={onClose}
                                    accessibilityRole="button"
                                    accessibilityLabel={t('common.close', 'Kapat')}
                                >
                                    <X size={18} color={theme.muted} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.scrollBody}
                                bounces={false}
                            >
                                {/* Stepper Controls */}
                                <View style={styles.section}>
                                    <View style={[styles.stepperContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                        <TouchableOpacity
                                            style={[
                                                styles.stepBtn,
                                                { backgroundColor: theme.card, borderColor: theme.border },
                                                currentScale <= 0.8 && styles.stepBtnDisabled
                                            ]}
                                            onPress={() => handleStep(-0.05)}
                                            disabled={currentScale <= 0.8}
                                            accessibilityLabel="Metni küçült"
                                        >
                                            <Minus size={20} color={currentScale <= 0.8 ? theme.border : theme.text} />
                                        </TouchableOpacity>

                                        <View style={styles.percentageWrap}>
                                            <Text style={[styles.percentageText, { color: theme.primary }]}>
                                                %{percentage}
                                            </Text>
                                            <Text style={[styles.percentageSub, { color: theme.muted }]}>
                                                {percentage <= 90
                                                    ? t('font_modal.preset_small', 'Küçük')
                                                    : percentage <= 108
                                                    ? t('font_modal.preset_standard', 'Standart')
                                                    : percentage <= 128
                                                    ? t('font_modal.preset_medium', 'Orta')
                                                    : percentage <= 150
                                                    ? t('font_modal.preset_large', 'Büyük (Varsayılan)')
                                                    : percentage <= 180
                                                    ? t('font_modal.preset_xlarge', 'Çok Büyük')
                                                    : t('font_modal.preset_huge', 'Dev Boyut (%200)')}
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[
                                                styles.stepBtn,
                                                { backgroundColor: theme.card, borderColor: theme.border },
                                                currentScale >= 2.0 && styles.stepBtnDisabled
                                            ]}
                                            onPress={() => handleStep(0.05)}
                                            disabled={currentScale >= 2.0}
                                            accessibilityLabel="Metni büyüt"
                                        >
                                            <Plus size={20} color={currentScale >= 2.0 ? theme.border : theme.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* 6 Preset Buttons (2 Rows x 3 Columns Grid - Zero Overflow) */}
                                <View style={styles.presetsGrid}>
                                    {PRESETS.map((preset) => {
                                        const isSelected = Math.abs(currentScale - preset.scale) < 0.04;
                                        return (
                                            <TouchableOpacity
                                                key={preset.scale}
                                                style={[
                                                    styles.presetChip,
                                                    {
                                                        backgroundColor: isSelected ? theme.primary : theme.background,
                                                        borderColor: isSelected ? theme.primary : theme.border,
                                                    }
                                                ]}
                                                onPress={() => setFontSizeScale(preset.scale)}
                                                activeOpacity={0.7}
                                            >
                                                <Text
                                                    style={[
                                                        styles.presetChipText,
                                                        { color: isSelected ? '#fff' : theme.text }
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {t(preset.labelKey, preset.defaultLabel)}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.presetScaleText,
                                                        { color: isSelected ? 'rgba(255,255,255,0.85)' : theme.muted }
                                                    ]}
                                                >
                                                    %{Math.round(preset.scale * 100)}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Hat Stili Seçici */}
                                <View style={styles.fontFamilySection}>
                                    <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                                        {t('font_modal.font_family_title', 'Arapça Hat Stili')}
                                    </Text>
                                    <View style={styles.fontFamilyRow}>
                                        <TouchableOpacity
                                            style={[
                                                styles.fontFamilyCard,
                                                {
                                                    backgroundColor: arabicFontFamily === 'noto-naskh' ? `${theme.primary}14` : theme.background,
                                                    borderColor: arabicFontFamily === 'noto-naskh' ? theme.primary : theme.border,
                                                }
                                            ]}
                                            onPress={() => setArabicFontFamily('noto-naskh')}
                                        >
                                            <Text style={[styles.fontFamilyCardTitle, { color: theme.text }]}>
                                                {t('settings.font_noto_naskh', 'Diyanet (Nesih)')}
                                            </Text>
                                            {arabicFontFamily === 'noto-naskh' && (
                                                <Check size={16} color={theme.primary} />
                                            )}
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.fontFamilyCard,
                                                {
                                                    backgroundColor: arabicFontFamily === 'amiri' ? `${theme.primary}14` : theme.background,
                                                    borderColor: arabicFontFamily === 'amiri' ? theme.primary : theme.border,
                                                }
                                            ]}
                                            onPress={() => setArabicFontFamily('amiri')}
                                        >
                                            <Text style={[styles.fontFamilyCardTitle, { color: theme.text }]}>
                                                {t('settings.font_amiri', 'Klasik (Amiri)')}
                                            </Text>
                                            {arabicFontFamily === 'amiri' && (
                                                <Check size={16} color={theme.primary} />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Canlı Önizleme */}
                                <View style={styles.previewSection}>
                                    <Text style={[styles.sectionLabel, { color: theme.muted }]}>
                                        {t('font_modal.preview_title', 'Canlı Önizleme')}
                                    </Text>
                                    <View style={[styles.previewBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                        <Text
                                            style={[
                                                styles.previewArabic,
                                                {
                                                    color: theme.text,
                                                    fontFamily: previewArabicFont,
                                                    fontSize: previewArabicSize,
                                                    lineHeight: Math.round(previewArabicSize * 1.8),
                                                }
                                            ]}
                                        >
                                            {t('font_modal.preview_arabic', 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ')}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.previewTranslation,
                                                {
                                                    color: theme.secondary,
                                                    fontSize: previewTranslationSize,
                                                    lineHeight: Math.round(previewTranslationSize * 1.55),
                                                }
                                            ]}
                                        >
                                            {t('font_modal.preview_translation', "Rahmân ve Rahîm olan Allah'ın adıyla.")}
                                        </Text>
                                    </View>
                                </View>
                            </ScrollView>

                            {/* Tamam / Kapat Butonu */}
                            <TouchableOpacity
                                style={[styles.doneBtn, { backgroundColor: theme.primary }]}
                                onPress={onClose}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.doneBtnText}>
                                    {t('font_modal.done', 'Tamam')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        maxHeight: '90%',
        borderRadius: 22,
        borderWidth: 1,
        padding: 18,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        paddingRight: 8,
    },
    iconWrap: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    iconSmallA: {
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 16,
    },
    iconBigA: {
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 20,
        marginLeft: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 1,
    },
    closeBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollBody: {
        paddingVertical: 6,
    },
    section: {
        marginTop: 10,
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 16,
        borderWidth: 1,
        padding: 6,
    },
    stepBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepBtnDisabled: {
        opacity: 0.35,
    },
    percentageWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    percentageText: {
        fontSize: 22,
        fontWeight: '800',
    },
    percentageSub: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    presetsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 8,
        marginTop: 12,
    },
    presetChip: {
        width: '31.5%',
        paddingVertical: 10,
        paddingHorizontal: 2,
        borderRadius: 12,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
    },
    presetChipText: {
        fontSize: 11.5,
        fontWeight: '700',
        textAlign: 'center',
    },
    presetScaleText: {
        fontSize: 10.5,
        fontWeight: '600',
        marginTop: 3,
        textAlign: 'center',
    },
    fontFamilySection: {
        marginTop: 14,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    fontFamilyRow: {
        flexDirection: 'row',
        gap: 10,
    },
    fontFamilyCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    fontFamilyCardTitle: {
        fontSize: 12.5,
        fontWeight: '600',
    },
    previewSection: {
        marginTop: 14,
    },
    previewBox: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    previewArabic: {
        textAlign: 'center',
        writingDirection: 'rtl',
    },
    previewTranslation: {
        textAlign: 'center',
        marginTop: 6,
    },
    doneBtn: {
        marginTop: 12,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});
