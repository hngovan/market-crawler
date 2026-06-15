import { randomUUID } from "node:crypto";

import { authorize, getGitHubConfig, githubRequest, sendError, validateCrawlRequest } from "./_shared.js";

export default async function handler(request, response) {
  try {
    if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
    authorize(request);
    const options = validateCrawlRequest(request.body);
    const requestId = randomUUID();
    const { branch } = getGitHubConfig();
    const githubResponse = await githubRequest("/actions/workflows/crawl.yml/dispatches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref: branch,
        inputs: {
          request_id: requestId,
          keyword: options.keyword,
          limit: String(options.limit),
          markets: options.markets.join(","),
          sort: options.sort,
        },
      }),
    });
    if (!githubResponse.ok) throw new Error(`GitHub dispatch failed: ${githubResponse.status}`);
    response.status(202).json({ requestId, status: "queued" });
  } catch (error) {
    sendError(response, error);
  }
}
