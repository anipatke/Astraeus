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

await checkScript({ name: "journey-look-out", viewports: SIZES }, async (page, { name }) => {
  await ui.loadAddress(page, appUrl("experience=synthetic-lookout"));
  await ui.waitForShell(page);
  await ui.ensurePaused(page);
  const opened = await ui.waitForCameraReading(page, (reading) => reading.sky);
  assert.ok(opened.sky && opened.body === "earth", `${name}: the scene opens looking out from Earth (reading ${JSON.stringify(opened)})`);
  assert.equal(opened.fovDeg, 60, `${name}: the field of view opens at 60 degrees`);
  const earth = await ui.sceneBody(page, "earth");
  assert.ok(earth === undefined || earth.as === "none" || !earth.inView, `${name}: Earth, the body stood in, is not drawn in view (${JSON.stringify(earth)})`);

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
  return { opened, atMars, zoomedFovDeg: zoomed?.fovDeg ?? null, entryPx: fit.smallestPx };
});
