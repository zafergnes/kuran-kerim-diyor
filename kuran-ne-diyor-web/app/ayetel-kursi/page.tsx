import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { AyetelKursiClient } from "@/components/AyetelKursiClient";

export const metadata: Metadata = {
  title: "Ayetel Kürsî — Oku ve Dinle",
  description: "Ayetel Kürsî'yi Arapça metni, Türkçe meali ve sesli okuyuşuyla okuyun.",
  alternates: { canonical: "/ayetel-kursi" },
  openGraph: {
    type: "article",
    title: "Ayetel Kürsî — Oku ve Dinle",
    description: "Ayetel Kürsî'yi Arapça metni, Türkçe meali ve sesli okuyuşuyla okuyun.",
    url: "/ayetel-kursi",
  },
};

export default function AyetelKursiPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <AyetelKursiClient />
      </div>
    </AppShell>
  );
}
