/* Prepares a local copy so `npm run dev` just works. Runs automatically before
   `npm run dev` (the "predev" script) and does only what is missing:

     1. checks the Node.js version
     2. creates or upgrades the database (always; it is idempotent)
     3. loads the demo data on an empty database
     4. downloads and renders the catalogue images, the first time only
     5. imports the catalogue, the first time only
     6. attaches artist photos, if public/assets/creators/credits.json is present

   Each step is one of the scripts in this folder, run in turn — PGlite allows
   one process at a time, so they never overlap with each other or the server. */

import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { connect } from "./lib/db.mjs";
import { CREATORS_DIR, NFT_DIR } from "./lib/assets.mjs";

const ROOT = process.cwd();
const say = (m) => console.log(`\x1b[36m[cadastra]\x1b[0m ${m}`);

/* 1. Node.js */
const [major, minor] = process.versions.node.split(".").map(Number);
/* 22.18 is the first release that loads the TypeScript seed files without a flag */
if (major < 22 || (major === 22 && minor < 18)) {
  console.error(`Cadastra needs Node.js 22.18 or newer (24 recommended); this is ${process.versions.node}.\nRun: nvm install`);
  process.exit(1);
}

/* On a serverless host (Vercel) the build prepares everything the site needs:
     - DATABASE_URL set: the hosted PostgreSQL, which keeps accounts;
     - DATABASE_URL unset: a fresh demo database in .data/deploy-db that ships with the
       site as one archive — each server loads it into memory, so accounts are temporary;
     - SESSION_SECRET unset: a random secret for this deployment in .data/deploy-secret,
       built into the server code by next.config.ts. Never committed. */
if (process.env.VERCEL) {
  const data = path.join(ROOT, ".data");
  mkdirSync(data, { recursive: true });
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    say("No DATABASE_URL: preparing a demo database that ships with the site (accounts are temporary).");
    say("Connect a PostgreSQL database in Vercel (Storage) to keep accounts, then redeploy.");
    process.env.PGLITE_DIR = path.join(data, "deploy-db"); /* the scripts below inherit it */
    rmSync(process.env.PGLITE_DIR, { recursive: true, force: true });
  }
  if ((process.env.SESSION_SECRET ?? "").length < 16) {
    writeFileSync(path.join(data, "deploy-secret"), randomBytes(32).toString("base64url"));
    say("No SESSION_SECRET: generated one for this deployment.");
  }
}

const run = (script, args = [], { optional = false } = {}) => {
  /* the seed files are TypeScript loaded directly; Node's notice about that is noise here */
  const r = spawnSync(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", path.join("scripts", script), ...args], {
    stdio: "inherit",
    cwd: ROOT,
  });
  if (r.status !== 0 && !optional) {
    console.error(`\n${script} failed — see the message above.`);
    process.exit(r.status ?? 1);
  }
  return r.status === 0;
};

async function counts() {
  const db = await connect();
  const one = async (sql, p = []) => Number((await db.query(sql, p)).rows[0]?.n ?? 0);
  const c = {
    categories: await one(`SELECT count(*)::int AS n FROM categories`),
    catalogue: await one(
      /* museum and studio works exist only after an import; the demo seed also uses site images */
      `SELECT count(*)::int AS n FROM works WHERE media_key LIKE $1 OR media_key LIKE $2`,
      ["nft/open-access/%", "nft/studio/%"]),
    photos: await one(`SELECT count(*)::int AS n FROM creator_photos`),
  };
  await db.close();
  return c;
}

/* 2. database */
run("db-setup.mjs");
let c = await counts();

/* 3. demo data */
if (c.categories === 0) {
  say("Loading demo data…");
  run("seed.mjs");
}

/* 4. catalogue images */
const csv = path.join(NFT_DIR, "catalog.csv");
if (!existsSync(csv)) {
  say("First run: downloading and rendering the catalogue images (a few minutes)…");
  if (!run("catalog-fetch.mjs", [], { optional: true }) && !existsSync(csv)) {
    say("The catalogue could not be prepared (see the message above). Starting with the demo data; it will retry next time.");
  }
}

/* 5. catalogue */
c = await counts();
if (c.catalogue === 0 && existsSync(csv)) {
  say("Importing the catalogue…");
  run("catalog-import.mjs");
}

/* 6. artist photos */
if (c.photos === 0 && existsSync(path.join(CREATORS_DIR, "credits.json"))) {
  say("Attaching artist photos…");
  run("creator-photos.mjs", [], { optional: true });
}

/* 7. on a serverless host without DATABASE_URL: ship the demo database as one archive */
if (process.env.VERCEL && process.env.PGLITE_DIR) {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(process.env.PGLITE_DIR);
  await db.waitReady;
  const archive = await db.dumpDataDir("gzip");
  await db.close();
  writeFileSync(path.join(ROOT, ".data", "deploy-db.tar.gz"), new Uint8Array(await archive.arrayBuffer()));
  say(`Packed the demo database (${Math.round(archive.size / 1024 / 1024)} MB) to ship with the site.`);
}

say("Ready.");
