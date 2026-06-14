"use client";

import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";
import { MessageSquare, AlertOctagon, CheckCircle2, XCircle, Users, RefreshCw } from "lucide-react";

interface AdminStats {
  totalComments: number;
  pendingComments: number;
  approvedComments: number;
  removedComments: number;
  totalReports: number;
  bannedUsers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<AdminStats>("/admin/stats");
      setStats(response.data);
    } catch (err) {
      setError("İstatistikler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
        <p className="font-semibold">{error || "Bir sorun oluştu."}</p>
        <button
          onClick={fetchStats}
          className="mt-2 text-sm font-bold underline cursor-pointer hover:text-red-900 dark:hover:text-red-300"
        >
          Yeniden Dene
        </button>
      </div>
    );
  }

  const cards = [
    {
      title: "Toplam Yorum",
      value: stats.totalComments,
      icon: MessageSquare,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      title: "Aktif Şikayetler",
      value: stats.totalReports,
      icon: AlertOctagon,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    {
      title: "Onaylanan Yorumlar",
      value: stats.approvedComments,
      icon: CheckCircle2,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      title: "Kaldırılan Yorumlar",
      value: stats.removedComments,
      icon: XCircle,
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    },
    {
      title: "İncelenmeyi Bekleyenler",
      value: stats.pendingComments,
      icon: RefreshCw,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    },
    {
      title: "Engellenen Kullanıcılar",
      value: stats.bannedUsers,
      icon: Users,
      color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-text">Sistem İstatistikleri</h2>
        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-secondary transition hover:bg-background hover:text-text cursor-pointer"
        >
          <RefreshCw size={12} className="animate-spin-slow" />
          Yenile
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`rounded-xl border p-5 flex items-center justify-between shadow-sm transition hover:translate-y-[-2px] hover:shadow-md ${card.color}`}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-secondary/70">
                  {card.title}
                </p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight">
                  {card.value}
                </p>
              </div>
              <div className="rounded-lg p-2.5 bg-white/50 dark:bg-black/10">
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
