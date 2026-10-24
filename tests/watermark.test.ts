import { test } from "node:test";
import assert from "node:assert/strict";
import { WATERMARK_TEXT, watermarkSvg } from "../src/lib/media-render";

test("the watermark is the site name, Terra Ledger", () => {
  assert.equal(WATERMARK_TEXT, "Terra Ledger");
  const svg = watermarkSvg(480, 480).toString();
  assert.ok(svg.includes(">Terra Ledger</text>"));
  assert.ok(!/terraledger/i.test(svg.replace(/Terra Ledger/g, "")));
});
