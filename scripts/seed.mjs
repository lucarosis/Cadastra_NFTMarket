/* Seeds the database from the original static demo modules.
   Re-runnable: clears the seeded tables first.

   Usage: npm run db:seed
          DATABASE_URL=… npm run db:seed

   Amounts are stored in minor units of 1e-6 (the same scale as
   mutez), so Stage 2's switch to tez is a value change, not a
   scale change. */

import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

/* The demo catalogue was written in ETH. Terra Ledger sells in tez, so the
   seeder restates every figure once, here, using documented reference rates.
   These are demo values — replace the fixtures with real tez prices and the
   conversion drops away. */
const MUTEZ = 1_000_000;
const DEMO_ETH_USD = 3_480;   /* the old fixed rate in the demo data */
const DEMO_XTZ_USD = 0.80;    /* reference rate used for the one-off restatement */
const ETH_TO_TEZ = DEMO_ETH_USD / DEMO_XTZ_USD;

/* ETH figure -> whole mutez, rounded to a tidy number of tez */
const toMinor = (eth) => Math.round(eth * ETH_TO_TEZ) * MUTEZ;
const key = (p) => String(p).replace(/^\/+/, "");
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const src = (f) => pathToFileURL(path.join(process.cwd(), "seed-data", f)).href;
const { DESIGNS, TOP_SALES_TODAY, TOP_BUYERS, SALES_KPIS, SEED_SUGGESTIONS, MOST_LIKED } =
  await import(src("data.ts"));
const { DROPS, PARTNERS } = await import(src("drops.ts"));
const { CREATORS } = await import(src("creators.ts"));
const { CATEGORY_SEED, WORK_TAXONOMY, DROP_TAXONOMY, CATEGORY_STATS_SEED } =
  await import(src("taxonomy.ts"));

/* ---------- connection ---------- */
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let query, close, target;
if (url) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  query = (sql, params = []) => client.query(sql, params);
  close = () => client.end();
  target = "PostgreSQL (DATABASE_URL)";
} else {
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DIR ?? ".data/pglite";
  await mkdir(dir, { recursive: true });
  const db = new PGlite(dir);
  await db.waitReady;
  query = (sql, params = []) => db.query(sql, params);
  close = () => db.close();
  target = `${dir} (PGlite)`;
}
const one = async (sql, params) => (await query(sql, params)).rows[0];

/* The seeder replaces the catalogue with demo works. Once real works have been
   imported (npm run catalog:import), refuse unless told explicitly. */
const demoCodes = DESIGNS.map((d) => d.id);
const real = (await query(`SELECT count(*)::int AS n FROM works WHERE NOT (code = ANY($1))`, [demoCodes])).rows[0]?.n ?? 0;
if (real > 0 && !process.argv.includes("--force")) {
  console.error(`The database holds ${real} imported work(s) that a reseed would delete.`);
  console.error("Run `npm run db:seed -- --force` if that is really what you want.");
  await close();
  process.exit(1);
}

/* Review links are credentials: 128 random bits, never derived from the work code. */
const reviewToken = () => `rv_${randomBytes(16).toString("hex")}`;

/* Confirmed creator portraits are real, checked data (scripts/creator-photos.mjs),
   not demo fixtures. Keep them across a reseed. */
const keptPhotos = (await query(`
  SELECT c.slug, l.code AS licence, p.media_key, p.author, p.source_url, p.attribution, p.width, p.height,
         p.subject, p.confirmed_by, p.confirmed_at, p.focus, p.kind
  FROM creator_photos p JOIN creators c ON c.id = p.creator_id LEFT JOIN licences l ON l.id = p.licence_id`)).rows;

/* ---------- reset ---------- */
for (const t of [
  "suggestions", "featured_works", "creator_photos", "drops", "works", "category_stats",
  "market_hourly_high", "top_buyers", "site_stats", "subcategories", "categories",
  "partners", "creators", "licences",
]) await query(`DELETE FROM ${t}`);

/* ---------- licences ---------- */
const licenceIds = {};
for (const l of [
  ["CC0", "CC0 1.0 Public Domain Dedication", "https://creativecommons.org/publicdomain/zero/1.0/", true, false, null],
  ["CC-BY-SA-4.0", "Creative Commons Attribution-ShareAlike 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", true, true, "Credit line required"],
  ["CC-BY-3.0", "Creative Commons Attribution 3.0", "https://creativecommons.org/licenses/by/3.0/", true, true, "Credit line required"],
  ["PD", "Public domain", null, true, false, "Verify the claim before publishing"],
  ["UNSPLASH", "Unsplash Licence", "https://unsplash.com/license", true, false, "Placeholder imagery, not commissioned work"],
  ["PROPRIETARY", "All rights reserved", null, false, false, "Needs a written licence before display"],
]) {
  const r = await one(
    `INSERT INTO licences (code, name, url, allows_commercial, requires_attribution, notes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, l);
  licenceIds[l[0]] = r.id;
}

/* ---------- categories and subcategories ---------- */
const catIds = {};
const subIds = {};
for (const [i, c] of CATEGORY_SEED.entries()) {
  const r = await one(
    `INSERT INTO categories (slug, name, blurb, sort) VALUES ($1,$2,$3,$4) RETURNING id`,
    [c.slug, c.name, c.blurb, i]);
  catIds[c.slug] = r.id;
  for (const [j, sub] of c.subcategories.entries()) {
    const sr = await one(
      `INSERT INTO subcategories (category_id, slug, name, sort, restricted)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [r.id, sub.slug, sub.name, j, Boolean(sub.restricted)]);
    subIds[`${c.slug}/${sub.slug}`] = sr.id;
  }
}

/* ---------- partners ---------- */
const partnerIds = {};
for (const p of PARTNERS) {
  const r = await one(
    `INSERT INTO partners (slug, name, sector, since_year, seasons, releases, tone)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [p.slug, p.name, p.sector, p.since, p.seasons, p.releases, p.tone]);
  partnerIds[p.slug] = r.id;
}

/* ---------- creators (editorial top 10) ---------- */
const creatorIds = {};
for (const c of CREATORS) {
  const r = await one(
    `INSERT INTO creators (slug, name, real_name, base, known_for, bio, hue, headline_value,
       headline_caption, is_editorial, editorial_rank, anonymous)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10,$11) RETURNING id`,
    [c.slug, c.name, c.realName ?? null, c.base, c.known, c.bio, c.hue,
     c.headline.value, c.headline.caption, c.rank,
     /* no photograph can exist for these two */
     c.slug === "pak" || c.slug === "xcopy"]);
  creatorIds[c.slug] = r.id;

  for (const [i, w] of c.works.entries()) {
    await query(
      `INSERT INTO featured_works (creator_id, title, year, note, media_key, licence_id, sort, verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,false)`,
      [r.id, w.title, w.year, w.note, w.image ? key(w.image) : null, null, i]);
  }
}

for (const p of keptPhotos) {
  if (!creatorIds[p.slug]) continue;
  await query(
    `INSERT INTO creator_photos (creator_id, media_key, licence_id, author, source_url, attribution,
       width, height, subject, confirmed_by, confirmed_at, focus, kind)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [creatorIds[p.slug], p.media_key, licenceIds[p.licence] ?? null, p.author, p.source_url, p.attribution,
     p.width, p.height, p.subject, p.confirmed_by, p.confirmed_at, p.focus, p.kind ?? "portrait"]);
}
if (keptPhotos.length) console.log(`Kept ${keptPhotos.length} confirmed creator portrait(s).`);

/* ---------- works ---------- */
const workIds = {};
for (const d of DESIGNS) {
  const r = await one(
    `INSERT INTO works (code, title, slug, creator_name, studio, category_id, status,
       price_amount_minor, price_currency, likes, owners, editions, minted_at, review_token,
       brief, media_key, licence_id, royalty_bps)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'XTZ',$9,$10,$11,$12,$13,$14,$15,$16,1000) RETURNING id`,
    [d.id, d.name, slugify(d.name), d.designer, d.studio, catIds[WORK_TAXONOMY[d.id][0]], d.status,
     toMinor(d.priceEth), d.likes, d.owners, d.editions, d.mintedAt, reviewToken(),
     d.brief, key(d.image), licenceIds.UNSPLASH]);
  await query(`UPDATE works SET subcategory_id = $1 WHERE id = $2`,
    [subIds[WORK_TAXONOMY[d.id].join("/")], r.id]);
  workIds[d.id] = r.id;
}

/* fair-value estimates (green chart) */
for (const m of MOST_LIKED) {
  await query(`UPDATE works SET fair_value_minor = $1 WHERE code = $2`, [toMinor(m.fairEth), m.id]);
}

/* ---------- drops ---------- */
for (const d of DROPS) {
  await query(
    `INSERT INTO drops (code, title, partner_id, studio, category_id, release_date, supply,
       price_amount_minor, price_currency, season, status, media_key, blurb, minted_pct)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'XTZ',$9,$10,$11,$12,$13)`,
    [d.id, d.title, partnerIds[d.partner], d.studio, catIds[DROP_TAXONOMY[d.id]], d.date, d.supply,
     toMinor(d.priceEth), d.season, d.status, key(d.image), d.blurb, d.status === "Live" ? 64 : 0]);
}

/* ---------- designer suggestions ---------- */
for (const s of SEED_SUGGESTIONS) {
  const workId = workIds[s.designId];
  if (!workId) continue;
  await query(
    `INSERT INTO suggestions (work_id, author, body, status, created_at) VALUES ($1,$2,$3,$4,$5)`,
    [workId, s.author, s.body, s.status, s.createdAt]);
}

/* ---------- dashboard figures ---------- */
for (const p of TOP_SALES_TODAY) {
  await query(
    `INSERT INTO market_hourly_high (hour, amount_minor, currency, work_code, work_title)
     VALUES ($1,$2,'XTZ',$3,$4)`, [p.hour, toMinor(p.eth), p.id, p.name]);
}
for (const b of TOP_BUYERS) {
  await query(
    `INSERT INTO top_buyers (handle, wallet, region, purchases, volume_minor, currency, since)
     VALUES ($1,$2,$3,$4,$5,'XTZ',$6)`,
    [b.handle, b.wallet, b.region, b.purchases, toMinor(b.volumeEth), b.since]);
}
for (const [slug, st] of Object.entries(CATEGORY_STATS_SEED)) {
  await query(
    `INSERT INTO category_stats (category_id, designs, designers, volume_minor, currency)
     VALUES ($1,$2,$3,$4,'XTZ')`,
    [catIds[slug], st.designs, st.designers, st.volumeTez * MUTEZ]);
}
for (const [i, k] of SALES_KPIS.entries()) {
  await query(
    `INSERT INTO site_stats (key, label, value, sub, delta, sort) VALUES ($1,$2,$3,$4,$5,$6)`,
    [slugify(k.label), k.label, k.value, k.sub, k.delta, i]);
}

const count = async (t) => Number((await one(`SELECT count(*)::int AS n FROM ${t}`)).n);
console.log(`Seeded ${target}:`);
for (const t of ["licences", "categories", "partners", "creators", "featured_works", "works",
  "drops", "suggestions", "market_hourly_high", "top_buyers", "category_stats", "site_stats"]) {
  console.log(`  ${t.padEnd(20)} ${await count(t)}`);
}
await close();
