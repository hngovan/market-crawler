# Multi-Market Crawler Design

## Goal

Support Joongna and Mercari through separate crawl commands and display each
market in its own UI column.

## Commands

- `npm run crawl:joongna -- --keyword=realforce --limit=20`
- `npm run crawl:mercari -- --keyword=realforce --limit=20`
- `npm run crawl:all -- --keyword=realforce --limit=20`

The limit applies independently to each market.

## Architecture

Each market adapter owns browser configuration, search interaction, parsing,
detail images, currency, and links. The orchestrator runs selected adapters,
writes `data/<market>.json`, and writes `data/markets.json` with status,
product count, and any error message.

Joongna and Mercari use headless Puppeteer without login. A market failure must
not fail `crawl:all`.

## Product Data

Every product contains:

- `market`
- `marketName`
- `currency`
- `name`
- `price`
- `url`
- `image`
- `images`

Products remain sorted from lowest to highest price within each market.

## Viewer

The viewer loads `data/markets.json`, then renders one column per market.
Columns show crawl status, product count, native currency, product cards,
LightGallery previews, and image-count badges.

## Verification

Tests cover CLI options, market metadata, output status, and market product
normalization. Real runs verify Joongna success and Goofish success or clean
skip behavior.
