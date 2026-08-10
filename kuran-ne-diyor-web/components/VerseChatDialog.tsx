"use client";

import { useMemo, useRef, useState } from "react";
import { Flag, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import type { AppLanguage } from "@/types/quran";
import { VerseChatService, type VerseChatMessage, type VerseChatResponse } from "@/services/verseChatService";

type Props = {
  open: boolean;
  onClose: () => void;
  surahNumber: number;
  ayahNumber: number;
  reference: string;
  translation: string;
  language: AppLanguage;
};

export function VerseChatDialog({ open, onClose, surahNumber, ayahNumber, reference, translation, language }: Props) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<VerseChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastResponse, setLastResponse] = useState<VerseChatResponse | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const suggestions = useMemo(() => [t("verse_chat.suggestion_meaning"), t("verse_chat.suggestion_context")], [t]);

  if (!open) return null;

  const send = async (preset?: string) => {
    const question = (preset ?? input).trim();
    if (!question || loading) return;
    const next: VerseChatMessage[] = [...messages, { role: "user", text: question }];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);
    try {
      const response = await VerseChatService.discuss({
        surahNumber,
        ayahNumber,
        language,
        message: question,
        history: messages.slice(-8).map((message) => ({ ...message, text: message.text.slice(0, 1500) })),
      });
      setLastResponse(response);
      const text = [response.answer, response.keyPoints.map((point) => `• ${point}`).join("\n"), response.reflectionQuestion, response.safetyNote].filter(Boolean).join("\n\n");
      setMessages([...next, { role: "assistant", text }]);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));
    } catch (cause: unknown) {
      setError(axios.isAxiosError(cause) && cause.response?.status === 429 ? t("verse_chat.rate_limited") : t("verse_chat.error_message"));
    } finally {
      setLoading(false);
    }
  };

  const report = async (reason: "INACCURATE" | "UNSAFE") => {
    if (!lastResponse) return;
    await VerseChatService.report({ responseId: lastResponse.id, surahNumber, ayahNumber, reason, details: lastResponse.answer.slice(0, 500) });
    setReportOpen(false);
  };

  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={t("verse_chat.title")}>
    <div className="flex h-[86dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:h-[min(720px,88dvh)] sm:rounded-2xl">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Sparkles size={16}/></span><div className="min-w-0"><h2 className="truncate text-sm font-bold text-text">{t("verse_chat.title")}</h2><p className="truncate text-[11px] text-muted">{reference}</p></div></div>
        <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-background" aria-label={t("common.close")}><X size={18}/></button>
      </header>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        <p className="line-clamp-3 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-center text-xs leading-5 text-secondary">{translation}</p>
        <div className="flex items-start gap-2 text-[11px] leading-4 text-muted"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-primary"/><span>{t("verse_chat.disclaimer")}</span></div>
        {!messages.length && <div className="flex flex-wrap gap-2">{suggestions.map((item) => <button key={item} onClick={() => void send(item)} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5">{item}</button>)}</div>}
        {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`w-fit max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${message.role === "user" ? "ml-auto rounded-br-sm bg-primary text-white" : "rounded-bl-sm border border-border bg-background text-text"}`}>{message.text}</div>)}
        {loading && <div className="w-fit rounded-2xl border border-border bg-background px-4 py-3 text-xs text-muted"><span className="animate-pulse">•••</span></div>}
        {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">{error}</p>}
        {lastResponse && !loading && <div className="relative"><button onClick={() => setReportOpen((value) => !value)} className="flex items-center gap-1 text-[11px] text-muted hover:text-text"><Flag size={12}/>{t("verse_chat.report")}</button>{reportOpen && <div className="mt-2 flex gap-2"><button onClick={() => void report("INACCURATE")} className="rounded border border-border px-2 py-1 text-[11px]">{t("verse_chat.report_inaccurate")}</button><button onClick={() => void report("UNSAFE")} className="rounded border border-border px-2 py-1 text-[11px]">{t("verse_chat.report_unsafe")}</button></div>}</div>}
      </div>
      <form className="flex items-end gap-2 border-t border-border p-3" onSubmit={(event) => { event.preventDefault(); void send(); }}>
        <textarea value={input} onChange={(event) => setInput(event.target.value)} maxLength={600} rows={1} placeholder={t("verse_chat.placeholder")} className="max-h-24 min-h-10 flex-1 resize-none rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"/>
        <button type="submit" disabled={!input.trim() || loading} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white disabled:opacity-40" aria-label={t("verse_chat.send")}><Send size={17}/></button>
      </form>
    </div>
  </div>;
}
