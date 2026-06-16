import { parsePrice } from "../products.js";
import { launchBrowser } from "./browser.js";
import { buildBunjangSearchUrl } from "./page-navigation.js";
import { extractKoreanRelativePostedAt } from "./product-date.js";
import { marketDefinitions } from "./registry.js";

export const bunjangMarket = marketDefinitions.bunjang;

const BUNJANG_ORIGIN = "https://m.bunjang.co.kr";

function absoluteBunjangUrl(value) {
  if (!value) return "";
  if (value.startsWith("//")) return `https:${value}`;
  try {
    return new URL(value, BUNJANG_ORIGIN).href;
  } catch {
    return "";
  }
}

function normalizeBunjangImage(value) {
  const url = absoluteBunjangUrl(value);
  if (!url) return "";
  return url.split("?")[0];
}

export function normalizeBunjangDetailImages(productUrl, imageUrls) {
  const productId = String(productUrl ?? "").match(/\/products\/(\d+)/)?.[1];
  if (!productId) return [];

  return [...new Set(imageUrls.map(normalizeBunjangImage).filter(Boolean))]
    .filter((image) => {
      try {
        const url = new URL(image);
        return url.hostname === "media.bunjang.co.kr"
          && url.pathname.startsWith(`/product/${productId}_`)
          && !url.pathname.includes("%7Bcnt%7D")
          && !url.pathname.includes("{cnt}");
      } catch {
        return false;
      }
    });
}

function extractBunjangCard(card) {
  const lines = String(card.text ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
  const priceLine = lines.find((line) => /원/.test(line) && parsePrice(line) !== null) ?? "";
  const price = parsePrice(priceLine);
  const name = String(card.imageAlt || lines.find((line) => line !== priceLine) || "").trim();
  const url = absoluteBunjangUrl(card.url).split("?")[0];
  const image = normalizeBunjangImage(card.image);
  const posted = extractKoreanRelativePostedAt(card.text);

  if (!name || price === null || !/\/products\/\d+/.test(url)) return null;
  return {
    name,
    price,
    url,
    image,
    ...posted,
  };
}

async function collectVisibleProducts(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/products/"]')]
      .filter((anchor) => /\/products\/\d+/.test(anchor.href))
      .map((anchor) => {
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

async function enrichDetailImages(browser, products, concurrency = 2) {
  const enriched = [...products];
  let nextIndex = 0;

  async function worker() {
    const page = await browser.newPage();
    try {
      while (nextIndex < products.length) {
        const index = nextIndex++;
        const product = products[index];
        try {
          await page.goto(product.url, { waitUntil: "networkidle2", timeout: 60000 });
          const detail = await page.evaluate(() => ({
            imageUrls: [...document.images].map((image) => image.currentSrc || image.src),
            text: document.body?.innerText || "",
          }));
          const images = normalizeBunjangDetailImages(product.url, detail.imageUrls);
          enriched[index] = {
            ...product,
            ...extractKoreanRelativePostedAt(detail.text),
            images: images.length > 0 ? images : [product.image].filter(Boolean),
          };
          console.log(`Bunjang images [${index + 1}/${products.length}]: ${enriched[index].images.length}`);
        } catch (error) {
          enriched[index] = { ...product, images: [product.image].filter(Boolean) };
          console.warn(`Bunjang images [${index + 1}/${products.length}] fallback: ${error.message}`);
        }
      }
    } finally {
      await page.close();
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, products.length) }, worker));
  return enriched;
}

export async function crawlBunjang({ keyword, limit, sort }) {
  console.log(`Crawling Bunjang (limit: ${limit}, sort: ${sort})`);

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 1200, isMobile: true });
    const searchUrl = buildBunjangSearchUrl(keyword, sort);
    console.log(`Bunjang search page 1: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector('a[href*="/products/"]', { timeout: 45000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const uniqueProducts = new Map();
    for (const card of await collectVisibleProducts(page)) {
      const product = extractBunjangCard(card);
      if (product && !uniqueProducts.has(product.url)) uniqueProducts.set(product.url, product);
      if (uniqueProducts.size >= limit) break;
    }

    const collected = [...uniqueProducts.values()];
    const products = (sort === "newest"
      ? collected
      : collected.sort((a, b) => sort === "price-desc" ? b.price - a.price : a.price - b.price))
      .slice(0, limit);
    if (products.length === 0) throw new Error("No valid Bunjang products found");
    return await enrichDetailImages(browser, products);
  } finally {
    await browser.close();
  }
}
