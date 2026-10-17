"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Search, X, BookOpen } from "lucide-react";
import type { SurahSummary } from "@/types/quran";
import { useTranslation } from "react-i18next";
import { foldSearchText } from "@/services/quranData";

interface SurahListProps {
  surahs: SurahSummary[];
}

export function SurahList({ surahs }: SurahListProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "tr" | "en" | "ar" | "de" | "fr" | "es";

  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "Meccan" | "Medinan">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredSurahs = useMemo(() => {
    let list = surahs;

    if (filterType !== "all") {
      list = list.filter((s) => s.revelationType === filterType);
    }

    const trimmed = query.trim();
    if (!trimmed) return list;

    // Sayisal arama
    const num = parseInt(trimmed, 10);
    if (!isNaN(num) && num >= 1 && num <= 114) {
      return list.filter((s) => s.number === num);
    }

    const folded = foldSearchText(trimmed);
    return list.filter((s) => {
      const name = s.name[lang] || s.name.tr;
      const foldedName = foldSearchText(name);
      const foldedEn = foldSearchText(s.englishNameTranslation || "");
      const arMatch = s.name.ar?.includes(trimmed);
      return foldedName.includes(folded) || foldedEn.includes(folded) || Boolean(arMatch);
    });
  }, [surahs, query, filterType, lang]);

  const meccanCount = useMemo(() => surahs.filter((s) => s.revelationType === "Meccan").length, [surahs]);
  const medinanCount = useMemo(() => surahs.filter((s) => s.revelationType === "Medinan").length, [surahs]);

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("surah.search_placeholder", "Sure adı veya numarası ara... (örn: 36, Yâsîn)")}
            className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-9 text-xs sm:text-sm font-medium text-text shadow-2xs placeholder:text-muted focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10 transition"
          />
          {query.length > 0 && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition p-0.5"
              aria-label="Aramayı temizle"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Chips & View Mode */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Revelation Type Filter Pills */}
          <div className="flex items-center rounded-xl border border-border bg-card p-1 shadow-2xs">
            <button
              onClick={() => setFilterType("all")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                filterType === "all" ? "bg-primary text-white shadow-2xs" : "text-muted hover:text-text"
              }`}
            >
              {t("common.all", "Tümü")} ({surahs.length})
            </button>
            <button
              onClick={() => setFilterType("Meccan")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                filterType === "Meccan" ? "bg-primary text-white shadow-2xs" : "text-muted hover:text-text"
              }`}
            >
              {t("surah.meccan", "Mekkî")} ({meccanCount})
            </button>
            <button
              onClick={() => setFilterType("Medinan")}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                filterType === "Medinan" ? "bg-primary text-white shadow-2xs" : "text-muted hover:text-text"
              }`}
            >
              {t("surah.medinan", "Medenî")} ({medinanCount})
            </button>
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex items-center rounded-xl border border-border bg-card p-1 shadow-2xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-1.5 transition ${
                viewMode === "grid" ? "bg-primary text-white shadow-2xs" : "text-muted hover:text-text"
              }`}
              title="Kart (Grid) Görünümü"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-lg p-1.5 transition ${
                viewMode === "list" ? "bg-primary text-white shadow-2xs" : "text-muted hover:text-text"
              }`}
              title="Liste Görünümü"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredSurahs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
          <BookOpen className="mx-auto mb-3 text-muted/60" size={36} />
          <p className="text-base font-bold text-text">{t("search.not_found", "Eşleşen sure bulunamadı.")}</p>
          <p className="mt-1 text-xs text-muted">Arama kriterlerinizi değiştirerek tekrar deneyebilirsiniz.</p>
          <button
            onClick={() => {
              setQuery("");
              setFilterType("all");
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition"
          >
            Filtreleri Temizle
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Mode: Modern Responsive Cards */
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredSurahs.map((surah) => {
            const surahTitle = surah.name[lang] || surah.name.tr;
            return (
              <Link
                key={surah.number}
                href={`/surah/${surah.number}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
              >
                {/* Top: Surah Number, Badges, and Arabic Title */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-sm font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      {surah.number}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-text transition-colors group-hover:text-primary">
                        {surahTitle}
                      </h3>
                      <p className="truncate text-xs font-medium text-muted">
                        {surah.englishNameTranslation}
                      </p>
                    </div>
                  </div>

                  <span
                    className="arabic-text shrink-0 text-2xl font-normal text-primary/80 transition-colors group-hover:text-primary"
                    dir="rtl"
                  >
                    {surah.name.ar}
                  </span>
                </div>

                {/* Bottom: Meta Info */}
                <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-2.5 text-[11px] font-semibold text-muted">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                    {surah.ayahsCount} {t("common.ayah", "Âyet")}
                  </span>
                  <span className="rounded-md bg-background px-2 py-0.5 text-[10px] font-bold text-secondary">
                    {surah.revelationType === "Meccan" ? t("surah.meccan", "Mekkî") : t("surah.medinan", "Medenî")}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* List Mode: Compact Row View */
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs divide-y divide-border">
          {filteredSurahs.map((surah) => {
            const surahTitle = surah.name[lang] || surah.name.tr;
            return (
              <Link
                key={surah.number}
                href={`/surah/${surah.number}`}
                className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 transition hover:bg-background/80"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                  {surah.number}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-text">{surahTitle}</span>
                    <span className="text-[11px] text-muted hidden sm:inline">({surah.englishNameTranslation})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted">
                    <span>{surah.ayahsCount} {t("common.ayah", "ayet")}</span>
                    <span>•</span>
                    <span>{surah.revelationType === "Meccan" ? "Mekkî" : "Medenî"}</span>
                  </div>
                </div>
                <span className="arabic-text text-xl font-normal text-primary" dir="rtl">
                  {surah.name.ar}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
