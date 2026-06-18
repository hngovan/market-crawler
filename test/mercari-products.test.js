import test from "node:test";
import assert from "node:assert/strict";

import {
  extractMercariCard,
  isMercariSoldCard,
  normalizeMercariImages,
} from "../src/markets/mercari-products.js";

test("extracts Mercari card data with the original JPY price", () => {
  assert.deepEqual(
    extractMercariCard({
      ariaLabel: "REALFORCE R3 キーボードの画像 19,500円 VND3,400,100",
      imageAlt: "REALFORCE R3 キーボードのサムネイル",
      url: "https://jp.mercari.com/item/m34946733858",
      image: "https://static.mercdn.net/thumb/item/webp/m34946733858_1.jpg?123",
    }),
    {
      name: "REALFORCE R3 キーボード",
      price: 19500,
      url: "https://jp.mercari.com/item/m34946733858",
      image: "https://static.mercdn.net/thumb/item/webp/m34946733858_1.jpg?123",
    },
  );
});

test("normalizes unique Mercari original detail images", () => {
  assert.deepEqual(
    normalizeMercariImages([
      "https://static.mercdn.net/item/detail/orig/photos/m1_1.jpg?123",
      "https://static.mercdn.net/item/detail/orig/photos/m1_1.jpg?456",
      "https://static.mercdn.net/thumb/item/webp/related.jpg",
    ]),
    ["https://static.mercdn.net/item/detail/orig/photos/m1_1.jpg"],
  );
});

test("detects sold Mercari cards from the thumbnail sticker", () => {
  assert.equal(
    isMercariSoldCard({
      stickerLabel: "売り切れ",
      stickerTestId: "thumbnail-sticker",
    }),
    true,
  );
  assert.equal(isMercariSoldCard({ stickerLabel: "出品中" }), false);
});
