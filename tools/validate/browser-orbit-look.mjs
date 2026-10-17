// Browser check for the orbit-line controls (I-035): Developer > Display settings > Orbit lines. Toggles every layer off and on, moves a slider,
// resets, and checks the canvas really changes, with zero console errors. Run the app, then:
// PLAYWRIGHT_CORE=<path> ASTRAEUS_URL=http://localhost:5493/app.html ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-orbit-look.mjs
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { currentScale, loadAddress, openDeveloper, waitForOrbitLines, toggleOn, pressToggle, sliderReadout, dragSlider, resetOrbitLines } from "./driver.mjs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = {};

const litPixels = async (page) => {
  const png = (await page.locator("canvas").first().screenshot()).toString("base64");
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const copy = document.createElement("canvas");
    copy.width = image.width; copy.height = image.height;
    const ctx = copy.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
    let sum = 0;
    for (let i = 0; i < pixels.length; i += 4) sum += pixels[i] + pixels[i + 1] + pixels[i + 2];
    return sum;
  }, png);
};

for (const [label, viewport, scale] of [["desktop-true", { width: 1440, height: 900 }, "true-scale"], ["desktop-readable", { width: 1440, height: 900 }, "readable-scale"], ["phone", { width: 390, height: 844 }, "true-scale"]]) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${label} console: ${message.text()}`); });
  await loadAddress(page, `${base}?experience=earth-moon&view=earth,0,89,330&scale=${scale}&t=2026-10-17T00:00:00Z`); // throws when the scale is not offered or not in force (I-036)
  await page.waitForTimeout(3000);
  await openDeveloper(page);
  await waitForOrbitLines(page);
  assert.equal(await currentScale(page), scale, `${label}: the scale in use is ${scale}`);
  const toggles = { "Orbit ring": "orbit-ring", "Fade ring ends": "orbit-ring-fade", "Trailing arc": "orbit-arc", "Brighten when zoomed out": "orbit-zoom-brighten" };
  const outcome = { toggles: {} };
  const base0 = await litPixels(page);
  for (const [name, id] of Object.entries(toggles)) {
    assert.equal(await toggleOn(page, id), true, `${label}: ${name} starts on`);
    await pressToggle(page, id);
    assert.equal(await toggleOn(page, id), false, `${label}: ${name} off`);
    await page.waitForTimeout(500);
    const off = await litPixels(page);
    await pressToggle(page, id);
    assert.equal(await toggleOn(page, id), true, `${label}: ${name} back on`);
    await page.waitForTimeout(500);
    const on = await litPixels(page);
    outcome.toggles[name] = { on: base0, off, back: on };
    if (name === "Orbit ring" || name === "Trailing arc") assert.notEqual(off, base0, `${label}: switching "${name}" off changes the picture`);
  }
  const before = await sliderReadout(page, "orbit-ring-opacity");
  await dragSlider(page, "orbit-ring-opacity", 0.8);
  await page.waitForTimeout(500);
  assert.equal(await sliderReadout(page, "orbit-ring-opacity"), "0.80", `${label}: the slider reads 0.80 (was ${before})`);
  const bright = await litPixels(page);
  assert.ok(bright > base0, `${label}: a brighter ring lights more of the picture`);
  await resetOrbitLines(page);
  await page.waitForTimeout(500);
  assert.equal(await sliderReadout(page, "orbit-ring-opacity"), before, `${label}: reset returns the slider to ${before}`);
  outcome.slider = { before, set: "0.80", litBefore: base0, litAfter: bright };
  if (outDir) await page.screenshot({ path: `${outDir}/${label}.png` });
  results[label] = outcome;
  await page.close();
}
await browser.close();
if (outDir) writeFileSync(`${outDir}/orbit-look-results.json`, JSON.stringify({ results, errors }, null, 2));
console.log(JSON.stringify(results, null, 1));
assert.deepEqual(errors, [], "no console errors");
console.log("orbit look controls: ok");
