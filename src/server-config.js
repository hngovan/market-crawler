export function resolveServerHost({ crawlSecret, configuredHost } = {}) {
  if (crawlSecret === "local") return "127.0.0.1";
  return configuredHost || "127.0.0.1";
}
