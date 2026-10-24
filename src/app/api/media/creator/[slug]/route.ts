/* Creator portraits.

   Only a portrait someone has confirmed shows that creator is served
   (scripts/creator-photos.mjs records who checked it), and never for an
   anonymous creator. The photograph is resized only — no crop, filter or
   watermark — so the person is shown as the photographer captured them.
   Cropping to the frame happens in CSS, around the recorded focus point. */

import { getCreatorPhotoKey } from "@/lib/repo";
import { derivative, resolveMaster } from "@/lib/media-render";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const key = await getCreatorPhotoKey(slug);
  const file = key ? resolveMaster(key) : null;
  const out = file ? await derivative(file, "portrait") : null;
  if (!out) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(out), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(out.byteLength),
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "noimageindex",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
