"use client";

import { useRef, useState, useEffect } from "react";
import { useAppInit } from "@/hooks/useAppInit";
import { useUserStore } from "@/store/userStore";
import type { AppLanguage } from "@/types/quran";
import { Loader2, Play, Headphones, Check, Bell, Sun, Moon, Palette, Laptop, Type, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { WebNotificationService } from "@/services/webNotificationService";
import { useTranslation } from "react-i18next";
import Link from "next/link";

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
  { id: "ar.abdurrahmaansudais", name: "Abdurrahman Al-Sudais", initials: "AS", style: "Kabe İmamı - Coşkulu ve hızlı tilavet" },
  { id: "ar.mahermuaiqly", name: "Maher Al-Muaiqly", initials: "MM", style: "Kabe İmamı - Net ve etkileyici tilavet" },
  { id: "ar.abdulbasitmurattal", name: "Abdulbasit Abdussamed", initials: "AB", style: "Klasik ve efsanevi Mısır tilaveti" },
];

export function SettingsClient() {
  const { t } = useTranslation();
  useAppInit();
  const language = useUserStore((state) => state.language);
  const setLanguage = useUserStore((state) => state.setLanguage);
  const themePreference = useUserStore((state) => state.themePreference);
  const setThemePreference = useUserStore((state) => state.setThemePreference);
  const contentFontScale = useUserStore((state) => state.contentFontScale);
  const setContentFontScale = useUserStore((state) => state.setContentFontScale);
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
  const selectedArabicScript = useUserStore((state) => state.selectedArabicScript);
  const setSelectedArabicScript = useUserStore((state) => state.setSelectedArabicScript);

  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isNotificationsSupported, setIsNotificationsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      queueMicrotask(() => setIsNotificationsSupported(true));
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription && Notification.permission === "granted");
        });
      });
    }
  }, []);

  const handleNotificationToggle = async () => {
    if (isNotificationLoading) return;
    setIsNotificationLoading(true);
    try {
      if (isSubscribed) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
        setIsSubscribed(false);
      } else {
        const subscription = await WebNotificationService.registerAndSubscribe();
        if (subscription) {
          setIsSubscribed(true);
        } else {
          alert(t("settings.notificationError", "Bildirim izni reddedildi veya bir hata olustu. Tarayici ayarlarindan bildirim iznini kontrol edin."));
        }
      }
    } catch (error) {
      console.error("Error toggling web push subscription:", error);
    } finally {
      setIsNotificationLoading(false);
    }
  };

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
        <h2 className="text-2xl font-bold text-text">{t("settings.legal_section", "Gizlilik ve Kaynaklar")}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/privacy?lang=${language}`} className="rounded-md border border-border px-4 py-2 text-sm font-bold text-primary">{t("settings.privacy_policy", "Gizlilik Politikası")}</Link>
          <Link href={`/sources?lang=${language}`} className="rounded-md border border-border px-4 py-2 text-sm font-bold text-primary">{t("settings.sources", "Kaynaklar ve Atıflar")}</Link>
          <Link href={`/support?lang=${language}`} className="rounded-md border border-border px-4 py-2 text-sm font-bold text-primary">{t("settings.support", "Destek")}</Link>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-text">{t("profile.language", "Dil")}</h1>
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

      {/* Tema ve Görünüm */}
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="text-primary" size={24} />
          <h2 className="text-2xl font-bold text-text">{t("settings.theme_title", "Görünüm ve Tema")}</h2>
        </div>
        <p className="text-xs font-semibold text-muted mb-4">
          {t("settings.theme_desc", "Gözünüzü yormayan sıcak sepya parşömen, aydınlık veya gece temalarından dilediğinizi seçin.")}
        </p>

        <div className="grid gap-3 sm:grid-cols-4">
          {/* Sepya (Varsayılan & Önerilen) */}
          <button
            type="button"
            onClick={() => setThemePreference("sepia")}
            className={`flex flex-col items-start p-4 rounded-xl border text-left transition relative ${
              themePreference === "sepia"
                ? "border-amber-600 bg-amber-500/10 shadow-sm ring-1 ring-amber-600"
                : "border-border hover:bg-background"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF4E8] border border-[#E3D7C1] text-[#A0703B]">
                <Palette size={16} />
              </span>
              {themePreference === "sepia" && <Check size={16} className="text-amber-600" />}
            </div>
            <div className="font-bold text-text text-sm">{t("theme.sepia", "Sepya (Önerilen)")}</div>
            <div className="text-[11px] text-muted mt-1">{t("theme.sepia_desc", "Sıcak parşömen kağıdı tonu, göz dostu")}</div>
            <div className="mt-3 flex gap-1.5 w-full">
              <div className="h-4 w-4 rounded-full bg-[#F4EBD9] border border-[#E3D7C1]" title="Arka Plan" />
              <div className="h-4 w-4 rounded-full bg-[#FAF4E8] border border-[#E3D7C1]" title="Kart" />
              <div className="h-4 w-4 rounded-full bg-[#A0703B]" title="Vurgu" />
            </div>
          </button>

          {/* Açık */}
          <button
            type="button"
            onClick={() => setThemePreference("light")}
            className={`flex flex-col items-start p-4 rounded-xl border text-left transition relative ${
              themePreference === "light"
                ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                : "border-border hover:bg-background"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-gray-200 text-emerald-700">
                <Sun size={16} />
              </span>
              {themePreference === "light" && <Check size={16} className="text-primary" />}
            </div>
            <div className="font-bold text-text text-sm">{t("theme.light", "Açık")}</div>
            <div className="text-[11px] text-muted mt-1">{t("theme.light_desc", "Aydınlık ve ferah klasik görünüm")}</div>
            <div className="mt-3 flex gap-1.5 w-full">
              <div className="h-4 w-4 rounded-full bg-[#F8F9FA] border border-gray-300" />
              <div className="h-4 w-4 rounded-full bg-white border border-gray-300" />
              <div className="h-4 w-4 rounded-full bg-[#1B4332]" />
            </div>
          </button>

          {/* Koyu */}
          <button
            type="button"
            onClick={() => setThemePreference("dark")}
            className={`flex flex-col items-start p-4 rounded-xl border text-left transition relative ${
              themePreference === "dark"
                ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                : "border-border hover:bg-background"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900 border border-gray-700 text-emerald-400">
                <Moon size={16} />
              </span>
              {themePreference === "dark" && <Check size={16} className="text-primary" />}
            </div>
            <div className="font-bold text-text text-sm">{t("theme.dark", "Koyu (Gece)")}</div>
            <div className="text-[11px] text-muted mt-1">{t("theme.dark_desc", "Düşük ışıkta dinlendirici karanlık tema")}</div>
            <div className="mt-3 flex gap-1.5 w-full">
              <div className="h-4 w-4 rounded-full bg-[#121417] border border-gray-700" />
              <div className="h-4 w-4 rounded-full bg-[#1A1D21] border border-gray-700" />
              <div className="h-4 w-4 rounded-full bg-[#2D6A4F]" />
            </div>
          </button>

          {/* Sistem */}
          <button
            type="button"
            onClick={() => setThemePreference("system")}
            className={`flex flex-col items-start p-4 rounded-xl border text-left transition relative ${
              themePreference === "system"
                ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                : "border-border hover:bg-background"
            }`}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-card border border-border text-text">
                <Laptop size={16} />
              </span>
              {themePreference === "system" && <Check size={16} className="text-primary" />}
            </div>
            <div className="font-bold text-text text-sm">{t("theme.system", "Sistem")}</div>
            <div className="text-[11px] text-muted mt-1">{t("theme.system_desc", "Cihazınızın sistem temasına göre otomatik uyum sağlar")}</div>
            <div className="mt-3 flex gap-1.5 w-full">
              <div className="h-4 w-4 rounded-full bg-primary/20 border border-border" />
              <div className="h-4 w-4 rounded-full bg-card border border-border" />
            </div>
          </button>
        </div>
      </section>

      {/* Yazı Boyutu ve Okuma Ölçeği */}
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Type className="text-primary" size={24} />
          <h2 className="text-2xl font-bold text-text">{t("settings.font_size_title", "Metin Boyutu ve Ölçeklendirme")}</h2>
        </div>
        <p className="text-xs font-semibold text-muted mb-4">
          {t("settings.font_size_desc", "Arapça ayet metinlerini ve mealleri okuma konforunuza göre büyütün veya küçültün.")}
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => setContentFontScale(Math.max(0.85, Number((contentFontScale - 0.15).toFixed(2))))}
            disabled={contentFontScale <= 0.85}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-bold text-text hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <ZoomOut size={16} />
            <span>{t("common.smaller", "Küçült")}</span>
          </button>

          <span className="px-4 py-2 rounded-xl bg-primary/10 text-primary font-bold text-base min-w-[70px] text-center">
            %{Math.round(contentFontScale * 100)}
          </span>

          <button
            type="button"
            onClick={() => setContentFontScale(Math.min(1.5, Number((contentFontScale + 0.15).toFixed(2))))}
            disabled={contentFontScale >= 1.5}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-bold text-text hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <ZoomIn size={16} />
            <span>{t("common.larger", "Büyüt")}</span>
          </button>

          {contentFontScale !== 1.0 && (
            <button
              type="button"
              onClick={() => setContentFontScale(1.0)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted hover:text-text transition ml-auto"
            >
              <RotateCcw size={14} />
              <span>{t("common.reset", "Varsayılan")}</span>
            </button>
          )}
        </div>

        {/* Canlı Önizleme Kutusu */}
        <div className="rounded-xl border border-border bg-background p-5 text-center">
          <p className="text-[11px] font-semibold text-muted mb-3 uppercase tracking-wider">
            {t("settings.live_preview", "Canlı Önizleme")}
          </p>
          <p className="arabic-font-noto reader-arabic text-text leading-[2.2] mb-3" dir="rtl">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p className="reader-translation text-secondary font-medium leading-relaxed">
            Rahmân ve Rahîm olan Allah&apos;ın adıyla.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-text">{t("settings.arabic_user_settings", "Arapça kullanıcı ayarı")}</h2>
        <label className="mt-4 flex items-center justify-between gap-4 rounded-md border border-border bg-background p-4 text-sm font-bold text-text">
          {t("settings.show_translation", "Meal göster")}
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
          <h2 className="text-2xl font-bold text-text">{t("settings.audio_section", "Ses ve Okuyucu Ayarları")}</h2>
        </div>
        <p className="text-xs font-semibold text-muted mb-4">{t("settings.audio_reciter_desc", "Ayetleri dinlerken okuyacak imamı seçin. Oynat tuşuna basarak seslerini önizleyebilirsiniz.")}</p>
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
                  title={isPlayingPreview ? t("settings.preview_stop", "Durdur") : t("settings.preview_play", "Önizleme Dinle")}
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
        <div className="flex items-center gap-2 mb-2">
          <Bell className="text-primary" size={24} />
          <h2 className="text-2xl font-bold text-text">{t("web.notification_title", "Gunun Ayeti Bildirimleri")}</h2>
        </div>
        <p className="text-xs font-semibold text-muted mb-4">
          {t("web.notification_desc", "Her gun belirlediginiz saatte Gunun Ayeti bildirimlerini tarayiciniza almak icin aktilestirin.")}
        </p>

        {!isNotificationsSupported ? (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs font-medium text-yellow-600 dark:text-yellow-400">
            {t("web.notification_not_supported", "Bu tarayici push bildirimlerini desteklememektedir. Eger iOS cihaz kullaniyorsaniz, bildirim alabilmek icin once bu siteyi Paylas > Ana Ekrana Ekle secenegiyle telefonunuza yuklemeli ve ardindan ana ekrandan acarak bu ayari aktif etmelisiniz.")}
          </div>
        ) : (
          <label className="flex items-center justify-between gap-4 rounded-md border border-border bg-background p-4 text-sm font-bold text-text cursor-pointer hover:bg-background/80 transition">
            <span className="flex flex-col gap-0.5">
              <span>{t("web.notification_toggle", "Günün Ayeti Bildirimlerini Al")}</span>
              <span className="text-xs font-medium text-muted">{t("web.notification_toggle_sub", "Web Push Bildirimleri")}</span>
            </span>
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={isSubscribed}
                onChange={handleNotificationToggle}
                disabled={isNotificationLoading}
                className="sr-only peer"
                id="web-push-toggle"
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </div>
          </label>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-text">{t("settings.reading_section", "Okuma Tercihleri")}</h2>
        <p className="text-xs font-semibold text-muted mb-4">{t("settings.reading_layout_sub", "Okuma düzeni, yazı tipi ve imla (yazım stili) tercihlerinizi güncelleyin.")}</p>
        
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Okuma Düzeni */}
          <div>
            <label className="block text-sm font-bold text-text mb-2">{t("settings.reading_layout", "Okuma Düzeni")}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setReadingLayout("single")}
                className={`flex-1 h-11 rounded-md border text-sm font-bold transition ${
                  readingLayout === "single"
                    ? "border-primary bg-primary text-white"
                    : "border-border text-secondary hover:bg-background"
                }`}
              >
                {t("settings.layout_single", "Ayet Ayet")}
              </button>
              <button
                onClick={() => setReadingLayout("page")}
                className={`flex-1 h-11 rounded-md border text-sm font-bold transition ${
                  readingLayout === "page"
                    ? "border-primary bg-primary text-white"
                    : "border-border text-secondary hover:bg-background"
                }`}
              >
                {t("settings.layout_page", "Sayfa Sayfa")}
              </button>
            </div>
          </div>

          {/* Arapça Yazı Tipi */}
          <div>
            <label className="block text-sm font-bold text-text mb-2">{t("settings.arabic_font", "Arapça Yazı Tipi")}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setArabicFontFamily("noto-naskh")}
                className={`flex-1 h-11 rounded-md border text-sm font-bold transition ${
                  arabicFontFamily === "noto-naskh"
                    ? "border-primary bg-primary text-white"
                    : "border-border text-secondary hover:bg-background"
                }`}
              >
                {t("settings.font_noto_naskh", "Diyanet Hat (Nesih)")}
              </button>
              <button
                onClick={() => setArabicFontFamily("amiri")}
                className={`flex-1 h-11 rounded-md border text-sm font-bold transition ${
                  arabicFontFamily === "amiri"
                    ? "border-primary bg-primary text-white"
                    : "border-border text-secondary hover:bg-background"
                }`}
              >
                {t("settings.font_amiri", "Klasik Hat (Amiri)")}
              </button>
            </div>
          </div>

          {/* Arapça Yazım Stili (İmla) */}
          <div>
            <label className="block text-sm font-bold text-text mb-2">{t("settings.arabic_script", "Arapça Yazım Stili (İmla)")}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedArabicScript("diyanet")}
                className={`flex-1 h-11 rounded-md border text-sm font-bold transition ${
                  selectedArabicScript === "diyanet"
                    ? "border-primary bg-primary text-white"
                    : "border-border text-secondary hover:bg-background"
                }`}
              >
                {t("settings.script_diyanet_short", "Diyanet İmlası")}
              </button>
              <button
                onClick={() => setSelectedArabicScript("uthmani")}
                className={`flex-1 h-11 rounded-md border text-sm font-bold transition ${
                  selectedArabicScript === "uthmani"
                    ? "border-primary bg-primary text-white"
                    : "border-border text-secondary hover:bg-background"
                }`}
              >
                {t("settings.script_uthmani_short", "Medine İmlası")}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
