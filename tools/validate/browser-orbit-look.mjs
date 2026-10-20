// Browser check for the orbit-line controls (I-035): Developer > Display settings > Orbit lines. Toggles every layer off and on, moves a slider,
// resets, and checks the scene reports each layer and the ring opacity changing (the path readout, not pixels), with zero console errors. Run the app, then:
// PLAYWRIGHT_CORE=<path> ASTRAEUS_URL=http://localhost:5493/app.html ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-orbit-look.mjs
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { currentScale, ensurePaused, loadAddress, scenePaths, openDeveloper, waitForOrbitLines, toggleOn, pressToggle, sliderReadout, dragSlider, resetOrbitLines } from "./driver.mjs";

import { pw } from "./playwright.mjs";
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = {};

// T-102: the orbit look as the scene draws it (the `data-paths` readout), not the sum of canvas pixels: which layers are shown and the ring's opacity now.
const lookNow = async (page) => {
  const path = (await scenePaths(page)).find((entry) => entry.look !== null);
  assert.ok(path !== undefined, "the scene reports an orbit with a look");
  return path.look;
};

for (const [label, viewport, scale] of [["desktop-true", { width: 1440, height: 900 }, "true-scale"], ["desktop-readable", { width: 1440, height: 900 }, "readable-scale"], ["phone", { width: 390, height: 844 }, "true-scale"]]) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${label} console: ${message.text()}`); });
  await loadAddress(page, `${base}?experience=synthetic&view=earth,0,89,330&scale=${scale}&t=2026-10-17T00:00:00Z`); // throws when the scale is not offered or not in force (I-036)
  await page.waitForTimeout(3000);
  await ensurePaused(page);
  await openDeveloper(page);
  await waitForOrbitLines(page);
  assert.equal(await currentScale(page), scale, `${label}: the scale in use is ${scale}`);
  const toggles = { "Orbit ring": "orbit-ring", "Fade ring ends": "orbit-ring-fade", "Trailing arc": "orbit-arc", "Brighten when zoomed out": "orbit-zoom-brighten" };
  const outcome = { toggles: {} };
  const base0 = await lookNow(page);
  for (const [name, id] of Object.entries(toggles)) {
    assert.equal(await toggleOn(page, id), true, `${label}: ${name} starts on`);
    await pressToggle(page, id);
    assert.equal(await toggleOn(page, id), false, `${label}: ${name} off`);
    await page.waitForTimeout(500);
    const off = await lookNow(page);
    await pressToggle(page, id);
    assert.equal(await toggleOn(page, id), true, `${label}: ${name} back on`);
    await page.waitForTimeout(500);
    const on = await lookNow(page);
    outcome.toggles[name] = { on: base0, off, back: on };
    const layer = { "Orbit ring": "ring", "Trailing arc": "arc", "Fade ring ends": "endFade", "Brighten when zoomed out": "zoomBrighten" }[name];
    assert.equal(base0[layer], true, `${label}: the scene reports ${name} on at the start`);
    assert.equal(off[layer], false, `${label}: switching "${name}" off is drawn off (scene readout ${layer})`);
    assert.equal(on[layer], true, `${label}: "${name}" back on is drawn on`);
  }
  const before = await sliderReadout(page, "orbit-ring-opacity");
  const dim = (await lookNow(page)).ringOpacity;
  await dragSlider(page, "orbit-ring-opacity", 0.8);
  await page.waitForTimeout(500);
  assert.equal(await sliderReadout(page, "orbit-ring-opacity"), "0.80", `${label}: the slider reads 0.80 (was ${before})`);
  const bright = (await lookNow(page)).ringOpacity;
  assert.ok(bright > dim, `${label}: a brighter ring is drawn with more opacity (${dim} to ${bright})`);
  await resetOrbitLines(page);
  await page.waitForTimeout(500);
  assert.equal(await sliderReadout(page, "orbit-ring-opacity"), before, `${label}: reset returns the slider to ${before}`);
  outcome.slider = { before, set: "0.80", ringOpacityBefore: dim, ringOpacityAfter: bright };
  results[label] = outcome;
  await page.close();
}
await browser.close();
if (outDir) writeFileSync(`${outDir}/orbit-look-results.json`, JSON.stringify({ results, errors }, null, 2));
console.log(JSON.stringify(results, null, 1));
assert.deepEqual(errors, [], "no console errors");
console.log("orbit look controls: ok");
