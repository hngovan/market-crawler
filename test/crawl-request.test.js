import assert from "node:assert/strict";
import test from "node:test";

import { toCrawlArguments, validateCrawlRequest } from "../src/crawl-request.js";

test("validates an arbitrary positive crawl limit and newest sort", () => {
  assert.deepEqual(validateCrawlRequest({
    keyword: " realforce ",
    limit: 375,
    markets: ["joongna", "mercari"],
    sort: "newest",
  }), {
    keyword: "realforce",
    limit: 375,
    markets: ["joongna", "mercari"],
    sort: "newest",
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
    keyword: "realforce",
    limit: 100,
    markets: ["joongna"],
    sort: "price-desc",
  }), [
    "--keyword=realforce",
    "--limit=100",
    "--markets=joongna",
    "--sort=price-desc",
  ]);
});
