import React, { useRef, useState } from 'react';
import {
    Clipboard,
    Modal,
    Platform,
    Share,
    StyleSheet,
    Text,
    ToastAndroid,
    TouchableOpacity,
    View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { FileText, Image as ImageIcon, Share2, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface NameShareCardProps {
    id: number;
    arabic: string;
    transliteration: string;
    meaning: string;
    explanation: string;
    reference: string;
}

/** Esma-ül Hüsna için Günün Ayeti ile aynı görsel paylaşım deneyimi. */
export function NameShareCard({
    id,
    arabic,
    transliteration,
    meaning,
    explanation,
    reference,
}: NameShareCardProps) {
    const { t } = useTranslation();
    const viewShotRef = useRef<any>(null);
    const [showAndroidOptions, setShowAndroidOptions] = useState(false);
    const webUrl = `https://kurannediyor.com.tr/names#name-${id}`;
    const deepLink = `kuran-kerim-diyor://names?id=${id}`;
    const shareText = `${t('names.title', 'Esma-ül Hüsna')} · ${transliteration}\n\n${meaning}\n\n${explanation}\n\n${reference}\n\n${webUrl}`;

    const handleSharePress = async () => {
        if (Platform.OS === 'android') {
            setShowAndroidOptions(true);
        } else {
            await shareIOS();
        }
    };

    const shareIOS = async () => {
        try {
            const uri = await viewShotRef.current.capture();
            await Share.share({
                url: uri,
                message: shareText,
            });
        } catch (error) {
            console.error('iOS Name sharing failed:', error);
        }
    };

    const handleAndroidImageShare = async () => {
        try {
            setShowAndroidOptions(false);
            const uri = await viewShotRef.current.capture();
            Clipboard.setString(webUrl);
            ToastAndroid.show(t('common.link_copied', 'Bağlantı panoya kopyalandı!'), ToastAndroid.SHORT);
            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: t('names.share_title', 'Esma-ül Hüsna paylaş'),
                UTI: 'public.png',
            });
        } catch (error) {
            console.error('Android Name image sharing failed:', error);
        }
    };

    const handleAndroidTextShare = async () => {
        try {
            setShowAndroidOptions(false);
            await Share.share({
                message: `${shareText}\n\nApp Link: ${deepLink}`,
                title: t('names.share_title', 'Esma-ül Hüsna paylaş'),
            });
        } catch (error) {
            console.error('Android Name text sharing failed:', error);
        }
    };

    return (
        <View style={styles.outerContainer}>
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={styles.cardContainer}>
                <View style={styles.decorationCircle} />
                <View style={styles.content}>
                    <Text style={styles.eyebrow}>{t('names.title', 'ESMA-ÜL HÜSNA').toUpperCase()}</Text>
                    <View style={styles.numberBadge}>
                        <Text style={styles.numberText}>{id}</Text>
                    </View>
                    <Text style={styles.nameArabic}>{arabic}</Text>
                    <Text style={styles.nameTransliteration}>{transliteration}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.meaning}>{meaning}</Text>
                    <Text style={styles.explanation} numberOfLines={5}>{explanation}</Text>
                    <Text style={styles.reference}>{reference}</Text>
                </View>
                <View style={styles.footer}>
                    <Text style={styles.appName}>Kur'an Ne Diyor?</Text>
                    <Text style={styles.appUrl}>kurannediyor.com.tr/names#name-{id}</Text>
                </View>
            </ViewShot>

            <TouchableOpacity style={styles.shareButton} onPress={handleSharePress}>
                <Share2 size={20} color="#fff" />
                <Text style={styles.shareButtonText}>{t('common.share', 'Paylaş')}</Text>
            </TouchableOpacity>

            <Modal visible={showAndroidOptions} transparent animationType="fade" onRequestClose={() => setShowAndroidOptions(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('names.share_title', 'Esma-ül Hüsna paylaş')}</Text>
                            <TouchableOpacity onPress={() => setShowAndroidOptions(false)} style={styles.closeButton}>
                                <X size={20} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.optionButton} onPress={handleAndroidImageShare}>
                            <View style={styles.optionIconContainer}><ImageIcon size={24} color="#B69A73" /></View>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>{t('common.share_as_image', 'Görsel Olarak Paylaş')}</Text>
                                <Text style={styles.optionDescription}>{t('common.share_as_image_desc', 'Görsel oluşturulur ve bağlantı panoya kopyalanır.')}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.optionButton} onPress={handleAndroidTextShare}>
                            <View style={styles.optionIconContainer}><FileText size={24} color="#B69A73" /></View>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>{t('common.share_as_text', 'Metin Olarak Paylaş')}</Text>
                                <Text style={styles.optionDescription}>{t('common.share_as_text_desc', 'İçerik ve bağlantı metin olarak paylaşılır.')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: { alignItems: 'center', padding: 20 },
    cardContainer: {
        width: 320,
        minHeight: 460,
        backgroundColor: '#B69A73',
        borderRadius: 24,
        padding: 28,
        justifyContent: 'space-between',
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    decorationCircle: {
        position: 'absolute', top: -55, right: -55, width: 210, height: 210,
        borderRadius: 105, backgroundColor: 'rgba(255,255,255,0.12)',
    },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    eyebrow: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
    numberBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    numberText: { color: '#fff', fontSize: 14, fontWeight: '800' },
    nameArabic: { color: '#fff', fontFamily: 'NotoNaskhArabic_700Bold', fontSize: 38, fontWeight: '700', textAlign: 'center', lineHeight: 58 },
    nameTransliteration: { color: '#fff', fontSize: 19, fontWeight: '800', textAlign: 'center', marginTop: 2 },
    divider: { width: 42, height: 2, backgroundColor: 'rgba(255,255,255,0.55)', marginVertical: 14 },
    meaning: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
    explanation: { color: 'rgba(255,255,255,0.9)', fontSize: 12, lineHeight: 18, textAlign: 'center' },
    reference: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', marginTop: 12, textAlign: 'center' },
    footer: { alignItems: 'center', marginTop: 18, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 12 },
    appName: { color: '#fff', fontSize: 12, fontWeight: '700' },
    appUrl: { color: 'rgba(255,255,255,0.62)', fontSize: 10, marginTop: 2 },
    shareButton: { flexDirection: 'row', backgroundColor: '#2D2D2D', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 30, marginTop: 20, alignItems: 'center', gap: 8 },
    shareButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    closeButton: { padding: 4 },
    optionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 16, padding: 16, marginBottom: 12 },
    optionIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(182,154,115,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    optionTextContainer: { flex: 1 },
    optionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
    optionDescription: { fontSize: 12, color: '#777', lineHeight: 16 },
});
