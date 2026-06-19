import test from "node:test";
import assert from "node:assert/strict";

import { pruneProductsByCrawledAt } from "../src/data-cleanup.js";

test("prunes products crawled more than retention days ago", () => {
  const now = new Date("2026-06-22T00:00:00.000Z");

  assert.deepEqual(
    pruneProductsByCrawledAt(
      [
        { name: "expired", url: "https://example.com/1", crawledAt: "2026-06-07T23:59:59.999Z" },
        { name: "cutoff", url: "https://example.com/2", crawledAt: "2026-06-08T00:00:00.000Z" },
        { name: "fresh", url: "https://example.com/3", crawledAt: "2026-06-18T00:00:00.000Z" },
        { name: "legacy", url: "https://example.com/4" },
        { name: "invalid", url: "https://example.com/5", crawledAt: "not-a-date" },
      ],
      { now, retentionDays: 14 },
    ),
    {
      products: [
        { name: "cutoff", url: "https://example.com/2", crawledAt: "2026-06-08T00:00:00.000Z" },
        { name: "fresh", url: "https://example.com/3", crawledAt: "2026-06-18T00:00:00.000Z" },
        { name: "legacy", url: "https://example.com/4" },
        { name: "invalid", url: "https://example.com/5", crawledAt: "not-a-date" },
      ],
      removed: 1,
      cutoff: "2026-06-08T00:00:00.000Z",
    },
  );
});
