"use client";

import { useUserStore } from "@/store/userStore";
import type { AppLanguage } from "@/types/quran";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import i18n, { applyRTL } from "@/services/i18n";

const languages: { code: AppLanguage; label: string; flag: string }[] = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const language = useUserStore((state) => state.language);
  const setLanguage = useUserStore((state) => state.setLanguage);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = languages.find((l) => l.code === language) || languages[0];

  const handleSelect = (code: AppLanguage) => {
    setLanguage(code);
    i18n.changeLanguage(code);
    applyRTL(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-bold text-secondary shadow-xs transition hover:bg-background hover:text-text"
        title="Dil Seçimi / Language"
        aria-label="Dil"
      >
        <Globe size={15} className="text-primary" />
        <span className="uppercase">{current.code}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-36 rounded-xl border border-border bg-card p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted">
            Dil / Language
          </div>
          {languages.map((item) => {
            const isSelected = language === item.code;
            return (
              <button
                key={item.code}
                onClick={() => handleSelect(item.code)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  isSelected ? "bg-primary/10 text-primary font-bold" : "text-secondary hover:bg-background hover:text-text"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{item.flag}</span>
                  <span>{item.label}</span>
                </span>
                {isSelected && <span className="text-[10px] text-primary">●</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
