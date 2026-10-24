/* ============================================================
   Live prices for the crypto price strip (server only).

   One CoinGecko request for every coin, cached for five minutes
   so pages never wait on it twice. If the provider is down the
   strip shows names without prices rather than invented numbers.
   ============================================================ */

import { COINS, COIN_IDS, type CoinId } from "@/components/visuals/CryptoIcon";

export type CoinQuote = { coin: CoinId; usd: number | null; change24h: number | null };

const TTL_MS = 5 * 60 * 1000;
let cached: { at: number; quotes: CoinQuote[] } | null = null;

export async function getCoinQuotes(): Promise<CoinQuote[]> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.quotes;

  const ids = COIN_IDS.map((c) => COINS[c].gecko).join(",");
  let json: Record<string, { usd?: number; usd_24h_change?: number }> = {};
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      {
        signal: AbortSignal.timeout(4000),
        next: { revalidate: 300 },
        headers: process.env.PRICE_FEED_KEY ? { "x-cg-demo-api-key": process.env.PRICE_FEED_KEY } : undefined,
      },
    );
    if (res.ok) json = await res.json();
  } catch {
    /* offline or rate-limited: fall through with no prices */
  }

  const quotes = COIN_IDS.map((coin) => {
    const q = json[COINS[coin].gecko];
    return {
      coin,
      usd: typeof q?.usd === "number" ? q.usd : null,
      change24h: typeof q?.usd_24h_change === "number" ? q.usd_24h_change : null,
    };
  });
  /* keep a good answer for five minutes; retry a failed one sooner */
  if (quotes.some((q) => q.usd !== null)) cached = { at: Date.now(), quotes };
  return quotes;
}

export function formatUsd(n: number): string {
  if (n >= 1000) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1) return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 4 });
}
