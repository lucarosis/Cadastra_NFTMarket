import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../scripts/lib/csv.mjs";

test("parses quoted fields with commas, quotes and line breaks", () => {
  const rows = parseCsv('﻿Title,Price_Tez,Description\r\n"Halo, Fragment",1250,"Said ""hi""\nthen left"\r\n\r\nPlain,10,\n');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].title, "Halo, Fragment");
  assert.equal(rows[0].price_tez, "1250");
  assert.equal(rows[0].description, 'Said "hi"\nthen left');
  assert.equal(rows[1].title, "Plain");
  assert.equal(rows[1].description, "");
});

test("an unterminated quote is an error, not silent data loss", () => {
  assert.throws(() => parseCsv('a,b\n"open,1\n'));
});
