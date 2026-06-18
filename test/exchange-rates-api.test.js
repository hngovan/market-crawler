import assert from "node:assert/strict";
import test from "node:test";

import { fetchVndExchangeRates } from "../src/exchange-rates-api.js";

test("fetches and normalizes open exchange-rate data", async () => {
  const rates = await fetchVndExchangeRates({
    fetchImpl: async (url) => {
      assert.equal(url, "https://open.er-api.com/v6/latest/VND");
      return {
        ok: true,
        async json() {
          return {
            result: "success",
            time_last_update_unix: 1781740800,
            rates: { VND: 1, KRW: 0.054, JPY: 0.0058 },
          };
        },
      };
    },
  });

  assert.equal(rates.updatedAt, "2026-06-18T00:00:00.000Z");
  assert.equal(Number(rates.vndPerCurrency.KRW.toFixed(4)), 18.5185);
});

test("throws a readable error when exchange-rate fetch fails", async () => {
  await assert.rejects(
    () =>
      fetchVndExchangeRates({
        fetchImpl: async () => ({
          ok: false,
          status: 503,
          async text() {
            return "temporarily unavailable";
          },
        }),
      }),
    /Exchange rate HTTP 503/,
  );
});
