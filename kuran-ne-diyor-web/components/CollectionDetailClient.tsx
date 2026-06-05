"use client";

import Link from "next/link";
import { useAppInit } from "@/hooks/useAppInit";
import { useUserStore } from "@/store/userStore";
import { getAyahDisplay } from "@/services/ayahUtils";
import { useTranslation } from "react-i18next";

export function CollectionDetailClient({ id }: { id: string }) {
  useAppInit();
  const collection = useUserStore((state) => state.collections[id]);
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'tr' | 'en' | 'ar' | 'de' | 'fr' | 'es';

  if (!collection) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-text">{t("collections.not_found_title", "Koleksiyon bulunamadı")}</h1>
        <p className="mt-2 text-sm font-semibold text-muted">{t("collections.not_found_desc", "Sayfa yenilendiyse verinin yüklenmesi için ana koleksiyon listesine dön.")}</p>
      </div>
    );
  }

  const items = Object.keys(collection.ayahs).map(getAyahDisplay).filter((item) => item.ayah && item.surah);

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <p className="text-sm font-bold text-primary">{t("tabs.collections", "Koleksiyon")}</p>
        <h1 className="mt-1 text-3xl font-bold text-text">{collection.name}</h1>
        <p className="mt-2 text-sm font-semibold text-muted">{items.length} {t("common.ayah", "ayet")}</p>
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-6 text-center text-sm font-semibold text-muted shadow-sm">
          {t("collections.empty_items", "Bu koleksiyonda ayet yok.")}
        </p>
      ) : (
        items.map(({ surah, ayah, surahNumber, ayahNumber }) => (
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
        ))
      )}
    </div>
  );
}
