import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash" });

const CATEGORIES = {
  MOTIVATION: "Güç ve Motivasyon",
  WISDOM: "Düşünce ve Hikmet",
  PATIENCE: "Sabır ve Umut",
  MORALITY: "Ahlak ve Adalet",
  PRAYER: "Dua ve Yakarış",
  PEACE: "Huzur ve Teselli",
  GRATITUDE: "Şükür ve Farkındalık"
};

async function categorizeSurah(surah: any) {
  console.log(`Categorizing Surah ${surah.number}: ${surah.name.tr}...`);

  const ayahs = surah.ayahs.map((a: any) => ({
    number: a.number,
    text: a.translations.tr
  }));

  const prompt = `
    Aşağıdaki Kur'an-ı Kerim ayetlerini (Türkçe mealleriyle beraber) anlam bütünlüğüne göre 1 ile 3 ayetlik gruplara ayır.
    Her grup için şu 7 kategoriden en uygun olanını seç: MOTIVATION, WISDOM, PATIENCE, MORALITY, PRAYER, PEACE, GRATITUDE.
    
    Ayetler:
    ${JSON.stringify(ayahs, null, 2)}
    
    Yanıtı sadece aşağıdaki JSON formatında ver, başka açıklama ekleme:
    [
      { "start": 1, "end": 2, "category": "WISDOM" },
      { "start": 3, "end": 3, "category": "MOTIVATION" }
    ]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up potential markdown formatting
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const groups = JSON.parse(text);

    for (const group of groups) {
      await prisma.verseTheme.upsert({
        where: {
          surahNumber_startAyah_endAyah: {
            surahNumber: surah.number,
            startAyah: group.start,
            endAyah: group.end
          }
        },
        update: {
          categoryKey: group.category
        },
        create: {
          surahNumber: surah.number,
          startAyah: group.start,
          endAyah: group.end,
          categoryKey: group.category
        }
      });
    }
    console.log(`Successfully categorized Surah ${surah.number}`);
  } catch (error) {
    console.error(`Error categorizing Surah ${surah.number}:`, error);
  }
}

async function main() {
  const quranPath = path.join(__dirname, '../../kuran-ne-diyor-web/data/quran.json');
  const quranData = JSON.parse(fs.readFileSync(quranPath, 'utf-8'));

  // Sadece ilk birkaç sure ile test edelim veya belirli bir sureyi hedefleyelim
  // Gerçek kullanımda tüm sureler için döngü kurulabilir
  for (const surah of quranData.slice(0, 5)) { // İlk 5 sure için test
    await categorizeSurah(surah);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
