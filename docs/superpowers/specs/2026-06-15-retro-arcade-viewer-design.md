# Retro Arcade Viewer Design

## Goal

Restyle the multi-market viewer as a Retro Arcade interface and improve market
filtering and product-card behavior.

## Header And Theme

The interface uses a pink pastel background, cyan panels, dark purple borders,
pixel-like shadows, and monospace typography. The header displays:

- `Multi-Market Crawling`
- `Từ khóa: realforce`
- `Tìm kiếm theo giá: từ thấp đến cao`

## Market Filter

Arcade-style buttons allow `Tất cả`, `Joongna`, or `Mercari`. `Tất cả` is
selected by default. Selecting one market hides the other and lets the visible
market use the full page width.

## Product Cards

Cards are equal-height flex columns. The external product link stays at the
bottom using `margin-top: auto`. Product names are clamped to three lines.
Names that overflow show a `Xem thêm` button that opens a popover with the full
name. Clicking outside or pressing Escape closes the popover.

## Existing Behavior

Price formatting, LightGallery image previews, and conditional image-count
badges remain unchanged.

## Verification

A Puppeteer browser test verifies header copy, Retro Arcade styles, filters,
three-line clamping, popover behavior, and bottom-aligned external links.

