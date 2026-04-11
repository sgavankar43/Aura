import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Seed Users
  const hashedPassword1 = await bcrypt.hash('admin123', 10);
  const hashedPassword2 = await bcrypt.hash('developer123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@aura.local' },
    update: {},
    create: {
      email: 'admin@aura.local',
      name: 'Admin User',
      passwordHash: hashedPassword1,
      role: 'admin',
    },
  });

  const dev = await prisma.user.upsert({
    where: { email: 'dev@aura.local' },
    update: {},
    create: {
      email: 'dev@aura.local',
      name: 'Developer User',
      passwordHash: hashedPassword2,
      role: 'user',
    },
  });

  console.log('✅ Created User:', admin.email);
  console.log('✅ Created User:', dev.email);

  console.log('🏁 Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
