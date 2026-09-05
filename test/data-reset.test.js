import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rename, rm, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { clearMarketDataFiles } from "../src/data-reset.js";

test("clears every product file and resets the market manifest", async (t) => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "market-crawler-clear-"));
  t.after(() => rm(dataDir, { recursive: true, force: true }));
  const manifest = [
    {
      id: "joongna",
      name: "Joongna",
      region: "korea",
      currency: "KRW",
      status: "skipped",
      count: 1,
      error: "HTTP 403",
      dataFile: "data/joongna.json",
      crawl: { keyword: "realforce", crawledAt: "2026-09-05T00:00:00.000Z" },
    },
    {
      id: "mercari",
      name: "Mercari",
      region: "japan",
      currency: "JPY",
      status: "success",
      count: 1,
      error: "",
      dataFile: "data/mercari.json",
      crawl: { keyword: "realforce", crawledAt: "2026-09-05T00:00:00.000Z" },
    },
  ];
  await writeFile(path.join(dataDir, "markets.json"), JSON.stringify(manifest));
  await writeFile(path.join(dataDir, "joongna.json"), JSON.stringify([{ name: "Keyboard" }]));
  await writeFile(path.join(dataDir, "mercari.json"), JSON.stringify([{ name: "Keycap" }]));

  const result = await clearMarketDataFiles({ dataDir });

  assert.deepEqual(result, { clearedMarkets: 2, clearedProducts: 2 });
  assert.deepEqual(JSON.parse(await readFile(path.join(dataDir, "joongna.json"), "utf8")), []);
  assert.deepEqual(JSON.parse(await readFile(path.join(dataDir, "mercari.json"), "utf8")), []);
  assert.deepEqual(JSON.parse(await readFile(path.join(dataDir, "markets.json"), "utf8")), [
    {
      id: "joongna",
      name: "Joongna",
      region: "korea",
      currency: "KRW",
      status: "success",
      count: 0,
      error: "",
      dataFile: "data/joongna.json",
    },
    {
      id: "mercari",
      name: "Mercari",
      region: "japan",
      currency: "JPY",
      status: "success",
      count: 0,
      error: "",
      dataFile: "data/mercari.json",
    },
  ]);
});

test("refuses to clear files when the market manifest is malformed", async (t) => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "market-crawler-invalid-clear-"));
  t.after(() => rm(dataDir, { recursive: true, force: true }));
  await writeFile(path.join(dataDir, "markets.json"), "not-json");
  await writeFile(path.join(dataDir, "joongna.json"), JSON.stringify([{ name: "Keyboard" }]));

  await assert.rejects(() => clearMarketDataFiles({ dataDir }), /market manifest/i);
  assert.deepEqual(JSON.parse(await readFile(path.join(dataDir, "joongna.json"), "utf8")), [
    { name: "Keyboard" },
  ]);
});

test("restores every original file when a staged replacement fails", async (t) => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "market-crawler-rollback-clear-"));
  t.after(() => rm(dataDir, { recursive: true, force: true }));
  const manifest = [
    { id: "joongna", dataFile: "data/joongna.json", count: 1, status: "success" },
    { id: "mercari", dataFile: "data/mercari.json", count: 1, status: "success" },
  ];
  const joongnaProducts = [{ name: "Keyboard" }];
  const mercariProducts = [{ name: "Keycap" }];
  await writeFile(path.join(dataDir, "markets.json"), JSON.stringify(manifest));
  await writeFile(path.join(dataDir, "joongna.json"), JSON.stringify(joongnaProducts));
  await writeFile(path.join(dataDir, "mercari.json"), JSON.stringify(mercariProducts));
  const fileSystem = {
    readFile,
    writeFile,
    unlink,
    async rename(from, to) {
      if (from.endsWith(".tmp") && to.endsWith("mercari.json")) {
        throw new Error("simulated replacement failure");
      }
      return rename(from, to);
    },
  };

  await assert.rejects(
    () => clearMarketDataFiles({ dataDir, fileSystem }),
    /simulated replacement failure/,
  );
  assert.deepEqual(
    JSON.parse(await readFile(path.join(dataDir, "joongna.json"), "utf8")),
    joongnaProducts,
  );
  assert.deepEqual(
    JSON.parse(await readFile(path.join(dataDir, "mercari.json"), "utf8")),
    mercariProducts,
  );
  assert.deepEqual(
    JSON.parse(await readFile(path.join(dataDir, "markets.json"), "utf8")),
    manifest,
  );
});

test("rejects duplicate product targets and a target that collides with the manifest", async (t) => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "market-crawler-collision-clear-"));
  t.after(() => rm(dataDir, { recursive: true, force: true }));
  await writeFile(path.join(dataDir, "shared.json"), "[]");

  await writeFile(
    path.join(dataDir, "markets.json"),
    JSON.stringify([
      { id: "one", dataFile: "data/shared.json" },
      { id: "two", dataFile: "data/shared.json" },
    ]),
  );
  await assert.rejects(() => clearMarketDataFiles({ dataDir }), /duplicate product data target/i);

  await writeFile(
    path.join(dataDir, "markets.json"),
    JSON.stringify([{ id: "manifest", dataFile: "data/markets.json" }]),
  );
  await assert.rejects(() => clearMarketDataFiles({ dataDir }), /collides with market manifest/i);
});

test("preserves the backup and reports the file when rollback fails", async (t) => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "market-crawler-failed-rollback-"));
  t.after(() => rm(dataDir, { recursive: true, force: true }));
  await writeFile(
    path.join(dataDir, "markets.json"),
    JSON.stringify([
      { id: "joongna", dataFile: "data/joongna.json" },
      { id: "mercari", dataFile: "data/mercari.json" },
    ]),
  );
  await writeFile(path.join(dataDir, "joongna.json"), "[]");
  await writeFile(path.join(dataDir, "mercari.json"), "[]");
  const fileSystem = {
    readFile,
    writeFile,
    unlink,
    async rename(from, to) {
      if (from.endsWith(".tmp") && to.endsWith("mercari.json")) {
        throw new Error("simulated replacement failure");
      }
      if (from.endsWith(".backup") && to.endsWith("joongna.json")) {
        throw new Error("simulated rollback failure");
      }
      return rename(from, to);
    },
  };

  await assert.rejects(
    () => clearMarketDataFiles({ dataDir, fileSystem }),
    /rollback failed.*joongna\.json.*simulated rollback failure/i,
  );
  assert.equal(
    (await readdir(dataDir)).some(
      (fileName) => fileName.startsWith("joongna.json.") && fileName.endsWith(".backup"),
    ),
    true,
  );
});
