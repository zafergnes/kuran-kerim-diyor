"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { useTranslation } from "react-i18next";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const login = useUserStore((state) => state.login);
  const register = useUserStore((state) => state.register);
  const guestLogin = useUserStore((state) => state.guestLogin);
  const loading = useUserStore((state) => state.loading);
  const storeError = useUserStore((state) => state.error);
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "login") {
      const data = await login(email, password);
      if (data?.reactivated) {
        alert(
          t(
            "profile.reactivation_success",
            "Hesabınızın silme işlemi iptal edildi ve hesabınız başarıyla tekrar aktif hale getirildi!"
          )
        );
      }
    } else {
      await register(name, email, password);
    }
    router.push("/profile");
  };

  const enterAsGuest = async () => {
    await guestLogin();
    router.push("/");
  };

  return (
    <div className="mx-auto max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="mt-1 text-3xl font-bold text-text">{mode === "login" ? t("profile.login", "Giriş yap") : t("profile.register", "Kayıt ol")}</h1>
      </div>
      <form onSubmit={submit} className="grid gap-4">
        {mode === "register" && (
          <label className="grid gap-2 text-sm font-bold text-text">
            {t("profile.name", "İsim")}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-12 rounded-md border border-border bg-background px-3 text-sm font-semibold text-text"
              autoComplete="name"
            />
          </label>
        )}
        <label className="grid gap-2 text-sm font-bold text-text">
          {t("profile.email", "E-posta")}
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 rounded-md border border-border bg-background px-3 text-sm font-semibold text-text"
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-text">
          {t("profile.password", "Şifre")}
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 rounded-md border border-border bg-background px-3 text-sm font-semibold text-text"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={mode === "register" ? 8 : 1}
            required
          />
        </label>
        {storeError && <p className="text-sm font-bold text-primary">{t(storeError, storeError)}</p>}
        <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white">
          {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
          {loading ? t("comments.loading", "Bekleyin...") : mode === "login" ? t("profile.login", "Giriş yap") : t("profile.register", "Kayıt ol")}
        </button>
      </form>
      <button
        onClick={() => void enterAsGuest()}
        className="mt-3 h-11 w-full rounded-md border border-border text-sm font-bold text-secondary hover:bg-background"
      >
        {t("profile.guest_continue", "Misafir olarak devam et")}
      </button>
      <Link href={mode === "login" ? "/register" : "/login"} className="mt-5 block text-center text-sm font-semibold text-primary hover:underline">
        {mode === "login" ? t("profile.no_account", "Hesabın yok mu? Kayıt Ol") : t("profile.has_account", "Zaten hesabın var mı? Giriş Yap")}
      </Link>
    </div>
  );
}
