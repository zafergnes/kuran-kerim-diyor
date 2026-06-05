"use client";

import Link from "next/link";
import { BookOpen, Heart, Home, LogIn, MessageSquare, Search, Settings, User } from "lucide-react";
import { useAppInit } from "@/hooks/useAppInit";
import { useUserStore } from "@/store/userStore";
import { InstallPrompt } from "./InstallPrompt";

const navItems = [
  { href: "/", label: "Ana Sayfa", icon: Home },
  { href: "/search", label: "Ara", icon: Search },
  { href: "/favorites", label: "Favoriler", icon: Heart },
  { href: "/collections", label: "Koleksiyonlar", icon: BookOpen },
  { href: "/my-comments", label: "Yorumlarım", icon: MessageSquare },
  { href: "/profile", label: "Profil", icon: User },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  useAppInit();
  const user = useUserStore((state) => state.user);

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-lg font-bold text-white">
              ق
            </span>
            <span>
              <span className="block text-base font-bold text-text">Kuran Ne Diyor</span>
              <span className="block text-xs font-semibold text-muted">Web</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-secondary transition hover:bg-background hover:text-text"
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href={user ? "/profile" : "/login"}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              {user ? <User size={18} /> : <LogIn size={18} />}
              {user ? user.name || "Profil" : "Giriş"}
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
        <aside className="hidden lg:block">
          <nav className="sticky top-20 grid gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-secondary transition hover:bg-card hover:text-text"
                >
                  <Icon size={19} className="text-primary" />
                  {item.label}
                </Link>
              );
            })}
            {!user && (
              <Link
                href="/login"
                className="mt-3 inline-flex h-11 items-center gap-3 rounded-md bg-primary px-3 text-sm font-bold text-white transition hover:opacity-90"
              >
                <LogIn size={19} />
                Giriş yap
              </Link>
            )}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
      <InstallPrompt />
    </div>
  );
}
