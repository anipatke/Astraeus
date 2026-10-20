// Browser check for the outer planets in the planet switch (O-033 T-118), written, not yet run (the Full Objective Check runs it). Run the app on port 5199, then:
// ASTRAEUS_URL=<app.html url> node tools/validate/browser-outer-planets.mjs   (PLAYWRIGHT_CORE as for the other scripts)
//
// Asserted at desktop and phone size, all through tools/validate/driver.mjs and the scene's own readouts (no screenshots): switching from Jupiter to Saturn
// keeps the clock time, the switch offers the four outer planets, Saturn draws its rings at the fact sheet's radii and its moons panel lists the families;
// a tagged place on Titan and one on Charon (Pluto's view) open their information; Pluto's view draws Pluto and Charon; Uranus draws its rings and no mapped moon.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import * as ui from "./driver.mjs";
import { pw } from "./playwright.mjs";

const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = {};
const json = (path) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), "utf8"));
const EARTH_RADIUS_KM = 6371.0084; // views are in Earth radii

const PLACES = [
  { planet: "saturn", moon: "titan", id: "kraken-mare", radiusKm: 2575.5 },
  { planet: "pluto", moon: "charon", id: "mordor-macula", radiusKm: 606 },
  // Pluto's own place (I-048): the planet places rule shows its surface places.
  { planet: "pluto", moon: "pluto", id: "sputnik-planitia", radiusKm: 1188.3 },
];

async function placeOnMoon(page, name, { planet, moon, id, radiusKm }, notes) {
  const feature = json(`data/bodies/${moon}/features.json`).features.find((entry) => entry.id === id);
  const key = `${moon}:${id}`;
  const distance = (radiusKm / EARTH_RADIUS_KM) * 3.2;
  let found = null;
  for (const azimuth of [0, 60, 120, 180, 240, 300]) {
    await ui.loadAddress(page, `${base}?experience=planets&planet=${planet}&view=${moon},${azimuth},${feature.latitude > 0 ? 10 : -10},${distance}&sky=off`);
    await ui.waitForShell(page);
    await ui.ensurePaused(page);
    await page.waitForTimeout(1200);
    found = await ui.featureMarker(page, key);
    if (found !== null) break;
  }
  assert.ok(found, `${name}: ${key} is shown when its side faces the camera`);
  assert.equal(found.name, feature.name, `${name}: ${key}'s marker is named ${feature.name}`);
  await ui.pressFeature(page, key);
  await ui.waitForFeatureInfo(page, key);
  const text = await ui.featureInfoText(page, key);
  assert.ok(text.includes(feature.name), `${name}: ${key}'s information is headed by its name`);
  assert.ok(text.includes(feature.description.slice(0, 40)), `${name}: ${key}'s description is shown`);
  notes[key] = text.slice(0, 200);
  await ui.closeInfoStrict(page);
}

async function run(name, size) {
  const page = await browser.newPage({ viewport: size });
  page.on("pageerror", (error) => errors.push(`${name} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${name} console: ${message.text()}`); });
  const notes = (results[name] = {});
  try {
    // The switch keeps the clock time: open Jupiter at a chosen time, switch to Saturn, read the clock.
    const wanted = "2016-11-10T12:00:00Z";
    await ui.loadAddress(page, `${base}?experience=planets&planet=jupiter&t=${wanted}&sky=off`);
    await ui.waitForShell(page);
    await ui.ensurePaused(page);
    const state = await ui.experienceSwitchState(page);
    assert.ok(state, `${name}: the planets experience offers a switch`);
    const values = state.options.map((option) => option.value);
    for (const planet of ["jupiter", "saturn", "uranus", "neptune", "pluto"]) assert.ok(values.includes(planet), `${name}: the switch offers ${planet} (${values.join(", ")})`);
    // The clock runs from the first frame (3600x), so the opening time is read after pausing and seeking back to it, never raced.
    await ui.seekTo(page, Date.parse(wanted));
    const before = await ui.clockMs(page);
    assert.equal(before, Date.parse(wanted), `${name}: Jupiter is at the requested time once paused there`);

    // I-051: advance the clock away from the time the address was opened with (the address is never rewritten), pause there, switch: the new planet opens at that later time.
    const DAY = 86_400_000;
    const later = Date.parse(wanted) + 5 * DAY;
    await ui.seekTo(page, later);
    await ui.waitForClock(page, new Date(later).toISOString());
    await ui.chooseSwitchOption(page, "saturn");
    await ui.waitForShell(page);
    await ui.ensurePaused(page);
    const carried = await ui.clockMs(page);
    // The new page plays from its first frame until paused (about a second at 3600x), so compare within a day: far nearer the clock's time than the opening time.
    assert.ok(Math.abs(carried - later) < DAY, `${name}: switching to Saturn keeps the clock's time now (${new Date(carried).toISOString()} vs ${new Date(later).toISOString()})`);
    assert.ok(carried - Date.parse(wanted) > 4 * DAY, `${name}: the switch does not fall back to the time the address was opened with`);
    notes.switchKeptTime = await ui.clockIso(page);

    // Saturn: its rings at the fact sheet's radii, its moons by family.
    const ringFile = json("data/rings/saturn.json");
    await ui.loadAddress(page, `${base}?experience=planets&planet=saturn&view=saturn,0,60,120&sky=off`);
    await ui.waitForShell(page);
    await ui.ensurePaused(page);
    await page.waitForTimeout(1200);
    const rings = await ui.ringReadout(page);
    assert.ok(rings, `${name}: Saturn draws its rings`);
    assert.deepEqual(rings.bands.map((band) => band.id), ringFile.bands.map((band) => band.id), `${name}: the ring bands are the data file's`);
    for (const band of rings.bands) {
      const source = ringFile.bands.find((entry) => entry.id === band.id);
      assert.ok(band.innerKm === source.innerKm && band.outerKm === source.outerKm, `${name}: ${band.id} is drawn at the fact sheet's radii`);
    }
    await ui.openMoonPanel(page);
    const families = await ui.moonFamilies(page);
    assert.deepEqual(families.map((family) => family.id), json("data/moons/saturn.json").families.map((family) => family.id), `${name}: Saturn's moon families are listed`);
    notes.saturnFamilies = families.map((family) => family.id);
    await ui.closeMoonPanel(page);

    // Tagged places on Titan and on Charon.
    notes.places = {};
    for (const place of PLACES) await placeOnMoon(page, name, place, notes.places);

    // Pluto: Pluto and Charon are drawn, Pluto about its own centre (its system loaded before the first frame).
    await ui.loadAddress(page, `${base}?experience=planets&planet=pluto&sky=off`);
    await ui.waitForShell(page);
    await ui.ensurePaused(page);
    await page.waitForTimeout(1200);
    for (const id of ["pluto", "charon"]) {
      const body = await ui.sceneBody(page, id);
      assert.ok(body?.inView && body.as === "sphere", `${name}: ${id} is drawn as a sphere in view (${JSON.stringify(body)})`);
    }

    // Uranus: rings and dots only.
    await ui.loadAddress(page, `${base}?experience=planets&planet=uranus&view=uranus,0,40,60&sky=off`);
    await ui.waitForShell(page);
    await ui.ensurePaused(page);
    await page.waitForTimeout(1200);
    const uranusRings = await ui.ringReadout(page);
    assert.equal(uranusRings?.bands.length, json("data/rings/uranus.json").bands.length, `${name}: Uranus draws its ring bands`);
    const set = await ui.bodySetReadout(page);
    assert.equal(set.members, json("data/moons/uranus.json").moons.length, `${name}: all of Uranus's moons are dots`);
  } finally {
    await page.close();
  }
}

try {
  await run("desktop", { width: 1280, height: 800 });
  await run("phone", { width: 390, height: 844 });
} finally {
  await browser.close();
}
console.log(JSON.stringify({ results, errors }, null, 2));
if (outDir) writeFileSync(`${outDir}/results.json`, `${JSON.stringify({ at: new Date().toISOString(), results, errors }, null, 2)}\n`);
if (errors.length > 0) process.exit(1);
