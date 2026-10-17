"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  BookOpen, 
  Heart, 
  Home, 
  LogIn, 
  MessageSquare, 
  Search, 
  Settings, 
  User, 
  Menu, 
  X, 
  Shield, 
  ShieldCheck, 
  Sparkles, 
  Flame,
  Bookmark,
  ScrollText
} from "lucide-react";
import { useAppInit } from "@/hooks/useAppInit";
import { useUserStore } from "@/store/userStore";
import { HADITH_STRINGS } from "@/services/hadithData";
import { InstallPrompt } from "./InstallPrompt";
import { CelebrationModal } from "./CelebrationModal";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

export function AppShell({ children }: { children: React.ReactNode }) {
  useAppInit();
  const pathname = usePathname();
  const user = useUserStore((state) => state.user);
  const streakCount = useUserStore((state) => state.streakCount);
  const todayCompleted = useUserStore((state) => state.todayCompleted);
  const language = useUserStore((state) => state.language);
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Grouped Navigation for Sidebar
  const navSections = [
    {
      title: t("common.reading", "Kur'an & Okuma"),
      items: [
        { href: "/", label: t("tabs.quran", "Ana Sayfa"), icon: Home },
        { href: "/ayetel-kursi", label: t("ayat_al_kursi.title", "Âyetel Kürsî"), icon: ShieldCheck },
        { href: "/favorites", label: t("favorites.title", "Favoriler"), icon: Heart },
        { href: "/collections", label: t("collections.title", "Koleksiyonlar"), icon: Bookmark },
      ],
    },
    {
      title: t("common.explore", "Keşfet & Tefekkür"),
      items: [
        { href: "/search", label: t("tabs.search", "Kur'an'da Ara"), icon: Search },
        { href: "/hadis", label: (HADITH_STRINGS[language] ?? HADITH_STRINGS.tr).title, icon: ScrollText },
        { href: "/names", label: t("names.nav_title", "Esma-ül Hüsna"), icon: Heart },
        { href: "/dua-generator", label: t("dua.nav_title", "Dua Asistanı"), icon: Sparkles },
        { href: "/my-comments", label: t("my_comments.title", "Yorumlarım"), icon: MessageSquare },
      ],
    },
    {
      title: t("common.account", "Hesap & Ayarlar"),
      items: [
        { href: "/profile", label: t("tabs.profile", "Profil"), icon: User },
        { href: "/settings", label: t("profile.settings", "Ayarlar"), icon: Settings },
        ...(user?.role === "ADMIN"
          ? [{ href: "/admin", label: t("admin.title", "Admin Paneli"), icon: Shield }]
          : []),
      ],
    },
  ];

  // Mobile Bottom Navigation Tabs (5 primary quick destinations)
  const mobileBottomTabs = [
    { href: "/", label: t("tabs.quran", "Ana Sayfa"), icon: Home },
    { href: "/search", label: t("tabs.search", "Arama"), icon: Search },
    { href: "/ayetel-kursi", label: t("ayat_al_kursi.title", "Âyetel Kürsî"), icon: ShieldCheck },
    { href: "/dua-generator", label: t("dua.short_title", "Dua"), icon: Sparkles },
    { href: user ? "/profile" : "/login", label: user ? t("tabs.profile", "Profil") : t("profile.login", "Giriş"), icon: User },
  ];

  const checkIsActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/icons/icon-192x192.png"
              alt={t("web.brand_alt", "Kur'an Ne Diyor? logosu")}
              width={38}
              height={38}
              priority
              className="rounded-xl object-cover shadow-2xs group-hover:scale-105 transition-transform"
            />
            <span>
              <span className="block text-base font-extrabold tracking-tight text-text">
                {t("web.install_title", "Kuran Ne Diyor")}
              </span>
              <span className="block text-[11px] font-bold text-primary -mt-0.5">Web Mushafı</span>
            </span>
          </Link>

          {/* Center: Command-Palette / Quick Search Bar on Desktop */}
          <Link
            href="/search"
            className="hidden md:flex items-center justify-between gap-3 h-10 w-72 lg:w-96 rounded-xl border border-border bg-background/80 px-3.5 text-xs text-muted shadow-2xs hover:border-primary/50 hover:bg-background transition"
          >
            <div className="flex items-center gap-2">
              <Search size={16} className="text-primary" />
              <span className="font-medium truncate">{t("search.quick_prompt", "Sure veya ayet ara... (örn. 36:1)")}</span>
            </div>
            <kbd className="hidden sm:inline-block rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-bold text-muted">
              ⌘K
            </kbd>
          </Link>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Streak Counter Pill */}
            <div
              className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-extrabold shadow-2xs transition ${
                todayCompleted
                  ? "border border-orange-500/30 bg-orange-500/10 text-orange-600"
                  : "border border-primary/25 bg-primary/10 text-primary"
              }`}
              title={t("streak.title", "Günlük Okuma Serisi")}
            >
              <Flame
                size={16}
                className={todayCompleted ? "fill-orange-500 text-orange-500 animate-bounce" : "text-primary"}
              />
              <span>{t("streak.badge_short", { count: streakCount, defaultValue: `${streakCount}g` })}</span>
            </div>

            <div className="hidden sm:block h-5 w-px bg-border mx-1" />

            {/* Theme & Language Switchers */}
            <div className="hidden sm:flex items-center gap-1.5">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>

            {/* Auth Button */}
            <Link
              href={user ? "/profile" : "/login"}
              className="hidden lg:inline-flex h-9.5 items-center gap-2 rounded-xl bg-primary px-3.5 text-xs font-bold text-white shadow-2xs transition hover:opacity-95"
            >
              {user ? <User size={16} /> : <LogIn size={16} />}
              <span className="truncate max-w-[120px]">{user ? user.name || t("tabs.profile", "Profil") : t("profile.login", "Giriş")}</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-primary shadow-2xs transition hover:bg-background lg:hidden"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 pb-24 lg:pb-12">
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-20 space-y-6">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1.5">
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = checkIsActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group relative flex h-10 items-center gap-3 rounded-xl px-3 text-xs sm:text-sm font-semibold transition ${
                          isActive
                            ? "bg-primary/15 text-primary font-bold shadow-2xs"
                            : "text-secondary hover:bg-card/70 hover:text-text"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
                        )}
                        <Icon
                          size={18}
                          className={`shrink-0 transition-colors ${
                            isActive ? "text-primary" : "text-muted group-hover:text-primary"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {!user && (
              <div className="pt-2">
                <Link
                  href="/login"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-xs font-bold text-white shadow-2xs transition hover:opacity-90"
                >
                  <LogIn size={16} />
                  <span>{t("profile.login", "Giriş Yap")}</span>
                </Link>
              </div>
            )}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="min-w-0">{children}</main>
      </div>

      {/* Mobile Drawer (Slide-Over) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="absolute top-0 bottom-0 right-0 w-4/5 max-w-sm bg-card p-5 shadow-2xl flex flex-col border-l border-border overflow-y-auto">
            <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
              <span className="text-sm font-bold text-primary">{t("profile.settings", "Menü")}</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-primary transition hover:bg-card"
                aria-label="Menüyü Kapat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Theme & Language Pickers */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center justify-between rounded-xl border border-border bg-background p-2.5">
                <span className="text-xs font-bold text-muted">{t("settings.app_theme", "Tema")}</span>
                <ThemeSwitcher />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-background p-2.5">
                <span className="text-xs font-bold text-muted">Dil / Language</span>
                <LanguageSwitcher />
              </div>
            </div>

            {/* Navigation Sections */}
            <div className="space-y-4">
              {navSections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                    {section.title}
                  </p>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = checkIsActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex h-10 items-center gap-3 rounded-xl px-3 text-xs font-semibold transition ${
                          isActive
                            ? "bg-primary/15 text-primary font-bold"
                            : "text-text hover:bg-background"
                        }`}
                      >
                        <Icon size={17} className={isActive ? "text-primary" : "text-muted"} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            {!user && (
              <div className="mt-6 pt-4 border-t border-border">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-xs font-bold text-white shadow-2xs transition hover:opacity-90"
                >
                  <LogIn size={16} />
                  <span>{t("profile.login", "Giriş Yap")}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Native-Style Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around lg:hidden shadow-lg">
        {mobileBottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = checkIsActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive ? "text-primary font-bold scale-105" : "text-muted hover:text-text"
              }`}
            >
              <div className="relative">
                <Icon size={20} className={isActive ? "text-primary" : "text-muted"} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <InstallPrompt />
      <CelebrationModal />
    </div>
  );
}
