export type WordTiming = {
  wordIndex: number;
  startMillis: number;
  endMillis: number;
};

export type AyahAudioTrack = {
  url: string;
  wordTimings: WordTiming[];
};

type AyahAudioResponse = {
  audio_files?: Array<{
    url?: string;
    // API shape: [segment_index, word_index, start_ms, end_ms]
    segments?: Array<Array<number | string>>;
  }>;
};

const AYAH_RECITATION_IDS: Record<string, number> = {
  'ar.alafasy': 7,
  'ar.abdurrahmaansudais': 3,
  'ar.abdulbasitmurattal': 2,
  'ar.husary': 6,
};

const HIGH_QUALITY_RECITERS = new Set([
  'ar.alafasy',
  'ar.mahermuaiqly',
  'ar.husary',
]);

export const getAyahAudioUrl = (reciter: string, globalAyahNumber: number): string => {
  const bitrate = HIGH_QUALITY_RECITERS.has(reciter) ? 128 : 64;
  return `https://cdn.islamic.network/quran/audio/${bitrate}/${reciter}/${globalAyahNumber}.mp3`;
};

const normalizeAudioUrl = (url: string): string => {
  if (url.startsWith('//')) return `https:${url}`;
  if (/^https?:\/\//.test(url)) return url;
  return `https://verses.quran.foundation/${url.replace(/^\//, '')}`;
};

const ayahTrackCache = new Map<string, Promise<AyahAudioTrack>>();

/**
 * Loads the ayah audio and its word boundaries from the same recording.
 * Keeping both resources together prevents highlighting drift between CDNs.
 */
export const getAyahAudioTrack = (
  reciter: string,
  surahNumber: number,
  ayahNumber: number,
  globalAyahNumber: number,
): Promise<AyahAudioTrack> => {
  const fallback: AyahAudioTrack = {
    url: getAyahAudioUrl(reciter, globalAyahNumber),
    wordTimings: [],
  };
  const recitationId = AYAH_RECITATION_IDS[reciter];
  if (!recitationId) return Promise.resolve(fallback);

  const cacheKey = `${recitationId}:${surahNumber}:${ayahNumber}`;
  const cached = ayahTrackCache.get(cacheKey);
  if (cached) return cached;

  const request = fetch(
    `https://api.quran.com/api/v4/recitations/${recitationId}/by_ayah/${surahNumber}:${ayahNumber}?fields=segments,duration,id,format,url`,
  )
    .then(async (response) => {
      if (!response.ok) throw new Error(`Ayah audio request failed: ${response.status}`);
      const data = (await response.json()) as AyahAudioResponse;
      const audioFile = data.audio_files?.[0];
      if (!audioFile?.url) return fallback;

      const wordTimings = (audioFile.segments ?? [])
        .filter((segment) => segment.length >= 4)
        .map((segment) => ({
          wordIndex: Number(segment[1]),
          startMillis: Number(segment[2]),
          endMillis: Number(segment[3]),
        }))
        .filter((segment) => (
          Number.isFinite(segment.wordIndex)
          && Number.isFinite(segment.startMillis)
          && Number.isFinite(segment.endMillis)
          && segment.wordIndex > 0
          && segment.endMillis > segment.startMillis
        ));

      return {
        url: normalizeAudioUrl(audioFile.url),
        wordTimings,
      };
    })
    .catch((error) => {
      ayahTrackCache.delete(cacheKey);
      console.warn('[QuranAudioTiming] Exact ayah timing unavailable:', error);
      return fallback;
    });

  ayahTrackCache.set(cacheKey, request);
  return request;
};
