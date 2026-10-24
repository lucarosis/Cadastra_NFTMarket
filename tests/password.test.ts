import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, passwordProblem, verifyPassword } from "../src/lib/password";

test("a password verifies against its own hash, and nothing else does", async () => {
  const h = await hashPassword("correct horse battery");
  assert.match(h, /^scrypt\$16384\$8\$1\$[\w-]+\$[\w-]+$/);
  assert.equal(await verifyPassword("correct horse battery", h), true);
  assert.equal(await verifyPassword("correct horse batterY", h), false);
  assert.equal(await verifyPassword("", h), false);
});

test("the same password hashes differently each time (salted)", async () => {
  assert.notEqual(await hashPassword("same-password"), await hashPassword("same-password"));
});

test("malformed stored hashes are refused, not thrown", async () => {
  for (const bad of ["", "plain", "md5$abc", "scrypt$16384$8$1$$"]) assert.equal(await verifyPassword("x", bad), false);
});

test("password rules", () => {
  assert.ok(passwordProblem("short"));
  assert.equal(passwordProblem("long enough"), null);
  assert.ok(passwordProblem("x".repeat(201)));
});
