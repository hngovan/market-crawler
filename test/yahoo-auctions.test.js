import assert from "node:assert/strict";
import test from "node:test";

import {
  collectYahooAuctionProducts,
  loadYahooAuctionPage,
} from "../src/markets/yahoo-auctions.js";

const now = new Date("2026-09-12T00:00:00.000Z");

test("loads an HTTP 200 Yahoo terminal page with the semantic no-results marker", async () => {
  const products = await loadYahooAuctionPage(
    {
      goto: async () => ({ status: () => 200 }),
      $$eval: async () => [],
      evaluate: async () => true,
    },
    "https://auctions.yahoo.co.jp/search/search?p=realforce&b=151",
  );

  assert.deepEqual(products, []);
});

test("rejects an HTTP 200 Yahoo page with no cards and no no-results marker", async () => {
  await assert.rejects(
    loadYahooAuctionPage(
      {
        goto: async () => ({ status: () => 200 }),
        $$eval: async () => [],
        evaluate: async () => false,
      },
      "https://auctions.yahoo.co.jp/search/search?p=realforce",
    ),
    /no product cards or no-results marker/i,
  );
});

function card(id, price, startTime) {
  return {
    name: `Product ${id}`,
    currentPrice: String(price),
    startPrice: String(price),
    buyNowPrice: String(price),
    bidCount: "0",
    startTime: String(startTime),
    endTime: "1893456000",
    url: `https://auctions.yahoo.co.jp/jp/auction/${id}`,
    image: `https://auctions.c.yimg.jp/${id}.jpg`,
  };
}

test("stops Yahoo pagination after a short page and sorts newest products locally", async () => {
  const firstPage = Array.from({ length: 50 }, (_, index) =>
    card(`first-${index}`, 1000, 100 + index),
  );
  const secondPage = [card("newest", 2000, 999), card("older", 3000, 1)];

  const products = await collectYahooAuctionProducts({
    limit: 100,
    sort: "newest",
    now,
    async loadPage(pageNumber) {
      if (pageNumber === 1) return firstPage;
      if (pageNumber === 2) return secondPage;
      throw new Error("terminal page should not be requested");
    },
  });

  assert.equal(products.length, 52);
  assert.equal(products[0].url, "https://auctions.yahoo.co.jp/jp/auction/newest");
  assert.equal(products.at(-1).url, "https://auctions.yahoo.co.jp/jp/auction/older");
});

test("returns an empty list for a successful Yahoo search with no matches", async () => {
  const products = await collectYahooAuctionProducts({
    limit: 50,
    sort: "newest",
    now,
    loadPage: async () => [],
  });

  assert.deepEqual(products, []);
});

test("rejects a Yahoo page whose nonempty card set cannot be parsed", async () => {
  await assert.rejects(
    collectYahooAuctionProducts({
      limit: 50,
      sort: "newest",
      now,
      loadPage: async () => [{ name: "Changed markup without required fields" }],
    }),
    /could not parse any of 1 product cards/i,
  );
});

test("accepts an empty terminal page after an exactly full Yahoo page", async () => {
  const fullPage = Array.from({ length: 50 }, (_, index) => card(`full-${index}`, 1000, index + 1));
  const products = await collectYahooAuctionProducts({
    limit: 100,
    sort: "newest",
    now,
    async loadPage(pageNumber) {
      if (pageNumber === 1) return fullPage;
      if (pageNumber === 2) return [];
      throw new Error("page after the empty terminal page should not be requested");
    },
  });

  assert.equal(products.length, 50);
});

test("stops Yahoo pagination when a full page repeats without new products", async () => {
  const repeatedPage = Array.from({ length: 50 }, (_, index) =>
    card(`repeated-${index}`, 1000, index + 1),
  );
  const products = await collectYahooAuctionProducts({
    limit: 100,
    sort: "newest",
    now,
    async loadPage(pageNumber) {
      if (pageNumber <= 2) return repeatedPage;
      throw new Error("page after a repeated page should not be requested");
    },
  });

  assert.equal(products.length, 50);
});

test("sorts Yahoo prices locally before applying the limit", async () => {
  const products = await collectYahooAuctionProducts({
    limit: 2,
    sort: "price-asc",
    now,
    loadPage: async () => [card("high", 3000, 3), card("low", 1000, 2), card("mid", 2000, 1)],
  });

  assert.deepEqual(
    products.map((product) => product.price),
    [1000, 2000],
  );
});
