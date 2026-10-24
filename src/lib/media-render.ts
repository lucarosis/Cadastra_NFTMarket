/* ============================================================
   Rendering and caching image derivatives (server only).

   Every image the site shows is a derivative of a master file in
   public/assets/: a watermarked preview, a clean 1000px image, or a
   creator portrait. Rendering with sharp is the expensive part,
   so each derivative is written once to MEDIA_CACHE_DIR and served
   from there afterwards. The cache key includes the master's size
   and modification time, so replacing a file invalidates it.
   ============================================================ */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { COMPANY_NAME } from "./site";

/* public/assets is the home of the masters; private/ is still read if they have not moved yet */
const PUBLIC_ASSETS = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "assets");
const OLD_PRIVATE = path.join(/*turbopackIgnore: true*/ process.cwd(), "private");
export const MEDIA_ROOT = existsSync(PUBLIC_ASSETS) || !existsSync(OLD_PRIVATE) ? PUBLIC_ASSETS : OLD_PRIVATE;
/* runtime data, not source: tell the bundler not to trace it into the build */
/* serverless hosts (Vercel) can write only to the temp folder */
const CACHE_DIR = path.resolve(
  /*turbopackIgnore: true*/ process.env.MEDIA_CACHE_DIR ??
    (process.env.VERCEL ? path.join(tmpdir(), "media-cache") : ".data/media-cache"),
);

/* Bump when the rendering below changes, so old derivatives are not reused. */
const RENDER_VERSION = 2;

/** The watermark is the company's name, as on terraledger.org (decision D6). */
export const WATERMARK_TEXT = COMPANY_NAME;

export type Tier = "preview" | "full" | "portrait";

const SPECS: Record<Tier, { width: number; quality: number; watermark: boolean }> = {
  preview: { width: 480, quality: 58, watermark: true },
  full: { width: 1000, quality: 82, watermark: false },
  /* portraits are shown as supplied: resized only — no crop, filter or mark */
  portrait: { width: 900, quality: 86, watermark: false },
};

/** Resolve a storage key from the database to a file inside the media root, or null. */
export function resolveMaster(rel: string): string | null {
  const file = path.join(MEDIA_ROOT, path.normalize(rel).replace(/^([/\\])+/, ""));
  return file.startsWith(MEDIA_ROOT + path.sep) ? file : null;
}

export function watermarkSvg(width: number, height: number, text = WATERMARK_TEXT): Buffer {
  const fontSize = Math.max(12, Math.round(width / 22));
  /* keep tiles wider than the text itself, or the copies overlap into noise */
  const stepX = Math.round(fontSize * text.length * 0.66 + fontSize * 3.2);
  const stepY = Math.round(fontSize * 4.6);
  const safe = text.replace(/[<>&"]/g, "");

  const tiles: string[] = [];
  let row = 0;
  for (let y = -height; y < height * 2; y += stepY, row++) {
    const offset = row % 2 ? stepX / 2 : 0; /* brick pattern */
    for (let x = -width + offset; x < width * 2; x += stepX) {
      tiles.push(`<text x="${Math.round(x)}" y="${y}" class="w">${safe}</text>`);
    }
  }

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
       <style>
         .w{fill:#ffffff;fill-opacity:.34;font-family:sans-serif;font-size:${fontSize}px;font-weight:700;letter-spacing:1px;
            stroke:#000;stroke-opacity:.12;stroke-width:1px;paint-order:stroke}
       </style>
       <g transform="rotate(-30 ${width / 2} ${height / 2})">${tiles.join("")}</g>
     </svg>`,
  );
}

async function render(file: string, tier: Tier): Promise<Buffer> {
  const spec = SPECS[tier];
  const resized = await sharp(file)
    .rotate() /* honour EXIF orientation */
    .resize({ width: spec.width, withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });

  let pipeline = sharp(resized.data);
  if (spec.watermark) {
    pipeline = pipeline.composite([{ input: watermarkSvg(resized.info.width, resized.info.height), blend: "over" }]);
  }
  return pipeline.jpeg({ quality: spec.quality, progressive: true, mozjpeg: true }).toBuffer();
}

/** The derivative for `file` at `tier`, from the cache when it is there. Null if the master is missing. */
export async function derivative(file: string, tier: Tier): Promise<Buffer | null> {
  let info;
  try {
    info = await stat(file);
  } catch {
    return null;
  }

  const key = createHash("sha256")
    .update(`${file}|${tier}|${info.size}|${info.mtimeMs}|v${RENDER_VERSION}|${WATERMARK_TEXT}`)
    .digest("hex");
  const cached = path.join(CACHE_DIR, key.slice(0, 2), `${key}.jpg`);

  try {
    return await readFile(cached);
  } catch {
    /* not rendered yet */
  }

  const out = await render(file, tier);
  try {
    await mkdir(path.dirname(cached), { recursive: true });
    const tmp = `${cached}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmp, out);
    await rename(tmp, cached); /* atomic: a reader never sees half a file */
  } catch (e) {
    console.warn("[media] could not write cache:", (e as Error).message);
  }
  return out;
}
