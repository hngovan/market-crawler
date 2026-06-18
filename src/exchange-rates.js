export const EXCHANGE_RATE_CACHE_KEY = "market-crawler:vnd-exchange-rates";
export const EXCHANGE_RATE_TTL_MS = 30 * 60 * 1000;
export const SUPPORTED_CONVERSION_CURRENCIES = ["KRW", "JPY"];

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("vi-VN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function normalizeVndExchangePayload(payload) {
  if (payload?.result !== "success" || !payload.rates) {
    throw new Error("Exchange rate response is not successful");
  }

  const vndPerCurrency = {};
  for (const currency of SUPPORTED_CONVERSION_CURRENCIES) {
    const rate = Number(payload.rates[currency]);
    if (Number.isFinite(rate) && rate > 0) vndPerCurrency[currency] = 1 / rate;
  }

  if (Object.keys(vndPerCurrency).length === 0) {
    throw new Error("Exchange rate response does not include KRW or JPY");
  }

  const updatedAt = payload.time_last_update_unix
    ? new Date(Number(payload.time_last_update_unix) * 1000).toISOString()
    : new Date().toISOString();

  return {
    base: "VND",
    updatedAt,
    fetchedAt: new Date().toISOString(),
    vndPerCurrency,
  };
}

export function convertProductPriceToVnd(product, rates) {
  const rate = rates?.vndPerCurrency?.[product.currency];
  if (!Number.isFinite(rate)) return null;
  return Math.round(Number(product.price) * rate);
}

export function formatVndPrice(value) {
  if (!Number.isFinite(value)) return "";
  return `~${vndFormatter.format(value)}đ`;
}

export function formatOriginalToVndRate(currency, rates) {
  const rate = rates?.vndPerCurrency?.[currency];
  if (!Number.isFinite(rate)) return "";
  return `1 ${currency} = ${decimalFormatter.format(rate)}đ`;
}

export function formatExchangeRateNote(rates, { cached = false } = {}) {
  const updatedAt = formatDateTime(rates?.updatedAt);
  if (!updatedAt) return "";
  return `${cached ? "Đang dùng tỉ giá cache" : "Cập nhật lúc"}: ${updatedAt}`;
}
