/* Attaches portraits to the top-10 creators.

   Usage:  npm run creators:photos               (reads public/assets/creators/credits.json)
           npm run creators:photos -- --dry-run

   A portrait is a photograph of a real, named person, so this script is strict:
     • every photo needs a licence and, where the licence asks, a credit line;
     • someone must confirm, by name, that the photo shows that creator
       (`confirmedBy`) — the site shows nothing that has not been checked;
     • anonymous creators (Pak, XCOPY) cannot have a portrait — no photograph can
       show them, so any photo would show someone else. They may have an
       `"kind": "avatar"`: artwork they use in place of a face, captioned as such;
     • the same image on two creators is refused, since one of them must be wrong.
   The image is served as supplied (resized only), never cropped or altered;
   `focus` (CSS object-position, e.g. "50% 30%") keeps the face in the frame.

   Format: docs/creator-credits.example.json. Files go in public/assets/creators/. */

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { connect } from "./lib/db.mjs";

import { CREATORS_DIR as DIR, shown } from "./lib/assets.mjs";
const dryRun = process.argv.includes("--dry-run");
const manifestPath = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? path.join(DIR, "credits.json");

let entries;
try {
  entries = JSON.parse(await readFile(manifestPath, "utf8"));
} catch (e) {
  console.error(`Cannot read ${manifestPath}: ${e.code === "ENOENT" ? "file not found" : e.message}`);
  console.error(`Copy docs/creator-credits.example.json to ${shown(DIR)}/credits.json and fill it in.`);
  process.exit(1);
}
if (!Array.isArray(entries)) {
  console.error("credits.json must be a list of entries.");
  process.exit(1);
}

const db = await connect();
const creators = (await db.query(`SELECT id, slug, name, real_name, anonymous FROM creators`)).rows;
const licences = (await db.query(`SELECT id, code, requires_attribution, allows_commercial FROM licences`)).rows;

const errors = [];
const warnings = [];
const seenCreators = new Set();
const seenHashes = new Map();
const plan = [];
const words = (s) => String(s ?? "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);

for (const [i, e] of entries.entries()) {
  const at = `entry ${i + 1}${e?.creator ? ` (${e.creator})` : ""}`;
  const fail = (m) => errors.push(`${at}: ${m}`);

  const c = creators.find((x) => x.slug === String(e.creator ?? "").trim().toLowerCase());
  if (!c) {
    fail(`unknown creator — use one of: ${creators.map((x) => x.slug).join(", ")}`);
    continue;
  }
  const kind = e.kind === "avatar" ? "avatar" : e.kind === undefined || e.kind === "portrait" ? "portrait" : null;
  if (!kind) fail(`kind "${e.kind}" must be "portrait" or "avatar"`);
  if (c.anonymous && kind !== "avatar") {
    fail(`${c.name} is anonymous. No photograph can show them, so a portrait would show someone else. Use "kind": "avatar" for artwork they use instead of a face, or remove this entry.`);
    continue;
  }
  if (seenCreators.has(c.slug)) fail("this creator appears twice");
  seenCreators.add(c.slug);

  if (!e.subject) fail('"subject" is required: who the photograph shows, e.g. "Mike Winkelmann (Beeple)"');
  if (!e.confirmedBy) fail('"confirmedBy" is required: the name of the person who checked the photo shows this creator');

  /* a sanity check against mix-ups, not a substitute for confirmedBy */
  if (e.subject && kind === "portrait") {
    const known = new Set([...words(c.name), ...words(c.real_name)]);
    if (!words(e.subject).some((w) => known.has(w))) {
      warnings.push(`${at}: subject "${e.subject}" does not mention ${c.name}${c.real_name ? ` or ${c.real_name}` : ""} — check the file is the right person`);
    }
  }

  const lic = licences.find((l) => l.code.toLowerCase() === String(e.licence ?? "").toLowerCase());
  if (!lic) fail(`unknown licence "${e.licence ?? ""}" — use one of: ${licences.map((l) => l.code).join(", ")}`);
  else {
    if (lic.code === "PROPRIETARY" && !e.permission) {
      fail('"PROPRIETARY" needs "permission": a note of the written permission (who granted it, and when)');
    }
    if (lic.requires_attribution && !e.attribution && !e.author) fail(`${lic.code} requires a credit: give "author" or "attribution"`);
    if (lic.code === "UNSPLASH") warnings.push(`${at}: an Unsplash photo of a named person may still need their consent for commercial use`);
  }
  if (!e.sourceUrl) warnings.push(`${at}: no "sourceUrl" — record where the photo came from`);
  if (e.focus && !/^\d{1,3}% \d{1,3}%$/.test(String(e.focus))) fail(`focus "${e.focus}" must look like "50% 30%"`);

  const rel = String(e.file ?? "").replace(/\\/g, "/").replace(/^\/+/, "");
  const file = path.join(DIR, rel);
  let size = null;
  if (!rel || !file.startsWith(DIR + path.sep)) fail(`"file" must be a file name inside ${shown(DIR)}/`);
  else {
    try {
      const buf = await readFile(file);
      const hash = createHash("sha256").update(buf).digest("hex");
      if (seenHashes.has(hash)) fail(`same image as ${seenHashes.get(hash)} — one of the two is the wrong person`);
      seenHashes.set(hash, c.slug);
      const meta = await sharp(buf).metadata();
      if (!meta.width || !meta.height) fail(`${rel} is not a readable image`);
      else {
        size = { width: meta.width, height: meta.height };
        if (Math.min(meta.width, meta.height) < 600) warnings.push(`${at}: ${rel} is ${meta.width}×${meta.height}; 900px or more looks sharp`);
      }
    } catch (x) {
      fail(`cannot read ${shown(DIR)}/${rel} (${x.code === "ENOENT" ? "file not found" : x.message})`);
    }
  }

  plan.push({ c, lic, rel, size, e, kind });
}

for (const w of warnings) console.warn(`warning  ${w}`);
if (errors.length) {
  for (const x of errors) console.error(`error    ${x}`);
  console.error(`\n${errors.length} error(s). Nothing was changed.`);
  await db.close();
  process.exit(1);
}

console.log("Creator            Kind      File                       Shows");
for (const p of plan) {
  console.log(`${p.c.name.padEnd(18)} ${p.kind.padEnd(9)} ${p.rel.padEnd(26)} ${String(p.e.subject)}`);
}
const missing = creators.filter((c) => !c.anonymous && !seenCreators.has(c.slug)).map((c) => c.name);
if (missing.length) console.log(`\nNo portrait yet: ${missing.join(", ")}`);

if (dryRun) {
  console.log("\nDry run — nothing written.");
  await db.close();
  process.exit(0);
}

await db.query("BEGIN");
try {
  for (const p of plan) {
    await db.query(`DELETE FROM creator_photos WHERE creator_id = $1`, [p.c.id]);
    await db.query(
      `INSERT INTO creator_photos (creator_id, media_key, licence_id, author, source_url, attribution,
         width, height, subject, confirmed_by, confirmed_at, focus, kind)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),$11,$12)`,
      [p.c.id, `creators/${p.rel}`, p.lic.id, p.e.author ?? null, p.e.sourceUrl ?? null,
       p.e.attribution ?? null, p.size?.width ?? null, p.size?.height ?? null,
       p.e.subject, p.e.confirmedBy, p.e.focus ?? null, p.kind]);
  }
  await db.query("COMMIT");
} catch (x) {
  await db.query("ROLLBACK");
  console.error("Failed and rolled back:", x.message);
  await db.close();
  process.exit(1);
}

console.log(`\n${plan.length} portrait(s) attached.`);
await db.close();
