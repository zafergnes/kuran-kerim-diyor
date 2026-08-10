"use client";

import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";

type Analytics = {
  rangeDays: number;
  users: { total: number; registered: number; guests: number; newRegistrations: number };
  activity: { dailyActiveInstalls: number; activeInstalls: number; sessions: number; appOpens: number };
  engagement: { averageQuranProgressPercent: number; averageCompletedSurahs: number; aiChatUsers: number; aiMessages: number };
  funnel: { event: string; uniqueInstalls: number }[];
  exitStages: { stage: string; count: number }[];
};

const labels: Record<string, string> = {
  APP_OPEN: "Uygulamayı açtı", ONBOARDING_VIEW: "Tanıtımı gördü", ONBOARDING_COMPLETE: "Tanıtımı tamamladı",
  AUTH_REGISTER: "Kayıt oldu", AUTH_LOGIN: "Giriş yaptı", READING_PROGRESS: "Okumaya başladı", AI_CHAT_OPEN: "AI sohbetini açtı",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiClient.get<Analytics>("/admin/analytics", { params: { days } })
      .then((response) => { if (active) setData(response.data); })
      .catch(() => { if (active) setError("Analitik verileri yüklenemedi."); });
    return () => { active = false; };
  }, [days]);

  if (error) return <p className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">{error}</p>;
  if (!data) return <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />;

  const cards = [
    ["Bugün aktif", data.activity.dailyActiveInstalls], ["Aktif kurulum", data.activity.activeInstalls],
    ["Oturum", data.activity.sessions], ["Uygulama açılışı", data.activity.appOpens],
    ["Kayıtlı kullanıcı", data.users.registered], ["Misafir kullanıcı", data.users.guests],
    ["Yeni kayıt", data.users.newRegistrations], ["AI kullanan", data.engagement.aiChatUsers],
  ];

  return <div className="space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-bold text-text">Ürün Analitiği</h2><p className="text-sm text-secondary">Kişisel içerik toplamayan birinci taraf kullanım verileri.</p></div>
      <div className="flex rounded-lg border border-border p-1">{[7, 30, 90].map((value) => <button key={value} onClick={() => setDays(value)} className={`rounded-md px-3 py-1.5 text-sm ${days === value ? "bg-primary text-white" : "text-secondary"}`}>{value} gün</button>)}</div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <div key={String(label)} className="rounded-lg border border-border bg-background p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p><p className="mt-2 text-3xl font-bold text-text">{value}</p></div>)}</div>
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-border p-5"><h3 className="font-bold text-text">Okuma ve AI</h3><div className="mt-4 grid grid-cols-2 gap-3"><Metric label="Ortalama Kur’an ilerlemesi" value={`%${data.engagement.averageQuranProgressPercent}`} /><Metric label="Tamamlanan sure ortalaması" value={data.engagement.averageCompletedSurahs} /><Metric label="AI sohbet kullanıcısı" value={data.engagement.aiChatUsers} /><Metric label="AI mesajı" value={data.engagement.aiMessages} /></div></section>
      <section className="rounded-lg border border-border p-5"><h3 className="font-bold text-text">İlk kullanım hunisi</h3><div className="mt-4 space-y-3">{data.funnel.map((item, index) => { const base = data.funnel[0]?.uniqueInstalls || 1; const percent = Math.min(100, (item.uniqueInstalls / base) * 100); return <div key={item.event}><div className="mb-1 flex justify-between text-sm"><span>{labels[item.event] || item.event}</span><b>{item.uniqueInstalls}</b></div><div className="h-2 overflow-hidden rounded bg-border"><div className="h-full rounded bg-primary" style={{ width: `${percent}%` }} /></div>{index > 0 && <p className="mt-1 text-[11px] text-muted">Açılışa göre %{percent.toFixed(1)}</p>}</div>; })}</div></section>
    </div>
    <section className="rounded-lg border border-border p-5"><h3 className="font-bold text-text">Oturumların son görüldüğü aşamalar</h3><p className="mt-1 text-xs text-muted">Bu tablo kesin “uygulamadan çıktı” sinyali değil; oturumun kaydedilen son ekranını gösterir.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{data.exitStages.map((item) => <div key={item.stage} className="flex justify-between rounded-md bg-background px-3 py-2 text-sm"><span>{item.stage}</span><b>{item.count}</b></div>)}</div></section>
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-md bg-background p-3"><p className="text-xs text-muted">{label}</p><p className="mt-1 text-xl font-bold text-text">{value}</p></div>;
}
