"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import Link from "next/link";
import { BarChart2, AlertTriangle, Shield, ArrowLeft } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initialized } = useUserStore();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (initialized) {
      if (!user || user.role !== "ADMIN") {
        router.push("/");
      } else {
        setAuthorized(true);
      }
    }
  }, [user, initialized, router]);

  if (!initialized || !authorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const isStatsActive = pathname === "/admin";
  const isReportsActive = pathname === "/admin/reports";

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-text">
            <Shield className="text-primary animate-pulse" size={28} />
            Moderasyon Paneli
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Şikayet edilen yorumları inceleyin, topluluk kurallarını ihlal eden hesapları yönetin.
          </p>
        </div>
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-background hover:text-text cursor-pointer"
          >
            <ArrowLeft size={16} />
            Siteye Dön
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* Navigation Sidebar */}
        <aside className="flex flex-col gap-1.5">
          <Link
            href="/admin"
            className={`flex items-center gap-2.5 rounded-md px-3.5 py-2.5 text-sm font-semibold transition cursor-pointer ${
              isStatsActive
                ? "bg-primary text-white shadow-sm"
                : "text-secondary hover:bg-card hover:text-text"
            }`}
          >
            <BarChart2 size={18} />
            Genel Durum
          </Link>
          <Link
            href="/admin/reports"
            className={`flex items-center gap-2.5 rounded-md px-3.5 py-2.5 text-sm font-semibold transition cursor-pointer ${
              isReportsActive
                ? "bg-primary text-white shadow-sm"
                : "text-secondary hover:bg-card hover:text-text"
            }`}
          >
            <AlertTriangle size={18} />
            Şikayet Edilenler
          </Link>
        </aside>

        {/* Content Area */}
        <main className="min-w-0 bg-card border border-border rounded-lg p-6 shadow-sm">
          {children}
        </main>
      </div>
    </div>
  );
}
