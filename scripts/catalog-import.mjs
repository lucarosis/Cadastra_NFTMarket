/* Imports the NFT catalogue from a spreadsheet.

   Usage:  npm run catalog:import                       (reads public/assets/nft/catalog.csv)
           npm run catalog:import -- path/to/file.csv
           npm run catalog:import -- --dry-run          (check everything, write nothing)

   One row per work. Template and column notes: docs/catalog-template.csv and
   README → "Adding the catalogue". Image files go in public/assets/nft/.

   Everything is checked before anything is written; if any row has an error the
   import stops and the database is untouched. Re-running is safe: rows are
   matched on `code` — or, when a row has none, on its image file — and likes,
   holders and review links are kept. */

import { createHash, randomBytes } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { connect } from "./lib/db.mjs";
import { parseCsv } from "./lib/csv.mjs";

import { NFT_DIR, shown } from "./lib/assets.mjs";
const MUTEZ = 1_000_000;
const STATUSES = ["Live", "Draft", "In review", "Revision requested"];
const MIN_WIDTH = 1000; /* the clean member image is 1000px wide */

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const csvPath = args.find((a) => !a.startsWith("--")) ?? path.join(NFT_DIR, "catalog.csv");

const slugify = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const norm = (s) => String(s ?? "").trim().toLowerCase();

let text;
try {
  text = await readFile(csvPath, "utf8");
} catch {
  console.error(`No catalogue at ${csvPath}.\nCopy docs/catalog-template.csv there and fill it in.`);
  process.exit(1);
}

const rows = parseCsv(text);
if (!rows.length) {
  console.error("The catalogue has a header but no rows.");
  process.exit(1);
}

const db = await connect();
const errors = [];
const warnings = [];
const err = (row, msg) => errors.push(`line ${row._line}: ${msg}`);
const warn = (row, msg) => warnings.push(`line ${row._line}: ${msg}`);

/* ---------- reference data ---------- */
const cats = (await db.query(`SELECT id, slug, name FROM categories`)).rows;
const subs = (await db.query(`SELECT id, category_id, slug, name FROM subcategories`)).rows;
const licences = (await db.query(`SELECT id, code FROM licences`)).rows;
const existingRows = (await db.query(`SELECT code, media_key FROM works`)).rows;
const existingCodes = new Set(existingRows.map((r) => r.code));
/* a row without a code is the work already imported from the same file, if any —
   so re-running an import updates works instead of adding them again */
const codeByFile = new Map(existingRows.map((r) => [r.media_key, r.code]));
const maxCode = (await db.query(`SELECT max(substring(code from 4)::int) AS n FROM works WHERE code ~ '^TL-[0-9]+$'`)).rows[0]?.n ?? 0;
let nextNumber = Math.max(Number(maxCode), 1000) + 1;

const findCat = (v) => cats.find((c) => c.slug === norm(v) || norm(c.name) === norm(v));
const findSub = (catId, v) => subs.find((s) => s.category_id === catId && (s.slug === norm(v) || norm(s.name) === norm(v)));

/* ---------- validate every row ---------- */
const seenCodes = new Set();
const seenFiles = new Map();
const seenHashes = new Map();
const plan = [];

for (const row of rows) {
  const title = row.title;
  const creator = row.creator;
  if (!title) err(row, "title is required");
  if (!creator) err(row, "creator is required");

  const fileKey = `nft/${String(row.file ?? "").replace(/\\/g, "/").replace(/^\/+/, "")}`;
  let code = row.code || codeByFile.get(fileKey);
  if (code) {
    if (!/^TL-\d{4,}$/.test(code)) err(row, `code "${code}" should look like TL-1042`);
  } else {
    while (existingCodes.has(`TL-${nextNumber}`) || seenCodes.has(`TL-${nextNumber}`)) nextNumber++;
    code = `TL-${nextNumber++}`;
  }
  if (seenCodes.has(code)) err(row, `code ${code} appears twice`);
  seenCodes.add(code);

  const cat = findCat(row.category);
  if (!cat) err(row, `unknown category "${row.category}" — use one of: ${cats.map((c) => c.slug).join(", ")}`);
  let sub = null;
  if (cat && row.subcategory) {
    sub = findSub(cat.id, row.subcategory);
    if (!sub) {
      const opts = subs.filter((s) => s.category_id === cat.id).map((s) => s.slug).join(", ");
      err(row, `unknown subcategory "${row.subcategory}" for ${cat.slug} — use one of: ${opts}`);
    }
  }

  const priceTez = Number(String(row.price_tez ?? "").replace(/[,\s]/g, ""));
  if (!Number.isFinite(priceTez) || priceTez <= 0) err(row, `price_tez "${row.price_tez}" must be a number above 0`);

  const editions = row.editions ? Number(row.editions) : 1;
  if (!Number.isInteger(editions) || editions < 1) err(row, `editions "${row.editions}" must be a whole number of at least 1`);

  const status = row.status ? STATUSES.find((s) => norm(s) === norm(row.status)) : "Live";
  if (!status) err(row, `status "${row.status}" must be one of: ${STATUSES.join(", ")}`);

  const royaltyPct = row.royalty_pct === undefined || row.royalty_pct === "" ? 10 : Number(row.royalty_pct);
  if (!Number.isFinite(royaltyPct) || royaltyPct < 0 || royaltyPct > 25) err(row, `royalty_pct "${row.royalty_pct}" must be between 0 and 25`);

  const licenceCode = row.licence || "PROPRIETARY";
  const licence = licences.find((l) => norm(l.code) === norm(licenceCode));
  if (!licence) err(row, `unknown licence "${licenceCode}" — use one of: ${licences.map((l) => l.code).join(", ")}`);

  const placed = row.placed ? Number(String(row.placed).replace(/[,\s]/g, "")) : null;
  if (placed !== null && (!Number.isInteger(placed) || placed < 0 || placed > editions)) {
    err(row, `placed "${row.placed}" must be a whole number between 0 and editions (${row.editions || 1})`);
  }

  const sourceUrl = row.source_url || null;
  if (sourceUrl && !/^https:\/\//.test(sourceUrl)) err(row, `source_url "${sourceUrl}" must start with https://`);
  if (licence && ["CC-BY-SA-4.0", "CC-BY-3.0"].includes(licence.code) && !row.attribution) {
    err(row, `${licence.code} requires an attribution (credit line)`);
  }

  const released = row.released || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(released)) err(row, `released "${row.released}" must be YYYY-MM-DD`);

  /* the image */
  const rel = String(row.file ?? "").replace(/\\/g, "/").replace(/^\/+/, "");
  const file = path.join(NFT_DIR, rel);
  if (!rel) err(row, `file is required (a file name inside ${shown(NFT_DIR)}/)`);
  else if (!file.startsWith(NFT_DIR + path.sep)) err(row, `file "${row.file}" must be inside ${shown(NFT_DIR)}/`);
  else {
    if (seenFiles.has(rel)) err(row, `file ${rel} is also used on line ${seenFiles.get(rel)}`);
    seenFiles.set(rel, row._line);
    try {
      await stat(file);
      const buf = await readFile(file);
      const hash = createHash("sha256").update(buf).digest("hex");
      if (seenHashes.has(hash)) err(row, `image is identical to the one on line ${seenHashes.get(hash)} — each work must be distinct`);
      seenHashes.set(hash, row._line);
      const meta = await sharp(buf).metadata();
      if (!meta.width) err(row, `${rel} is not a readable image`);
      else if (meta.width < MIN_WIDTH) warn(row, `${rel} is ${meta.width}px wide; ${MIN_WIDTH}px or more keeps members' images sharp`);
    } catch (e) {
      err(row, `cannot read ${shown(NFT_DIR)}/${rel} (${e.code === "ENOENT" ? "file not found" : e.message})`);
    }
  }

  plan.push({
    code, title, creator, studio: row.studio || creator, catId: cat?.id, subId: sub?.id ?? null,
    priceMutez: Math.round(priceTez * MUTEZ), editions, status, royaltyBps: Math.round(royaltyPct * 100),
    licenceId: licence?.id, released, releasedGiven: Boolean(row.released), mediaKey: `nft/${rel}`, description: row.description || null,
    placed, sourceUrl, attribution: row.attribution || null,
    isNew: !existingCodes.has(code),
  });
}

/* ---------- report ---------- */
for (const w of warnings) console.warn(`warning  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error    ${e}`);
  console.error(`\n${errors.length} error(s). Nothing was imported.`);
  await db.close();
  process.exit(1);
}

const added = plan.filter((p) => p.isNew).length;
console.log(`${rows.length} rows checked: ${added} new, ${rows.length - added} updated. Target: ${db.target}`);
if (dryRun) {
  console.log("Dry run — nothing written.");
  await db.close();
  process.exit(0);
}

/* ---------- write, all or nothing ---------- */
await db.query("BEGIN");
try {
  for (const p of plan) {
    await db.query(
      `INSERT INTO works (code, title, slug, creator_name, studio, category_id, subcategory_id, status,
         price_amount_minor, price_currency, editions, minted_at, review_token, description, media_key,
         licence_id, royalty_bps, source_url, attribution, owners)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'XTZ',$10,$11,$12,$13,$14,$15,$16,$17,$18,COALESCE($19::int, 0))
       ON CONFLICT (code) DO UPDATE SET
         title = EXCLUDED.title, creator_name = EXCLUDED.creator_name, studio = EXCLUDED.studio,
         category_id = EXCLUDED.category_id, subcategory_id = EXCLUDED.subcategory_id,
         status = EXCLUDED.status, price_amount_minor = EXCLUDED.price_amount_minor,
         editions = EXCLUDED.editions,
         minted_at = CASE WHEN $20::boolean THEN EXCLUDED.minted_at ELSE COALESCE(works.minted_at, EXCLUDED.minted_at) END,
         description = EXCLUDED.description, media_key = EXCLUDED.media_key,
         licence_id = EXCLUDED.licence_id, royalty_bps = EXCLUDED.royalty_bps,
         source_url = EXCLUDED.source_url, attribution = EXCLUDED.attribution,
         owners = CASE WHEN $19::int IS NULL THEN works.owners ELSE EXCLUDED.owners END`,
      [p.code, p.title, `${slugify(p.title)}-${p.code.toLowerCase()}`, p.creator, p.studio, p.catId, p.subId,
       p.status, p.priceMutez, p.editions, p.released, `rv_${randomBytes(16).toString("hex")}`,
       p.description, p.mediaKey, p.licenceId, p.royaltyBps, p.sourceUrl, p.attribution, p.placed,
       p.releasedGiven]);
  }
  await db.query("COMMIT");
} catch (e) {
  await db.query("ROLLBACK");
  console.error("Import failed and was rolled back:", e.message);
  await db.close();
  process.exit(1);
}

const total = (await db.query(`SELECT count(*)::int AS n FROM works WHERE status = 'Live'`)).rows[0].n;
console.log(`Imported. ${total} works are now listed.`);
await db.close();
