export function formatKeywordTags(keywords = []) {
  return [...new Set(keywords.map((keyword) => String(keyword).trim()).filter(Boolean))];
}

export function hydrateProducts(market, products) {
  const crawlKeywords = market.crawl?.keywords?.length
    ? market.crawl.keywords
    : [market.crawl?.keyword].filter(Boolean);

  return products.map((product) => ({
    ...product,
    market: product.market || market.id,
    marketName: product.marketName || market.name,
    region: product.region || market.region || "",
    regionName: product.regionName || market.regionName || "",
    regionFlag: product.regionFlag || market.regionFlag || "",
    currency: product.currency || market.currency,
    keywords: formatKeywordTags(product.keywords?.length ? product.keywords : crawlKeywords),
  }));
}
