import { validateCrawlRequest } from "../src/crawl-request.js";

export function authorize(request) {
  const expected = process.env.CRAWL_TRIGGER_SECRET;
  const received = request.headers["x-crawl-secret"];
  if (!expected || received !== expected) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }
}

export function getGitHubConfig() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!owner || !repo || !token) throw new Error("GitHub integration is not configured");
  return { owner, repo, token, branch };
}

export async function githubRequest(pathname, options = {}) {
  const { owner, repo, token } = getGitHubConfig();
  return fetch(`https://api.github.com/repos/${owner}/${repo}${pathname}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  });
}

export function sendError(response, error) {
  response.status(error.statusCode || 400).json({ error: error.message });
}

export { validateCrawlRequest };
