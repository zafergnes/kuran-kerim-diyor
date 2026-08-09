import { useUserStore } from '../store/userStore';
import { getSurah } from '../services/quranData';

export function useProgress() {
    const { currentSurah, currentAyah, completedSurahs, setProgress: setStoreProgress } = useUserStore();

    const setProgress = (surah: number, ayah: number) => {
        const surahData = getSurah(surah);
        const ayahCount = surahData ? surahData.ayahs.length : undefined;
        setStoreProgress(surah, ayah, ayahCount);
    };

    return { currentSurah, currentAyah, setProgress, completedSurahs };
}
