import { prisma } from './src/utils/prisma';

async function makeAdmin() {
  const email = 'eneesakcaa@gmail.com';
  try {
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });
    console.log(`User ${email} is now an ADMIN!`);
  } catch (e) {
    console.error('Failed to set admin:', e);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
