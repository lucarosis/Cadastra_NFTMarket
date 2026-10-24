/* ============================================================
   The only route that can reach sellable artwork.

   Source files live outside /public, so they have no URL of
   their own and cannot be fetched, hotlinked or crawled
   directly. Storage keys come from the database.

   Who gets what:
     visitor (no session)   → listed works and drops only:
                              480px, watermarked "Terra Ledger"
     member                 → listed works and drops: 1000px, clean
     sales team             → also works not yet listed
     designer review link   → 1000px, clean, that one asset only
                              (?rt=<reviewToken>)
     anything else          → 404

   A rendered image can always be screenshotted — this stops the
   original file from being downloadable, which is what makes it
   a sales platform rather than a public image host.
   ============================================================ */

import { timingSafeEqual } from "node:crypto";
import { getMediaInfo } from "@/lib/repo";
import { getViewer } from "@/lib/viewer";
import { derivative, resolveMaster, type Tier } from "@/lib/media-render";

export const dynamic = "force-dynamic";

const notFound = () => new Response("Not found", { status: 404 });

function sameToken(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const asset = await getMediaInfo(id);
  if (!asset) return notFound();

  /* drops are announced publicly; works are public only once listed */
  /* drops are announced publicly unless they reuse an unlisted work's image */
  const listed = asset.kind === "drop" ? asset.status !== "Unlisted" : asset.status === "Live";
  const reviewOk = sameToken(new URL(request.url).searchParams.get("rt"), asset.reviewToken);

  let tier: Tier | null = null;
  if (reviewOk) {
    tier = "full";
  } else {
    const viewer = await getViewer();
    if (viewer) tier = listed || viewer.role === "sales" ? "full" : null;
    else tier = listed ? "preview" : null;
  }
  if (!tier) return notFound();

  const file = resolveMaster(asset.key);
  if (!file) return notFound();

  const out = await derivative(file, tier);
  if (!out) return notFound();

  return new Response(new Uint8Array(out), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(out.byteLength),
      "Content-Disposition": `inline; filename="${id}${tier === "preview" ? "-preview" : ""}.jpg"`,
      /* per-viewer output: never store in a shared cache */
      "Cache-Control": "private, max-age=300, must-revalidate",
      Vary: "Cookie",
      "X-Robots-Tag": "noindex, noimageindex",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
