import { cp, mkdir, readFile, writeFile } from "node:fs/promises";

await mkdir("public/data", { recursive: true });
await mkdir("public/src", { recursive: true });
await cp("index.html", "public/index.html");
await cp("favicon.svg", "public/favicon.svg");
await cp("src/ui-products.js", "public/src/ui-products.js");

try {
  const markets = JSON.parse(await readFile("data/markets.json", "utf8"));
  await writeFile("public/data/markets.json", `${JSON.stringify(markets, null, 2)}\n`);
  for (const market of markets) {
    try {
      await cp(market.dataFile, `public/${market.dataFile}`);
    } catch {
      await writeFile(`public/${market.dataFile}`, "[]\n");
    }
  }
} catch {
  await writeFile("public/data/markets.json", "[]\n");
}
