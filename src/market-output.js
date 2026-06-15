export function addMarketMetadata(products, market) {
  return products.map((product) => ({
    market: market.id,
    marketName: market.name,
    currency: market.currency,
    ...product,
  }));
}

export function createMarketStatus(market, products, error = "", crawl = {}) {
  return {
    id: market.id,
    name: market.name,
    currency: market.currency,
    status: error ? "skipped" : "success",
    count: products.length,
    error,
    dataFile: `data/${market.id}.json`,
    crawl,
  };
}
