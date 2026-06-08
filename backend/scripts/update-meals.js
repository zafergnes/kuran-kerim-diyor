const fs = require('fs');
const path = require('path');

const EDITIONS = {
  tr: 'tur-diyanetisleri',
  en: 'eng-ummmuhammad',
  de: 'deu-asfbubenheimand',
  fr: 'fra-muhammadhamidul',
  es: 'spa-abdulqadermouhe'
};

const QURAN_FILE_PATH = path.join(__dirname, '../../kuran-ne-diyor-web/data/quran.json');

async function fetchEdition(editionId) {
  try {
    console.log(`Fetching edition: ${editionId}...`);
    const url = `https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/${editionId}.json`;
    const response = await fetch(url);
    const text = await response.text();
    
    if (text.startsWith('404')) {
      console.warn(`SKIPPING ${editionId}: Not found (404)`);
      return null;
    }

    const data = JSON.parse(text);
    return data.quran;
  } catch (e) {
    console.error(`FAILED to process ${editionId}:`, e.message);
    return null;
  }
}

async function updateMeals() {
  try {
    const currentData = JSON.parse(fs.readFileSync(QURAN_FILE_PATH, 'utf-8'));
    const translations = {};
    for (const [lang, id] of Object.entries(EDITIONS)) {
      const data = await fetchEdition(id);
      if (data) translations[lang] = data;
    }

    console.log("Updating translations...");
    for (const surah of currentData) {
      process.stdout.write(`.`); // Progress indicator
      for (const ayah of surah.ayahs) {
        for (const lang of Object.keys(translations)) {
          const found = translations[lang].find((item) => 
            item.chapter === surah.number && item.verse === ayah.number
          );
          if (found) ayah.translations[lang] = found.text;
        }
      }
    }

    console.log("\nSaving file...");
    fs.writeFileSync(QURAN_FILE_PATH, JSON.stringify(currentData, null, 2));
    console.log("SUCCESS: Meals updated!");
  } catch (error) {
    console.error("ERROR:", error.message);
  }
}

updateMeals();
