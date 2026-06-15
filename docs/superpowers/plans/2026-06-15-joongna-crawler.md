# Joongna Product Crawler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crawl configurable Joongna search results into sorted JSON and display the latest data from a local server.

**Architecture:** Keep deterministic parsing and normalization in small tested modules. Use Puppeteer only for browser interaction, a minimal Node HTTP server for static files, and a standalone responsive HTML page for rendering.

**Tech Stack:** Node.js, Puppeteer, Node test runner, HTML/CSS/JavaScript

---

### Task 1: Project Setup And Tested Data Logic

**Files:**
- Create: `package.json`
- Create: `test/options.test.js`
- Create: `test/products.test.js`
- Create: `src/options.js`
- Create: `src/products.js`

- [ ] Write failing tests for defaults, CLI overrides, price parsing, deduplication, and sorting.
- [ ] Run `npm test` and confirm failure because source modules do not exist.
- [ ] Implement the minimum source modules.
- [ ] Run `npm test` and confirm all tests pass.

### Task 2: Puppeteer Crawler

**Files:**
- Create: `crawl.js`
- Create: `data/products.json`

- [ ] Open the sorted Joongna search URL and collect product cards while scrolling.
- [ ] Normalize products with the tested data module.
- [ ] Write the requested number of products to `data/products.json`.
- [ ] Run an actual crawl and inspect the JSON output.

### Task 3: Local Viewer

**Files:**
- Create: `server.js`
- Create: `index.html`

- [ ] Serve project files with safe path resolution and JSON content types.
- [ ] Fetch and render `data/products.json` in a responsive product grid.
- [ ] Verify the server response and rendered data source.

### Task 4: Final Verification

- [ ] Run `npm test`.
- [ ] Run `npm run crawl -- --keyword=realforce --limit=5`.
- [ ] Confirm JSON fields, item count, unique URLs, and ascending prices.
- [ ] Start `npm run serve` and confirm HTTP responses for HTML and JSON.

