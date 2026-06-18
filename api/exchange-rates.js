import { fetchVndExchangeRates } from "../src/exchange-rates-api.js";
import { sendError } from "./_shared.js";

export default async function handler(request, response) {
  try {
    if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed" });
    response.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    response.status(200).json(await fetchVndExchangeRates());
  } catch (error) {
    sendError(response, error);
  }
}
