import test from "node:test";
import assert from "node:assert/strict";

import {
  extractMercariCard,
  isMercariSoldCard,
  normalizeMercariImages,
} from "../src/markets/mercari-products.js";
import { collectMercariCardsDuringScroll } from "../src/markets/mercari.js";

test("keeps cards captured before virtualized scrolling", async () => {
  const firstCard = {
    ariaLabel: "Realforce 87UB-EK45 17,800円",
    imageAlt: "Realforce 87UB-EK45のサムネイル",
    url: "https://jp.mercari.com/item/m51487841812",
    image: "https://static.mercdn.net/m51487841812.jpg",
  };
  const secondCard = {
    ariaLabel: "REALFORCE R3 19,800円",
    imageAlt: "REALFORCE R3のサムネイル",
    url: "https://jp.mercari.com/item/m83370873552",
    image: "https://static.mercdn.net/m83370873552.jpg",
  };
  let call = 0;
  const page = {
    evaluate: async () => {
      call += 1;
      if (call === 1) return [firstCard];
      if (call === 2) return { atBottom: false };
      if (call === 3) return [secondCard];
      if (call === 4) return { atBottom: true };
      return [];
    },
  };

  const products = await collectMercariCardsDuringScroll(page, 100, 0);

  assert.deepEqual(
    products.map(({ url }) => url),
    [firstCard.url, secondCard.url],
  );
});

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
