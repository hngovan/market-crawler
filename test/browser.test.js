import assert from "node:assert/strict";
import test from "node:test";

import { launchBrowser } from "../src/markets/browser.js";

test("exports a browser launch helper", () => {
  assert.equal(typeof launchBrowser, "function");
});
