// The inner planets example (O-056 T-264), a step of `npm run check:browser`: examples/hello-planets, built from the packed `astraeus` tarball, is opened at desktop and phone size.
// The Sun to Mars are drawn and in view; the host page's own sliders change the star brightness the sky reports; its scale button changes the viewer's scale; Earth's card shows its distance
// from the Sun; and the host controls sit inside the window, clear of each other and the canvas. Read through the driver; no screenshot is taken.
import assert from "node:assert/strict";
import * as ui from "./driver.mjs";
import { appUrl, checkScript } from "./harness.mjs";

const SIZES = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "phone", width: 375, height: 667, isMobile: true, hasTouch: true },
];

await checkScript({ name: "check-hello-planets", viewports: SIZES }, async (page) => {
  await ui.loadAddress(page, appUrl());
  await ui.waitForShell(page);
  await ui.ensurePaused(page);
  await page.waitForTimeout(1500);
  for (const id of ["sun", "mercury", "venus", "earth", "mars"]) {
    const body = await ui.sceneBody(page, id);
    assert.ok(body && body.as !== "none", `${id} is drawn`);
  }
  const fit = await ui.hostControlsFit(page);
  assert.equal(fit.count, 4, "the host page has its three sliders and the scale button");
  assert.deepEqual([fit.overlaps, fit.outside, fit.sideways], [[], [], false], `the host controls are inside the window and overlap nothing (${JSON.stringify(fit)})`);
  // A slider moves the viewer's look: the sky reports the star brightness it now draws.
  await ui.setHostSlider(page, "stars", 0.4);
  await page.waitForTimeout(500);
  assert.equal((await ui.sceneSky(page)).starBrightness, 0.4, "the star brightness slider sets the sky's star brightness");
  await ui.setHostSlider(page, "glow", 0.5);
  await ui.setHostSlider(page, "glow-size", 120);
  // The scale button changes the scale in force, and the viewer's own control reports it.
  const before = await ui.currentScale(page);
  await ui.pressHostButton(page, "scale");
  await page.waitForTimeout(500);
  const after = await ui.currentScale(page);
  assert.notEqual(after, before, "the host scale button changes the scale");
  // Earth's card shows its distance from the Sun.
  await ui.pickBody(page, "earth");
  await ui.waitForInfo(page);
  assert.match(await ui.infoText(page), /Sun/, "Earth's card names the Sun in a distance row");
  return { scaleFrom: before, scaleTo: after, stars: 0.4 };
});
