// Browser smoke for the made-up experience. Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-synthetic.mjs
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

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
  await page.getByRole("button", { name: "Pause playback" }).click();
  const band = page.locator(".timeline-window");
  assert.equal(await band.count(), 1, `${label}: one window band`);
  assert.ok((await band.boundingBox()).width > 0, `${label}: band has width`);
  assert.equal(await page.locator(".timeline-window-line").count(), 1, `${label}: rate curve line`);
  assert.equal(await page.locator(".timeline-window-area").count(), 1, `${label}: rate curve filled area`);
  assert.equal(await page.locator(".timeline-window-peak").count(), 1, `${label}: peak marker`);
  assert.equal(await page.locator(".timeline-window-current").count(), 0, `${label}: no Inside line before the window`);
  // I-019: band, curve and peak are one linked shape, together on one side of the slider.
  const box = (selector) => page.locator(selector).boundingBox();
  const [strip, slider, curve, peak, bandBox] = await Promise.all([box(".timeline-windows"), box("input[aria-label='Seek timeline']"), box(".timeline-window-curve"), box(".timeline-window-peak"), band.boundingBox()]);
  assert.ok(strip.y + strip.height <= slider.y + 1, `${label}: window strip sits above the slider, not split by it`);
  assert.ok(curve.y >= strip.y - 1 && curve.y + curve.height <= strip.y + strip.height + 1, `${label}: curve inside the strip`);
  assert.ok(peak.x + peak.width / 2 >= bandBox.x && peak.x + peak.width / 2 <= bandBox.x + bandBox.width, `${label}: peak sits inside the band`);
  assert.ok(curve.height >= 30, `${label}: curve height ${curve.height} shows the rise and fall`);
  const touchMin = size.width < 700 ? 44 : 28;
  assert.ok(bandBox.height >= touchMin && peak.width >= touchMin, `${label}: window targets at least ${touchMin}px (band h ${bandBox.height}, peak w ${peak.width})`);
  const next = page.getByRole("button", { name: /^Next/, exact: false }).first();
  const steps = [];
  for (let i = 0; i < 6 && !(await next.isDisabled()); i += 1) {
    steps.push(await next.getAttribute("aria-label"));
    await next.click();
    await page.waitForTimeout(150);
    const time = await page.locator(".timeline-time").innerText();
    steps.push(time);
  }
  assert.ok(steps.some((step) => /opens/i.test(step)), `${label}: a stop at the window start`);
  assert.ok(steps.some((step) => /peaks/i.test(step)), `${label}: a stop at the peak`);
  assert.ok(steps.some((step) => /closes/i.test(step)), `${label}: a stop at the window end`);
  // Peak: Inside line and the first source wording.
  await page.getByRole("button", { name: "Go to peak of Contact window" }).click();
  await page.waitForTimeout(200);
  const inside = await page.locator(".timeline-window-current").innerText();
  assert.match(inside, /Inside:\s*Contact window/);
  assert.match(inside, /48 passes per hour/);
  // Source wording changes across the midpoint.
  const sourceText = async () => {
    if ((await page.locator("#info-panel").count()) === 0) {
      await page.getByRole("button", { name: "Information about Contact window" }).click();
      await page.waitForSelector("#info-panel");
    }
    // The detail is collapsed behind the badge, so read its text rather than what is visible.
    return page.locator("#info-panel .provenance-detail").textContent();
  };
  await page.locator("input[aria-label='Seek timeline']").focus();
  const seekTo = async (fraction) => page.evaluate((f) => {
    const input = document.querySelector("input[aria-label='Seek timeline']");
    const min = Number(input.min), max = Number(input.max);
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, String(min + (max - min) * f));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, fraction);
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
  await page.getByLabel("Select object").selectOption("survey-marker");
  await page.waitForTimeout(200);
  assert.match(await page.locator("#info-panel").innerText(), /Contact rate/);
  assert.match(await page.locator("#info-panel").innerText(), /passes per hour/);
  await seekTo(0);
  await page.waitForTimeout(200);
  assert.match(await page.locator("#info-panel").innerText(), /outside the contact window/);
  // A click along the band seeks to that point (not the start) and opens the window details.
  await page.mouse.click(bandBox.x + bandBox.width * 0.25, bandBox.y + bandBox.height * 0.4);
  await page.waitForTimeout(200);
  const clicked = Date.parse(await page.locator(".timeline-time").getAttribute("datetime"));
  const lo = Number(await page.locator("input[aria-label='Seek timeline']").getAttribute("min"));
  const hi = Number(await page.locator("input[aria-label='Seek timeline']").getAttribute("max"));
  assert.ok(Math.abs((clicked - lo) / (hi - lo) - (30 + 180 * 0.25) / 480) < 0.02, `${label}: band click seeks to the clicked point`);
  await page.waitForSelector("#info-panel");
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
  await page.getByRole("region", { name: "Timeline controls" }).waitFor();
  assert.equal(await page.locator('option[value="survey-marker"]').count(), 1);
  assert.equal(await page.locator('option[value="columbia"]').count(), 0);
  await page.getByRole("button", { name: "Pause playback" }).click();
  await page.locator(".timeline-event-list summary").click();
  assert.equal(await page.locator(".timeline-event-list li button").count(), 2);
  assert.ok((await page.locator(".timeline-event-list").innerText()).includes("Marker starts its loop"));
  await page.getByLabel("Select object").selectOption("survey-marker");
  await page.getByRole("button", { name: "Focus marker", exact: true }).click();
  await page.getByRole("button", { name: "Follow marker", exact: true }).click();
  await page.waitForTimeout(1500);
  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    await page.screenshot({ path: `${outDir}/synthetic.png` });
  }
  // Without a composition (data-bodies is empty; it replaces the retired data-earth-moon flag) the canvas still mounts and the marker is still available.
  await page.goto(`${base}?experience=synthetic-bare`);
  await page.waitForSelector("canvas");
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-bodies"), "");
  assert.equal(await page.locator('option[value="survey-marker"]').count(), 1);
  await page.getByLabel("Select object").selectOption("survey-marker");
  await page.getByRole("button", { name: "Follow marker", exact: true }).click();
  await page.waitForTimeout(1500);
  if (outDir) await page.screenshot({ path: `${outDir}/synthetic-bare.png` });
  await page.goto(`${base}?experience=synthetic`);
  await page.waitForSelector("canvas");
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-bodies"), "earth,moon");
  // Apollo stays the default.
  await page.goto(base);
  await page.waitForSelector("canvas");
  assert.equal(await page.locator('option[value="columbia"]').count(), 1);
  assert.equal(await page.locator('option[value="survey-marker"]').count(), 0);
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-bodies"), "earth,moon");
  // Apollo has no windows, so no window strip is drawn and the timeline is as before.
  assert.equal(await page.locator(".timeline-windows").count(), 0, "Apollo: no window strip");
  assert.equal(await page.locator(".timeline-window").count(), 0, "Apollo: no window band");
  assert.ok((await page.locator(".timeline-scrubber").boundingBox()).height < 50, "Apollo: scrubber height unchanged");
} finally {
  await browser.close();
}
console.log(JSON.stringify({ errors }, null, 2));
if (errors.length > 0) process.exit(1);
