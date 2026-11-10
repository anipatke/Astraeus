// Journey "Look out" (O-064 T-293), a step of `npm run check:browser`: the made-up look-out scene (`?experience=synthetic-lookout`, dev server only: the Sun, Earth and Mars) at 1280x720 and 375x667 with touch.
// The scene opens with the camera at Earth's centre looking out (the Developer drawer's view line is a sky view of Earth, the stood-in Earth is not drawn); the camera menu offers Look out from Earth and from Mars, clear of
// the other controls; the Mars entry moves the sky view to Mars, and Focus returns to the orbit camera; a wheel turn changes the field of view (desktop). Everything goes through driver.mjs; no screenshot is taken.
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
}

await checkScript({ name: "journey-look-out", viewports: SIZES }, async (page, { name }) => {
  await ui.loadAddress(page, appUrl("experience=synthetic-lookout"));
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
  return { opened, lineSets, atMars, zoomedFovDeg: zoomed?.fovDeg ?? null, entryPx: fit.smallestPx };
});
