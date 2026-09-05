import { rename, readFile, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const defaultFileSystem = { readFile, rename, unlink, writeFile };

async function readRequiredJson(filePath, label, fileSystem) {
  try {
    return JSON.parse(await fileSystem.readFile(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Invalid or missing ${label}: ${error.message}`);
  }
}

async function replaceFilesTransactionally(replacements, fileSystem) {
  const transactionId = randomUUID();
  const files = replacements.map(({ filePath, content }) => ({
    filePath,
    content,
    temporaryPath: `${filePath}.${transactionId}.tmp`,
    backupPath: `${filePath}.${transactionId}.backup`,
    backedUp: false,
  }));

  try {
    for (const file of files) {
      await fileSystem.writeFile(file.temporaryPath, file.content, "utf8");
    }
    for (const file of files) {
      await fileSystem.rename(file.filePath, file.backupPath);
      file.backedUp = true;
      await fileSystem.rename(file.temporaryPath, file.filePath);
    }
    await Promise.all(files.map((file) => fileSystem.unlink(file.backupPath).catch(() => {})));
  } catch (error) {
    const rollbackErrors = [];
    for (const file of [...files].reverse()) {
      if (!file.backedUp) continue;
      try {
        await fileSystem.unlink(file.filePath).catch(() => {});
        await fileSystem.rename(file.backupPath, file.filePath);
      } catch (rollbackError) {
        rollbackErrors.push(`${file.filePath}: ${rollbackError.message}`);
      }
    }
    await Promise.all(files.map((file) => fileSystem.unlink(file.temporaryPath).catch(() => {})));
    if (rollbackErrors.length > 0) {
      throw new Error(`${error.message}; rollback failed for ${rollbackErrors.join(" | ")}`);
    }
    throw error;
  }
}

export async function clearMarketDataFiles({
  dataDir = "data",
  fileSystem = defaultFileSystem,
} = {}) {
  const manifestPath = path.join(dataDir, "markets.json");
  const markets = await readRequiredJson(manifestPath, "market manifest", fileSystem);
  if (!Array.isArray(markets) || markets.length === 0) {
    throw new Error("Invalid market manifest: expected at least one market");
  }
  const productFiles = [];
  const productTargets = new Set();
  const manifestTarget = path.resolve(manifestPath).toLowerCase();
  let clearedProducts = 0;

  for (const market of markets) {
    const filePath = path.join(dataDir, path.basename(market.dataFile || `${market.id}.json`));
    const target = path.resolve(filePath).toLowerCase();
    if (target === manifestTarget) {
      throw new Error(`Product data target collides with market manifest: ${filePath}`);
    }
    if (productTargets.has(target)) {
      throw new Error(`Duplicate product data target: ${filePath}`);
    }
    productTargets.add(target);
    const products = await readRequiredJson(
      filePath,
      `product data for ${market.id || "market"}`,
      fileSystem,
    );
    if (!Array.isArray(products)) {
      throw new Error(`Invalid product data for ${market.id || "market"}: expected an array`);
    }
    clearedProducts += products.length;
    productFiles.push(filePath);
  }

  const resetMarkets = markets.map(({ crawl: _crawl, ...market }) => ({
    ...market,
    status: "success",
    count: 0,
    error: "",
  }));
  await replaceFilesTransactionally(
    [
      ...productFiles.map((filePath) => ({ filePath, content: "[]\n" })),
      { filePath: manifestPath, content: `${JSON.stringify(resetMarkets, null, 2)}\n` },
    ],
    fileSystem,
  );

  return { clearedMarkets: markets.length, clearedProducts };
}
