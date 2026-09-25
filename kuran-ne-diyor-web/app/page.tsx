"use client";

import Link from "next/link";
import { Clock3, ShieldCheck } from "lucide-react";
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

        <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-text">
            <Clock3 size={18} className="text-primary" />
            {t("web.quick_look", "Hızlı Erişim & Okuma")}
          </h2>

          <ReadingProgress />

          <Link
            href="/ayetel-kursi"
            className="group flex items-center justify-between rounded-xl border border-primary/25 bg-primary/10 p-3.5 transition hover:bg-primary/15"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
                <ShieldCheck size={20} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-text group-hover:text-primary transition-colors">
                  {t("ayat_al_kursi.title", "Âyetel Kürsî")}
                </h3>
                <p className="text-[11px] text-muted">Bakara Suresi 255. Âyet</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-primary">Oku →</span>
          </Link>

          {/* Sık Okunan Sureler */}
          <div className="rounded-xl border border-border bg-background p-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
              {t("web.frequent_surahs", "Sık Okunan Sureler")}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <Link
                href="/surah/36"
                className="flex items-center justify-between p-2 rounded-lg border border-border/60 hover:border-primary hover:bg-card transition"
              >
                <span className="truncate">Yâsîn</span>
                <span className="text-[10px] text-muted ml-1">36</span>
              </Link>
              <Link
                href="/surah/67"
                className="flex items-center justify-between p-2 rounded-lg border border-border/60 hover:border-primary hover:bg-card transition"
              >
                <span className="truncate">Mülk (Tebâreke)</span>
                <span className="text-[10px] text-muted ml-1">67</span>
              </Link>
              <Link
                href="/surah/78"
                className="flex items-center justify-between p-2 rounded-lg border border-border/60 hover:border-primary hover:bg-card transition"
              >
                <span className="truncate">Nebe (Amme)</span>
                <span className="text-[10px] text-muted ml-1">78</span>
              </Link>
              <Link
                href="/surah/55"
                className="flex items-center justify-between p-2 rounded-lg border border-border/60 hover:border-primary hover:bg-card transition"
              >
                <span className="truncate">Rahmân</span>
                <span className="text-[10px] text-muted ml-1">55</span>
              </Link>
              <Link
                href="/surah/56"
                className="flex items-center justify-between p-2 rounded-lg border border-border/60 hover:border-primary hover:bg-card transition"
              >
                <span className="truncate">Vâkıa</span>
                <span className="text-[10px] text-muted ml-1">56</span>
              </Link>
              <Link
                href="/surah/18"
                className="flex items-center justify-between p-2 rounded-lg border border-border/60 hover:border-primary hover:bg-card transition"
              >
                <span className="truncate">Kehf</span>
                <span className="text-[10px] text-muted ml-1">18</span>
              </Link>
              <Link
                href="/surah/1"
                className="flex items-center justify-between p-2 rounded-lg border border-border/60 hover:border-primary hover:bg-card transition"
              >
                <span className="truncate">Fâtiha</span>
                <span className="text-[10px] text-muted ml-1">1</span>
              </Link>
              <Link
                href="/surah/112"
                className="flex items-center justify-between p-2 rounded-lg border border-border/60 hover:border-primary hover:bg-card transition"
              >
                <span className="truncate">İhlâs</span>
                <span className="text-[10px] text-muted ml-1">112</span>
              </Link>
            </div>
          </div>

          {/* Mushaf Bilgi Özeti */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl border border-border bg-background p-2.5">
              <div className="text-base font-bold text-text">114</div>
              <div className="text-[10px] text-muted font-medium">{t("tabs.surahs", "Sure")}</div>
            </div>
            <div className="rounded-xl border border-border bg-background p-2.5">
              <div className="text-base font-bold text-text">604</div>
              <div className="text-[10px] text-muted font-medium">{t("common.page", "Sayfa")}</div>
            </div>
            <div className="rounded-xl border border-border bg-background p-2.5">
              <div className="text-base font-bold text-text">6236</div>
              <div className="text-[10px] text-muted font-medium">{t("common.ayah", "Ayet")}</div>
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
