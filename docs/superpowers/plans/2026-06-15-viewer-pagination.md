# Viewer Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared page-size selection, independent market pagination, and a Retro Arcade image badge.

**Architecture:** Keep fetched product arrays in browser state keyed by market ID. Render only each market's current slice and rerender affected market controls when page or page size changes.

**Tech Stack:** HTML, CSS, browser JavaScript, Puppeteer

---

### Task 1: Browser Test

**Files:**

- Modify: `scripts/verify-retro-viewer.js`

- [ ] Verify the default page-size select is 50.
- [ ] Verify each market independently paginates and reports its range.
- [ ] Verify changing page size resets all pages and All hides pagination.
- [ ] Verify the image badge matches Retro Arcade computed styles.
- [ ] Run the test and confirm failure before implementation.

### Task 2: Pagination UI And State

**Files:**

- Modify: `index.html`

- [ ] Add shared page-size controls.
- [ ] Store products and page state by market.
- [ ] Render independent market slices and pagination controls.
- [ ] Preserve page state when market filters change.

### Task 3: Badge And Documentation

**Files:**

- Modify: `index.html`
- Modify: `README.md`

- [ ] Restyle image badges to match Retro Arcade.
- [ ] Document page sizes, independent pagination, and All mode.
- [ ] Run automated and browser verification.
