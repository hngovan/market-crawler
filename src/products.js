const JOONGNA_ORIGIN = "https://web.joongna.com";

export function parsePrice(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

export function extractCardProduct({ text, imageAlt, url, image }) {
  const lines = String(text ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
  const wonIndex = lines.findIndex((line) => line === "원");
  const price = wonIndex > 0 ? lines[wonIndex - 1] : "";

  return {
    name: String(imageAlt ?? lines[0] ?? "").replace(/\s*이미지$/, "").trim(),
    price,
    url,
    image,
  };
}

export function formatProductLog(product, index) {
  const formattedPrice = product.currency === "JPY" || product.currency === "CNY"
    ? `¥${product.price.toLocaleString("en-US")}`
    : `${product.price.toLocaleString("en-US")}원`;
  return `[${index + 1}] ${product.name} | ${formattedPrice} | ${product.url}`;
}

function absoluteUrl(value, origin = JOONGNA_ORIGIN) {
  if (!value) return "";
  if (value.startsWith("//")) return `https:${value}`;

  try {
    return new URL(value, origin).href;
  } catch {
    return "";
  }
}

export function enrichProductImages(product, detailImages) {
  const images = [...new Set(detailImages.map((image) => {
    const url = absoluteUrl(image);
    if (!/^https:\/\/img\d*\.joongna\.com\/.+/i.test(url)) return "";
    return url.split("?")[0];
  }).filter(Boolean))];

  return {
    ...product,
    images: images.length > 0 ? images : [product.image].filter(Boolean),
  };
}

export function normalizeProducts(products, { sortByPrice = true } = {}) {
  const uniqueProducts = new Map();

  for (const product of products) {
    const name = String(product.name ?? "").trim();
    const price = parsePrice(product.price);
    const url = absoluteUrl(product.url);

    if (!name || price === null || !url.includes("/product/") || uniqueProducts.has(url)) {
      continue;
    }

    uniqueProducts.set(url, {
      name,
      price,
      url,
      image: absoluteUrl(product.image, JOONGNA_ORIGIN),
    });
  }

  const normalized = [...uniqueProducts.values()];
  return sortByPrice ? normalized.sort((a, b) => a.price - b.price) : normalized;
}
