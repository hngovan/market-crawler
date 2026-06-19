import process from "node:process";

import { cleanupDataFiles } from "../src/data-cleanup.js";

function parseRetentionDays(args) {
  const value = args.find((arg) => arg.startsWith("--retention-days="))?.split("=")[1];
  const days = Number(value ?? 14);
  if (!Number.isInteger(days) || days <= 0) {
    throw new Error("--retention-days must be a positive integer");
  }
  return days;
}

try {
  const retentionDays = parseRetentionDays(process.argv.slice(2));
  const results = await cleanupDataFiles({ retentionDays });
  const removedTotal = results.reduce((sum, result) => sum + result.removed, 0);

  for (const result of results) {
    console.log(
      `${result.filePath}: ${result.before} -> ${result.after} products ` +
        `(removed ${result.removed}, cutoff ${result.cutoff})`,
    );
  }

  console.log(`Removed ${removedTotal} products older than ${retentionDays} days.`);
} catch (error) {
  console.error(`Cleanup failed: ${error.message}`);
  process.exitCode = 1;
}
