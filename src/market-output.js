export function addMarketMetadata(products, market, keyword = "", crawledAt = "") {
  return products.map((product) => ({
    ...product,
    market: market.id,
    marketName: market.name,
    region: market.region ?? "",
    regionName: market.regionName ?? "",
    regionFlag: market.regionFlag ?? "",
    currency: market.currency,
    keywords: [...new Set([...(product.keywords ?? []), keyword].filter(Boolean))],
    ...(crawledAt ? { crawledAt } : {}),
  }));
}

export function backfillProductCrawledAt(products, crawledAt) {
  return products.map((product) => (product.crawledAt ? product : { ...product, crawledAt }));
}

export function mergeProductsByUrl(products) {
  const byUrl = new Map();
  for (const product of products) {
    const existing = byUrl.get(product.url);
    if (!existing) {
      byUrl.set(product.url, product);
      continue;
    }
    byUrl.set(product.url, {
      ...existing,
      ...product,
      keywords: [...new Set([...(existing.keywords ?? []), ...(product.keywords ?? [])])],
      images: product.images?.length ? product.images : existing.images,
      crawledAt: existing.crawledAt ?? product.crawledAt,
    });
  }
  return [...byUrl.values()];
}

export function mergeCrawlProducts(existingProducts, currentProducts, options = {}) {
  const { retainExisting = true } = options;
  return mergeProductsByUrl(
    retainExisting ? [...existingProducts, ...currentProducts] : currentProducts,
  );
}

export function resolveCrawlProducts(existingProducts, currentProducts, options = {}) {
  const { successfulCrawls = 0, retainExisting = true } = options;
  if (successfulCrawls === 0) return { products: existingProducts, shouldWrite: false };
  return {
    products: mergeCrawlProducts(existingProducts, currentProducts, { retainExisting }),
    shouldWrite: true,
  };
}

export function extractProductKeywords(products) {
  return [...new Set(products.flatMap((product) => product.keywords ?? []))];
}

export function summarizeKeywordErrors(errors) {
  return errors.join(" | ");
}

export function createMarketStatus(market, products, error = "", crawl = {}, options = {}) {
  const { succeeded = !error } = options;
  return {
    id: market.id,
    name: market.name,
    region: market.region ?? "",
    regionName: market.regionName ?? "",
    regionFlag: market.regionFlag ?? "",
    currency: market.currency,
    status: succeeded ? "success" : "skipped",
    count: products.length,
    error,
    dataFile: `data/${market.id}.json`,
    crawl,
  };
}
