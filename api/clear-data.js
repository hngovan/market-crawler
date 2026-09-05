import { randomUUID } from "node:crypto";

import { authorize, getGitHubConfig, githubError, githubRequest, sendError } from "./_shared.js";

export default async function handler(request, response) {
  try {
    if (request.method !== "POST")
      return response.status(405).json({ error: "Method not allowed" });
    authorize(request);
    const runsResponse = await githubRequest(
      "/actions/workflows/crawl.yml/runs?event=workflow_dispatch&per_page=20",
    );
    if (!runsResponse.ok) throw await githubError(runsResponse, "Không thể đọc GitHub Actions");
    const runs = await runsResponse.json();
    const activeRun = runs.workflow_runs?.find((run) =>
      ["queued", "in_progress"].includes(run.status),
    );
    if (activeRun) {
      return response.status(409).json({
        error: "Không thể xoá dữ liệu khi một tác vụ khác đang chạy",
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
        inputs: { request_id: requestId, operation: "clear" },
      }),
    });
    if (!githubResponse.ok)
      throw await githubError(githubResponse, "Không thể chạy tác vụ xoá dữ liệu");
    response.status(202).json({ requestId, status: "queued" });
  } catch (error) {
    sendError(response, error);
  }
}
