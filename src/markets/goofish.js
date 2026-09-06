import path from "node:path";

import { createPreparedMarketPage, launchBrowser } from "./browser.js";
import { extractGoofishDomProduct, extractGoofishProducts } from "./goofish-products.js";
import { marketDefinitions } from "./registry.js";

export const goofishMarket = marketDefinitions.goofish;

function buildSearchUrl(keyword) {
  const url = new URL("/search", "https://www.goofish.com");
  url.searchParams.set("q", keyword);
  return url.href;
}

async function crawlGoofishViaApify({ keyword, limit }) {
  const token = process.env.APIFY_TOKEN;
  if (!token) return null;
  const actor = (
    process.env.APIFY_GOOFISH_ACTOR || "5QcLc4BHaLMBUKYs3"
  ).replace("/", "~");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300000);
  try {
    const response = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(actor)}/run-sync-get-dataset-items?format=json`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword,
          maxItems: limit,
          sortBy: "newest",
          detailLevel: "summary",
        }),
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      const message = (await response.text()).slice(0, 300);
      throw new Error(
        `Apify Goofish request failed: HTTP ${response.status}${message ? ` - ${message}` : ""}`,
      );
    }
    const payload = await response.json();
    const products = extractGoofishProducts(payload);
    if (products.length === 0) throw new Error("Apify returned no valid Goofish products");
    return products.slice(0, limit);
  } finally {
    clearTimeout(timeout);
  }
}

async function collectDomProducts(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/item?"]')].map((anchor) => {
      const image = anchor.querySelector("img");
      return {
        text: anchor.innerText,
        imageAlt: image?.alt || "",
        url: anchor.href,
        image: image?.currentSrc || image?.src || "",
      };
    }),
  );
}

export async function crawlGoofish({ keyword, limit }) {
  console.log(`Crawling Goofish (limit: ${limit})`);
  const apifyProducts = await crawlGoofishViaApify({ keyword, limit });
  if (apifyProducts) return apifyProducts;

  const profileDir = process.env.GOOFISH_PROFILE_DIR || path.resolve(".cache/goofish-profile");
  const browser = await launchBrowser({ userDataDir: profileDir });
  const products = new Map();
  const pendingResponses = new Set();

  const addPayload = (payload) => {
    for (const product of extractGoofishProducts(payload)) {
      if (!products.has(product.url)) products.set(product.url, product);
    }
  };

  try {
    const page = await createPreparedMarketPage(browser, {
      language: "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
    });
    const onResponse = (response) => {
      if (!response.url().includes("mtop.taobao.idlemtopsearch.pc.search")) return;
      const task = response
        .json()
        .then(addPayload)
        .catch(() => {})
        .finally(() => pendingResponses.delete(task));
      pendingResponses.add(task);
    };
    page.on("response", onResponse);

    try {
      const response = await page.goto(buildSearchUrl(keyword), {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });
      if ([403, 429, 503].includes(response?.status() ?? 0)) {
        throw new Error(`Goofish blocked: HTTP ${response.status()}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));

      for (let pass = 0; pass < 30 && products.size < limit; pass += 1) {
        for (const card of await collectDomProducts(page)) {
          const product = extractGoofishDomProduct(card);
          if (product && !products.has(product.url)) products.set(product.url, product);
        }
        const state = await page.evaluate(() => {
          const before = window.scrollY;
          window.scrollBy(0, Math.max(window.innerHeight * 0.8, 600));
          return {
            moved: window.scrollY !== before,
            atBottom:
              window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 200,
          };
        });
        await new Promise((resolve) => setTimeout(resolve, 1200));
        if (state.atBottom || !state.moved) break;
      }
      await Promise.all([...pendingResponses]);
      for (const card of await collectDomProducts(page)) {
        const product = extractGoofishDomProduct(card);
        if (product && !products.has(product.url)) products.set(product.url, product);
      }
      const bodyText = await page.evaluate(() => document.body?.innerText || "");
      if (products.size === 0 && /登录|验证码|captcha|安全验证/i.test(bodyText)) {
        throw new Error(
          "Goofish requires login or verification. Run once with HEADLESS=false and complete QR login.",
        );
      }
    } finally {
      page.off("response", onResponse);
      await page.close();
    }
  } finally {
    await browser.close();
  }

  const result = [...products.values()].slice(0, limit);
  if (result.length === 0) throw new Error("No valid Goofish products found");
  return result;
}
