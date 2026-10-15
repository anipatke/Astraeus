// Browser check for the Earth–Moon Explorer (?experience=earth-moon) at desktop and phone size. Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-earth-moon.mjs
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/";
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
  await page.locator('input[aria-label="Seek timeline"]').evaluate((input, time) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(time));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, timeUtcMs);
  await page.waitForTimeout(400);
};

const preset = async (page, objectId, name) => {
  await page.getByLabel("Select object").selectOption(objectId);
  const close = page.locator("#info-panel .info-panel-close");
  if (await close.count()) await close.click();
  const compact = page.locator(".object-camera-picker");
  if (await compact.isVisible()) {
    const value = await compact.evaluate((select, label) => [...select.options].find((o) => o.textContent.trim() === label)?.value ?? null, name);
    assert.ok(value, `preset exists: ${name}`);
    await compact.selectOption(value);
  } else {
    await page.getByRole("button", { name, exact: true }).click();
  }
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
    await page.getByRole("region", { name: "Timeline controls" }).waitFor();
    const canvas = page.getByTestId("earth-moon-canvas");
    assert.equal(await canvas.getAttribute("data-bodies"), "earth,moon", `${label}: Earth and the Moon are the mounted bodies`);
    assert.equal(await canvas.getAttribute("data-scene-center"), "earth", `${label}: Earth is the scene centre`);
    assert.equal(await canvas.getAttribute("data-point-groups"), "0", `${label}: no point groups`);
    assert.equal(await canvas.getAttribute("data-sun-centred"), "0", `${label}: nothing Sun-centred`);
    await page.getByRole("button", { name: "Pause playback" }).click();

    // Only Earth and the Moon, and no mission content anywhere.
    const options = await page.getByLabel("Select object").evaluate((select) => [...select.options].map((o) => o.value));
    // T-053: the sky is every experience's last item ("sky"); the two bodies are unchanged.
    assert.deepEqual(options, ["earth", "moon", "sky"], `${label}: the object list is Earth, the Moon and the sky`);
    const body = await page.locator("body").innerText();
    assert.doesNotMatch(body, /apollo|columbia|eagle|mission|GET \d/i, `${label}: no mission content`);
    assert.equal(await page.getByRole("button", { name: "Developer mode" }).count(), 1, `${label}: the shell is the usual one`);

    // Scale: True and Readable, as for Apollo.
    const scaleLabels = await page.locator(".scale-choices button[data-scale]").evaluateAll((buttons) => buttons.map((b) => b.dataset.scale));
    assert.deepEqual(scaleLabels, ["true-scale", "readable-scale"], `${label}: the usual two scales`);

    // Time moves things: the Moon's distance and phase change over half a month.
    const start = Number(await page.locator('input[aria-label="Seek timeline"]').getAttribute("min"));
    const end = Number(await page.locator('input[aria-label="Seek timeline"]').getAttribute("max"));
    const readMoon = async () => {
      await page.getByLabel("Select object").selectOption("moon");
      if (!(await page.locator("#info-panel").count())) await page.getByRole("button", { name: /^Information about Moon$/ }).click();
      await page.locator("#info-panel").waitFor();
      return (await page.locator("#info-panel").innerText()).replace(/\s+/g, " ");
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
    await page.locator("#info-panel .info-panel-close").click();

    // The four presets: each frames something drawn.
    await seek(page, start + 3 * 86_400_000);
    notes.lit = {};
    for (const [objectId, name, key] of [["earth", "Overview", "overview"], ["earth", "Focus Earth", "focus-earth"], ["moon", "Focus Moon", "focus-moon"], ["moon", "Follow Moon", "follow-moon"]]) {
      await preset(page, objectId, name);
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
