"use client";

import { useRef, useState, useEffect } from "react";
import { useAppInit } from "@/hooks/useAppInit";
import { useUserStore } from "@/store/userStore";
import type { AppLanguage } from "@/types/quran";
import { Loader2, Pause, Play, Headphones, Check } from "lucide-react";

const languages: { value: AppLanguage; label: string }[] = [
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
  { value: "de", label: "Deutsch" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
];

const reciters = [
  { id: "ar.alafasy", name: "Mishary Rashid Al-Afasy", initials: "MA", style: "Melodik ve net tilavet (Dünya favorisi)" },
  { id: "ar.sudais", name: "Abdurrahman Al-Sudais", initials: "AS", style: "Kabe İmamı - Coşkulu ve hızlı tilavet" },
  { id: "ar.ghamadi", name: "Saad Al-Ghamdi", initials: "SG", style: "Yumuşak ve huzurlu tilavet" },
  { id: "ar.abdulbasitmurattal", name: "Abdulbasit Abdussamed", initials: "AB", style: "Klasik ve efsanevi Mısır tilaveti" },
];

export function SettingsClient() {
  useAppInit();
  const language = useUserStore((state) => state.language);
  const setLanguage = useUserStore((state) => state.setLanguage);
  const showArabicTranslation = useUserStore((state) => state.showArabicTranslation);
  const setShowArabicTranslation = useUserStore((state) => state.setShowArabicTranslation);
  const arabicTranslationLang = useUserStore((state) => state.arabicTranslationLang);
  const setArabicTranslationLang = useUserStore((state) => state.setArabicTranslationLang);
  const selectedReciter = useUserStore((state) => state.selectedReciter);
  const setSelectedReciter = useUserStore((state) => state.setSelectedReciter);
  const readingLayout = useUserStore((state) => state.readingLayout);
  const setReadingLayout = useUserStore((state) => state.setReadingLayout);
  const arabicFontFamily = useUserStore((state) => state.arabicFontFamily);
  const setArabicFontFamily = useUserStore((state) => state.setArabicFontFamily);

  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const handlePreviewPlayPause = async (reciterId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Okuyucu seçimini tetiklemesini engelle

    if (isPreviewLoading) return;

    if (previewAudioRef.current && playingPreviewId === reciterId) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setPlayingPreviewId(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setPlayingPreviewId(null);
    }

    setIsPreviewLoading(true);
    setPlayingPreviewId(reciterId);

    try {
      const audio = new Audio(`https://cdn.islamic.network/quran/audio/64/${reciterId}/1.mp3`);
      audio.addEventListener("ended", () => {
        setPlayingPreviewId(null);
        previewAudioRef.current = null;
      });
      
      previewAudioRef.current = audio;
      await audio.play();
      setIsPreviewLoading(false);
    } catch (e) {
      console.error("Web preview audio error:", e);
      setIsPreviewLoading(false);
      setPlayingPreviewId(null);
      previewAudioRef.current = null;
    }
  };

  // Unmount olurken önizlemeyi kapat
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-text">Dil</h1>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {languages.map((item) => (
            <button
              key={item.value}
              onClick={() => setLanguage(item.value)}
              className={`h-11 rounded-md border px-3 text-sm font-bold ${
                language === item.value ? "border-primary bg-primary text-white" : "border-border text-secondary hover:bg-background"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-text">Arapça kullanıcı ayarı</h2>
        <label className="mt-4 flex items-center justify-between gap-4 rounded-md border border-border bg-background p-4 text-sm font-bold text-text">
          Meal göster
          <input
            type="checkbox"
            checked={showArabicTranslation}
            onChange={(event) => setShowArabicTranslation(event.target.checked)}
            className="h-5 w-5 accent-[var(--primary)]"
          />
        </label>
        <select
          value={arabicTranslationLang}
          onChange={(event) => setArabicTranslationLang(event.target.value as AppLanguage)}
          className="mt-4 h-11 rounded-md border border-border bg-background px-3 text-sm font-bold text-text"
        >
          {languages.filter((item) => item.value !== "ar").map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Headphones className="text-primary" size={24} />
          <h2 className="text-2xl font-bold text-text">Ses ve Okuyucu Ayarları</h2>
        </div>
        <p className="text-xs font-semibold text-muted mb-4">Ayetleri dinlerken okuyacak imamı seçin. Oynat tuşuna basarak seslerini önizleyebilirsiniz.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {reciters.map((item) => {
            const isSelected = selectedReciter === item.id;
            const isPlayingPreview = playingPreviewId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedReciter(item.id)}
                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:bg-background"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 font-bold text-sm text-primary">
                    {item.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-text flex items-center gap-2">
                      {item.name}
                      {isSelected && <Check size={16} className="text-primary" />}
                    </h3>
                    <p className="text-[11px] text-muted mt-0.5">{item.style}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => void handlePreviewPlayPause(item.id, e)}
                  className="grid h-8 w-8 place-items-center rounded-full border border-primary text-primary transition hover:bg-primary/10"
                  title={isPlayingPreview ? "Durdur" : "Önizleme Dinle"}
                >
                  {isPlayingPreview ? (
                    isPreviewLoading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <div className="h-2.5 w-2.5 rounded-[1px] bg-primary" />
                    )
                  ) : (
                    <Play size={10} className="text-primary fill-primary ml-[1px]" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-text">Okuma Tercihleri</h2>
        <p className="text-xs font-semibold text-muted mb-4">Okuma düzeni ve Arapça yazı stili tercihlerinizi güncelleyin.</p>
        
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Okuma Düzeni */}
          <div>
            <label className="block text-sm font-bold text-text mb-2">Okuma Düzeni</label>
            <div className="flex gap-2">
              <button
                onClick={() => setReadingLayout("single")}
                className={`flex-1 h-11 rounded-md border text-sm font-bold transition ${
                  readingLayout === "single"
                    ? "border-primary bg-primary text-white"
                    : "border-border text-secondary hover:bg-background"
                }`}
              >
                Ayet Ayet
              </button>
              <button
                onClick={() => setReadingLayout("page")}
                className={`flex-1 h-11 rounded-md border text-sm font-bold transition ${
                  readingLayout === "page"
                    ? "border-primary bg-primary text-white"
                    : "border-border text-secondary hover:bg-background"
                }`}
              >
                Sayfa Sayfa
              </button>
            </div>
          </div>

          {/* Arapça Yazı Tipi */}
          <div>
            <label className="block text-sm font-bold text-text mb-2">Arapça Yazı Tipi</label>
            <div className="flex gap-2">
              <button
                onClick={() => setArabicFontFamily("noto-naskh")}
                className={`flex-1 h-11 rounded-md border text-sm font-bold transition ${
                  arabicFontFamily === "noto-naskh"
                    ? "border-primary bg-primary text-white"
                    : "border-border text-secondary hover:bg-background"
                }`}
              >
                Diyanet Hat Stili (Nesih)
              </button>
              <button
                onClick={() => setArabicFontFamily("amiri")}
                className={`flex-1 h-11 rounded-md border text-sm font-bold transition ${
                  arabicFontFamily === "amiri"
                    ? "border-primary bg-primary text-white"
                    : "border-border text-secondary hover:bg-background"
                }`}
              >
                Klasik Hat Stili (Amiri)
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
