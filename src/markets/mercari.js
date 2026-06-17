import { launchBrowser } from "./browser.js";
import { extractMercariCard, normalizeMercariImages } from "./mercari-products.js";
import { buildMercariSearchUrl, findMercariNextUrl } from "./page-navigation.js";
import { extractMercariPostedAt } from "./product-date.js";
import { marketDefinitions } from "./registry.js";

export const mercariMarket = marketDefinitions.mercari;

async function collectVisibleProducts(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('a[data-testid="thumbnail-link"][href*="/item/"]')].map(
      (anchor) => {
        const image = anchor.querySelector("img");
        const labelledElement = anchor.querySelector('[aria-label*="円"]') ?? anchor;
        return {
          ariaLabel: labelledElement.getAttribute("aria-label") || "",
          imageAlt: image?.alt || "",
          url: anchor.href,
          image: image?.currentSrc || image?.src || "",
        };
      },
    ),
  );
}

async function loadSearchPage(page, searchUrl, pageNumber, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await page.goto(searchUrl, {
        waitUntil: "domcontentloaded",
        timeout: 90000,
      });
      const status = response?.status() ?? 0;
      if ([403, 429, 503].includes(status)) {
        const text = await page
          .evaluate(() => document.body?.innerText?.slice(0, 500) || "")
          .catch(() => "");
        throw new Error(
          `Mercari blocked or unavailable: HTTP ${status}${text ? ` - ${text}` : ""}`,
        );
      }
      await page.waitForSelector('a[data-testid="thumbnail-link"][href*="/item/"]', {
        timeout: 75000,
      });
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
        `Mercari page ${pageNumber} attempt ${attempt}/${attempts} failed: ${error.message}`,
      );
      console.warn(`Mercari diagnostic: ${JSON.stringify(diagnostic)}`);
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 4000));
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
          await page.goto(product.url, { waitUntil: "domcontentloaded", timeout: 90000 });
          await new Promise((resolve) => setTimeout(resolve, 1200));
          const detail = await page.evaluate(() => ({
            imageUrls: [...document.images].map((image) => image.currentSrc || image.src),
            text: document.body.innerText,
          }));
          const images = normalizeMercariImages(detail.imageUrls);
          const posted = extractMercariPostedAt(detail.text);
          enriched[index] = {
            ...product,
            ...posted,
            images: images.length > 0 ? images : [product.image].filter(Boolean),
          };
          console.log(
            `Mercari images [${index + 1}/${products.length}]: ${enriched[index].images.length}`,
          );
        } catch (error) {
          enriched[index] = { ...product, images: [product.image].filter(Boolean) };
          console.warn(
            `Mercari images [${index + 1}/${products.length}] fallback: ${error.message}`,
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

export async function crawlMercari({ keyword, limit, sort }) {
  console.log(`Crawling Mercari (limit: ${limit}, sort: ${sort})`);

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200 });
    await page
      .goto("https://jp.mercari.com/", { waitUntil: "domcontentloaded", timeout: 90000 })
      .catch((error) => {
        console.warn(`Mercari homepage warmup skipped: ${error.message}`);
      });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const uniqueProducts = new Map();
    let searchUrl = buildMercariSearchUrl(keyword, sort);
    let pageNumber = 1;
    while (uniqueProducts.size < limit && searchUrl) {
      const previousCount = uniqueProducts.size;
      console.log(`Mercari search page ${pageNumber}: ${searchUrl}`);
      await loadSearchPage(page, searchUrl, pageNumber);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise((resolve) => setTimeout(resolve, 2500));
      for (const card of await collectVisibleProducts(page)) {
        const product = extractMercariCard(card);
        if (product.name && product.price !== null && !uniqueProducts.has(product.url)) {
          uniqueProducts.set(product.url, product);
        }
      }
      if (uniqueProducts.size === previousCount) break;
      const links = await page.evaluate(() =>
        [...document.querySelectorAll("a[href]")].map((anchor) => anchor.href),
      );
      searchUrl = findMercariNextUrl(links);
      pageNumber += 1;
    }

    const collectedProducts = [...uniqueProducts.values()];
    const products = (
      sort === "newest"
        ? collectedProducts
        : collectedProducts.sort((a, b) =>
            sort === "price-desc" ? b.price - a.price : a.price - b.price,
          )
    ).slice(0, limit);
    if (products.length === 0) throw new Error("No valid Mercari products found");
    return await enrichDetailImages(browser, products);
  } finally {
    await browser.close();
  }
}
