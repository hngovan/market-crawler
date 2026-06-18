import assert from "node:assert/strict";
import test from "node:test";

import {
  extractJoongnaPostedAt,
  extractKoreanRelativePostedAt,
  extractMercariPostedAt,
} from "../src/markets/product-date.js";

test("extracts Joongna sort date as an ISO timestamp", () => {
  assert.equal(
    extractJoongnaPostedAt(['{\\"sortDate\\":\\"2026-06-15 17:23:17\\"}']),
    "2026-06-15T08:23:17.000Z",
  );
});

test("converts Mercari relative posted time to an approximate ISO timestamp", () => {
  assert.deepEqual(
    extractMercariPostedAt("商品の情報\n11時間前", new Date("2026-06-15T12:00:00Z")),
    { postedAt: "2026-06-15T01:00:00.000Z", postedAtText: "11時間前" },
  );
});

test("converts Korean relative posted time to an approximate ISO timestamp", () => {
  const now = new Date("2026-06-16T03:00:00.000Z");
  assert.deepEqual(extractKoreanRelativePostedAt("2시간 전", now), {
    postedAt: "2026-06-16T01:00:00.000Z",
    postedAtText: "2시간 전",
  });
});

test("converts Korean worded relative posted time", () => {
  const now = new Date("2026-06-16T03:00:00.000Z");
  assert.deepEqual(extractKoreanRelativePostedAt("하루 전", now), {
    postedAt: "2026-06-15T03:00:00.000Z",
    postedAtText: "하루 전",
  });
  assert.deepEqual(extractKoreanRelativePostedAt("한 달 전", now), {
    postedAt: "2026-05-16T03:00:00.000Z",
    postedAtText: "한 달 전",
  });
});
