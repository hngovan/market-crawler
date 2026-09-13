function parseNumber(value) {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  if (!digits) return null;
  const number = Number(digits);
  return Number.isFinite(number) ? number : null;
}

function normalizeImage(value) {
  const image = String(value ?? "")
    .trim()
    .replace(/^http:\/\//i, "https://");
  if (!image) return "";
  try {
    return new URL(image).href;
  } catch {
    return "";
  }
}

export function extractYahooAuctionProduct(card, now = new Date()) {
  const name = String(card?.name ?? "").trim();
  const price = parseNumber(card?.currentPrice);
  const startPrice = parseNumber(card?.startPrice);
  const buyNowPrice = parseNumber(card?.buyNowPrice) ?? 0;
  const bidCount = parseNumber(card?.bidCount) ?? 0;
  const startTime = Number(card?.startTime);
  const endTime = Number(card?.endTime);
  const url = String(card?.url ?? "").trim();

  if (!name || price === null || !/^https:\/\/auctions\.yahoo\.co\.jp\/jp\/auction\//.test(url)) {
    return null;
  }

  const endsAt = Number.isFinite(endTime) && endTime > 0 ? new Date(endTime * 1000) : null;
  const postedAt = Number.isFinite(startTime) && startTime > 0 ? new Date(startTime * 1000) : null;
  if (endsAt && endsAt <= now) return null;

  const saleType = buyNowPrice > 0 && startPrice === buyNowPrice ? "fixed-price" : "auction";
  return {
    name,
    price,
    ...(buyNowPrice > 0 ? { buyNowPrice } : {}),
    bidCount,
    ...(postedAt ? { postedAt: postedAt.toISOString() } : {}),
    ...(endsAt ? { endsAt: endsAt.toISOString() } : {}),
    saleType,
    url,
    image: normalizeImage(card?.image),
  };
}
