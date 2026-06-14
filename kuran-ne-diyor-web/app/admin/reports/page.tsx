"use client";

import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";
import { 
  AlertTriangle, 
  Trash2, 
  EyeOff, 
  UserMinus, 
  UserCheck, 
  CheckCircle,
  ExternalLink,
  MessageSquare,
  Search,
  AlertCircle
} from "lucide-react";

interface Report {
  id: number;
  commentId: number;
  userId: string;
  reason: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    invalidReportCount: number;
  };
  comment: {
    id: number;
    text: string;
    ayahId: string;
    status: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      isBanned: boolean;
    };
  };
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Report[]>("/admin/reports");
      setReports(response.data);
    } catch (err) {
      setError("Şikayetler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDismissReport = async (reportId: number, penalizeReporter: boolean) => {
    try {
      await apiClient.post(`/admin/reports/${reportId}/dismiss`, { penalizeReporter });
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      alert("Şikayet yoksayılırken bir hata oluştu.");
    }
  };

  const handleRemoveComment = async (commentId: number, reason: string) => {
    try {
      await apiClient.post(`/admin/comments/${commentId}/remove`, { reason });
      // Remove all reports that correspond to this comment ID
      setReports((prev) => prev.filter((r) => r.commentId !== commentId));
    } catch (err) {
      alert("Yorum kaldırılırken bir hata oluştu.");
    }
  };

  const handleToggleBanUser = async (userId: string, currentlyBanned: boolean) => {
    try {
      await apiClient.post(`/admin/users/${userId}/ban`, { isBanned: !currentlyBanned });
      
      // Update state in matching reports
      setReports((prev) =>
        prev.map((r) => {
          if (r.comment.user.id === userId) {
            return {
              ...r,
              comment: {
                ...r.comment,
                user: {
                  ...r.comment.user,
                  isBanned: !currentlyBanned,
                },
              },
            };
          }
          return r;
        })
      );
    } catch (err) {
      alert("Kullanıcı durumu güncellenirken bir hata oluştu.");
    }
  };

  const filteredReports = reports.filter((report) => {
    const query = searchTerm.toLowerCase();
    return (
      report.comment.text.toLowerCase().includes(query) ||
      report.reason.toLowerCase().includes(query) ||
      (report.comment.user.name ?? "").toLowerCase().includes(query) ||
      report.comment.user.email.toLowerCase().includes(query)
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
          onClick={fetchReports}
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
        <h2 className="text-xl font-bold text-text">Şikayet Edilen Yorumlar</h2>
        
        {/* Search bar */}
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            placeholder="Yorum, şikayet nedeni veya e-posta ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border bg-background rounded-md text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-secondary bg-background/50 rounded-lg border border-dashed border-border p-6">
          <CheckCircle size={40} className="text-emerald-500 mb-3" />
          <p className="font-medium text-center">İncelenecek şikayet bulunmuyor.</p>
          <p className="text-xs text-center mt-1">Tüm şikayetler çözümlenmiş veya arama kriterine uymuyor.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredReports.map((report) => (
            <div 
              key={report.id} 
              className="border border-border bg-background rounded-xl p-5 shadow-sm space-y-4 hover:border-primary/30 transition"
            >
              {/* Report Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-xs text-secondary">
                <div className="flex items-center gap-1.5 font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20">
                  <AlertTriangle size={14} />
                  Şikayet Nedeni: {report.reason}
                </div>
                <div>
                  Şikayet Eden: <span className="font-bold text-text">{report.user.name || "Anonim"}</span> ({report.user.email}) 
                  {report.user.invalidReportCount > 0 && (
                    <span className="text-rose-500 font-semibold ml-1 bg-rose-500/5 px-1.5 py-0.5 rounded border border-rose-500/10">
                      {report.user.invalidReportCount} Hatalı Bildirim
                    </span>
                  )}
                </div>
              </div>

              {/* Comment Content */}
              <div className="space-y-2 bg-card p-4 rounded-lg border border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-text">{report.comment.user.name || "Yazar Anonim"}</span>
                    <span className="text-secondary">({report.comment.user.email})</span>
                    {report.comment.user.isBanned && (
                      <span className="bg-rose-500 text-white font-extrabold px-2 py-0.5 rounded text-[10px]">
                        ENGELLENMİŞ HESAP
                      </span>
                    )}
                  </div>
                  <a 
                    href={`/ayet?id=${report.comment.ayahId}`} 
                    target="_blank"
                    className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Ayete Git <ExternalLink size={10} />
                  </a>
                </div>
                <p className="text-sm text-text whitespace-pre-wrap leading-relaxed font-medium">
                  &ldquo;{report.comment.text}&rdquo;
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* Author Management */}
                <div>
                  <button
                    onClick={() => handleToggleBanUser(report.comment.user.id, report.comment.user.isBanned)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer border ${
                      report.comment.user.isBanned
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20"
                    }`}
                  >
                    {report.comment.user.isBanned ? (
                      <>
                        <UserCheck size={14} /> Engeli Kaldır
                      </>
                    ) : (
                      <>
                        <UserMinus size={14} /> Yazarı Engelle
                      </>
                    )}
                  </button>
                </div>

                {/* Report Resolution */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDismissReport(report.id, false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition cursor-pointer"
                  >
                    Şikayeti Yoksay
                  </button>
                  <button
                    onClick={() => handleDismissReport(report.id, true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition cursor-pointer"
                    title="Reporter receives +1 invalid report penalty"
                  >
                    Asılsız Şikayet (Cezalandır)
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt("Silinme nedeni (kullanıcıya gösterilecek):", "Topluluk Kuralları İhlali");
                      if (reason !== null) {
                        handleRemoveComment(report.commentId, reason);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer"
                  >
                    <Trash2 size={14} /> Yorumu Kaldır
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
