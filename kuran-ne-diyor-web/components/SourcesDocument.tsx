"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Language = "tr" | "en" | "ar" | "de" | "fr" | "es";

type Copy = { home: string; title: string; intro: string; translations: string; distribution: string; arabic: string; arabicBody: string; audio: string; audioBody: string; license: string; licenseBody: string };

const text: Record<Language, Copy> = {
  tr: { home: "Ana sayfa", title: "Kaynaklar ve Atıflar", intro: "Kur’an metnini ve emeği geçenleri saygıyla belirtiriz.", translations: "Meal kaynakları", distribution: "Veri dağıtım kaynağı", arabic: "Arapça metin", arabicBody: "Uthmani Kur’an metni AlQuran Cloud / Islamic Network kaynağından alınmıştır; metin derlemesinin kaynakları arasında Tanzil.net ve Quran Academy bulunur. Diyanet imlası seçeneği ayrı olarak gösterilir.", audio: "Ses kayıtları", audioBody: "Islamic Network CDN: Mishary Rashid Alafasy, Abdul Rahman Al-Sudais, Maher Al-Muaiqly ve Abdul Basit Abdus Samad. Telif hakları okuyuculara veya mirasçılarına aittir.", license: "Lisans ve kullanım", licenseBody: "Uygulama şu anda tilavetleri ücretsiz, kişisel ve eğitim amaçlı kullanım için internetten yayınlar. Kaynak şartları değişebilir ve her ticari sürümden önce yeniden incelenir." },
  en: { home: "Home", title: "Sources and Attributions", intro: "We respectfully identify the Quran sources and contributors.", translations: "Translation sources", distribution: "Data distribution", arabic: "Arabic text", arabicBody: "The Uthmani Quran text comes from AlQuran Cloud / Islamic Network; source curation includes Tanzil.net and Quran Academy. The Diyanet orthography option is presented separately.", audio: "Recitations", audioBody: "Islamic Network CDN: Mishary Rashid Alafasy, Abdul Rahman Al-Sudais, Maher Al-Muaiqly and Abdul Basit Abdus Samad. Copyright remains with the reciters or their estates.", license: "License and use", licenseBody: "The app currently streams recitations for free personal and educational use. Source terms can change and are reviewed before each commercial release." },
  de: { home: "Startseite", title: "Quellen und Namensnennungen", intro: "Wir nennen die Quellen und Mitwirkenden des Korantextes mit Respekt.", translations: "Übersetzungen", distribution: "Datenbereitstellung", arabic: "Arabischer Text", arabicBody: "Der Uthmani-Korantext stammt von AlQuran Cloud / Islamic Network; zu den kuratierten Quellen gehören Tanzil.net und Quran Academy. Die Diyanet-Schreibweise wird getrennt angeboten.", audio: "Rezitationen", audioBody: "Islamic Network CDN: Mishary Rashid Alafasy, Abdul Rahman Al-Sudais, Maher Al-Muaiqly und Abdul Basit Abdus Samad. Die Urheberrechte verbleiben bei den Rezitatoren oder ihren Nachlässen.", license: "Lizenz und Nutzung", licenseBody: "Die App streamt Rezitationen derzeit kostenlos für persönliche und Bildungszwecke. Quellenbedingungen können sich ändern und werden vor jeder kommerziellen Veröffentlichung erneut geprüft." },
  fr: { home: "Accueil", title: "Sources et attributions", intro: "Nous indiquons avec respect les sources du Coran et leurs contributeurs.", translations: "Sources des traductions", distribution: "Distribution des données", arabic: "Texte arabe", arabicBody: "Le texte coranique uthmani provient d’AlQuran Cloud / Islamic Network ; sa compilation cite notamment Tanzil.net et Quran Academy. L’orthographe Diyanet est proposée séparément.", audio: "Récitations", audioBody: "CDN Islamic Network : Mishary Rashid Alafasy, Abdul Rahman Al-Sudais, Maher Al-Muaiqly et Abdul Basit Abdus Samad. Les droits restent ceux des récitateurs ou de leurs ayants droit.", license: "Licence et utilisation", licenseBody: "L’application diffuse actuellement les récitations gratuitement à des fins personnelles et éducatives. Les conditions peuvent changer et sont revérifiées avant toute version commerciale." },
  es: { home: "Inicio", title: "Fuentes y atribuciones", intro: "Identificamos respetuosamente las fuentes del Corán y sus colaboradores.", translations: "Fuentes de traducción", distribution: "Distribución de datos", arabic: "Texto árabe", arabicBody: "El texto coránico uthmani procede de AlQuran Cloud / Islamic Network; su recopilación incluye fuentes como Tanzil.net y Quran Academy. La ortografía Diyanet se ofrece por separado.", audio: "Recitaciones", audioBody: "CDN de Islamic Network: Mishary Rashid Alafasy, Abdul Rahman Al-Sudais, Maher Al-Muaiqly y Abdul Basit Abdus Samad. Los derechos pertenecen a los recitadores o sus herederos.", license: "Licencia y uso", licenseBody: "La aplicación transmite actualmente las recitaciones gratis para uso personal y educativo. Las condiciones pueden cambiar y se revisan antes de cada lanzamiento comercial." },
  ar: { home: "الرئيسية", title: "المصادر ونِسب الأعمال", intro: "نذكر باحترام مصادر نص القرآن والقائمين عليها.", translations: "مصادر الترجمات", distribution: "توزيع البيانات", arabic: "النص العربي", arabicBody: "مصدر النص القرآني بالرسم العثماني هو AlQuran Cloud / Islamic Network، وتشمل مصادر جمعه Tanzil.net وQuran Academy. ويُعرض خيار الرسم الإملائي لديانت بصورة منفصلة.", audio: "التلاوات", audioBody: "شبكة Islamic Network: مشاري راشد العفاسي، وعبد الرحمن السديس، وماهر المعيقلي، وعبد الباسط عبد الصمد. وتبقى الحقوق للقراء أو لورثتهم.", license: "الترخيص والاستخدام", licenseBody: "يبث التطبيق التلاوات حاليًا مجانًا للاستخدام الشخصي والتعليمي. وقد تتغير شروط المصادر، لذلك تُراجع قبل كل إصدار تجاري." },
};

const translations = [
  "Türkçe — Diyanet İşleri",
  "English — Umm Muhammad (Saheeh International)",
  "Deutsch — A. S. F. Bubenheim & N. Elyas",
  "Français — Muhammad Hamidullah",
  "Español — Abdul Qader Mouheddine & Sirhan Ali Sanchez",
];

export function SourcesDocument() {
  const params = useSearchParams();
  const requested = params.get("lang") as Language | null;
  const lang: Language = requested && requested in text ? requested : "tr";
  const copy = text[lang];

  return <main dir={lang === "ar" ? "rtl" : "ltr"} className="mx-auto min-h-screen max-w-3xl px-5 py-12 text-text">
    <Link href="/" className="text-sm font-semibold text-primary">← {copy.home}</Link>
    <h1 className="mt-8 text-3xl font-bold">{copy.title}</h1>
    <p className="mt-3 leading-7 text-secondary">{copy.intro}</p>
    <section className="mt-8"><h2 className="text-lg font-bold">{copy.translations}</h2><ul className="mt-2 list-inside list-disc space-y-1 leading-7 text-secondary">{translations.map((item) => <li key={item}>{item}</li>)}</ul><p className="mt-3 leading-7 text-secondary">{copy.distribution}: <a className="text-primary underline" href="https://github.com/fawazahmed0/quran-api" target="_blank" rel="noreferrer">fawazahmed0/quran-api</a>.</p></section>
    <section className="mt-7"><h2 className="text-lg font-bold">{copy.arabic}</h2><p className="mt-2 leading-7 text-secondary">{copy.arabicBody}</p></section>
    <section className="mt-7"><h2 className="text-lg font-bold">{copy.audio}</h2><p className="mt-2 leading-7 text-secondary">{copy.audioBody}</p></section>
    <section className="mt-7"><h2 className="text-lg font-bold">{copy.license}</h2><p className="mt-2 leading-7 text-secondary">{copy.licenseBody} <a className="text-primary underline" href="https://alquran.cloud/terms-and-conditions" target="_blank" rel="noreferrer">AlQuran Cloud</a> · <a className="text-primary underline" href="https://github.com/fawazahmed0/quran-api/blob/1/LICENSE" target="_blank" rel="noreferrer">Quran API</a>.</p></section>
    <div className="mt-10 flex flex-wrap gap-2">{(["tr", "en", "ar", "de", "fr", "es"] as Language[]).map((value) => <Link key={value} href={`/sources?lang=${value}`} className={`rounded border px-2 py-1 text-xs ${lang === value ? "border-primary text-primary" : "border-border text-muted"}`}>{value.toUpperCase()}</Link>)}</div>
  </main>;
}
