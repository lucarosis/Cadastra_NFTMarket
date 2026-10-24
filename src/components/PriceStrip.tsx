/* The live crypto price strip above every page's header. Server component:
   prices come from src/lib/crypto-prices.ts and are real or absent. */

import { CryptoIcon, COINS } from "./visuals/CryptoIcon";
import { formatUsd, getCoinQuotes } from "@/lib/crypto-prices";

export async function PriceStrip() {
  const quotes = await getCoinQuotes();
  const live = quotes.some((q) => q.usd !== null);

  const items = quotes.map((q) => (
    <span className="pstrip-item" key={q.coin}>
      <CryptoIcon coin={q.coin} size={18} />
      <b>{COINS[q.coin].symbol}</b>
      {q.usd !== null && <span className="mono">{formatUsd(q.usd)}</span>}
      {q.change24h !== null && (
        <span className={`mono ${q.change24h >= 0 ? "pstrip-up" : "pstrip-down"}`}>
          {q.change24h >= 0 ? "▲" : "▼"} {Math.abs(q.change24h).toFixed(2)}%
        </span>
      )}
    </span>
  ));

  return (
    <div className="pstrip" aria-label={live ? "Cryptocurrency prices, last 24 hours" : "Cryptocurrencies"}>
      <div className="pstrip-track">
        <div className="pstrip-set">{items}</div>
        <div className="pstrip-set" aria-hidden="true">{items}</div>
      </div>
    </div>
  );
}
