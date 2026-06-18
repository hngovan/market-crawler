import assert from "node:assert/strict";
import test from "node:test";

import {
  convertProductPriceToVnd,
  formatExchangeRateNote,
  formatOriginalToVndRate,
  formatVndPrice,
  normalizeVndExchangePayload,
} from "../src/exchange-rates.js";

test("normalizes VND base exchange rates into VND per source currency", () => {
  const rates = normalizeVndExchangePayload({
    result: "success",
    time_last_update_unix: 1781740800,
    rates: {
      VND: 1,
      KRW: 0.054,
      JPY: 0.0058,
    },
  });

  assert.equal(rates.base, "VND");
  assert.equal(rates.updatedAt, "2026-06-18T00:00:00.000Z");
  assert.equal(Number(rates.vndPerCurrency.KRW.toFixed(4)), 18.5185);
  assert.equal(Number(rates.vndPerCurrency.JPY.toFixed(4)), 172.4138);
});

test("formats converted VND prices and per-currency rate notes", () => {
  const rates = {
    updatedAt: "2026-06-18T00:00:00.000Z",
    vndPerCurrency: {
      KRW: 18.5,
      JPY: 172.25,
    },
  };

  assert.equal(convertProductPriceToVnd({ price: 80000, currency: "KRW" }, rates), 1480000);
  assert.equal(formatVndPrice(1480000), "~1.480.000đ");
  assert.equal(formatOriginalToVndRate("KRW", rates), "1 KRW = 18,50đ");
  assert.match(formatExchangeRateNote(rates, { cached: false }), /Cập nhật lúc:/);
});

test("marks exchange rate notes as cached fallback", () => {
  const note = formatExchangeRateNote(
    {
      updatedAt: "2026-06-18T00:00:00.000Z",
      vndPerCurrency: { KRW: 18.5 },
    },
    { cached: true },
  );

  assert.match(note, /Đang dùng tỉ giá cache/);
});
