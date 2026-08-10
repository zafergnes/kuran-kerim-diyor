"use client";

import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";

type Feedback = { id: number; responseId: string; surahNumber: number; ayahNumber: number; reason: string; details?: string | null; createdAt: string; user?: { email: string; name?: string | null } | null };

export default function AiFeedbackPage() {
  const [items, setItems] = useState<Feedback[] | null>(null);
  useEffect(() => {
    let active = true;
    apiClient.get<Feedback[]>("/admin/ai-feedback").then((response) => { if (active) setItems(response.data); });
    return () => { active = false; };
  }, []);
  if (!items) return <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />;
  return <div><h2 className="text-xl font-bold text-text">AI Yanıt Denetimi</h2><p className="mt-1 text-sm text-secondary">Kullanıcıların hatalı veya sakıncalı bulduğu yanıt sinyalleri.</p><div className="mt-6 space-y-3">{!items.length && <p className="rounded-lg border border-border p-5 text-muted">Henüz bildirim yok.</p>}{items.map((item) => <article key={item.id} className="rounded-lg border border-border bg-background p-4"><div className="flex flex-wrap justify-between gap-2"><b className="text-text">{item.surahNumber}:{item.ayahNumber} · {item.reason}</b><time className="text-xs text-muted">{new Date(item.createdAt).toLocaleString("tr-TR")}</time></div><p className="mt-2 break-all text-xs text-muted">Yanıt kimliği: {item.responseId}</p>{item.details && <p className="mt-3 text-sm text-secondary">{item.details}</p>}<p className="mt-2 text-xs text-muted">{item.user?.email || "Anonim kullanıcı"}</p></article>)}</div></div>;
}
