# Mercari Market Design

## Goal

Replace the inaccessible Goofish adapter with a Mercari Japan adapter while
preserving the multi-market architecture and two-column viewer.

## Behavior

- Mercari crawls without login in headless Puppeteer.
- Search uses `sort=price&order=asc`.
- The per-market `--limit` behavior remains unchanged.
- Mercari stores and sorts by original JPY prices only.
- Up to four detail pages are opened concurrently to collect original images.
- A Mercari failure does not remove Joongna results.

## Commands And Data

- `npm run crawl:mercari -- --keyword=realforce --limit=20`
- `npm run crawl:all -- --keyword=realforce --limit=20`
- Results are written to `data/mercari.json`.
- Mercari metadata uses `market: "mercari"` and `currency: "JPY"`.

## Viewer

The existing two-column viewer renders Joongna and Mercari. JPY prices use the
`¥` prefix. LightGallery and conditional image badges remain unchanged.

## Verification

Tests cover Mercari card parsing, original image normalization, and JPY log
formatting. Real crawls verify sorted Mercari results and multi-image galleries.
