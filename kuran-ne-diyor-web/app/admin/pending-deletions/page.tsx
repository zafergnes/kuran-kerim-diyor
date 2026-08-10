"use client";

import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";
import { UserX, Clock, Search, AlertCircle } from "lucide-react";

interface PendingDeletion {
  id: string;
  name: string | null;
  email: string;
  deletedAt: string;
}

export default function PendingDeletions() {
  const [deletions, setDeletions] = useState<PendingDeletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [renderedAt] = useState(() => Date.now());

  const fetchDeletions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<PendingDeletion[]>("/admin/pending-deletions");
      setDeletions(response.data);
    } catch {
      setError("Silinme talepleri yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void fetchDeletions());
  }, []);

  const calculateRemainingDays = (deletedAtStr: string) => {
    const deletedAt = new Date(deletedAtStr);
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;
    const expiryTime = deletedAt.getTime() + fourteenDays;
    const remainingMs = expiryTime - renderedAt;
    const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
    return remainingDays;
  };

  const filteredDeletions = deletions.filter((item) => {
    const query = searchTerm.toLowerCase();
    return (
      (item.name ?? "").toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
        <p className="font-semibold">{error}</p>
        <button
          onClick={fetchDeletions}
          className="mt-2 text-sm font-bold underline cursor-pointer hover:text-red-900 dark:hover:text-red-300"
        >
          Yeniden Dene
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-text">Silinme Talebi Olan Hesaplar</h2>
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            placeholder="İsim veya e-posta ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border bg-background rounded-md text-text focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {filteredDeletions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-secondary bg-background/50 rounded-lg border border-dashed border-border p-6">
          <UserX size={40} className="text-secondary mb-3 opacity-60" />
          <p className="font-medium text-center">Silinmeyi bekleyen aktif talep yok.</p>
          <p className="text-xs text-center mt-1">14 günlük askı süresi içinde bulunan kullanıcı hesabı bulunmamaktadır.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-lg bg-background">
          <table className="w-full text-left text-sm text-text border-collapse">
            <thead>
              <tr className="bg-card border-b border-border text-xs font-bold uppercase tracking-wider text-secondary">
                <th className="px-6 py-4">Kullanıcı Bilgileri</th>
                <th className="px-6 py-4">Talep Tarihi</th>
                <th className="px-6 py-4">Kalan Süre (Grace Period)</th>
                <th className="px-6 py-4">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDeletions.map((item) => {
                const remainingDays = calculateRemainingDays(item.deletedAt);
                return (
                  <tr key={item.id} className="hover:bg-card/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text">{item.name || "Anonim"}</div>
                      <div className="text-xs text-secondary">{item.email}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">ID: {item.id}</div>
                    </td>
                    <td className="px-6 py-4 text-secondary font-medium">
                      {new Date(item.deletedAt).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                        <Clock size={15} />
                        {remainingDays} Gün
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        <AlertCircle size={12} />
                        Askıda (Soft-Deleted)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
