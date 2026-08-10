import { prisma } from './src/utils/prisma';

async function makeAdmin() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    throw new Error('ADMIN_EMAIL is required');
  }
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
