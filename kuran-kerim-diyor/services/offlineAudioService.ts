import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { getAyahAudioTrack, AyahAudioTrack } from './quranAudioTimingService';
import { getSurah } from './quranData';

type StoredTrack = AyahAudioTrack & {
  reciter: string;
  surah: number;
  ayah: number;
  globalAyahNumber: number;
};

type OfflineManifest = Record<string, StoredTrack>;

const MANIFEST_KEY = '@offline_audio_manifest_v1';
const audioRoot = `${FileSystem.documentDirectory ?? ''}quran-audio/`;
const keyFor = (reciter: string, globalAyahNumber: number) => `${reciter}:${globalAyahNumber}`;
const safeReciter = (reciter: string) => reciter.replace(/[^a-z0-9_-]/gi, '_');

const loadManifest = async (): Promise<OfflineManifest> => {
  try {
    return JSON.parse((await AsyncStorage.getItem(MANIFEST_KEY)) || '{}') as OfflineManifest;
  } catch {
    return {};
  }
};

const saveManifest = (manifest: OfflineManifest) => (
  AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest))
);

export const OfflineAudioService = {
  async getTrack(reciter: string, globalAyahNumber: number): Promise<AyahAudioTrack | null> {
    const manifest = await loadManifest();
    const stored = manifest[keyFor(reciter, globalAyahNumber)];
    if (!stored) return null;
    const info = await FileSystem.getInfoAsync(stored.url);
    if (!info.exists) return null;
    return { url: stored.url, wordTimings: stored.wordTimings || [] };
  },

  async getDownloadedSurahs(reciter: string): Promise<number[]> {
    const manifest = await loadManifest();
    const counts = new Map<number, number>();
    Object.values(manifest).forEach((track) => {
      if (track.reciter === reciter) counts.set(track.surah, (counts.get(track.surah) || 0) + 1);
    });

    return [...counts.entries()]
      .filter(([surahNumber, count]) => count >= (getSurah(surahNumber)?.ayahs.length || Infinity))
      .map(([surahNumber]) => surahNumber)
      .sort((a, b) => a - b);
  },

  async downloadSurah(
    reciter: string,
    surahNumber: number,
    onProgress?: (completed: number, total: number) => void,
  ): Promise<void> {
    const surah = getSurah(surahNumber);
    if (!surah) throw new Error('Surah not found');
    if (!FileSystem.documentDirectory) throw new Error('Offline storage unavailable');

    const directory = `${audioRoot}${safeReciter(reciter)}/${surahNumber}/`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const manifest = await loadManifest();

    for (let index = 0; index < surah.ayahs.length; index += 1) {
      const ayah = surah.ayahs[index];
      const manifestKey = keyFor(reciter, ayah.globalNumber);
      const destination = `${directory}${ayah.number}.mp3`;
      const existing = await FileSystem.getInfoAsync(destination);

      if (!existing.exists || !manifest[manifestKey]) {
        const remoteTrack = await getAyahAudioTrack(
          reciter,
          surahNumber,
          ayah.number,
          ayah.globalNumber,
        );
        if (!existing.exists) {
          await FileSystem.downloadAsync(remoteTrack.url, destination);
        }
        manifest[manifestKey] = {
          ...remoteTrack,
          url: destination,
          reciter,
          surah: surahNumber,
          ayah: ayah.number,
          globalAyahNumber: ayah.globalNumber,
        };
        await saveManifest(manifest);
      }
      onProgress?.(index + 1, surah.ayahs.length);
    }
  },

  async removeSurah(reciter: string, surahNumber: number): Promise<void> {
    const directory = `${audioRoot}${safeReciter(reciter)}/${surahNumber}/`;
    await FileSystem.deleteAsync(directory, { idempotent: true });
    const manifest = await loadManifest();
    Object.keys(manifest).forEach((key) => {
      if (manifest[key].reciter === reciter && manifest[key].surah === surahNumber) {
        delete manifest[key];
      }
    });
    await saveManifest(manifest);
  },
};
