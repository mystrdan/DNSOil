import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run database migrations.");
}

const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 5_000 });
const client = await pool.connect();
const migrationsDirectory = resolve(process.cwd(), "../../db/migrations");

try {
  await client.query("SELECT pg_advisory_lock($1)", [741902610]);
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(migrationsDirectory))
    .filter((filename) => /^\d+_[a-z0-9_-]+\.sql$/.test(filename))
    .sort();

  for (const filename of files) {
    const existing = await client.query(
      "SELECT 1 FROM schema_migrations WHERE filename = $1",
      [filename],
    );
    if (existing.rowCount) continue;

    const sql = await readFile(resolve(migrationsDirectory, filename), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [filename]);
      await client.query("COMMIT");
      console.info(`Applied migration ${filename}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  console.info(`Database migrations checked (${files.length} file(s) found).`);
} finally {
  try {
    await client.query("SELECT pg_advisory_unlock($1)", [741902610]);
  } finally {
    client.release();
    await pool.end();
  }
}
