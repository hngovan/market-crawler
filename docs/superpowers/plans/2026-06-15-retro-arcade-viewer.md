# Retro Arcade Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Retro Arcade theme and add market filters, bottom-aligned links, and full-name popovers.

**Architecture:** Keep the viewer as a standalone HTML file. Add small DOM helpers for filters and popovers, while preserving the existing market manifest and LightGallery data flow.

**Tech Stack:** HTML, CSS, browser JavaScript, Puppeteer

---

### Task 1: Browser Behavior Test

**Files:**

- Create: `scripts/verify-retro-viewer.js`

- [ ] Test header content and Retro Arcade styles.
- [ ] Test all/single-market filter behavior.
- [ ] Test name clamp, overflow popover, Escape close, and bottom link position.
- [ ] Run the test and confirm it fails against the current viewer.

### Task 2: Retro Arcade Theme And Filters

**Files:**

- Modify: `index.html`

- [ ] Replace the visual theme and header copy.
- [ ] Add arcade filter buttons and selected-state handling.
- [ ] Make a selected single market fill the available width.

### Task 3: Product Card Behavior

**Files:**

- Modify: `index.html`

- [ ] Make cards and content flex columns with bottom-aligned links.
- [ ] Clamp names to three lines.
- [ ] Add overflow-only `Xem thêm` buttons and full-name popovers.
- [ ] Close popovers on outside click and Escape.

### Task 4: Documentation And Verification

**Files:**

- Modify: `README.md`
- Delete: `retro-demo.html`

- [ ] Document filters and product-name popovers.
- [ ] Run automated tests and browser verification.
- [ ] Remove the temporary demo file.
