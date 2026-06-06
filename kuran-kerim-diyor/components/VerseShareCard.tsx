import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Modal, Share, ToastAndroid, Clipboard } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Share2, Image as ImageIcon, FileText, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/colors';
import { searchAyahs } from '../services/quranData';

interface VerseShareCardProps {
  text: string;
  reference: string;
  onClose?: () => void;
}

export const VerseShareCard: React.FC<VerseShareCardProps> = ({ text, reference, onClose }) => {
  const { t } = useTranslation();
  const viewShotRef = useRef<any>(null);
  const theme = Colors.light;
  const [showAndroidOptions, setShowAndroidOptions] = useState(false);

  const getRefIds = (ref: string) => {
    try {
      const trimmed = ref.trim();
      const tailDigits = trimmed.match(/(\d{1,3})(-\d{1,3})?$/);
      if (!tailDigits) return { surahNum: 1, ayahNum: 1 };

      const startAyah = parseInt(tailDigits[1], 10);
      let namePart = trimmed.substring(0, tailDigits.index!).trim();
      namePart = namePart.replace(/[:.\-\s]+$/, '').trim();

      const searchResults = searchAyahs(namePart);
      const surahNum = searchResults[0]?.surahNumber || 1;

      return { surahNum, ayahNum: startAyah };
    } catch (e) {
      console.error("Error parsing reference to numbers:", e);
      return { surahNum: 1, ayahNum: 1 };
    }
  };

  const { surahNum, ayahNum } = getRefIds(reference);
  const webUrl = `https://kurannediyor.com.tr/ayet/${surahNum}:${ayahNum}`;
  const deepLink = `kuran-kerim-diyor://ayet?id=${surahNum}:${ayahNum}`;

  const shareText = `${t('common.share_message', { reference, url: webUrl })}\n\nApp Link: ${deepLink}`;

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
        message: t('common.share_message', { reference, url: webUrl }),
      });
    } catch (error) {
      console.error('iOS Sharing failed:', error);
    }
  };

  const handleAndroidImageShare = async () => {
    try {
      setShowAndroidOptions(false);
      const uri = await viewShotRef.current.capture();
      
      // Copy web link to clipboard to solve Android visual share limitation
      Clipboard.setString(webUrl);
      ToastAndroid.show(t('common.link_copied', 'Bağlantı panoya kopyalandı!'), ToastAndroid.SHORT);

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t('common.share_verse'),
        UTI: 'public.png',
      });
    } catch (error) {
      console.error('Android Image Sharing failed:', error);
    }
  };

  const handleAndroidTextShare = async () => {
    try {
      setShowAndroidOptions(false);
      await Share.share({
        message: shareText,
        title: t('common.share_verse'),
      });
    } catch (error) {
      console.error('Android Text Sharing failed:', error);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'png', quality: 1.0 }}
        style={styles.cardContainer}
      >
        {/* Background Decoration */}
        <View style={styles.decorationCircle} />
        
        <View style={styles.content}>
          <Text style={styles.quoteMark}>“</Text>
          <Text style={styles.verseText}>{text}</Text>
          <View style={styles.divider} />
          <Text style={styles.referenceText}>{reference}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.appName}>Kuran Kerim Diyor</Text>
          <Text style={styles.appUrl}>kurannediyor.com.tr/ayet/{surahNum}:{ayahNum}</Text>
        </View>
      </ViewShot>

      <TouchableOpacity style={styles.shareButton} onPress={handleSharePress}>
        <Share2 size={20} color="#fff" />
        <Text style={styles.shareButtonText}>{t('common.share')}</Text>
      </TouchableOpacity>

      {/* Android Share Options Modal */}
      <Modal
        visible={showAndroidOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAndroidOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('common.share_verse', 'Ayeti Paylaş')}</Text>
              <TouchableOpacity onPress={() => setShowAndroidOptions(false)} style={styles.closeButton}>
                <X size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.optionButton} onPress={handleAndroidImageShare}>
              <View style={styles.optionIconContainer}>
                <ImageIcon size={24} color="#B69A73" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{t('common.share_as_image', 'Görsel Olarak Paylaş')}</Text>
                <Text style={styles.optionDescription}>{t('common.share_as_image_desc', 'Görsel oluşturulur ve web bağlantısı panoya kopyalanır.')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionButton} onPress={handleAndroidTextShare}>
              <View style={styles.optionIconContainer}>
                <FileText size={24} color="#B69A73" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{t('common.share_as_text', 'Metin Olarak Paylaş')}</Text>
                <Text style={styles.optionDescription}>{t('common.share_as_text_desc', 'Ayet meali, referansı, web adresi ve uygulama bağlantısı metin olarak paylaşılır.')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    width: 320,
    minHeight: 400,
    backgroundColor: '#B69A73', // Primary theme color
    borderRadius: 24,
    padding: 30,
    justifyContent: 'space-between',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  decorationCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteMark: {
    fontSize: 80,
    color: 'rgba(255, 255, 255, 0.2)',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    height: 60,
    marginBottom: -20,
  },
  verseText: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium',
    lineHeight: 30,
    fontStyle: 'italic',
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginVertical: 20,
  },
  referenceText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 15,
  },
  appName: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    opacity: 0.9,
  },
  appUrl: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: '#2D2D2D',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 20,
    alignItems: 'center',
    gap: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(182, 154, 115, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#777',
    lineHeight: 16,
  },
});
