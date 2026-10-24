/* ============================================================
   Tezos money.

   Amounts are whole numbers of mutez (1 tez = 1,000,000 mutez)
   everywhere: database, props, arithmetic. Only formatting turns
   them into text, so no rounding error can creep into a price.

   USD is a reference only, never the price of record. Rates come
   from src/lib/price.ts on the server and are passed down as a
   number.
   ============================================================ */

export const MUTEZ_PER_TEZ = 1_000_000;
export const TEZ_SYMBOL = "ꜩ";

export const toTez = (mutez: number) => mutez / MUTEZ_PER_TEZ;
export const toMutez = (tez: number) => Math.round(tez * MUTEZ_PER_TEZ);

/** "ꜩ 20,967" — decimals only when the amount is small enough to need them. */
export function formatTez(mutez: number, opts: { symbol?: boolean } = {}): string {
  const tez = toTez(mutez);
  const decimals = tez >= 1000 ? 0 : tez >= 1 ? 2 : 4;
  const n = tez.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return opts.symbol === false ? n : `${TEZ_SYMBOL} ${n}`;
}

/** Compact form for chart axes and tight columns: ꜩ 120k */
export function formatTezShort(mutez: number): string {
  const tez = toTez(mutez);
  if (tez >= 1_000_000) return `${TEZ_SYMBOL} ${(tez / 1_000_000).toFixed(1)}M`;
  if (tez >= 1_000) return `${TEZ_SYMBOL} ${Math.round(tez / 1_000)}k`;
  return `${TEZ_SYMBOL} ${tez.toFixed(tez >= 1 ? 0 : 2)}`;
}

/** USD reference for an amount of mutez. `rate` is USD per 1 tez. */
export function usdFromMutez(mutez: number, rate: number): string {
  const value = toTez(mutez) * rate;
  if (value >= 1000) return "$" + Math.round(value).toLocaleString("en-US");
  return "$" + value.toFixed(2);
}
