export const supportedMarkets = ["joongna", "mercari"];
export const supportedSorts = ["price-asc", "price-desc", "newest"];

export function validateCrawlRequest(input = {}) {
  const keyword = String(input.keyword ?? "").trim();
  const limit = Number(input.limit);
  const markets = Array.isArray(input.markets) ? [...new Set(input.markets)] : [];
  const sort = String(input.sort ?? "");

  if (!keyword) throw new Error("Keyword must not be empty");
  if (!Number.isInteger(limit) || limit <= 0) throw new Error("Limit must be a positive integer");
  if (!markets.length || markets.some((market) => !supportedMarkets.includes(market))) {
    throw new Error("At least one supported market is required");
  }
  if (!supportedSorts.includes(sort)) throw new Error(`Unsupported sort: ${sort}`);

  return { keyword, limit, markets, sort };
}

export function toCrawlArguments(options) {
  return [
    `--keyword=${options.keyword}`,
    `--limit=${options.limit}`,
    `--markets=${options.markets.join(",")}`,
    `--sort=${options.sort}`,
  ];
}
