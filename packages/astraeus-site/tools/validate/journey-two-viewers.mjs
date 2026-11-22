// Journey "Two viewers" (O-092 T-427), a step of `npm run check:browser` (full tier): ?experience=synthetic-two-viewers, two viewers of one made-up scene on one page (dev server only), at 1280x720 and at 375x667.
// Both canvases sit inside the window without crossing and both draw; taking the first viewer down leaves exactly one canvas, still drawing, with no console error or WebGL warning; the second survives a lost and restored
// graphics context (frames drawn advance again after `webglcontextrestored`); taking the second down leaves no canvas. Everything goes through driver.mjs, the viewers' handles and the canvases' own data- readouts; no screenshot is taken.
// Alone: ASTRAEUS_URL=<app.html url> ASTRAEUS_EVIDENCE_DIR=<new dir> node tools/validate/journey-two-viewers.mjs
import assert from "node:assert/strict";
import * as ui from "./driver.mjs";
import { appUrl, checkScript } from "./harness.mjs";

const SIZES = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "phone", width: 375, height: 667, isMobile: true, hasTouch: true },
];
const crosses = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

await checkScript({ name: "journey-two-viewers", viewports: SIZES }, async (page, { name, viewport }) => {
  const warnings = [];
  page.on("console", (message) => {
    // The software renderer's own performance notes ("GPU stall due to ReadPixels") are not the page's doing; every other WebGL or context warning counts.
    if (
      message.type() === "warning" &&
      /webgl|context/i.test(message.text()) &&
      !/Driver Message \(OpenGL, Performance/.test(message.text())
    )
      warnings.push(message.text());
  });
  await page.goto(appUrl("experience=synthetic-two-viewers"));
  await page.waitForFunction(
    () => window.astraeusHost?.playing !== undefined && window.astraeusSecondHost?.playing !== undefined,
    null,
    { timeout: 60000 },
  );
  await ui.setViewerPlaying(page, "first", true);
  await ui.setViewerPlaying(page, "second", true);

  // Scenario 1: two canvases, inside the window, not crossing, both drawing.
  assert.equal(await ui.canvasCount(page), 2, `${name}: two canvases are drawn`);
  const [one, two] = await ui.canvasBoxes(page);
  for (const [label, box] of [
    ["first", one],
    ["second", two],
  ]) {
    assert.ok(
      box.width > 0 &&
        box.height > 0 &&
        box.x >= 0 &&
        box.y >= 0 &&
        box.x + box.width <= viewport.width &&
        box.y + box.height <= viewport.height,
      `${name}: the ${label} canvas is inside the window (${JSON.stringify(box)})`,
    );
  }
  assert.ok(!crosses(one, two), `${name}: the two canvases do not cross (${JSON.stringify([one, two])})`);
  await ui.waitForMoreFramesOf(page, 0, await ui.framesDrawnOf(page, 0));
  await ui.waitForMoreFramesOf(page, 1, await ui.framesDrawnOf(page, 1));

  // Scenario 2: the first viewer comes down; the second keeps drawing, quietly.
  await ui.unmountViewer(page, "first");
  await ui.waitUntil(
    page,
    () => ui.canvasCount(page),
    (count) => count === 1,
    {
      timeout: 3000,
      what: "the page's canvas count after the first viewer is taken down",
    },
  );
  await ui.waitForMoreFramesOf(page, 0, await ui.framesDrawnOf(page, 0));
  assert.deepEqual(warnings, [], `${name}: no WebGL warning after the first viewer is taken down`);

  // Scenario 3: the second survives a lost and restored graphics context.
  const heard = await ui.loseAndRestoreContext(page, 0);
  assert.deepEqual(heard, { lost: true, restored: true }, `${name}: the canvas heard the context lost and restored`);
  await ui.waitForMoreFramesOf(page, 0, await ui.framesDrawnOf(page, 0));

  assert.deepEqual(warnings, [], `${name}: no WebGL warning across the lost and restored context`);

  // Scenario 4: the second comes down; nothing is left.
  await ui.unmountViewer(page, "second");
  // The viewer leaves the page on React's own schedule, so wait for the canvas to go, then a moment for anything its taking-down still reports.
  await ui.waitUntil(
    page,
    () => ui.canvasCount(page),
    (count) => count === 0,
    {
      timeout: 3000,
      what: "the page's canvas count after the second viewer is taken down",
    },
  );
  await page.waitForTimeout(500);
  assert.deepEqual(warnings, [], `${name}: no WebGL warning during the whole run`);
});
