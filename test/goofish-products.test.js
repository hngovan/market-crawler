import test from "node:test";
import assert from "node:assert/strict";

import { extractGoofishProducts } from "../src/markets/goofish-products.js";

test("extracts Goofish listings from a search API payload", () => {
  const products = extractGoofishProducts({
    data: {
      resultList: [
        {
          itemId: "1234567890",
          title: "REALFORCE R3 键盘",
          price: "¥1,280",
          seller: { userId: "seller-1" },
          pictureUrl: "https://images.apifyusercontent.com/realforce.jpg",
        },
      ],
    },
  });

  assert.deepEqual(products, [
    {
      name: "REALFORCE R3 键盘",
      price: 1280,
      url: "https://www.goofish.com/item?id=1234567890",
      image: "https://images.apifyusercontent.com/realforce.jpg",
    },
  ]);
});

test("deduplicates Goofish listings across nested response arrays", () => {
  const products = extractGoofishProducts({
    items: [
      { id: "abc", title: "Keyboard", price: 99, picUrl: "https://a.test/a.jpg" },
      { itemId: "abc", itemTitle: "Keyboard updated", priceInfo: { price: "99.00" } },
    ],
  });

  assert.equal(products.length, 1);
  assert.equal(products[0].url, "https://www.goofish.com/item?id=abc");
});
