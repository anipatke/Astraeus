// Spike 01 anchor-label regression against the current shell and Developer mode.
// Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> node tools/validate/browser-anchor-labels.mjs
// Optional first argument selects a screenshot directory. Defaults are isolated from committed Spike 02 evidence.
//
// Sizes (I-023): the scenario runs at 1280x800 (desktop) and again at 390x844 (phone) with the same assertions and expected values;
// the phone run writes its screenshots and results with a `-phone` suffix. The only difference is how the Follow preset is chosen:
// the phone shell shows a native "Camera mode" select instead of the camera buttons, so the option with the same label is picked.
//   desktop assertion                                  phone counterpart
//   layer hidden initially, zero visible labels ........ same
//   toggle reports on, 40 labels created ............... same 40 label elements; on screen: all 40 on desktop, and on the phone
//                                                        only those whose projection lies inside the narrower view (AnchorLabels hides
//                                                        an off-screen anchor), so the phone asserts 1 to 40 on screen
//   follow Columbia with labels on (screenshot) ........ same, via the camera select
//   second click hides the layer, aria-pressed false ... same
//   zero console and page errors ....................... same
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const url = process.env.ASTRAEUS_URL ?? "http://localhost:5199/";
const out = process.argv[2] ?? "docs/evidence/regression-spike01-02/anchor-labels";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
let page;
const errors = [];

const click = (name) => page.getByRole("button", { name, exact: true }).click();
const seek = async (utc) => {
  await page.getByLabel("UTC date and time").fill(utc);
  await click("Seek (UTC)");
  await page.waitForTimeout(200);
};
const closeInfo = async () => {
  const close = page.locator("#info-panel .info-panel-close");
  if (!(await close.count())) return;
  // The phone's open Developer panel overlays the sheet's Close button, so the phone closes the sheet with Escape from the focused Close button (a documented alternative).
  if (page.viewportSize().width < 600) { await close.focus(); await page.keyboard.press("Escape"); }
  else await close.click();
  await page.locator("#info-panel").waitFor({ state: "detached" });
};
const visibleAnchorCount = async () => {
  const layer = page.locator(".anchor-labels");
  if (await layer.getAttribute("hidden") !== null) return 0;
  return layer.locator(".anchor-label:not([hidden])").count();
};
const choosePreset = async (name) => {
  const compact = page.locator(".object-camera-picker");
  if (await compact.isVisible()) {
    const value = await compact.evaluate((select, label) => [...select.options].find((option) => option.textContent.trim() === label)?.value ?? null, name);
    assert.ok(value, `camera preset exists: ${name}`);
    await compact.selectOption(value);
  } else {
    await click(name);
  }
};

async function run(label, viewport) {
  const suffix = label === "desktop" ? "" : `-${label}`;
  page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${label} console: ${message.text()}`); });
  await page.goto(url);
  await page.waitForSelector("canvas");
  await page.getByRole("button", { name: "Developer mode" }).click();
  await page.getByLabel("UTC date and time").waitFor();
  const pause = page.getByRole("button", { name: "Pause playback", exact: true });
  if (await pause.count()) await pause.click();
  await seek("1969-07-22 20:30:00");
  await choosePreset("Earth–Moon overview");
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
  assert.equal(await layer.locator(".anchor-label").count(), 40, "all labelled source anchors are created when enabled");
  if (label === "desktop") assert.equal(countWhenOn, 40, "all 40 anchor labels are on screen in the desktop overview");
  else assert.ok(countWhenOn > 0 && countWhenOn <= 40, "the anchor labels inside the phone view are shown (the rest are off screen)");
  const overviewScreenshot = `${out}/labels-on-overview${suffix}.png`;
  await page.screenshot({ path: overviewScreenshot });

  await page.getByLabel("Select object").selectOption("columbia");
  await closeInfo();
  await choosePreset("Follow Columbia (CSM)");
  await page.waitForTimeout(1_500);
  const followScreenshot = `${out}/labels-on-follow${suffix}.png`;
  await page.screenshot({ path: followScreenshot });

  await button.click();
  await page.waitForFunction(() => document.querySelector(".anchor-labels")?.hasAttribute("hidden") === true);
  const pressedOff = await button.getAttribute("aria-pressed");
  assert.equal(pressedOff, "false", "anchor-label toggle reports off after the second click");
  assert.equal(await visibleAnchorCount(), 0, "anchor labels hide again when toggled off");
  assert.deepEqual(errors, [], "console and page errors are empty");

  const result = {
    url,
    viewport: `${viewport.width}x${viewport.height}`,
    hiddenInitially,
    countWhenOff,
    pressedOn,
    countWhenOn,
    pressedOff,
    hiddenAfterToggle: await layer.getAttribute("hidden") !== null,
    screenshots: [overviewScreenshot, followScreenshot],
    errors,
  };
  writeFileSync(`${out}/browser-anchor-labels-results${suffix}.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await page.close();
}

try {
  await run("desktop", { width: 1280, height: 800 });
  await run("phone", { width: 390, height: 844 });
} finally {
  await browser.close();
}
