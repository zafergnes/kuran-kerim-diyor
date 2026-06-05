"use client";

import { AppShell } from "@/components/AppShell";
import { FavoritesClient } from "@/components/FavoritesClient";
import { useTranslation } from "react-i18next";

export default function FavoritesPage() {
  const { t } = useTranslation();
  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-text">{t("profile.favorites", "Favoriler")}</h1>
        <p className="mt-2 text-sm font-semibold text-muted">{t("favorites.desc", "Kaydettiğin ayetler yerel olarak ve giriş yaptıysan backend ile senkron tutulur.")}</p>
      </div>
      <FavoritesClient />
    </AppShell>
  );
}
