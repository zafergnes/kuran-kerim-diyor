"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import apiClient from "@/services/apiClient";
import { 
  MessageSquare, 
  Search, 
  Trash2, 
  CheckCircle, 
  ExternalLink,
  AlertCircle,
  XCircle,
  HelpCircle
} from "lucide-react";

interface Comment {
  id: number;
  ayahId: string;
  userId: string;
  text: string;
  language: string;
  status: string;
  moderationReason: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    isBanned: boolean;
  };
}

function CommentsList() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || ""; // PENDING, APPROVED, REMOVED_BY_MODERATOR

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState(initialStatus);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Comment[]>("/admin/comments", {
        params: { search: searchTerm, status }
      });
      setComments(response.data);
    } catch (err) {
      setError("Yorumlar yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [status]); // Fetch when status filter tab changes

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComments();
  };

  const handleApprove = async (commentId: number) => {
    try {
      await apiClient.post(`/admin/comments/${commentId}/approve`);
      // Update local state directly
      setComments(prev =>
        prev.map(c => (c.id === commentId ? { ...c, status: "APPROVED", moderationReason: null } : c))
      );
    } catch (err) {
      alert("Yorum onaylanırken bir hata oluştu.");
    }
  };

  const handleRemove = async (commentId: number) => {
    const reason = prompt("Yorumun kaldırılma nedeni (kullanıcıya gösterilecek):", "Topluluk Kuralları İhlali");
    if (reason === null) return; // user cancelled prompt

    try {
      await apiClient.post(`/admin/comments/${commentId}/remove`, { reason });
      // Update local state directly
      setComments(prev =>
        prev.map(c => (c.id === commentId ? { ...c, status: "REMOVED_BY_MODERATOR", moderationReason: reason || "Topluluk Kuralları İhlali" } : c))
      );
    } catch (err) {
      alert("Yorum kaldırılırken bir hata oluştu.");
    }
  };

  const getStatusBadge = (statusVal: string) => {
    switch (statusVal) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15">
            <CheckCircle size={12} />
            Onaylandı
          </span>
        );
      case "REMOVED_BY_MODERATOR":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15">
            <XCircle size={12} />
            Kaldırıldı
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/15">
            <AlertCircle size={12} />
            İncelemede
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/15">
            <HelpCircle size={12} />
            Bilinmeyen
          </span>
        );
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-text flex items-center gap-2">
            <MessageSquare size={20} className="text-primary" />
            Yorum Yönetimi
          </h2>
          <p className="text-xs text-secondary mt-0.5">Sistemdeki tüm yorumların incelenmesi, silinmesi ve manuel onay işlemleri.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter Tabs */}
          <div className="flex rounded-md border border-border bg-background p-0.5 text-xs font-semibold">
            <button
              onClick={() => setStatus("")}
              className={`rounded px-3 py-1.5 transition cursor-pointer ${
                status === ""
                  ? "bg-primary text-white"
                  : "text-secondary hover:text-text"
              }`}
            >
              Hepsi
            </button>
            <button
              onClick={() => setStatus("APPROVED")}
              className={`rounded px-3 py-1.5 transition cursor-pointer ${
                status === "APPROVED"
                  ? "bg-primary text-white"
                  : "text-secondary hover:text-text"
              }`}
            >
              Onaylananlar
            </button>
            <button
              onClick={() => setStatus("PENDING")}
              className={`rounded px-3 py-1.5 transition cursor-pointer ${
                status === "PENDING"
                  ? "bg-primary text-white"
                  : "text-secondary hover:text-text"
              }`}
            >
              İncelemede
            </button>
            <button
              onClick={() => setStatus("REMOVED_BY_MODERATOR")}
              className={`rounded px-3 py-1.5 transition cursor-pointer ${
                status === "REMOVED_BY_MODERATOR"
                  ? "bg-primary text-white"
                  : "text-secondary hover:text-text"
              }`}
            >
              Kaldırılanlar
            </button>
          </div>

          {/* Search box */}
          <form onSubmit={handleSearchSubmit} className="relative flex max-w-xs items-center gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type="text"
                placeholder="Yorum içinde ara..."
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
            onClick={fetchComments}
            className="mt-2 text-sm font-bold underline cursor-pointer hover:text-red-900 dark:hover:text-red-300"
          >
            Yeniden Dene
          </button>
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-secondary bg-background/50 rounded-lg border border-dashed border-border p-6">
          <MessageSquare size={40} className="text-secondary mb-3 opacity-60" />
          <p className="font-medium text-center">Hiç yorum bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div 
              key={comment.id}
              className="border border-border bg-background rounded-xl p-5 shadow-sm space-y-4 hover:border-primary/30 transition"
            >
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 text-xs text-secondary">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text">{comment.user.name || "Anonim"}</span>
                  <span>({comment.user.email})</span>
                  {comment.user.isBanned && (
                    <span className="bg-red-500 text-white font-extrabold px-1.5 py-0.5 rounded text-[9px]">
                      BANLI
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(comment.status)}
                  <span className="font-medium">
                    {new Date(comment.createdAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </span>
                </div>
              </div>

              {/* Comment Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-secondary">Dil: {comment.language.toUpperCase()}</span>
                  <a 
                    href={`/ayet?id=${comment.ayahId}`} 
                    target="_blank"
                    className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Ayete Git <ExternalLink size={11} />
                  </a>
                </div>
                <div className="bg-card p-4 rounded-lg border border-border/50">
                  <p className="text-sm text-text whitespace-pre-wrap leading-relaxed">
                    {comment.status === "REMOVED_BY_MODERATOR" ? (
                      <span className="italic text-rose-500 font-semibold">
                        [Moderatör Tarafından Kaldırıldı] Neden: {comment.moderationReason || "Topluluk Kuralları İhlali"}
                      </span>
                    ) : (
                      comment.text
                    )}
                  </p>
                  {comment.status === "REMOVED_BY_MODERATOR" && (
                    <p className="text-xs text-secondary mt-2 border-t border-border/40 pt-2 font-medium">
                      Orijinal İçerik: &ldquo;{comment.text}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {(comment.status === "PENDING" || comment.status === "REMOVED_BY_MODERATOR") && (
                  <button
                    onClick={() => handleApprove(comment.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition cursor-pointer"
                  >
                    <CheckCircle size={14} /> 
                    {comment.status === "REMOVED_BY_MODERATOR" ? "Geri Yükle & Onayla" : "Onayla"}
                  </button>
                )}
                
                {comment.status !== "REMOVED_BY_MODERATOR" && (
                  <button
                    onClick={() => handleRemove(comment.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer"
                  >
                    <Trash2 size={14} /> Yorumu Kaldır
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentsManagement() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <CommentsList />
    </Suspense>
  );
}
