import test from "node:test";
import assert from "node:assert/strict";

import {
  addMarketMetadata,
  createMarketStatus,
  extractProductKeywords,
  mergeProductsByUrl,
} from "../src/market-output.js";

test("adds native market metadata to products", () => {
  assert.deepEqual(
    addMarketMetadata(
      [{ name: "Realforce", price: 100 }],
      {
        id: "mercari",
        name: "Mercari",
        region: "japan",
        regionName: "Nhật Bản",
        regionFlag: "🇯🇵",
        currency: "JPY",
      },
      "realforce",
    ),
    [
      {
        market: "mercari",
        marketName: "Mercari",
        region: "japan",
        regionName: "Nhật Bản",
        regionFlag: "🇯🇵",
        currency: "JPY",
        keywords: ["realforce"],
        name: "Realforce",
        price: 100,
      },
    ],
  );
});

test("creates skipped market status with an error", () => {
  assert.deepEqual(
    createMarketStatus({ id: "mercari", name: "Mercari", currency: "JPY" }, [], "Blocked"),
    {
      id: "mercari",
      name: "Mercari",
      region: "",
      regionName: "",
      regionFlag: "",
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
  const status = createMarketStatus(
    {
      id: "joongna",
      name: "Joongna",
      region: "korea",
      regionName: "Hàn Quốc",
      regionFlag: "🇰🇷",
      currency: "KRW",
    },
    [],
    "",
    crawl,
  );
  assert.deepEqual(status.crawl, crawl);
  assert.equal(status.region, "korea");
});

test("merges products from previous and current keyword crawls", () => {
  assert.deepEqual(
    mergeProductsByUrl([
      {
        name: "Realforce",
        url: "https://web.joongna.com/product/1",
        images: ["old.jpg"],
        keywords: ["realforce"],
      },
      {
        name: "Realforce 101",
        url: "https://web.joongna.com/product/2",
        images: ["new.jpg"],
        keywords: ["realforce 101"],
      },
      {
        name: "Realforce renamed",
        url: "https://web.joongna.com/product/1",
        images: ["fresh.jpg"],
        keywords: ["realforce 101"],
      },
    ]),
    [
      {
        name: "Realforce renamed",
        url: "https://web.joongna.com/product/1",
        images: ["fresh.jpg"],
        keywords: ["realforce", "realforce 101"],
      },
      {
        name: "Realforce 101",
        url: "https://web.joongna.com/product/2",
        images: ["new.jpg"],
        keywords: ["realforce 101"],
      },
    ],
  );
});

test("extracts unique product keywords for crawl metadata", () => {
  assert.deepEqual(
    [
      ...new Set([
        "realforce 101",
        ...extractProductKeywords([
          { keywords: ["realforce"] },
          { keywords: ["realforce", "realforce 101"] },
        ]),
      ]),
    ],
    ["realforce 101", "realforce"],
  );
});
