import { prisma } from '@/lib/db';

export async function calculateCurrentHunger(catId: string): Promise<number> {
  const cat = await prisma.cat.findUnique({
    where: { id: catId },
  });

  if (!cat) {
    throw new Error('Cat not found');
  }

  // Get hunger decay rate from settings
  const decayRateSetting = await prisma.appSettings.findUnique({
    where: { key: 'hunger_decay_rate_per_hour' },
  });

  const decayRatePerHour = decayRateSetting ? parseFloat(decayRateSetting.value) : 10;

  // Calculate hours since last hunger update
  const now = new Date();
  const hoursSinceUpdate = (now.getTime() - cat.lastHungerUpdate.getTime()) / (1000 * 60 * 60);

  // Calculate new hunger level
  const hungerIncrease = hoursSinceUpdate * decayRatePerHour;
  const newHungerLevel = Math.min(100, cat.hungerLevel + hungerIncrease);

  return Math.round(newHungerLevel);
}

export async function updateHungerLevel(catId: string): Promise<number> {
  const newHungerLevel = await calculateCurrentHunger(catId);

  await prisma.cat.update({
    where: { id: catId },
    data: {
      hungerLevel: newHungerLevel,
      lastHungerUpdate: new Date(),
    },
  });

  return newHungerLevel;
}

export async function feedCat(catId: string): Promise<void> {
  await prisma.cat.update({
    where: { id: catId },
    data: {
      hungerLevel: 0,
      lastFedAt: new Date(),
      lastHungerUpdate: new Date(),
    },
  });
}
