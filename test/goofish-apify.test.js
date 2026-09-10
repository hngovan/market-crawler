import test from "node:test";
import assert from "node:assert/strict";

import { crawlGoofishViaApify } from "../src/markets/goofish.js";

test("reads Goofish listings from the Apify run dataset", async () => {
  const requests = [];
  const fetchImpl = async (url) => {
    requests.push(String(url));
    if (requests.length === 1) {
      return {
        ok: true,
        json: async () => ({ data: { status: "SUCCEEDED", defaultDatasetId: "dataset-123" } }),
      };
    }
    return {
      ok: true,
      json: async () => [
        {
          id: "1234567890",
          title: "三亩 S80 键盘",
          price: 1280,
          pictureUrl: "https://images.apifyusercontent.com/s80.jpg",
        },
      ],
    };
  };

  const products = await crawlGoofishViaApify({
    keyword: "三亩S80",
    limit: 50,
    token: "test-token",
    fetchImpl,
  });

  assert.equal(requests.length, 2);
  assert.match(requests[0], /\/runs\?waitForFinish=300$/);
  assert.match(requests[1], /\/datasets\/dataset-123\/items\?format=json$/);
  assert.deepEqual(products, [
    {
      name: "三亩 S80 键盘",
      price: 1280,
      url: "https://www.goofish.com/item?id=1234567890",
      image: "https://images.apifyusercontent.com/s80.jpg",
    },
  ]);
});
