import test from "node:test";
import assert from "node:assert/strict";

import {
  extractCardProduct,
  enrichProductImages,
  formatProductLog,
  normalizeProducts,
  parsePrice,
} from "../src/products.js";

test("parses Korean formatted prices", () => {
  assert.equal(parsePrice("2,500,000원"), 2500000);
});

test("extracts name and split price from a Joongna product card", () => {
  assert.deepEqual(
    extractCardProduct({
      text: "리얼포스 포인트 키캡 판매합니다\n12,345\n원\n6\n2\n무료배송",
      imageAlt: "리얼포스 포인트 키캡 판매합니다 이미지",
      url: "https://web.joongna.com/product/220230438",
      image: "https://img.joongna.com/product.jpg",
    }),
    {
      name: "리얼포스 포인트 키캡 판매합니다",
      price: "12,345",
      url: "https://web.joongna.com/product/220230438",
      image: "https://img.joongna.com/product.jpg",
    },
  );
});

test("formats a crawled product for console output", () => {
  assert.equal(
    formatProductLog(
      {
        name: "Realforce 87U",
        price: 200000,
        url: "https://web.joongna.com/product/228127782",
      },
      0,
    ),
    "[1] Realforce 87U | 200,000원 | https://web.joongna.com/product/228127782",
  );
});

test("formats Mercari products with JPY", () => {
  assert.equal(
    formatProductLog(
      {
        name: "Realforce",
        price: 199,
        currency: "JPY",
        url: "https://jp.mercari.com/item/m1",
      },
      0,
    ),
    "[1] Realforce | ¥199 | https://jp.mercari.com/item/m1",
  );
});

test("enriches a product with unique original detail images", () => {
  assert.deepEqual(
    enrichProductImages({ image: "https://img.joongna.com/thumb.jpg?impolicy=thumb&size=150" }, [
      "https://img.joongna.com/original-1.jpg?impolicy=resize&format=webp",
      "https://img.joongna.com/original-1.jpg",
      "//img.joongna.com/original-2.jpg",
      "/assets/icon.svg",
    ]).images,
    ["https://img.joongna.com/original-1.jpg", "https://img.joongna.com/original-2.jpg"],
  );
});

test("falls back to the product thumbnail when detail images are unavailable", () => {
  assert.deepEqual(enrichProductImages({ image: "https://img.joongna.com/thumb.jpg" }, []).images, [
    "https://img.joongna.com/thumb.jpg",
  ]);
});

test("normalizes, removes duplicate URLs, and sorts ascending", () => {
  const products = normalizeProducts([
    { name: " Expensive ", price: "3,000원", url: "/product/2", image: "//img/2.jpg" },
    {
      name: "Cheap",
      price: "1,000원",
      url: "https://web.joongna.com/product/1",
      image: "https://img/1.jpg",
    },
    { name: "Duplicate", price: "2,000원", url: "/product/1", image: "" },
    { name: "Invalid", price: "가격없음", url: "/product/3", image: "" },
  ]);

  assert.deepEqual(products, [
    {
      name: "Cheap",
      price: 1000,
      url: "https://web.joongna.com/product/1",
      image: "https://img/1.jpg",
    },
    {
      name: "Expensive",
      price: 3000,
      url: "https://web.joongna.com/product/2",
      image: "https://img/2.jpg",
    },
  ]);
});

test("can preserve source order while normalizing products", () => {
  const products = normalizeProducts(
    [
      { name: "Newest", price: "2000", url: "/product/2" },
      { name: "Older", price: "1000", url: "/product/1" },
    ],
    { sortByPrice: false },
  );

  assert.deepEqual(
    products.map((product) => product.name),
    ["Newest", "Older"],
  );
});
