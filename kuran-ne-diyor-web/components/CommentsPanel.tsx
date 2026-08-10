"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Flag, Heart, Reply, Send, Trash2, UserX } from "lucide-react";
import apiClient from "@/services/apiClient";
import { useComments } from "@/hooks/useComments";
import { useUserStore } from "@/store/userStore";
import { useTranslation } from "react-i18next";

export function CommentsPanel({ ayahId }: { ayahId: string }) {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const language = useUserStore((state) => state.language);
  const { comments, loading, error, addComment, deleteComment, toggleLike, refresh } = useComments(ayahId);
  const [text, setText] = useState("");
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [formError, setFormError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsPrompt, setShowTermsPrompt] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setTermsAccepted(window.localStorage.getItem("community_terms_accepted") === "true"));
  }, []);

  const maskName = (name: string): string => {
    if (!name) return 'A***';
    const parts = name.trim().split(' ');
    
    if (parts.length === 1) {
      const first = parts[0];
      if (first.length <= 1) return first + '***';
      return first[0] + '***';
    }

    const first = parts[0];
    const last = parts[parts.length - 1];

    return `${first[0]}*** ${last[0]}***`;
  };

  const availableLanguages = useMemo(
    () => [
      "all",
      ...Array.from(new Set(comments.map((comment) => comment.language).filter((language): language is string => Boolean(language)))),
    ],
    [comments],
  );
  const filteredComments = useMemo(
    () =>
      selectedLanguage === "all"
        ? comments
        : comments.filter((comment) => comment.language === selectedLanguage || comment.userId === user?.id),
    [comments, selectedLanguage, user?.id],
  );
  const topLevelComments = useMemo(() => filteredComments.filter((comment) => !comment.replyToId), [filteredComments]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    if (!termsAccepted) {
      setShowTermsPrompt(true);
      return;
    }
    setFormError(null);

    try {
      await addComment(text.trim(), replyToId);
      setText("");
      setReplyToId(null);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : t("comments.postError", "Yorum gonderilemedi."));
    }
  };

  const reportComment = async (commentId: number, reason: "ABUSE_OR_HATE" | "RELIGIOUS_MISINFORMATION") => {
    setFormError(null);
    try {
      await apiClient.post("/reports", { commentId, reason });
      alert(t("community.report_received"));
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : t("community.action_error"));
    }
  };

  const blockUser = async (blockedUserId: string) => {
    if (!window.confirm(t("community.block_message"))) return;
    setFormError(null);
    try {
      await apiClient.post(`/users/blocks/${blockedUserId}`);
      await refresh();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : t("community.action_error"));
    }
  };

  const handleLikeClick = (commentId: number) => {
    if (!user || user.isGuest) {
      alert(t("comments.login_to_like", "Yorumları beğenmek için giriş yapmalısınız."));
      return;
    }
    void toggleLike(commentId);
  };

  const renderComment = (commentId: number, depth = 0) => {
    const comment = filteredComments.find((item) => item.id === commentId);
    if (!comment) return null;

    const replies = filteredComments.filter((item) => item.replyToId === comment.id);
    const isMine = user?.id === comment.userId;

    return (
      <div key={comment.id} className={depth ? "ml-5 border-l border-border pl-4" : ""}>
        <div className="rounded-md border border-border bg-background p-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">{maskName(comment.user?.name || t("comments.anonymous", "Anonim"))}</p>
              <p className="text-xs font-semibold text-muted">
                {new Date(comment.createdAt).toLocaleDateString("tr-TR")}
                {comment.language ? ` · ${comment.language.toUpperCase()}` : ""}
                {comment.status && comment.status !== "APPROVED" ? ` · ${comment.status}` : ""}
              </p>
            </div>
            {isMine && (
              <button onClick={() => void deleteComment(comment.id)} className="text-muted hover:text-primary" title={t("comments.delete", "Sil")}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <p className="text-sm leading-6 text-secondary">{comment.text}</p>
          {comment.moderationReason && <p className="mt-2 text-xs font-semibold text-primary">{comment.moderationReason}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleLikeClick(comment.id)}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary disabled:opacity-75"
            >
              <Heart size={15} fill={comment.isLikedByMe ? "currentColor" : "none"} />
              {comment.likeCount ?? 0}
            </button>
            <button onClick={() => setReplyToId(comment.id)} className="inline-flex items-center gap-1 text-xs font-bold text-primary">
              <Reply size={15} />
              {t("comments.reply", "Yanitla")}
            </button>
            {user && !user.isGuest && !isMine && (
              <>
                <button onClick={() => void reportComment(comment.id, "ABUSE_OR_HATE")} className="inline-flex items-center gap-1 text-xs font-bold text-muted"><Flag size={15}/>{t("community.report_abuse")}</button>
                <button onClick={() => void reportComment(comment.id, "RELIGIOUS_MISINFORMATION")} className="inline-flex items-center gap-1 text-xs font-bold text-muted"><Flag size={15}/>{t("community.report_misinformation")}</button>
                <button onClick={() => void blockUser(comment.userId)} className="inline-flex items-center gap-1 text-xs font-bold text-muted"><UserX size={15}/>{t("community.block_user")}</button>
              </>
            )}
          </div>
        </div>
        {replies.length > 0 && <div className="mt-3 grid gap-3">{replies.map((reply) => renderComment(reply.id, depth + 1))}</div>}
      </div>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {availableLanguages.map((language) => (
            <button
              key={language}
              onClick={() => setSelectedLanguage(language)}
              className={`h-9 rounded-full border px-4 text-xs font-bold ${
                selectedLanguage === language
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-card text-muted hover:bg-background"
              }`}
            >
              {language === "all" ? t("comments.all", "Tumu") : language.toUpperCase()}
            </button>
          ))}
        </div>
        {loading ? <p className="text-sm font-semibold text-muted">{t("comments.loading", "Yorumlar yukleniyor...")}</p> : null}
        {error ? <p className="text-sm font-semibold text-primary">{error}</p> : null}
        {!loading && topLevelComments.length === 0 ? (
          <p className="rounded-md border border-border bg-background p-5 text-center text-sm font-semibold text-muted">
            {t("comments.beFirstToComment", "Bu ayet icin ilk yorumu sen yaz.")}
          </p>
        ) : (
          <div className="grid gap-4">{topLevelComments.map((comment) => renderComment(comment.id))}</div>
        )}
      </div>

      <form onSubmit={submit} className="border-t border-border p-5">
        {showTermsPrompt && <div className="mb-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-secondary"><p className="font-bold text-text">{t("community.terms_title")}</p><p className="mt-1 text-xs leading-5">{t("community.terms_message")}</p><div className="mt-2 flex items-center gap-3"><Link href={`/terms?lang=${language}`} target="_blank" className="text-xs font-bold text-primary underline">{t("community.read_terms")}</Link><button type="button" onClick={() => { window.localStorage.setItem("community_terms_accepted", "true"); setTermsAccepted(true); setShowTermsPrompt(false); }} className="rounded bg-primary px-3 py-1.5 text-xs font-bold text-white">{t("community.accept_terms")}</button></div></div>}
        {replyToId && (
          <div className="mb-3 flex items-center justify-between rounded-md bg-background px-3 py-2 text-xs font-bold text-muted">
            <span>{t("comments.replying", "Yanit yaziliyor")}</span>
            <button type="button" onClick={() => setReplyToId(null)} className="text-primary">
              {t("comments.cancel", "Vazgec")}
            </button>
          </div>
        )}
        {!user || user.isGuest ? (
          <p className="rounded-md border border-border bg-background p-4 text-sm font-semibold text-muted">
            {t("comments.loginToComment", "Yorum yazmak ve begenmek icin hesapla giris yapmalisiniz.")}
          </p>
        ) : (
          <div className="flex gap-2">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-h-20 flex-1 resize-none rounded-md border border-border bg-background p-3 text-sm text-text placeholder:text-muted"
              maxLength={1000}
              placeholder={t("comments.writeComment", "Yorum yaz...")}
            />
            <button className="grid h-12 w-12 place-items-center rounded-md bg-primary text-white" title={t("comments.send", "Gonder")}>
              <Send size={18} />
            </button>
          </div>
        )}
        {formError && <p className="mt-2 text-xs font-bold text-primary">{formError}</p>}
      </form>
    </div>
  );
}
