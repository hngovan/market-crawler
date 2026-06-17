# Viewer Pagination Design

## Goal

Paginate each market independently and align the image-count badge with the
Retro Arcade theme.

## Page Size

A shared page-size select offers `50`, `100`, `200`, and `All`, defaulting to
`50`. The selected size applies independently to every market. Changing it
resets every market to page one.

## Pagination

Each market has independent `Trước` and `Sau` controls plus current/total page
text. Market status shows the visible range and total count. Selecting one
market preserves both markets' page state. `All` displays every product and
hides pagination controls.

## Badge

The image-count badge uses cyan background, dark-purple text and border, pink
pixel shadow, and square corners to match the Retro Arcade theme.

## Verification

Browser verification covers default page size, per-market card counts,
independent next-page behavior, page-size changes, All mode, filter
preservation, and badge computed styles.
