export const regions = {
  korea: { id: "korea", name: "Hàn Quốc", flag: "🇰🇷" },
  japan: { id: "japan", name: "Nhật Bản", flag: "🇯🇵" },
  usa: { id: "usa", name: "Mỹ", flag: "🇺🇸" },
};

export const marketDefinitions = {
  joongna: {
    id: "joongna",
    name: "Joongna",
    region: regions.korea.id,
    regionName: regions.korea.name,
    regionFlag: regions.korea.flag,
    currency: "KRW",
  },
  bunjang: {
    id: "bunjang",
    name: "Bunjang",
    region: regions.korea.id,
    regionName: regions.korea.name,
    regionFlag: regions.korea.flag,
    currency: "KRW",
  },
  mercari: {
    id: "mercari",
    name: "Mercari",
    region: regions.japan.id,
    regionName: regions.japan.name,
    regionFlag: regions.japan.flag,
    currency: "JPY",
  },
};

export const defaultMarkets = ["joongna", "bunjang", "mercari"];
export const supportedMarkets = Object.keys(marketDefinitions);
export const supportedSorts = ["price-asc", "price-desc", "newest"];

export function normalizeKeywords(value) {
  const rawKeywords = Array.isArray(value) ? value : String(value ?? "").split(",");
  return [...new Set(rawKeywords.map((keyword) => String(keyword).trim()).filter(Boolean))];
}
