/**
 * Site genelinde kullanilan SEO sabitleri.
 * Tek kaynak: metadata, sitemap, robots ve yapisal veri hepsi buradan besleniyor.
 */

export const SITE_URL = "https://kurannediyor.com.tr";

export const SITE_NAME = "Kur'an Ne Diyor?";

export const SITE_TAGLINE = "Oku, Dinle ve Tefekkür Et";

export const SITE_DESCRIPTION =
  "Kur'an-ı Kerim'i Türkçe meali, Arapça metni ve sesli okuyuşuyla okuyun. " +
  "114 sûre ve 6236 âyette arama yapın, favorilerinize ekleyin, kaldığınız yerden devam edin.";

/**
 * Mobil uygulama magaza adresleri.
 *
 * NOT: iOS surumu yayinda. Android surumu Google Play'de HENUZ YAYINLANMADI;
 * asagidaki adres uygulama magazaya cikana kadar 404 doner. Play yayini
 * tamamlanana kadar ANDROID_STORE_URL degerini null birakmak, kullaniciyi
 * bos sayfaya gondermekten daha iyidir.
 */
export const IOS_STORE_URL =
  "https://apps.apple.com/app/id6806882595";

export const ANDROID_STORE_URL: string | null = null;

/** Uygulama arayuzunun destekledigi diller. Ilk eleman varsayilan dildir. */
export const LOCALES = ["tr", "en", "ar", "de", "fr", "es"] as const;

export type Locale = (typeof LOCALES)[number];

/** Open Graph icin dil kodu esleme tablosu. */
export const OG_LOCALES: Record<Locale, string> = {
  tr: "tr_TR",
  en: "en_US",
  ar: "ar_AR",
  de: "de_DE",
  fr: "fr_FR",
  es: "es_ES",
};

/** Mutlak URL uretir; metadataBase ile birlikte canonical ve OG icin kullanilir. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}
