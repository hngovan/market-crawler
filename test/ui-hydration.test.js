import assert from "node:assert/strict";
import test from "node:test";

import { formatKeywordTags, hydrateProducts } from "../src/ui-products.js";

test("legacy products inherit crawl keywords before UI filtering", () => {
  const market = {
    id: "joongna",
    name: "Joongna",
    region: "korea",
    regionName: "Hàn Quốc",
    regionFlag: "🇰🇷",
    currency: "KRW",
    crawl: { keyword: "realforce" },
  };
  const product = { name: "Realforce", price: 100, url: "https://web.joongna.com/product/1" };

  assert.deepEqual(hydrateProducts(market, [product])[0], {
    ...product,
    market: "joongna",
    marketName: "Joongna",
    region: "korea",
    regionName: "Hàn Quốc",
    regionFlag: "🇰🇷",
    currency: "KRW",
    keywords: ["realforce"],
  });
});

test("formats keyword tags from crawled product metadata", () => {
  assert.deepEqual(formatKeywordTags([" realforce ", "realforce 101", "realforce", ""]), [
    "realforce",
    "realforce 101",
  ]);
});
