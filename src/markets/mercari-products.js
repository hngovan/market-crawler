export function extractMercariCard({ ariaLabel, imageAlt, url, image }) {
  const priceMatch = String(ariaLabel ?? "").match(/([\d,]+)円/);
  const name = String(imageAlt ?? "")
    .replace(/のサムネイル$/, "")
    .trim();

  return {
    name,
    price: priceMatch ? Number(priceMatch[1].replaceAll(",", "")) : null,
    url,
    image,
  };
}

export function isMercariSoldCard({ stickerLabel, stickerTestId, isSold } = {}) {
  return Boolean(isSold || (stickerTestId === "thumbnail-sticker" && stickerLabel === "売り切れ"));
}

export function normalizeMercariImages(images) {
  return [
    ...new Set(
      images
        .filter((image) =>
          /^https:\/\/static\.mercdn\.net\/item\/detail\/orig\/photos\//.test(image),
        )
        .map((image) => image.split("?")[0]),
    ),
  ];
}
