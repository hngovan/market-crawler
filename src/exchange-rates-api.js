import { normalizeVndExchangePayload } from "./exchange-rates.js";

const EXCHANGE_RATE_URL = "https://open.er-api.com/v6/latest/VND";

export async function fetchVndExchangeRates({ fetchImpl = fetch } = {}) {
  const response = await fetchImpl(EXCHANGE_RATE_URL, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      detail = "";
    }
    throw new Error(
      `Exchange rate HTTP ${response.status}${detail ? ` - ${detail.slice(0, 160)}` : ""}`,
    );
  }

  return normalizeVndExchangePayload(await response.json());
}
