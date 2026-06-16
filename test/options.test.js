import test from "node:test";
import assert from "node:assert/strict";

import { parseOptions } from "../src/options.js";

test("uses realforce, 50, and newest as defaults", () => {
  assert.deepEqual(parseOptions([]), {
    keyword: "realforce",
    keywords: ["realforce"],
    limit: 50,
    markets: ["joongna", "bunjang", "mercari"],
    sort: "newest",
  });
});

test("accepts keyword and limit overrides", () => {
  assert.deepEqual(parseOptions(["--keyword=keyboard", "--limit=50"]), {
    keyword: "keyboard",
    keywords: ["keyboard"],
    limit: 50,
    markets: ["joongna", "bunjang", "mercari"],
    sort: "newest",
  });
});

test("accepts multiple keyword overrides", () => {
  assert.deepEqual(parseOptions(["--keywords=realforce,hhkb"]), {
    keyword: "realforce",
    keywords: ["realforce", "hhkb"],
    limit: 50,
    markets: ["joongna", "bunjang", "mercari"],
    sort: "newest",
  });
});

test("accepts selected markets", () => {
  assert.deepEqual(parseOptions(["--markets=mercari"]), {
    keyword: "realforce",
    keywords: ["realforce"],
    limit: 50,
    markets: ["mercari"],
    sort: "newest",
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
