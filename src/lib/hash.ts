/* Deterministic 32-bit seed from a string (FNV-1a) */
export function seedFrom(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/* Reproducible random sequence from a seed (mulberry32) */
export function rngFrom(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Display identifier for a pass */
export function passIdFrom(seed: number): string {
  const hex = seed.toString(16).toUpperCase().padStart(8, "0");
  return `CP-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

/* Fictional wallet address, for display only */
export function walletFrom(seed: number): string {
  const rnd = rngFrom(seed);
  let s = "";
  for (let i = 0; i < 40; i++) s += Math.floor(rnd() * 16).toString(16);
  return `0x${s.slice(0, 4)}…${s.slice(-4)}`;
}
