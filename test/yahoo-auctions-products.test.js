import assert from "node:assert/strict";
import test from "node:test";

import { extractYahooAuctionProduct } from "../src/markets/yahoo-auctions-products.js";

test("classifies a Yahoo listing with bidding below buy-now as an auction", () => {
  assert.deepEqual(
    extractYahooAuctionProduct(
      {
        name: "REALFORCE R2",
        currentPrice: "9,000円",
        startPrice: "9000",
        buyNowPrice: "15000",
        bidCount: "1",
        startTime: "1788788171",
        endTime: "1789306489",
        url: "https://auctions.yahoo.co.jp/jp/auction/o1243170079",
        image: "https://auctions.c.yimg.jp/example.jpg",
      },
      new Date("2026-09-12T00:00:00.000Z"),
    ),
    {
      name: "REALFORCE R2",
      price: 9000,
      buyNowPrice: 15000,
      bidCount: 1,
      postedAt: "2026-09-07T13:36:11.000Z",
      endsAt: "2026-09-13T13:34:49.000Z",
      saleType: "auction",
      url: "https://auctions.yahoo.co.jp/jp/auction/o1243170079",
      image: "https://auctions.c.yimg.jp/example.jpg",
    },
  );
});

test("classifies a Yahoo listing whose start and buy-now prices match as fixed-price", () => {
  const product = extractYahooAuctionProduct(
    {
      name: "REALFORCE R3",
      currentPrice: "10,000円",
      startPrice: "10000",
      buyNowPrice: "10000",
      bidCount: "0",
      endTime: "1789736008",
      url: "https://auctions.yahoo.co.jp/jp/auction/l1243150063",
      image: "https://auctions.c.yimg.jp/fixed.jpg",
    },
    new Date("2026-09-12T00:00:00.000Z"),
  );

  assert.equal(product.saleType, "fixed-price");
  assert.equal(product.price, 10000);
  assert.equal(product.buyNowPrice, 10000);
});

test("rejects malformed and expired Yahoo listings", () => {
  assert.equal(
    extractYahooAuctionProduct({
      name: "Missing price",
      url: "https://auctions.yahoo.co.jp/jp/auction/x1",
    }),
    null,
  );
  assert.equal(
    extractYahooAuctionProduct(
      {
        name: "Expired",
        currentPrice: "100円",
        endTime: "1",
        url: "https://auctions.yahoo.co.jp/jp/auction/x2",
      },
      new Date("2026-09-12T00:00:00.000Z"),
    ),
    null,
  );
});
