import assert from "node:assert/strict";
import test from "node:test";

import { createPreparedMarketPage, prepareMarketPage } from "../src/markets/browser.js";

test("prepares market pages with a browser user agent and Korean language headers", async () => {
  let configuredUserAgent = "";
  let configuredHeaders = {};
  const page = {
    browser() {
      return {
        userAgent: async () =>
          "Mozilla/5.0 AppleWebKit/537.36 HeadlessChrome/140.0.0.0 Safari/537.36",
      };
    },
    async setUserAgent(value) {
      configuredUserAgent = value;
    },
    async setExtraHTTPHeaders(value) {
      configuredHeaders = value;
    },
  };

  await prepareMarketPage(page, { language: "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7" });

  assert.equal(
    configuredUserAgent,
    "Mozilla/5.0 AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36",
  );
  assert.deepEqual(configuredHeaders, {
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  });
});

test("creates each crawler page with the configured browser identity", async () => {
  let createdPages = 0;
  let configuredUserAgent = "";
  const page = {
    browser: () => ({ userAgent: async () => "HeadlessChrome/148.0.0.0" }),
    setUserAgent: async (value) => (configuredUserAgent = value),
    setExtraHTTPHeaders: async () => {},
  };
  const browser = {
    async newPage() {
      createdPages += 1;
      return page;
    },
  };

  assert.equal(await createPreparedMarketPage(browser, { language: "ko-KR" }), page);
  assert.equal(createdPages, 1);
  assert.equal(configuredUserAgent, "Chrome/148.0.0.0");
});
