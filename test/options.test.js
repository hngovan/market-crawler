import test from "node:test";
import assert from "node:assert/strict";

import { parseOptions } from "../src/options.js";

test("uses realforce, 20, and ascending price as defaults", () => {
  assert.deepEqual(parseOptions([]), {
    keyword: "realforce",
    limit: 20,
    markets: ["joongna", "mercari"],
    sort: "price-asc",
  });
});

test("accepts keyword and limit overrides", () => {
  assert.deepEqual(parseOptions(["--keyword=keyboard", "--limit=50"]), {
    keyword: "keyboard",
    limit: 50,
    markets: ["joongna", "mercari"],
    sort: "price-asc",
  });
});

test("accepts selected markets", () => {
  assert.deepEqual(parseOptions(["--markets=mercari"]), {
    keyword: "realforce",
    limit: 20,
    markets: ["mercari"],
    sort: "price-asc",
  });
});

test("accepts descending price sort", () => {
  assert.equal(parseOptions(["--sort=price-desc"]).sort, "price-desc");
});

test("accepts newest sort", () => {
  assert.equal(parseOptions(["--sort=newest"]).sort, "newest");
});

test("rejects unsupported sort", () => {
  assert.throws(() => parseOptions(["--sort=popular"]), /Unsupported sort/);
});

test("rejects an invalid limit", () => {
  assert.throws(() => parseOptions(["--limit=0"]), /positive integer/);
});
