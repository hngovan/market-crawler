import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  addMarketMetadata,
  createMarketStatus,
  extractProductKeywords,
  mergeProductsByUrl,
} from "./src/market-output.js";
import { crawlBunjang, bunjangMarket } from "./src/markets/bunjang.js";
import { crawlJoongna, joongnaMarket } from "./src/markets/joongna.js";
import { crawlMercari, mercariMarket } from "./src/markets/mercari.js";
import { parseOptions } from "./src/options.js";
import { formatProductLog } from "./src/products.js";

const adapters = {
  joongna: { market: joongnaMarket, crawl: crawlJoongna },
  bunjang: { market: bunjangMarket, crawl: crawlBunjang },
  mercari: { market: mercariMarket, crawl: crawlMercari },
};

async function writeJson(filePath, data) {
  await writeFile(path.resolve(filePath), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function readExistingStatuses() {
  try {
    return JSON.parse(await readFile(path.resolve("data/markets.json"), "utf8"));
  } catch {
    return [];
  }
}

async function readExistingProducts(marketId) {
  try {
    return JSON.parse(await readFile(path.resolve(`data/${marketId}.json`), "utf8"));
  } catch {
    return [];
  }
}

function hydrateMarketStatus(status, market) {
  if (!status) return status;
  return {
    ...status,
    name: market.name,
    region: market.region ?? status.region ?? "",
    regionName: market.regionName ?? status.regionName ?? "",
    regionFlag: market.regionFlag ?? status.regionFlag ?? "",
    currency: market.currency,
  };
}

async function crawl() {
  const options = parseOptions(process.argv.slice(2));
  await mkdir("data", { recursive: true });
  const statusByMarket = new Map((await readExistingStatuses()).map((status) => [status.id, status]));

  for (const marketId of options.markets) {
    const adapter = adapters[marketId];
    if (!adapter) {
      console.warn(`Unknown market skipped: ${marketId}`);
      continue;
    }

    let products = [];
    const errors = [];
    for (const keyword of options.keywords) {
      try {
        const keywordProducts = addMarketMetadata(
          await adapter.crawl({ ...options, keyword }),
          adapter.market,
          keyword,
        );
        products.push(...keywordProducts);
      } catch (crawlError) {
        errors.push(`${keyword}: ${crawlError.message}`);
        console.warn(`${adapter.market.name} keyword "${keyword}" skipped: ${crawlError.message}`);
      }
    }

    products = mergeProductsByUrl([...await readExistingProducts(marketId), ...products]);
    let error = products.length === 0 ? errors.join(" | ") : "";
    if (products.length > 0) {
      console.log(`\n${adapter.market.name} products (${products.length}):`);
      products.forEach((product, index) => console.log(formatProductLog(product, index)));
      await writeJson(`data/${marketId}.json`, products);
    } else {
      products = await readExistingProducts(marketId);
      console.warn(`${adapter.market.name} skipped: ${error}`);
      console.warn(`${adapter.market.name}: keeping ${products.length} products from the previous successful crawl`);
    }

    statusByMarket.set(marketId, createMarketStatus(adapter.market, products, error, {
      keyword: options.keyword,
      keywords: extractProductKeywords(products),
      sort: options.sort,
      limit: options.limit,
      crawledAt: new Date().toISOString(),
    }));
  }

  const statuses = Object.keys(adapters)
    .map((marketId) => hydrateMarketStatus(statusByMarket.get(marketId), adapters[marketId].market))
    .filter(Boolean);
  await writeJson("data/markets.json", statuses);
  console.log(`Saved market manifest to ${path.resolve("data/markets.json")}`);

  const selectedStatuses = options.markets.map((marketId) => statusByMarket.get(marketId)).filter(Boolean);
  if (selectedStatuses.length > 0 && selectedStatuses.every((status) => status.status !== "success")) {
    throw new Error("All selected markets failed");
  }
}

crawl().catch((error) => {
  console.error(`Crawl failed: ${error.message}`);
  process.exitCode = 1;
});
