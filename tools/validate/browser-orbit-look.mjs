// Browser check for the orbit-line controls (I-035): Developer > Display settings > Orbit lines. Toggles every layer off and on, moves a slider,
// resets, and checks the canvas really changes, with zero console errors. Run the app, then:
// PLAYWRIGHT_CORE=<path> ASTRAEUS_URL=http://localhost:5493/app.html ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-orbit-look.mjs
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

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

for (const [label, viewport, scale] of [["desktop-true", { width: 1440, height: 900 }, "true-scale"], ["desktop-readable", { width: 1440, height: 900 }, "readable"], ["phone", { width: 390, height: 844 }, "true-scale"]]) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${label} console: ${message.text()}`); });
  await page.goto(`${base}?experience=earth-moon&view=earth,0,89,330&scale=${scale}&t=2026-10-17T00:00:00Z`);
  await page.waitForSelector("canvas");
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: "Developer mode" }).click();
  const group = page.getByRole("group", { name: "Orbit lines" });
  await group.waitFor();
  const toggles = ["Orbit ring", "Fade ring ends", "Trailing arc", "Brighten when zoomed out"];
  const outcome = { toggles: {} };
  const base0 = await litPixels(page);
  for (const name of toggles) {
    const button = group.getByRole("button", { name, exact: true });
    assert.equal(await button.getAttribute("aria-pressed"), "true", `${label}: ${name} starts on`);
    await button.click();
    assert.equal(await button.getAttribute("aria-pressed"), "false", `${label}: ${name} off`);
    await page.waitForTimeout(500);
    const off = await litPixels(page);
    await button.click();
    assert.equal(await button.getAttribute("aria-pressed"), "true", `${label}: ${name} back on`);
    await page.waitForTimeout(500);
    const on = await litPixels(page);
    outcome.toggles[name] = { on: base0, off, back: on };
    if (name === "Orbit ring" || name === "Trailing arc") assert.notEqual(off, base0, `${label}: switching "${name}" off changes the picture`);
  }
  const slider = group.getByLabel("Ring opacity", { exact: true });
  const value = group.getByTestId("orbit-base-opacity-value");
  const before = await value.textContent();
  await slider.evaluate((input) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, "0.8");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(500);
  assert.equal(await value.textContent(), "0.80", `${label}: the slider reads 0.80 (was ${before})`);
  const bright = await litPixels(page);
  assert.ok(bright > base0, `${label}: a brighter ring lights more of the picture`);
  await group.getByRole("button", { name: "Reset orbit lines" }).click();
  await page.waitForTimeout(500);
  assert.equal(await value.textContent(), before, `${label}: reset returns the slider to ${before}`);
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
