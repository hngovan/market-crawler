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

test("desktop region filter fills both market columns", async (t) => {
  const port = await getFreePort();
  const server = await startServer(port);
  t.after(async () => {
    server.kill();
    await once(server, "close").catch(() => {});
  });

  const browser = await puppeteer.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:${port}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".market", { timeout: 10000 });
  assert.equal(
    await page.$$eval(".keyword-tags, .keyword-tag, .keyword-overflow", (tags) => tags.length),
    0,
  );
  const badgePosition = await page.$eval(".image-button:has(.image-badge)", (button) => {
    const buttonRect = button.getBoundingClientRect();
    const badgeRect = button.querySelector(".image-badge").getBoundingClientRect();
    return {
      buttonRight: Math.round(buttonRect.right),
      badgeRight: Math.round(badgeRect.right),
      badgeLeft: Math.round(badgeRect.left),
      buttonLeft: Math.round(buttonRect.left),
    };
  });
  assert.ok(
    badgePosition.buttonRight - badgePosition.badgeRight <= 18,
    `image badge should sit in the right corner: ${JSON.stringify(badgePosition)}`,
  );
  assert.ok(
    badgePosition.badgeLeft - badgePosition.buttonLeft > 40,
    `image badge should not sit in the left corner: ${JSON.stringify(badgePosition)}`,
  );
  await page.select("#region-filters", "korea");
  await page.waitForFunction(() => document.querySelectorAll(".market").length === 3);

  const layout = await page.$$eval(".market", (markets) =>
    markets.map((market) => {
      const rect = market.getBoundingClientRect();
      return {
        name: market.querySelector(".market-header h2")?.textContent,
        top: Math.round(rect.top),
        left: Math.round(rect.left),
      };
    }),
  );

  assert.deepEqual(
    layout.map((market) => market.name),
    ["Joongna", "Bunjang", "Guheyo"],
  );
  assert.ok(
    Math.abs(layout[0].top - layout[1].top) <= 4,
    `filtered markets should start on the same row: ${JSON.stringify(layout)}`,
  );
  assert.ok(
    layout[1].left > layout[0].left,
    `second filtered market should fill the right column: ${JSON.stringify(layout)}`,
  );
  assert.ok(
    layout[2].top > layout[0].top,
    `third filtered market should wrap after the filled first row: ${JSON.stringify(layout)}`,
  );
});

test("VND conversion toggle shows converted prices and update note", async (t) => {
  const port = await getFreePort();
  const server = await startServer(port);
  t.after(async () => {
    server.kill();
    await once(server, "close").catch(() => {});
  });

  const browser = await puppeteer.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.url().endsWith("/api/exchange-rates")) {
      request.respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          updatedAt: "2026-06-18T00:00:00.000Z",
          fetchedAt: "2026-06-18T00:01:00.000Z",
          vndPerCurrency: { KRW: 18.5, JPY: 172.25 },
        }),
      });
      return;
    }
    request.continue();
  });

  await page.goto(`http://localhost:${port}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".market", { timeout: 10000 });
  const originalPrice = await page.$eval(".price", (element) => element.textContent);
  await page.click("#vnd-toggle");
  await page.waitForFunction(() =>
    /^~[\d.]+đ$/.test(document.querySelector(".price")?.textContent || ""),
  );

  const conversion = await page.evaluate(() => ({
    checked: document.querySelector("#vnd-toggle")?.checked,
    priceText: document.querySelector(".price")?.textContent,
    priceTitle: document.querySelector(".price")?.getAttribute("title"),
    noteText: document.querySelector("#exchange-rate-note")?.textContent,
    noteAlign: getComputedStyle(document.querySelector("#exchange-rate-note")).textAlign,
    noteBackground: getComputedStyle(document.querySelector("#exchange-rate-note")).backgroundColor,
    convertedPriceCount: document.querySelectorAll(".converted-price").length,
  }));

  assert.equal(conversion.checked, true);
  assert.notEqual(conversion.priceText, originalPrice);
  assert.match(conversion.priceText, /^~[\d.]+đ$/);
  assert.equal(conversion.priceTitle, `Giá gốc: ${originalPrice}`);
  assert.equal(conversion.convertedPriceCount, 0);
  assert.equal(conversion.noteAlign, "left");
  assert.notEqual(conversion.noteBackground, "rgb(255, 212, 229)");
  assert.match(conversion.noteText, /Cập nhật lúc:/);
  assert.match(conversion.noteText, /1 KRW = 18,50đ/);
});

test("VND conversion toggle falls back to cached rates when API fails", async (t) => {
  const port = await getFreePort();
  const server = await startServer(port);
  t.after(async () => {
    server.kill();
    await once(server, "close").catch(() => {});
  });

  const browser = await puppeteer.launch({ headless: true });
  t.after(() => browser.close());

  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.url().endsWith("/api/exchange-rates")) {
      request.respond({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "unavailable" }),
      });
      return;
    }
    request.continue();
  });

  await page.goto(`http://localhost:${port}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".market", { timeout: 10000 });
  await page.evaluate(() => {
    localStorage.setItem(
      "market-crawler:vnd-exchange-rates",
      JSON.stringify({
        cachedAt: "2026-06-18T00:02:00.000Z",
        rates: {
          updatedAt: "2026-06-18T00:00:00.000Z",
          fetchedAt: "2026-06-18T00:01:00.000Z",
          vndPerCurrency: { KRW: 19, JPY: 173 },
        },
      }),
    );
  });
  await page.click("#vnd-toggle");
  await page.waitForFunction(() =>
    /^~[\d.]+đ$/.test(document.querySelector(".price")?.textContent || ""),
  );

  const conversion = await page.evaluate(() => ({
    priceText: document.querySelector(".price")?.textContent,
    noteText: document.querySelector("#exchange-rate-note")?.textContent,
    convertedPriceCount: document.querySelectorAll(".converted-price").length,
  }));

  assert.match(conversion.priceText, /^~[\d.]+đ$/);
  assert.equal(conversion.convertedPriceCount, 0);
  assert.match(conversion.noteText, /Đang dùng tỉ giá cache:/);
  assert.match(conversion.noteText, /1 KRW = 19,00đ/);
});
