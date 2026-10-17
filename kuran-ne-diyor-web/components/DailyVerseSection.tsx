"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Share2, BookOpen, Check, Copy } from "lucide-react";
import { DailyVerseService, DailyVerse } from "@/services/dailyVerseService";
import { useUserStore } from "@/store/userStore";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export function DailyVerseSection() {
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const language = useUserStore((state) => state.language);
  const arabicFontFamily = useUserStore((state) => state.arabicFontFamily);
  const { t } = useTranslation();

  const arabicFontClass = arabicFontFamily === "amiri" ? "arabic-font-amiri" : "arabic-font-noto";

  useEffect(() => {
    let isMounted = true;
    DailyVerseService.getDailyVerse(language)
      .then((data) => {
        if (isMounted) setVerse(data);
      })
      .catch((err) => {
        console.error("Daily verse load error:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [language]);

  const targetUrl = verse?.surahNumber
    ? `/surah/${verse.surahNumber}#ayah-${verse.startAyah || 1}`
    : "/surah/1";

  const handleCopy = async () => {
    if (!verse) return;
    const textToCopy = `${verse.arabic ? verse.arabic + "\n\n" : ""}“${verse.text}”\n\n— ${verse.reference}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    if (!verse) return;
    const fullText = `${verse.arabic ? verse.arabic + "\n\n" : ""}“${verse.text}”\n\n— ${verse.reference}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("daily_verse.title", "Günün Ayeti"),
          text: fullText,
          url: typeof window !== "undefined" ? window.location.origin + targetUrl : undefined,
        });
      } catch {
        // Dismissed share
      }
    } else {
      void handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-5 w-32 rounded-full bg-border" />
          <div className="h-5 w-20 rounded-full bg-border" />
        </div>
        <div className="h-10 w-3/4 mx-auto rounded-lg bg-border/60 mb-4" />
        <div className="h-14 w-full rounded-lg bg-border/40 mb-6" />
        <div className="h-10 w-44 mx-auto rounded-lg bg-border" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm sm:p-8 transition-all hover:border-primary/40 hover:shadow-md">
      {/* Decorative accent glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-primary">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 tracking-wide">
          <Sparkles size={14} className="animate-pulse" />
          {t("daily_verse.title", "Günün Âyeti")}
        </span>
        <span className="rounded-full border border-border bg-background/80 px-2.5 py-0.5 text-[11px] font-semibold text-muted">
          {verse?.reference}
        </span>
      </div>

      {/* Arabic Verse Presentation */}
      {verse?.arabic && (
        <div className="mt-6 text-center">
          <p
            className={`${arabicFontClass} mx-auto max-w-3xl text-2xl font-normal leading-[2.3] text-text sm:text-3xl sm:leading-[2.5]`}
            dir="rtl"
          >
            {verse.arabic}
          </p>
        </div>
      )}

      {/* Localized Translation */}
      <div className="mt-5 text-center">
        <p className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-secondary sm:text-lg sm:leading-8">
          “{verse?.text}”
        </p>
        <p className="mt-3 text-xs font-bold uppercase tracking-widest text-primary">
          — {verse?.reference} —
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
        <Link
          href={targetUrl}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white shadow-xs transition hover:opacity-90 sm:h-11 sm:px-5 sm:text-sm"
        >
          <BookOpen size={16} />
          <span>{t("common.read_in_surah", "Surede Oku")}</span>
        </Link>

        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-xs font-bold text-text shadow-2xs transition hover:bg-background sm:h-11 sm:px-4 sm:text-sm"
          title="Âyeti ve mealini kopyala"
        >
          {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
          <span>{copied ? t("common.copied", "Kopyalandı") : t("common.copy", "Kopyala")}</span>
        </button>

        <button
          type="button"
          onClick={() => void handleShare()}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-xs font-bold text-text shadow-2xs transition hover:bg-background sm:h-11 sm:px-4 sm:text-sm"
          title="Âyeti paylaş"
        >
          <Share2 size={16} />
          <span>{t("common.share", "Paylaş")}</span>
        </button>
      </div>
    </div>
  );
}

