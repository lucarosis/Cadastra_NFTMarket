/* ============================================================
   Fixed-window rate limiting (server only).

   In memory, per process. That is enough for one server; behind
   several instances, move the counters to a shared store (Redis,
   or a table) — the call sites stay the same.
   ============================================================ */

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();
let lastSweep = 0;

export type RateResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateResult {
  /* drop expired windows now and then, so the map cannot grow without bound */
  if (now - lastSweep > 60_000) {
    for (const [k, w] of buckets) if (w.resetAt <= now) buckets.delete(k);
    lastSweep = now;
  }

  const w = buckets.get(key);
  if (!w || w.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (w.count >= limit) return { ok: false, retryAfterSeconds: Math.ceil((w.resetAt - now) / 1000) };
  w.count++;
  return { ok: true };
}

/** Best-effort client address. Trust X-Forwarded-For only behind a proxy you control. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "local";
}

export function tooMany(retryAfterSeconds: number) {
  return Response.json(
    { ok: false, error: "Too many attempts. Wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

/* for tests */
export function resetRateLimits() {
  buckets.clear();
}
