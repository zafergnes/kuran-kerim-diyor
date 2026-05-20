import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash" });

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function categorizeSurahsBatch(surahs: any[]) {
  const batchInfo = surahs.map(s => `Surah ${s.number} (${s.name.tr})`).join(', ');
  console.log(`[${new Date().toLocaleTimeString()}] Processing Batch: ${batchInfo}...`);

  const surahsData = surahs.map(s => ({
    number: s.number,
    ayahs: s.ayahs.map((a: any) => ({
      number: a.number,
      text: a.translations.tr
    }))
  }));

  const prompt = `
    Aşağıdaki Kur'an-ı Kerim surelerindeki ayetleri anlam bütünlüğüne göre 1 ile 3 ayetlik gruplara ayır.
    Her grup için şu 7 kategoriden en uygun olanını seç: MOTIVATION, WISDOM, PATIENCE, MORALITY, PRAYER, PEACE, GRATITUDE.
    
    Sureler:
    ${JSON.stringify(surahsData, null, 2)}
    
    Yanıtı sadece aşağıdaki JSON formatında ver, başka açıklama ekleme. Her sure için ayrı bir obje oluştur:
    {
      "41": [ { "start": 1, "end": 2, "category": "WISDOM" }, ... ],
      "42": [ ... ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const batchResult = JSON.parse(text);

    for (const surahNum of Object.keys(batchResult)) {
      const groups = batchResult[surahNum];
      for (const group of groups) {
        await prisma.verseTheme.upsert({
          where: {
            surahNumber_startAyah_endAyah: {
              surahNumber: parseInt(surahNum),
              startAyah: group.start,
              endAyah: group.end
            }
          },
          update: { categoryKey: group.category },
          create: {
            surahNumber: parseInt(surahNum),
            startAyah: group.start,
            endAyah: group.end,
            categoryKey: group.category
          }
        });
      }
      console.log(`[SUCCESS] Surah ${surahNum} saved.`);
    }
    return true;
  } catch (error: any) {
    console.error(`[ERROR] Batch processing failed:`, error.message);
    return false;
  }
}

async function main() {
  const quranPath = path.join(__dirname, '../../kuran-ne-diyor-web/data/quran.json');
  const quranData = JSON.parse(fs.readFileSync(quranPath, 'utf-8'));

  // Veritabanında hangi surelerin zaten işlendiğini bulalım
  const processedSurahs = await prisma.verseTheme.groupBy({
    by: ['surahNumber'],
  });
  const processedSurahNumbers = new Set(processedSurahs.map(s => s.surahNumber));

  const BATCH_SIZE = 5;
  const pendingSurahs = quranData.filter((s: any) => !processedSurahNumbers.has(s.number));

  console.log(`Checking ${quranData.length} surahs. Already processed: ${processedSurahNumbers.size}. Pending: ${pendingSurahs.length}`);

  for (let i = 0; i < pendingSurahs.length; i += BATCH_SIZE) {
    const batch = pendingSurahs.slice(i, i + BATCH_SIZE);
    
    const success = await categorizeSurahsBatch(batch);
    
    if (success) {
      console.log(`Waiting 15 seconds before next batch...`);
      await sleep(15000); 
    } else {
      console.log(`Retrying batch in 60 seconds...`);
      await sleep(60000);
      i -= BATCH_SIZE; 
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
