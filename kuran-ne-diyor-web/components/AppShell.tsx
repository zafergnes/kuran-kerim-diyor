"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Heart, Home, LogIn, MessageSquare, Search, Settings, User, Menu, X } from "lucide-react";
import { useAppInit } from "@/hooks/useAppInit";
import { useUserStore } from "@/store/userStore";
import { InstallPrompt } from "./InstallPrompt";
import { useTranslation } from "react-i18next";

export function AppShell({ children }: { children: React.ReactNode }) {
  useAppInit();
  const user = useUserStore((state) => state.user);
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: t("tabs.quran", "Ana Sayfa"), icon: Home },
    { href: "/search", label: t("tabs.search", "Ara"), icon: Search },
    { href: "/favorites", label: t("favorites.title", "Favoriler"), icon: Heart },
    { href: "/collections", label: t("collections.title", "Koleksiyonlar"), icon: BookOpen },
    { href: "/my-comments", label: t("my_comments.title", "Yorumlarım"), icon: MessageSquare },
    { href: "/profile", label: t("tabs.profile", "Profil"), icon: User },
    { href: "/settings", label: t("profile.settings", "Ayarlar"), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-primary text-lg font-bold text-white">
              ق
            </span>
            <span>
              <span className="block text-base font-bold text-text">{t("web.install_title", "Kuran Ne Diyor")}</span>
              <span className="block text-xs font-semibold text-muted">Web</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="grid h-10 w-10 place-items-center rounded-md border border-border bg-background text-primary transition hover:bg-card"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
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
              {user ? user.name || t("tabs.profile", "Profil") : t("profile.login", "Giriş")}
            </Link>
          </nav>
        </div>
        
      </header>

      {/* Mobile Sidebar Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          
          {/* Sidebar */}
          <div className="absolute top-0 bottom-0 right-0 w-1/2 bg-card p-4 shadow-2xl flex flex-col border-l border-border overflow-y-auto">
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-primary transition hover:bg-muted"
                aria-label="Menüyü Kapat"
              >
                <X size={20} />
              </button>
            </div>
            
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex h-12 items-center gap-3 rounded-md px-3 text-sm font-bold text-text transition hover:bg-background"
                  >
                    <Icon size={20} className="text-primary shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
              {!user && (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-4 flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-bold text-white transition hover:opacity-90"
                >
                  <LogIn size={20} className="shrink-0" />
                  <span className="truncate">{t("profile.login", "Giriş yap")}</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}

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
                {t("profile.login", "Giriş yap")}
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
