import assert from "node:assert/strict";
import test from "node:test";

import crawlHandler from "../api/crawl.js";

test("Vercel crawl API dispatches the entered keyword without a separate China keyword list", async (t) => {
  const originalFetch = global.fetch;
  const originalEnv = {
    CRAWL_TRIGGER_SECRET: process.env.CRAWL_TRIGGER_SECRET,
    GITHUB_OWNER: process.env.GITHUB_OWNER,
    GITHUB_REPO: process.env.GITHUB_REPO,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_BRANCH: process.env.GITHUB_BRANCH,
  };
  t.after(() => {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  Object.assign(process.env, {
    CRAWL_TRIGGER_SECRET: "test-secret",
    GITHUB_OWNER: "owner",
    GITHUB_REPO: "repo",
    GITHUB_TOKEN: "token",
    GITHUB_BRANCH: "main",
  });
  const requests = [];
  global.fetch = async (url, options = {}) => {
    requests.push({ url, options });
    if (String(url).includes("/runs?")) {
      return new Response(JSON.stringify({ workflow_runs: [] }), { status: 200 });
    }
    return new Response(null, { status: 204 });
  };
  let statusCode = 0;
  let payload;
  const response = {
    status(value) {
      statusCode = value;
      return this;
    },
    json(value) {
      payload = value;
      return this;
    },
  };

  await crawlHandler(
    {
      method: "POST",
      headers: { "x-crawl-secret": "test-secret" },
      body: {
        keywords: ["三亩s58m", "MetaKeebs"],
        markets: ["goofish"],
        limit: 50,
      },
    },
    response,
  );

  assert.equal(statusCode, 202);
  assert.equal(payload.status, "queued");
  assert.deepEqual(JSON.parse(requests[1].options.body), {
    ref: "main",
    inputs: {
      request_id: payload.requestId,
      keyword: "三亩s58m",
      keywords: "三亩s58m,MetaKeebs",
      limit: "50",
      markets: "goofish",
      sort: "newest",
    },
  });
});
