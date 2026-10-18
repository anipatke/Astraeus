// Browser check for the Jupiter–Io experience (?experience=jupiter-io) at desktop and phone size. Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-jupiter-io.mjs
//
// Asserted at both sizes: Jupiter and Io are the mounted bodies with Jupiter as the scene centre, both labels are shown, Io's loop is
// drawn, Io moves between two dates (its position readout and its label on screen), the four presets frame something drawn, Jupiter's
// panel states the missing texture, Io's states its Horizons figure and its approximate-demonstration class, the per-body lighting is
// the default, and there are no console errors. The look (flattening, lit side, Io's night side) is judged by the owner on the preview.
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


const seek = async (page, timeUtcMs) => {
  await ui.seekTo(page, timeUtcMs);
  await page.waitForTimeout(500);
};

const preset = async (page, objectId, presetId) => {
  await ui.pickBodyWithCamera(page, objectId, presetId);
  await page.waitForTimeout(1500);
};

const labelCentre = (page, id) => page.locator(`[data-label-id="${id}"]`).evaluate((el) => {
  if (el.hidden) return null;
  const r = el.getBoundingClientRect();
  return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)];
});

const openPanel = async (page, objectId, label) => {
  await ui.pickBody(page, objectId);
  await ui.openInfo(page, label);
  await ui.infoPanel(page).waitFor();
  return (await ui.infoPanel(page).innerText()).replace(/\s+/g, " ");
};

async function run(name, viewport) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`${name} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${name} console: ${message.text()}`); });
  const notes = {};
  results[name] = notes;
  try {
    await page.goto(`${base}?experience=jupiter-io`);
    await page.waitForSelector("canvas");
    await ui.waitForShell(page);
    const canvas = page.getByTestId("earth-moon-canvas");
    assert.equal(await canvas.getAttribute("data-bodies"), "jupiter,io", `${name}: Jupiter and Io are the mounted bodies`);
    assert.equal(await canvas.getAttribute("data-scene-center"), "jupiter", `${name}: Jupiter is the scene centre`);
    assert.equal(await canvas.getAttribute("data-lighting"), "per-body", `${name}: each body is lit by its own Sun direction`);
    assert.equal(await canvas.getAttribute("data-composition-paths"), "1", `${name}: Io's loop is drawn`);
    await ui.pausePlayback(page);
    const options = await ui.bodyOptions(page);
    // T-053: the sky is every experience's last item ("sky"); the two bodies are unchanged.
    assert.deepEqual(options, ["jupiter", "io", "sky"], `${name}: the object list is Jupiter, Io and the sky`);
    const body = await ui.pageText(page);
    assert.doesNotMatch(body, /apollo|columbia|mission|perseid/i, `${name}: no other experience's content`);
    const scales = await scaleOptions(page);
    // T-085: one scale means no scale control at all (it was a held button before), so the options are empty and True stays in force.
    assert.deepEqual(scales, [], `${name}: true scale only, so no scale control (the other scales would bury or enlarge Io)`);
    assert.equal(await ui.hasScaleControl(page), false, `${name}: no scale control for one scale`);

    const start = (await ui.seekRange(page)).min;
    await seek(page, start);
    await preset(page, "jupiter", "overview");
    notes.overviewJupiter = await ui.sceneBody(page, "jupiter");
    assert.ok(notes.overviewJupiter?.inView && notes.overviewJupiter.as === "sphere" && notes.overviewJupiter.radiusPx > 5, `${name}: Jupiter is drawn as a sphere in view in the overview (scene readout ${JSON.stringify(notes.overviewJupiter)})`);
    for (const id of ["jupiter", "io"]) {
      assert.ok(await labelCentre(page, id), `${name}: the ${id} label is shown`);
    }

    // Io moves: its label on screen and its position readout change between two dates six hours apart (about a third of an orbit).
    const ioAt0 = await labelCentre(page, "io");
    const panel0 = await openPanel(page, "io", "Io");
    assert.match(panel0, /Distance from Jupiter/, `${name}: Io's distance from Jupiter is shown`);
    assert.match(panel0, /Io position/, `${name}: Io's position is shown`);
    await ui.closeInfoStrict(page);
    await seek(page, start + 6 * 3_600_000);
    await preset(page, "jupiter", "overview");
    const ioAt1 = await labelCentre(page, "io");
    const panel1 = await openPanel(page, "io", "Io");
    assert.notEqual(panel0, panel1, `${name}: Io's readings change in six hours`);
    await ui.closeInfoStrict(page);
    notes.ioLabel = { t0: ioAt0, sixHours: ioAt1 };
    assert.ok(ioAt0 && ioAt1 && Math.hypot(ioAt1[0] - ioAt0[0], ioAt1[1] - ioAt0[1]) > 10, `${name}: Io moves on screen (${JSON.stringify(notes.ioLabel)})`);

    // The four presets each frame something drawn.
    await seek(page, start + 3_600_000);
    notes.lit = {};
    for (const [objectId, key] of [["jupiter", "overview"], ["jupiter", "focus-jupiter"], ["io", "focus-io"], ["io", "follow-io"]]) {
      await preset(page, objectId, key);
      notes.lit[key] = await ui.sceneDrawsSomething(page);
      assert.ok(notes.lit[key].bodies + notes.lit[key].paths > 0, `${name}/${key}: something is drawn (scene readout ${JSON.stringify(notes.lit[key])})`);
    }
    await seek(page, start + 9 * 3_600_000);
    await page.waitForTimeout(500);

    // Accuracy records: Jupiter's missing texture, Io's Horizons figure and class.
    const jupiterPanel = await openPanel(page, "jupiter", "Jupiter");
    await ui.openProvenance(page);
    const jupiterDetail = (await ui.provenanceDetail(page).innerText()).replace(/\s+/g, " ");
    assert.match(jupiterDetail, /flat in one colour/i, `${name}: Jupiter's missing texture is stated`);
    notes.jupiterPanel = jupiterPanel.slice(0, 300);
    await ui.closeInfoStrict(page);
    await openPanel(page, "io", "Io");
    await ui.openProvenance(page);
    const ioDetail = (await ui.provenanceDetail(page).innerText()).replace(/\s+/g, " ");
    assert.match(ioDetail, /approximate demonstration/i, `${name}: Io's class is stated`);
    assert.match(ioDetail, /9,388 km/, `${name}: Io's Horizons figure is stated`);
    assert.match(ioDetail, /not intended for ephemeris computation/i, `${name}: the source's own warning is stated`);
    notes.ioDetail = ioDetail.slice(0, 600);
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
