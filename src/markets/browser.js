import puppeteer from "puppeteer";

export function launchBrowser() {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  const headless = process.env.HEADLESS === "false" ? false : true;
  return puppeteer.launch({
    headless,
    ...(executablePath ? { executablePath } : {}),
    args: process.env.CI ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
  });
}
