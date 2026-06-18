import assert from "node:assert/strict";
import test from "node:test";

import { extractGuheyoCard, normalizeGuheyoDetailImages } from "../src/markets/guheyo-products.js";

test("extracts a Guheyo product card", () => {
  const product = extractGuheyoCard({
    text: "키보드\n하루 전\nRealforce r1 10th 차등\n기성품\n80,000원",
    imageAlt: "Realforce r1 10th 차등",
    url: "https://guheyo.com/offer/Realforce-r1-10th-%EC%B0%A8%EB%93%B1-fvBYHIzWRC6Onhc-zT462",
    image:
      "https://guheyo.com/_next/image?url=https%3A%2F%2Fguheyo.s3.ap-northeast-2.amazonaws.com%2Foffer%2Fthumb.jpg&w=256&q=75",
  });

  assert.equal(product.name, "Realforce r1 10th 차등");
  assert.equal(product.price, 80000);
  assert.equal(
    product.url,
    "https://guheyo.com/offer/Realforce-r1-10th-%EC%B0%A8%EB%93%B1-fvBYHIzWRC6Onhc-zT462",
  );
  assert.equal(
    product.image,
    "https://guheyo.com/_next/image?url=https%3A%2F%2Fguheyo.s3.ap-northeast-2.amazonaws.com%2Foffer%2Fthumb.jpg&w=256&q=75",
  );
  assert.equal(product.postedAtText, "하루 전");
  assert.match(product.postedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("normalizes Guheyo detail images without stripping Next image query params", () => {
  assert.deepEqual(
    normalizeGuheyoDetailImages([
      "",
      "https://guheyo.com/_next/image?url=https%3A%2F%2Fguheyo.s3.ap-northeast-2.amazonaws.com%2Foffer%2F1.jpg&w=1920&q=75",
      "https://guheyo.com/_next/image?url=https%3A%2F%2Fguheyo.s3.ap-northeast-2.amazonaws.com%2Foffer%2F1.jpg&w=1920&q=75",
      "https://guheyo.com/_next/image?url=https%3A%2F%2Fguheyo.s3.ap-northeast-2.amazonaws.com%2Foffer%2F2.jpg&w=1920&q=75",
    ]),
    [
      "https://guheyo.com/_next/image?url=https%3A%2F%2Fguheyo.s3.ap-northeast-2.amazonaws.com%2Foffer%2F1.jpg&w=1920&q=75",
      "https://guheyo.com/_next/image?url=https%3A%2F%2Fguheyo.s3.ap-northeast-2.amazonaws.com%2Foffer%2F2.jpg&w=1920&q=75",
    ],
  );
});
