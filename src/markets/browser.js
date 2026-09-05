import puppeteer from "puppeteer";

export async function prepareMarketPage(page, { language = "en-US,en;q=0.9" } = {}) {
  const userAgent = await page.browser().userAgent();
  await page.setUserAgent(userAgent.replace("HeadlessChrome", "Chrome"));
  await page.setExtraHTTPHeaders({ "Accept-Language": language });
}

export async function createPreparedMarketPage(browser, options) {
  const page = await browser.newPage();
  await prepareMarketPage(page, options);
  return page;
}

export function launchBrowser() {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  const headless = process.env.HEADLESS === "false" ? false : true;
  return puppeteer.launch({
    headless,
    ...(executablePath ? { executablePath } : {}),
    args: process.env.CI ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
  });
}
