import fs from 'fs';
import axios from 'axios';
import path from 'path';

const EDITIONS = {
  tr: 'tur-diyanetisleri-la',
  en: 'eng-sahih',
  de: 'deu-asaburdie-la',
  fr: 'fra-muhammadhamidul-la',
  es: 'spa-muhammadisaagar-la'
};

const QURAN_FILE_PATH = path.join(process.cwd(), '../kuran-ne-diyor-web/data/quran.json');

async function fetchEdition(editionId: string) {
  console.log(`Fetching edition: ${editionId}...`);
  const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/${editionId}.json`;
  const response = await axios.get(url);
  return response.data.quran;
}

async function updateMeals() {
  try {
    const currentData = JSON.parse(fs.readFileSync(QURAN_FILE_PATH, 'utf-8'));
    
    const translations: any = {};
    for (const [lang, id] of Object.entries(EDITIONS)) {
      translations[lang] = await fetchEdition(id);
    }

    console.log("Updating translations in local file...");

    for (const surah of currentData) {
      for (const ayah of surah.ayahs) {
        for (const lang of Object.keys(EDITIONS)) {
          // fawazahmed0 API has a flat array of all ayahs across all surahs
          // We need to find the specific ayah by surah and ayah number
          const found = translations[lang].find((item: any) => 
            item.chapter === surah.number && item.verse === ayah.number
          );
          
          if (found) {
            ayah.translations[lang] = found.text;
          }
        }
      }
    }

    fs.writeFileSync(QURAN_FILE_PATH, JSON.stringify(currentData, null, 2));
    console.log("SUCCESS: All meals updated to reliable sources!");
  } catch (error) {
    console.error("ERROR updating meals:", error);
  }
}

updateMeals();
