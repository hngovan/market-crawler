import { enrichProductImages, extractCardProduct, normalizeProducts } from "../products.js";
import { launchBrowser } from "./browser.js";
import { buildJoongnaSearchUrl } from "./page-navigation.js";
import { extractJoongnaPostedAt } from "./product-date.js";
import { marketDefinitions } from "./registry.js";

export const joongnaMarket = marketDefinitions.joongna;

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

async function loadSearchPage(page, searchUrl, pageNumber, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 60000 });
      const status = response?.status() ?? 0;
      if ([403, 429].includes(status)) {
        const text = await page
          .evaluate(() => document.body?.innerText?.slice(0, 500) || "")
          .catch(() => "");
        throw new Error(
          `Joongna blocked by CloudFront/WAF: HTTP ${status}${text ? ` - ${text}` : ""}`,
        );
      }
      await page.waitForSelector('a[href*="/product/"]', { timeout: 45000 });
      return;
    } catch (error) {
      lastError = error;
      const diagnostic = await page
        .evaluate(() => ({
          title: document.title,
          url: location.href,
          text: document.body?.innerText?.slice(0, 300) || "",
        }))
        .catch(() => ({ title: "", url: page.url(), text: "" }));
      console.warn(
        `Joongna page ${pageNumber} attempt ${attempt}/${attempts} failed: ${error.message}`,
      );
      console.warn(`Joongna diagnostic: ${JSON.stringify(diagnostic)}`);
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
    }
  }
  throw lastError;
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
          console.log(
            `Joongna images [${index + 1}/${products.length}]: ${enriched[index].images.length}`,
          );
        } catch (error) {
          enriched[index] = enrichProductImages(product, []);
          console.warn(
            `Joongna images [${index + 1}/${products.length}] fallback: ${error.message}`,
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

export async function crawlJoongna({ keyword, limit, sort }) {
  console.log(`Crawling Joongna (limit: ${limit}, sort: ${sort})`);

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200 });
    await page
      .goto("https://web.joongna.com/", { waitUntil: "networkidle2", timeout: 60000 })
      .catch((error) => {
        console.warn(`Joongna homepage warmup skipped: ${error.message}`);
      });
    await new Promise((resolve) => setTimeout(resolve, 1200));
    let products = [];
    let pageNumber = 1;
    while (products.length < limit) {
      const previousCount = products.length;
      const searchUrl = buildJoongnaSearchUrl(keyword, sort, pageNumber);
      console.log(`Joongna search page ${pageNumber}: ${searchUrl}`);
      await loadSearchPage(page, searchUrl, pageNumber);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const visibleProducts = (await collectVisibleProducts(page)).map(extractCardProduct);
      products = normalizeProducts([...products, ...visibleProducts], {
        sortByPrice: sort !== "newest",
      });
      if (products.length === previousCount) break;
      pageNumber += 1;
    }

    const sorted =
      sort === "newest"
        ? products
        : products.sort((a, b) => (sort === "price-desc" ? b.price - a.price : a.price - b.price));
    return await enrichDetailImages(browser, sorted.slice(0, limit));
  } finally {
    await browser.close();
  }
}
