// Browser smoke for the made-up listed-orbits experience (a group drawn from a list of per-member orbits). Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-synthetic-listed.mjs
// Options: ASTRAEUS_URL (default http://localhost:5199/), ASTRAEUS_EVIDENCE_DIR (screenshots; use a new directory, never an old one).
//
// Runs at 1280x800 (desktop) and 390x844 (phone) in one browser with the same assertions; phone screenshots carry a `phone-` prefix.
// Every assertion reads data attributes, option lists, panel text or canvas pixels rather than layout:
//   points layer mounted, one group listed, no Apollo objects
//   panel: Illustrative badge, "Made up", the position along each orbit is illustrative, the clump is a model, not-shown parts
//   focus and follow the group; dots are drawn (lit pixels on the canvas) in True and Readable
//   group information identical under True and Readable
//   playback runs with zero console errors; Apollo stays the default experience
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
let page;
let prefix = "";
const errors = [];
const results = {};
const shot = async (name) => { if (outDir) await page.screenshot({ path: `${outDir}/${prefix}${name}.png` }); };
const choosePreset = async (name) => {
  const compact = page.locator(".object-camera-picker");
  if (await compact.isVisible()) {
    const value = await compact.evaluate((select, label) => [...select.options].find((option) => option.textContent.trim() === label)?.value ?? null, name);
    assert.ok(value, `camera preset exists: ${name}`);
    await compact.selectOption(value);
  } else {
    await page.getByRole("button", { name, exact: true }).click();
  }
};
// Pixels on the canvas close to the group's dot colour (#9de3a8), with the text labels hidden: relative evidence that dots are drawn.
const dotPixels = async () => {
  await page.evaluate(() => { for (const el of document.querySelectorAll(".scene-labels")) el.style.visibility = "hidden"; });
  const png = (await page.getByTestId("earth-moon-canvas").screenshot()).toString("base64");
  await page.evaluate(() => { for (const el of document.querySelectorAll(".scene-labels")) el.style.visibility = ""; });
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const copy = document.createElement("canvas");
    copy.width = image.width; copy.height = image.height;
    const ctx = copy.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const px = ctx.getImageData(0, 0, copy.width, copy.height).data;
    let n = 0;
    for (let i = 0; i < px.length; i += 4) if (px[i + 1] > 150 && px[i + 1] - px[i] > 25 && px[i + 1] >= px[i + 2]) n += 1;
    return n;
  }, png);
};

async function run(label, viewport) {
  prefix = label === "desktop" ? "" : `${label}-`;
  results[label] = {};
  page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${label} console: ${message.text()}`); });
  await page.goto(`${base}?experience=synthetic-listed`);
  await page.waitForSelector("canvas");
  await page.getByRole("region", { name: "Timeline controls" }).waitFor();
  const canvas = page.getByTestId("earth-moon-canvas");
  assert.equal(await canvas.getAttribute("data-point-groups"), "1");
  assert.equal(await page.locator('option[value="listed-orbits"]').count(), 1);
  assert.equal(await page.locator('option[value="columbia"]').count(), 0);
  await page.getByRole("button", { name: "Pause playback" }).click();

  const panel = page.locator("#info-panel");
  await page.getByLabel("Select object").selectOption("listed-orbits");
  await panel.waitFor();
  assert.equal(await panel.getAttribute("data-info-id"), "listed-orbits");
  const badge = panel.locator(".provenance-badge");
  assert.match(await badge.innerText(), /^Illustrative ⓘ/);
  await badge.click();
  const detail = await panel.locator(".provenance-detail").innerText();
  assert.match(detail, /Made up/);
  assert.match(detail, /two-body/i);
  assert.match(detail, /position along each orbit.*illustrative/is);
  assert.match(detail, /model, not a measurement/i);
  const infoText = await panel.innerText();
  assert.match(infoText, /position along each orbit is illustrative/i);
  assert.match(infoText, /clump|near the made-up parent/i);
  assert.match(infoText, /not shown/i);
  assert.doesNotMatch(await page.locator("body").innerText(), /meteor|shower|perseid|geminid|apollo|columbia/i, "name check");

  await choosePreset("Overview");
  await page.waitForTimeout(1200);
  await shot("listed-true-overview");
  await choosePreset("Focus listed orbits");
  await page.waitForTimeout(1500);
  await shot("listed-true-focus");
  results[label].dotPixelsTrueFocus = await dotPixels();
  assert.ok(results[label].dotPixelsTrueFocus > 20, "dots are drawn in True scale");
  await choosePreset("Follow listed orbits");
  await page.waitForTimeout(1200);
  await shot("listed-true-follow");

  const infoUnderTrue = await panel.innerText();
  const readable = page.getByRole("button", { name: "Readable", exact: true });
  await readable.click();
  assert.equal(await readable.getAttribute("aria-pressed"), "true");
  await page.waitForTimeout(800);
  assert.equal(await canvas.getAttribute("data-point-groups"), "1");
  assert.equal(await panel.innerText(), infoUnderTrue, "group information is identical under True and Readable");
  await choosePreset("Focus listed orbits");
  await page.waitForTimeout(1500);
  await shot("listed-readable-focus");
  results[label].dotPixelsReadableFocus = await dotPixels();
  assert.ok(results[label].dotPixelsReadableFocus > 20, "dots are drawn in Readable scale");
  await page.getByRole("button", { name: "True", exact: true }).click();
  await page.waitForTimeout(600);

  await page.getByRole("button", { name: "Play playback" }).click();
  await page.waitForTimeout(2500);
  await shot("listed-playing");
  await page.getByRole("button", { name: "Pause playback" }).click();

  await page.goto(base);
  await page.waitForSelector("canvas");
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-point-groups"), "0");
  assert.equal(await page.locator('option[value="columbia"]').count(), 1);
  assert.equal(await page.locator('option[value="listed-orbits"]').count(), 0);
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
