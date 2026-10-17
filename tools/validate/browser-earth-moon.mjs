// Browser check for the Earth–Moon Explorer (?experience=earth-moon) at desktop and phone size. Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-earth-moon.mjs
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { scaleOptions } from "./driver.mjs";
import * as ui from "./driver.mjs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = {};

// Pixels on the canvas that are not black: something is drawn.
const litPixels = async (page) => {
  const png = (await page.getByTestId("earth-moon-canvas").screenshot()).toString("base64");
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const copy = document.createElement("canvas");
    copy.width = image.width; copy.height = image.height;
    const ctx = copy.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
    let lit = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 60) lit += 1;
    return lit;
  }, png);
};

const seek = async (page, timeUtcMs) => {
  await ui.seekTo(page, timeUtcMs);
  await page.waitForTimeout(400);
};

const preset = async (page, objectId, presetId) => {
  await ui.pickBodyWithCamera(page, objectId, presetId);
  await page.waitForTimeout(1500);
};

async function run(label, viewport) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${label} console: ${message.text()}`); });
  const shot = async (name) => { if (outDir) await page.screenshot({ path: `${outDir}/${label}-${name}.png` }); };
  const notes = {};
  results[label] = notes;
  try {
    await page.goto(`${base}?experience=earth-moon`);
    await page.waitForSelector("canvas");
    await ui.waitForShell(page);
    const canvas = page.getByTestId("earth-moon-canvas");
    assert.equal(await canvas.getAttribute("data-bodies"), "earth,moon", `${label}: Earth and the Moon are the mounted bodies`);
    assert.equal(await canvas.getAttribute("data-scene-center"), "earth", `${label}: Earth is the scene centre`);
    assert.equal(await canvas.getAttribute("data-point-groups"), "0", `${label}: no point groups`);
    assert.equal(await canvas.getAttribute("data-sun-centred"), "0", `${label}: nothing Sun-centred`);
    await ui.pausePlayback(page);

    // Only Earth and the Moon, and no mission content anywhere.
    const options = await ui.bodyOptions(page);
    // T-053: the sky is every experience's last item ("sky"); the two bodies are unchanged.
    assert.deepEqual(options, ["earth", "moon", "sky"], `${label}: the object list is Earth, the Moon and the sky`);
    const body = await ui.pageText(page);
    assert.doesNotMatch(body, /apollo|columbia|eagle|mission|GET \d/i, `${label}: no mission content`);
    assert.equal(await ui.developerButtonCount(page), 1, `${label}: the shell is the usual one`);

    // Scale: True and Readable, as for Apollo.
    const scaleLabels = await scaleOptions(page);
    assert.deepEqual(scaleLabels, ["true-scale", "readable-scale"], `${label}: the usual two scales`);

    // Time moves things: the Moon's distance and phase change over half a month.
    const start = (await ui.seekRange(page)).min;
    const end = (await ui.seekRange(page)).max;
    const readMoon = async () => {
      await ui.pickBody(page, "moon");
      await ui.openInfo(page, "Moon");
      await ui.infoPanel(page).waitFor();
      return (await ui.infoPanel(page).innerText()).replace(/\s+/g, " ");
    };
    await seek(page, start);
    const first = await readMoon();
    assert.match(first, /Distance from Earth/, `${label}: the Moon's distance is shown`);
    assert.match(first, /illumination/i, `${label}: the Moon's phase is shown`);
    assert.match(first, /Moon position/, `${label}: the Moon's position is shown`);
    await seek(page, start + 14 * 86_400_000);
    const second = await readMoon();
    assert.notEqual(first, second, `${label}: the Moon's readings change over two weeks`);
    notes.moonStart = first.slice(0, 400);
    notes.moonLater = second.slice(0, 400);
    await ui.closeInfoStrict(page);

    // The four presets: each frames something drawn.
    await seek(page, start + 3 * 86_400_000);
    notes.lit = {};
    for (const [objectId, key] of [["earth", "overview"], ["earth", "focus-earth"], ["moon", "focus-moon"], ["moon", "follow-moon"]]) {
      await preset(page, objectId, key);
      notes.lit[key] = await litPixels(page);
      assert.ok(notes.lit[key] > 300, `${label}/${key}: something is drawn (${notes.lit[key]})`);
      await shot(key);
    }

    // The Moon's monthly path is mounted with the composition.
    assert.equal(await canvas.getAttribute("data-composition-paths"), "1", `${label}: the Moon's monthly path is drawn`);
  } finally {
    await page.close();
  }
}

try {
  await run("desktop", { width: 1280, height: 800 });
  await run("phone", { width: 390, height: 844 });
} finally {
  await browser.close();
}
console.log(JSON.stringify({ results, errors }, null, 2));
if (errors.length > 0) process.exit(1);
