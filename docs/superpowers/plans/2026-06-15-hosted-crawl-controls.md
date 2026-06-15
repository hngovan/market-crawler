# Hosted Crawl Controls And Multi-Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-page crawling, protected Vercel crawl controls, and a daily GitHub Actions schedule.

**Architecture:** Market adapters own page navigation and sort mapping. Vercel API routes only authenticate and dispatch or inspect GitHub Actions; GitHub Actions runs Puppeteer and commits generated JSON.

**Tech Stack:** Node.js, Puppeteer, Vercel Functions, GitHub Actions, HTML/CSS/JavaScript

---

### Task 1: Options And Page Navigation

**Files:**
- Modify: `src/options.js`
- Modify: `test/options.test.js`
- Create: `src/markets/page-navigation.js`
- Create: `test/page-navigation.test.js`
- Modify: `src/markets/joongna.js`
- Modify: `src/markets/mercari.js`

- [ ] Test sort parsing and market-specific sorted URLs.
- [ ] Test Joongna numbered-page URLs and Mercari next-page selection.
- [ ] Implement helpers and multi-page loops.
- [ ] Verify limits above one search page.

### Task 2: Viewer Controls

**Files:**
- Modify: `index.html`
- Modify: `scripts/verify-retro-viewer.js`

- [ ] Change page-size default/options to `20 / 50 / 100 / 200 / All`.
- [ ] Replace click popovers with hover/focus full-name tooltips.
- [ ] Add protected crawl form and status polling.
- [ ] Verify browser behavior.

### Task 3: Vercel And GitHub Actions

**Files:**
- Create: `api/crawl.js`
- Create: `api/crawl-status.js`
- Create: `.github/workflows/crawl.yml`
- Create: `vercel.json`
- Modify: `.gitignore`

- [ ] Authenticate API requests with `CRAWL_TRIGGER_SECRET`.
- [ ] Dispatch the crawl workflow with validated inputs.
- [ ] Return the latest matching workflow status.
- [ ] Add manual and daily 06:00 Vietnam schedules.

### Task 4: Documentation And Verification

**Files:**
- Modify: `README.md`

- [ ] Document local commands, Vercel variables, GitHub token permissions, and cron defaults.
- [ ] Run unit tests, browser verification, API checks, and multi-page crawl samples.

