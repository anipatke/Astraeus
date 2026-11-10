// Journey "Look out" (O-064 T-293), a step of `npm run check:browser`: the made-up look-out scene (`?experience=synthetic-lookout`, dev server only: the Sun, Earth and Mars) at 1280x720 and 375x667 with touch.
// The scene opens with the camera at Earth's centre looking out (the Developer drawer's view line is a sky view of Earth, the stood-in Earth is not drawn); the camera menu offers Look out from Earth and from Mars, clear of
// the other controls; O-066 T-302: figure taps and a three-step sky story (see checkFigureTaps and checkSkyStory); the Mars entry moves the sky view to Mars, and Focus returns to the orbit camera; a wheel turn changes the field of view (desktop). Everything goes through driver.mjs; no screenshot is taken.
// Alone: ASTRAEUS_URL=<app.html url> ASTRAEUS_EVIDENCE_DIR=<new dir> node tools/validate/journey-look-out.mjs
import assert from "node:assert/strict";
import * as ui from "./driver.mjs";
import { appUrl, checkScript } from "./harness.mjs";

const SIZES = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "phone", width: 375, height: 667, isMobile: true, hasTouch: true },
];

/** O-065 T-298: the made-up figures (Lantern, Kettle), the Lantern field outline and the four switches. The outline starts on, the circles off, the figures are hidden until traced (their switch is checked on a trace); each switch draws its set; the outline label shows and no labels overlap. */
async function checkSkySwitches(page, name) {
  await ui.waitForSkyLines(page, { present: ["sky-boundaries"], absent: ["sky-figures", "sky-ecliptic", "sky-celestial-equator", "sky-trace:lantern", "sky-trace:kettle"] });
  const places = await ui.displaySwitchPlaces(page);
  assert.ok(places.topBar.includes("skyFigures"), `${name}: the figures switch is in the top bar (${JSON.stringify(places)})`);
  for (const id of ["skyBoundaries", "ecliptic", "celestialEquator"]) assert.ok(places.panel.includes(id), `${name}: the ${id} switch is in the switch panel (${JSON.stringify(places)})`);
  const switchLines = [["skyBoundaries", "sky-boundaries"], ["ecliptic", "sky-ecliptic"], ["celestialEquator", "sky-celestial-equator"]];
  for (const [id, lines] of switchLines) {
    const wasOn = await ui.displaySwitchOn(page, id);
    await ui.toggleDisplaySwitch(page, id);
    await ui.waitForSkyLines(page, wasOn ? { absent: [lines] } : { present: [lines] });
    await ui.toggleDisplaySwitch(page, id);
    await ui.waitForSkyLines(page, wasOn ? { present: [lines] } : { absent: [lines] });
  }
  const skyNamed = await ui.shownSceneLabelIds(page);
  assert.ok(skyNamed.includes("lantern-field"), `${name}: the outline label shows (shown: ${skyNamed.join(", ")})`);
  for (const id of ["lantern", "kettle"]) assert.ok(!skyNamed.includes(id), `${name}: the label ${id} is not shown before its figure is traced (shown: ${skyNamed.join(", ")})`);
  const collisions = await ui.overlappingSceneLabels(page);
  assert.deepEqual(collisions, [], `${name}: no two labels overlap (${JSON.stringify(collisions)})`);
  return ui.skyLinesShown(page);
}

/** The trace control is the site's, outside the viewer: it offers the two figures (not the outline), sits clear of the other controls, and each end state is reached. */
async function checkSkyTrace(page, name) {
  const options = await ui.skyTraceOptions(page);
  assert.deepEqual(options?.map((option) => option.value), ["lantern", "kettle"], `${name}: the trace control offers the two figures (${JSON.stringify(options)})`);
  const traceFit = await ui.skyTraceFit(page);
  assert.ok(traceFit.insideWindow && traceFit.overlaps.length === 0, `${name}: the trace control is inside the window and clear of the other controls (overlaps: ${traceFit.overlaps.join(", ") || "none"})`);
  assert.ok(traceFit.smallestPx >= (name === "phone" ? 44 : 24), `${name}: the trace buttons are big enough to press (${traceFit.smallestPx} px)`);
  await ui.setSkyTraceOpen(page, true);
  const openFit = await ui.skyTraceFit(page);
  assert.ok(openFit.insideWindow && openFit.overlaps.filter((other) => other !== "switches").length === 0, `${name}: the open trace control is inside the window and clear of the bar, timeline and cog (overlaps: ${openFit.overlaps.join(", ") || "none"})`);
  assert.ok(openFit.smallestPx >= (name === "phone" ? 44 : 24), `${name}: the open trace buttons are big enough to press (${openFit.smallestPx} px)`);
  for (const id of ["lantern", "kettle"]) {
    await ui.chooseSkyTraceFigure(page, id);
    const lines = `sky-trace:${id}`;
    for (const after of ["stay", "fade", "hide"]) {
      if (after === "hide") {
        // Stay (to be hidden by the Hide button): the trace shows, then the request removes lines and label.
        await ui.pressSkyTrace(page, "stay");
        await ui.waitForSkyLines(page, { present: [lines] });
        await ui.waitForSkyTraceStatus(page, "stay", 8000);
        await ui.pressSkyTrace(page, "hide");
        assert.equal(await ui.skyTraceStatus(page), "hiding", `${name}: pressing Hide starts removing the ${id} trace`);
        await ui.waitForSkyTraceStatus(page, "hidden", 8000);
        await ui.waitForSkyLines(page, { absent: [lines] });
        await ui.waitForSceneLabel(page, id, false);
        continue;
      }
      await ui.pressSkyTrace(page, after);
      assert.equal(await ui.skyTraceStatus(page), "tracing", `${name}: pressing Trace then ${after} starts a trace of ${id}`);
      await ui.waitForSkyLines(page, { present: [lines] });
      await ui.waitForSceneLabel(page, id, true);
      await ui.waitForSkyTraceStatus(page, after, 8000);
      if (after === "stay") {
        assert.ok((await ui.skyLinesShown(page)).includes(lines) && (await ui.shownSceneLabelIds(page)).includes(id), `${name}: after a stay trace the ${id} lines and label stay`);
        assert.deepEqual(await ui.overlappingSceneLabels(page), [], `${name}: no labels overlap with ${id} shown`);
        await ui.toggleDisplaySwitch(page, "skyFigures"); // the figures switch hides a traced figure's lines and label
        await ui.waitForSkyLines(page, { absent: [lines] });
        await ui.waitForSceneLabel(page, id, false);
        await ui.toggleDisplaySwitch(page, "skyFigures");
        await ui.waitForSkyLines(page, { present: [lines] });
        await ui.waitForSceneLabel(page, id, true);
      } else {
        await ui.waitForSkyLines(page, { absent: [lines] }); // a fade leaves nothing of the figure
        await ui.waitForSceneLabel(page, id, false);
      }
    }
  }
  assert.equal((await ui.overlappingSceneLabels(page)).length, 0, `${name}: no labels overlap after the traces`);
  await ui.setSkyTraceOpen(page, false); // leave the site control closed: the rest of the journey opens the Developer drawer and the menu
}

/** Projects a star-map position to canvas px from a sky reading (north up, east to the left, `fovDeg` the vertical angle); null when behind the camera. */
function projectSky(reading, box, raDeg, decDeg) {
  const rad = Math.PI / 180;
  const unit = (ra, dec) => [Math.cos(dec * rad) * Math.cos(ra * rad), Math.cos(dec * rad) * Math.sin(ra * rad), Math.sin(dec * rad)];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
  const d = unit(reading.raDeg, reading.decDeg);
  const right = norm(cross(d, [0, 0, 1]));
  const up = cross(right, d);
  const p = unit(raDeg, decDeg);
  const depth = dot(p, d);
  if (depth <= 0.05) return null;
  const tan = Math.tan((reading.fovDeg * rad) / 2);
  return { x: box.width / 2 + (dot(p, right) / depth / (tan * (box.width / box.height))) * (box.width / 2), y: box.height / 2 - (dot(p, up) / depth / tan) * (box.height / 2) };
}

/** Loads the scene again: the opening view, the first step open, nothing traced. */
async function reopen(page) {
  await ui.loadAddress(page, appUrl("experience=synthetic-lookout&skyTraceSeconds=0.5"));
  await ui.waitForShell(page);
  await ui.ensurePaused(page);
  await ui.waitForCameraReading(page, (reading) => reading.sky);
}
const sameDirection = (a, b) => Math.abs(a.raDeg - b.raDeg) < 0.6 && Math.abs(a.decDeg - b.decDeg) < 0.6;

/** O-066 T-299 (desktop): a tap inside the outline selects nothing; a tap on its name and a tap near its line each select it and open its card. Runs at the opening view with nothing selected. */
async function checkFigureTaps(page, name) {
  const reading = await ui.cameraReading(page);
  assert.ok(reading.sky, `${name}: the figure taps start in the sky view`);
  const box = await page.locator("canvas").first().boundingBox();
  const before = await ui.selectedObjectValue(page);
  const inside = projectSky(reading, box, 288, -22);
  assert.ok(inside, `${name}: a point inside the outline is in front of the camera`);
  await ui.tapScenePoint(page, inside.x, inside.y);
  await page.waitForTimeout(400);
  assert.equal(await ui.selectedObjectValue(page), before, `${name}: a tap inside the outline selects nothing (was ${before})`);
  assert.equal(await ui.infoOpen(page), false, `${name}: a tap inside the outline opens no card`);
  await ui.tapLabel(page, "lantern-field");
  await ui.waitForPicked(page, "lantern-field");
  await ui.waitForInfo(page, { timeout: 5000 });
  assert.equal(await ui.infoTargetId(page), "lantern-field", `${name}: tapping the outline's name opens its card`);
  assert.match(await ui.infoText(page), /Lantern field/, `${name}: the card names the outline`);
  assert.ok((await ui.skyLinesShown(page)).includes("sky-selected:lantern-field"), `${name}: the selected outline is drawn highlighted`);
  await reopen(page); // a menu pick of a body would focus it, so the opening view comes back by loading the scene again
  const corner = projectSky(reading, box, 291, -24); // on the outline's east side, between its corners
  assert.ok(corner && corner.x > 0 && corner.y > 0 && corner.x < box.width && corner.y < box.height, `${name}: a point on the outline line is in view (${JSON.stringify(corner)})`);
  await ui.tapScenePoint(page, corner.x - 4, corner.y);
  await ui.waitForPicked(page, "lantern-field");
  await ui.waitForInfo(page, { timeout: 5000 });
  assert.equal(await ui.infoTargetId(page), "lantern-field", `${name}: tapping near the outline's line opens its card`);
  await ui.closeInfo(page);
  return { insideTap: inside, lineTap: corner };
}

const panelId = async (page) => (await ui.openStoryPanelIds(page))[0] ?? null;
const pressStep = ui.pressStoryStep;
const stepEnabled = ui.storyStepEnabled;
const waitForStep = (page, id) => ui.waitForOpenStoryPanel(page, id);

/** O-066 T-300 and T-301: the three-step story. The first step is open at the start; Back is off there and Next off on the last; each step's camera reading, selection and trace line set match; leaving a step clears its trace; a step turns the camera from an orbit view too; nothing collides. */
async function checkSkyStory(page, name) {
  assert.equal(await panelId(page), "step-start", `${name}: the first step is open at the start (open: ${JSON.stringify(await ui.openStoryPanelIds(page))})`);
  assert.equal(await stepEnabled(page, "back"), false, `${name}: Back is off on the first step`);
  const fit = async (label) => {
    // A panel's select follows the tap rule: the card opens on a wide screen (beside the panel), not on a phone (it would cover Back and Next).
    const cardOpen = await ui.infoOpen(page);
    if (name === "phone") assert.equal(cardOpen, false, `${name}: ${label}: a step's select opens no card sheet`);
    else if (label !== "step 1") assert.equal(cardOpen, true, `${name}: ${label}: a step's select opens the card`);
    if (cardOpen) {
      const [card, story] = [await ui.infoPanel(page).boundingBox(), await ui.storyPanelBox(page)];
      assert.ok(card !== null && story !== null && !(card.x < story.x + story.width && story.x < card.x + card.width && card.y < story.y + story.height && story.y < card.y + card.height), `${name}: ${label}: the card and the story panel do not overlap (card ${JSON.stringify(card)}, story ${JSON.stringify(story)})`);
    }
    for (const which of ["back", "next"]) assert.equal(await ui.storyStepReachable(page, which), true, `${name}: ${label}: ${which} is not covered by anything`);
    assert.deepEqual(await ui.overlappingSceneLabels(page), [], `${name}: ${label}: no two labels overlap`);
    const traceFit = await ui.skyTraceFit(page);
    assert.ok(traceFit.insideWindow && traceFit.overlaps.length === 0, `${name}: ${label}: the trace control is clear of the story panel, the card and the other controls (overlaps: ${traceFit.overlaps.join(", ") || "none"}; story ${JSON.stringify(await ui.storyPanelBox(page))}, control ${JSON.stringify(await page.locator("[data-site-sky-trace]").boundingBox())})`);
    const box = await ui.storyPanelBox(page);
    const view = page.viewportSize();
    assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= view.width + 0.5 && box.y + box.height <= view.height + 0.5, `${name}: ${label}: the story panel is inside the window (${JSON.stringify(box)})`);
    for (const which of ["back", "next"]) {
      const b = await ui.storyStepBox(page, which);
      assert.ok(b && Math.min(b.width, b.height) >= (name === "phone" ? 44 : 24) && b.y + b.height <= view.height + 0.5, `${name}: ${label}: ${which} is big enough and inside the window (${JSON.stringify(b)})`);
    }
  };
  await fit("step 1");
  const start = await ui.cameraReading(page);
  assert.ok(start.sky && sameDirection(start, { raDeg: 281.6, decDeg: -23 }) && start.fovDeg === 60, `${name}: step 1 holds the opening view (${JSON.stringify(start)})`);
  const readings = { start };

  // From an orbit view: Focus on Earth leaves the sky view; Next must turn the camera back into it, looking at Lantern.
  await ui.pickBody(page, "earth");
  await ui.chooseCamera(page, "focus-earth");
  await ui.waitForCameraReading(page, (reading) => !reading.sky);
  await ui.closeInfo(page); // a menu pick opens the card, which covers the story's buttons on a phone
  if (name === "phone") { await ui.closeControlsDrawer(page); await ui.closeTimelineDrawer(page); } // the camera entry opened the drawers too
  await pressStep(page, "next");
  await waitForStep(page, "step-lantern");
  const lantern = await ui.waitForCameraReading(page, (reading) => reading.sky && reading.fovDeg === 40);
  assert.ok(lantern.sky && lantern.body === "earth" && sameDirection(lantern, { raDeg: 288.5, decDeg: -18 }), `${name}: step 2 turns from the orbit view to look out at Lantern (${JSON.stringify(lantern)})`);
  readings.lantern = lantern;
  await ui.waitForPicked(page, "lantern");
  await ui.waitForSkyLines(page, { present: ["sky-trace:lantern", "sky-selected:lantern"], absent: ["sky-trace:kettle"] });
  assert.equal(await stepEnabled(page, "back"), true, `${name}: Back is on in step 2`);
  await fit("step 2");

  await pressStep(page, "next");
  await waitForStep(page, "step-kettle");
  const kettle = await ui.waitForCameraReading(page, (reading) => reading.sky && !sameDirection(reading, lantern));
  assert.ok(kettle.fovDeg === 40 && kettle.raDeg < lantern.raDeg - 3, `${name}: step 3 turns west to Kettle (${JSON.stringify(kettle)})`);
  readings.kettle = kettle;
  await ui.waitForPicked(page, "kettle");
  await ui.waitForSkyLines(page, { present: ["sky-trace:kettle", "sky-selected:kettle"], absent: ["sky-trace:lantern", "sky-selected:lantern"] }); // leaving step 2 cleared Lantern's trace
  assert.equal(await stepEnabled(page, "next"), false, `${name}: Next is off on the last step`);
  await fit("step 3");

  await pressStep(page, "back");
  await waitForStep(page, "step-lantern");
  const again = await ui.waitForCameraReading(page, (reading) => reading.sky && sameDirection(reading, lantern));
  assert.ok(again.sky, `${name}: Back returns the camera to Lantern`);
  await ui.waitForPicked(page, "lantern");
  await ui.waitForSkyLines(page, { present: ["sky-trace:lantern"], absent: ["sky-trace:kettle"] }); // leaving step 3 cleared Kettle's trace; step 2 traces Lantern again
  await pressStep(page, "back");
  await waitForStep(page, "step-start");
  const home = await ui.waitForCameraReading(page, (reading) => reading.sky && sameDirection(reading, start) && reading.fovDeg === 60);
  assert.ok(home.sky, `${name}: Back to step 1 returns the opening view`);
  await ui.waitForSkyLines(page, { absent: ["sky-trace:lantern", "sky-trace:kettle"] });
  assert.equal(await stepEnabled(page, "back"), false, `${name}: Back is off again on the first step`);
  return readings;
}

/** Figure taps (desktop), then the story; it ends on step 1, the opening view, and closes the panel, so the rest of the journey goes on from there. */
async function checkFiguresAndStory(page, name) {
  const taps = name === "desktop" ? await checkFigureTaps(page, name) : null;
  const story = await checkSkyStory(page, name);
  await ui.closeInfo(page);
  await ui.closeStoryPanel(page);
  return { taps, story };
}

await checkScript({ name: "journey-look-out", viewports: SIZES }, async (page, { name }) => {
  await ui.loadAddress(page, appUrl("experience=synthetic-lookout&skyTraceSeconds=0.5"));
  await ui.waitForShell(page);
  await ui.ensurePaused(page);
  const opened = await ui.waitForCameraReading(page, (reading) => reading.sky);
  assert.ok(opened.sky && opened.body === "earth", `${name}: the scene opens looking out from Earth (reading ${JSON.stringify(opened)})`);
  assert.equal(opened.fovDeg, 60, `${name}: the field of view opens at 60 degrees`);
  const earth = await ui.sceneBody(page, "earth");
  assert.ok(earth === undefined || earth.as === "none" || !earth.inView, `${name}: Earth, the body stood in, is not drawn in view (${JSON.stringify(earth)})`);

  // T-293 repair: the Sun lies in the opening view (the scene opens on the date and direction that put it there; playback is slow enough to keep it), is drawn, and keeps its label (the other bodies are named too).
  const sunOpen = await ui.sceneBody(page, "sun");
  assert.ok(sunOpen && sunOpen.as !== "none" && sunOpen.inView, `${name}: the Sun is drawn and in view on opening (${JSON.stringify(sunOpen)})`);
  assert.ok(Math.abs(sunOpen.x - 0.5) < 0.2 && Math.abs(sunOpen.y - 0.5) < 0.2, `${name}: the Sun is near the middle of the view on opening (${sunOpen.x}, ${sunOpen.y})`);
  const named = await ui.shownSceneLabelIds(page);
  assert.ok(named.includes("sun"), `${name}: the Sun's label shows in the look-out view (shown: ${named.join(", ") || "none"})`);

  const { taps, story } = await checkFiguresAndStory(page, name);
  await ui.waitForSceneLabel(page, "lantern-field", true); // the labels follow the camera back to the opening view
  const lineSets = await checkSkySwitches(page, name);
  await checkSkyTrace(page, name);

  // The menu: with Earth picked its Look out entry shows beside Focus and Follow; Mars offers one too; the Sun does not.
  await ui.pickBody(page, "earth");
  assert.ok(await ui.cameraOffered(page, "lookout-earth"), `${name}: the menu offers Look out from Earth`);
  const fit = await ui.cameraEntryFit(page, "lookout-earth");
  assert.ok(fit.insideWindow && fit.overlaps.length === 0, `${name}: the Look out entry is inside the window and clear of the other controls (overlaps: ${fit.overlaps.join(", ") || "none"})`);
  assert.ok(fit.smallestPx >= (name === "phone" ? 44 : 24), `${name}: the Look out entry is big enough to press (${fit.smallestPx} px)`);
  assert.ok(await ui.cameraActive(page, "lookout-earth") === false, "the opening view presses no camera button");
  await ui.pickBody(page, "mars");
  assert.ok(await ui.cameraOffered(page, "lookout-mars"), `${name}: the menu offers Look out from Mars`);
  await ui.pickBody(page, "sun");
  assert.equal(await ui.cameraOffered(page, "lookout-sun"), false, `${name}: the Sun offers no Look out entry`);

  // The Mars entry stands inside Mars (Earth is drawn again), the field of view zooms with the wheel, and Focus on Earth returns to the orbit camera and draws Earth again.
  await ui.pickBody(page, "mars");
  await ui.chooseCamera(page, "lookout-mars");
  const atMars = await ui.waitForCameraReading(page, (reading) => reading.sky && reading.body === "mars");
  assert.ok(atMars.sky && atMars.body === "mars", `${name}: Look out from Mars stands in Mars (reading ${JSON.stringify(atMars)})`);
  assert.ok(await ui.cameraActive(page, "lookout-mars"), `${name}: the Look out entry shows as pressed`);
  const marsDrawn = await ui.sceneBody(page, "mars");
  assert.ok(marsDrawn === undefined || marsDrawn.as === "none" || !marsDrawn.inView, `${name}: Mars, now stood in, is not drawn in view (${JSON.stringify(marsDrawn)})`);
  let zoomed = null;
  if (name === "desktop") {
    assert.ok(await ui.wheelOverCanvas(page, -600), "the canvas has a free point for the wheel");
    zoomed = await ui.waitForCameraReading(page, (reading) => reading.sky && reading.fovDeg < atMars.fovDeg);
    assert.ok(zoomed.sky && zoomed.fovDeg < atMars.fovDeg, `desktop: a wheel turn narrows the field of view (${atMars.fovDeg} -> ${zoomed.fovDeg})`);
  }
  await ui.pickBody(page, "earth");
  await ui.chooseCamera(page, "focus-earth");
  const back = await ui.waitForCameraReading(page, (reading) => !reading.sky);
  assert.equal(back.sky, false, `${name}: Focus on Earth returns to the orbit camera (reading ${JSON.stringify(back)})`);
  await ui.waitForBodySettled(page, "earth"); // the camera flies to Earth
  const earthBack = await ui.sceneBody(page, "earth");
  assert.ok(earthBack?.inView && earthBack.as !== "none", `${name}: Earth is drawn and in view again once the camera is back in orbit (${JSON.stringify(earthBack)})`);
  await ui.pickBody(page, "mars");
  assert.equal(await ui.cameraActive(page, "lookout-mars"), false, `${name}: the Look out entry no longer shows as pressed`);
  return { opened, taps, story, lineSets, atMars, zoomedFovDeg: zoomed?.fovDeg ?? null, entryPx: fit.smallestPx };
});
