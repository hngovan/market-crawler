import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workflowPath = new URL("../.github/workflows/crawl.yml", import.meta.url);
const panelPath = new URL("../index.html", import.meta.url);

test("workflow gives Goofish its China-only keyword set", async () => {
  const workflow = await readFile(workflowPath, "utf8");

  assert.match(workflow, /default: joongna,bunjang,guheyo,mercari,goofish/);
  assert.match(workflow, /CHINA_KEYWORDS: \$\{\{ inputs\.china_keywords \|\| '三亩S80,三亩s58m,MetaKeebs,realforce' \}\}/);
  assert.match(workflow, /--keywords="\$CHINA_KEYWORDS" --markets="goofish"/);
  assert.match(workflow, /--keywords="\$KEYWORDS" --markets="\$non_china_markets"/);
  assert.match(workflow, /if ! node crawl\.js --keywords="\$CHINA_KEYWORDS" --markets="goofish"/);
  assert.match(
    workflow,
    /::warning::Goofish crawl failed; keeping the previous data and manifest error\./,
  );
});

test("crawl panel selects Goofish by default", async () => {
  const panel = await readFile(panelPath, "utf8");

  assert.match(panel, /<input name="crawl-market" type="checkbox" value="goofish" checked \/> 🇨🇳 Goofish/);
});
