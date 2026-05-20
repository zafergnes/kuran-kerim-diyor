import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const res = await prisma.verseTheme.aggregate({
    _max: { surahNumber: true }
  });
  console.log('SON_SURE:', res._max.surahNumber || 0);
  process.exit(0);
}

check();
