// Spike 01 anchor-label regression against the current shell and Developer mode.
// Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> node tools/validate/browser-anchor-labels.mjs
// Optional first argument selects a screenshot directory. Defaults are isolated from committed Spike 02 evidence.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const url = process.env.ASTRAEUS_URL ?? "http://localhost:5199/";
const out = process.argv[2] ?? "docs/evidence/regression-spike01-02/anchor-labels";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });

const click = (name) => page.getByRole("button", { name, exact: true }).click();
const seek = async (utc) => {
  await page.getByLabel("UTC date and time").fill(utc);
  await click("Seek (UTC)");
  await page.waitForTimeout(200);
};
const closeInfo = async () => {
  const close = page.locator("#info-panel .info-panel-close");
  if (await close.count()) await close.click();
};
const visibleAnchorCount = async () => {
  const layer = page.locator(".anchor-labels");
  if (await layer.getAttribute("hidden") !== null) return 0;
  return layer.locator(".anchor-label:not([hidden])").count();
};

try {
  await page.goto(url);
  await page.waitForSelector("canvas");
  await page.getByRole("button", { name: "Developer mode" }).click();
  await page.getByLabel("UTC date and time").waitFor();
  const pause = page.getByRole("button", { name: "Pause playback", exact: true });
  if (await pause.count()) await pause.click();
  await seek("1969-07-22 20:30:00");
  await click("Earth–Moon overview");
  await page.waitForTimeout(1_500);

  const layer = page.locator(".anchor-labels");
  const button = page.getByRole("button", { name: "Anchor labels", exact: true });
  const hiddenInitially = await layer.getAttribute("hidden") !== null;
  const countWhenOff = await visibleAnchorCount();
  assert.equal(hiddenInitially, true, "anchor-label layer starts hidden");
  assert.equal(countWhenOff, 0, "anchor labels are not visible when the toggle is off");

  await button.click();
  await page.waitForFunction(() => document.querySelector(".anchor-labels")?.hasAttribute("hidden") === false);
  const pressedOn = await button.getAttribute("aria-pressed");
  const countWhenOn = await visibleAnchorCount();
  assert.equal(pressedOn, "true", "anchor-label toggle reports on");
  assert.equal(countWhenOn, 40, "all labelled source anchors are created when enabled");
  const overviewScreenshot = `${out}/labels-on-overview.png`;
  await page.screenshot({ path: overviewScreenshot });

  await page.getByLabel("Select object").selectOption("columbia");
  await closeInfo();
  await click("Follow Columbia (CSM)");
  await page.waitForTimeout(1_500);
  const followScreenshot = `${out}/labels-on-follow.png`;
  await page.screenshot({ path: followScreenshot });

  await button.click();
  await page.waitForFunction(() => document.querySelector(".anchor-labels")?.hasAttribute("hidden") === true);
  const pressedOff = await button.getAttribute("aria-pressed");
  assert.equal(pressedOff, "false", "anchor-label toggle reports off after the second click");
  assert.equal(await visibleAnchorCount(), 0, "anchor labels hide again when toggled off");
  assert.deepEqual(errors, [], "console and page errors are empty");

  const result = {
    url,
    viewport: "1280x800",
    hiddenInitially,
    countWhenOff,
    pressedOn,
    countWhenOn,
    pressedOff,
    hiddenAfterToggle: await layer.getAttribute("hidden") !== null,
    screenshots: [overviewScreenshot, followScreenshot],
    errors,
  };
  writeFileSync(`${out}/browser-anchor-labels-results.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
