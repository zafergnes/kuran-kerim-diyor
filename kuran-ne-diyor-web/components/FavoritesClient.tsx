"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useAppInit } from "@/hooks/useAppInit";
import { useUserStore } from "@/store/userStore";
import { getAyahDisplay } from "@/services/ayahUtils";
import { useTranslation } from "react-i18next";

export function FavoritesClient() {
  useAppInit();
  const favorites = useUserStore((state) => state.favorites);
  const items = Object.keys(favorites).map(getAyahDisplay).filter((item) => item.ayah && item.surah);
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'tr' | 'en' | 'ar' | 'de' | 'fr' | 'es';

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <Heart className="mx-auto text-primary" size={30} />
        <h1 className="mt-3 text-2xl font-bold text-text">{t("favorites.empty_title", "Favori yok")}</h1>
        <p className="mt-2 text-sm font-semibold text-muted">{t("favorites.empty_desc", "Ayet kartlarındaki kalp ikonuyla favori ekleyebilirsin.")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map(({ surah, ayah, surahNumber, ayahNumber }) => (
        <Link
          key={`${surahNumber}_${ayahNumber}`}
          href={`/surah/${surahNumber}#ayah-${ayahNumber}`}
          className="rounded-lg border border-border bg-card p-5 shadow-sm transition hover:bg-background"
        >
          <p className="text-sm font-bold text-primary">
            {surah!.name[lang] || surah!.name.tr} · {t("common.ayah", "Ayet")} {ayahNumber}
          </p>
          <p className="arabic-text mt-3 line-clamp-2 text-right text-2xl font-normal leading-loose text-text" dir="rtl">
            {ayah!.arabic}
          </p>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-secondary">{ayah!.translations[lang] || ayah!.translations.tr}</p>
        </Link>
      ))}
    </div>
  );
}
