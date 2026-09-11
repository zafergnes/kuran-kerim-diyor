"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Share2, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getAyah } from "@/services/quranData";
import { useUserStore } from "@/store/userStore";
import { AudioPlayer } from "@/components/AudioPlayer";

const ayah = getAyah(2, 255);

export function AyetelKursiClient() {
  const { t } = useTranslation();
  const language = useUserStore((state) => state.language);
  const arabicTranslationLang = useUserStore((state) => state.arabicTranslationLang);
  const [copied, setCopied] = useState(false);
  const translation = useMemo(() => {
    if (!ayah) return "";
    const displayLanguage = language === "ar" ? arabicTranslationLang : language;
    return ayah.translations[displayLanguage] || ayah.translations.tr;
  }, [language, arabicTranslationLang]);

  if (!ayah) return null;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "https://kurannediyor.com.tr/ayetel-kursi";
  const shareText = `${t("ayat_al_kursi.title", "Ayetel Kürsî")}\n\n${ayah.arabic}\n\n${translation}\n\nBakara 2:255`;
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: t("ayat_al_kursi.title", "Ayetel Kürsî"), text: shareText, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Kullanıcı paylaşım panelini kapatırsa sessizce devam ederiz.
      if ((error as DOMException)?.name !== "AbortError") console.error("Ayetel Kürsî paylaşımı başarısız:", error);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/5 to-transparent px-5 py-8 text-center sm:px-10 sm:py-12">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
            <ShieldCheck size={28} />
          </div>
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-primary">
            {t("ayat_al_kursi.subtitle", "Bakara Sûresi · 255. Ayet")}
          </p>
          <p className="mt-7 font-arabic text-3xl font-bold leading-[2.2] text-text sm:text-4xl" dir="rtl">
            {ayah.arabic}
          </p>
        </div>

        <div className="space-y-6 p-5 sm:p-8">
          <p className="mx-auto max-w-3xl text-center text-base leading-8 text-secondary sm:text-lg">{translation}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border pt-5">
            <AudioPlayer globalAyahNumber={ayah.globalNumber} />
            <span className="text-xs font-semibold text-muted">{t("ayat_al_kursi.listen", "Ayetel Kürsî’yi dinle")}</span>
            <span className="text-xs font-bold text-primary">Bakara 2:255</span>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => void handleShare()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-white transition hover:opacity-90"
            >
              {copied ? <Check size={18} /> : canShare ? <Share2 size={18} /> : <Copy size={18} />}
              {copied ? t("common.copied", "Kopyalandı") : t("common.share", "Paylaş")}
            </button>
          </div>
        </div>
      </section>
      <p className="text-center text-xs font-medium text-muted">
        {t("ayat_al_kursi.reflection", "Allah’ın ilmi, kudreti ve koruyuculuğu üzerine tefekkür etmek için bu ayeti saklayabilirsiniz.")}
      </p>
    </div>
  );
}
