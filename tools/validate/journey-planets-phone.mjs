// Journey "Planets on a phone" (O-038 T-145), a step of `npm run check:browser`: on a 375x667 touch screen, open the planets demo on Mercury, switch to Jupiter,
// focus Io, then open one of Io's place cards. Everything goes through driver.mjs and the scene's own readouts; no screenshot is taken.
// Alone: ASTRAEUS_URL=<app.html url> ASTRAEUS_EVIDENCE_DIR=<new dir> node tools/validate/journey-planets-phone.mjs
import assert from "node:assert/strict";
import * as ui from "./driver.mjs";
import { appUrl, checkScript } from "./harness.mjs";

const PHONE = { name: "phone", width: 375, height: 667, isMobile: true, hasTouch: true };

await checkScript({ name: "journey-planets-phone", viewports: [PHONE] }, async (page) => {
  await ui.loadAddress(page, appUrl("experience=planets&planet=mercury&sky=off"));
  await ui.waitForShell(page);
  await ui.ensurePaused(page);
  assert.equal((await ui.experienceSwitchState(page)).options.find((option) => option.active)?.value, "mercury", "Mercury is the open planet");

  await ui.chooseSwitchOption(page, "jupiter");
  await ui.waitForShell(page);
  await ui.ensurePaused(page);
  assert.equal((await ui.experienceSwitchState(page)).options.find((option) => option.active)?.value, "jupiter", "the switch moved to Jupiter");
  assert.ok((await ui.pickableBodies(page)).some((option) => option.value === "io"), "Jupiter's view lists Io");

  await ui.openMoonPanel(page);
  await ui.chooseMoon(page, "io");
  assert.ok(await ui.focusedOn(page, "io"), "the camera is focused on Io");
  await ui.closeInfoStrict(page);
  await page.waitForTimeout(1500);
  const shown = (await ui.sceneFeatures(page)).shown.filter((marker) => marker.key.startsWith("io:"));
  assert.ok(shown.length > 0, "Io's view shows at least one place marker");

  const key = shown[0].key;
  const name = (await ui.featureMarker(page, key))?.name;
  assert.ok(name, "the place marker carries its name");
  await ui.pressFeature(page, key);
  await ui.waitForFeatureInfo(page, key);
  const text = await ui.featureInfoText(page, key);
  assert.ok(text.includes(name), `the place card is headed by ${name}`);
  await ui.closeInfoStrict(page);
  return { place: key, shown: shown.length };
});
