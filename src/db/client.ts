/* ============================================================
   Database connection (server only — never import from a
   "use client" component).

   DATABASE_URL set   → managed PostgreSQL (node-postgres)
   DATABASE_URL unset → PGlite, real PostgreSQL compiled to
                        WebAssembly, stored in .data/pglite
                        (on Vercel: a copy of the demo database
                        the build prepared — accounts temporary)

   Same schema and same SQL either way, so development matches
   production without installing a database locally.
   ============================================================ */

import * as schema from "./schema";

type Db = Awaited<ReturnType<typeof create>>;

/* Vercel's Postgres integrations set POSTGRES_URL; anything else uses DATABASE_URL. */
export const databaseUrl = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

/** True on a serverless host without DATABASE_URL: each server has its own in-memory copy. */
export const isTemporaryDatabase = () => !databaseUrl() && Boolean(process.env.VERCEL);

async function create() {
  const url = databaseUrl();

  if (url) {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url, max: 10 });
    return drizzle(pool, { schema });
  }

  const { drizzle } = await import("drizzle-orm/pglite");
  const { PGlite } = await import("@electric-sql/pglite");

  if (process.env.VERCEL) {
    const client = new PGlite({ loadDataDir: await shippedDatabase() });
    await client.waitReady;
    return drizzle(client, { schema });
  }

  const { mkdir } = await import("node:fs/promises");
  const dir = process.env.PGLITE_DIR ?? ".data/pglite";
  await mkdir(dir, { recursive: true }); /* PGlite does not create parents */
  const client = new PGlite(dir);
  await client.waitReady;
  return drizzle(client, { schema });
}

/* Serverless hosts: the build shipped the prepared demo database as one archive
   (.data/deploy-db.tar.gz, see scripts/setup.mjs) — a folder would lose the empty
   directories PostgreSQL needs. Each server loads it into memory, so accounts made
   there are temporary; set DATABASE_URL for a database that keeps them. */
async function shippedDatabase(): Promise<Blob> {
  const path = await import("node:path");
  const { readFile } = await import("node:fs/promises");
  try {
    const archive = await readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), ".data", "deploy-db.tar.gz"));
    return new Blob([new Uint8Array(archive)]);
  } catch {
    throw new Error("No database: set DATABASE_URL, or redeploy so the build can prepare the demo database.");
  }
}

/* One connection per process, kept across hot reloads in development. */
const globalForDb = globalThis as unknown as { __terraDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  /* a failed start is not cached: the next request tries again */
  globalForDb.__terraDb ??= create().catch((e) => {
    globalForDb.__terraDb = undefined;
    throw e;
  });
  return globalForDb.__terraDb;
}

export { schema };
