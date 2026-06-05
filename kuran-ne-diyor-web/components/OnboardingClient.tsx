"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Cloud, Globe, Heart } from "lucide-react";
import { useAppInit } from "@/hooks/useAppInit";
import { useUserStore } from "@/store/userStore";
import type { AppLanguage } from "@/types/quran";
import { useTranslation } from "react-i18next";

const languages: { value: AppLanguage; nativeName: string; name: string }[] = [
  { value: "tr", nativeName: "Türkçe", name: "Turkish" },
  { value: "en", nativeName: "English", name: "English" },
  { value: "ar", nativeName: "العربية", name: "Arabic" },
  { value: "de", nativeName: "Deutsch", name: "German" },
  { value: "es", nativeName: "Español", name: "Spanish" },
  { value: "fr", nativeName: "Français", name: "French" },
];

export function OnboardingClient() {
  useAppInit();
  const [index, setIndex] = useState(0);
  const [showLanguages, setShowLanguages] = useState(false);
  const language = useUserStore((state) => state.language);
  const setLanguage = useUserStore((state) => state.setLanguage);
  const { t } = useTranslation();
  const slides = useMemo(
    () => [
      {
        title: t("onboarding.slide1_title", "Kur'an'ı sade bir akışta oku"),
        description: t("onboarding.slide1_desc", "Ayetleri Arapça metin ve seçtiğin meal diliyle takip et."),
        icon: BookOpen,
      },
      {
        title: t("onboarding.slide2_title", "Verilerin hesabınla senkron kalsın"),
        description: t("onboarding.slide2_desc", "Favoriler, koleksiyonlar ve yorumlar backend ile korunur."),
        icon: Cloud,
      },
      {
        title: t("onboarding.slide3_title", "Ayetleri kaydet ve paylaş"),
        description: t("onboarding.slide3_desc", "Favorilere ekle, koleksiyon oluştur, yorum yaz ve kaldığın yerden devam et."),
        icon: Heart,
      },
    ],
    [t],
  );
  const slide = slides[index];
  const Icon = slide.icon;

  const finish = () => {
    window.localStorage.setItem("hasOnboarded", "true");
  };

  return (
    <div className="min-h-screen bg-background px-5 py-5 text-text">
      <header className="mx-auto flex max-w-3xl items-center justify-between">
        <button onClick={() => setShowLanguages(true)} className="grid h-11 w-11 place-items-center rounded-md text-primary hover:bg-card">
          <Globe size={24} />
        </button>
        <Link href="/" onClick={finish} className="text-sm font-bold text-muted hover:text-primary">
          {t("onboarding.btn_skip", "Geç")}
        </Link>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-170px)] max-w-3xl place-items-center text-center">
        <section>
          <div className="mx-auto grid h-40 w-40 place-items-center rounded-full bg-primary/10">
            <Icon size={92} className="text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="mt-10 text-3xl font-bold text-text">{slide.title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted">{slide.description}</p>
        </section>
      </main>

      <footer className="mx-auto max-w-3xl pb-8">
        <div className="mb-8 flex justify-center gap-2">
          {slides.map((_, slideIndex) => (
            <button
              key={slideIndex}
              onClick={() => setIndex(slideIndex)}
              className={`h-2 rounded-full transition-all ${slideIndex === index ? "w-7 bg-primary" : "w-2 bg-border"}`}
            />
          ))}
        </div>
        {index === slides.length - 1 ? (
          <Link
            href="/"
            onClick={finish}
            className="mx-auto flex h-14 max-w-md items-center justify-center gap-2 rounded-full bg-primary text-lg font-bold text-white shadow-sm"
          >
            {t("onboarding.btn_start", "Başla")}
            <Check size={20} />
          </Link>
        ) : (
          <button
            onClick={() => setIndex((value) => value + 1)}
            className="mx-auto flex h-14 w-full max-w-md items-center justify-center gap-2 rounded-full bg-primary text-lg font-bold text-white shadow-sm"
          >
            {t("onboarding.btn_next", "Devam")}
            <ArrowRight size={20} />
          </button>
        )}
      </footer>

      {showLanguages && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-lg border border-border bg-card shadow-xl">
            <h2 className="px-5 py-4 text-base font-bold text-text">{t("settings.language", "Dil seç")}</h2>
            {languages.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setLanguage(item.value);
                  setShowLanguages(false);
                }}
                className="flex w-full items-center justify-between border-t border-border px-5 py-4 text-left hover:bg-background"
              >
                <span>
                  <span className="block text-sm font-bold text-text">{item.nativeName}</span>
                  <span className="block text-xs font-semibold text-muted">{item.name}</span>
                </span>
                {language === item.value && <Check size={20} className="text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
