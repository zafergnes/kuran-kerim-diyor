export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): Promise<string | null> | string | null {
  try {
    if (!path) return path;

    // Detect verse patterns like id=27:29, 27:29, ayet?id=27:29, ayet/27:29
    const match = path.match(/(\d{1,3}):(\d{1,3})/);
    if (match) {
      const surah = parseInt(match[1], 10);
      const ayah = parseInt(match[2], 10);
      if (surah >= 1 && surah <= 114 && ayah >= 1 && ayah <= 286) {
        return `/ayet?id=${surah}:${ayah}`;
      }
    }

    return path;
  } catch (error) {
    console.error('[+native-intent] Error redirecting system path:', error);
    return path;
  }
}
