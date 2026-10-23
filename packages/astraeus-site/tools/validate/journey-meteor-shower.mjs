// Journey "Play a meteor shower" (O-038 T-145), a step of `npm run check:browser`: open the Perseids on a laptop screen, play (the clock moves and the scene shows
// It also checks that a resting scene stops drawing and wakes on a wheel turn, on a tap and on play (O-031 T-149, I-073).
// its meteors), seek to a later time, then open a story panel from its timeline marker, then switch to the Geminids in place (T-153). Everything goes through driver.mjs and the scene's own readouts; no screenshot is taken.
// Alone: ASTRAEUS_URL=<app.html url> ASTRAEUS_EVIDENCE_DIR=<new dir> node tools/validate/journey-meteor-shower.mjs
import assert from "node:assert/strict";
import * as ui from "./driver.mjs";
import { assertStreamDrawn } from "./stream-check.mjs";
import { appUrl, checkScript } from "./harness.mjs";

const LAPTOP = { name: "laptop", width: 1280, height: 720 };

await checkScript({ name: "journey-meteor-shower", viewports: [LAPTOP] }, async (page) => {
  await ui.loadAddress(page, appUrl("experience=showers&shower=perseids"));
  await ui.waitForShell(page);
  await ui.ensurePaused(page);
  const start = await ui.clockMs(page);
  // O-031 T-149: paused and untouched, the scene stops drawing; a wheel turn over it, a tap on it and then play draw again.
  const idleAt = await ui.waitUntilSceneIdle(page);
  assert.ok(await ui.nudgeCamera(page), "a free point on the canvas to turn the wheel over");
  const afterNudge = await ui.waitForMoreFrames(page, idleAt);
  const idleAgain = await ui.waitUntilSceneIdle(page);
  assert.ok(await ui.tapCanvas(page), "a free point on the canvas to tap");
  const afterTap = await ui.waitForMoreFrames(page, idleAgain);
  await ui.waitUntilSceneIdle(page);

  await ui.ensurePlaying(page);
  await ui.waitUntilPlaying(page, 10000);
  const beforePlay = await ui.framesDrawn(page);
  await page.waitForTimeout(1500);
  assert.ok((await ui.clockMs(page)) > start, "playing moves the clock on");
  const whilePlaying = (await ui.framesDrawn(page)) - beforePlay;
  assert.ok(whilePlaying >= 10, `playing draws every frame (${whilePlaying} frames in 1.5 s)`);
  await ui.ensurePaused(page);

  await ui.seekToFraction(page, 0.5);
  await page.waitForTimeout(500);
  const middle = await ui.clockMs(page);
  assert.ok(middle > start, "seeking to the middle of the timeline moves the clock later");
  const drawn = await ui.sceneDrawsSomething(page);
  assert.ok(drawn.bodies + drawn.paths > 0, `the scene draws the shower (${JSON.stringify(drawn)})`);
  assertStreamDrawn(drawn.dots, "the Perseids after the seek");

  assert.ok((await ui.storyMarkers(page).count()) > 0, "the timeline has story panel markers");
  const id = await ui.firstStoryMarkerId(page);
  await ui.openStoryPanel(page, id, {});
  await ui.storyPanel(page, id).waitFor({ timeout: 10000 });

  // O-030 T-153: the switch opens the Geminids inside the page (no reload: a marker set before the switch survives) and the Geminids stream is drawn.
  await ui.markPage(page);
  await ui.chooseSwitchOption(page, "geminids");
  assert.ok(await ui.pageWasKept(page), "the switch did not reload the page");
  await ui.waitForShell(page);
  await page.waitForTimeout(800);
  const geminids = await ui.sceneDrawsSomething(page);
  assertStreamDrawn(geminids.dots, "the Geminids after the switch");
  return { switched: "geminids", geminidDots: geminids.dots, idleAt, afterNudge, idleAgain, afterTap, whilePlaying, panel: id, start: new Date(start).toISOString(), middle: new Date(middle).toISOString(), drawn };
});
