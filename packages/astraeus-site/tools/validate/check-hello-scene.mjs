// The example app (O-036 T-162), a step of `npm run check:browser`: examples/hello-scene, built from the packed `astraeus` tarball (not workspace links), is opened at desktop and
// phone size. It must draw Earth and the Moon (the scene's own readouts), list the probe and open following it, start already following the path, and let the time be set (the Moon's orbit line is read from the scene's path readout `moon-orbit`). No screenshot is taken.
// Alone: ASTRAEUS_URL=<example url> ASTRAEUS_EVIDENCE_DIR=<new dir> node tools/validate/check-hello-scene.mjs
import assert from "node:assert/strict";
import * as ui from "./driver.mjs";
import { appUrl, checkScript } from "./harness.mjs";

const SIZES = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "phone", width: 375, height: 667, isMobile: true, hasTouch: true },
];

await checkScript({ name: "check-hello-scene", viewports: SIZES }, async (page) => {
  await ui.loadAddress(page, appUrl());
  await ui.waitForShell(page);
  await ui.ensurePaused(page);
  // Following: the probe is the picked object and its Follow button is the one in force from the first frame. The scene has no readout for a tracked path's line, so the
  // check reads the Object list (the probe is in the scene) and the camera preset; the bodies it can read, Earth and the Moon, must be drawn and in view around it.
  assert.ok((await ui.bodyOptions(page)).includes("probe"), "the probe is in the scene's object list");
  assert.equal(await ui.pickedBody(page), "probe", "the probe is the picked object");
  assert.ok(await ui.cameraActive(page, "follow-target"), "the scene opens already following the probe");
  await page.waitForTimeout(1500);
  const earth = await ui.sceneBody(page, "earth");
  assert.ok(earth && earth.as !== "none" && earth.inView, "Earth is drawn and in view");
  const moon = await ui.sceneBody(page, "moon");
  assert.ok(moon && moon.as !== "none" && moon.inView, "the Moon is drawn and in view");
  const orbit = await ui.scenePath(page, "moon-orbit");
  assert.ok(orbit?.visible && orbit.inView > 0, "the Moon's orbit line is drawn and in view");
  // The opening time is the one the example sets, and it can be moved.
  const opened = await ui.clockMs(page);
  const set = Date.parse("2026-01-01T00:00:00Z");
  assert.ok(opened >= set && opened < set + 600_000, "the scene opens at the time setTime gave (it plays on from there until paused)");
  const { min, max } = await ui.seekRange(page);
  const target = Math.round((min + max) / 2);
  await ui.seekTo(page, target);
  await ui.waitForClock(page, new Date(target).toISOString());
  return { opened, moved: target, earthPx: earth.radiusPx, orbitInView: orbit.inView, moonAs: moon.as };
});
