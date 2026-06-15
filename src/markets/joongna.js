import { enrichProductImages, extractCardProduct, normalizeProducts } from "../products.js";
import { launchBrowser } from "./browser.js";
import { buildJoongnaSearchUrl } from "./page-navigation.js";
import { extractJoongnaPostedAt } from "./product-date.js";

export const joongnaMarket = {
  id: "joongna",
  name: "Joongna",
  currency: "KRW",
};

async function collectVisibleProducts(page) {
  return page.evaluate(() => {
    const anchors = [...document.querySelectorAll('a[href*="/product/"]')].filter((anchor) =>
      /\/product\/\d+/.test(anchor.href),
    );

    return anchors.map((anchor) => {
      const image = anchor.querySelector("img");
      return {
        text: anchor.innerText,
        imageAlt: image?.alt || "",
        url: anchor.href,
        image: image?.currentSrc || image?.src || "",
      };
    });
  });
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
          const detail = await page.evaluate(
            (productName) => ({
              images: [...document.querySelectorAll(".swiper-slide img")]
                .filter((image) => image.alt === `${productName} 이미지`)
                .map((image) => image.currentSrc || image.src)
                .filter(Boolean),
              scripts: [...document.scripts].map((script) => script.textContent),
            }),
            product.name,
          );
          enriched[index] = {
            ...enrichProductImages(product, detail.images),
            postedAt: extractJoongnaPostedAt(detail.scripts),
          };
          console.log(`Joongna images [${index + 1}/${products.length}]: ${enriched[index].images.length}`);
        } catch (error) {
          enriched[index] = enrichProductImages(product, []);
          console.warn(`Joongna images [${index + 1}/${products.length}] fallback: ${error.message}`);
        }
      }
    } finally {
      await page.close();
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, products.length) }, worker));
  return enriched;
}

export async function crawlJoongna({ keyword, limit, sort }) {
  console.log(`Crawling Joongna (limit: ${limit}, sort: ${sort})`);

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200 });
    let products = [];
    let pageNumber = 1;
    while (products.length < limit) {
      const previousCount = products.length;
      const searchUrl = buildJoongnaSearchUrl(keyword, sort, pageNumber);
      console.log(`Joongna search page ${pageNumber}: ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 60000 });
      await page.waitForSelector('a[href*="/product/"]', { timeout: 30000 });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const visibleProducts = (await collectVisibleProducts(page)).map(extractCardProduct);
      products = normalizeProducts([...products, ...visibleProducts], { sortByPrice: sort !== "newest" });
      if (products.length === previousCount) break;
      pageNumber += 1;
    }

    const sorted = sort === "newest"
      ? products
      : products.sort((a, b) => sort === "price-desc" ? b.price - a.price : a.price - b.price);
    return await enrichDetailImages(browser, sorted.slice(0, limit));
  } finally {
    await browser.close();
  }
}
