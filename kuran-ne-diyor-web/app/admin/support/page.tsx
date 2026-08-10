"use client";

import { useCallback, useEffect, useState } from "react";
import apiClient from "@/services/apiClient";

type Ticket = { id: string; email?: string | null; category: string; message: string; locale: string; status: string; adminNote?: string | null; createdAt: string; updatedAt: string };
const statuses = ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"];

export default function SupportAdminPage() {
  const [items, setItems] = useState<Ticket[] | null>(null);
  const [filter, setFilter] = useState("ALL");
  const load = useCallback(async () => setItems((await apiClient.get<Ticket[]>(`/admin/support-requests${filter === "ALL" ? "" : `?status=${filter}`}`)).data), [filter]);
  useEffect(() => {
    let active = true;
    const query = filter === "ALL" ? "" : `?status=${filter}`;
    apiClient.get<Ticket[]>(`/admin/support-requests${query}`).then((response) => { if (active) setItems(response.data); });
    return () => { active = false; };
  }, [filter]);
  const update = async (item: Ticket, status: string, adminNote: string) => { await apiClient.patch(`/admin/support-requests/${item.id}`, { status, adminNote }); await load(); };
  return <div><h2 className="text-xl font-bold text-text">Destek Talepleri</h2><p className="mt-1 text-sm text-secondary">E-posta zorunlu olmadan iletilen teknik, içerik, gizlilik ve hesap silme talepleri.</p><div className="mt-5 flex flex-wrap gap-2">{["ALL", ...statuses].map((value) => <button key={value} onClick={() => setFilter(value)} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${filter === value ? "border-primary bg-primary text-white" : "border-border text-muted"}`}>{value}</button>)}</div>
    <div className="mt-6 space-y-4">{!items && <p>Yükleniyor…</p>}{items?.length === 0 && <p className="rounded-lg border border-border p-5 text-muted">Talep bulunamadı.</p>}{items?.map((item) => <TicketCard key={item.id} item={item} update={update}/>)}</div></div>;
}

function TicketCard({ item, update }: { item: Ticket; update: (item: Ticket, status: string, note: string) => Promise<void> }) {
  const [status, setStatus] = useState(item.status); const [note, setNote] = useState(item.adminNote || ""); const [busy, setBusy] = useState(false);
  return <article className="rounded-lg border border-border bg-background p-4"><div className="flex flex-wrap justify-between gap-2"><b className="text-text">{item.category} · {item.locale.toUpperCase()}</b><time className="text-xs text-muted">{new Date(item.createdAt).toLocaleString("tr-TR")}</time></div><p className="mt-1 break-all text-xs text-muted">{item.id}{item.email ? ` · ${item.email}` : " · E-posta verilmedi"}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-secondary">{item.message}</p><div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto]"><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm text-text">{statuses.map((value) => <option key={value}>{value}</option>)}</select><input value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} placeholder="Kullanıcının bilet durumunda göreceği not" className="rounded-md border border-border bg-card px-3 py-2 text-sm text-text"/><button disabled={busy} onClick={async () => { setBusy(true); try { await update(item, status, note); } finally { setBusy(false); } }} className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Kaydet</button></div></article>;
}
