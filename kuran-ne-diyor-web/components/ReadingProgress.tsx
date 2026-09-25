"use client";

import Link from "next/link";
import { BookOpen, ChevronRight, Bookmark } from "lucide-react";
import { useAppInit } from "@/hooks/useAppInit";
import { useUserStore } from "@/store/userStore";
import { getAyahDisplay } from "@/services/ayahUtils";
import { useTranslation } from "react-i18next";

export function ReadingProgress() {
  useAppInit();
  const currentSurah = useUserStore((state) => state.currentSurah);
  const currentAyah = useUserStore((state) => state.currentAyah);
  const display = getAyahDisplay(`${currentSurah}_${currentAyah}`);
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'tr' | 'en' | 'ar' | 'de' | 'fr' | 'es';

  return (
    <Link
      href={`/surah/${currentSurah}#ayah-${currentAyah}`}
      className="group relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 transition-all duration-300 hover:border-primary hover:shadow-md block"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
          <Bookmark size={14} className="fill-primary" />
          {t("common.last_read", "Kaldığın Yer")}
        </span>
        <span className="text-[11px] font-semibold text-muted bg-card px-2 py-0.5 rounded-full border border-border">
          {t("common.ayah", "Ayet")} {currentAyah}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1">
        <div>
          <h3 className="text-base font-bold text-text group-hover:text-primary transition-colors">
            {display.surah?.name[lang] || display.surah?.name.tr || "Fatiha"}
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {currentSurah}. Sure · {display.surah?.ayahs?.length || 7} {t("common.ayahs", "Ayet")}
          </p>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition-transform duration-200 group-hover:translate-x-1">
          <ChevronRight size={16} />
        </div>
      </div>
    </Link>
  );
}
