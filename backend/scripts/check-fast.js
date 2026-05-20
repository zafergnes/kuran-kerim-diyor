const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const res = await prisma.verseTheme.aggregate({
      _max: { surahNumber: true }
    });
    console.log('---SON_DURUM---');
    console.log('SON_SURE:', res._max.surahNumber || 0);
    console.log('---------------');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

check();
