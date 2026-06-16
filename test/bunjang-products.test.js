import assert from "node:assert/strict";
import test from "node:test";

import { normalizeBunjangDetailImages } from "../src/markets/bunjang.js";

test("keeps only Bunjang product detail images for the current product id", () => {
  assert.deepEqual(
    normalizeBunjangDetailImages("https://m.bunjang.co.kr/products/407413985", [
      "https://media.bunjang.co.kr/product/407413985_1_1778483174_w900.jpg?x=1",
      "https://media.bunjang.co.kr/product/407413985_2_1778483174_w900.jpg",
      "https://media.bunjang.co.kr/product/407413985_%7Bcnt%7D_1778483174_w160.jpg",
      "https://static.bunjang.co.kr/review/review-keyword-img/review_keyword_icon_1_v3.webp",
      "https://media.bunjang.co.kr/profile/123.jpg",
      "https://media.bunjang.co.kr/product/999999999_1_1778483174_w900.jpg",
    ]),
    [
      "https://media.bunjang.co.kr/product/407413985_1_1778483174_w900.jpg",
      "https://media.bunjang.co.kr/product/407413985_2_1778483174_w900.jpg",
    ],
  );
});
