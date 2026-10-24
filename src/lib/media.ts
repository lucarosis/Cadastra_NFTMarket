/* ============================================================
   Artwork URLs.

   Asset files are not public. Every image in the UI is requested
   through /api/media/<id>, which decides what the viewer may see
   (watermarked preview vs clean image) — see that route.

   Always pass `unoptimized` to next/image for these: Next's image
   optimizer fetches the URL from the server without the viewer's
   cookie, so it would cache a watermarked preview for everyone.
   ============================================================ */

/** URL for an asset's artwork. `review` is a designer review token, which unlocks that one asset. */
export const assetSrc = (id: string, review?: string) =>
  `/api/media/${encodeURIComponent(id)}${review ? `?rt=${encodeURIComponent(review)}` : ""}`;

/** URL for a creator's confirmed portrait. Only valid when the creator has a `photo`. */
export const creatorPhotoSrc = (slug: string) => `/api/media/creator/${encodeURIComponent(slug)}`;
