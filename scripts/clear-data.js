import process from "node:process";

import { clearMarketDataFiles } from "../src/data-reset.js";

try {
  const result = await clearMarketDataFiles({ dataDir: process.env.DATA_DIR || "data" });
  console.log(`Cleared ${result.clearedProducts} products from ${result.clearedMarkets} markets.`);
} catch (error) {
  console.error(`Clear data failed: ${error.message}`);
  process.exitCode = 1;
}
