import { getSurah, getAyah } from "@/services/quranData";
import { AppShell } from "@/components/AppShell";
import { Sparkles, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const [surahNum, ayahNum] = (await params).id.split(':');
  const surah = getSurah(Number(surahNum));
  const ayah = getAyah(Number(surahNum), Number(ayahNum));
  
  if (!surah || !ayah) {
    return {
      title: "Ayet Bulunamadı - Kuran Kerim Diyor",
    };
  }

  const reference = `${surah.name.tr} ${ayah.number}`;
  const text = ayah.translations.tr || "";
  
  return {
    title: `${reference} - Kuran Kerim Diyor`,
    description: text,
    openGraph: {
      title: reference,
      description: text,
      type: 'article',
    }
  };
}

export default async function VerseDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const [surahNum, ayahNum] = id.split(':');
  
  const surah = getSurah(Number(surahNum));
  const ayah = getAyah(Number(surahNum), Number(ayahNum));
  
  if (!surah || !ayah) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-bold text-text">Ayet bulunamadı</h1>
          <Link href="/" className="mt-4 text-primary font-bold">Ana Sayfaya Dön</Link>
        </div>
      </AppShell>
    );
  }

  const verse = {
    text: ayah.translations.tr || "",
    reference: `${surah.name.tr} ${ayah.number}`,
    arabic: ayah.arabic
  };


  return (
    <AppShell>
      <div className="mx-auto max-w-2xl py-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted transition hover:text-primary">
          <ArrowLeft size={16} />
          Geri Dön
        </Link>

        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
          {/* Header decoration */}
          <div className="h-2 bg-primary w-full" />
          
          <div className="p-8 sm:p-12">
            <div className="flex justify-center mb-8">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Sparkles size={24} />
              </div>
            </div>

            <div className="text-center mb-6">
              <a 
                href={`kuran-kerim-diyor://ayet/${id}`}
                className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary/30"
              >
                UYGULAMADA AÇ
              </a>
            </div>

            {verse.arabic && (
              <p className="arabic-text mb-10 text-center text-4xl leading-[2.2] text-text sm:text-5xl" dir="rtl">
                {verse.arabic}
              </p>
            )}

            <p className="text-center text-xl font-medium leading-10 text-text sm:text-2xl italic">
              “{verse.text}”
            </p>

            <div className="mt-10 flex flex-col items-center">
              <div className="h-px w-12 bg-border mb-6" />
              <p className="text-sm font-black tracking-widest text-primary uppercase">
                {verse.reference}
              </p>
            </div>
          </div>

          {/* Call to Action Section */}
          <div className="bg-background/50 border-t border-border p-8 text-center">
            <h3 className="text-lg font-bold text-text mb-2">Bu Ayeti Beğendin mi?</h3>
            <p className="text-sm text-secondary mb-8">
              Her gün senin için seçilen özel ayetlerle buluşmak için uygulamamızı indir.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              {/* Placeholder Store Buttons */}
              <button className="flex h-12 items-center gap-3 rounded-xl bg-black px-6 text-white transition hover:bg-zinc-800">
                <Download size={20} />
                <div className="text-left">
                  <p className="text-[10px] leading-none opacity-60">Download on the</p>
                  <p className="text-sm font-bold leading-none">App Store</p>
                </div>
              </button>
              
              <button className="flex h-12 items-center gap-3 rounded-xl bg-black px-6 text-white transition hover:bg-zinc-800">
                <Download size={20} />
                <div className="text-left">
                  <p className="text-[10px] leading-none opacity-60">GET IT ON</p>
                  <p className="text-sm font-bold leading-none">Google Play</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
           <p className="text-sm text-muted">
            Kuran Kerim Diyor &copy; {new Date().getFullYear()}
           </p>
        </div>
      </div>
    </AppShell>
  );
}
