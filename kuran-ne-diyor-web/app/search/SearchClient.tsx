"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Heart, Search } from "lucide-react";
import { searchAyahs } from "@/services/quranData";
import { useUserStore } from "@/store/userStore";
import { useTranslation } from "react-i18next";

export function SearchClient() {
  const [query, setQuery] = useState("");
  const language = useUserStore((state) => state.language);
  const setProgress = useUserStore((state) => state.setProgress);
  const { t } = useTranslation();
  const results = useMemo(() => searchAyahs(query, language).slice(0, 60), [query, language]);

  return (
    <div className="grid gap-5">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search.placeholder", "Sure adı, ayet metni veya 34:50 yazın")}
          className="h-14 w-full rounded-lg border border-border bg-card pl-12 pr-4 text-base font-semibold text-text shadow-sm placeholder:text-muted"
        />
      </label>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        {query.trim().length < 3 ? (
          <p className="p-6 text-center text-sm font-semibold text-muted">{t("search.min_chars", "Aramak için en az 3 karakter yazın.")}</p>
        ) : results.length === 0 ? (
          <p className="p-6 text-center text-sm font-semibold text-muted">{t("search.not_found", "Sonuç bulunamadı.")}</p>
        ) : (
          results.map((item) => (
            <Link
              href={`/surah/${item.surahNumber}#ayah-${item.ayah.number}`}
              key={item.ayah.globalNumber}
              onClick={() => setProgress(item.surahNumber, item.ayah.number)}
              className="block border-b border-border p-5 transition last:border-b-0 hover:bg-background"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-primary">
                  {item.surahName} · {t("common.ayah", "Ayet")} {item.ayah.number}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                  <Heart size={14} />
                  {t("favorites.add", "Kaydet")}
                </span>
              </div>
              <p className="arabic-text line-clamp-2 text-right text-2xl font-normal leading-loose text-text" dir="rtl">
                {item.ayah.arabic}
              </p>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-secondary">
                {item.ayah.translations[language] || item.ayah.translations.tr}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
