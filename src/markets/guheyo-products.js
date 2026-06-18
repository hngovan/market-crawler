import { parsePrice } from "../products.js";
import { extractKoreanRelativePostedAt } from "./product-date.js";

const GUHEYO_ORIGIN = "https://guheyo.com";

export function absoluteGuheyoUrl(value) {
  if (!value) return "";
  if (value.startsWith("//")) return `https:${value}`;
  try {
    return new URL(value, GUHEYO_ORIGIN).href;
  } catch {
    return "";
  }
}

export function normalizeGuheyoDetailImages(imageUrls) {
  return [
    ...new Set(
      imageUrls.map((image) => absoluteGuheyoUrl(String(image ?? "").trim())).filter(Boolean),
    ),
  ];
}

export function extractGuheyoCard(card) {
  const lines = String(card.text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const priceLine = lines.find((line) => /원/.test(line) && parsePrice(line) !== null) ?? "";
  const price = parsePrice(priceLine);
  const url = absoluteGuheyoUrl(card.url).split("#")[0];
  const image = absoluteGuheyoUrl(card.image);
  const name = String(
    card.imageAlt || lines[lines.findIndex((line) => line === priceLine) - 2] || lines[0] || "",
  ).trim();

  let isOfferUrl = false;
  try {
    isOfferUrl = new URL(url).pathname.startsWith("/offer/");
  } catch {
    isOfferUrl = false;
  }

  if (!name || price === null || !isOfferUrl) return null;
  return {
    name,
    price,
    url,
    image,
    ...extractKoreanRelativePostedAt(card.text),
  };
}
