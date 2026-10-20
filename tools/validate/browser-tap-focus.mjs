// Browser check for tap-to-focus (O-022 T-109): a tap or click on a body or its name tag focuses it and the picker shows it; a drag or pinch selects nothing;
// empty space and non-targets do nothing; the information sheet stays shut; a mouse hover sets the scene's hover readout and the pointer shape, touch does not.
// Run the app on port 5199, then: PLAYWRIGHT_CORE=<path to playwright-core> node tools/validate/browser-tap-focus.mjs
//
// The made-up marker scene (moved off the demos by O-034 T-111) at 1280x720 with a mouse and at 375x667 with touch. Everything goes through the shared driver and the scene's own
// readouts (`data-body-screen`, `data-pick-target`, `data-pick-hover`, `[data-label-id]`, the Object list); no pictures. Targets are found from the readouts, not
// hard-coded, so the check follows whatever the demo shows. The contract (hit tolerance, nearest wins, the tap rule) is proved by tests/scenePicking.test.ts.
import assert from "node:assert/strict";
import * as ui from "./driver.mjs";

import { pw } from "./playwright.mjs";
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = {};

const DEMOS = [
  { id: "made-up", query: "?experience=synthetic" },
];
const SIZES = [
  { id: "laptop", viewport: { width: 1280, height: 720 }, touch: false },
  { id: "phone", viewport: { width: 375, height: 667 }, touch: true },
];

async function run(demo, size) {
  const name = `${demo.id} ${size.id}`;
  const context = await browser.newContext({ viewport: size.viewport, ...(size.touch ? { isMobile: true, hasTouch: true } : {}) });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(`${name} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${name} console: ${message.text()}`); });
  const notes = {};
  results[name] = notes;
  /** Nothing changed since `before`: the picker, the last tap target, and the information sheet. */
  const unchanged = async (before, what) => {
    await page.waitForTimeout(500);
    assert.equal(await ui.pickedBody(page), before.picked, `${name}: ${what} leaves the picker alone`);
    assert.equal(await ui.pickTarget(page), before.target, `${name}: ${what} reports no tap target`);
    assert.equal(await ui.infoOpen(page), false, `${name}: ${what} leaves the information sheet shut`);
  };
  /** Bodies a tap can reach; when a story marker or panel covers everything in the first view (Apollo on a phone: Earth is a few pixels wide with markers beside it), reloads with the camera close in on the first listed object. */
  const reachableBodies = async () => {
    let found = await ui.tappableBodies(page);
    if (found.length > 0) return found;
    const first = (await ui.pickableBodies(page))[0]?.value;
    for (const distance of [12, 6]) {
      await ui.loadAddress(page, `${base}${demo.query}${demo.query === "" ? "?" : "&"}view=${first},30,30,${distance}`);
      await ui.waitForShell(page);
      await ui.ensurePaused(page);
      await ui.waitForBodyPicker(page);
      await page.waitForTimeout(2500);
      found = await ui.tappableBodies(page);
      if (found.length > 0) { notes.closeView = `${first} at ${distance}`; return found; }
    }
    return found;
  };
  const snapshot = async () => ({ picked: await ui.pickedBody(page), target: await ui.pickTarget(page) });
  try {
    await ui.loadAddress(page, `${base}${demo.query}`);
    await ui.waitForShell(page);
    await ui.ensurePaused(page);
    await ui.waitForBodyPicker(page);
    await page.waitForTimeout(1500);
    assert.equal(await ui.scenePointer(page), size.touch ? "touch" : "mouse", `${name}: the page sends the pointer this size is meant to test`);
    assert.equal(await ui.infoOpen(page), false, `${name}: the information sheet starts shut`);

    // Drag and pinch across a body select nothing.
    const dragTargets = await reachableBodies();
    const first = await snapshot();
    assert.ok(dragTargets.length > 0, `${name}: a body in view to drag across`);
    await ui.dragAcross(page, dragTargets[0].id);
    await unchanged(first, `a drag across ${dragTargets[0].id}`);
    notes.drag = dragTargets[0].id;
    if (size.touch) {
      await ui.ensurePaused(page);
      const again = await ui.tappableBodies(page);
      const spot = again[0] ?? dragTargets[0];
      await ui.pinchAt(page, spot.x, spot.y);
      await unchanged(first, "a pinch over a body");
      notes.pinch = true;
    }

    // Empty space does nothing (skipped, and said so, when a crowded view has no free spot).
    const spot = await ui.emptySceneSpot(page);
    notes.emptySpot = spot;
    if (spot !== null) {
      await ui.tapScenePoint(page, spot.x, spot.y);
      await unchanged(first, "a tap on empty space");
    }

    // Hover: a mouse over a body sets the readout and the pointer shape; touch never hovers.
    const reachable = await ui.tappableBodies(page);
    assert.ok(reachable.length > 0, `${name}: a body in view to tap`);
    const picked0 = await ui.pickedBody(page);
    const body = reachable.find((candidate) => candidate.id !== picked0) ?? reachable[0];
    if (!size.touch) {
      await ui.hoverBody(page, body.id);
      await ui.waitForPickHover(page, body.id).catch(async () => { throw new Error(name + ": hovering " + body.id + " at (" + Math.round(body.x) + ", " + Math.round(body.y) + ") reported '" + (await ui.pickHover(page)) + "'"); });
      assert.equal(await ui.sceneCursor(page), "pointer", `${name}: the pointer shows a hand over ${body.id}`);
      await ui.hoverScenePoint(page, spot?.x ?? 2, spot?.y ?? 2);
      await ui.waitForPickHover(page, "");
      assert.equal(await ui.sceneCursor(page), "", `${name}: the pointer is plain off the body`);
      notes.hover = body.id;
    }

    // Tap or click the body: it is focused and the picker names it; the information sheet stays shut.
    await ui.tapBody(page, body.id);
    await ui.waitForPickTarget(page, body.id).catch(() => undefined);
    assert.equal(await ui.pickTarget(page), body.id, `${name}: the scene reports a tap on ${body.id}`);
    await ui.waitForPicked(page, body.id);
    assert.equal(await ui.infoOpen(page), false, `${name}: tapping ${body.id} does not open the information sheet`);
    if (size.touch) assert.equal(await ui.pickHover(page), "", `${name}: touch sets no hover`);
    notes.bodyTap = body.id;

    // Tap or click a name tag: a different object, focused through its tag.
    // The camera is still flying to the tapped body; let it arrive so the tags stop moving and hiding.
    for (let i = 0, last = null; i < 40; i += 1) {
      const now = await ui.bodyScreenPoint(page, body.id);
      if (last !== null && now !== null && Math.hypot(now.x - last.x, now.y - last.y) < 0.5) break;
      last = now;
      await page.waitForTimeout(250);
    }
    const tagIds = await ui.tappableLabelIds(page, [await ui.pickedBody(page)]);
    notes.labels = tagIds;
    // A tag can still hide as the labels make room for each other; try the next one, and fail only when none can be tapped.
    let tag = null;
    for (const candidate of tagIds) {
      try { await ui.tapLabel(page, candidate); tag = candidate; break; } catch (error) { if (!String(error.message).includes("not showing")) throw error; }
    }
    if (tagIds.length > 0) {
      assert.ok(tag !== null, `${name}: one of the name tags ${tagIds.join(", ")} stays showing to tap`);
      await ui.waitForPickTarget(page, tag).catch(() => undefined);
      assert.equal(await ui.pickTarget(page), tag, `${name}: the scene reports a tap on ${tag}'s name tag`);
      await ui.waitForPicked(page, tag);
      assert.equal(await ui.infoOpen(page), false, `${name}: tapping ${tag}'s name tag does not open the information sheet`);
      notes.labelTap = tag;
    }
  } finally {
    await context.close();
  }
}

try {
  for (const demo of DEMOS) for (const size of SIZES) await run(demo, size);
  const skipped = Object.entries(results).filter(([, notes]) => notes.emptySpot === null).map(([name]) => name);
  assert.ok(Object.keys(results).length - skipped.length >= 2, `empty-space taps ran on at least two scene-and-size pairs (skipped: ${skipped.join(", ") || "none"})`);
  const labelRuns = Object.values(results).filter((notes) => notes.labelTap !== undefined).length;
  assert.ok(labelRuns >= 1, `a name tag was tapped on at least one scene-and-size pair (${labelRuns})`);
} finally {
  await browser.close();
}
console.log(JSON.stringify({ results, errors }, null, 2));
if (errors.length > 0) process.exit(1);
