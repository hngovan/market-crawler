import { randomUUID } from "node:crypto";

import {
  authorize,
  getGitHubConfig,
  githubError,
  githubRequest,
  sendError,
  validateCrawlRequest,
} from "./_shared.js";

export default async function handler(request, response) {
  try {
    if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
    authorize(request);
    const options = validateCrawlRequest(request.body);
    const runsResponse = await githubRequest("/actions/workflows/crawl.yml/runs?event=workflow_dispatch&per_page=20");
    if (!runsResponse.ok) throw await githubError(runsResponse, "Không thể đọc GitHub Actions");
    const runs = await runsResponse.json();
    const activeRun = runs.workflow_runs?.find((run) => ["queued", "in_progress"].includes(run.status));
    if (activeRun) {
      const existingRequestId = activeRun.display_title?.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
      )?.[0];
      return response.status(409).json({
        error: "Một crawler khác đang chạy",
        requestId: existingRequestId,
        status: activeRun.status,
        url: activeRun.html_url,
      });
    }
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
    if (!githubResponse.ok) throw await githubError(githubResponse, "Không thể chạy GitHub Actions");
    response.status(202).json({ requestId, status: "queued" });
  } catch (error) {
    sendError(response, error);
  }
}
