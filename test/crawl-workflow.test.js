import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workflowPath = new URL("../.github/workflows/crawl.yml", import.meta.url);
const panelPath = new URL("../index.html", import.meta.url);

test("workflow crawls Yahoo Auctions normally and isolates Goofish failures", async () => {
  const workflow = await readFile(workflowPath, "utf8");

  assert.match(workflow, /default: joongna,bunjang,guheyo,mercari,yahoo-auctions,goofish/);
  assert.match(workflow, /--keywords="\$KEYWORDS" --markets="\$non_china_markets"/);
  assert.match(workflow, /if ! node crawl\.js --keywords="\$KEYWORDS" --markets="goofish"/);
  assert.match(
    workflow,
    /::warning::Goofish crawl failed; keeping the previous data and manifest error\./,
  );
});

test("crawl panel selects Yahoo Auctions and Goofish by default", async () => {
  const panel = await readFile(panelPath, "utf8");

  assert.match(
    panel,
    /<input name="crawl-market" type="checkbox" value="goofish" checked \/>\s*🇨🇳\s*Goofish/,
  );
  assert.match(
    panel,
    /<input name="crawl-market" type="checkbox" value="yahoo-auctions" checked \/>\s*🇯🇵\s*Yahoo! Auctions/,
  );
});
