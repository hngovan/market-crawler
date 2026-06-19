import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DAY_MS = 24 * 60 * 60 * 1000;

function isValidDate(value) {
  return !Number.isNaN(new Date(value).getTime());
}

export function pruneProductsByCrawledAt(products, { now = new Date(), retentionDays = 14 } = {}) {
  const cutoffMs = now.getTime() - retentionDays * DAY_MS;
  const cutoff = new Date(cutoffMs).toISOString();
  const kept = products.filter((product) => {
    if (!product.crawledAt || !isValidDate(product.crawledAt)) return true;
    return new Date(product.crawledAt).getTime() >= cutoffMs;
  });

  return {
    products: kept,
    removed: products.length - kept.length,
    cutoff,
  };
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function listProductDataFiles(dataDir) {
  const markets = await readJson(path.join(dataDir, "markets.json"), []);
  const manifestFiles = markets
    .map((market) => market.dataFile)
    .filter(Boolean)
    .map((dataFile) => path.resolve(dataFile));

  if (manifestFiles.length > 0) return [...new Set(manifestFiles)];

  const entries = await readdir(dataDir, { withFileTypes: true });
  return entries
    .filter(
      (entry) => entry.isFile() && entry.name.endsWith(".json") && entry.name !== "markets.json",
    )
    .map((entry) => path.join(dataDir, entry.name));
}

export async function cleanupDataFiles({
  dataDir = "data",
  now = new Date(),
  retentionDays = 14,
} = {}) {
  const files = await listProductDataFiles(dataDir);
  const results = [];

  for (const filePath of files) {
    const products = await readJson(filePath, []);
    if (!Array.isArray(products)) continue;

    const result = pruneProductsByCrawledAt(products, { now, retentionDays });
    if (result.removed > 0) {
      await writeFile(filePath, `${JSON.stringify(result.products, null, 2)}\n`, "utf8");
    }

    results.push({
      filePath,
      before: products.length,
      after: result.products.length,
      removed: result.removed,
      cutoff: result.cutoff,
    });
  }

  return results;
}
