export function addMarketMetadata(products, market, keyword = "") {
  return products.map((product) => ({
    ...product,
    market: market.id,
    marketName: market.name,
    region: market.region ?? "",
    regionName: market.regionName ?? "",
    regionFlag: market.regionFlag ?? "",
    currency: market.currency,
    keywords: [...new Set([...(product.keywords ?? []), keyword].filter(Boolean))],
  }));
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
    });
  }
  return [...byUrl.values()];
}

export function extractProductKeywords(products) {
  return [...new Set(products.flatMap((product) => product.keywords ?? []))];
}

export function createMarketStatus(market, products, error = "", crawl = {}) {
  return {
    id: market.id,
    name: market.name,
    region: market.region ?? "",
    regionName: market.regionName ?? "",
    regionFlag: market.regionFlag ?? "",
    currency: market.currency,
    status: error ? "skipped" : "success",
    count: products.length,
    error,
    dataFile: `data/${market.id}.json`,
    crawl,
  };
}
