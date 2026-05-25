"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { useUserStore } from "@/store/userStore";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const login = useUserStore((state) => state.login);
  const register = useUserStore((state) => state.register);
  const guestLogin = useUserStore((state) => state.guestLogin);
  const loading = useUserStore((state) => state.loading);
  const storeError = useUserStore((state) => state.error);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "login") {
      await login(email, password);
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
        <p className="text-sm font-bold text-primary">{mode === "login" ? "Hoş geldin" : "Yeni hesap"}</p>
        <h1 className="mt-1 text-3xl font-bold text-text">{mode === "login" ? "Giriş yap" : "Kayıt ol"}</h1>
      </div>
      <form onSubmit={submit} className="grid gap-4">
        {mode === "register" && (
          <label className="grid gap-2 text-sm font-bold text-text">
            İsim
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-12 rounded-md border border-border bg-background px-3 text-sm font-semibold text-text"
              autoComplete="name"
            />
          </label>
        )}
        <label className="grid gap-2 text-sm font-bold text-text">
          E-posta
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
          Şifre
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 rounded-md border border-border bg-background px-3 text-sm font-semibold text-text"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            required
          />
        </label>
        {storeError && <p className="text-sm font-bold text-primary">{storeError}</p>}
        <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white">
          {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
          {loading ? "Bekleyin..." : mode === "login" ? "Giriş yap" : "Kayıt ol"}
        </button>
      </form>
      <button
        onClick={() => void enterAsGuest()}
        className="mt-3 h-11 w-full rounded-md border border-border text-sm font-bold text-secondary hover:bg-background"
      >
        Misafir olarak devam et
      </button>
      <p className="mt-5 text-center text-sm font-semibold text-muted">
        {mode === "login" ? "Hesabın yok mu?" : "Hesabın var mı?"}{" "}
        <Link href={mode === "login" ? "/register" : "/login"} className="font-bold text-primary">
          {mode === "login" ? "Kayıt ol" : "Giriş yap"}
        </Link>
      </p>
    </div>
  );
}
