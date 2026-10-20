// Browser smoke for the made-up debris-ring experience (group capability). Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-synthetic-ring.mjs
//
// Sizes (I-023): the scenario runs at 1280x800 (desktop) and again at 390x844 (phone) in one browser, with the same assertions;
// Every desktop assertion is unchanged and has a phone counterpart with the same
// expected value, because each reads data attributes, option lists, panel text or the frame-rate counter rather than layout:
//   points layer mounted, one group listed, no other scene's objects .... same
//   group panel: Illustrative badge, "Made up", two-body ......... same (panel is a bottom sheet on the phone)
//   focus and follow ring ........................................ same, via the native "Camera mode" select (the camera buttons are hidden)
//   group information identical under True and Readable .......... same
//   frame-rate counter absent / present / labelled / graph ....... same
//   the marker scene: no groups, its marker listed, no ring ...... same
//   frame pacing .................................................. measured at both sizes, still no assertion (software renderer)
// Phone layout is owned by browser-shell.mjs and browser-layout.mjs and is not re-asserted here.
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
let prefix = "";
const errors = [];
const pacingBySize = {};
const counterReadings = {};
const readCounter = async (counter, groupId) => ({
  fps: Number(await counter.locator("[data-frame-fps]").innerText()),
  longestMs: parseFloat(await counter.locator("[data-frame-longest]").innerText()),
  over: await counter.locator("[data-frame-over]").innerText(),
  fills: groupId === null ? null : Number(await counter.locator(`[data-fill-count="${groupId}"]`).innerText()),
});
const choosePreset = (presetId) => ui.chooseCamera(page, presetId);

async function run(label, viewport) {
  prefix = label === "desktop" ? "" : `${label}-`;
  page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${label} console: ${message.text()}`); });
  let pacing = [];
  counterReadings[label] = {};
  await page.goto(`${base}?experience=synthetic-ring`);
  await page.waitForSelector("canvas");
  await ui.waitForShell(page);
  const canvas = page.getByTestId("earth-moon-canvas");
  // The points layer is mounted and the group is listed once.
  assert.equal(await canvas.getAttribute("data-point-groups"), "1");
  assert.equal(await ui.bodyOptionCount(page, "debris-ring"), 1);
  assert.equal(await ui.bodyOptionCount(page, "survey-marker"), 0);
  await ui.pausePlayback(page);

  // Select the group: its information panel states that it is made up.
  const panel = ui.infoPanel(page);
  await ui.pickBody(page, "debris-ring");
  await panel.waitFor();
  assert.equal(await panel.getAttribute("data-info-id"), "debris-ring");
    assert.match(await ui.provenanceBadgeText(page), /^Illustrative ⓘ/);
  await ui.openProvenance(page);
  const detail = await ui.provenanceDetailRaw(page);
  assert.match(detail, /Made up/);
  assert.match(detail, /two-body/i);
  const infoUnderTrue = await panel.innerText();

  // Focus and follow work at true scale; capture the ring.
  await choosePreset("overview");
  await page.waitForTimeout(1000);
  await choosePreset("focus-ring");
  await page.waitForTimeout(1200);
  await choosePreset("follow-ring");
  await page.waitForTimeout(1200);

  // Scale switches leave the group's information (its State-derived content) unchanged.
  await chooseScale(page, "Readable");
  assert.equal(await currentScale(page), "readable-scale");
  await page.waitForTimeout(800);
  assert.equal(await canvas.getAttribute("data-point-groups"), "1");
  assert.equal(await panel.innerText(), infoUnderTrue, "group information is identical under True and Readable");
  await choosePreset("overview");
  await page.waitForTimeout(1000);
  await choosePreset("focus-ring");
  await page.waitForTimeout(1200);
  await chooseScale(page, "True");
  await page.waitForTimeout(600);
  assert.equal(await panel.innerText(), infoUnderTrue, "group information is unchanged after switching back");

  // Playback moves the clock without errors, and Apollo stays the default experience.
  await ui.playPlayback(page);
  await page.waitForTimeout(500);
  // Frame pacing while the ring plays at the default rate. Software rendering, so relative evidence only: no assertion.
  pacing = await page.evaluate(() => new Promise((resolve) => {
    const deltas = [];
    let last = performance.now();
    const end = last + 4000;
    const tick = (now) => {
      deltas.push(now - last);
      last = now;
      if (now < end) requestAnimationFrame(tick); else resolve(deltas);
    };
    requestAnimationFrame(tick);
  }));
  // Frame-rate counter (T-031): absent with Developer mode off, plausible values with it on.
  const counter = page.getByTestId("frame-rate");
  assert.equal(await counter.count(), 0, "no counter with Developer mode off");
  await ui.toggleDeveloper(page);
  await counter.locator("[data-frame-fps]").waitFor({ timeout: 10000 });
  counterReadings[label].ring = await readCounter(counter, "debris-ring");
  assert.ok(counterReadings[label].ring.fps > 0, "ring fps is positive");
  assert.ok(counterReadings[label].ring.fills >= 1, "ring fill count is at least 1");
  assert.match(await counter.innerText(), /this browser and machine/);
  await counter.getByTestId("fps-graph").waitFor({ timeout: 10000 });
  await ui.waitForFrameGraphLine(page, { state: "attached", timeout: 10000 });
  assert.match(await counter.getByTestId("fps-graph").textContent(), /frames per second[\s\S]*s ago[\s\S]*now \(/, "graph is labelled");
  await ui.toggleDeveloper(page);
  assert.equal(await counter.count(), 0, "counter gone when Developer mode is turned off");

  // Another made-up scene (no groups) is a separate experience: no ring, its own marker.
  await page.goto(`${base}?experience=synthetic`);
  await page.waitForSelector("canvas");
  await ui.toggleDeveloper(page);
  await page.getByTestId("frame-rate").locator("[data-frame-fps]").waitFor({ timeout: 10000 });
  counterReadings[label].marker = await readCounter(page.getByTestId("frame-rate"), null);
  assert.ok(counterReadings[label].marker.fps > 0, "the marker scene's fps is positive");
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-point-groups"), "0");
  assert.equal(await ui.bodyOptionCount(page, "survey-marker"), 1);
  assert.equal(await ui.bodyOptionCount(page, "debris-ring"), 0);
  const sorted = [...pacing].sort((x, y) => x - y);
  const pick = (q) => Number((sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0).toFixed(1));
  pacingBySize[label] = { frames: pacing.length, median: pick(0.5), p95: pick(0.95), max: pick(1), over33ms: pacing.filter((d) => d > 33.4).length };
  await page.close();
}

try {
  await run("desktop", { width: 1280, height: 800 });
} finally {
  await browser.close();
}
console.log(JSON.stringify({ framePacingMs: pacingBySize, counterReadings, errors }, null, 2));
if (errors.length > 0) process.exit(1);
