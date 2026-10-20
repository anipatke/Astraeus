// Browser smoke for the made-up listed-orbits experience (a group drawn from a list of per-member orbits). Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-synthetic-listed.mjs
// Options: ASTRAEUS_URL (default http://localhost:5199/app.html), ASTRAEUS_EVIDENCE_DIR (results; use a new directory, never an old one).
//
// Runs at 1280x800 (desktop) and 390x844 (phone) in one browser with the same assertions.
// Every assertion reads data attributes, option lists, panel text or the scene's point readout rather than layout:
//   points layer mounted, one group listed, no Apollo objects
//   panel: Illustrative badge, "Made up", the position along each orbit is illustrative, the clump is a model, not-shown parts
//   focus and follow the group; dots are drawn (members in view in the point readout) in True and Readable
//   group information identical under True and Readable
//   playback runs with zero console errors; Apollo stays the default experience
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chooseScale, currentScale } from "./driver.mjs";
import * as ui from "./driver.mjs";

import { pw } from "./playwright.mjs";
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
let page;
const errors = [];
const results = {};
const choosePreset = (presetId) => ui.chooseCamera(page, presetId);
// Dots of the group in view, from the scene's point readout (members in front of the camera and inside the view): evidence that dots are drawn.
const dotsInView = () => ui.sceneDotsInView(page);

async function run(label, viewport) {
  results[label] = {};
  page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${label} console: ${message.text()}`); });
  await page.goto(`${base}?experience=synthetic-listed`);
  await page.waitForSelector("canvas");
  await ui.waitForShell(page);
  const canvas = page.getByTestId("earth-moon-canvas");
  assert.equal(await canvas.getAttribute("data-point-groups"), "1");
  assert.equal(await ui.bodyOptionCount(page, "listed-orbits"), 1);
  assert.equal(await ui.bodyOptionCount(page, "columbia"), 0);
  await ui.pausePlayback(page);

  const panel = ui.infoPanel(page);
  await ui.pickBody(page, "listed-orbits");
  await panel.waitFor();
  assert.equal(await panel.getAttribute("data-info-id"), "listed-orbits");
    assert.match(await ui.provenanceBadgeText(page), /^Illustrative ⓘ/);
  await ui.openProvenance(page);
  const detail = await ui.provenanceDetailRaw(page);
  assert.match(detail, /Made up/);
  assert.match(detail, /two-body/i);
  assert.match(detail, /position along each orbit.*illustrative/is);
  assert.match(detail, /model, not a measurement/i);
  const infoText = await panel.innerText();
  assert.match(infoText, /position along each orbit is illustrative/i);
  assert.match(infoText, /clump|near the made-up parent/i);
  assert.match(infoText, /not shown/i);
  assert.doesNotMatch(await ui.pageText(page), /meteor|shower|perseid|geminid|apollo|columbia/i, "name check");

  await choosePreset("overview");
  await page.waitForTimeout(1200);
  await choosePreset("focus-listed");
  await page.waitForTimeout(1500);
  results[label].dotsInViewTrueFocus = await dotsInView();
  assert.ok(results[label].dotsInViewTrueFocus > 20, "dots are drawn in True scale");
  await choosePreset("follow-listed");
  await page.waitForTimeout(1200);

  const infoUnderTrue = await panel.innerText();
  await chooseScale(page, "Readable");
  assert.equal(await currentScale(page), "readable-scale");
  await page.waitForTimeout(800);
  assert.equal(await canvas.getAttribute("data-point-groups"), "1");
  assert.equal(await panel.innerText(), infoUnderTrue, "group information is identical under True and Readable");
  await choosePreset("focus-listed");
  await page.waitForTimeout(1500);
  results[label].dotsInViewReadableFocus = await dotsInView();
  assert.ok(results[label].dotsInViewReadableFocus > 20, "dots are drawn in Readable scale");
  await chooseScale(page, "True");
  await page.waitForTimeout(600);

  await ui.playPlayback(page);
  await page.waitForTimeout(2500);
  await ui.pausePlayback(page);

  await page.goto(base);
  await page.waitForSelector("canvas");
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-point-groups"), "0");
  assert.equal(await ui.bodyOptionCount(page, "columbia"), 1);
  assert.equal(await ui.bodyOptionCount(page, "listed-orbits"), 0);
  await page.close();
}

try {
  await run("desktop", { width: 1280, height: 800 });
  await run("phone", { width: 390, height: 844 });
} finally {
  await browser.close();
}
console.log(JSON.stringify({ results, errors }, null, 2));
if (errors.length > 0) process.exit(1);
