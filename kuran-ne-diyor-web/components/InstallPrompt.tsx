"use client";

import { useEffect, useState } from "react";
import { X, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ANDROID_STORE_URL, IOS_STORE_URL } from "@/lib/site";

/**
 * Mobil ziyaretcilere magaza uygulamasini oneren banner.
 *
 * Onceden bu bilesen PWA kurulumu (beforeinstallprompt) tetikliyordu. Artik
 * tetiklemiyor: uygulamanin web surumunun ana ekrana kurulmasi istenmiyor,
 * kullanici gercek magaza uygulamasina yonlendiriliyor.
 *
 * Banner yalnizca ilgili platformun magaza adresi tanimliysa gosterilir; Android
 * yayina cikana kadar (bkz. lib/site.ts) Android'de hic gorunmez.
 */
export function InstallPrompt() {
  const [storeUrl, setStoreUrl] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

    const ua = navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
    const isAndroid = /Android/.test(ua);

    const target = isIOS ? IOS_STORE_URL : isAndroid ? ANDROID_STORE_URL : null;
    const dismissed = sessionStorage.getItem("store_banner_dismissed");

    queueMicrotask(() => {
      setIsStandalone(standalone);
      if (target && !standalone && !dismissed) setStoreUrl(target);
    });
  }, []);

  const handleDismiss = () => {
    setStoreUrl(null);
    sessionStorage.setItem("store_banner_dismissed", "true");
  };

  if (!storeUrl || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur-md sm:bottom-6 sm:left-auto sm:right-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary text-xl font-bold text-white">
            ق
          </div>
          <div>
            <h3 className="text-sm font-bold text-text">
              {t("web.install_title", "Kuran Ne Diyor")}
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-muted">
              {t("web.store_desc", "Daha iyi bir deneyim icin mobil uygulamayi indirin.")}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label={t("common.close", "Kapat")}
          className="p-1 text-muted transition hover:text-text"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-4">
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow transition hover:opacity-90"
        >
          <Smartphone size={14} />
          {t("web.store_button", "Uygulamayi Indir")}
        </a>
      </div>
    </div>
  );
}
