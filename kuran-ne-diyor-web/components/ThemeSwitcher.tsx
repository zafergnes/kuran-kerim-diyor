"use client";

import { useUserStore } from "@/store/userStore";
import { Sun, Moon, BookOpen, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const themePreference = useUserStore((state) => state.themePreference);
  const setThemePreference = useUserStore((state) => state.setThemePreference);
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

  const themes = [
    { id: "sepia" as const, label: t("settings.theme_sepia", "Sepya (Parşömen)"), icon: BookOpen, color: "#A0703B" },
    { id: "light" as const, label: t("settings.theme_light", "Açık"), icon: Sun, color: "#B69A73" },
    { id: "dark" as const, label: t("settings.theme_dark", "Koyu"), icon: Moon, color: "#D4B88C" },
    { id: "system" as const, label: t("settings.theme_system", "Sistem"), icon: Monitor, color: "#8C7A6B" },
  ];

  const current = themes.find((th) => th.id === themePreference) || themes[0];
  const CurrentIcon = current.icon;

  if (compact) {
    // Quick cycling button for compact spaces
    const cycleTheme = () => {
      const order: ("sepia" | "light" | "dark")[] = ["sepia", "light", "dark"];
      const nextIndex = (order.indexOf(themePreference as "sepia" | "light" | "dark") + 1) % order.length;
      setThemePreference(order[nextIndex]);
    };

    return (
      <button
        onClick={cycleTheme}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-bold text-primary shadow-xs transition hover:bg-background"
        title={t("settings.app_theme", "Tema Değiştir")}
        aria-label="Tema"
      >
        <CurrentIcon size={16} />
        <span className="capitalize">{current.id}</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-bold text-secondary shadow-xs transition hover:bg-background hover:text-text"
        title={t("settings.app_theme", "Tema Seçimi")}
      >
        <CurrentIcon size={16} className="text-primary" />
        <span className="hidden sm:inline capitalize">{current.id}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-44 rounded-xl border border-border bg-card p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted">
            {t("settings.app_theme", "Tema")}
          </div>
          {themes.map((item) => {
            const Icon = item.icon;
            const isSelected = themePreference === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setThemePreference(item.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                  isSelected ? "bg-primary/10 text-primary font-bold" : "text-secondary hover:bg-background hover:text-text"
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
