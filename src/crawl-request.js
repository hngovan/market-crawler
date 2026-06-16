import { normalizeKeywords, supportedMarkets, supportedSorts } from "./markets/registry.js";

export { supportedMarkets, supportedSorts };

export function validateCrawlRequest(input = {}) {
  const keywords = normalizeKeywords(input.keywords ?? input.keyword);
  const keyword = keywords[0] ?? "";
  const limit = Number(input.limit);
  const markets = Array.isArray(input.markets) ? [...new Set(input.markets)] : [];
  const sort = String(input.sort ?? "");

  if (!keyword) throw new Error("Keyword must not be empty");
  if (!Number.isInteger(limit) || limit <= 0) throw new Error("Limit must be a positive integer");
  if (!markets.length || markets.some((market) => !supportedMarkets.includes(market))) {
    throw new Error("At least one supported market is required");
  }
  if (!supportedSorts.includes(sort)) throw new Error(`Unsupported sort: ${sort}`);

  return { keyword, keywords, limit, markets, sort };
}

export function toCrawlArguments(options) {
  const keywords = normalizeKeywords(options.keywords ?? options.keyword);
  return [
    `--keywords=${keywords.join(",")}`,
    `--limit=${options.limit}`,
    `--markets=${options.markets.join(",")}`,
    `--sort=${options.sort}`,
  ];
}
