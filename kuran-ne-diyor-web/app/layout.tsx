import type { Metadata, Viewport } from "next";
import { Amiri, Geist, Geist_Mono, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import AppInitializer from "@/components/AppInitializer";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
});

const notoNaskh = Noto_Naskh_Arabic({
  variable: "--font-noto-naskh",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Kur'an",
    "Kuran",
    "Kur'an-ı Kerim",
    "meal",
    "Kuran meali",
    "Türkçe meal",
    "ayet",
    "sure",
    "Kuran dinle",
    "sesli Kuran",
    "Diyanet meali",
    "Kuran oku",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "tr_TR",
    alternateLocale: ["en_US", "ar_AR", "de_DE", "fr_FR", "es_ES"],
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: ["/icons/icon-512x512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Search Console dogrulamasi HTML etiketiyle yapilacaksa bu degisken doldurulur.
  // DNS ile dogrulandiysa bos birakilabilir.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#b69a73",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${amiri.variable} ${notoNaskh.variable} h-full antialiased bg-background text-text`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('@app_theme_preference')||'sepia';if(t==='system'){if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.setAttribute('data-theme','dark')}else{document.documentElement.setAttribute('data-theme','light')}}else{document.documentElement.setAttribute('data-theme',t)}var s=localStorage.getItem('@app_content_font_scale');if(s){document.documentElement.style.setProperty('--content-font-scale',s)}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          // Yapisal veri: site kimligi + arama kutusu + uygulama kaydi.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: SITE_NAME,
                alternateName: "Kuran Ne Diyor",
                url: SITE_URL,
                description: SITE_DESCRIPTION,
                inLanguage: ["tr", "en", "ar", "de", "fr", "es"],
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "MobileApplication",
                name: SITE_NAME,
                description: SITE_TAGLINE,
                url: SITE_URL,
                applicationCategory: "LifestyleApplication",
                operatingSystem: "Android, iOS",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "TRY",
                },
              },
            ]),
          }}
        />
        <AppInitializer>{children}</AppInitializer>
      </body>
    </html>
  );
}
