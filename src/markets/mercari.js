import { launchBrowser } from "./browser.js";
import { extractMercariCard, normalizeMercariImages } from "./mercari-products.js";
import { buildMercariSearchUrl, findMercariNextUrl } from "./page-navigation.js";

export const mercariMarket = {
  id: "mercari",
  name: "Mercari",
  currency: "JPY",
};

async function collectVisibleProducts(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('a[data-testid="thumbnail-link"][href*="/item/"]')].map((anchor) => {
      const image = anchor.querySelector("img");
      const labelledElement = anchor.querySelector('[aria-label*="円"]') ?? anchor;
      return {
        ariaLabel: labelledElement.getAttribute("aria-label") || "",
        imageAlt: image?.alt || "",
        url: anchor.href,
        image: image?.currentSrc || image?.src || "",
      };
    }),
  );
}

async function enrichDetailImages(browser, products, concurrency = 4) {
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
          const imageUrls = await page.evaluate(() =>
            [...document.images].map((image) => image.currentSrc || image.src),
          );
          const images = normalizeMercariImages(imageUrls);
          enriched[index] = { ...product, images: images.length > 0 ? images : [product.image].filter(Boolean) };
          console.log(`Mercari images [${index + 1}/${products.length}]: ${enriched[index].images.length}`);
        } catch (error) {
          enriched[index] = { ...product, images: [product.image].filter(Boolean) };
          console.warn(`Mercari images [${index + 1}/${products.length}] fallback: ${error.message}`);
        }
      }
    } finally {
      await page.close();
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, products.length) }, worker));
  return enriched;
}

export async function crawlMercari({ keyword, limit, sort }) {
  console.log(`Crawling Mercari (limit: ${limit}, sort: ${sort})`);

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200 });
    const uniqueProducts = new Map();
    let searchUrl = buildMercariSearchUrl(keyword, sort);
    let pageNumber = 1;
    while (uniqueProducts.size < limit && searchUrl) {
      const previousCount = uniqueProducts.size;
      console.log(`Mercari search page ${pageNumber}: ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 60000 });
      await page.waitForSelector('a[data-testid="thumbnail-link"][href*="/item/"]', { timeout: 30000 });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise((resolve) => setTimeout(resolve, 1500));
      for (const card of await collectVisibleProducts(page)) {
        const product = extractMercariCard(card);
        if (product.name && product.price !== null && !uniqueProducts.has(product.url)) {
          uniqueProducts.set(product.url, product);
        }
      }
      if (uniqueProducts.size === previousCount) break;
      const links = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((anchor) => anchor.href));
      searchUrl = findMercariNextUrl(links);
      pageNumber += 1;
    }

    const collectedProducts = [...uniqueProducts.values()];
    const products = (sort === "newest"
      ? collectedProducts
      : collectedProducts.sort((a, b) => sort === "price-desc" ? b.price - a.price : a.price - b.price))
      .slice(0, limit);
    if (products.length === 0) throw new Error("No valid Mercari products found");
    return await enrichDetailImages(browser, products);
  } finally {
    await browser.close();
  }
}
