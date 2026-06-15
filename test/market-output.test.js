import test from "node:test";
import assert from "node:assert/strict";

import { addMarketMetadata, createMarketStatus } from "../src/market-output.js";

test("adds native market metadata to products", () => {
  assert.deepEqual(
    addMarketMetadata([{ name: "Realforce", price: 100 }], {
      id: "mercari",
      name: "Mercari",
      currency: "JPY",
    }),
    [{
      market: "mercari",
      marketName: "Mercari",
      currency: "JPY",
      name: "Realforce",
      price: 100,
    }],
  );
});

test("creates skipped market status with an error", () => {
  assert.deepEqual(
    createMarketStatus({ id: "mercari", name: "Mercari", currency: "JPY" }, [], "Blocked"),
    {
      id: "mercari",
      name: "Mercari",
      currency: "JPY",
      status: "skipped",
      count: 0,
      error: "Blocked",
      dataFile: "data/mercari.json",
      crawl: {},
    },
  );
});

test("adds crawl metadata to market status", () => {
  const crawl = { keyword: "realforce", sort: "newest", limit: 20 };
  const status = createMarketStatus({ id: "joongna", name: "Joongna", currency: "KRW" }, [], "", crawl);
  assert.deepEqual(status.crawl, crawl);
});
