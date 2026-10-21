// Browser check for the planet switch's inner planets (O-033 T-119). Written, not run, by T-119; the owner's rule is that no browser runs until the Objective's one check.
// Opens the planets experience on Mercury, picks Mars in the switch, finds Phobos and Deimos in the Object list, then turns Mars until one of its tagged places shows
// and presses it. All from the driver: the switch's state, the Object list, the scene's feature-marker readout and the information text. No screenshot is taken.
// Alone: ASTRAEUS_URL=<app.html url> node tools/validate/browser-planet-switch.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as ui from "./driver.mjs";
import { launchBrowser, openContext, pageIn, watchErrors } from "./harness.mjs";

const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const marsPlaces = JSON.parse(readFileSync(new URL("../../data/bodies/mars/features.json", import.meta.url), "utf8")).features.filter((feature) => typeof feature.latitude === "number");
const INNER = ["mercury", "venus", "earth", "mars"];
const MARS_DISTANCE = (3389.5 / 6371.0084) * 3.2;
const browser = await launchBrowser();
const errors = [];
const results = {};
const SIZES = [
  { id: "laptop", viewport: { width: 1280, height: 720 }, touch: false },
  { id: "phone", viewport: { width: 375, height: 667 }, touch: true },
];

try {
  for (const size of SIZES) {
    const name = `planet-switch ${size.id}`;
    const context = await openContext(browser, { viewport: size.viewport, ...(size.touch ? { isMobile: true, hasTouch: true } : {}) });
    const page = await pageIn(context);
    watchErrors(page, errors, name);
    try {
      await ui.loadAddress(page, `${base}?experience=planets&planet=mercury&sky=off`);
      await ui.waitForShell(page);
      await ui.ensurePaused(page);
      const state = await ui.experienceSwitchState(page);
      assert.ok(state, `${name}: the planets experience offers a switch`);
      const values = state.options.map((option) => option.value);
      for (const id of INNER) assert.ok(values.includes(id), `${name}: the switch lists ${id}`);
      assert.equal(state.options.find((option) => option.active)?.value, "mercury", `${name}: Mercury is the open planet`);

      await ui.chooseSwitchOption(page, "mars");
      await ui.waitForShell(page);
      await ui.ensurePaused(page);
      await ui.waitForBodyPicker(page);
      const bodies = (await ui.pickableBodies(page)).map((option) => option.value);
      for (const id of ["mars", "phobos", "deimos"]) assert.ok(bodies.includes(id), `${name}: Mars's view lists ${id}`);

      // Turn Mars until a place of its package shows, then press it and read its information.
      let found = null;
      for (const place of marsPlaces.filter((candidate) => Math.abs(candidate.latitude) < 40).slice(0, 12)) {
        const key = `mars:${place.id}`;
        for (const azimuth of [0, 60, 120, 180, 240, 300]) {
          await ui.loadAddress(page, `${base}?experience=planets&planet=mars&view=mars,${azimuth},${place.latitude > 0 ? 10 : -10},${MARS_DISTANCE}&sky=off`);
          await ui.waitForShell(page);
          await ui.ensurePaused(page);
          await page.waitForTimeout(1200);
          const readout = await ui.sceneFeatures(page);
          assert.ok(readout.shown.every((marker) => marker.key.startsWith("mars:")), `${name}: only Mars's own places show in its view`);
          if (readout.shown.some((marker) => marker.key === key) && (await ui.featureNameFits(page, key))) { found = { place, key }; break; }
        }
        if (found !== null) break;
      }
      assert.ok(found, `${name}: some tagged place of Mars shows from a sampled side`);
      assert.deepEqual(await ui.featureCollisions(page), [], `${name}: no marker overlaps a panel`);
      await ui.pressFeature(page, found.key);
      await ui.waitForFeatureInfo(page, found.key);
      const text = await ui.featureInfoText(page, found.key);
      assert.ok(text.includes(found.place.name), `${name}: the information is headed by ${found.place.name}`);
      assert.match(text, /Reconstructed/, `${name}: the information states what kind of data a place is`);
      await ui.closeInfoStrict(page);
      results[name] = { switchOptions: values, marsBodies: bodies, place: found.key };
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ results, errors }, null, 2));
if (errors.length > 0) process.exit(1);
