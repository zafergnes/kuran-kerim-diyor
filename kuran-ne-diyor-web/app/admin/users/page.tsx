"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import apiClient from "@/services/apiClient";
import { 
  Users, 
  Search, 
  UserMinus, 
  UserCheck, 
  User, 
  AlertOctagon,
  Calendar
} from "lucide-react";

interface ApiUser {
  id: string;
  name: string | null;
  email: string;
  isGuest: boolean;
  isBanned: boolean;
  role: string;
  invalidReportCount: number;
  createdAt: string;
}

function UsersList() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") || ""; // BANNED, GUEST, REGISTERED

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState(initialFilter);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<ApiUser[]>("/admin/users", {
        params: { search: searchTerm, filter }
      });
      setUsers(response.data);
    } catch {
      setError("Kullanıcılar yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void fetchUsers());
    // Search is submitted explicitly; only the filter tab triggers this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]); // Fetch immediately when filter changes

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleBan = async (userId: string, currentlyBanned: boolean) => {
    try {
      await apiClient.post(`/admin/users/${userId}/ban`, { isBanned: !currentlyBanned });
      // Update local state directly
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, isBanned: !currentlyBanned } : u))
      );
    } catch {
      alert("Kullanıcı engellenirken/engeli kaldırılırken bir hata oluştu.");
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-text flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Kullanıcı Yönetimi
          </h2>
          <p className="text-xs text-secondary mt-0.5">Uygulamadaki üye ve misafir hesapların takibi ve engelleme işlemleri.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter tabs */}
          <div className="flex rounded-md border border-border bg-background p-0.5 text-xs font-semibold">
            <button
              onClick={() => setFilter("")}
              className={`rounded px-3 py-1.5 transition cursor-pointer ${
                filter === ""
                  ? "bg-primary text-white"
                  : "text-secondary hover:text-text"
              }`}
            >
              Hepsi
            </button>
            <button
              onClick={() => setFilter("REGISTERED")}
              className={`rounded px-3 py-1.5 transition cursor-pointer ${
                filter === "REGISTERED"
                  ? "bg-primary text-white"
                  : "text-secondary hover:text-text"
              }`}
            >
              Kayıtlılar
            </button>
            <button
              onClick={() => setFilter("GUEST")}
              className={`rounded px-3 py-1.5 transition cursor-pointer ${
                filter === "GUEST"
                  ? "bg-primary text-white"
                  : "text-secondary hover:text-text"
              }`}
            >
              Misafirler
            </button>
            <button
              onClick={() => setFilter("BANNED")}
              className={`rounded px-3 py-1.5 transition cursor-pointer ${
                filter === "BANNED"
                  ? "bg-primary text-white"
                  : "text-secondary hover:text-text"
              }`}
            >
              Engelliler
            </button>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex max-w-xs items-center gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type="text"
                placeholder="İsim, e-posta veya ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-border bg-background rounded-md text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="bg-card border border-border text-secondary hover:text-text hover:bg-background px-3 py-1.5 text-sm font-semibold rounded-md transition cursor-pointer"
            >
              Ara
            </button>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
          <p className="font-semibold">{error}</p>
          <button
            onClick={fetchUsers}
            className="mt-2 text-sm font-bold underline cursor-pointer hover:text-red-900 dark:hover:text-red-300"
          >
            Yeniden Dene
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-secondary bg-background/50 rounded-lg border border-dashed border-border p-6">
          <User size={40} className="text-secondary mb-3 opacity-60" />
          <p className="font-medium text-center">Hiçbir kullanıcı bulunamadı.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-lg bg-background shadow-sm">
          <table className="w-full text-left text-sm text-text border-collapse">
            <thead>
              <tr className="bg-card border-b border-border text-xs font-bold uppercase tracking-wider text-secondary">
                <th className="px-6 py-4">Kullanıcı Bilgileri</th>
                <th className="px-6 py-4">Hesap Türü</th>
                <th className="px-6 py-4">Kayıt Tarihi</th>
                <th className="px-6 py-4">İhlal Sayısı</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-card/30 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-text">{u.name || "Anonim Kullanıcı"}</div>
                    <div className="text-xs text-secondary">{u.email}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">ID: {u.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    {u.isGuest ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/15">
                        Misafir
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15">
                        Kayıtlı Üye
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-secondary">
                    <div className="flex items-center gap-1">
                      <Calendar size={13} />
                      {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {u.invalidReportCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-500/15 text-xs font-bold">
                        <AlertOctagon size={12} />
                        {u.invalidReportCount} Hatalı Şikayet
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {u.isBanned ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                        Engelli
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Aktif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.role !== "ADMIN" && (
                      <button
                        onClick={() => handleToggleBan(u.id, u.isBanned)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer border ${
                          u.isBanned
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20"
                        }`}
                      >
                        {u.isBanned ? (
                          <>
                            <UserCheck size={13} /> Engeli Kaldır
                          </>
                        ) : (
                          <>
                            <UserMinus size={13} /> Engelle
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function UsersManagement() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <UsersList />
    </Suspense>
  );
}
