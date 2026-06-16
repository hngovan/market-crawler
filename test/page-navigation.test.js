import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBunjangSearchUrl,
  buildJoongnaSearchUrl,
  buildMercariSearchUrl,
  findMercariNextUrl,
} from "../src/markets/page-navigation.js";

test("builds numbered Joongna search URLs with sort direction", () => {
  assert.equal(
    buildJoongnaSearchUrl("realforce", "price-desc", 2),
    "https://web.joongna.com/search/realforce?sort=PRICE_DESC_SORT&page=2",
  );
});

test("builds sorted Mercari search URL", () => {
  assert.equal(
    buildMercariSearchUrl("realforce", "price-asc"),
    "https://jp.mercari.com/search?keyword=realforce&sort=price&order=asc",
  );
});

test("builds newest Joongna and Mercari URLs", () => {
  assert.equal(
    buildJoongnaSearchUrl("realforce", "newest", 1),
    "https://web.joongna.com/search/realforce?sort=RECENT_SORT",
  );
  assert.equal(
    buildMercariSearchUrl("realforce", "newest"),
    "https://jp.mercari.com/search?keyword=realforce&sort=created_time&order=desc",
  );
});

test("builds Bunjang search URLs with JSON sort values", () => {
  assert.equal(
    buildBunjangSearchUrl("realforce", "newest"),
    "https://m.bunjang.co.kr/keywords/realforce?sort=%5B%22latest%22%5D",
  );
  assert.equal(
    buildBunjangSearchUrl("realforce", "price-asc"),
    "https://m.bunjang.co.kr/keywords/realforce?sort=%5B%22price_asc%22%5D",
  );
  assert.equal(
    buildBunjangSearchUrl("realforce", "price-desc"),
    "https://m.bunjang.co.kr/keywords/realforce?sort=%5B%22price_desc%22%5D",
  );
});

test("finds Mercari next page token URL", () => {
  assert.equal(
    findMercariNextUrl([
      "https://jp.mercari.com/item/m1",
      "https://jp.mercari.com/search?keyword=realforce&order=asc&page_token=v1%3A1&sort=price",
    ]),
    "https://jp.mercari.com/search?keyword=realforce&order=asc&page_token=v1%3A1&sort=price",
  );
});
