export function parseOptions(args) {
  const options = {
    keyword: "realforce",
    limit: 20,
    markets: ["joongna", "mercari"],
    sort: "price-asc",
  };

  for (const arg of args) {
    if (arg.startsWith("--keyword=")) {
      const keyword = arg.slice("--keyword=".length).trim();
      if (!keyword) {
        throw new Error("Keyword must not be empty");
      }
      options.keyword = keyword;
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
      if (!["price-asc", "price-desc", "newest"].includes(sort)) {
        throw new Error(`Unsupported sort: ${sort}`);
      }
      options.sort = sort;
    }
  }

  return options;
}
