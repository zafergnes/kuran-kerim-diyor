"use client";

import Link from "next/link";
import { LogOut, User, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppInit } from "@/hooks/useAppInit";
import { useUserStore } from "@/store/userStore";
import apiClient from "@/services/apiClient";
import { useTranslation } from "react-i18next";

export function ProfileClient() {
  useAppInit();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);
  const favorites = useUserStore((state) => state.favorites);
  const collections = useUserStore((state) => state.collections);
  const completedSurahs = useUserStore((state) => state.completedSurahs);
  const { t } = useTranslation();

  const deleteAccount = async () => {
    if (!window.confirm(t("profile.delete_confirm_message", "Hesabınız ve tüm verileriniz silinsin mi?"))) return;
    await apiClient.delete("/users");
    logout();
    router.push("/");
  };

  if (!user) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <User className="mx-auto text-primary" size={32} />
        <h1 className="mt-3 text-2xl font-bold text-text">{t("profile.login", "Giriş yapılmadı")}</h1>
        <Link href="/login" className="mt-4 inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-bold text-white">
          {t("profile.login", "Giriş yap")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-bold text-primary">{user.isGuest ? t("profile.account_type_guest", "Misafir") : t("profile.account_type_registered", "Hesap")}</p>
        <h1 className="mt-1 text-3xl font-bold text-text">{user.name || user.email || t("common.user", "Kullanıcı")}</h1>
        {user.email && <p className="mt-2 text-sm font-semibold text-muted">{user.email}</p>}
        <button
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-bold text-secondary hover:bg-background"
        >
          <LogOut size={17} />
          {t("profile.logout", "Çıkış yap")}
        </button>
        {!user.isGuest && (
          <button
            onClick={() => void deleteAccount()}
            className="mt-3 inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-bold text-primary hover:bg-background"
          >
            <UserX size={17} />
            {t("profile.delete_account", "Hesabı sil")}
          </button>
        )}
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-2xl font-bold text-text">{Object.keys(favorites).length}</p>
          <p className="text-sm font-semibold text-muted">{t("tabs.favorites", "Favori")}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-2xl font-bold text-text">{Object.keys(collections).length}</p>
          <p className="text-sm font-semibold text-muted">{t("tabs.collections", "Koleksiyon")}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-2xl font-bold text-text">{completedSurahs.length}</p>
          <p className="text-sm font-semibold text-muted">{t("profile.completed_surahs", "Tamamlanan sure")}</p>
        </div>
      </section>
    </div>
  );
}
