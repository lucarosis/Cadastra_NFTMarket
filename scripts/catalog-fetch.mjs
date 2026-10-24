/* Builds the catalogue's images and spreadsheet from seed-data/catalog-sources.json.

   Usage:  npm run catalog:fetch             (then: npm run catalog:import)
           npm run catalog:fetch -- --refresh   (re-download images already present)

   Rebuilds the artwork in public/assets/nft/ from its sources, if it is ever missing:
     site    terraledger.org's own assets — property and edition images, game art
     met     public-domain works from The Metropolitan Museum of Art Open Access
             (images released under CC0), with title, maker, date and source link
     studio  the Terra Ledger Studio generative series, rendered from code

   Writes public/assets/nft/{site,open-access,studio}/… and public/assets/nft/catalog.csv. */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { render } from "./lib/generative.mjs";

import { NFT_DIR as ROOT, shown } from "./lib/assets.mjs";
const refresh = process.argv.includes("--refresh");
const MET = "https://collectionapi.metmuseum.org/public/collection/v1/objects";
const MAX = 2000; /* long side kept; members see 1000px, previews 480px */

const src = JSON.parse(await readFile(path.join(process.cwd(), "seed-data", "catalog-sources.json"), "utf8"));
const slugify = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, as = "buffer") {
  /* museum APIs rate-limit bursts: back off and retry rather than skip a work */
  for (let i = 0; i < 7; i++) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "TerraLedger-catalog/1.0" }, signal: AbortSignal.timeout(90_000) });
      if (r.ok) return as === "json" ? r.json() : as === "text" ? r.text() : Buffer.from(await r.arrayBuffer());
      if (r.status === 404) return null;
      /* 403 / 429: the museum's bot protection — wait it out rather than skip the work */
      if (r.status === 403 || r.status === 429) { await sleep(4000 * (i + 1)); continue; }
    } catch {
      /* retry */
    }
    await sleep(1500 * (i + 1));
  }
  return null;
}

async function save(rel, make) {
  const file = path.join(ROOT, rel);
  if (existsSync(file) && !refresh) return true;
  const buf = await make();
  if (!buf) return false;
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buf);
  return true;
}

const toJpeg = (input) =>
  sharp(input).rotate().resize({ width: MAX, height: MAX, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#0c0c14" }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();

/* a download that failed after its retries is skipped and reported, not fatal */
const toJpegOrNull = (input) => (input ? toJpeg(input) : null);

/* an icon on a square stage, so a small vector reads as a full artwork */
async function iconArtwork(svg) {
  const icon = await sharp(Buffer.from(svg), { density: 1200 }).resize(1180, 1180).png().toBuffer();
  return sharp({ create: { width: 1600, height: 1600, channels: 3, background: "#0c0c14" } })
    .composite([{ input: icon, left: 210, top: 210 }]).jpeg({ quality: 90 }).toBuffer();
}

/* tez per US dollar, for the property tokens priced in USD on the website */
async function usdPerTez() {
  if (process.env.XTZ_USD) return Number(process.env.XTZ_USD);
  const j = await get("https://api.coingecko.com/api/v3/simple/price?ids=tezos&vs_currencies=usd", "json");
  const usd = j?.tezos?.usd;
  if (!usd) throw new Error("Could not read the XTZ/USD rate. Set XTZ_USD=… and run again.");
  return usd;
}

const rows = [];
const failed = [];

/* ---------- terraledger.org ---------- */
const rate = await usdPerTez();
for (const s of src.site) {
  const rel = `site/${slugify(s.title)}.jpg`;
  const ok = await save(rel, async () => {
    if (s.image.unsplash) return toJpegOrNull(await get(`https://images.unsplash.com/photo-${s.image.unsplash}?fm=jpg&w=${MAX}&q=88`));
    if (s.image.svg) return iconArtwork(await get(s.image.svg, "text"));
    if (s.image.png) return toJpegOrNull(await get(s.image.png));
    return null;
  });
  if (!ok) { failed.push(s.title); continue; }
  const priceTez = s.price_tez ?? Math.round(s.price_usd / rate);
  rows.push({ ...s, price_tez: priceTez, file: rel.replace(/^/, ""), released: "" });
}
console.log(`site: ${rows.length} works (1 ꜩ = $${rate})`);

/* ---------- The Met Open Access ---------- */
const GENERIC = /^(helmet|sword|shield|armor|armour|dagger|dagger \(.*\)|close helmet)$/i;
/* Each work's museum record is kept in catalog-sources.json, so a first run only downloads
   images: The Met's API blocks bursts of requests (HTTP 403). Entries without a record
   fall back to the API. */
async function metRecord(m) {
  if (m.meta) {
    const x = m.meta;
    return { isPublicDomain: true, title: x.title, artistDisplayName: x.artist, culture: x.culture, objectDate: x.date,
      medium: x.medium, creditLine: x.creditLine, objectURL: x.url, primaryImage: x.image, primaryImageSmall: x.imageSmall };
  }
  return get(`${MET}/${m.id}`, "json");
}

async function metRow(m) {
  const o = await metRecord(m);
  if (!o?.isPublicDomain) { failed.push(`met ${m.id} (not public domain or unavailable)`); return null; }

  let title = String(o.title).replace(/^\[|\]$/g, "").split(/, from the (?:series|album|book)/i)[0].trim();
  if (title.length > 70) title = title.split(" (")[0];
  const maker = o.artistDisplayName || (o.culture ? `${o.culture} maker` : "Unknown maker");
  if (GENERIC.test(title)) title = `${title} · ${o.culture || o.objectDate}`;

  const rel = `open-access/met-${m.id}.jpg`;
  const ok = await save(rel, async () => {
    const big = o.primaryImage ? await get(o.primaryImage) : null;
    return toJpegOrNull(big ?? (await get(o.primaryImageSmall)));
  });
  if (!ok) { failed.push(`met ${m.id} (image)`); return null; }

  const what = [o.medium, o.objectDate].filter(Boolean).join(", ");
  return {
    code: "", title, creator: maker, studio: "Public domain · The Met",
    category: m.category, subcategory: m.subcategory, price_tez: m.price_tez, editions: m.editions, placed: "",
    status: "Live", file: rel, licence: "CC0", source_url: o.objectURL,
    royalty_pct: 0, /* public domain: no living artist to pay */
    attribution: "The Metropolitan Museum of Art, Open Access. Public domain; image released under CC0.",
    description: `${o.title}${o.artistDisplayName ? ` by ${o.artistDisplayName}` : ""}${what ? ` — ${what}` : ""}. A public-domain work from The Met collection${o.creditLine ? ` (${o.creditLine})` : ""}.`,
    released: "",
  };
}

/* three at a time: quick, and gentle enough on the museum's servers; order is kept */
const metRows = new Array(src.met.length).fill(null);
let next = 0, done = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (next < src.met.length) {
    const i = next++;
    metRows[i] = await metRow(src.met[i]);
    if (++done % 15 === 0) console.log(`  museum works: ${done} / ${src.met.length}`);
    await sleep(150);
  }
}));
const metCount = metRows.filter(Boolean).length;
rows.push(...metRows.filter(Boolean));
console.log(`met: ${metCount} works`);

/* ---------- Terra Ledger Studio ---------- */
for (const s of src.studio) {
  const rel = `studio/${slugify(s.title)}.jpg`;
  await save(rel, () => sharp(Buffer.from(render(s.style, s.seed))).jpeg({ quality: 92 }).toBuffer());
  rows.push({
    code: "", title: s.title, creator: "Terra Ledger Studio", studio: "Terra Ledger Studio",
    category: "art", subcategory: "generative", price_tez: s.price_tez, editions: s.editions, placed: "",
    status: "Live", file: rel, licence: "PROPRIETARY", source_url: "", attribution: "",
    description: `Generative work rendered from code (style “${s.style}”, seed ${s.seed}). The same seed always draws the same image.`,
    released: "",
  });
}
console.log(`studio: ${src.studio.length} works`);

/* ---------- catalog.csv ---------- */
const COLS = ["code", "title", "creator", "studio", "category", "subcategory", "price_tez", "editions", "placed", "status",
  "file", "description", "royalty_pct", "licence", "source_url", "attribution", "released"];
const cell = (v) => {
  const t = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
const csv = [COLS.join(","), ...rows.map((r) => COLS.map((c) => cell(c === "royalty_pct" ? (r.royalty_pct ?? 10) : r[c])).join(","))].join("\n") + "\n";
await writeFile(path.join(ROOT, "catalog.csv"), csv);

console.log(`\nWrote ${shown(ROOT)}/catalog.csv with ${rows.length} works.`);
if (failed.length) {
  console.warn(`Skipped ${failed.length}: ${failed.join("; ")}`);
  process.exitCode = 1;
}
