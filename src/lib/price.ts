/* ============================================================
   XTZ/USD reference rate (server only).

   Replaces the demo's fixed USD_PER_ETH constant. The rate is
   cached so a page render never waits on the provider twice, and
   a provider outage falls back to a documented figure that the
   UI labels as delayed rather than showing nothing.
   ============================================================ */

export const FALLBACK_XTZ_USD = 0.8;
const TTL_SECONDS = 300;

export type Rate = { usdPerTez: number; stale: boolean; fetchedAt: string };

let cached: { value: Rate; expires: number } | null = null;

async function fetchRate(): Promise<number | null> {
  const url = process.env.PRICE_FEED_URL
    ?? "https://api.coingecko.com/api/v3/simple/price?ids=tezos&vs_currencies=usd";
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: TTL_SECONDS },
      headers: process.env.PRICE_FEED_KEY ? { "x-cg-demo-api-key": process.env.PRICE_FEED_KEY } : undefined,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { tezos?: { usd?: number } };
    const usd = json?.tezos?.usd;
    return typeof usd === "number" && usd > 0 ? usd : null;
  } catch {
    return null; /* offline, rate-limited or slow: fall back */
  }
}

export async function getXtzUsd(): Promise<Rate> {
  if (cached && cached.expires > Date.now()) return cached.value;

  const live = await fetchRate();
  const value: Rate = live
    ? { usdPerTez: live, stale: false, fetchedAt: new Date().toISOString() }
    : { usdPerTez: cached?.value.usdPerTez ?? FALLBACK_XTZ_USD, stale: true, fetchedAt: new Date().toISOString() };

  cached = { value, expires: Date.now() + TTL_SECONDS * 1000 };
  return value;
}
