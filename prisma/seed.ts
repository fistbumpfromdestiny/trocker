import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@trocker.local' },
    update: {},
    create: {
      email: 'admin@trocker.local',
      name: 'Admin User',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });
  console.log('Created admin user:', admin.email);

  // Create Rocky the cat
  const rocky = await prisma.cat.upsert({
    where: { id: 'rocky' },
    update: {},
    create: {
      id: 'rocky',
      name: 'Rocky',
      hungerLevel: 0,
      lastFedAt: new Date(),
      lastHungerUpdate: new Date(),
    },
  });
  console.log('Created cat:', rocky.name);

  // Create app settings
  const hungerSetting = await prisma.appSettings.upsert({
    where: { key: 'hunger_decay_rate_per_hour' },
    update: {},
    create: {
      key: 'hunger_decay_rate_per_hour',
      value: '10',
      description: 'How much hunger increases per hour (0-100 scale)',
    },
  });
  console.log('Created setting:', hungerSetting.key);

  // Create some outdoor locations
  const outdoorLocations = await prisma.outdoorLocation.createMany({
    data: [
      { name: 'Front Garden', description: 'Main entrance garden area' },
      { name: 'Back Yard', description: 'Shared backyard space' },
      { name: 'Parking Lot', description: 'Building parking area' },
      { name: 'Building Entrance', description: 'Main building entrance' },
    ],
    skipDuplicates: true,
  });
  console.log('Created outdoor locations:', outdoorLocations.count);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
