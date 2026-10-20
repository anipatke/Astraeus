// Browser check for the home page's curve-fit section (O-025 T-101, Decision 10): "Photos, or a recipe".
// The section draws Io's orbit twice from the real fitted data (table dots, and fitted pieces), with a time slider, and states the measured sizes.
// For a phone (375 px, touch) and a laptop (1280 px), each also with reduced motion, it asserts:
//   - the section renders: 325 table dots, 2 pieces, the three measured figures, and no error in the console or page;
//   - the slider moves: three positions change the hours, the distance (Io stays 400,000 to 445,000 km from Jupiter's centre) and the recipe marker;
//   - phone first and no collisions: the page never scrolls sideways, nothing reaches past the screen, the slider is at least 44 px tall, text is at least 12 px,
//     the panels are one column on the phone and two on the laptop, no piece of the section overlaps another, and the section does not overlap its neighbours.
//   PLAYWRIGHT_CORE=<path> ASTRAEUS_HOME_URL=<index.html url> [ASTRAEUS_URL=<app.html url on the same server>] node tools/validate/browser-home-curve-fits.mjs
import assert from "node:assert/strict";
import * as ui from "./driver.mjs";

import { pw } from "./playwright.mjs";
const chromium = pw.chromium ?? pw.default.chromium;
const home = process.env.ASTRAEUS_HOME_URL ?? (process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html").replace(/app\.html.*$/, "index.html");
const browser = await chromium.launch();
const errors = [];

const CASES = [
  { name: "phone", viewport: { width: 375, height: 700 }, touch: true, columns: 1 },
  { name: "phone-small", viewport: { width: 320, height: 640 }, touch: true, columns: 1 },
  { name: "laptop", viewport: { width: 1280, height: 800 }, touch: false, columns: 2 },
];

for (const motion of ["no-preference", "reduce"]) {
  for (const c of CASES) {
    const label = `${c.name}/${motion}`;
    const context = await browser.newContext({ viewport: c.viewport, isMobile: c.touch, hasTouch: c.touch, reducedMotion: motion });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(`${label} pageerror: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") errors.push(`${label} console: ${message.text()}`); });
    await ui.openHomeCurveFits(page, home);

    const first = await ui.curveFitReadout(page);
    assert.equal(first.dots, 325, `${label}: table dots drawn`);
    assert.equal(first.pieces, 2, `${label}: pieces drawn`);
    assert.ok(first.sliderMax >= 3000, `${label}: slider spans the window`);
    const seen = [];
    for (const minutes of [0, 1620, 3240]) {
      await ui.curveFitSetMinutes(page, minutes);
      const r = await ui.curveFitReadout(page);
      assert.ok(Math.abs(r.hours - minutes / 60) < 0.02, `${label}: hours follow the slider (${r.hours} for ${minutes} min)`);
      assert.ok(r.km > 400_000 && r.km < 445_000, `${label}: Io's distance ${r.km} km is its orbit's`);
      assert.match(r.text, /^Hour [\d.]+ . Io is [\d,]+ km/, `${label}: readout text`);
      seen.push(r);
    }
    assert.ok(Math.hypot(seen[1].markX - seen[0].markX, seen[1].markY - seen[0].markY) > 20, `${label}: the marker moves with the slider`);

    const layout = await ui.curveFitLayout(page);
    assert.ok(layout.pageScrollWidth <= layout.innerWidth, `${label}: no sideways scroll (${layout.pageScrollWidth} > ${layout.innerWidth})`);
    assert.ok(layout.reach <= 0.5, `${label}: nothing reaches past the screen edge (${layout.reach} px)`);
    assert.ok(layout.sliderHeight >= 44, `${label}: slider target is 44 px (${layout.sliderHeight})`);
    assert.ok(layout.smallestFontPx >= 12, `${label}: smallest text ${layout.smallestFontPx}px`);
    assert.equal(layout.columns, c.columns, `${label}: panel columns`);
    assert.equal(layout.collisions, 0, `${label}: pieces of the section overlap each other`);
    assert.equal(layout.overlapsNeighbours, 0, `${label}: the section overlaps its neighbours`);
    console.log(`${label}: ok (dots ${first.dots}, km ${seen.map((r) => r.km).join("/")}, slider ${layout.sliderHeight}px, smallest text ${layout.smallestFontPx}px)`);
    await context.close();
  }
}
await browser.close();
assert.deepEqual(errors, [], `console or page errors:\n${errors.join("\n")}`);
console.log("zero console errors");
