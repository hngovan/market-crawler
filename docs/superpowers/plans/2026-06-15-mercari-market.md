# Mercari Market Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Goofish with a working Mercari Japan adapter using native JPY prices.

**Architecture:** Add Mercari-specific deterministic parsing helpers and a Puppeteer adapter behind the existing orchestrator. Preserve separate market files, manifest status, two-column UI, and LightGallery behavior.

**Tech Stack:** Node.js, Puppeteer, LightGallery, HTML/CSS/JavaScript

---

### Task 1: Mercari Parsing Contracts

**Files:**
- Create: `src/markets/mercari-products.js`
- Create: `test/mercari-products.test.js`
- Modify: `src/products.js`
- Modify: `test/products.test.js`

- [ ] Add failing tests for card name, JPY price, item URL, thumbnail, original images, and JPY logs.
- [ ] Implement deterministic Mercari parsing helpers.
- [ ] Run tests and confirm all pass.

### Task 2: Mercari Adapter

**Files:**
- Create: `src/markets/mercari.js`
- Delete: `src/markets/goofish.js`
- Modify: `crawl.js`
- Modify: `package.json`

- [ ] Crawl the sorted Mercari search page.
- [ ] Scroll until the limit or no more products.
- [ ] Enrich products from up to four concurrent detail pages.
- [ ] Replace Goofish registrations and scripts with Mercari.

### Task 3: Viewer And Documentation

**Files:**
- Modify: `index.html`
- Modify: `README.md`
- Delete: `data/goofish.json`

- [ ] Add JPY formatting to the viewer.
- [ ] Replace all Goofish documentation and data references with Mercari.
- [ ] Keep the two-column layout, gallery, and badges unchanged.

### Task 4: Final Verification

- [ ] Run automated tests.
- [ ] Run Mercari-only crawl and verify sorted JPY results.
- [ ] Run all-market crawl and verify Joongna plus Mercari.
- [ ] Verify both columns and LightGallery in the browser.

