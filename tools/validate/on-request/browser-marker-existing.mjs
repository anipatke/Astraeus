// What the marker rule changes in the experiences that already existed (T-054): for each, the default view at True scale and at the other
// scales offered, with the rule on (the default) and off (?markerpx=0, which is how they looked before). Records which bodies are drawn
// as markers. It asserts only that every view mounts and logs no console error.
// Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/on-request/browser-marker-existing.mjs
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chooseScale, offersScale } from "../driver.mjs";
import * as ui from "../driver.mjs";

import { pw } from "../playwright.mjs";
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const result = {};
const experiences = [["apollo", ""], ["jupiter-io", "experience=jupiter-io"], ["perseids", "experience=showers"]];
try {
  for (const [name, query] of experiences) {
    for (const [rule, extra] of [["rule-on", ""], ["rule-off", "markerpx=0"]]) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      page.on("pageerror", (error) => errors.push(`pageerror(${name}/${rule}): ${error.message}`));
      page.on("console", (message) => { if (message.type() === "error") errors.push(`console(${name}/${rule}): ${message.text()}`); });
      try {
        await page.goto(`${base}?${[query, extra, "sky=off"].filter(Boolean).join("&")}`);
        await page.waitForSelector("canvas");
        await ui.waitForShell(page);
        await ui.pausePlayback(page);
        // The default view when the experience offers no Overview preset (Apollo's presets are its own).
        if (await ui.cameraOffered(page, "overview")) await ui.chooseCamera(page, "overview");
        await page.waitForTimeout(2500);
        const scales = {};
        for (const scale of ["True", "Readable", "Solar system"]) {
          if (!(await offersScale(page, scale))) continue;
          await chooseScale(page, scale);
          if (await ui.cameraOffered(page, "overview")) await ui.chooseCamera(page, "overview");
          await page.waitForTimeout(2500);
          scales[scale] = {
            markerBodies: await page.locator("canvas").first().getAttribute("data-marker-bodies"),
            threshold: await page.locator("canvas").first().getAttribute("data-marker-px"),
            bodies: await page.getByTestId("earth-moon-canvas").getAttribute("data-bodies"),
          };
        }
        result[`${name}/${rule}`] = scales;
        assert.ok(Object.keys(scales).length > 0, `${name}: at least one scale is offered`);
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}
result.errors = errors;
const text = JSON.stringify(result, null, 2);
if (outDir) writeFileSync(`${outDir}/marker-existing.json`, `${text}\n`);
console.log(text);
if (errors.length > 0) process.exit(1);
