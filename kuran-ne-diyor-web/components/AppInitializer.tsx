"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import "@/services/i18n";
import i18n, { applyRTL } from "@/services/i18n";

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useUserStore((state) => state.initialize);
  const language = useUserStore((state) => state.language);
  const themePreference = useUserStore((state) => state.themePreference);
  const contentFontScale = useUserStore((state) => state.contentFontScale);

  useEffect(() => {
    initialize().then(() => {
      const currentLang = useUserStore.getState().language;
      i18n.changeLanguage(currentLang);
      applyRTL(currentLang);
    });
  }, [initialize]);

  useEffect(() => {
    i18n.changeLanguage(language);
    applyRTL(language);
  }, [language]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (themePreference === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", themePreference);
    }
  }, [themePreference]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty("--content-font-scale", String(contentFontScale));
  }, [contentFontScale]);

  return <>{children}</>;
}
