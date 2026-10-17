"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { 
  BookOpen, 
  Check, 
  Copy, 
  Heart, 
  Search, 
  Sparkles, 
  X, 
  ArrowRight,
  BookmarkCheck
} from "lucide-react";
import { 
  searchAyahs, 
  getSurah, 
  getAllSurahs, 
  findSurahByNameOrAlias, 
  foldSearchText,
  type SearchResultItemData 
} from "@/services/quranData";
import { useUserStore } from "@/store/userStore";
import { useTranslation } from "react-i18next";
import { ayahIdOf } from "@/services/ayahUtils";

const POPULAR_SEARCHES = [
  "Âyetel Kürsî",
  "Fâtiha",
  "Yâsîn",
  "Mülk",
  "İhlâs",
  "İnşirâh",
  "Sabır",
  "Cennet",
  "Tevbe",
  "Dua",
  "Namaz",
  "Merhamet",
];

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "surahs" | "ayahs">("all");
  const [copiedAyahId, setCopiedAyahId] = useState<string | null>(null);

  const language = useUserStore((state) => state.language);
  const favorites = useUserStore((state) => state.favorites);
  const toggleFavorite = useUserStore((state) => state.toggleFavorite);
  const setProgress = useUserStore((state) => state.setProgress);
  const arabicFontFamily = useUserStore((state) => state.arabicFontFamily);
  const { t } = useTranslation();

  const arabicFontClass = arabicFontFamily === "amiri" ? "arabic-font-amiri" : "arabic-font-noto";

  // Ayah Arama Sonuclari
  const ayahResults = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return searchAyahs(trimmed, language, 75);
  }, [query, language]);

  // Eslestirilen Sureler (Surah matches)
  const surahResults = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // Sayisal arama
    const num = parseInt(trimmed, 10);
    if (!isNaN(num) && num >= 1 && num <= 114) {
      const s = getSurah(num);
      return s ? [s] : [];
    }

    const directNum = findSurahByNameOrAlias(trimmed);
    if (directNum) {
      const s = getSurah(directNum);
      if (s) return [s];
    }

    const folded = foldSearchText(trimmed);
    const all = getAllSurahs();
    const matchedSummaries = all.filter((s) => {
      const trName = foldSearchText(s.name.tr);
      const enName = foldSearchText(s.englishNameTranslation || "");
      const arName = s.name.ar || "";
      return trName.includes(folded) || enName.includes(folded) || arName.includes(trimmed);
    });

    return matchedSummaries
      .slice(0, 3)
      .map((item) => getSurah(item.number))
      .filter((s): s is NonNullable<typeof s> => s !== undefined);
  }, [query]);

  const totalResultsCount = surahResults.length + ayahResults.length;

  const handleCopy = async (item: SearchResultItemData) => {
    const ayahId = ayahIdOf(item.surahNumber, item.ayah.number);
    const translation = item.ayah.translations[language] || item.ayah.translations.tr;
    const textToCopy = `${item.ayah.arabic}\n\n“${translation}”\n\n— ${item.surahName} (${item.surahNumber}:${item.ayah.number})`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedAyahId(ayahId);
      setTimeout(() => setCopiedAyahId(null), 2000);
    } catch {
      // Fallback
    }
  };

  // Metin icinde arama kelimelerini vurgula
  const renderHighlightedText = (text: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return text;

    const terms = trimmed.split(/\s+/).filter((t) => t.length >= 2);
    if (terms.length === 0) return text;

    try {
      const pattern = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
      const regex = new RegExp(`(${pattern})`, "gi");
      const parts = text.split(regex);

      return parts.map((part, index) => {
        if (regex.test(part)) {
          return (
            <mark
              key={index}
              className="rounded bg-primary/20 px-1 py-0.5 font-bold text-primary dark:bg-primary/30"
            >
              {part}
            </mark>
          );
        }
        return part;
      });
    } catch {
      return text;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input Box */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={22} />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search.placeholder", "Sure adı, ayet metni veya referans yazın (örn: Yasin, 2:255, sabır)")}
          className="h-14 w-full rounded-2xl border border-border bg-card pl-13 pr-11 text-sm sm:text-base font-medium text-text shadow-sm transition placeholder:text-muted focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10"
          autoFocus
        />
        {query.length > 0 && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text p-1 transition"
            aria-label="Aramayı temizle"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* When Empty: Show Popular Searches & Search Tips */}
      {query.trim().length === 0 && (
        <div className="space-y-6">
          {/* Popular Search Pills */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xs">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted mb-3">
              <Sparkles size={15} className="text-primary" />
              {t("search.popular_searches", "Popüler Aramalar")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-text shadow-2xs transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Guide / Search Tips */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-border bg-card p-4">
              <span className="font-bold text-primary block mb-1">Sure Arama</span>
              <p className="text-muted">
                Doğrudan sure adı yazın (örn. <span className="font-semibold text-text">"Yasin"</span>, <span className="font-semibold text-text">"Mülk"</span>) veya sure numarasını girin (<span className="font-semibold text-text">"36"</span>).
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <span className="font-bold text-primary block mb-1">Ayet Referansı</span>
              <p className="text-muted">
                Sure ve ayet numarasını girerek doğrudan hedefe ulaşın (örn. <span className="font-semibold text-text">"2:255"</span> veya <span className="font-semibold text-text">"Bakara 255"</span>).
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <span className="font-bold text-primary block mb-1">Kelime & Kavram</span>
              <p className="text-muted">
                Mealler içinde geçen herhangi bir kavramı arayın (örn. <span className="font-semibold text-text">"adalet"</span>, <span className="font-semibold text-text">"merhamet"</span>).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {query.trim().length > 0 && (
        <div className="space-y-4">
          {/* Result Summary Bar & Filter Tabs */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text">
                {totalResultsCount > 0
                  ? t("search.results_found", { count: totalResultsCount, defaultValue: `${totalResultsCount} sonuç bulundu` })
                  : t("search.not_found", "Sonuç bulunamadı")}
              </span>
              <span className="text-xs text-muted">("{query}")</span>
            </div>

            {totalResultsCount > 0 && (
              <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-2xs">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    activeFilter === "all" ? "bg-primary text-white shadow-2xs" : "text-muted hover:text-text"
                  }`}
                >
                  {t("common.all", "Tümü")} ({totalResultsCount})
                </button>
                {surahResults.length > 0 && (
                  <button
                    onClick={() => setActiveFilter("surahs")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      activeFilter === "surahs" ? "bg-primary text-white shadow-2xs" : "text-muted hover:text-text"
                    }`}
                  >
                    {t("tabs.surahs", "Sureler")} ({surahResults.length})
                  </button>
                )}
                {ayahResults.length > 0 && (
                  <button
                    onClick={() => setActiveFilter("ayahs")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      activeFilter === "ayahs" ? "bg-primary text-white shadow-2xs" : "text-muted hover:text-text"
                    }`}
                  >
                    {t("common.ayahs", "Ayetler")} ({ayahResults.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 1. Surah Cards (if any matching) */}
          {(activeFilter === "all" || activeFilter === "surahs") && surahResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                {t("search.matched_surahs", "Eşleşen Sureler")}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {surahResults.map((surah) => {
                  const surahTitle = surah.name[language as "tr"] || surah.name.tr;
                  return (
                    <Link
                      key={surah.number}
                      href={`/surah/${surah.number}`}
                      className="group flex items-center justify-between overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/10 p-4 shadow-sm transition hover:border-primary hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-2xs">
                          {surah.number}
                        </span>
                        <div>
                          <h4 className="text-base font-bold text-text group-hover:text-primary transition-colors">
                            {surahTitle} Suresi
                          </h4>
                          <p className="text-xs text-muted">
                            {surah.englishNameTranslation} · {surah.ayahs.length} Âyet · {surah.revelationType === "Meccan" ? "Mekkî" : "Medenî"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`${arabicFontClass} text-2xl font-normal text-primary`} dir="rtl">
                          {surah.name.ar}
                        </span>
                        <ArrowRight size={16} className="text-muted group-hover:text-primary transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Ayah List */}
          {(activeFilter === "all" || activeFilter === "ayahs") && ayahResults.length > 0 && (
            <div className="space-y-3">
              {activeFilter === "all" && surahResults.length > 0 && (
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted pt-2">
                  {t("search.matched_ayahs", "Eşleşen Âyetler")}
                </h3>
              )}

              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm divide-y divide-border">
                {ayahResults.map((item) => {
                  const ayahId = ayahIdOf(item.surahNumber, item.ayah.number);
                  const isFavorited = Boolean(favorites[ayahId]);
                  const isCopied = copiedAyahId === ayahId;
                  const translationText = item.ayah.translations[language] || item.ayah.translations.tr;

                  return (
                    <div key={item.ayah.globalNumber} className="p-5 transition hover:bg-background/60">
                      {/* Top Bar: Surah / Ayah info & Actions */}
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/surah/${item.surahNumber}#ayah-${item.ayah.number}`}
                            onClick={() => setProgress(item.surahNumber, item.ayah.number)}
                            className="text-sm font-bold text-primary hover:underline"
                          >
                            {item.surahName} · {t("common.ayah", "Âyet")} {item.ayah.number}
                          </Link>

                          {item.matchType === "ref" && (
                            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              Tam Referans
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleCopy(item)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold text-muted hover:text-text transition cursor-pointer"
                            title="Âyeti Kopyala"
                          >
                            {isCopied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                            <span className="hidden sm:inline">{isCopied ? t("common.copied", "Kopyalandı") : t("common.copy", "Kopyala")}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => void toggleFavorite(ayahId, item.surahNumber, item.ayah.number)}
                            className={`inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold transition cursor-pointer ${
                              isFavorited ? "text-red-500 border-red-500/30 bg-red-500/10" : "text-muted hover:text-text"
                            }`}
                            title={isFavorited ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                          >
                            <Heart size={14} className={isFavorited ? "fill-red-500" : ""} />
                            <span className="hidden sm:inline">{isFavorited ? t("favorites.saved", "Kaydedildi") : t("favorites.add", "Kaydet")}</span>
                          </button>

                          <Link
                            href={`/surah/${item.surahNumber}#ayah-${item.ayah.number}`}
                            onClick={() => setProgress(item.surahNumber, item.ayah.number)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary/10 px-2.5 text-xs font-bold text-primary hover:bg-primary/20 transition"
                            title="Surede Aç"
                          >
                            <BookOpen size={14} />
                            <span className="hidden sm:inline">{t("common.read_in_surah", "Surede Aç")}</span>
                          </Link>
                        </div>
                      </div>

                      {/* Arabic Verse */}
                      <p
                        className={`${arabicFontClass} line-clamp-3 text-right text-xl sm:text-2xl font-normal leading-loose text-text my-2.5`}
                        dir="rtl"
                      >
                        {item.ayah.arabic}
                      </p>

                      {/* Highlighted Translation */}
                      <p className="mt-2 text-sm sm:text-base leading-relaxed text-secondary font-medium">
                        “{renderHighlightedText(translationText)}”
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* If query has no results */}
          {totalResultsCount === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
              <Search className="mx-auto mb-3 text-muted/60" size={36} />
              <p className="text-base font-bold text-text">{t("search.not_found", "Sonuç bulunamadı.")}</p>
              <p className="mt-1 text-xs text-muted">
                "{query}" ile eşleşen bir ayet veya sure bulunamadı. Yazımı kontrol ederek tekrar deneyebilirsiniz.
              </p>
              <button
                onClick={() => setQuery("")}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition"
              >
                Aramayı Sıfırla
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
