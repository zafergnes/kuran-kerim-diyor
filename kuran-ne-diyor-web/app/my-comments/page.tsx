"use client";

import { AppShell } from "@/components/AppShell";
import { MyCommentsClient } from "@/components/MyCommentsClient";
import { useTranslation } from "react-i18next";

export default function MyCommentsPage() {
  const { t } = useTranslation();
  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-text">{t("profile.my_comments", "Yorumlarım")}</h1>
        <p className="mt-2 text-sm font-semibold text-muted">{t("comments.my_comments_desc", "Yorumların ve moderasyon durumları.")}</p>
      </div>
      <MyCommentsClient />
    </AppShell>
  );
}
