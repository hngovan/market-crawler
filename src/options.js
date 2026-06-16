import { defaultMarkets, normalizeKeywords, supportedSorts } from "./markets/registry.js";

export function parseOptions(args) {
  const options = {
    keyword: "realforce",
    keywords: ["realforce"],
    limit: 50,
    markets: [...defaultMarkets],
    sort: "newest",
  };

  for (const arg of args) {
    if (arg.startsWith("--keyword=")) {
      const keyword = arg.slice("--keyword=".length).trim();
      if (!keyword) {
        throw new Error("Keyword must not be empty");
      }
      options.keyword = keyword;
      options.keywords = [keyword];
    }

    if (arg.startsWith("--keywords=")) {
      const keywords = normalizeKeywords(arg.slice("--keywords=".length));
      if (keywords.length === 0) {
        throw new Error("Keyword must not be empty");
      }
      options.keywords = keywords;
      options.keyword = keywords[0];
    }

    if (arg.startsWith("--limit=")) {
      const limit = Number(arg.slice("--limit=".length));
      if (!Number.isInteger(limit) || limit <= 0) {
        throw new Error("Limit must be a positive integer");
      }
      options.limit = limit;
    }

    if (arg.startsWith("--markets=")) {
      const markets = arg.slice("--markets=".length).split(",").map((market) => market.trim()).filter(Boolean);
      if (markets.length === 0) {
        throw new Error("At least one market is required");
      }
      options.markets = markets;
    }

    if (arg.startsWith("--sort=")) {
      const sort = arg.slice("--sort=".length);
      if (!supportedSorts.includes(sort)) {
        throw new Error(`Unsupported sort: ${sort}`);
      }
      options.sort = sort;
    }
  }

  return options;
}
