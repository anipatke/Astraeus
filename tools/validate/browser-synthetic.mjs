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

try {
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
