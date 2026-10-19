import { createPreparedMarketPage, launchBrowser } from "./browser.js";
import { buildYahooAuctionsSearchUrl } from "./page-navigation.js";
import { marketDefinitions } from "./registry.js";
import { extractYahooAuctionProduct } from "./yahoo-auctions-products.js";

export const yahooAuctionsMarket = marketDefinitions["yahoo-auctions"];

async function collectVisibleProducts(page) {
  // Yahoo's search grid uses generated utility classes, so anchor on semantic attributes.
  return page.$$eval("#searchItems li", (elements) =>
    elements
      .map((element) => {
        const title = element.querySelector("[data-grid-item-title]");
        const link = title?.closest("a");
        const image = element.querySelector("img");
        const tracking = link?.getAttribute("data-cl-params") || "";
        const extra = tracking.match(/(?:^|;)etc:([^;]*)/)?.[1] || "";
        const priceRow = title?.nextElementSibling?.querySelector("p");
        const priceLabel = priceRow?.querySelector("span")?.textContent.trim() || "";
        const currentPrice =
          extra.match(/(?:^|,)p=(\d+)/)?.[1] || priceRow?.textContent.replace(priceLabel, "") || "";
        const isBuyNow = priceLabel === "即決";
        const bidRow = element.querySelector('[aria-label="入札件数"]')?.closest("p");
        return {
          name: title?.getAttribute("title") || title?.textContent || image?.alt || "",
          currentPrice,
          startPrice: isBuyNow ? currentPrice : "",
          buyNowPrice: isBuyNow ? currentPrice : "",
          bidCount: bidRow?.textContent || extra.match(/(?:^|,)b=(\d+)/)?.[1] || "0",
          startTime: tracking.match(/(?:^|;)st:(\d+)/)?.[1] || "",
          endTime: tracking.match(/(?:^|;)end:(\d+)/)?.[1] || "",
          url: link?.href || "",
          image: image?.currentSrc || image?.src || "",
        };
      })
      .filter((card) => card.url),
  );
}

export async function collectYahooAuctionProducts({ limit, sort, loadPage, now = new Date() }) {
  const uniqueProducts = new Map();

  for (let pageNumber = 1; uniqueProducts.size < limit; pageNumber += 1) {
    const previousCount = uniqueProducts.size;
    const cards = await loadPage(pageNumber);
    let parsedCount = 0;
    for (const card of cards) {
      const product = extractYahooAuctionProduct(card, now);
      if (!product) continue;
      parsedCount += 1;
      if (!uniqueProducts.has(product.url)) uniqueProducts.set(product.url, product);
    }
    if (cards.length > 0 && parsedCount === 0) {
      throw new Error(
        `Yahoo! Auctions parser could not parse any of ${cards.length} product cards on page ${pageNumber}`,
      );
    }
    if (cards.length < 50 || uniqueProducts.size === previousCount) break;
  }

  return [...uniqueProducts.values()]
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return new Date(b.postedAt || 0).getTime() - new Date(a.postedAt || 0).getTime();
    })
    .slice(0, limit);
}

export async function loadYahooAuctionPage(page, searchUrl) {
  const response = await page.goto(searchUrl, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  const status = response?.status() ?? 0;
  if (status === 404) return [];
  if ([403, 429, 503].includes(status)) {
    throw new Error(`Yahoo! Auctions blocked or unavailable: HTTP ${status}`);
  }
  if (status >= 400) throw new Error(`Yahoo! Auctions unavailable: HTTP ${status}`);
  const cards = await collectVisibleProducts(page);
  if (cards.length > 0) return cards;

  const hasNoResultsMarker = await page.evaluate(
    (marker) => document.body?.innerText.includes(marker) ?? false,
    "条件に一致する商品は見つかりませんでした。",
  );
  if (hasNoResultsMarker) return [];
  throw new Error("Yahoo! Auctions returned no product cards or no-results marker");
}

export async function crawlYahooAuctions({ keyword, limit, sort }) {
  console.log(`Crawling Yahoo! Auctions (limit: ${limit}, sort: ${sort})`);
  const browser = await launchBrowser();

  try {
    const page = await createPreparedMarketPage(browser, {
      language: "ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7",
    });
    await page.setViewport({ width: 1440, height: 1200 });
    const products = await collectYahooAuctionProducts({
      limit,
      sort,
      async loadPage(pageNumber) {
        const searchUrl = buildYahooAuctionsSearchUrl(keyword, sort, pageNumber);
        console.log(`Yahoo! Auctions search page ${pageNumber}: ${searchUrl}`);
        return loadYahooAuctionPage(page, searchUrl);
      },
    });
    return products;
  } finally {
    await browser.close();
  }
}
