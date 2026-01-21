import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();

  try {
    console.log("Starting seed...");

    // Create Rocky
    await client.query(
      `
      INSERT INTO "Cat" (id, name, "createdAt", "updatedAt")
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `,
      ["rocky", "Rocky"],
    );
    console.log("Created cat: Rocky");

    // Create Rockeye system user (for automated webhook messages)
    // No passwordHash = cannot log in, only usable by code
    await client.query(
      `
      INSERT INTO "User" (id, email, name, "passwordHash", role, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, NULL, $4, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `,
      ["rockeye-system", "rockeye@system.local", "Rockeye 🤖", "USER"],
    );
    console.log("Created system user: Rockeye (cannot log in)");

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Error during seed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
