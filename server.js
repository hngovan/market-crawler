import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { toCrawlArguments, validateCrawlRequest } from "./src/crawl-request.js";

const root = process.cwd();
const port = Number(process.env.PORT) || 3000;
const crawlSecret = process.env.CRAWL_TRIGGER_SECRET || "local";
const crawlJobs = new Map();
let activeCrawlId = "";
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function authorize(request) {
  return request.headers["x-crawl-secret"] === crawlSecret;
}

async function handleApi(request, response, url) {
  if (!authorize(request)) return sendJson(response, 401, { error: "Unauthorized" });

  if (url.pathname === "/api/crawl" && request.method === "POST") {
    const activeJob = crawlJobs.get(activeCrawlId);
    if (activeJob && ["queued", "in_progress"].includes(activeJob.status)) {
      return sendJson(response, 409, {
        error: "Một crawler khác đang chạy",
        requestId: activeCrawlId,
        status: activeJob.status,
      });
    }
    const options = validateCrawlRequest(await readJson(request));
    const requestId = randomUUID();
    const job = { status: "queued", log: "Crawler đang khởi động..." };
    crawlJobs.set(requestId, job);
    activeCrawlId = requestId;
    const child = spawn(process.execPath, ["crawl.js", ...toCrawlArguments(options)], {
      cwd: root,
      windowsHide: true,
    });
    job.status = "in_progress";
    const appendLog = (chunk) => {
      job.log = `${job.log}\n${chunk.toString("utf8")}`.trim().slice(-12000);
    };
    child.stdout.on("data", appendLog);
    child.stderr.on("data", appendLog);
    child.on("close", (code) => {
      job.status = code === 0 ? "success" : "failure";
      job.log = `${job.log}\nCrawler kết thúc với mã ${code}.`.trim();
      if (activeCrawlId === requestId) activeCrawlId = "";
    });
    return sendJson(response, 202, { requestId, status: "queued" });
  }

  if (url.pathname === "/api/crawl-status" && request.method === "GET") {
    const job = crawlJobs.get(url.searchParams.get("request_id"));
    return sendJson(
      response,
      200,
      job || { status: "pending", log: "Không tìm thấy job trong server hiện tại." },
    );
  }

  return sendJson(response, 404, { error: "Not found" });
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    if (url.pathname.startsWith("/api/")) return await handleApi(request, response, url);

    const pathname = decodeURIComponent(url.pathname);
    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filePath = path.resolve(root, relativePath);

    if (!filePath.startsWith(`${root}${path.sep}`)) {
      throw new Error("Forbidden");
    }

    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error("Not found");

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    if (request.url?.startsWith("/api/")) return sendJson(response, 400, { error: error.message });
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`Product viewer: http://localhost:${port}`);
  console.log(
    `Local crawl UI secret: ${crawlSecret === "local" ? "local" : "CRAWL_TRIGGER_SECRET"}`,
  );
});
