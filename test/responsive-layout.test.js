import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import test from "node:test";

import puppeteer from "puppeteer";

async function startServer(port) {
  const server = spawn(process.execPath, ["server.js"], {
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  let output = "";
  server.stdout.on("data", (chunk) => {
    output += chunk.toString("utf8");
  });
  server.stderr.on("data", (chunk) => {
    output += chunk.toString("utf8");
  });

  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (output.includes(`http://localhost:${port}`)) return server;
    if (server.exitCode !== null) throw new Error(output || "Server exited");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  server.kill();
  throw new Error(`Server did not start on port ${port}: ${output}`);
}

async function getFreePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  server.close();
  await once(server, "close");
  return port;
}

test("720px viewport keeps markets full-width and uses two product columns", async (t) => {
  const port = await getFreePort();
  const server = await startServer(port);
  t.after(async () => {
    server.kill();
    await once(server, "close").catch(() => {});
  });

  const browser = await puppeteer.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  await page.setViewport({ width: 720, height: 816, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:${port}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".market", { timeout: 10000 });

  const layout = await page.evaluate(() => {
    const markets = document.querySelector(".markets");
    const productGrid = document.querySelector(".market .product-grid");
    const marketsStyle = getComputedStyle(markets);
    const productGridStyle = getComputedStyle(productGrid);
    const productColumns = productGridStyle.gridTemplateColumns.split(" ").filter(Boolean);
    const market = document.querySelector(".market");
    return {
      marketLayoutDisplay: marketsStyle.display,
      marketWidth: Math.round(market.getBoundingClientRect().width),
      marketsWidth: markets.clientWidth,
      productLayoutDisplay: productGridStyle.display,
      productColumnCount: productColumns.length,
      overflowX: marketsStyle.overflowX,
      clientWidth: markets.clientWidth,
      scrollWidth: markets.scrollWidth,
    };
  });

  assert.notEqual(layout.marketLayoutDisplay, "grid");
  assert.ok(
    layout.marketWidth >= layout.marketsWidth - 2,
    `market section should stay full-width: ${layout.marketWidth} < ${layout.marketsWidth}`,
  );
  assert.equal(layout.productLayoutDisplay, "grid");
  assert.equal(layout.productColumnCount, 2);
  assert.notEqual(layout.overflowX, "auto");
  assert.ok(
    layout.scrollWidth <= layout.clientWidth + 1,
    `markets overflowed horizontally: ${layout.scrollWidth} > ${layout.clientWidth}`,
  );
});
