"use client";

import Link from "next/link";
import { LogOut, User, UserX, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppInit } from "@/hooks/useAppInit";
import { useUserStore } from "@/store/userStore";
import apiClient from "@/services/apiClient";
import { useTranslation } from "react-i18next";
import { quranData } from "@/services/quranData";

export function ProfileClient() {
  useAppInit();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);
  const favorites = useUserStore((state) => state.favorites);
  const collections = useUserStore((state) => state.collections);
  const completedSurahs = useUserStore((state) => state.completedSurahs);
  
  const seenAchievements = useUserStore((state) => state.seenAchievements || []);
  const hatimCount = useUserStore((state) => state.hatimCount || 0);
  const readCounts = useUserStore((state) => state.readCounts || {});
  
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'tr' | 'en' | 'ar' | 'de' | 'fr' | 'es';

  const deleteAccount = async () => {
    const confirmMessage = t(
      "profile.delete_account_grace_warning",
      "Hesabınızı silme talebiniz alınacaktır. Yasal haklarınız (KVKK/GDPR/PDPL) gereği tüm verileriniz 14 gün boyunca dondurulacak, bu süre sonunda kalıcı ve geri alınamaz olarak silinecektir. 14 gün içinde tekrar giriş yaparsanız silme talebi iptal edilecektir."
    );
    if (!window.confirm(confirmMessage)) return;

    try {
      await apiClient.delete("/users");
      logout();
      router.push("/");
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.code === "DELETE_COOLDOWN") {
        alert(
          t(
            "profile.delete_cooldown_error",
            "Hesabınız yeni aktif edildiği için güvenlik sebebiyle 24 saat geçmeden tekrar silme talebinde bulunamazsınız."
          )
        );
      } else {
        alert(t("auth_errors.generic", "Bir hata oluştu: {{message}}", { message: err.message }));
      }
    }
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

  // Calculate most read ayah
  let mostReadKey = "";
  let mostReadCount = 0;
  Object.entries(readCounts || {}).forEach(([key, count]) => {
    if (count > mostReadCount) {
      mostReadCount = count;
      mostReadKey = key;
    }
  });

  let mostReadAyahText = "";
  if (mostReadKey && mostReadCount > 0) {
    const [surahNum, ayahNum] = mostReadKey.split(":").map(Number);
    const surah = quranData.find((s) => s.number === surahNum);
    const surahName = surah ? (surah.name[lang] || surah.name.tr) : "";
    mostReadAyahText = t("achievements.most_read_ayah_val", {
      surahName,
      ayahNumber: ayahNum,
      count: mostReadCount,
    });
  }

  const badgesList = [
    { id: "first_step", icon: "🌱" },
    { id: "first_surah", icon: "📖" },
    { id: "regular", icon: "⚡" },
    { id: "faithful_reader", icon: "💖" },
    { id: "hatim", icon: "👑" },
    { id: "double_hatim", icon: "✨" },
    { id: "hatim_guardian", icon: "🛡️" },
  ];

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-bold text-primary">{user.isGuest ? t("profile.account_type_guest", "Misafir") : t("profile.account_type_registered", "Hesap")}</p>
        <h1 className="mt-1 text-3xl font-bold text-text">{user.name || user.email || t("common.user", "Kullanıcı")}</h1>
        {user.email && <p className="mt-2 text-sm font-semibold text-muted">{user.email}</p>}
        <div className="flex flex-wrap gap-2 mt-5">
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-bold text-secondary hover:bg-background"
          >
            <LogOut size={17} />
            {t("profile.logout", "Çıkış yap")}
          </button>
          {!user.isGuest && (
            <button
              onClick={() => void deleteAccount()}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-bold text-primary hover:bg-background"
            >
              <UserX size={17} />
              {t("profile.delete_account", "Hesabı sil")}
            </button>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
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
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-2xl font-bold text-text">{hatimCount}</p>
          <p className="text-sm font-semibold text-muted">{t("achievements.total_hatims", "Toplam Hatim")}</p>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-bold text-text flex items-center gap-2">
          <Award className="text-primary" size={22} />
          {t("achievements.title", "Başarılar ve Rozetler")}
        </h2>
        
        {mostReadAyahText && (
          <div className="mt-4 rounded-md bg-primary/5 border border-primary/10 p-4">
            <span className="text-xs font-bold text-primary block uppercase tracking-wider">
              {t("achievements.most_read_ayah", "En Çok Okuduğunuz Ayet")}
            </span>
            <span className="text-base font-bold text-text mt-1 block">
              {mostReadAyahText}
            </span>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {badgesList.map((badge) => {
            const isUnlocked = seenAchievements.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-300 ${
                  isUnlocked
                    ? "border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-sm hover:-translate-y-1 hover:shadow-md"
                    : "border-border/60 bg-card/40 opacity-60"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl ${
                      isUnlocked
                        ? "bg-gradient-to-tr from-primary/10 to-accent/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isUnlocked ? badge.icon : "🔒"}
                  </div>
                  <div>
                    <h3 className={`font-bold ${isUnlocked ? "text-text" : "text-muted"}`}>
                      {t(`achievements.badge_${badge.id}_title`)}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-muted">
                      {t(`achievements.badge_${badge.id}_desc`)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
