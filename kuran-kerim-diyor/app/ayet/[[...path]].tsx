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

      // 1. Check query parameter ?id=1:1
      if (params.id) {
        const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
        const parts = decodeVerseId(rawId).split(':');
        if (parts.length === 2) {
          surah = parts[0];
          ayah = parts[1];
        }
      }
      // 2. Check path parameter /ayet/1:1
      else if (params.path) {
        const rawId = Array.isArray(params.path) ? params.path[0] : params.path;
        const parts = decodeVerseId(rawId).split(':');
        if (parts.length === 2) {
          surah = parts[0];
          ayah = parts[1];
        }
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
