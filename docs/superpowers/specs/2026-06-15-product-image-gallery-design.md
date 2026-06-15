# Product Image Gallery Design

## Goal

Crawl every product image from Joongna detail pages and preview those images
with LightGallery while keeping one thumbnail on each product card.

## Data

Each product keeps `image` as its list-page thumbnail and adds `images`, an
array of unique original-quality product image URLs. When detail extraction
fails, `images` falls back to the thumbnail.

## Crawler

After collecting and sorting search results, the crawler opens product detail
pages with at most four concurrent Puppeteer pages. It extracts product gallery
images, removes duplicates and non-product assets, then writes enriched
products to `data/products.json`.

## Viewer

Clicking the card thumbnail opens LightGallery for that product. A badge such
as `5 ảnh` appears only when the product has more than one image. Products with
one image still open a preview but do not display a badge.

## Verification

Automated tests cover image normalization and fallback behavior. An actual
crawl verifies that multiple detail images are saved, and a browser check
verifies LightGallery initialization and badge behavior.

