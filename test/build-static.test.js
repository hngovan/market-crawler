import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("build output includes browser module dependencies imported by index.html", async () => {
  const result = spawnSync(process.execPath, ["scripts/build-static.js"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  await access("public/src/ui-products.js");
  await access("public/src/exchange-rates.js");
});
