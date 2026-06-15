export function buildJoongnaSearchUrl(keyword, sort, page = 1) {
  const url = new URL(`/search/${encodeURIComponent(keyword)}`, "https://web.joongna.com");
  const sortValue = {
    "price-asc": "PRICE_ASC_SORT",
    "price-desc": "PRICE_DESC_SORT",
    newest: "RECENT_SORT",
  }[sort];
  url.searchParams.set("sort", sortValue);
  if (page > 1) url.searchParams.set("page", String(page));
  return url.href;
}

export function buildMercariSearchUrl(keyword, sort) {
  const url = new URL("/search", "https://jp.mercari.com");
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("sort", sort === "newest" ? "created_time" : "price");
  url.searchParams.set("order", sort === "price-desc" || sort === "newest" ? "desc" : "asc");
  return url.href;
}

export function findMercariNextUrl(urls) {
  return urls.find((url) => {
    try {
      return new URL(url).searchParams.has("page_token");
    } catch {
      return false;
    }
  }) ?? "";
}
