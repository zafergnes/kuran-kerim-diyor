import type { MetadataRoute } from "next";
import { getAllSurahs, quranData } from "@/services/quranData";
import { absoluteUrl } from "@/lib/site";

/**
 * Sitemap: statik sayfalar + 114 sure + 6236 ayet.
 * Toplam ~6360 URL; Google'in tek dosya icin koydugu 50.000 sinirinin altinda.
 *
 * Giris gerektiren veya kisiye ozel sayfalar (profil, favoriler, admin ...)
 * bilerek disarida birakildi; onlar robots.ts icinde ayrica engelleniyor.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/ayetel-kursi"), lastModified: now, changeFrequency: "yearly", priority: 0.9 },
    { url: absoluteUrl("/search"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/sources"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/support"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    {
      url: absoluteUrl("/account-deletion"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const surahRoutes: MetadataRoute.Sitemap = getAllSurahs().map((surah) => ({
    url: absoluteUrl(`/surah/${surah.number}`),
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.8,
  }));

  const ayahRoutes: MetadataRoute.Sitemap = quranData.flatMap((surah) =>
    surah.ayahs.map((ayah) => ({
      url: absoluteUrl(`/ayet/${surah.number}:${ayah.number}`),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  );

  return [...staticRoutes, ...surahRoutes, ...ayahRoutes];
}
