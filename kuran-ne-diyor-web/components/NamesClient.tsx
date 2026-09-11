"use client";

import { useState, useMemo, useEffect } from "react";
import namesData from "@/data/names99.json";
import { Search, X, Copy, Check, Sparkles, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

interface NameItem {
  id: number;
  arabic: string;
  transliteration: Record<string, string>;
  meaning: Record<string, string>;
  explanation: Record<string, string>;
  quranReference: string;
}

const typedNames: NameItem[] = namesData as NameItem[];

export function NamesClient() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedName, setSelectedName] = useState<NameItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Visual share cards link to #name-{id}; open that name directly when the link is followed.
  useEffect(() => {
    const match = window.location.hash.match(/^#name-(\d+)$/);
    if (!match) return;
    const name = typedNames.find((item) => item.id === Number(match[1]));
    if (name) queueMicrotask(() => setSelectedName(name));
  }, []);

  const lang = useMemo(() => {
    const raw = (i18n.language || "tr").toLowerCase().slice(0, 2);
    return ["tr", "en", "ar", "de", "fr", "es"].includes(raw) ? raw : "tr";
  }, [i18n.language]);

  const filteredNames = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return typedNames;

    return typedNames.filter((item) => {
      const trans = (item.transliteration[lang] || item.transliteration.tr || "").toLowerCase();
      const meaning = (item.meaning[lang] || item.meaning.tr || "").toLowerCase();
      const arabic = item.arabic;
      const ref = item.quranReference.toLowerCase();
      const idStr = item.id.toString();

      return (
        trans.includes(query) ||
        meaning.includes(query) ||
        arabic.includes(query) ||
        ref.includes(query) ||
        idStr === query
      );
    });
  }, [search, lang]);

  const handleCopy = (item: NameItem) => {
    const trans = item.transliteration[lang] || item.transliteration.tr;
    const meaning = item.meaning[lang] || item.meaning.tr;
    const expl = item.explanation[lang] || item.explanation.tr;
    const text = `${item.id}. ${item.arabic} (${trans})\n${t("names.meaning_label", "Anlamı")}: ${meaning}\n${t("names.explanation_label", "Açıklama")}: ${expl}\n${t("names.reference_label", "Referans")}: ${item.quranReference}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner / Verse Quote */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 text-center sm:text-left">
        <p className="font-arabic text-xl sm:text-2xl text-primary font-bold dir-rtl mb-2">
          وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا
        </p>
        <p className="text-sm font-medium text-text italic">
          {t(
            "names.verse_quote",
            "“En güzel isimler Allah’ındır; O’na o güzel isimlerle dua edin.” (A'râf, 7/180)"
          )}
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("names.search_placeholder", "İsim, okunuş veya anlam ile ara (Örn: Rahman, Şifa, 1)...")}
          className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-10 text-sm text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Grid of 99 Names */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredNames.map((item) => {
          const trans = item.transliteration[lang] || item.transliteration.tr;
          const meaning = item.meaning[lang] || item.meaning.tr;

          return (
            <div
              key={item.id}
              id={`name-${item.id}`}
              onClick={() => setSelectedName(item)}
              className="group relative flex cursor-pointer flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {item.id}
                </span>
                <span className="text-xs font-medium text-muted">{item.quranReference}</span>
              </div>

              <div className="my-3 text-center">
                <p className="font-arabic text-3xl font-bold text-primary group-hover:scale-105 transition-transform duration-200">
                  {item.arabic}
                </p>
                <p className="mt-1 text-base font-bold text-text">{trans}</p>
              </div>

              <p className="line-clamp-2 text-center text-xs font-medium text-secondary">
                {meaning}
              </p>
            </div>
          );
        })}
      </div>

      {filteredNames.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-base font-semibold text-text">
            {t("names.no_results", "Aramanızla eşleşen isim bulunamadı.")}
          </p>
          <button
            onClick={() => setSearch("")}
            className="mt-3 text-sm font-bold text-primary hover:underline"
          >
            {t("names.clear_search", "Aramayı Temizle")}
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setSelectedName(null)}
              className="absolute right-4 top-4 rounded-full p-1 text-muted transition hover:bg-muted/20 hover:text-text"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="text-center">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {selectedName.id}
              </span>
              <p className="my-3 font-arabic text-5xl font-bold text-primary">
                {selectedName.arabic}
              </p>
              <h2 className="text-2xl font-bold text-text">
                {selectedName.transliteration[lang] || selectedName.transliteration.tr}
              </h2>
              <div className="mt-2 inline-block rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
                {selectedName.meaning[lang] || selectedName.meaning.tr}
              </div>
            </div>

            {/* Explanation Section */}
            <div className="mt-6 space-y-4 text-sm">
              <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="mb-2 font-bold text-text flex items-center gap-1.5">
                  <BookOpen size={16} className="text-primary" />
                  {t("names.detail_heading", "Derin Anlamı ve Tefekkürü")}
                </h3>
                <p className="leading-relaxed text-secondary">
                  {selectedName.explanation[lang] || selectedName.explanation.tr}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted">
                <span>{t("names.quran_ref_label", "Kur'an-ı Kerim Referansı")}</span>
                <span className="text-primary">{selectedName.quranReference}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => handleCopy(selectedName)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-sm font-semibold text-text transition hover:bg-muted/15"
              >
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                {copied ? t("common.copied", "Kopyalandı") : t("common.copy", "Kopyala")}
              </button>

              <Link
                href={`/dua-generator?name=${encodeURIComponent(
                  selectedName.transliteration[lang] || selectedName.transliteration.tr
                )}`}
                onClick={() => setSelectedName(null)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              >
                <Sparkles size={16} />
                {t("names.pray_with_name", "Bu İsimle Dua İste")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
