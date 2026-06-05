"use client";

import { useRef, useState, useEffect } from "react";
import { useAppInit } from "@/hooks/useAppInit";
import { useUserStore } from "@/store/userStore";
import type { AppLanguage } from "@/types/quran";
import { Loader2, Pause, Play, Headphones, Check, Bell } from "lucide-react";
import { WebNotificationService } from "@/services/webNotificationService";
import { useTranslation } from "react-i18next";

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
      setIsNotificationsSupported(true);
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
