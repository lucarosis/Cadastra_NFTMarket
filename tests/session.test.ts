import { test } from "node:test";
import assert from "node:assert/strict";
import { createSessionToken, verifySessionToken } from "../src/lib/session";

test("a fresh token verifies and carries the address and issue time", () => {
  const now = Date.now();
  const s = verifySessionToken(createSessionToken({ sub: "1", em: "a@b.co" }, now));
  assert.equal(s?.sub, "1");
  assert.equal(s?.em, "a@b.co");
  assert.equal(s?.iat, now);
});

test("a token whose body was changed is refused", () => {
  const [body, mac] = createSessionToken({ sub: "1", em: "a@b.co" }).split(".");
  const forged = Buffer.from(JSON.stringify({ sub: "tz1evil", iat: Date.now(), exp: 9_999_999_999 })).toString("base64url");
  assert.equal(verifySessionToken(`${forged}.${mac}`), null);
  assert.equal(verifySessionToken(`${body}.x${mac.slice(1)}`), null);
});

test("an expired token is refused", () => {
  const longAgo = Date.now() - 8 * 24 * 3600 * 1000; /* older than the 7-day lifetime */
  assert.equal(verifySessionToken(createSessionToken({ sub: "1", em: "a@b.co" }, longAgo)), null);
});

test("junk is refused", () => {
  for (const t of [undefined, "", "abc", "a.b.c", "....."]) assert.equal(verifySessionToken(t), null);
});

import { openAccount, sealAccount } from "../src/lib/session";

test("a session carries its email, lower-cased", () => {
  const s = verifySessionToken(createSessionToken({ sub: "7", em: "Ana@Example.com" }));
  assert.equal(s?.em, "ana@example.com");
});

test("a session without an email is refused (old cookies sign in again)", () => {
  const body = Buffer.from(JSON.stringify({ sub: "1", iat: Date.now(), exp: 9_999_999_999 })).toString("base64url");
  const [, mac] = createSessionToken({ sub: "1", em: "a@b.co" }).split(".");
  assert.equal(verifySessionToken(`${body}.${mac}`), null);
});

test("the account copy round-trips, and any change to it is refused", () => {
  const copy = { email: "a@b.co", passwordHash: "scrypt$16384$8$1$salt$hash", displayName: "Ana", termsVersion: "2026-10-09" };
  const sealed = sealAccount(copy);
  assert.deepEqual(openAccount(sealed), copy);
  assert.ok(!sealed.includes("a@b.co"), "the copy is encrypted, not just encoded");
  const [iv, tag, data] = sealed.split(".");
  const flipped = Buffer.from(data, "base64url"); flipped[0] ^= 1;
  assert.equal(openAccount(`${iv}.${tag}.${flipped.toString("base64url")}`), null);
  assert.equal(openAccount("junk"), null);
  assert.equal(openAccount(undefined), null);
});
