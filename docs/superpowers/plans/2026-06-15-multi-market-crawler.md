# Multi-Market Crawler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crawl Joongna and best-effort Goofish through separate commands and render each market in its own column.

**Architecture:** Extract market-specific behavior into adapters behind one orchestrator. Persist separate product files plus a markets manifest so one failed market does not invalidate successful markets.

**Tech Stack:** Node.js, Puppeteer, LightGallery, HTML/CSS/JavaScript

---

### Task 1: Shared Market Contracts

**Files:**
- Modify: `src/options.js`
- Create: `src/market-output.js`
- Modify: `test/options.test.js`
- Create: `test/market-output.test.js`

- [ ] Test script market selection and existing keyword/limit options.
- [ ] Test market product metadata and manifest status generation.
- [ ] Implement shared contracts and make tests pass.

### Task 2: Joongna Adapter And Orchestrator

**Files:**
- Create: `src/markets/joongna.js`
- Modify: `crawl.js`
- Modify: `package.json`

- [ ] Move current Joongna behavior into an adapter.
- [ ] Add orchestrator market selection and separate output files.
- [ ] Add `crawl:joongna`, `crawl:mercari`, and `crawl:all` scripts.
- [ ] Verify Joongna output and manifest.

### Task 3: Mercari Adapter

**Files:**
- Create: `src/markets/mercari.js`

- [ ] Crawl Mercari without login and identify product data.
- [ ] Parse and sort products by native JPY price.
- [ ] Collect original product images from detail pages.
- [ ] Verify Mercari never causes `crawl:all` to lose Joongna output.

### Task 4: Multi-Market Viewer

**Files:**
- Modify: `index.html`
- Modify: `README.md`

- [ ] Load the markets manifest and market product files.
- [ ] Render one responsive column per market.
- [ ] Keep LightGallery and conditional image badges.
- [ ] Document all commands, files, and Goofish best-effort behavior.

### Task 5: Final Verification

- [ ] Run all automated tests.
- [ ] Run all three crawl commands.
- [ ] Confirm Joongna succeeds and Goofish succeeds or skips cleanly.
- [ ] Confirm market columns and gallery behavior in a browser.
