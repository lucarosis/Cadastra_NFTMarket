/* Applies src/db/sql/*.sql in order. Idempotent.
   Usage: npm run db:setup                   (PGlite in .data/pglite)
          DATABASE_URL=… npm run db:setup    (managed PostgreSQL) */

import { mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const SQL_DIR = path.join(process.cwd(), "src/db/sql");

async function run(sql) {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    await client.query(sql);
    await client.end();
    return "PostgreSQL (DATABASE_URL)";
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DIR ?? ".data/pglite";
  await mkdir(dir, { recursive: true });
  const db = new PGlite(dir);
  await db.waitReady;
  await db.exec(sql);
  await db.close();
  return `${dir} (PGlite)`;
}

const files = (await readdir(SQL_DIR)).filter((f) => f.endsWith(".sql")).sort();
let sql = "";
for (const f of files) sql += (await readFile(path.join(SQL_DIR, f), "utf8")) + "\n";

const target = await run(sql);
console.log(`Applied ${files.length} migration file(s) to ${target}`);
