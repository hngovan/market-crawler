import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { addMarketMetadata, createMarketStatus } from "./src/market-output.js";
import { crawlJoongna, joongnaMarket } from "./src/markets/joongna.js";
import { crawlMercari, mercariMarket } from "./src/markets/mercari.js";
import { parseOptions } from "./src/options.js";
import { formatProductLog } from "./src/products.js";

const adapters = {
  joongna: { market: joongnaMarket, crawl: crawlJoongna },
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
    let error = "";
    try {
      products = addMarketMetadata(await adapter.crawl(options), adapter.market);
      console.log(`\n${adapter.market.name} products (${products.length}):`);
      products.forEach((product, index) => console.log(formatProductLog(product, index)));
    } catch (crawlError) {
      error = crawlError.message;
      console.warn(`${adapter.market.name} skipped: ${error}`);
    }

    await writeJson(`data/${marketId}.json`, products);
    statusByMarket.set(marketId, createMarketStatus(adapter.market, products, error));
  }

  const statuses = Object.keys(adapters).map((marketId) => statusByMarket.get(marketId)).filter(Boolean);
  await writeJson("data/markets.json", statuses);
  console.log(`Saved market manifest to ${path.resolve("data/markets.json")}`);
}

crawl().catch((error) => {
  console.error(`Crawl failed: ${error.message}`);
  process.exitCode = 1;
});
