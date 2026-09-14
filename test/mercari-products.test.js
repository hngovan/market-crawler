import test from "node:test";
import assert from "node:assert/strict";

import {
  extractMercariCard,
  isMercariSoldCard,
  normalizeMercariImages,
} from "../src/markets/mercari-products.js";
import { launchBrowser } from "../src/markets/browser.js";
import * as mercariCrawler from "../src/markets/mercari.js";

const { collectMercariCardsDuringScroll } = mercariCrawler;

test("collects Mercari item-cell links when thumbnail-link is absent", async () => {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(`
      <div data-testid="item-cell">
        <a href="https://jp.mercari.com/item/m65101872460" aria-label="Apple Extended Keyboard II 6,900円">
          <img alt="Apple Extended Keyboard IIのサムネイル" src="https://static.mercdn.net/thumb/item/webp/m65101872460_1.jpg">
          <span data-testid="item-tile-price">¥6,900</span>
        </a>
      </div>
    `);

    assert.equal(await mercariCrawler.waitForMercariSearchState(page, 1000), "products");
    const products = await collectMercariCardsDuringScroll(page, 1, 0);

    assert.deepEqual(products, [
      {
        name: "Apple Extended Keyboard II",
        price: 6900,
        url: "https://jp.mercari.com/item/m65101872460",
        image: "https://static.mercdn.net/thumb/item/webp/m65101872460_1.jpg",
      },
    ]);
  } finally {
    await browser.close();
  }
});

test("recognizes a completed Mercari search with no products", async () => {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(
      '<div data-testid="item-grid-empty-state">出品された商品がありません</div>',
    );

    assert.equal(await mercariCrawler.waitForMercariSearchState(page, 1000), "empty");
  } finally {
    await browser.close();
  }
});

test("accepts a confirmed empty Mercari search as a successful result", () => {
  assert.deepEqual(mercariCrawler.finalizeMercariSearch([], true), []);
});

test("rejects an unresolved Mercari search page", async () => {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent("<main>Loading</main>");

    await assert.rejects(mercariCrawler.waitForMercariSearchState(page, 100));
  } finally {
    await browser.close();
  }
});

test("rejects zero parsed products without a confirmed empty state", () => {
  assert.throws(
    () => mercariCrawler.finalizeMercariSearch([], false),
    /No valid Mercari products found/,
  );
});

test("waits for Mercari detail images before reading the page", async () => {
  let imagesReady = false;
  const page = {
    waitForSelector: async () => {
      imagesReady = true;
    },
    evaluate: async () =>
      imagesReady
        ? {
            imageUrls: ["https://static.mercdn.net/item/detail/orig/photos/m45348486777_1.jpg"],
            text: "出品された商品",
          }
        : { imageUrls: [], text: "" },
  };

  assert.deepEqual(await mercariCrawler.readMercariDetail(page), {
    imageUrls: ["https://static.mercdn.net/item/detail/orig/photos/m45348486777_1.jpg"],
    text: "出品された商品",
  });
});

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

test("extracts Mercari price from the current item tile markup", () => {
  assert.deepEqual(
    extractMercariCard({
      ariaLabel: "",
      priceText: "¥\n9,000",
      imageAlt: "REALFORCE 104UBのサムネイル",
      url: "https://jp.mercari.com/item/m63126408051",
      image: "https://static.mercdn.net/thumb/item/webp/m63126408051_1.jpg",
    }),
    {
      name: "REALFORCE 104UB",
      price: 9000,
      url: "https://jp.mercari.com/item/m63126408051",
      image: "https://static.mercdn.net/thumb/item/webp/m63126408051_1.jpg",
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
