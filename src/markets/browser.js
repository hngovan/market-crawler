import puppeteer from "puppeteer";

export function launchBrowser() {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  return puppeteer.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: process.env.CI ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
  });
}
