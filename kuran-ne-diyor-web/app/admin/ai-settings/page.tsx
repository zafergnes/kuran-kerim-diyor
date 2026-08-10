"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, Trash2 } from "lucide-react";
import apiClient from "@/services/apiClient";

type Status = { configured: boolean; source: "ADMIN_PANEL" | "ENVIRONMENT" | "NONE"; lastFour: string | null; updatedAt: string | null };

export default function AiSettingsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const load = useCallback(async () => setStatus((await apiClient.get<Status>("/admin/settings/ai")).data), []);
  useEffect(() => {
    let active = true;
    apiClient.get<Status>("/admin/settings/ai").then((response) => { if (active) setStatus(response.data); });
    return () => { active = false; };
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(null);
    try { setStatus((await apiClient.put<Status>("/admin/settings/ai", { apiKey })).data); setApiKey(""); setMessage("Anahtar doğrulandı, şifrelenerek kaydedildi ve kullanıma alındı."); }
    catch { setMessage("Anahtar doğrulanamadı. Gemini API anahtarını ve erişim yetkisini kontrol edin."); }
    finally { setBusy(false); }
  };
  const test = async () => { setBusy(true); setMessage(null); try { await apiClient.post("/admin/settings/ai/test"); setMessage("Gemini bağlantı testi başarılı."); } catch { setMessage("Gemini bağlantı testi başarısız."); } finally { setBusy(false); } };
  const remove = async () => { if (!confirm("Panelde saklanan Gemini anahtarı kaldırılsın mı?")) return; setBusy(true); try { await apiClient.delete("/admin/settings/ai"); await load(); setMessage("Panel anahtarı kaldırıldı."); } finally { setBusy(false); } };

  return <div><h2 className="flex items-center gap-2 text-xl font-bold text-text"><KeyRound size={22} />AI Ayarları</h2><p className="mt-1 text-sm text-secondary">Ayet sohbeti ve yorum moderasyonunda kullanılacak Gemini anahtarını yönetin.</p>
    <div className="mt-6 rounded-lg border border-border bg-background p-4">{!status ? <Loader2 className="animate-spin" /> : <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-text">{status.configured ? "Gemini yapılandırıldı" : "Gemini anahtarı bekleniyor"}</p><p className="mt-1 text-xs text-muted">Kaynak: {status.source}{status.lastFour ? ` · Son dört: ••••${status.lastFour}` : ""}</p>{status.updatedAt && <p className="mt-1 text-xs text-muted">Güncelleme: {new Date(status.updatedAt).toLocaleString("tr-TR")}</p>}</div>{status.configured && <CheckCircle2 className="text-green-600" />}</div>}</div>
    <form onSubmit={save} className="mt-5 space-y-3"><label className="block text-sm font-bold text-text">Yeni Gemini API anahtarı</label><input type="password" autoComplete="new-password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} minLength={20} maxLength={200} required className="w-full rounded-md border border-border bg-background px-3 py-3 text-sm text-text" placeholder="Anahtar yalnızca kaydetme sırasında gönderilir"/><p className="text-xs text-muted">Anahtar kaydedilmeden önce Google Gemini ile test edilir ve sunucuda AES-256-GCM ile şifrelenir. Bir daha tam hali gösterilmez.</p><button disabled={busy} className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{busy ? "Doğrulanıyor…" : "Doğrula ve kaydet"}</button></form>
    <div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={busy || !status?.configured} onClick={() => void test()} className="rounded-md border border-border px-4 py-2 text-sm font-bold text-text disabled:opacity-50">Bağlantıyı test et</button><button type="button" disabled={busy || status?.source !== "ADMIN_PANEL"} onClick={() => void remove()} className="inline-flex items-center gap-2 rounded-md border border-red-500/30 px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-50"><Trash2 size={16}/>Panel anahtarını kaldır</button></div>
    {message && <p className="mt-4 rounded-md border border-border bg-background p-3 text-sm font-semibold text-secondary">{message}</p>}
  </div>;
}
