// Journey "Play a meteor shower" (O-038 T-145), a step of `npm run check:browser`: open the Perseids on a laptop screen, play (the clock moves and the scene shows
// its meteors), seek to a later time, then open a story panel from its timeline marker. Everything goes through driver.mjs and the scene's own readouts; no screenshot is taken.
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

  await ui.ensurePlaying(page);
  await ui.waitUntilPlaying(page, 10000);
  await page.waitForTimeout(1500);
  assert.ok((await ui.clockMs(page)) > start, "playing moves the clock on");
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
  return { panel: id, start: new Date(start).toISOString(), middle: new Date(middle).toISOString(), drawn };
});
