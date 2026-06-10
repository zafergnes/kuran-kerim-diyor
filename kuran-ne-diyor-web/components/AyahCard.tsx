"use client";

import { useMemo, useState } from "react";
import { BookmarkPlus, Copy, Heart, MessageSquare, Share2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Ayah } from "@/types/quran";
import { useAyahStats } from "@/hooks/useAyahStats";
import { useUserStore } from "@/store/userStore";
import { ayahIdOf } from "@/services/ayahUtils";
import { CommentsPanel } from "@/components/CommentsPanel";
import { CollectionMenu } from "@/components/CollectionMenu";
import { AudioPlayer } from "@/components/AudioPlayer";
import { DeleteWarningDialog } from "@/components/DeleteWarningDialog";

type AyahCardProps = {
  ayah: Ayah;
  surahName: string;
  surahNumber: number;
  highlighted?: boolean;
};

export function AyahCard({ ayah, surahName, surahNumber, highlighted }: AyahCardProps) {
  const { t } = useTranslation();
  const [showComments, setShowComments] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const language = useUserStore((state) => state.language);
  const showArabicTranslation = useUserStore((state) => state.showArabicTranslation);
  const arabicTranslationLang = useUserStore((state) => state.arabicTranslationLang);
  const favorites = useUserStore((state) => state.favorites);
  const hideFavoriteDeleteWarning = useUserStore((state) => state.hideFavoriteDeleteWarning);
  const toggleFavorite = useUserStore((state) => state.toggleFavorite);
  const setHideFavoriteDeleteWarning = useUserStore((state) => state.setHideFavoriteDeleteWarning);
  const setProgress = useUserStore((state) => state.setProgress);
  const arabicFontFamily = useUserStore((state) => state.arabicFontFamily);
  const selectedArabicScript = useUserStore((state) => state.selectedArabicScript);
  const arabicFontClass = arabicFontFamily === "amiri" ? "arabic-font-amiri" : "arabic-font-noto";
  const ayahId = ayahIdOf(surahNumber, ayah.number);
  
  const rawArabicText = (selectedArabicScript === "diyanet" && ayah.arabicDiyanet) ? ayah.arabicDiyanet : ayah.arabic;

  const { stats, setStats, refresh } = useAyahStats(ayahId);
  const displayLanguage = language === "ar" ? arabicTranslationLang : language;
  const shouldShowTranslation = language !== "ar" || showArabicTranslation;
  const isFavorited = Boolean(favorites[ayahId]);

  const translation = useMemo(() => ayah.translations[displayLanguage] || ayah.translations.tr, [ayah, displayLanguage]);

  // Besmele ayrıştırma
  const { splitBismillah, isSajdahAyah, hasBismillah } = require("@/services/quranHelpers");
  let bismillahToRender: string | null = null;
  let finalArabicText = rawArabicText;
  
  if (ayah.number === 1 && hasBismillah(surahNumber)) {
    const splitResult = splitBismillah(rawArabicText);
    bismillahToRender = splitResult.bismillah;
    finalArabicText = splitResult.ayahText;
  }

  // Lafzatullah renklendirme (Allah ve lillah lafizlari)
  const renderArabicText = (text: string) => {
    const words = text.split(/\s+/);
    return words.map((word, index) => {
      const cleanWord = word.replace(/[^\u0621-\u064A\u0671-\u06D3]/g, '');
      const isAllah = cleanWord === 'الله' || cleanWord === 'اللَّه' || cleanWord === 'لله' || cleanWord === 'لِلَّهِ' || cleanWord === 'للَّه';
      
      return (
        <span 
          key={index} 
          style={{ 
            color: isAllah ? '#D32F2F' : undefined,
            fontWeight: isAllah ? 'bold' : undefined
          }}
        >
          {word}{index < words.length - 1 ? ' ' : ''}
        </span>
      );
    });
  };

  const isSajdah = isSajdahAyah(surahNumber, ayah.number);

  const handleFavorite = async () => {
    if (isFavorited && !hideFavoriteDeleteWarning) {
      setShowDeleteWarning(true);
      return;
    }

    setStats((current) =>
      current
        ? {
            ...current,
            favoriteCount: Math.max(0, current.favoriteCount + (isFavorited ? -1 : 1)),
          }
        : current,
    );
    await toggleFavorite(ayahId, surahNumber, ayah.number);
    await refresh();
  };

  const confirmFavoriteRemoval = async (dontAskAgain: boolean) => {
    if (dontAskAgain) {
      setHideFavoriteDeleteWarning(true);
    }
    setShowDeleteWarning(false);
    setStats((current) =>
      current
        ? {
            ...current,
            favoriteCount: Math.max(0, current.favoriteCount - 1),
          }
        : current,
    );
    await toggleFavorite(ayahId, surahNumber, ayah.number);
    await refresh();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${finalArabicText}\n\n${translation}\n\n${surahName} ${ayah.number}`);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/surah/${surahNumber}#ayah-${ayah.number}`;
    if (navigator.share) {
      await navigator.share({ title: `${surahName} ${ayah.number}`, text: translation, url });
      return;
    }
    await navigator.clipboard.writeText(url);
  };

  return (
    <article
      id={`ayah-${ayah.number}`}
      className={`w-full max-w-full overflow-hidden rounded-lg border bg-card p-4 shadow-sm sm:p-7 transition-all duration-300 ${
        highlighted ? "border-primary ring-1 ring-primary bg-primary/5 shadow-md scale-[1.01]" : "border-border"
      }`}
      onMouseEnter={() => setProgress(surahNumber, ayah.number)}
      onFocus={() => setProgress(surahNumber, ayah.number)}
    >
      {bismillahToRender && (
        <div className="mb-6 text-center">
          <p
            className={`${arabicFontClass} text-center text-2xl leading-[2] text-text sm:text-[28px] break-words`}
            dir="rtl"
          >
            {bismillahToRender}
          </p>
        </div>
      )}

      {isSajdah && (
        <div className="mx-auto mb-4 w-fit rounded-full border border-primary bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
          ۩ {t("common.sajdah", "Secde Ayeti")}
        </div>
      )}

      <p
        className={`${arabicFontClass} text-center text-3xl leading-[2.3] text-text sm:text-[34px] break-words`}
        style={{ wordSpacing: "0.15em" }}
        dir="rtl"
      >
        {renderArabicText(finalArabicText.replace(/\s+/g, '\u2002'))}
      </p>
      {shouldShowTranslation && (
        <div className="flex flex-col items-center">
          <p className="mx-auto mt-7 max-w-3xl text-center text-base leading-8 text-secondary sm:text-lg">{translation}</p>
          {isSajdah && (
            <p className="mt-3 text-xs italic font-semibold text-[#D32F2F] text-center">
              ⚠️ {t("common.sajdah_warning", "Bu ayet okunduğunda veya dinlendiğinde Tilavet Secdesi yapılması gerekir.")}
            </p>
          )}
        </div>
      )}
      <footer className="mt-7 flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-muted">
          {surahName} · {t("common.ayah", "Ayet")} {ayah.number} · {surahNumber}:{ayah.number}
          {stats && (
            <span className="ml-2 text-primary">
              {stats.favoriteCount > 0 ? `· ${stats.favoriteCount} ${t("favorites.title", "Favori").toLowerCase()}` : ""}{" "}
              {stats.commentCount > 0 ? `· ${stats.commentCount} ${t("comments.title", "Yorumlar").toLowerCase()}` : ""}
            </span>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <AudioPlayer globalAyahNumber={ayah.globalNumber} />
          <button
            onClick={handleCopy}
            className="grid h-10 w-10 place-items-center rounded-md border border-border text-primary transition hover:bg-background"
            title={t("common.copy", "Kopyala")}
          >
            <Copy size={18} />
          </button>
          <button
            onClick={handleShare}
            className="grid h-10 w-10 place-items-center rounded-md border border-border text-primary transition hover:bg-background"
            title={t("common.share", "Paylaş")}
          >
            <Share2 size={18} />
          </button>
          <button
            onClick={handleFavorite}
            className="grid h-10 w-10 place-items-center rounded-md border border-border text-primary transition hover:bg-background"
            title={t("favorites.title", "Favori")}
          >
            <Heart size={18} fill={isFavorited ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => setShowCollections(true)}
            className="grid h-10 w-10 place-items-center rounded-md border border-border text-primary transition hover:bg-background"
            title={t("favorites.add_to_collections", "Koleksiyona ekle")}
          >
            <BookmarkPlus size={18} />
          </button>
          <button
            onClick={() => setShowComments(true)}
            className="relative grid h-10 w-10 place-items-center rounded-md border border-border text-primary transition hover:bg-background"
            title={t("comments.title", "Yorumlar")}
          >
            <MessageSquare size={18} />
            {stats && stats.commentCount > 0 && (
              <span className="absolute -right-2 -top-2 grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {stats.commentCount}
              </span>
            )}
          </button>
        </div>
      </footer>
      {showComments && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 sm:p-6">
          <div className="ml-auto flex h-full max-w-xl flex-col rounded-lg border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-sm font-bold text-primary">{surahName} · {t("common.ayah", "Ayet")} {ayah.number}</p>
                <h2 className="text-xl font-bold text-text">{t("comments.title", "Yorumlar")}</h2>
              </div>
              <button
                onClick={() => {
                  setShowComments(false);
                  void refresh();
                }}
                className="grid h-10 w-10 place-items-center rounded-md border border-border text-primary hover:bg-background"
                title={t("common.close", "Kapat")}
              >
                <X size={18} />
              </button>
            </div>
            <CommentsPanel ayahId={ayahId} />
          </div>
        </div>
      )}
      {showCollections && (
        <CollectionMenu
          ayahId={ayahId}
          surahNumber={surahNumber}
          ayahNumber={ayah.number}
          onClose={() => setShowCollections(false)}
        />
      )}
      {showDeleteWarning && (
        <DeleteWarningDialog onCancel={() => setShowDeleteWarning(false)} onConfirm={(dontAskAgain) => void confirmFavoriteRemoval(dontAskAgain)} />
      )}
    </article>
  );
}
