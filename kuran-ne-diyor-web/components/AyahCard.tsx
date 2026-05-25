"use client";

import { useMemo, useState } from "react";
import { BookmarkPlus, Copy, Heart, MessageSquare, Share2, X } from "lucide-react";
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
};

export function AyahCard({ ayah, surahName, surahNumber }: AyahCardProps) {
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
  const arabicFontClass = arabicFontFamily === "amiri" ? "arabic-font-amiri" : "arabic-font-noto";
  const ayahId = ayahIdOf(surahNumber, ayah.number);
  const { stats, setStats, refresh } = useAyahStats(ayahId);
  const displayLanguage = language === "ar" ? arabicTranslationLang : language;
  const shouldShowTranslation = language !== "ar" || showArabicTranslation;
  const isFavorited = Boolean(favorites[ayahId]);

  const translation = useMemo(() => ayah.translations[displayLanguage] || ayah.translations.tr, [ayah, displayLanguage]);

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
    await navigator.clipboard.writeText(`${ayah.arabic}\n\n${translation}\n\n${surahName} ${ayah.number}`);
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
      className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7"
      onMouseEnter={() => setProgress(surahNumber, ayah.number)}
      onFocus={() => setProgress(surahNumber, ayah.number)}
    >
      <p className={`${arabicFontClass} text-center text-4xl leading-[2.1] text-text sm:text-[42px]`} dir="rtl">
        {ayah.arabic}
      </p>
      {shouldShowTranslation && (
        <p className="mx-auto mt-7 max-w-3xl text-center text-base leading-8 text-secondary sm:text-lg">{translation}</p>
      )}
      <footer className="mt-7 flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-muted">
          {surahName} · Ayet {ayah.number} · {surahNumber}:{ayah.number}
          {stats && (
            <span className="ml-2 text-primary">
              {stats.favoriteCount > 0 ? `· ${stats.favoriteCount} favori` : ""}{" "}
              {stats.commentCount > 0 ? `· ${stats.commentCount} yorum` : ""}
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <AudioPlayer globalAyahNumber={ayah.globalNumber} />
          <button
            onClick={handleCopy}
            className="grid h-10 w-10 place-items-center rounded-md border border-border text-primary transition hover:bg-background"
            title="Kopyala"
          >
            <Copy size={18} />
          </button>
          <button
            onClick={handleShare}
            className="grid h-10 w-10 place-items-center rounded-md border border-border text-primary transition hover:bg-background"
            title="Paylaş"
          >
            <Share2 size={18} />
          </button>
          <button
            onClick={handleFavorite}
            className="grid h-10 w-10 place-items-center rounded-md border border-border text-primary transition hover:bg-background"
            title="Favori"
          >
            <Heart size={18} fill={isFavorited ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => setShowCollections(true)}
            className="grid h-10 w-10 place-items-center rounded-md border border-border text-primary transition hover:bg-background"
            title="Koleksiyona ekle"
          >
            <BookmarkPlus size={18} />
          </button>
          <button
            onClick={() => setShowComments(true)}
            className="relative grid h-10 w-10 place-items-center rounded-md border border-border text-primary transition hover:bg-background"
            title="Yorumlar"
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
                <p className="text-sm font-bold text-primary">{surahName} · Ayet {ayah.number}</p>
                <h2 className="text-xl font-bold text-text">Yorumlar</h2>
              </div>
              <button
                onClick={() => {
                  setShowComments(false);
                  void refresh();
                }}
                className="grid h-10 w-10 place-items-center rounded-md border border-border text-primary hover:bg-background"
                title="Kapat"
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
