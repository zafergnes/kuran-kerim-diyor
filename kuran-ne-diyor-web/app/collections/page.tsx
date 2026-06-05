"use client";

import { AppShell } from "@/components/AppShell";
import { CollectionsClient } from "@/components/CollectionsClient";
import { useTranslation } from "react-i18next";

export default function CollectionsPage() {
  const { t } = useTranslation();
  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-text">{t("collections.title", "Koleksiyonlar")}</h1>
        <p className="mt-2 text-sm font-semibold text-muted">{t("collections.desc", "Ayetleri konu veya okuma planına göre gruplandır.")}</p>
      </div>
      <CollectionsClient />
    </AppShell>
  );
}
