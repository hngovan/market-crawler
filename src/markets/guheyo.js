import { launchBrowser } from "./browser.js";
import { buildGuheyoSearchUrl } from "./page-navigation.js";
import { extractKoreanRelativePostedAt } from "./product-date.js";
import { extractGuheyoCard, normalizeGuheyoDetailImages } from "./guheyo-products.js";
import { marketDefinitions } from "./registry.js";

export const guheyoMarket = marketDefinitions.guheyo;

async function collectVisibleProducts(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/offer/"]')]
      .filter((anchor) => /\/offer\/[^/?#]+/.test(anchor.href))
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
            imageUrls: [...document.querySelectorAll(".keen-slider img")].map(
              (image) => image.currentSrc || image.src,
            ),
            text: document.body?.innerText || "",
          }));
          const images = normalizeGuheyoDetailImages(detail.imageUrls);
          enriched[index] = {
            ...product,
            ...extractKoreanRelativePostedAt(detail.text),
            images: images.length > 0 ? images : [product.image].filter(Boolean),
          };
          console.log(
            `Guheyo images [${index + 1}/${products.length}]: ${enriched[index].images.length}`,
          );
        } catch (error) {
          enriched[index] = { ...product, images: [product.image].filter(Boolean) };
          console.warn(
            `Guheyo images [${index + 1}/${products.length}] fallback: ${error.message}`,
          );
        }
      }
    } finally {
      await page.close();
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, products.length) }, worker));
  return enriched;
}

export async function crawlGuheyo({ keyword, limit, sort }) {
  console.log(`Crawling Guheyo (limit: ${limit}, sort: ${sort})`);

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    const searchUrl = buildGuheyoSearchUrl(keyword, sort);
    console.log(`Guheyo search page 1: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector('a[href*="/offer/"]', { timeout: 45000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const uniqueProducts = new Map();
    for (const card of await collectVisibleProducts(page)) {
      const product = extractGuheyoCard(card);
      if (product && !uniqueProducts.has(product.url)) uniqueProducts.set(product.url, product);
      if (uniqueProducts.size >= limit) break;
    }

    const collected = [...uniqueProducts.values()];
    const products = (
      sort === "newest"
        ? collected
        : collected.sort((a, b) => (sort === "price-desc" ? b.price - a.price : a.price - b.price))
    ).slice(0, limit);
    if (products.length === 0) throw new Error("No valid Guheyo products found");
    return await enrichDetailImages(browser, products);
  } finally {
    await browser.close();
  }
}
