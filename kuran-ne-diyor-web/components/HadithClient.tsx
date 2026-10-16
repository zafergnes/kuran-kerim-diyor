"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Copy, ScrollText, Share2 } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import {
  getDailyHadithIndex,
  getHadithById,
  HADITH_STRINGS,
  HADITHS,
  hadithExcerpt,
  hadithReference,
} from "@/services/hadithData";

// ﷺ tek bir ligatür karakteridir; Latin yazı tiplerinde dev boyutta çizildiği için satır içinde küçültülür.
function withSalawat(text: string) {
  return text.split("ﷺ").flatMap((part, i) =>
    i === 0 ? [part] : [<span key={i} className="mx-0.5 inline-block align-middle font-arabic text-[0.95em] leading-none">ﷺ</span>, part],
  );
}

export function HadithClient() {
  const params = useSearchParams();
  const language = useUserStore((state) => state.language);
  const arabicTranslationLang = useUserStore((state) => state.arabicTranslationLang);
  const strings = HADITH_STRINGS[language] ?? HADITH_STRINGS.tr;

  const todayIndex = useMemo(() => getDailyHadithIndex(), []);
  const linkedId = params.get("id");
  // Bağlantıdaki hadis yalnızca ilk açılışta seçilir; sonrasında kullanıcı serbestçe gezinir.
  const [index, setIndex] = useState(() => {
    const linked = getHadithById(linkedId);
    return linked ? HADITHS.indexOf(linked) : todayIndex;
  });
  const [copied, setCopied] = useState(false);

  const hadith = HADITHS[index];
  const isToday = index === todayIndex;
  // Arapça arayüzde asıl metin zaten gösterildiği için çeviri seçili meal dilinden gelir.
  const translationLang = language === "ar" ? (arabicTranslationLang !== "ar" ? arabicTranslationLang : null) : language;
  const translation = translationLang ? hadith.text[translationLang] : null;
  const shareLang = translationLang ?? "ar";

  const step = (delta: number) => setIndex((current) => (current + delta + HADITHS.length) % HADITHS.length);

  const handleShare = async () => {
    const url = `https://kurannediyor.com.tr/hadis?id=${hadith.id}`;
    const text = `${strings.daily}\n\n“${hadithExcerpt(hadith.text[shareLang], 400)}”\n— ${hadithReference(hadith, shareLang)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: strings.daily, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Kullanıcı paylaşım panelini kapatırsa sessizce devam ederiz.
      if ((error as DOMException)?.name !== "AbortError") console.error("Hadis paylaşımı başarısız:", error);
    }
  };

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
          <ScrollText size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-text">{strings.title}</h1>
          <p className="text-sm font-semibold text-muted">{strings.subtitle}</p>
        </div>
      </div>

      <article className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-center text-xs font-extrabold uppercase tracking-wider text-primary">
          {isToday ? strings.daily : `${index + 1} / ${HADITHS.length}`}
        </p>

        <p dir="rtl" lang="ar" className="mt-6 font-arabic text-2xl leading-[2.1] text-text sm:text-[1.7rem]">
          {hadith.text.ar}
        </p>

        {translation ? (
          <>
            <div className="mx-auto my-6 h-0.5 w-12 bg-border" />
            <p dir="ltr" lang={translationLang ?? undefined} className="text-base leading-8 text-secondary">
              {withSalawat(translation)}
            </p>
          </>
        ) : null}

        <footer className="mt-6 flex items-center gap-3 border-t border-border pt-4">
          <p className="flex-1 text-xs font-semibold leading-5 text-muted">{hadithReference(hadith, language)}</p>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${
              hadith.grade === "sahih" ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400" : "bg-primary/15 text-primary"
            }`}
          >
            {hadith.grade === "sahih" ? strings.sahih : strings.hasan}
          </span>
        </footer>
      </article>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          className="flex items-center gap-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-text transition hover:border-primary"
        >
          <ChevronLeft size={16} /> {strings.previous}
        </button>
        {!isToday ? (
          <button type="button" onClick={() => setIndex(todayIndex)} className="px-2 py-2.5 text-sm font-extrabold text-primary">
            {strings.today}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => step(1)}
          className="flex items-center gap-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-text transition hover:border-primary"
        >
          {strings.next} <ChevronRight size={16} />
        </button>
      </div>

      <button
        type="button"
        onClick={handleShare}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-extrabold text-white transition hover:opacity-90"
      >
        {copied ? <Check size={18} /> : canShare ? <Share2 size={18} /> : <Copy size={18} />}
        {strings.share}
      </button>

      <p className="mt-6 text-center text-xs leading-5 text-muted">
        {strings.sourceNote}
        {strings.editorialNote ? ` ${strings.editorialNote}` : ""}
      </p>
    </div>
  );
}
