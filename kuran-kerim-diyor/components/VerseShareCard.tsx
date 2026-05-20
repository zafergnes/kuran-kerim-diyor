import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Share2, Download } from 'lucide-react-native';
import { Colors } from '../constants/colors';

interface VerseShareCardProps {
  text: string;
  reference: string;
}

export const VerseShareCard: React.FC<VerseShareCardProps> = ({ text, reference }) => {
  const viewShotRef = useRef<any>(null);
  const theme = Colors.light;

  const captureAndShare = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      const webUrl = `https://kuran-diyor.app/ayet/${reference.replace(' ', ':')}`;
      
      // Platforma gore en iyi paylasim yontemi
      if (Platform.OS === 'ios') {
        const { Share } = await import('react-native');
        await Share.share({
          url: uri, // iOS resim paylasimini url uzerinden yapabilir
          message: `Kur'an Kerim Diyor: ${reference}\n\nOkumak için: ${webUrl}`,
        });
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Ayeti Paylaş',
          UTI: 'public.png',
        });
        // Android'de bazi uygulamalar hem resim hem texti ayni anda almaz.
        // Ama Sharing.shareAsync en stabil olanidir.
      }
    } catch (error) {
      console.error('Sharing failed:', error);
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
          <Text style={styles.appUrl}>kuran-diyor.app/ayet/{reference.replace(' ', ':')}</Text>
        </View>
      </ViewShot>

      <TouchableOpacity style={styles.shareButton} onPress={captureAndShare}>
        <Share2 size={20} color="#fff" />
        <Text style={styles.shareButtonText}>Paylaş</Text>
      </TouchableOpacity>
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
});
