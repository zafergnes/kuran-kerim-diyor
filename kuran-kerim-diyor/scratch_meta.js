const fs = require('fs');

async function fetchMeta() {
  try {
    console.log("Fetching Quran metadata from API...");
    const res = await fetch("https://api.alquran.cloud/v1/meta");
    const json = await res.json();
    
    const pages = json.data.pages.references;
    console.log(`Fetched metadata successfully. Found ${pages.length} pages.`);
    
    // We build an array of page references: each page N is { surah: number, ayah: number }
    // which represents the starting surah and ayah numbers of page N (1-indexed)
    const pageStartMap = pages.map(p => ({
      surah: p.surah,
      ayah: p.ayah
    }));
    
    // Write it as a clean TypeScript file
    const tsContent = `// Static Quran Page Start References (Page 1 to 604)
// Each element represents the starting { surah, ayah } of that page (0-indexed array matches Page 1 to 604)
export interface PageStartRef {
  surah: number;
  ayah: number;
}

export const PAGE_START_MAP: PageStartRef[] = ${JSON.stringify(pageStartMap, null, 2)};
`;
    
    fs.writeFileSync('utils/pageMapping.ts', tsContent);
    console.log("Successfully generated utils/pageMapping.ts!");
  } catch (error) {
    console.error("Error fetching or writing metadata:", error);
  }
}

fetchMeta();
