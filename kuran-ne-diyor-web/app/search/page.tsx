"use client";

import { AppShell } from "@/components/AppShell";
import { SearchClient } from "./SearchClient";
import { useTranslation } from "react-i18next";

export default function SearchPage() {
  const { t } = useTranslation();
  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-text">{t("tabs.search", "Ara")}</h1>
        <p className="mt-2 text-sm font-semibold text-muted">{t("search.desc", "Ayet metni, sure adı veya referans ile hızlı arama.")}</p>
      </div>
      <SearchClient />
    </AppShell>
  );
}
