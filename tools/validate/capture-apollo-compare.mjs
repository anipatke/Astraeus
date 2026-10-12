// Before/after screenshots for owner look: Apollo at the six Spike 02 mission times, True and Readable, desktop and phone,
// plus the made-up belt. Pauses the clock so two runs of one tree differ only by software-GL noise.
// ASTRAEUS_URL=http://localhost:5199/ ASTRAEUS_EVIDENCE_DIR=<fresh dir> PLAYWRIGHT_CORE=<path> node tools/validate/capture-apollo-compare.mjs
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/";
const out = process.env.ASTRAEUS_EVIDENCE_DIR;
assert.ok(out, "ASTRAEUS_EVIDENCE_DIR is required: write to a fresh directory");
mkdirSync(out, { recursive: true });

const PHASES = [
  { id: "earth-orbit", utc: "1969-07-16T14:30:00Z", object: "columbia", camera: "Follow Columbia (CSM)" },
  { id: "translunar", utc: "1969-07-18T12:00:00Z", object: "columbia", camera: "Follow Columbia (CSM)" },
  { id: "lunar-orbit-columbia", utc: "1969-07-21T06:00:00Z", object: "columbia", camera: "Follow Columbia (CSM)" },
  { id: "lunar-surface-eagle", utc: "1969-07-21T06:00:00Z", object: "eagle", camera: "Follow Eagle (LM)" },
  { id: "return", utc: "1969-07-23T12:00:00Z", object: "columbia", camera: "Follow Columbia (CSM)" },
  { id: "entry", utc: "1969-07-24T16:30:00Z", object: "columbia", camera: "Follow Columbia (CSM)" },
];
const VIEWPORTS = [["desktop", 1280, 800], ["phone", 390, 844]];
const SCALES = ["True", "Readable"];

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const written = [];
try {
  for (const [vp, width, height] of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on("pageerror", (error) => errors.push(`${vp} pageerror: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") errors.push(`${vp} console: ${message.text()}`); });
    const pause = async () => {
      const button = page.getByRole("button", { name: "Pause playback", exact: true });
      if (await button.count()) await button.click();
    };
    const seek = async (isoUtc) => {
      await page.locator('input[aria-label="Seek timeline"]').evaluate((input, time) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(time));
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }, Date.parse(isoUtc));
      await page.waitForTimeout(300);
    };
    const closeInfo = async () => { const c = page.locator("#info-panel .info-panel-close"); if (await c.count()) await c.click(); };
    const pick = async (object, preset) => {
      await page.getByLabel("Select object").selectOption(object);
      await closeInfo();
      const compact = page.locator(".object-camera-picker");
      if (await compact.isVisible()) {
        const value = await compact.evaluate((select, text) => [...select.options].find((o) => o.textContent.trim() === text)?.value ?? null, preset);
        assert.ok(value, `${vp}: preset ${preset} exists`);
        await compact.selectOption(value);
      } else {
        await page.getByRole("button", { name: preset, exact: true }).click();
      }
      await closeInfo();
      await page.waitForTimeout(1800);
    };
    // Full page, and the scene alone (controls hidden) so a change to a toolbar cannot hide or fake a change in the picture.
    const shot = async (name) => {
      const path = `${out}/${name}.png`;
      await page.screenshot({ path });
      written.push(path);
      const chrome = ".shell-toolbar, .timeline-bar, .developer-mode-toggle, #info-panel";
      await page.evaluate((selector) => { for (const el of document.querySelectorAll(selector)) el.style.visibility = "hidden"; }, chrome);
      const scenePath = `${out}/${name}-scene.png`;
      await page.screenshot({ path: scenePath });
      written.push(scenePath);
      await page.evaluate((selector) => { for (const el of document.querySelectorAll(selector)) el.style.visibility = ""; }, chrome);
    };

    // Apollo
    await page.goto(base);
    await page.waitForSelector("canvas");
    await page.getByRole("region", { name: "Timeline controls" }).waitFor();
    await pause();
    for (const scale of SCALES) {
      await page.getByRole("button", { name: scale, exact: true }).click();
      for (const phase of PHASES) {
        await seek(phase.utc);
        await pick("earth", "Earth–Moon overview");
        await shot(`apollo-${vp}-${scale.toLowerCase()}-${phase.id}-overview`);
        await pick(phase.object, phase.camera);
        await shot(`apollo-${vp}-${scale.toLowerCase()}-${phase.id}-follow`);
      }
      await seek("1969-07-20T20:17:00Z");
      await pick("moon", "Focus Moon");
      await shot(`apollo-${vp}-${scale.toLowerCase()}-moon-focus`);
      await pick("earth", "Focus Earth");
      await shot(`apollo-${vp}-${scale.toLowerCase()}-earth-focus`);
    }

    // Belt
    await page.goto(`${base}?experience=synthetic-belt`);
    await page.waitForSelector("canvas");
    await page.getByRole("region", { name: "Timeline controls" }).waitFor();
    await pause();
    for (const scale of SCALES) {
      await page.getByRole("button", { name: scale, exact: true }).click();
      for (const [when, iso] of [["start", "2030-01-01T01:00:00Z"], ["spring", "2030-04-01T00:00:00Z"]]) {
        await seek(iso);
        await pick("sun", "Sun view");
        await shot(`belt-${vp}-${scale.toLowerCase()}-${when}-sun-view`);
        await pick("dust-belt", "Focus belt");
        await shot(`belt-${vp}-${scale.toLowerCase()}-${when}-focus-belt`);
        await pick("sun", "Overview");
        await shot(`belt-${vp}-${scale.toLowerCase()}-${when}-overview`);
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ count: written.length, errors }, null, 2));
if (errors.length > 0) process.exit(1);
