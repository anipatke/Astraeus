// Before/after screenshots for the sky picture source (I-026): the same views with ?skymap=eso (before) and ?skymap=nasa (after).
//   ASTRAEUS_URL=http://localhost:5198/app.html PLAYWRIGHT_CORE=<path> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-sky-map.mjs
// Views: the Perseids overview (?milkyway=on) and a patch toward Sagittarius (RA 270, Dec -28) at device pixel ratio 2, cropped to the clear middle of the window.
// Asserts the picture source the page reports (data-sky-picture-source) and zero console errors; writes results.json beside the images.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
assert(outDir, "set ASTRAEUS_EVIDENCE_DIR to a new directory");
mkdirSync(outDir, { recursive: true });
const FOCUS = process.env.ASTRAEUS_FOCUS ?? "sun";
const DISTANCE = process.env.ASTRAEUS_DISTANCE ?? "1e8"; // any large distance: the sky is at infinity, so only the orientation matters

// Camera at offset -D from its focus looks along D (render frame: x, z, -y of EQJ); azimuth about +Y up, elevation above the XZ plane.
const lookAt = (raDeg, decDeg) => {
  const r = Math.PI / 180;
  const e = [Math.cos(decDeg * r) * Math.cos(raDeg * r), Math.cos(decDeg * r) * Math.sin(raDeg * r), Math.sin(decDeg * r)];
  const d = [e[0], e[2], -e[1]];
  const o = d.map((x) => -x);
  return { az: ((Math.atan2(o[0], o[2]) / r) + 360) % 360, el: Math.asin(o[1]) / r };
};
const sgr = lookAt(270, -28);
const VIEWS = [
  ["perseids-overview", "experience=shower-perseids&milkyway=on", 1, null],
  ["sagittarius-patch", `experience=shower-perseids&milkyway=on&up=equatorial&view=${FOCUS},${sgr.az.toFixed(2)},${sgr.el.toFixed(2)},${DISTANCE}`, 2, { x: 190, y: 135, width: 900, height: 400 }],
];
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = { base, views: {} };
for (const source of ["eso", "nasa"]) {
  for (const [name, query, dpr, crop] of VIEWS) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: dpr });
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
    await page.goto(`${base}?${query}&skymap=${source}`);
    await page.waitForSelector("canvas");
    await page.waitForFunction(() => document.querySelector("canvas")?.dataset.skyPictureSource !== undefined && document.querySelector("canvas").dataset.skyPictureSource !== "none", null, { timeout: 60000 });
    await page.waitForTimeout(6000); // textures decode and upload
    const reported = await page.evaluate(() => document.querySelector("canvas").dataset.skyPictureSource);
    const file = `${name}-${source}.png`;
    await page.screenshot({ path: join(outDir, file), ...(crop ? { clip: crop } : {}) }); // the crop sits between the top bar and the time panel
    results.views[`${name}-${source}`] = { requested: source, reported, file, devicePixelRatio: dpr, crop: crop ?? null };
    assert.equal(reported, source, `${name}: asked for ${source}, page drew ${reported}`);
    await page.close();
  }
}
await browser.close();
results.consoleErrors = errors;
writeFileSync(join(outDir, "browser-sky-map-results.json"), `${JSON.stringify(results, null, 2)}\n`);
assert.deepEqual(errors, [], "no console errors");
console.log("browser-sky-map: ok", Object.keys(results.views).join(", "));
