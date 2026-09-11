"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  ShieldAlert,
  HelpCircle,
  Lightbulb,
} from "lucide-react";

interface InvokedName {
  arabic: string;
  transliteration: string;
  meaning: string;
}

interface GeneratedDua {
  inScope: boolean;
  title: string;
  introHamdSalavat: string;
  invokedNames: InvokedName[];
  quranOrHadithReference?: {
    arabic?: string;
    translation?: string;
    source?: string;
  };
  duaBody: string;
  conclusion: string;
  adabAdvice: string;
  refusalReason?: string;
}

function DuaGeneratorContent() {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();

  const [intention, setIntention] = useState("");
  const [preferredName, setPreferredName] = useState(() => {
    const nameParam = searchParams.get("name");
    return nameParam ? decodeURIComponent(nameParam) : "";
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedDua | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const lang = useMemo(() => {
    const raw = (i18n.language || "tr").toLowerCase().slice(0, 2);
    return ["tr", "en", "ar", "de", "fr", "es"].includes(raw) ? raw : "tr";
  }, [i18n.language]);

  const quickThemes = [
    {
      label: t("dua.theme_health", "Şifa ve Sağlık"),
      text: t(
        "dua.theme_health_text",
        "Rabbimden bedenime ve ruhuma şifa, hastalıklarıma afiyet diliyorum."
      ),
      name: "Eş-Şâfî",
    },
    {
      label: t("dua.theme_exam", "Zihin Açıklığı ve Sınav"),
      text: t(
        "dua.theme_exam_text",
        "Gireceğim sınavda zihin açıklığı, heyecanımı yenmek ve muvaffakiyet diliyorum."
      ),
      name: "El-Alîm",
    },
    {
      label: t("dua.theme_sustenance", "Helal Rızık ve Bereket"),
      text: t(
        "dua.theme_sustenance_text",
        "İşimde bereket, helalinden bol kazanç ve borçlarımdan kurtulmak istiyorum."
      ),
      name: "Er-Rezzâk",
    },
    {
      label: t("dua.theme_repentance", "Tövbe ve Kalp Huzuru"),
      text: t(
        "dua.theme_repentance_text",
        "Geçmiş günahlarımdan pişmanım; kalbime inşirah, tevbemin kabulünü ve hidayet diliyorum."
      ),
      name: "Et-Tevvâb",
    },
    {
      label: t("dua.theme_family", "Aile ve Evlat"),
      text: t(
        "dua.theme_family_text",
        "Ailemde muhabbet, huzur ve hayırlı bir nesil nasip olmasını niyaz ediyorum."
      ),
      name: "El-Vedûd",
    },
    {
      label: t("dua.theme_anxiety", "Keder ve Kaygı"),
      text: t(
        "dua.theme_anxiety_text",
        "İçimdeki daralma, keder ve gelecek endişesinden kurtulup Allah'a tevekkül etmek istiyorum."
      ),
      name: "El-Fettâh",
    },
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!intention.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.kurannediyor.com.tr/api";
      const res = await axios.post(`${apiUrl}/dua-generator`, {
        intention: intention.trim(),
        language: lang,
        preferredName: preferredName.trim() || undefined,
      }, { timeout: 60000 });
      setResult(res.data);
    } catch (err: unknown) {
      const isAxios = axios.isAxiosError(err);
      const status = isAxios ? err.response?.status : undefined;
      if (status === 503) {
        setError(
          t(
            "dua.error_not_configured",
            "Yapay zeka dua servisi şu anda aktif değil. Lütfen daha sonra tekrar deneyiniz."
          )
        );
      } else if (status === 429) {
        setError(
          t(
            "dua.error_rate_limited",
            "Çok fazla istek gönderdiniz. Lütfen birkaç dakika sonra tekrar deneyiniz."
          )
        );
      } else if (isAxios && (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT")) {
        setError(
          t(
            "dua.error_timeout",
            "Dua hazırlanması beklenenden uzun sürdü. Lütfen tekrar deneyiniz."
          )
        );
      } else {
        setError(
          t(
            "dua.error_general",
            "Dua oluşturulurken bir sorun oluştu. Lütfen niyetinizi kontrol edip tekrar deneyiniz."
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const namesStr = result.invokedNames
      .map((n) => `${n.arabic} (${n.transliteration} - ${n.meaning})`)
      .join(", ");

    const text = `${result.title}\n\n${result.introHamdSalavat}\n\n${
      namesStr ? `[Esma-ül Hüsna: ${namesStr}]\n\n` : ""
    }${
      result.quranOrHadithReference?.arabic
        ? `${result.quranOrHadithReference.arabic}\n${result.quranOrHadithReference.translation} (${result.quranOrHadithReference.source})\n\n`
        : ""
    }${result.duaBody}\n\n${result.conclusion}\n\n[Âdâb-ı Duâ: ${result.adabAdvice}]\n\nKur'an Ne Diyor?`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner / Verse Quote */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 text-center sm:text-left">
        <p className="font-arabic text-xl sm:text-2xl text-primary font-bold dir-rtl mb-2">
          وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ
        </p>
        <p className="text-sm font-medium text-text italic">
          {t(
            "dua.verse_quote",
            "“Rabbiniz buyurdu ki: Bana dua edin, size icabet edeyim (duanızı kabul edeyim).” (Mü’min, 40/60)"
          )}
        </p>
      </div>

      {/* Main Input Form */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
        <div className="mb-4">
          <label className="block text-sm font-bold text-text mb-1">
            {t("dua.input_label", "Allah'tan Ne Dilemek İstiyorsunuz?")}
          </label>
          <p className="text-xs text-muted mb-3">
            {t(
              "dua.input_desc",
              "İçinizden geçen samimi arzunuzu, derdinizi veya ihtiyacınızı kendi cümlelerinizle yazın. Sistem duanızı hamd, salavat, Esma-ül Hüsna ve me'sur dualarla zenginleştirerek sünnet âdâbına uygun şekilde formüle edecektir."
            )}
          </p>

          <textarea
            rows={4}
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder={t(
              "dua.input_placeholder",
              "Örneğin: Çok önemli bir iş mülakatına gireceğim, üzerimdeki heyecanı gidermesini ve hakkımda en hayırlısını nasip etmesini diliyorum..."
            )}
            className="w-full rounded-xl border border-border bg-background p-3.5 text-sm text-text outline-none transition focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed"
          />
        </div>

        {/* Optional Preferred Name */}
        <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-xs font-semibold text-secondary flex items-center gap-1">
            <Lightbulb size={14} className="text-primary" />
            {t("dua.preferred_name_label", "Özellikle anılmasını istediğiniz isim (opsiyonel):")}
          </span>
          <input
            type="text"
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            placeholder="Örn: Er-Rezzâk, El-Fettâh, Eş-Şâfî"
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-text outline-none focus:border-primary"
          />
        </div>

        {/* Quick Themes */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted mb-2">
            {t("dua.quick_themes", "Hızlı Niyet Örnekleri:")}
          </p>
          <div className="flex flex-wrap gap-2">
            {quickThemes.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setIntention(item.text);
                  setPreferredName(item.name);
                }}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-secondary transition hover:border-primary/50 hover:bg-primary/5 hover:text-text"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={() => handleSubmit()}
          disabled={!intention.trim() || loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {t("dua.generating_status", "Duanız İslami Âdâba Uygun Hazırlanıyor...")}
            </>
          ) : (
            <>
              <Sparkles size={18} />
              {t("dua.generate_button", "Dua Oluştur")}
            </>
          )}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">
          <ShieldAlert size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{t("common.error", "Hata")}</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="space-y-4">
          {!result.inScope ? (
            /* Refusal / Guidance Card */
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
              <div className="flex items-center gap-2 text-amber-700 font-bold mb-2">
                <HelpCircle size={20} />
                <h3>{result.title}</h3>
              </div>
              <p className="text-sm text-secondary leading-relaxed">
                {result.refusalReason}
              </p>
            </div>
          ) : (
            /* Structured Prayer Card */
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-md relative">
              {/* Header Title */}
              <div className="border-b border-border pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary mb-2">
                    <Sparkles size={13} />
                    {t("dua.card_badge", "Âdâb-ı Duâ ile Düzenlendi")}
                  </div>
                  <h2 className="text-2xl font-bold text-text">{result.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-text transition hover:bg-muted/15"
                  >
                    {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                    {copied ? t("common.copied", "Kopyalandı") : t("common.copy", "Kopyala")}
                  </button>
                  <button
                    onClick={() => {
                      setResult(null);
                      setIntention("");
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-muted transition hover:bg-muted/15 hover:text-text"
                  >
                    <RotateCcw size={15} />
                    {t("dua.reset", "Yeni Dua")}
                  </button>
                </div>
              </div>

              {/* 1. Hamd & Salavat Section */}
              <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                  {t("dua.hamd_heading", "Hamd ve Salavat ile Başlangıç")}
                </p>
                <p className="text-sm text-text leading-relaxed font-medium">
                  {result.introHamdSalavat}
                </p>
              </div>

              {/* 2. Invoked Divine Names */}
              {result.invokedNames && result.invokedNames.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2.5">
                    {t("dua.invoked_names_heading", "Tevessül Edilen Esma-ül Hüsna:")}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {result.invokedNames.map((n, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-border bg-background p-3 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-bold text-text">{n.transliteration}</p>
                          <p className="text-xs text-secondary line-clamp-1">{n.meaning}</p>
                        </div>
                        <p className="font-arabic text-xl font-bold text-primary shrink-0">
                          {n.arabic}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Quran / Hadith Verse Reference */}
              {result.quranOrHadithReference?.arabic && (
                <div className="mb-6 rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <BookOpen size={14} />
                      {t("dua.sacred_reference", "Me'sur Dua / Âyet:")}
                    </span>
                    <span className="text-xs text-muted font-semibold">
                      {result.quranOrHadithReference.source}
                    </span>
                  </div>
                  <p className="font-arabic text-lg text-primary font-bold dir-rtl mb-2 text-right">
                    {result.quranOrHadithReference.arabic}
                  </p>
                  <p className="text-xs text-secondary italic">
                    {result.quranOrHadithReference.translation}
                  </p>
                </div>
              )}

              {/* 4. Core Dua Body */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                  {t("dua.body_heading", "Gönülden Yakarış (Münacat):")}
                </p>
                <div className="rounded-xl border border-border bg-background/50 p-5">
                  <p className="text-base text-text leading-relaxed whitespace-pre-line font-serif sm:text-lg">
                    {result.duaBody}
                  </p>
                </div>
              </div>

              {/* 5. Conclusion */}
              <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="text-sm font-semibold text-text">{result.conclusion}</p>
              </div>

              {/* 6. Adab & Sunnah Advice */}
              {result.adabAdvice && (
                <div className="rounded-xl border border-border bg-background p-4 flex items-start gap-3 text-xs text-secondary">
                  <Lightbulb size={18} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-text">
                      {t("dua.adab_tip", "Sünnet Tavsiyesi")}:{" "}
                    </span>
                    {result.adabAdvice}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DuaGeneratorClient() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Yükleniyor...</div>}>
      <DuaGeneratorContent />
    </Suspense>
  );
}
