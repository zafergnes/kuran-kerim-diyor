import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUserStore } from '../../store/userStore';

export default function AyetRedirect() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    let surah: string | null = null;
    let ayah: string | null = null;

    // 1. Check query parameter ?id=1:1
    if (params.id) {
      const idStr = params.id as string;
      const parts = idStr.split(':');
      if (parts.length === 2) {
        surah = parts[0];
        ayah = parts[1];
      }
    }
    // 2. Check path parameter /ayet/1:1
    else if (params.path) {
      const pathArray = params.path;
      const idStr = Array.isArray(pathArray) ? pathArray[0] : pathArray;
      if (idStr) {
        const parts = idStr.split(':');
        if (parts.length === 2) {
          surah = parts[0];
          ayah = parts[1];
        }
      }
    }

    if (surah && ayah) {
      useUserStore.getState().setProgress(Number(surah), Number(ayah));
    }
    
    // Redirect to the main tabs reader
    router.replace('/(tabs)');
  }, [params]);

  return null;
}
