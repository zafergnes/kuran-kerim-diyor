"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import { AyahCard } from "@/components/AyahCard";
import { useAppInit } from "@/hooks/useAppInit";
import { useUserStore } from "@/store/userStore";
import { getPageFromSurahAyah } from "@/services/quranHelpers";
import type { Surah } from "@/types/quran";

type SurahReaderClientProps = {
  surah: Surah;
};

export function SurahReaderClient({ surah }: SurahReaderClientProps) {
  useAppInit();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [listMode, setListMode] = useState(false);
  
  const setProgress = useUserStore((state) => state.setProgress);
  const arabicFontFamily = useUserStore((state) => state.arabicFontFamily);
  const readingLayout = useUserStore((state) => state.readingLayout);
  
  const arabicFontClass = arabicFontFamily === "amiri" ? "arabic-font-amiri" : "arabic-font-noto";

  const surahPages = useMemo(() => {
    if (!surah.ayahs.length) return [];
    const start = getPageFromSurahAyah(surah.number, 1);
    const lastAyahNum = surah.ayahs[surah.ayahs.length - 1]?.number || 1;
    const end = getPageFromSurahAyah(surah.number, lastAyahNum);
    const pages = [];
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  }, [surah]);

  const totalLength = readingLayout === "page" ? surahPages.length : surah.ayahs.length;
  const progressPercent = useMemo(() => ((activeIndex + 1) / (totalLength || 1)) * 100, [activeIndex, totalLength]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || listMode) return;

    const onScroll = () => {
      const width = scroller.clientWidth || 1;
      const index = Math.round(scroller.scrollLeft / width);
      const safeIndex = Math.min(Math.max(index, 0), totalLength - 1);
      setActiveIndex(safeIndex);
      
      if (readingLayout === "page" && surahPages.length > 0) {
        const pageNum = surahPages[safeIndex];
        const firstAyah = surah.ayahs.find(a => getPageFromSurahAyah(surah.number, a.number) === pageNum);
        if (firstAyah) {
          setProgress(surah.number, firstAyah.number, surah.ayahs.length);
        }
      } else if (surah.ayahs[safeIndex]) {
        setProgress(surah.number, surah.ayahs[safeIndex].number, surah.ayahs.length);
      }
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [listMode, setProgress, surah, readingLayout, surahPages, totalLength]);

  const scrollToIndex = (index: number, smooth = true) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const safeIndex = Math.min(Math.max(index, 0), totalLength - 1);
    scroller.scrollTo({ left: safeIndex * scroller.clientWidth, behavior: smooth ? "smooth" : "auto" });
    setActiveIndex(safeIndex);
    
    if (readingLayout === "page" && surahPages.length > 0) {
      const pageNum = surahPages[safeIndex];
      const firstAyah = surah.ayahs.find(a => getPageFromSurahAyah(surah.number, a.number) === pageNum);
      if (firstAyah) {
        setProgress(surah.number, firstAyah.number, surah.ayahs.length);
      }
    } else if (surah.ayahs[safeIndex]) {
      setProgress(surah.number, surah.ayahs[safeIndex].number, surah.ayahs.length);
    }
  };

  const scrub = (clientY: number, target: HTMLDivElement) => {
    const rect = target.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    scrollToIndex(Math.floor(ratio * totalLength), false);
  };

  return (
    <div className="relative">
      <div className="mb-6 rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold text-primary">Sure {surah.number}</p>
            <h1 className="mt-1 text-3xl font-bold text-text">{surah.name.tr}</h1>
            <p className="mt-2 text-sm font-semibold text-muted">
              {surah.englishNameTranslation} · {surah.ayahs.length} ayet · {surah.revelationType}
            </p>
          </div>
          <p className={`${arabicFontClass} text-5xl font-normal text-primary`} dir="rtl">
            {surah.name.ar}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {surah.number > 1 && (
            <Link
              href={`/surah/${surah.number - 1}`}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold text-secondary hover:bg-background"
            >
              <ChevronLeft size={18} />
              Önceki
            </Link>
          )}
          <button
            onClick={() => setListMode((value) => !value)}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold text-secondary hover:bg-background"
          >
            <List size={18} />
            {listMode ? "Kaydırmalı oku" : "Liste görünümü"}
          </button>
          {surah.number < 114 && (
            <Link
              href={`/surah/${surah.number + 1}`}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold text-secondary hover:bg-background"
            >
              Sonraki
              <ChevronRight size={18} />
            </Link>
          )}
        </div>
      </div>

      {listMode ? (
        <div className="grid gap-5">
          {readingLayout === "page" ? (
            surahPages.map((pageNum) => {
              const pageAyahs = surah.ayahs.filter(
                (ayah) => getPageFromSurahAyah(surah.number, ayah.number) === pageNum
              );
              return (
                <div key={pageNum} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-6">
                    <span className="text-sm font-bold text-primary">Sayfa {pageNum}</span>
                    <span className="text-xs font-semibold text-muted">{surah.name.tr}</span>
                  </div>
                  <div className="grid gap-5">
                    {pageAyahs.map((ayah) => (
                      <AyahCard key={ayah.globalNumber} ayah={ayah} surahName={surah.name.tr} surahNumber={surah.number} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            surah.ayahs.map((ayah) => (
              <AyahCard key={ayah.globalNumber} ayah={ayah} surahName={surah.name.tr} surahNumber={surah.number} />
            ))
          )}
        </div>
      ) : (
        <>
          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {readingLayout === "page" ? (
              surahPages.map((pageNum) => {
                const pageAyahs = surah.ayahs.filter(
                  (ayah) => getPageFromSurahAyah(surah.number, ayah.number) === pageNum
                );
                return (
                  <section key={pageNum} className="min-w-full snap-start">
                    <div className="min-h-[calc(100vh-260px)] px-1">
                      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex items-center justify-between border-b border-border pb-3 mb-6">
                          <span className="text-sm font-bold text-primary">Sayfa {pageNum}</span>
                          <span className="text-xs font-semibold text-muted">{surah.name.tr}</span>
                        </div>
                        <div className="grid gap-5">
                          {pageAyahs.map((ayah) => (
                            <AyahCard key={ayah.globalNumber} ayah={ayah} surahName={surah.name.tr} surahNumber={surah.number} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })
            ) : (
              surah.ayahs.map((ayah) => (
                <section key={ayah.globalNumber} className="min-w-full snap-start">
                  <div className="min-h-[calc(100vh-260px)] px-1">
                    <AyahCard ayah={ayah} surahName={surah.name.tr} surahNumber={surah.number} />
                  </div>
                </section>
              ))
            )}
          </div>

          <div
            className={`fixed right-3 top-1/2 z-30 hidden h-72 -translate-y-1/2 select-none items-end gap-2 lg:flex ${
              isScrubbing ? "opacity-100" : "opacity-80"
            }`}
          >
            <div
              className="h-full w-8 cursor-pointer"
              onPointerDown={(event) => {
                setIsScrubbing(true);
                event.currentTarget.setPointerCapture(event.pointerId);
                scrub(event.clientY, event.currentTarget);
              }}
              onPointerMove={(event) => {
                if (isScrubbing) scrub(event.clientY, event.currentTarget);
              }}
              onPointerUp={() => setIsScrubbing(false)}
            >
              <div className="ml-auto h-full w-2 overflow-hidden rounded-full bg-primary/20">
                <div className="w-full rounded-full bg-primary" style={{ height: `${progressPercent}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card px-2 py-2 text-center text-[11px] font-bold text-text shadow-sm">
              <div>{activeIndex + 1}</div>
              <div className="my-1 h-px w-5 bg-border" />
              <div className="text-muted">{totalLength}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
