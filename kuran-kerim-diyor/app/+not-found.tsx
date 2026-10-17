import { useEffect } from 'react';
import { usePathname, useRouter, useLocalSearchParams } from 'expo-router';
import { useUserStore } from '../store/userStore';

export default function NotFoundScreen() {
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    let isActive = true;

    const resolveRoute = async () => {
      // Check if pathname or params has a verse pattern like 27:29 or id=27:29
      const searchTargets = [
        pathname,
        typeof params.id === 'string' ? params.id : '',
        Array.isArray(params.id) ? params.id[0] : '',
        JSON.stringify(params),
      ];

      for (const target of searchTargets) {
        if (!target) continue;
        const match = target.match(/(\d{1,3}):(\d{1,3})/);
        if (match) {
          const surah = parseInt(match[1], 10);
          const ayah = parseInt(match[2], 10);
          if (surah >= 1 && surah <= 114 && ayah >= 1 && ayah <= 286) {
            await useUserStore.getState().setProgress(surah, ayah);
            if (isActive) {
              router.replace({
                pathname: '/(tabs)',
                params: { surah: surah.toString(), ayah: ayah.toString(), t: Date.now().toString() },
              });
              return;
            }
          }
        }
      }

      // Default fallback: return to home tab cleanly instead of showing an unmatched route screen
      if (isActive) {
        router.replace('/(tabs)');
      }
    };

    void resolveRoute();

    return () => {
      isActive = false;
    };
  }, [pathname, params, router]);

  return null;
}
