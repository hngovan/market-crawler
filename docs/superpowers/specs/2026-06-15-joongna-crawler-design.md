# Joongna Product Crawler Design

## Goal

Crawl Joongna search results for a configurable keyword and product limit, save
normalized products to JSON, and display the latest JSON through a local web
server.

## Behavior

- `npm run crawl -- --keyword=realforce --limit=20` crawls search results.
- The keyword defaults to `realforce`; the limit defaults to `20`.
- Products contain `name`, numeric `price`, absolute `url`, and `image`.
- Duplicate product URLs and invalid products are removed.
- Saved products are sorted from lowest to highest price.
- Results are written to `data/products.json`.
- `npm run serve` serves `index.html`, which fetches the latest JSON.

## Architecture

- `src/options.js`: parse and validate command-line options.
- `src/products.js`: normalize, deduplicate, and sort product data.
- `crawl.js`: control Puppeteer, scroll search results, and write JSON.
- `server.js`: serve static project files locally.
- `index.html`: fetch and render `data/products.json`.

## Error Handling

The crawler exits with an actionable error when the search page cannot be
loaded or no valid products are found. It logs when fewer than the requested
number of products are available. The UI shows a readable error when JSON
cannot be loaded.

## Verification

Node's built-in test runner covers option parsing and product normalization.
An actual crawl verifies current Joongna markup, JSON output, and sorting.

