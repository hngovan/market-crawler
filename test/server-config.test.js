import assert from "node:assert/strict";
import test from "node:test";

import { resolveServerHost } from "../src/server-config.js";

test("binds a server using the default secret to loopback only", () => {
  assert.equal(resolveServerHost({ crawlSecret: "local", configuredHost: "0.0.0.0" }), "127.0.0.1");
});

test("allows an explicitly secured server to use its configured host", () => {
  assert.equal(
    resolveServerHost({ crawlSecret: "private-secret", configuredHost: "0.0.0.0" }),
    "0.0.0.0",
  );
});
