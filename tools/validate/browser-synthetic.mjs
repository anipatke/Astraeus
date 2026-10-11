// Browser smoke for the made-up experience. Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-synthetic.mjs
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/";
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
  assert.equal(await page.locator(".timeline-window-curve path").count(), 1, `${label}: rate curve`);
  assert.equal(await page.locator(".timeline-window-peak").count(), 1, `${label}: peak marker`);
  assert.equal(await page.locator(".timeline-window-current").count(), 0, `${label}: no Inside line before the window`);
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
  // Without the Earth–Moon layer the canvas still mounts and the marker is still available.
  await page.goto(`${base}?experience=synthetic-bare`);
  await page.waitForSelector("canvas");
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-earth-moon"), "false");
  assert.equal(await page.locator('option[value="survey-marker"]').count(), 1);
  await page.getByLabel("Select object").selectOption("survey-marker");
  await page.getByRole("button", { name: "Follow marker", exact: true }).click();
  await page.waitForTimeout(1500);
  if (outDir) await page.screenshot({ path: `${outDir}/synthetic-bare.png` });
  await page.goto(`${base}?experience=synthetic`);
  await page.waitForSelector("canvas");
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-earth-moon"), "true");
  // Apollo stays the default.
  await page.goto(base);
  await page.waitForSelector("canvas");
  assert.equal(await page.locator('option[value="columbia"]').count(), 1);
  assert.equal(await page.locator('option[value="survey-marker"]').count(), 0);
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-earth-moon"), "true");
} finally {
  await browser.close();
}
console.log(JSON.stringify({ errors }, null, 2));
if (errors.length > 0) process.exit(1);
