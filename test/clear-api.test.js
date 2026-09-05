import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import clearDataHandler from "../api/clear-data.js";

async function getFreePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  server.close();
  await once(server, "close");
  return port;
}

async function startServer(port, env) {
  const server = spawn(process.execPath, ["server.js"], {
    env: { ...process.env, PORT: String(port), ...env },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let output = "";
  server.stdout.on("data", (chunk) => (output += chunk.toString("utf8")));
  server.stderr.on("data", (chunk) => (output += chunk.toString("utf8")));
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (output.includes(`http://localhost:${port}`)) return server;
    if (server.exitCode !== null) throw new Error(output || "Server exited");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  server.kill();
  throw new Error(output || "Server did not start");
}

test("local clear API requires the secret and clears configured data", async (t) => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "market-crawler-api-clear-"));
  t.after(() => rm(dataDir, { recursive: true, force: true }));
  await writeFile(
    path.join(dataDir, "markets.json"),
    JSON.stringify([
      {
        id: "joongna",
        name: "Joongna",
        status: "success",
        count: 1,
        error: "",
        dataFile: "data/joongna.json",
      },
    ]),
  );
  await writeFile(path.join(dataDir, "joongna.json"), JSON.stringify([{ name: "Keyboard" }]));
  const port = await getFreePort();
  const server = await startServer(port, {
    CRAWL_TRIGGER_SECRET: "test-secret",
    DATA_DIR: dataDir,
  });
  t.after(async () => {
    server.kill();
    await once(server, "close").catch(() => {});
  });

  const unauthorized = await fetch(`http://localhost:${port}/api/clear-data`, { method: "POST" });
  assert.equal(unauthorized.status, 401);

  const response = await fetch(`http://localhost:${port}/api/clear-data`, {
    method: "POST",
    headers: { "x-crawl-secret": "test-secret" },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "success",
    clearedMarkets: 1,
    clearedProducts: 1,
  });
  assert.deepEqual(JSON.parse(await readFile(path.join(dataDir, "joongna.json"), "utf8")), []);
});

test("Vercel clear API dispatches the clear operation through the crawl workflow", async (t) => {
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

  await clearDataHandler(
    { method: "POST", headers: { "x-crawl-secret": "test-secret" } },
    response,
  );

  assert.equal(statusCode, 202);
  assert.equal(payload.status, "queued");
  assert.match(payload.requestId, /^[0-9a-f-]{36}$/);
  assert.equal(requests.length, 2);
  assert.deepEqual(JSON.parse(requests[1].options.body), {
    ref: "main",
    inputs: { request_id: payload.requestId, operation: "clear" },
  });
});
