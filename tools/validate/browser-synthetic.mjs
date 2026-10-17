// Browser smoke for the made-up experience. Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-synthetic.mjs
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import * as ui from "./driver.mjs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });

// The made-up contact window: band, curve, peak, stops, "Inside" line, source change and rate readout.
async function checkWindow(label, size) {
  await page.setViewportSize(size);
  await page.goto(`${base}?experience=synthetic`);
  await page.waitForSelector("canvas");
  await ui.pausePlayback(page);
  const win = ui.windowParts(page);
  const band = win.band;
  assert.equal(await band.count(), 1, `${label}: one window band`);
  assert.ok((await band.boundingBox()).width > 0, `${label}: band has width`);
  assert.equal(await win.line.count(), 1, `${label}: rate curve line`);
  assert.equal(await win.area.count(), 1, `${label}: rate curve filled area`);
  assert.equal(await win.peak.count(), 1, `${label}: peak marker`);
  assert.equal(await win.inside.count(), 0, `${label}: no Inside line before the window`);
  // I-019: band, curve and peak are one linked shape, together on one side of the slider.
  const [strip, slider, curve, peak, bandBox] = await Promise.all([win.strip.boundingBox(), win.slider.boundingBox(), win.curve.boundingBox(), win.peak.boundingBox(), band.boundingBox()]);
  assert.ok(Math.abs(strip.y + strip.height - (slider.y + slider.height / 2)) <= 3, `${label}: the window's baseline sits on the slider line, not apart from it (strip bottom ${strip.y + strip.height}, slider middle ${slider.y + slider.height / 2})`);
  const caption = (await win.caption.innerText()).replace(/\s+/g, " ");
  assert.match(caption, /^Contact window( · peak 48 passes per hour)?$/, `${label}: the shape is named in plain words from the window's data`);
  const captionBox = await win.caption.boundingBox();
  assert.ok(captionBox.y + captionBox.height <= curve.y + 1, `${label}: the caption sits above the curve, not over it`);
  assert.ok(curve.y >= strip.y - 1 && curve.y + curve.height <= strip.y + strip.height + 1, `${label}: curve inside the strip`);
  assert.ok(peak.x + peak.width / 2 >= bandBox.x && peak.x + peak.width / 2 <= bandBox.x + bandBox.width, `${label}: peak sits inside the band`);
  assert.ok(curve.height >= 40, `${label}: curve height ${curve.height} shows the rise and fall`);
  const touchMin = size.width < 700 ? 44 : 28;
  assert.ok(bandBox.height >= touchMin && peak.width >= touchMin, `${label}: window targets at least ${touchMin}px (band h ${bandBox.height}, peak w ${peak.width})`);
  const steps = [];
  for (let i = 0; i < 6 && (await ui.hasNextEvent(page)); i += 1) {
    steps.push(await ui.nextEventLabel(page));
    await ui.nextEvent(page);
    await page.waitForTimeout(150);
    const time = await ui.clockText(page);
    steps.push(time);
  }
  assert.ok(steps.some((step) => /opens/i.test(step)), `${label}: a stop at the window start`);
  assert.ok(steps.some((step) => /peaks/i.test(step)), `${label}: a stop at the peak`);
  assert.ok(steps.some((step) => /closes/i.test(step)), `${label}: a stop at the window end`);
  // Peak: Inside line and the first source wording.
  await ui.goToNamedWindowPeak(page, "Contact window");
  await page.waitForTimeout(200);
  // T-080: the "Inside" line lives behind the Events button; open it to read, then close it.
  await ui.toggleEventList(page);
  const inside = await win.inside.innerText();
  await ui.toggleEventList(page);
  assert.match(inside, /Inside:\s*Contact window/);
  assert.match(inside, /48 passes per hour/);
  // Source wording changes across the midpoint.
  const sourceText = async () => {
    if ((await ui.infoPanel(page).count()) === 0) {
      await ui.openNamedWindowInfo(page, "Contact window");
      await ui.waitForInfo(page);
    }
    // The detail is collapsed behind the badge, so read its text rather than what is visible.
    return ui.provenanceDetailContent(page);
  };
  const seekTo = (fraction) => ui.seekToFraction(page, fraction);
  // Window runs 30–210 of 480 minutes; the peak and source change are at 135.
  await seekTo(75 / 480);
  await page.waitForTimeout(200);
  const early = await sourceText();
  await seekTo(165 / 480);
  await page.waitForTimeout(200);
  const late = await sourceText();
  assert.match(early, /made-up ramp/i, `${label}: first-half wording`);
  assert.match(late, /made-up fall/i, `${label}: second-half wording`);
  assert.doesNotMatch(early + late, /measured/i, `${label}: nothing labelled measured`);
  // Rate readout on the object, and unavailable outside the window.
  await ui.pickBody(page, "survey-marker");
  await page.waitForTimeout(200);
  assert.match(await ui.infoPanel(page).innerText(), /Contact rate/);
  assert.match(await ui.infoPanel(page).innerText(), /passes per hour/);
  await seekTo(0);
  await page.waitForTimeout(200);
  assert.match(await ui.infoPanel(page).innerText(), /outside the contact window/);
  // A click along the band seeks to that point (not the start) and opens the window details.
  await ui.pressWindowBandAt(page, 0.25, 0.4);
  await page.waitForTimeout(200);
  const clicked = Date.parse(await ui.clockIso(page));
  const { min: lo, max: hi } = await ui.seekRange(page);
  assert.ok(Math.abs((clicked - lo) / (hi - lo) - (30 + 180 * 0.25) / 480) < 0.02, `${label}: band click seeks to the clicked point`);
  await ui.waitForInfo(page);
  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    await page.screenshot({ path: `${outDir}/synthetic-window-${label}.png` });
  }
}

try {
  await checkWindow("desktop", { width: 1280, height: 800 });
  await checkWindow("mobile", { width: 390, height: 780 });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${base}?experience=synthetic`);
  await page.waitForSelector("canvas");
  await ui.waitForShell(page);
  assert.equal(await ui.bodyOptionCount(page, "survey-marker"), 1);
  assert.equal(await ui.bodyOptionCount(page, "columbia"), 0);
  await ui.pausePlayback(page);
  await ui.toggleEventList(page);
  assert.equal(await ui.eventRowCount(page), 2);
  assert.ok((await ui.eventListText(page)).includes("Marker starts its loop"));
  await ui.pickBody(page, "survey-marker");
  await ui.chooseCamera(page, "focus-marker");
  await ui.chooseCamera(page, "follow-marker");
  await page.waitForTimeout(1500);
  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    await page.screenshot({ path: `${outDir}/synthetic.png` });
  }
  // Without a composition (data-bodies is empty; it replaces the retired data-earth-moon flag) the canvas still mounts and the marker is still available.
  await page.goto(`${base}?experience=synthetic-bare`);
  await page.waitForSelector("canvas");
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-bodies"), "");
  assert.equal(await ui.bodyOptionCount(page, "survey-marker"), 1);
  await ui.pickBody(page, "survey-marker");
  await ui.chooseCamera(page, "follow-marker");
  await page.waitForTimeout(1500);
  if (outDir) await page.screenshot({ path: `${outDir}/synthetic-bare.png` });
  await page.goto(`${base}?experience=synthetic`);
  await page.waitForSelector("canvas");
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-bodies"), "earth,moon");
  // Apollo stays the default.
  await page.goto(base);
  await page.waitForSelector("canvas");
  assert.equal(await ui.bodyOptionCount(page, "columbia"), 1);
  assert.equal(await ui.bodyOptionCount(page, "survey-marker"), 0);
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-bodies"), "earth,moon");
  // Apollo has no windows, so no window strip is drawn and the timeline is as before.
  assert.equal(await ui.windowParts(page).strip.count(), 0, "Apollo: no window strip");
  assert.equal(await ui.windowParts(page).band.count(), 0, "Apollo: no window band");
  assert.ok((await ui.windowParts(page).scrubber.boundingBox()).height < 50, "Apollo: scrubber height unchanged");
} finally {
  await browser.close();
}
console.log(JSON.stringify({ errors }, null, 2));
if (errors.length > 0) process.exit(1);
