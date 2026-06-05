import type { Metadata } from "next";
import { Amiri, Geist, Geist_Mono, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import AppInitializer from "@/components/AppInitializer";

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
  title: "Kuran Ne Diyor",
  description: "Kur'an ayetlerini okuyun, arayın ve kaldığınız yerden devam edin.",
  manifest: "/manifest.json",
  themeColor: "#b69a73",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kuran Ne Diyor",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} ${amiri.variable} ${notoNaskh.variable} h-full antialiased bg-background text-text`}
    >
      <body className="min-h-full flex flex-col">
        <AppInitializer>{children}</AppInitializer>
      </body>
    </html>
  );
}
