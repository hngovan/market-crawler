import assert from "node:assert/strict";
import test from "node:test";

import { toCrawlArguments, validateCrawlRequest } from "../src/crawl-request.js";

test("validates an arbitrary positive crawl limit and newest sort", () => {
  assert.deepEqual(validateCrawlRequest({
    keyword: " realforce ",
    limit: 375,
    markets: ["joongna", "bunjang", "mercari"],
    sort: "newest",
  }), {
    keyword: "realforce",
    keywords: ["realforce"],
    limit: 375,
    markets: ["joongna", "bunjang", "mercari"],
    sort: "newest",
  });
});

test("validates multiple crawl keywords", () => {
  assert.deepEqual(validateCrawlRequest({
    keywords: [" realforce ", "hhkb", "realforce"],
    limit: 50,
    markets: ["bunjang"],
    sort: "price-asc",
  }), {
    keyword: "realforce",
    keywords: ["realforce", "hhkb"],
    limit: 50,
    markets: ["bunjang"],
    sort: "price-asc",
  });
});

test("rejects unsupported markets", () => {
  assert.throws(() => validateCrawlRequest({
    keyword: "realforce",
    limit: 20,
    markets: ["goofish"],
    sort: "price-asc",
  }), /supported market/);
});

test("builds crawl CLI arguments", () => {
  assert.deepEqual(toCrawlArguments({
    keywords: ["realforce", "hhkb"],
    limit: 100,
    markets: ["joongna", "bunjang"],
    sort: "price-desc",
  }), [
    "--keywords=realforce,hhkb",
    "--limit=100",
    "--markets=joongna,bunjang",
    "--sort=price-desc",
  ]);
});
