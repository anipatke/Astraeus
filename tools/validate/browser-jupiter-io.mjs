// Browser check for the Jupiter–Io experience (?experience=jupiter-io) at desktop and phone size. Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-jupiter-io.mjs
//
// Asserted at both sizes: Jupiter and Io are the mounted bodies with Jupiter as the scene centre, both labels are shown, Io's loop is
// drawn, Io moves between two dates (its position readout and its label on screen), the four presets frame something drawn, Jupiter's
// panel states the missing texture, Io's states its Horizons figure and its approximate-demonstration class, the per-body lighting is
// the default, and there are no console errors. The look (flattening, lit side, Io's night side) is judged by the owner from the screenshots.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { scaleOptions } from "./shellScale.mjs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = {};

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
  await page.waitForTimeout(500);
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

const labelCentre = (page, id) => page.locator(`[data-label-id="${id}"]`).evaluate((el) => {
  if (el.hidden) return null;
  const r = el.getBoundingClientRect();
  return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)];
});

const openPanel = async (page, objectId, label) => {
  await page.getByLabel("Select object").selectOption(objectId);
  if (!(await page.locator("#info-panel").count())) await page.getByRole("button", { name: new RegExp(`^Information about ${label}$`) }).click();
  await page.locator("#info-panel").waitFor();
  return (await page.locator("#info-panel").innerText()).replace(/\s+/g, " ");
};

async function run(name, viewport) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`${name} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${name} console: ${message.text()}`); });
  const shot = async (shotName) => { if (outDir) await page.screenshot({ path: `${outDir}/${name}-${shotName}.png` }); };
  const notes = {};
  results[name] = notes;
  try {
    await page.goto(`${base}?experience=jupiter-io`);
    await page.waitForSelector("canvas");
    await page.getByRole("region", { name: "Timeline controls" }).waitFor();
    const canvas = page.getByTestId("earth-moon-canvas");
    assert.equal(await canvas.getAttribute("data-bodies"), "jupiter,io", `${name}: Jupiter and Io are the mounted bodies`);
    assert.equal(await canvas.getAttribute("data-scene-center"), "jupiter", `${name}: Jupiter is the scene centre`);
    assert.equal(await canvas.getAttribute("data-lighting"), "per-body", `${name}: each body is lit by its own Sun direction`);
    assert.equal(await canvas.getAttribute("data-composition-paths"), "1", `${name}: Io's loop is drawn`);
    await page.getByRole("button", { name: "Pause playback" }).click();
    const options = await page.getByLabel("Select object").evaluate((select) => [...select.options].map((o) => o.value));
    // T-053: the sky is every experience's last item ("sky"); the two bodies are unchanged.
    assert.deepEqual(options, ["jupiter", "io", "sky"], `${name}: the object list is Jupiter, Io and the sky`);
    const body = await page.locator("body").innerText();
    assert.doesNotMatch(body, /apollo|columbia|mission|perseid/i, `${name}: no other experience's content`);
    const scales = await scaleOptions(page);
    assert.deepEqual(scales, ["true-scale"], `${name}: true scale only (the other scales would bury or enlarge Io)`);

    const start = Number(await page.locator('input[aria-label="Seek timeline"]').getAttribute("min"));
    await seek(page, start);
    await preset(page, "jupiter", "Overview");
    notes.overviewLit = await litPixels(page);
    assert.ok(notes.overviewLit > 800, `${name}: Jupiter is drawn in the overview (${notes.overviewLit})`);
    for (const id of ["jupiter", "io"]) {
      assert.ok(await labelCentre(page, id), `${name}: the ${id} label is shown`);
    }
    await shot("overview-t0");

    // Io moves: its label on screen and its position readout change between two dates six hours apart (about a third of an orbit).
    const ioAt0 = await labelCentre(page, "io");
    const panel0 = await openPanel(page, "io", "Io");
    assert.match(panel0, /Distance from Jupiter/, `${name}: Io's distance from Jupiter is shown`);
    assert.match(panel0, /Io position/, `${name}: Io's position is shown`);
    await page.locator("#info-panel .info-panel-close").click();
    await seek(page, start + 6 * 3_600_000);
    await preset(page, "jupiter", "Overview");
    const ioAt1 = await labelCentre(page, "io");
    const panel1 = await openPanel(page, "io", "Io");
    assert.notEqual(panel0, panel1, `${name}: Io's readings change in six hours`);
    await page.locator("#info-panel .info-panel-close").click();
    notes.ioLabel = { t0: ioAt0, sixHours: ioAt1 };
    assert.ok(ioAt0 && ioAt1 && Math.hypot(ioAt1[0] - ioAt0[0], ioAt1[1] - ioAt0[1]) > 10, `${name}: Io moves on screen (${JSON.stringify(notes.ioLabel)})`);
    await shot("overview-t6h");

    // The four presets each frame something drawn.
    await seek(page, start + 3_600_000);
    notes.lit = {};
    for (const [objectId, presetName, key] of [["jupiter", "Overview", "overview"], ["jupiter", "Focus Jupiter", "focus-jupiter"], ["io", "Focus Io", "focus-io"], ["io", "Follow Io", "follow-io"]]) {
      await preset(page, objectId, presetName);
      notes.lit[key] = await litPixels(page);
      assert.ok(notes.lit[key] > 300, `${name}/${key}: something is drawn (${notes.lit[key]})`);
      await shot(key);
    }
    await seek(page, start + 9 * 3_600_000);
    await page.waitForTimeout(500);
    await shot("follow-io-later");

    // Accuracy records: Jupiter's missing texture, Io's Horizons figure and class.
    const jupiterPanel = await openPanel(page, "jupiter", "Jupiter");
    await page.locator("#info-panel .provenance-badge").click();
    const jupiterDetail = (await page.locator("#info-panel .provenance-detail").innerText()).replace(/\s+/g, " ");
    assert.match(jupiterDetail, /flat in one colour/i, `${name}: Jupiter's missing texture is stated`);
    notes.jupiterPanel = jupiterPanel.slice(0, 300);
    await shot("jupiter-info");
    await page.locator("#info-panel .info-panel-close").click();
    await openPanel(page, "io", "Io");
    await page.locator("#info-panel .provenance-badge").click();
    const ioDetail = (await page.locator("#info-panel .provenance-detail").innerText()).replace(/\s+/g, " ");
    assert.match(ioDetail, /approximate demonstration/i, `${name}: Io's class is stated`);
    assert.match(ioDetail, /9,388 km/, `${name}: Io's Horizons figure is stated`);
    assert.match(ioDetail, /not intended for ephemeris computation/i, `${name}: the source's own warning is stated`);
    notes.ioDetail = ioDetail.slice(0, 600);
    await shot("io-info");
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
