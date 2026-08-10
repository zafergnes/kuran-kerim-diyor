"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Check if running as PWA (standalone)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
      || false;

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
      && !(window as Window & { MSStream?: unknown }).MSStream;
    queueMicrotask(() => {
      setIsStandalone(isStandaloneMode);
      setIsIOS(ios);
    });

    // Save beforeinstallprompt event for Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt only if not in standalone mode and user hasn't dismissed it in this session
      const dismissed = sessionStorage.getItem("pwa_install_dismissed");
      if (!isStandaloneMode && !dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If iOS and not standalone, show prompt after 3 seconds
    if (ios && !isStandaloneMode) {
      const dismissed = sessionStorage.getItem("pwa_install_dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the browser prompt
    await deferredPrompt.prompt();
    
    // Wait for the user's choice
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install prompt outcome: ${outcome}`);
    
    // Clear the saved prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pwa_install_dismissed", "true");
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur-md sm:bottom-6 sm:left-auto sm:right-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary text-xl font-bold text-white">
            ق
          </div>
          <div>
            <h3 className="font-bold text-text text-sm">{t("web.install_title", "Kuran Ne Diyor")}</h3>
            <p className="text-xs text-muted font-semibold mt-0.5">
              {isIOS 
                ? t("web.install_desc_ios", "Daha iyi bir deneyim icin ana ekrana ekleyin.") 
                : t("web.install_desc_android", "Hizli erisim ve bildirimler icin uygulamayi yukleyin.")}
            </p>
          </div>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-muted hover:text-text transition p-1"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        {isIOS ? (
          <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-bold text-primary">
            <Share size={14} className="shrink-0" />
            <span>{t("web.install_ios_guide", "Paylas > Ana Ekrana Ekle secenegine dokunun.")}</span>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            disabled={!deferredPrompt}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow transition hover:opacity-90 disabled:opacity-50"
          >
            <Download size={14} />
            {t("web.install_button", "Uygulamayi Yukle")}
          </button>
        )}
      </div>
    </div>
  );
}
