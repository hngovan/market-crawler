# Product Image Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich crawled products with all original detail images and preview them using LightGallery.

**Architecture:** Keep image URL normalization in the tested product module. Enrich products after list crawling through a four-worker Puppeteer pool, then use LightGallery dynamic mode to open each product's image array.

**Tech Stack:** Node.js, Puppeteer, LightGallery, HTML/CSS/JavaScript

---

### Task 1: Image Data Logic

**Files:**

- Modify: `test/products.test.js`
- Modify: `src/products.js`

- [ ] Add failing tests for unique original images and thumbnail fallback.
- [ ] Run `npm test` and confirm the new tests fail.
- [ ] Implement image normalization and product enrichment helpers.
- [ ] Run `npm test` and confirm all tests pass.

### Task 2: Detail Page Crawling

**Files:**

- Modify: `crawl.js`

- [ ] Inspect one current Joongna detail page to identify product gallery images.
- [ ] Add a four-worker Puppeteer page pool.
- [ ] Extract and attach detail images with thumbnail fallback.
- [ ] Run a real crawl and verify products contain non-empty `images`.

### Task 3: LightGallery Viewer

**Files:**

- Modify: `package.json`
- Modify: `index.html`
- Modify: `README.md`

- [ ] Install LightGallery.
- [ ] Serve LightGallery assets through the existing local server.
- [ ] Open dynamic galleries when card thumbnails are clicked.
- [ ] Display an image-count badge only when `images.length > 1`.
- [ ] Document the new JSON field and gallery behavior.

### Task 4: Final Verification

- [ ] Run `npm test`.
- [ ] Crawl current Joongna products and verify unique image arrays.
- [ ] Verify HTML and LightGallery assets return HTTP 200.
- [ ] Verify a multi-image product has a badge and a single-image product does not.
