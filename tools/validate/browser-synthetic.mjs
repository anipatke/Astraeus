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

// The made-up contact window: glow, peak, stops, "Inside" line, source change and rate readout.
async function checkWindow(label, size) {
  await page.setViewportSize(size);
  await page.goto(`${base}?experience=synthetic`);
  await page.waitForSelector("canvas");
  await ui.pausePlayback(page);
  const win = ui.windowParts(page);
  // T-084: the activity is a glow inside the timeline track, not a strip above it. Scenario map: "one window band" -> one glow; "rate curve line / filled area" -> a gradient
  // whose brightest stop is at the peak and whose quiet stops are fainter; "peak marker" -> the peak mark on the line; "caption names the shape" -> the glow's text equivalent.
  assert.equal(await win.glow.count(), 1, `${label}: one activity glow`);
  assert.equal(await win.peak.count(), 1, `${label}: peak marker`);
  assert.equal(await win.inside.count(), 0, `${label}: no Inside line before the window`);
  const [glow, slider, peak, bar] = await Promise.all([win.glow.boundingBox(), win.slider.boundingBox(), win.peak.boundingBox(), win.bar.boundingBox()]);
  assert.ok(glow.width > 100, `${label}: the glow spans the track`);
  assert.ok(Math.abs(glow.y + glow.height / 2 - (slider.y + slider.height / 2)) <= 2, `${label}: the glow sits on the slider line, not apart from it`);
  assert.ok(peak.y + peak.height / 2 >= slider.y - 12 && peak.y + peak.height / 2 <= slider.y + slider.height && peak.x + peak.width / 2 >= glow.x && peak.x + peak.width / 2 <= glow.x + glow.width, `${label}: the peak mark rides on the line, inside the glow's span`);
  const heightLimit = size.width < 700 ? 130 : 70;
  assert.ok(bar.height <= heightLimit, `${label}: the timeline is the one slim line again (${bar.height} px, limit ${heightLimit})`);
  assert.match(await ui.glowText(page), /Contact window: peak 48 passes per hour/, `${label}: the glow has a text equivalent from the window's data`);
  const gradients = await ui.glowGradients(page);
  const alphas = [...gradients.ahead.matchAll(/rgba\([^)]*, ([\d.]+)\) ([\d.]+)%/g)].map((m) => ({ alpha: Number(m[1]), at: Number(m[2]) }));
  const brightest = alphas.reduce((a, b) => (b.alpha > a.alpha ? b : a));
  assert.ok(alphas.length > 100, `${label}: the gradient has many stops, so it is smooth (${alphas.length})`);
  assert.ok(Math.abs(brightest.at - (135 / 480) * 100) < 2, `${label}: the glow is brightest at the peak (${brightest.at}%)`);
  assert.ok(alphas[0].alpha < brightest.alpha / 2 && alphas[alphas.length - 1].alpha < brightest.alpha / 2, `${label}: quiet ends are fainter than the peak`);
  assert.ok(alphas[0].alpha > 0, `${label}: the quiet track is still visible`);
  // Hovering the track tells the rate at that moment; away from the window it says nothing is happening.
  assert.match(await ui.glowTooltipAt(page, 135 / 480), /^Contact window: (4\d(\.\d+)?|48) passes per hour$/, `${label}: the tooltip gives the rate at the hovered time`);
  assert.match(await ui.glowTooltipAt(page, 0.02), /^No activity here\. .*peak 48 passes per hour/, `${label}: the tooltip away from the window says so and names the peak`);
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
  // Was: a click along the band seeks to that point and opens the window details. Now the track is the slider: seeking inside the window lands there, and the window's details open from its peak mark / Events list (above).
  await seekTo((30 + 180 * 0.25) / 480);
  await page.waitForTimeout(200);
  const clicked = Date.parse(await ui.clockIso(page));
  const { min: lo, max: hi } = await ui.seekRange(page);
  assert.ok(Math.abs((clicked - lo) / (hi - lo) - (30 + 180 * 0.25) / 480) < 0.02, `${label}: seeking inside the window lands at that point`);
  await ui.goToNamedWindowPeak(page, "Contact window");
  await ui.waitForInfo(page);
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
  // Without a composition (data-bodies is empty; it replaces the retired data-earth-moon flag) the canvas still mounts and the marker is still available.
  await page.goto(`${base}?experience=synthetic-bare`);
  await page.waitForSelector("canvas");
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-bodies"), "");
  assert.equal(await ui.bodyOptionCount(page, "survey-marker"), 1);
  await ui.pickBody(page, "survey-marker");
  await ui.chooseCamera(page, "follow-marker");
  await page.waitForTimeout(1500);
  await page.goto(`${base}?experience=synthetic`);
  await page.waitForSelector("canvas");
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-bodies"), "earth,moon");
  // Apollo stays the default.
  await page.goto(base);
  await page.waitForSelector("canvas");
  assert.equal(await ui.bodyOptionCount(page, "columbia"), 1);
  assert.equal(await ui.bodyOptionCount(page, "survey-marker"), 0);
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-bodies"), "earth,moon");
  // T-086: Apollo has no rate, so the same glow draws evenly (the plain track is gone). Scenario map: "no activity glow, the plain track" -> one glow, all stops one
  // brightness, no text equivalent and no tooltip (nothing to report); "scrubber height unchanged" -> kept; steady brightness is a live setting.
  assert.equal(await ui.glowCount(page), 1, "Apollo: the standard glow is drawn");
  assert.equal(await ui.glowText(page), null, "Apollo: no activity to describe, so no text equivalent");
  assert.equal(await ui.glowTooltipAt(page, 0.5), null, "Apollo: no activity tooltip");
  const evenAlphas = async (part) => [...(await ui.glowGradients(page))[part].matchAll(/rgba\([^)]*, ([\d.]+)\) /g)].map((m) => Number(m[1]));
  const ahead = await evenAlphas("ahead");
  assert.ok(ahead.length >= 2 && ahead.every((a) => a === ahead[0]) && ahead[0] > 0, `Apollo: the glow is even (${ahead.join(",")})`);
  await ui.openDeveloper(page);
  await ui.dragSlider(page, "glow-steady", 0.8);
  assert.ok((await evenAlphas("ahead"))[0] >= 0.79, "Apollo: the steady brightness setting changes the glow live");
  await ui.closeDeveloper(page);
  assert.ok((await ui.windowParts(page).scrubber.boundingBox()).height < 50, "Apollo: scrubber height unchanged");
} finally {
  await browser.close();
}
console.log(JSON.stringify({ errors }, null, 2));
if (errors.length > 0) process.exit(1);
