import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();

  try {
    console.log('Starting seed...');

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO "User" (id, email, name, "passwordHash", role, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, ['admin001', 'admin@trocker.local', 'Admin User', adminPasswordHash, 'ADMIN']);
    console.log('Created admin user');

    // Create Rocky
    await client.query(`
      INSERT INTO "Cat" (id, name, "hungerLevel", "lastFedAt", "lastHungerUpdate", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, NOW(), NOW(), NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, ['rocky', 'Rocky', 0]);
    console.log('Created cat: Rocky');

    // Create app settings
    await client.query(`
      INSERT INTO "AppSettings" (id, key, value, description, "updatedAt")
      VALUES (gen_random_uuid()::text, $1, $2, $3, NOW())
      ON CONFLICT (key) DO NOTHING
    `, ['hunger_decay_rate_per_hour', '10', 'How much hunger increases per hour (0-100 scale)']);
    console.log('Created setting');

    // Create outdoor locations
    const locations = [
      ['Front Garden', 'Main entrance garden area'],
      ['Back Yard', 'Shared backyard space'],
      ['Parking Lot', 'Building parking area'],
      ['Building Entrance', 'Main building entrance'],
    ];

    for (const [name, description] of locations) {
      await client.query(`
        INSERT INTO "OutdoorLocation" (id, name, description, "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())
      `, [name, description]);
    }
    console.log('Created outdoor locations');

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error during seed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
