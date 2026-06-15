import { authorize, githubRequest, sendError } from "./_shared.js";

export default async function handler(request, response) {
  try {
    if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed" });
    authorize(request);
    const requestId = String(request.query.request_id || "");
    if (!requestId) throw new Error("request_id is required");

    const githubResponse = await githubRequest("/actions/workflows/crawl.yml/runs?event=workflow_dispatch&per_page=30");
    if (!githubResponse.ok) throw new Error(`GitHub status request failed: ${githubResponse.status}`);
    const payload = await githubResponse.json();
    const run = payload.workflow_runs?.find((item) => item.display_title?.includes(requestId));
    if (!run) return response.status(200).json({ status: "pending", log: "Đang chờ GitHub Actions tạo job..." });

    const status = run.status === "completed" ? (run.conclusion || "completed") : run.status;
    response.status(200).json({
      status,
      url: run.html_url,
      log: run.status === "completed"
        ? `Crawl đã hoàn tất: ${run.conclusion}`
        : `GitHub Actions: ${run.status}`,
    });
  } catch (error) {
    sendError(response, error);
  }
}
