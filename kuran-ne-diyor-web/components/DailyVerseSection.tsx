'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Share2, BookOpen, Search } from "lucide-react";
import { DailyVerseService, DailyVerse } from "@/services/dailyVerseService";
import Link from "next/link";

export function DailyVerseSection() {
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DailyVerseService.getDailyVerse()
      .then(setVerse)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse rounded-lg border border-border bg-card p-5 sm:p-7">
        <div className="h-4 w-32 bg-border rounded mb-8"></div>
        <div className="h-12 w-full bg-border rounded mb-4"></div>
        <div className="h-8 w-1/2 mx-auto bg-border rounded"></div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-primary">
        <span className="inline-flex items-center gap-2">
          <Sparkles size={18} />
          Günün Ayeti
        </span>
        <span className="rounded-full border border-border px-3 py-1 text-muted">
          Senkronize
        </span>
      </div>

      <div className="mt-8 text-center">
        <p className="mx-auto max-w-2xl text-xl font-medium leading-9 text-text sm:text-2xl">
          “{verse?.text}”
        </p>
        <p className="mt-5 text-sm font-bold tracking-widest text-primary uppercase">
          — {verse?.reference} —
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/surah/1"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-white transition hover:opacity-90"
        >
          <BookOpen size={18} />
          Kuran'ı Oku
        </Link>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Günün Ayeti',
                text: `${verse?.text} - ${verse?.reference}`,
                url: window.location.href,
              });
            }
          }}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border bg-card px-5 text-sm font-bold text-text transition hover:bg-background"
        >
          <Share2 size={18} />
          Paylaş
        </button>
      </div>
    </div>
  );
}
