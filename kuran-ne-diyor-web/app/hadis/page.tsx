import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { HadithClient } from "@/components/HadithClient";

export const metadata: Metadata = {
  title: "Günün Hadisi — Sahih Kaynaklardan Hadisler",
  description: "Sahîh-i Buhârî ve İmam Nevevî'nin Kırk Hadis'inden her gün bir hadis; Arapça aslı, Türkçe ve diğer dillerde çevirisi, kaynak ve sıhhat derecesiyle.",
  alternates: { canonical: "/hadis" },
  openGraph: {
    type: "article",
    title: "Günün Hadisi — Sahih Kaynaklardan Hadisler",
    description: "Sahîh-i Buhârî ve İmam Nevevî'nin Kırk Hadis'inden her gün bir hadis.",
    url: "/hadis",
  },
};

export default function HadithPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <Suspense fallback={null}>
          <HadithClient />
        </Suspense>
      </div>
    </AppShell>
  );
}
