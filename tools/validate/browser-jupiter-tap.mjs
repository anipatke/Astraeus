// Browser check for a tap on a small outer moon (a body-set dot) in Jupiter-Io (O-022 T-109; split out of browser-tap-focus.mjs by O-034 T-111 because it needs that demo's moons).
// The first tap picks the moon; a listed moon is focused through the picker, an unlisted one keeps the list's choice; the information sheet stays shut.
// npm run check:demo -- jupiter runs this; alone: ASTRAEUS_URL=<app.html url> node tools/validate/browser-jupiter-tap.mjs
import assert from "node:assert/strict";
import * as ui from "./driver.mjs";
import { launchBrowser, openContext, pageIn, watchErrors } from "./harness.mjs";

const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const browser = await launchBrowser();
const errors = [];
const results = {};
const SIZES = [
  { id: "laptop", viewport: { width: 1280, height: 720 }, touch: false },
  { id: "phone", viewport: { width: 375, height: 667 }, touch: true },
];

try {
  for (const size of SIZES) {
    const name = `jupiter-io ${size.id}`;
    const context = await openContext(browser, { viewport: size.viewport, ...(size.touch ? { isMobile: true, hasTouch: true } : {}) });
    const page = await pageIn(context);
    watchErrors(page, errors, name);
    try {
      await ui.loadAddress(page, `${base}?experience=jupiter-io&sky=off&view=jupiter,30,30,6000`);
      await ui.waitForShell(page);
      await ui.ensurePaused(page);
      await ui.waitForBodyPicker(page);
      await page.waitForTimeout(1500);
      const dot = await ui.tappableSetMember(page);
      assert.ok(dot, `${name}: a small moon's dot in view to tap`);
      const before = { picked: await ui.pickedBody(page) };
      await ui.tapScenePoint(page, dot.x, dot.y);
      await page.waitForTimeout(500);
      assert.equal(await ui.pickTarget(page), dot.id, `${name}: the first tap on ${dot.id} picks it`);
      const listed = (await ui.pickableBodies(page)).some((option) => option.value === dot.id);
      if (listed) await ui.waitForPicked(page, dot.id);
      else assert.equal(await ui.pickedBody(page), before.picked, `${name}: ${dot.id} is not in the Object list, so the list keeps its choice`);
      assert.equal(await ui.infoOpen(page), false, `${name}: the small moon's tap does not open the information sheet`);
      results[name] = { setMoon: dot.id, listed };
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ results, errors }, null, 2));
if (errors.length > 0) process.exit(1);
