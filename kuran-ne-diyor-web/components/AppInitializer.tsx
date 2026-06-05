"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import "@/services/i18n";
import i18n, { applyRTL } from "@/services/i18n";

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useUserStore((state) => state.initialize);
  const language = useUserStore((state) => state.language);

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

  return <>{children}</>;
}
