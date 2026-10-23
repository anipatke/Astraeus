// The example apps (O-036 T-162; O-040 T-164 runs the same readouts on examples/hello-react, which draws the same scene through the React component), steps of `npm run check:browser`: examples/hello-scene, built from the packed `astraeus` tarball (not workspace links), is opened at desktop and
// phone size. It must draw Earth and the Moon (the scene's own readouts), list the probe and open following it, start already following the path, and let the time be set (the Moon's orbit line is read from the scene's path readout `moon-orbit`). No screenshot is taken.
// examples/hello-scene also grows a story (O-041 T-168): HELLO_STORY=1 adds its anchor, event and story panel readouts. Alone: [HELLO_STORY=1] ASTRAEUS_URL=<example url> ASTRAEUS_EVIDENCE_DIR=<new dir> node tools/validate/check-hello-scene.mjs
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
  // examples/hello-scene (HELLO_STORY=1) opens looking at the probe, not following it; examples/hello-react opens following it.
  const story = process.env.HELLO_STORY === "1";
  assert.ok(await ui.cameraActive(page, story ? "focus-probe" : "follow-probe"), story ? "the scene opens looking at the probe (Focus)" : "the scene opens already following the probe");
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
  const storyReadouts = story ? { ...(await checkStory(page)), ...(await checkSwitches(page)) } : {};
  return { opened, moved: target, ...storyReadouts, earthPx: earth.radiusPx, orbitInView: orbit.inView, moonAs: moon.as };
});

// The made-up story of examples/hello-scene: three anchor dots on the probe, two events on the timeline and one story panel that opens from its marker. All read through the driver.
async function checkStory(page) {
  assert.equal(await ui.anchorLabelCount(page), 3, "the probe's three anchors are labelled in the scene");
  await ui.openEventList(page);
  assert.equal(await ui.eventRowCount(page), 2, "the timeline lists the two events");
  const rows = await ui.eventRowTexts(page);
  assert.ok(rows.some((text) => text.includes("Made-up burn")) && rows.some((text) => text.includes("Half a lap")), "the events are the burn and half a lap");
  await ui.closeEventList(page);
  assert.equal(await ui.firstStoryMarkerId(page), "half-lap", "the timeline has the story panel's marker");
  await ui.openStoryPanel(page, "half-lap");
  await ui.waitForStoryPanel(page, "half-lap");
  assert.equal(await ui.storyPanelBadge(page), "illustrative", "the panel carries its badge");
  assert.ok((await ui.storyPanelSources(page)) >= 1, "the panel lists its source");
  await ui.closeStoryPanelNow(page);
  return { anchors: 3, events: rows.length, panel: "half-lap" };
}

// The display switches examples/hello-scene places (O-041 T-170): orbit lines on the top bar, labels in the switch panel and the Milky Way picture in the Developer drawer only.
// Each is read through the scene's own readouts (the Moon's orbit line, the label layer, the sky), and the open panel must sit inside the window and clear of the cog and the timeline.
async function checkSwitches(page) {
  const places = await ui.displaySwitchPlaces(page);
  assert.deepEqual(places, { topBar: ["orbitLines"], panel: ["labels"] }, "orbit lines sit on the top bar and labels in the switch panel; the Milky Way is in the Developer drawer only");
  const fit = await ui.switchPanelFit(page);
  assert.ok(fit.insideWindow && fit.overlaps.length === 0, `the switch panel is inside the window and clear of the cog and the timeline (overlaps: ${fit.overlaps.join(", ") || "none"})`);
  assert.equal(await ui.displaySwitchOn(page, "orbitLines"), true, "orbit lines start on");
  await toggleAndRead(page, "orbitLines", async () => (await ui.scenePath(page, "moon-orbit"))?.visible === true, "the Moon's orbit line");
  assert.equal(await ui.displaySwitchOn(page, "labels"), true, "labels start on");
  await toggleAndRead(page, "labels", async () => (await ui.visibleSceneLabelCount(page)) > 0, "the body name labels");
  assert.equal((await ui.sceneSky(page)).picture, false, "the Milky Way picture starts off, as the example asked");
  return { switches: places };
}

/** Presses a switch off and on again and checks the scene's readout follows each press. */
async function toggleAndRead(page, id, drawn, what) {
  const before = await drawn();
  await ui.toggleDisplaySwitch(page, id);
  await page.waitForTimeout(500);
  assert.notEqual(await drawn(), before, `${what} changes when the ${id} switch is pressed`);
  assert.equal(await ui.displaySwitchOn(page, id), !before, `the ${id} switch shows its new state`);
  await ui.toggleDisplaySwitch(page, id);
  await page.waitForTimeout(500);
  assert.equal(await drawn(), before, `${what} returns when the ${id} switch is pressed again`);
}
