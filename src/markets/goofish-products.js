const GOOFISH_ORIGIN = "https://www.goofish.com";

function firstValue(object, keys) {
  for (const key of keys) {
    const value = object?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function textValue(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") {
    return String(firstValue(value, ["text", "value", "content", "name", "url"]) ?? "");
  }
  return String(value);
}

function parsePrice(value) {
  const text = textValue(value).replace(/,/g, "");
  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const price = Number(match[0]);
  return Number.isFinite(price) ? Math.round(price) : null;
}

function absoluteImage(value) {
  const image = textValue(value)
    .trim()
    .replace(/^http:\/\//i, "https://");
  if (!image) return "";
  try {
    return new URL(image, GOOFISH_ORIGIN).href;
  } catch {
    return "";
  }
}

function itemId(object) {
  return firstValue(object, ["itemId", "item_id", "itemIdStr", "id"]);
}

function toProduct(object) {
  const id = itemId(object);
  const name = textValue(firstValue(object, ["title", "itemTitle", "name", "rawTitle"])).trim();
  const price = parsePrice(
    firstValue(object, ["price", "soldPrice", "currentPrice", "priceInfo", "priceInfoVO"]),
  );
  const image = absoluteImage(
    firstValue(object, [
      "pictureUrl",
      "picUrl",
      "imageUrl",
      "mainPic",
      "pic",
      "image",
      "mainImage",
    ]),
  );

  if (id === undefined || id === null || !name || price === null) return null;
  return {
    name,
    price,
    url: `${GOOFISH_ORIGIN}/item?id=${encodeURIComponent(String(id))}`,
    image,
  };
}

export function extractGoofishProducts(payload) {
  const products = new Map();

  function visit(value) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const product = toProduct(value);
    if (product && !products.has(product.url)) products.set(product.url, product);
    Object.values(value).forEach(visit);
  }

  visit(payload);
  return [...products.values()];
}

export function extractGoofishDomProduct({ text, imageAlt, url, image }) {
  const name = String(imageAlt || text || "")
    .replace(/\s*(?:的)?(?:图片|缩略图|主图)\s*$/u, "")
    .trim();
  const price = parsePrice(text);
  if (!name || price === null || !url) return null;
  return { name, price, url, image: absoluteImage(image) };
}
