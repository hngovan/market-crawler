import assert from "node:assert/strict";
import test from "node:test";

import { createOperationLock } from "../src/operation-lock.js";

test("prevents crawl and clear operations from overlapping", () => {
  const lock = createOperationLock();

  assert.equal(lock.start("clear"), true);
  assert.equal(lock.start("crawl"), false);
  assert.equal(lock.current(), "clear");
  lock.finish("clear");
  assert.equal(lock.start("crawl"), true);
  assert.equal(lock.current(), "crawl");
});
