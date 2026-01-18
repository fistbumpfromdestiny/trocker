import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const locations = [
  // Row 1
  {
    externalId: "park-nw",
    name: "The Northern Woods",
    type: "OUTDOOR" as const,
    top: "0%",
    left: "0%",
    width: "16.66%",
    height: "16.66%",
    order: 1,
  },
  {
    externalId: "building-1",
    name: "The Forbidden Tower",
    type: "BUILDING_COMMON" as const,
    top: "0%",
    left: "16.66%",
    width: "16.66%",
    height: "16.66%",
    order: 2,
  },
  {
    externalId: "street-n1",
    name: "The Royal Path",
    type: "OUTDOOR" as const,
    top: "0%",
    left: "33.33%",
    width: "16.66%",
    height: "16.66%",
    order: 3,
  },
  {
    externalId: "building-2",
    name: "The Dark Citadel",
    type: "BUILDING_COMMON" as const,
    top: "0%",
    left: "50%",
    width: "16.66%",
    height: "16.66%",
    order: 4,
  },
  {
    externalId: "building-3",
    name: "The Shadow Spire",
    type: "BUILDING_COMMON" as const,
    top: "0%",
    left: "66.66%",
    width: "16.66%",
    height: "16.66%",
    order: 5,
  },
  {
    externalId: "building-4",
    name: "The Eastern Keep",
    type: "BUILDING_COMMON" as const,
    top: "0%",
    left: "83.33%",
    width: "16.67%",
    height: "16.66%",
    order: 6,
  },

  // Row 2
  {
    externalId: "park-w1",
    name: "The Fountain of Youth",
    type: "OUTDOOR" as const,
    top: "16.66%",
    left: "0%",
    width: "16.66%",
    height: "16.66%",
    order: 7,
  },
  {
    externalId: "building-5",
    name: "The Whispering Grove",
    type: "BUILDING_COMMON" as const,
    top: "16.66%",
    left: "16.66%",
    width: "16.66%",
    height: "16.66%",
    order: 8,
  },
  {
    externalId: "courtyard-1",
    name: "The Grand Courtyard",
    type: "OUTDOOR" as const,
    top: "16.66%",
    left: "33.33%",
    width: "16.66%",
    height: "16.66%",
    order: 9,
  },
  {
    externalId: "building-6",
    name: "The Obsidian Halls",
    type: "BUILDING_COMMON" as const,
    top: "16.66%",
    left: "50%",
    width: "16.66%",
    height: "16.66%",
    order: 10,
  },
  {
    externalId: "building-7",
    name: "The Merchant Quarter",
    type: "BUILDING_COMMON" as const,
    top: "16.66%",
    left: "66.66%",
    width: "16.66%",
    height: "16.66%",
    order: 11,
  },
  {
    externalId: "building-8",
    name: "The Crystal Palace",
    type: "BUILDING_COMMON" as const,
    top: "16.66%",
    left: "83.33%",
    width: "16.67%",
    height: "16.66%",
    order: 12,
  },

  // Row 3 - THE CASTLE IS HERE
  {
    externalId: "park-w2",
    name: "The Mystic Meadow",
    type: "OUTDOOR" as const,
    top: "33.33%",
    left: "0%",
    width: "16.66%",
    height: "16.66%",
    order: 13,
  },
  {
    externalId: "building-9",
    name: "The Watcher's Bastion",
    type: "BUILDING_COMMON" as const,
    top: "33.33%",
    left: "16.66%",
    width: "16.66%",
    height: "16.66%",
    order: 14,
  },
  {
    externalId: "courtyard-2",
    name: "The Royal Courtyard",
    type: "OUTDOOR" as const,
    top: "33.33%",
    left: "33.33%",
    width: "16.66%",
    height: "16.66%",
    order: 15,
  },
  {
    externalId: "building-10",
    name: "The Castle",
    type: "APARTMENT" as const,
    top: "33.33%",
    left: "50%",
    width: "16.66%",
    height: "16.66%",
    order: 16,
  },
  {
    externalId: "street-e1",
    name: "The Starry Lane",
    type: "OUTDOOR" as const,
    top: "33.33%",
    left: "66.66%",
    width: "16.66%",
    height: "16.66%",
    order: 17,
  },
  {
    externalId: "building-11",
    name: "The Jade Sanctum",
    type: "BUILDING_COMMON" as const,
    top: "33.33%",
    left: "83.33%",
    width: "16.67%",
    height: "16.66%",
    order: 18,
  },

  // Row 4
  {
    externalId: "park-w3",
    name: "The Wildwood Park",
    type: "OUTDOOR" as const,
    top: "50%",
    left: "0%",
    width: "16.66%",
    height: "16.66%",
    order: 19,
  },
  {
    externalId: "building-12",
    name: "The Azure Tower",
    type: "BUILDING_COMMON" as const,
    top: "50%",
    left: "16.66%",
    width: "16.66%",
    height: "16.66%",
    order: 20,
  },
  {
    externalId: "street-c1",
    name: "The King's Boulevard",
    type: "OUTDOOR" as const,
    top: "50%",
    left: "33.33%",
    width: "16.66%",
    height: "16.66%",
    order: 21,
  },
  {
    externalId: "building-13",
    name: "The Iron Enclave",
    type: "BUILDING_COMMON" as const,
    top: "50%",
    left: "50%",
    width: "16.66%",
    height: "16.66%",
    order: 22,
  },
  {
    externalId: "building-14",
    name: "The Amber Stronghold",
    type: "BUILDING_COMMON" as const,
    top: "50%",
    left: "66.66%",
    width: "16.66%",
    height: "16.66%",
    order: 23,
  },
  {
    externalId: "building-15",
    name: "The Moonlit Spire",
    type: "BUILDING_COMMON" as const,
    top: "50%",
    left: "83.33%",
    width: "16.67%",
    height: "16.66%",
    order: 24,
  },

  // Row 5
  {
    externalId: "park-sw1",
    name: "The Southern Wilds",
    type: "OUTDOOR" as const,
    top: "66.66%",
    left: "0%",
    width: "16.66%",
    height: "16.67%",
    order: 25,
  },
  {
    externalId: "building-16",
    name: "The Copper Garrison",
    type: "BUILDING_COMMON" as const,
    top: "66.66%",
    left: "16.66%",
    width: "16.66%",
    height: "16.67%",
    order: 26,
  },
  {
    externalId: "building-17",
    name: "The Sunfire Barracks",
    type: "BUILDING_COMMON" as const,
    top: "66.66%",
    left: "33.33%",
    width: "16.66%",
    height: "16.67%",
    order: 27,
  },
  {
    externalId: "parking-1",
    name: "The Trading Post",
    type: "OUTDOOR" as const,
    top: "66.66%",
    left: "50%",
    width: "16.66%",
    height: "16.67%",
    order: 28,
  },
  {
    externalId: "building-18",
    name: "The Rust Battlements",
    type: "BUILDING_COMMON" as const,
    top: "66.66%",
    left: "66.66%",
    width: "16.66%",
    height: "16.67%",
    order: 29,
  },
  {
    externalId: "building-19",
    name: "The Crimson Watchtower",
    type: "BUILDING_COMMON" as const,
    top: "66.66%",
    left: "83.33%",
    width: "16.67%",
    height: "16.67%",
    order: 30,
  },

  // Row 6
  {
    externalId: "park-sw2",
    name: "The Enchanted Gardens",
    type: "OUTDOOR" as const,
    top: "83.33%",
    left: "0%",
    width: "16.66%",
    height: "16.67%",
    order: 31,
  },
  {
    externalId: "park-s1",
    name: "The Verdant Fields",
    type: "OUTDOOR" as const,
    top: "83.33%",
    left: "16.66%",
    width: "16.66%",
    height: "16.67%",
    order: 32,
  },
  {
    externalId: "park-s2",
    name: "The Serene Glen",
    type: "OUTDOOR" as const,
    top: "83.33%",
    left: "33.33%",
    width: "16.66%",
    height: "16.67%",
    order: 33,
  },
  {
    externalId: "street-s1",
    name: "The Wanderer's Way",
    type: "OUTDOOR" as const,
    top: "83.33%",
    left: "50%",
    width: "16.66%",
    height: "16.67%",
    order: 34,
  },
  {
    externalId: "park-se1",
    name: "The Twilight Glade",
    type: "OUTDOOR" as const,
    top: "83.33%",
    left: "66.66%",
    width: "16.66%",
    height: "16.67%",
    order: 35,
  },
  {
    externalId: "park-se2",
    name: "The Horizon Fields",
    type: "OUTDOOR" as const,
    top: "83.33%",
    left: "83.33%",
    width: "16.67%",
    height: "16.67%",
    order: 36,
  },
];

const castleApartments = [
  {
    name: "Carlefred",
    description: "The grand throne room on the sixth floor",
    order: 1,
  },
  { name: "Eriksson Larsson", description: "The spare people", order: 2 },
];

async function main() {
  console.log("Seeding locations...");

  // Clear existing locations
  await prisma.location.deleteMany({});

  // Create locations
  for (const loc of locations) {
    const location = await prisma.location.create({
      data: {
        externalId: loc.externalId,
        name: loc.name,
        type: loc.type,
        gridTop: loc.top,
        gridLeft: loc.left,
        gridWidth: loc.width,
        gridHeight: loc.height,
        displayOrder: loc.order,
        isActive: true,
      },
    });

    console.log(`Created location: ${location.name}`);
  }

  console.log(`\nSeeded ${locations.length} locations successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
