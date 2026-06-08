import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { SurahSummary } from "@/types/quran";
import { useTranslation } from "react-i18next";

export function SurahList({ surahs }: { surahs: SurahSummary[] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'tr' | 'en' | 'ar' | 'de' | 'fr' | 'es';
  return (
    <div className="grid overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      {surahs.map((surah) => (
        <Link
          key={surah.number}
          href={`/surah/${surah.number}`}
          className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-4 py-4 transition last:border-b-0 hover:bg-background"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {surah.number === 1 ? <CheckCircle2 size={20} /> : surah.number}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold text-text">{surah.name[lang] || surah.name.tr}</span>
            <span className="block truncate text-xs font-semibold text-muted">
              {surah.englishNameTranslation} · {surah.ayahsCount} {t("common.ayah", "ayet")} · {surah.revelationType}
            </span>
          </span>
          <span className="arabic-text text-2xl font-normal text-primary" dir="rtl">
            {surah.name.ar}
          </span>
        </Link>
      ))}
    </div>
  );
}
