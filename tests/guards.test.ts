import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNext } from "../src/lib/redirect";
import { rateLimit, resetRateLimits } from "../src/lib/rate-limit";
import { isPublicPath } from "../src/proxy";

test("safeNext keeps same-site paths", () => {
  assert.equal(safeNext("/explore/art?q=x"), "/explore/art?q=x");
  assert.equal(safeNext("/nft/TL-0417"), "/nft/TL-0417");
});

test("safeNext refuses anything that leaves the site or loops", () => {
  for (const bad of ["//evil.example", "https://evil.example", "/\\evil.example", "javascript:alert(1)", "/login", "/register?x=1", "/x\n"]) {
    assert.equal(safeNext(bad), "/explore", bad);
  }
  assert.equal(safeNext(null, "/dashboard"), "/dashboard");
});

test("only the landing, sign-in, guide, review links and their APIs are public", () => {
  for (const p of ["/", "/login", "/register", "/tezos", "/review/rv_abc", "/api/auth/challenge", "/api/media/TL-0417"]) {
    assert.ok(isPublicPath(p), p);
  }
  for (const p of ["/explore", "/explore/art", "/drops", "/creators", "/dashboard", "/nft/TL-0417", "/tezos/x", "/reviewer"]) {
    assert.equal(isPublicPath(p), false, p);
  }
});

test("rate limit allows the quota, then refuses until the window resets", () => {
  resetRateLimits();
  const t = 1_000_000;
  for (let i = 0; i < 3; i++) assert.equal(rateLimit("k", 3, 1000, t).ok, true);
  const blocked = rateLimit("k", 3, 1000, t + 10);
  assert.equal(blocked.ok, false);
  assert.equal(rateLimit("k", 3, 1000, t + 1001).ok, true);
  assert.equal(rateLimit("other", 3, 1000, t + 10).ok, true);
});
