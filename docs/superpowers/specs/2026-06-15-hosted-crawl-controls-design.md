# Hosted Crawl Controls And Multi-Page Design

## Goal

Allow reliable multi-page crawling from the command line, a protected Vercel
UI trigger, and a daily GitHub Actions schedule.

## Crawler

- `--sort=price-asc`, `--sort=price-desc`, and `--sort=newest` are supported.
- Joongna advances through numbered `page` query parameters.
- Mercari follows the next-page URL and its `page_token`.
- Crawling stops when the requested per-market limit is reached or a page adds
  no new products.
- Manual limits are any positive integer.

## Viewer

- Page size defaults to `20`, with `20 / 50 / 100 / 200 / All`.
- Product names remain clamped to three lines.
- The click-based `Xem thêm` popover is removed.
- Hovering or focusing a product name shows the full name tooltip.

## Hosted Crawl Form

The Retro Arcade form accepts an in-memory secret, keyword, markets, sort, and
limit. It calls a protected Vercel API route that dispatches GitHub Actions.
The UI polls a protected status route and links to the GitHub workflow run.

## Deployment

- Vercel Hobby hosts static files and lightweight API routes.
- GitHub Actions runs Puppeteer and commits updated JSON.
- A scheduled run executes daily at `23:00 UTC`, which is `06:00` Vietnam time,
  using keyword `realforce`, both markets, ascending price, and limit `100`.
