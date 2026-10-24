/* Database connection for the command-line scripts.
   DATABASE_URL set → PostgreSQL; unset → PGlite in .data/pglite (as the app). */

import { mkdir } from "node:fs/promises";

export async function connect() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    return {
      query: (sql, params = []) => client.query(sql, params),
      close: () => client.end(),
      target: "PostgreSQL (DATABASE_URL)",
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DIR ?? ".data/pglite";
  await mkdir(dir, { recursive: true });
  const db = new PGlite(dir);
  await db.waitReady;
  return {
    query: (sql, params = []) => db.query(sql, params),
    close: () => db.close(),
    target: `${dir} (PGlite)`,
  };
}
