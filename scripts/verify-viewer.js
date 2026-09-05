import puppeteer from "puppeteer";
import { readFile } from "node:fs/promises";

async function readProductTotal(marketId) {
  try {
    return JSON.parse(await readFile(`data/${marketId}.json`, "utf8")).length;
  } catch {
    return 0;
  }
}

const marketIds = ["joongna", "bunjang", "guheyo", "mercari"];
const totals = Object.fromEntries(
  await Promise.all(
    marketIds.map(async (marketId) => [marketId, await readProductTotal(marketId)]),
  ),
);
const marketManifest = JSON.parse(await readFile("data/markets.json", "utf8"));
const marketTotal = marketManifest.length;
const paginatedMarketId = marketIds.find((marketId) => totals[marketId] > 10);
const comparisonMarketId = marketIds.find(
  (marketId) => marketId !== paginatedMarketId && totals[marketId] > 0,
);
const viewerUrl = process.env.VIEWER_URL || "http://localhost:3000";

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto(viewerUrl, { waitUntil: "networkidle2", timeout: 30000 });
await page.waitForSelector(".market");

const initial = await page.evaluate(() => {
  const card = document.querySelector(".card");
  const content = document.querySelector(".content");
  const link = document.querySelector(".link");
  const name = document.querySelector(".name");
  const cardStyle = getComputedStyle(card);
  const contentStyle = getComputedStyle(content);
  const nameStyle = getComputedStyle(name);
  const headerStyle = getComputedStyle(document.querySelector("header"));
  return {
    title: document.querySelector("h1")?.textContent,
    headerText: document.querySelector("header")?.innerText,
    crawledAtText: document.querySelector("#header-crawled-at")?.textContent,
    filterCount: document.querySelectorAll("#filters option").length,
    visibleMarkets: document.querySelectorAll(".market:not([hidden])").length,
    cardBorder: cardStyle.borderTopWidth,
    contentDisplay: contentStyle.display,
    linkBottomGap: Math.round(
      card.getBoundingClientRect().bottom - link.getBoundingClientRect().bottom,
    ),
    nameClamp: nameStyle.webkitLineClamp,
    moreButtons: document.querySelectorAll(".name-more").length,
    tooltipCount: document.querySelectorAll(".name-tooltip").length,
    crawlSortOptions: [...document.querySelectorAll("#crawl-sort option")].map(
      (option) => option.value,
    ),
    pageSize: document.querySelector("#page-size")?.value,
    paginationCount: document.querySelectorAll(".pagination").length,
    joongnaCards: document.querySelectorAll('[data-market="joongna"] .card').length,
    guheyoCards: document.querySelectorAll('[data-market="guheyo"] .card').length,
    mercariCards: document.querySelectorAll('[data-market="mercari"] .card').length,
    badgeStyle: (() => {
      const badge = document.querySelector(".image-badge");
      const style = getComputedStyle(badge);
      return {
        background: style.backgroundColor,
        color: style.color,
        border: style.borderTopWidth,
        radius: style.borderRadius,
      };
    })(),
    bodyFont: getComputedStyle(document.body).fontFamily,
    headerRadius: headerStyle.borderRadius,
  };
});

await page.evaluate(() => {
  window.__setPageSizeForTest(10);
});
if (paginatedMarketId) {
  await page.click(`[data-market="${paginatedMarketId}"] .page-next`);
}
const independentPage = await page.evaluate(
  ({ paginatedMarketId, comparisonMarketId }) => ({
    activePage: document.querySelector(`[data-market="${paginatedMarketId}"] .page-info`)
      ?.textContent,
    comparisonPage: document.querySelector(`[data-market="${comparisonMarketId}"] .page-info`)
      ?.textContent,
    activeCards: document.querySelectorAll(`[data-market="${paginatedMarketId}"] .card`).length,
    comparisonCards: document.querySelectorAll(`[data-market="${comparisonMarketId}"] .card`)
      .length,
  }),
  { paginatedMarketId, comparisonMarketId },
);

await page.select("#filters", "mercari");
const filtered = await page.evaluate(() => ({
  visibleMarkets: document.querySelectorAll(".market:not([hidden])").length,
  visibleName: document.querySelector(".market:not([hidden]) .market-header h2")?.textContent,
}));

await page.hover(".market:not([hidden]) .name-wrap");
await new Promise((resolve) => setTimeout(resolve, 200));
const tooltipVisible = await page.$eval(
  ".market:not([hidden]) .name-tooltip",
  (element) => Number(getComputedStyle(element).opacity) === 1 && element.textContent.length > 0,
);
await page.select("#filters", "all");
await page.select("#page-size", "all");
const allMode = await page.evaluate(() => ({
  visiblePagination: document.querySelectorAll(".pagination:not([hidden])").length,
  joongnaCards: document.querySelectorAll('[data-market="joongna"] .card').length,
  bunjangCards: document.querySelectorAll('[data-market="bunjang"] .card').length,
  guheyoCards: document.querySelectorAll('[data-market="guheyo"] .card').length,
  mercariCards: document.querySelectorAll('[data-market="mercari"] .card').length,
}));
await page.click(".market:not([hidden]) .image-button");
await page.waitForSelector(".lg-container.lg-show", { timeout: 10000 });
const galleryOpened = true;
const legacyDemoRemoved = (await fetch(new URL("/retro-demo.html", viewerUrl))).status === 404;

console.log(
  JSON.stringify({
    initial,
    independentPage,
    filtered,
    tooltipVisible,
    allMode,
    galleryOpened,
    legacyDemoRemoved,
  }),
);
await browser.close();

if (
  initial.title !== "Multi-Market Crawling" ||
  !initial.headerText.toLowerCase().includes("sắp xếp:") ||
  !initial.crawledAtText.toLowerCase().includes("crawl thành công lần cuối:") ||
  initial.filterCount !== marketTotal + 1 ||
  initial.visibleMarkets !== marketTotal ||
  initial.contentDisplay !== "flex" ||
  initial.linkBottomGap > 20 ||
  initial.nameClamp !== "3" ||
  initial.moreButtons !== 0 ||
  initial.tooltipCount < 1 ||
  initial.crawlSortOptions.join(",") !== "price-asc,price-desc,newest" ||
  initial.pageSize !== "20" ||
  initial.paginationCount !== marketTotal ||
  initial.badgeStyle.background !== "rgba(15, 23, 42, 0.78)" ||
  initial.badgeStyle.color !== "rgb(255, 255, 255)" ||
  initial.badgeStyle.border !== "1px" ||
  initial.badgeStyle.radius === "0px" ||
  !initial.bodyFont.includes("Inter") ||
  initial.headerRadius === "0px" ||
  (paginatedMarketId &&
    independentPage.activePage !== `Trang 2 / ${Math.ceil(totals[paginatedMarketId] / 10)}`) ||
  (comparisonMarketId &&
    independentPage.comparisonPage !== `Trang 1 / ${Math.ceil(totals[comparisonMarketId] / 10)}`) ||
  (paginatedMarketId && independentPage.activeCards !== 10) ||
  (comparisonMarketId &&
    independentPage.comparisonCards !== Math.min(10, totals[comparisonMarketId])) ||
  filtered.visibleMarkets !== 1 ||
  filtered.visibleName !== "Mercari" ||
  !tooltipVisible ||
  allMode.visiblePagination !== 0 ||
  allMode.joongnaCards !== totals.joongna ||
  allMode.bunjangCards !== totals.bunjang ||
  allMode.guheyoCards !== totals.guheyo ||
  allMode.mercariCards !== totals.mercari ||
  !galleryOpened ||
  !legacyDemoRemoved
) {
  process.exitCode = 1;
}
