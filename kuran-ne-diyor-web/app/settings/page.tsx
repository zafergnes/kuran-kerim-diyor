"use client";

import { AppShell } from "@/components/AppShell";
import { SettingsClient } from "@/components/SettingsClient";
import { useTranslation } from "react-i18next";

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-text">{t("profile.settings", "Ayarlar")}</h1>
        <p className="mt-2 text-sm font-semibold text-muted">{t("settings.font_size_desc", "Dil ve okuma tercihleri.")}</p>
      </div>
      <SettingsClient />
    </AppShell>
  );
}
