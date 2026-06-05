"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, List, Loader2, Pause, Play } from "lucide-react";
import { AyahCard } from "@/components/AyahCard";
import { useAppInit } from "@/hooks/useAppInit";
import { useUserStore } from "@/store/userStore";
import { getPageFromSurahAyah } from "@/services/quranHelpers";
import { GlobalAudioController } from "@/services/globalAudioController";
import type { Surah } from "@/types/quran";

const reciterNames: Record<string, string> = {
  "ar.alafasy": "Mishary Rashid",
  "ar.abdurrahmaansudais": "Al-Sudais",
  "ar.mahermuaiqly": "Maher Al-Muaiqly",
  "ar.abdulbasitmurattal": "Abdulbasit Abdussamed",
};

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
  const selectedReciter = useUserStore((state) => state.selectedReciter);
  
  const arabicFontClass = arabicFontFamily === "amiri" ? "arabic-font-amiri" : "arabic-font-noto";

  // Page audio player states
  const [playingPageNum, setPlayingPageNum] = useState<number | null>(null);
  const [playingAyahIndex, setPlayingAyahIndex] = useState<number>(-1);
  const [isPagePlaying, setIsPagePlaying] = useState<boolean>(false);
  const [pageAudioProgress, setPageAudioProgress] = useState<number>(0);
  const [isPageAudioLoading, setIsPageAudioLoading] = useState<boolean>(false);
  const pageAudioRef = useRef<HTMLAudioElement | null>(null);

  const playPageAyah = async (pageNum: number, pageAyahs: any[], index: number) => {
    const ownerId = `page_${pageNum}`;
    if (index < 0 || index >= pageAyahs.length) {
      setPlayingPageNum(null);
      setPlayingAyahIndex(-1);
      setIsPagePlaying(false);
      setPageAudioProgress(0);
      GlobalAudioController.stop(ownerId);
      pageAudioRef.current = null;
      return;
    }

    setPlayingAyahIndex(index);
    setIsPageAudioLoading(true);

    const activeAyah = pageAyahs[index];
    const url = `https://cdn.islamic.network/quran/audio/64/${selectedReciter}/${activeAyah.globalNumber}.mp3`;

    if (pageAudioRef.current) {
      pageAudioRef.current.pause();
      pageAudioRef.current = null;
    }

    const audio = new Audio(url);
    pageAudioRef.current = audio;

    audio.addEventListener("timeupdate", () => {
      if (audio.duration) {
        setPageAudioProgress(audio.currentTime / audio.duration);
      }
    });

    audio.addEventListener("ended", () => {
      setPageAudioProgress(0);
      void playPageAyah(pageNum, pageAyahs, index + 1);
    });

    try {
      GlobalAudioController.play(audio, ownerId, () => {
        setIsPagePlaying(false);
        setPlayingPageNum(null);
        setPlayingAyahIndex(-1);
        setPageAudioProgress(0);
        pageAudioRef.current = null;
      });

      await audio.play();
      setIsPagePlaying(true);
    } catch (e) {
      console.error("Page audio play error:", e);
      setIsPagePlaying(false);
    } finally {
      setIsPageAudioLoading(false);
    }
  };

  const togglePagePlay = async (pageNum: number, pageAyahs: any[]) => {
    if (pageAyahs.length === 0) return;
    const ownerId = `page_${pageNum}`;

    if (playingPageNum !== pageNum) {
      if (playingPageNum) {
        GlobalAudioController.stop(`page_${playingPageNum}`);
      }
      if (pageAudioRef.current) {
        pageAudioRef.current.pause();
        pageAudioRef.current = null;
      }
      setPlayingPageNum(pageNum);
      setPlayingAyahIndex(0);
      setIsPagePlaying(true);
      setPageAudioProgress(0);
      void playPageAyah(pageNum, pageAyahs, 0);
      return;
    }

    if (isPagePlaying) {
      GlobalAudioController.stop(ownerId);
    } else {
      if (pageAudioRef.current) {
        setIsPageAudioLoading(true);
        try {
          GlobalAudioController.play(pageAudioRef.current, ownerId, () => {
            setIsPagePlaying(false);
            setPlayingPageNum(null);
            setPlayingAyahIndex(-1);
            setPageAudioProgress(0);
            pageAudioRef.current = null;
          });
          await pageAudioRef.current.play();
          setIsPagePlaying(true);
        } catch (e) {
          console.error("Page audio playback resume error:", e);
        } finally {
          setIsPageAudioLoading(false);
        }
      } else {
        setPlayingAyahIndex(0);
        setIsPagePlaying(true);
        setPageAudioProgress(0);
        void playPageAyah(pageNum, pageAyahs, 0);
      }
    }
  };

  const handlePageProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pageAudioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.min(1, Math.max(0, clickX / width));

    if (pageAudioRef.current.duration) {
      const targetTime = percentage * pageAudioRef.current.duration;
      pageAudioRef.current.currentTime = targetTime;
      setPageAudioProgress(percentage);
    }
  };

  // Reset page audio when selectedReciter or layout changes
  useEffect(() => {
    if (playingPageNum) {
      GlobalAudioController.stop(`page_${playingPageNum}`);
    }
    if (pageAudioRef.current) {
      pageAudioRef.current.pause();
      pageAudioRef.current = null;
    }
    setPlayingPageNum(null);
    setPlayingAyahIndex(-1);
    setIsPagePlaying(false);
    setPageAudioProgress(0);
    setIsPageAudioLoading(false);
  }, [selectedReciter, readingLayout]);

  // Clean up page audio on unmount
  useEffect(() => {
    return () => {
      if (playingPageNum) {
        GlobalAudioController.stop(`page_${playingPageNum}`);
      } else if (pageAudioRef.current) {
        pageAudioRef.current.pause();
      }
    };
  }, [playingPageNum]);

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
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-primary">Sayfa {pageNum}</span>
                      <button
                        onClick={() => void togglePagePlay(pageNum, pageAyahs)}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-primary hover:bg-background transition"
                        title={playingPageNum === pageNum && isPagePlaying ? "Duraklat" : "Sayfayı Dinle"}
                      >
                        {playingPageNum === pageNum && isPageAudioLoading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : playingPageNum === pageNum && isPagePlaying ? (
                          <Pause size={14} />
                        ) : (
                          <Play size={14} />
                        )}
                      </button>
                      
                      {playingPageNum === pageNum && (
                        <div className="flex items-center gap-2">
                          <div
                            onClick={handlePageProgressClick}
                            className="w-[120px] h-6 flex items-center cursor-pointer relative group"
                          >
                            <div className="w-full h-1.5 rounded-full bg-primary/20 relative">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-75"
                                style={{ width: `${pageAudioProgress * 100}%` }}
                              />
                              <div 
                                className="absolute w-3 h-3 rounded-full bg-primary -top-[3px] -ml-[6px] transition-all duration-75"
                                style={{ left: `${pageAudioProgress * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-[10px] text-muted font-medium truncate max-w-[80px]">
                            🎙️ {reciterNames[selectedReciter] || selectedReciter.split(".").pop()}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-muted">{surah.name.tr}</span>
                  </div>
                  <div className="grid gap-5">
                    {pageAyahs.map((ayah, idx) => (
                      <AyahCard
                        key={ayah.globalNumber}
                        ayah={ayah}
                        surahName={surah.name.tr}
                        surahNumber={surah.number}
                        highlighted={playingPageNum === pageNum && playingAyahIndex === idx}
                      />
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
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 mb-6">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-primary">Sayfa {pageNum}</span>
                            <button
                              onClick={() => void togglePagePlay(pageNum, pageAyahs)}
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-primary hover:bg-background transition"
                              title={playingPageNum === pageNum && isPagePlaying ? "Duraklat" : "Sayfayı Dinle"}
                            >
                              {playingPageNum === pageNum && isPageAudioLoading ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : playingPageNum === pageNum && isPagePlaying ? (
                                <Pause size={14} />
                              ) : (
                                <Play size={14} />
                              )}
                            </button>
                            
                            {playingPageNum === pageNum && (
                              <div className="flex items-center gap-2">
                                <div
                                  onClick={handlePageProgressClick}
                                  className="w-[120px] h-6 flex items-center cursor-pointer relative group"
                                >
                                  <div className="w-full h-1.5 rounded-full bg-primary/20 relative">
                                    <div
                                      className="h-full bg-primary rounded-full transition-all duration-75"
                                      style={{ width: `${pageAudioProgress * 100}%` }}
                                    />
                                    <div 
                                      className="absolute w-3 h-3 rounded-full bg-primary -top-[3px] -ml-[6px] transition-all duration-75"
                                      style={{ left: `${pageAudioProgress * 100}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-[10px] text-muted font-medium truncate max-w-[80px]">
                                  🎙️ {reciterNames[selectedReciter] || selectedReciter.split(".").pop()}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-muted">{surah.name.tr}</span>
                        </div>
                        <div className="grid gap-5">
                          {pageAyahs.map((ayah, idx) => (
                            <AyahCard
                              key={ayah.globalNumber}
                              ayah={ayah}
                              surahName={surah.name.tr}
                              surahNumber={surah.number}
                              highlighted={playingPageNum === pageNum && playingAyahIndex === idx}
                            />
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
