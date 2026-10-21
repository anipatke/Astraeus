// Anchor-label layer on the made-up scene (twelve invented marks along the marker's loop; moved off Apollo by O-034 T-111).
// Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> node tools/validate/browser-anchor-labels.mjs
// Output directory (I-040): the first argument, else ASTRAEUS_EVIDENCE_DIR, else a fresh timestamped directory under the system temp directory. A plain call never writes into
// committed evidence (historical evidence rule); pass a docs/evidence/ path deliberately to keep a run.
//
// Sizes (I-023): the scenario runs at 1280x800 (desktop) and again at 390x844 (phone) with the same assertions and expected values;
// the phone run writes its results with a `-phone` suffix. The only difference is how the Follow preset is chosen:
// the phone shell shows a native "Camera mode" select instead of the camera buttons, so the option with the same label is picked.
//   desktop assertion                                  phone counterpart
//   layer hidden initially, zero visible labels ........ same
//   toggle reports on, 12 labels created ............... same 12 label elements; on screen: all 12 on desktop, and on the phone
//                                                        only those whose projection lies inside the narrower view (AnchorLabels hides
//                                                        an off-screen anchor), so the phone asserts 1 to 12 on screen
//   follow the marker with labels on ....... same, via the camera select
//   second click hides the layer, aria-pressed false ... same
//   zero console and page errors ....................... same
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as ui from "./driver.mjs";
import { launchBrowser, openPage, watchErrors } from "./harness.mjs";

const url = `${process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html"}?experience=synthetic`;
const out = process.argv[2] ?? process.env.ASTRAEUS_EVIDENCE_DIR ?? join(tmpdir(), `astraeus-anchor-labels-${new Date().toISOString().replace(/[:.]/g, "-")}`);
mkdirSync(out, { recursive: true });

const browser = await launchBrowser();
let page;
const errors = [];

const seek = async (fraction) => {
  await ui.seekToFraction(page, fraction);
  await page.waitForTimeout(200);
};
const closeInfo = async () => {
  if (!(await ui.infoOpen(page))) return;
  // The phone's open Developer panel overlays the sheet's Close button, so the phone closes the sheet with Escape from the focused Close button (a documented alternative).
  await ui.closeInfoForViewport(page);
  await ui.waitForInfoClosed(page);
};
const visibleAnchorCount = () => ui.visibleAnchorLabelCount(page);
const choosePreset = (presetId) => ui.chooseCamera(page, presetId);

async function run(label, viewport) {
  const suffix = label === "desktop" ? "" : `-${label}`;
  page = await openPage(browser, { viewport });
  watchErrors(page, errors, label);
  await page.goto(url);
  await page.waitForSelector("canvas");
  await ui.toggleDeveloper(page);
  await ui.ensurePaused(page);
  await seek(0.5);
  await choosePreset("overview");
  await page.waitForTimeout(1_500);

  const hiddenInitially = await ui.anchorLayerHidden(page);
  const countWhenOff = await visibleAnchorCount();
  assert.equal(hiddenInitially, true, "anchor-label layer starts hidden");
  assert.equal(countWhenOff, 0, "anchor labels are not visible when the toggle is off");

  await ui.pressToggle(page, "anchor-labels");
  await ui.waitForAnchorLayer(page, false);
  const pressedOn = String(await ui.toggleOn(page, "anchor-labels"));
  const countWhenOn = await visibleAnchorCount();
  assert.equal(pressedOn, "true", "anchor-label toggle reports on");
  assert.equal(await ui.anchorLabelCount(page), 12, "all labelled source anchors are created when enabled");
  if (label === "desktop") assert.equal(countWhenOn, 12, "all 12 anchor labels are on screen in the desktop overview");
  else assert.ok(countWhenOn > 0 && countWhenOn <= 12, "the anchor labels inside the phone view are shown (the rest are off screen)");

  await ui.pickBody(page, "survey-marker");
  await closeInfo();
  await choosePreset("follow-marker");
  await page.waitForTimeout(1_500);

  await ui.pressToggle(page, "anchor-labels");
  await ui.waitForAnchorLayer(page, true);
  const pressedOff = String(await ui.toggleOn(page, "anchor-labels"));
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
    hiddenAfterToggle: await ui.anchorLayerHidden(page),
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
