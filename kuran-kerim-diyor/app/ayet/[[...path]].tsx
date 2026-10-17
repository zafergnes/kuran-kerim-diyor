import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUserStore } from '../../store/userStore';

const decodeVerseId = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export default function AyetRedirect() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    let isActive = true;

    const redirectToVerse = async () => {
      let surah: string | null = null;
      let ayah: string | null = null;

      // 1. Extract verse reference from any param
      const rawCandidate = params.id
        ? (Array.isArray(params.id) ? params.id[0] : params.id)
        : params.path
        ? (Array.isArray(params.path) ? params.path[0] : params.path)
        : null;

      if (rawCandidate) {
        const decoded = decodeVerseId(String(rawCandidate));
        const match = decoded.match(/(\d{1,3}):(\d{1,3})/);
        if (match) {
          surah = match[1];
          ayah = match[2];
        }
      } else if (params.surah && params.ayah) {
        surah = String(Array.isArray(params.surah) ? params.surah[0] : params.surah);
        ayah = String(Array.isArray(params.ayah) ? params.ayah[0] : params.ayah);
      }

      if (surah && ayah) {
        const surahNumber = Number(surah);
        const ayahNumber = Number(ayah);
        if (Number.isInteger(surahNumber) && Number.isInteger(ayahNumber)) {
          await useUserStore.getState().setProgress(surahNumber, ayahNumber);
          if (isActive) {
            router.replace({
              pathname: '/(tabs)',
              params: { surah: surahNumber.toString(), ayah: ayahNumber.toString(), t: Date.now().toString() }
            });
            return;
          }
        }
      }

      if (isActive) {
        router.replace('/(tabs)');
      }
    };

    void redirectToVerse();

    return () => {
      isActive = false;
    };
  }, [params]);

  return null;
}
