"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getAllSurahs } from "@/services/quranData";
import { AppShell } from "@/components/AppShell";
import { DailyVerseSection } from "@/components/DailyVerseSection";
import { SurahList } from "@/components/SurahList";
import { ReadingProgress } from "@/components/ReadingProgress";

export default function Home() {
  const surahs = getAllSurahs();
  const { t } = useTranslation();

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <DailyVerseSection />

        <aside className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-text">
            <Clock3 size={20} className="text-primary" />
            {t("web.quick_look", "Hızlı Bakış")}
          </h2>
          <div className="mt-5 grid gap-3">
            <ReadingProgress />
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-2xl font-bold text-text">6</p>
              <p className="text-sm font-semibold text-muted">{t("web.lang_support", "Dil desteği hazırlandı")}</p>
            </div>
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-2xl font-bold text-text">114</p>
              <p className="text-sm font-semibold text-muted">{t("web.surah_list_local", "Sure listesi yerel veriden okunuyor")}</p>
            </div>
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-2xl font-bold text-text">6236</p>
              <p className="text-sm font-semibold text-muted">{t("web.verse_search", "Ayet arama altyapısı")}</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-text">{t("tabs.surahs", "Sureler")}</h2>
          <Link href="/search" className="text-sm font-bold text-primary">
            {t("web.go_to_search", "Aramaya git")}
          </Link>
        </div>
        <SurahList surahs={surahs} />
      </section>
    </AppShell>
  );
}
