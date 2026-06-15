import puppeteer from "puppeteer";
import { readFile } from "node:fs/promises";

const joongnaTotal = JSON.parse(await readFile("data/joongna.json", "utf8")).length;
const mercariTotal = JSON.parse(await readFile("data/mercari.json", "utf8")).length;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 30000 });
await page.waitForSelector(".market");

const initial = await page.evaluate(() => {
  const card = document.querySelector(".card");
  const content = document.querySelector(".content");
  const link = document.querySelector(".link");
  const name = document.querySelector(".name");
  const cardStyle = getComputedStyle(card);
  const contentStyle = getComputedStyle(content);
  const nameStyle = getComputedStyle(name);
  return {
    title: document.querySelector("h1")?.textContent,
    headerText: document.querySelector("header")?.innerText,
    filterCount: document.querySelectorAll(".market-filter").length,
    visibleMarkets: document.querySelectorAll(".market:not([hidden])").length,
    cardBorder: cardStyle.borderTopWidth,
    contentDisplay: contentStyle.display,
    linkBottomGap: Math.round(card.getBoundingClientRect().bottom - link.getBoundingClientRect().bottom),
    nameClamp: nameStyle.webkitLineClamp,
    moreButtons: document.querySelectorAll(".name-more").length,
    tooltipCount: document.querySelectorAll(".name-tooltip").length,
    crawlSortOptions: [...document.querySelectorAll("#crawl-sort option")].map((option) => option.value),
    pageSize: document.querySelector("#page-size")?.value,
    paginationCount: document.querySelectorAll(".pagination").length,
    joongnaCards: document.querySelectorAll('[data-market="joongna"] .card').length,
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
  };
});

await page.evaluate(() => {
  window.__setPageSizeForTest(10);
});
await page.click('[data-market="joongna"] .page-next');
const independentPage = await page.evaluate(() => ({
  joongnaPage: document.querySelector('[data-market="joongna"] .page-info')?.textContent,
  mercariPage: document.querySelector('[data-market="mercari"] .page-info')?.textContent,
  joongnaCards: document.querySelectorAll('[data-market="joongna"] .card').length,
  mercariCards: document.querySelectorAll('[data-market="mercari"] .card').length,
}));

await page.click('[data-market-filter="mercari"]');
const filtered = await page.evaluate(() => ({
  visibleMarkets: document.querySelectorAll(".market:not([hidden])").length,
  visibleName: document.querySelector(".market:not([hidden]) .market-header h2")?.textContent,
}));

await page.hover(".market:not([hidden]) .name-wrap");
await new Promise((resolve) => setTimeout(resolve, 200));
const tooltipVisible = await page.$eval(".market:not([hidden]) .name-tooltip", (element) =>
  Number(getComputedStyle(element).opacity) === 1 && element.textContent.length > 0,
);
await page.select("#page-size", "all");
const allMode = await page.evaluate(() => ({
  visiblePagination: document.querySelectorAll(".pagination:not([hidden])").length,
  joongnaCards: document.querySelectorAll('[data-market="joongna"] .card').length,
  mercariCards: document.querySelectorAll('[data-market="mercari"] .card').length,
}));
await page.click(".market:not([hidden]) .image-button");
await page.waitForSelector(".lg-container.lg-show", { timeout: 10000 });
const galleryOpened = true;
const retroDemoRemoved = (await fetch("http://localhost:3000/retro-demo.html")).status === 404;

console.log(JSON.stringify({ initial, independentPage, filtered, tooltipVisible, allMode, galleryOpened, retroDemoRemoved }));
await browser.close();

if (
  initial.title !== "Multi-Market Crawling" ||
  !initial.headerText.toLowerCase().includes("từ khóa: realforce") ||
  !initial.headerText.toLowerCase().includes("tìm kiếm theo giá: từ thấp đến cao") ||
  initial.filterCount !== 3 ||
  initial.visibleMarkets !== 2 ||
  initial.contentDisplay !== "flex" ||
  initial.linkBottomGap > 20 ||
  initial.nameClamp !== "3" ||
  initial.moreButtons !== 0 ||
  initial.tooltipCount < 1 ||
  initial.crawlSortOptions.join(",") !== "price-asc,price-desc,newest" ||
  initial.pageSize !== "20" ||
  initial.paginationCount !== 2 ||
  initial.badgeStyle.background !== "rgb(109, 224, 222)" ||
  initial.badgeStyle.color !== "rgb(48, 21, 71)" ||
  initial.badgeStyle.border !== "3px" ||
  initial.badgeStyle.radius !== "0px" ||
  independentPage.joongnaPage !== `Trang 2 / ${Math.ceil(joongnaTotal / 10)}` ||
  independentPage.mercariPage !== `Trang 1 / ${Math.ceil(mercariTotal / 10)}` ||
  independentPage.joongnaCards !== 10 ||
  independentPage.mercariCards !== 10 ||
  filtered.visibleMarkets !== 1 ||
  filtered.visibleName !== "Mercari" ||
  !tooltipVisible ||
  allMode.visiblePagination !== 0 ||
  allMode.joongnaCards !== joongnaTotal ||
  allMode.mercariCards !== mercariTotal ||
  !galleryOpened ||
  !retroDemoRemoved
) {
  process.exitCode = 1;
}
