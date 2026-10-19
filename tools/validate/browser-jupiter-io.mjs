// Browser check for the Jupiter–Io experience (?experience=jupiter-io) at desktop and phone size. Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-jupiter-io.mjs
//
// Asserted at both sizes: Jupiter and its four mapped moons are the mounted bodies with Jupiter as the scene centre, Jupiter's and Io's labels
// are shown, Io's loop is drawn and every other moon's orbit is in the batch, Io moves between two dates (its position readout and its label on screen), the four presets frame
// something drawn, Jupiter's panel states the missing texture, Io's states that its position is Horizons', the per-body lighting is the default,
// and there are no console errors. Since T-098 (O-025) also: every catalogued moon is drawn (111 small moons in one batch plus the four
// mapped ones), no names show until asked for, a dot's name shows on hover (desktop) or tap (phone), the smallest moon is a ball wider than
// its dot up close and is named there, the four ring bands are drawn at the published radii in the donor's look and take the live
// opacity, and each family has its own orbit colour; all from scene readouts. Since T-103 (O-025) also: the tagged places on the four mapped moons
// (feature markers: all shown from some side, only the facing side at once, named on hover, opened on a press with description and details, selected
// while open). The look is the owner's.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { scaleOptions } from "./driver.mjs";
import * as ui from "./driver.mjs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = {};
const moonData = JSON.parse(readFileSync(new URL("../../data/moons/jupiter.json", import.meta.url), "utf8"));
const MAPPED = ["io", "europa", "ganymede", "callisto"];
const packageFeatures = Object.fromEntries(MAPPED.map((id) => [id, JSON.parse(readFileSync(new URL(`../../data/bodies/${id}/features.json`, import.meta.url), "utf8")).features]));
const featureKeyOf = (body, id) => `${body}:${id}`;
const MOON_RADIUS_UNITS = { io: 1821.49, europa: 1560.8, ganymede: 2631.2, callisto: 2410.3 }; // km; views are in Earth radii (6,371 km)
const smallMoons = moonData.moons.filter((moon) => !MAPPED.includes(moon.id));
const smallest = smallMoons.reduce((a, b) => (b.meanRadiusKm < a.meanRadiusKm ? b : a));
const EARTH_RADIUS_KM = 6371.0084; // only for choosing a close-up distance


const seek = async (page, timeUtcMs) => {
  await ui.seekTo(page, timeUtcMs);
  await page.waitForTimeout(500);
};

const preset = async (page, objectId, presetId) => {
  await ui.pickBodyWithCamera(page, objectId, presetId);
  await page.waitForTimeout(1500);
};

const labelCentre = (page, id) => page.locator(`[data-label-id="${id}"]`).evaluate((el) => {
  if (el.hidden) return null;
  const r = el.getBoundingClientRect();
  return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)];
});

const openPanel = async (page, objectId, label) => {
  await ui.pickBody(page, objectId);
  await ui.openInfo(page, label);
  await ui.infoPanel(page).waitFor();
  return (await ui.infoPanel(page).innerText()).replace(/\s+/g, " ");
};

/** T-098: every moon drawn, names on demand, a ball up close, the rings, one orbit colour per family. */
async function moons(page, name, notes) {
  const phone = name === "phone" || name === "small-phone";
  // A far view of the whole swarm, the sky off so only the scene's own pixels count.
  await ui.loadAddress(page, `${base}?experience=jupiter-io&view=jupiter,30,30,6000&sky=off`);
  await ui.waitForShell(page);
  await ui.ensurePaused(page);
  await page.waitForTimeout(1500);
  const far = await ui.bodySetReadout(page);
  notes.moons = { members: far.members, drawn: far.drawn, orbits: far.orbits, rings: far.rings, named: far.named, familyColors: far.familyColors };
  assert.equal(far.members, smallMoons.length, `${name}: every small moon is in the batch (${far.members})`);
  assert.equal(far.drawn, smallMoons.length, `${name}: every small moon is drawn (${far.drawn})`);
  assert.equal(far.members + MAPPED.length, moonData.moons.length, `${name}: ${moonData.moons.length} moons drawn in all`);
  const dots = (await ui.scenePoints(page)).find((group) => group.id === "jupiter-small-moons");
  notes.moonDots = dots;
  assert.ok(dots?.drawn && dots.members === smallMoons.length && dots.inView >= 10, `${name}: the small moons' dots are drawn and in view (scene readout ${JSON.stringify(dots)})`);
  assert.equal(far.orbits, moonData.moons.length - 1, `${name}: one batched orbit line per moon but Io (Io keeps its own loop)`);
  assert.equal(far.rings, 4, `${name}: four ring bands`);
  assert.deepEqual(Object.keys(far.familyColors), moonData.families.map((family) => family.id), `${name}: a colour for every family`);
  assert.equal(new Set(Object.values(far.familyColors)).size, moonData.families.length, `${name}: one distinct orbit colour per family`);
  assert.ok(far.named <= 1, `${name}: no wall of names before asking (${far.named} named)`);

  // A dot's name: hover on desktop, tap on a phone.
  const dot = far.sample[0];
  assert.ok(dot, `${name}: a dot on screen to point at`);
  if (phone) await ui.tapScene(page, dot.x, dot.y);
  else await ui.pointAtScene(page, dot.x, dot.y);
  await page.waitForTimeout(400);
  assert.ok(await ui.bodySetNameShown(page, dot.id), `${name}: ${dot.id}'s name shows on ${phone ? "tap" : "hover"}`);
  const shown = await ui.bodySetNamesShown(page);
  notes.nameOnDemand = { dot: dot.id, shown };
  assert.ok(shown.length <= 2, `${name}: only the asked-for name shows (${shown.join(", ")})`);

  // Every moon sits on its own orbit line (owner, 2026-10-18: S/2021 J 7 was off its line when the lines were osculating ellipses). Views
  // of irregular moons, S/2021 J 7 among them, from 500 units out. The head's last chord always ends on the body, so the readout gives how
  // far the body is from where the line's last sampled chord points, continued: a line that heads elsewhere and bends to reach it fails.
  notes.onOwnLine = {};
  for (const id of ["s2021-j7", "sinope", "carme", "ananke", "himalia"]) {
    await ui.loadAddress(page, `${base}?experience=jupiter-io&view=${id},30,20,500&sky=off`);
    await ui.waitForShell(page);
    await ui.ensurePaused(page);
    await page.waitForTimeout(1200);
    const gap = (await ui.bodySetReadout(page)).orbitGaps.find((entry) => entry.id === id);
    notes.onOwnLine[id] = gap;
    assert.ok(gap, `${name}: ${id}'s orbit line is measured in view`);
    assert.ok(gap.lineSpanPx > 50, `${name}: ${id}'s orbit line crosses the view (${gap.lineSpanPx} px)`);
    assert.ok(gap.offLinePx <= 1.5, `${name}: ${id} sits on its own orbit line (${gap.offLinePx} px off the line's heading)`);
  }

  // The smallest moon close up: a ball wider than its dot, named by near zoom.
  const units = smallest.meanRadiusKm / EARTH_RADIUS_KM;
  const distance = Math.max(0.003, 12 * units);
  let best = null;
  for (const azimuth of [0, 180]) {
    await ui.loadAddress(page, `${base}?experience=jupiter-io&view=${smallest.id},${azimuth},10,${distance}&sky=off`);
    await ui.waitForShell(page);
    await ui.ensurePaused(page);
    await page.waitForTimeout(1500);
    const close = await ui.bodySetReadout(page);
    const named = await ui.bodySetNameShown(page, smallest.id);
    if (best === null || (close.widest?.radiusPx ?? 0) > (best.widest?.radiusPx ?? 0)) best = { azimuth, widest: close.widest, dotPx: close.dotPx, named };
  }
  notes.closeUp = { moon: smallest.id, radiusKm: smallest.meanRadiusKm, distanceUnits: distance, ...best };
  assert.equal(best.widest?.id, smallest.id, `${name}: ${smallest.id} is the widest ball up close`);
  assert.ok(best.widest.radiusPx * 2 > 4 * best.dotPx, `${name}: ${smallest.id}'s ball (${best.widest.radiusPx.toFixed(1)} px radius) is far wider than its ${best.dotPx} px dot`);
  assert.ok(best.named, `${name}: ${smallest.id} is named when close`);

  if (!phone) {
    // The rings: four bands at the published radii (NSSDC) in Planetary Explorer's colours and opacities, in Jupiter's scaled units, and the
    // live opacity setting reaches the drawn bands.
    await ui.loadAddress(page, `${base}?experience=jupiter-io&view=jupiter,0,80,120&sky=off`);
    await ui.waitForShell(page);
    await ui.ensurePaused(page);
    await page.waitForTimeout(1000);
    const rings = await ui.ringReadout(page);
    assert.ok(rings?.shown, `${name}: the ring disc is drawn`);
    assert.deepEqual(rings.bands.map((band) => [band.id, band.innerKm, band.outerKm, band.color, band.opacity]), [
      ["halo", 89_400, 123_000, "#a0b0d0", 0.105], ["main", 123_000, 128_940, "#d0a080", 0.28],
      ["amalthea-gossamer", 128_940, 181_350, "#b08060", 0.065], ["thebe-gossamer", 181_350, 221_900, "#a07050", 0.026],
    ], `${name}: the four bands at the published radii in the donor's look`);
    // One scale for every band, so the bands keep the published proportions (the main ring's inner edge at 1.72 of Jupiter's 71,492 km).
    const unitsPerKm = rings.bands.map((band) => band.innerUnits / band.innerKm);
    assert.ok(unitsPerKm.every((value) => Math.abs(value / unitsPerKm[0] - 1) < 1e-9) && rings.bands.every((band) => Math.abs(band.outerUnits / band.outerKm / unitsPerKm[0] - 1) < 1e-9), `${name}: every band drawn at its published radius on one scale`);
    await ui.openDeveloper(page);
    await ui.openDeveloperGroup(page, "moons-rings");
    await ui.dragSlider(page, "ring-main-opacity", 0.5);
    await ui.closeDeveloper(page);
    await page.waitForTimeout(500);
    const changed = await ui.ringReadout(page);
    notes.rings = { before: rings.bands.map((band) => band.opacity), after: changed.bands.map((band) => band.opacity) };
    assert.equal(changed.bands[1].opacity, 0.5, `${name}: the live opacity reaches the main ring`);
  }
}

/**
 * T-103: the tagged places on the four mapped moons, all from the scene's feature-marker readout and the information panel text. Each moon is seen
 * from several sides close up; every place of the package with a latitude inside 75 degrees is shown from at least one side, only places facing
 * the camera are ever shown (never all of a moon's at once), hover names a place on a wide screen, a press opens its description and details, and the
 * known places the owner checked (Io's Loki Patera, Ganymede's Galileo Regio, Tros and Osiris) are among them. Where a marker sits on the picture is
 * the owner's look; positions are proven by `tests/featureMarkers.test.ts` and `tests/bodyPackages.test.ts`.
 */
async function places(page, name, notes) {
  const phone = name === "phone" || name === "small-phone";
  notes.places = {};
  // A portrait phone's view is narrow, so at this distance the limbs are cropped and places there are off screen (correctly hidden): turn the moon in 45 degree steps, from above and below, there so every place sits near the centre from some side.
  const sides = [...(phone ? [0, 45, 90, 135, 180, 225, 270, 315] : [0, 90, 180, 270]).flatMap((azimuth) => (phone ? [[azimuth, 10], [azimuth, -30]] : [[azimuth, 10]])), [0, 70], [0, -70]];
  for (const moon of MAPPED) {
    const wanted = packageFeatures[moon];
    const distance = (MOON_RADIUS_UNITS[moon] / 6371.0084) * 3.2;
    const seen = new Set();
    let mostAtOnce = 0;
    let total = 0;
    for (const [azimuth, elevation] of sides) {
      await ui.loadAddress(page, `${base}?experience=jupiter-io&view=${moon},${azimuth},${elevation},${distance}&sky=off`);
      await ui.waitForShell(page);
      await ui.ensurePaused(page);
      await page.waitForTimeout(1500);
      const readout = await ui.sceneFeatures(page);
      total = readout.total;
      mostAtOnce = Math.max(mostAtOnce, readout.shown.length);
      for (const marker of readout.shown) {
        assert.ok(marker.key.startsWith(`${moon}:`) , `${name}: only ${moon}'s own places are shown in its view (${marker.key})`);
        seen.add(marker.key);
      }
    }
    const missing = wanted.filter((feature) => Math.abs(feature.latitude) <= 75 && !seen.has(featureKeyOf(moon, feature.id))).map((feature) => feature.id);
    notes.places[moon] = { packaged: wanted.length, seenFromSomeSide: seen.size, mostAtOnce, missing };
    assert.deepEqual(missing, [], `${name}: every place of ${moon} within 75 degrees of the equator is shown from some side`);
    assert.ok(total === MAPPED.reduce((sum, id) => sum + packageFeatures[id].length, 0), `${name}: the scene holds every place of the four moons (${total})`);
    assert.ok(mostAtOnce > 0 && mostAtOnce < wanted.length, `${name}: ${moon} shows the places facing the camera, never every one at once (${mostAtOnce} of ${wanted.length})`);
  }

  // A press opens a place; a hover names it (wide screen). Known places the owner checked, each found by turning the moon until it shows.
  const known = [["io", "loki-patera"], ["ganymede", "galileo-regio"], ["ganymede", "tros"], ["ganymede", "osiris"], ["europa", packageFeatures.europa[0].id], ["callisto", packageFeatures.callisto[0].id]];
  for (const [moon, id] of known) {
    const feature = packageFeatures[moon].find((candidate) => candidate.id === id);
    assert.ok(feature, `${name}: ${moon} has a place called ${id} in its package`);
    const key = featureKeyOf(moon, id);
    const distance = (MOON_RADIUS_UNITS[moon] / 6371.0084) * 3.2;
    let found = null;
    const lean = feature.latitude > 0 ? 10 : -10;
    // A phone's narrow view crops the limbs, so it turns in 30 degree steps and also looks steeply toward the place's pole (a small phone's timeline covers the lower third, so a southern place must be lifted to the middle).
    const views = (phone ? [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].flatMap((azimuth) => [[azimuth, lean], [azimuth, 4 * lean]]) : [0, 60, 120, 180, 240, 300].map((azimuth) => [azimuth, lean]));
    for (const [azimuth, elevation] of views) {
      await ui.loadAddress(page, `${base}?experience=jupiter-io&view=${moon},${azimuth},${elevation},${distance}&sky=off`);
      await ui.waitForShell(page);
      await ui.ensurePaused(page);
      await page.waitForTimeout(1200);
      found = await ui.featureMarker(page, key);
      // The first side that shows the place with its whole name on screen (on a phone a place near the limb has its name cut by the screen edge).
      if (found !== null && (!phone || (await ui.featureNameFits(page, key)))) break;
    }
    assert.ok(found, `${name}: ${key} is shown when its side faces the camera`);
    assert.equal(found.name, feature.name, `${name}: ${key}'s marker is named ${feature.name}`);
    const target = await ui.featureTapTarget(page, key);
    assert.ok(target.width >= 44 && target.height >= 44, `${name}: ${key}'s tap target is at least 44 px (${JSON.stringify(target)})`);
    assert.ok(await ui.featureNameFits(page, key), `${name}: ${key}'s name stays on screen`);
    assert.deepEqual(await ui.featureCollisions(page), [], `${name}: no marker overlaps a panel (information, moons sheet, timeline, top bar, drawers)`);
    if (!phone) {
      await ui.hoverFeature(page, key);
      await page.waitForTimeout(300);
      assert.ok(await ui.featureNameShown(page, key), `${name}: hovering ${feature.name} shows its name`);
    }
    await ui.pressFeature(page, key);
    await ui.waitForFeatureInfo(page, key);
    const text = await ui.featureInfoText(page, key);
    notes.places[`${moon}/${id}`] = text.slice(0, 200);
    assert.ok(text.includes(feature.name), `${name}: ${key}'s information is headed by its name`);
    assert.ok(text.includes(feature.description.slice(0, 40)), `${name}: ${key}'s description is shown`);
    for (const detail of feature.details.slice(0, 2)) assert.ok(text.includes(detail.label) && text.includes(detail.value.slice(0, 20)), `${name}: ${key}'s detail "${detail.label}" is shown`);
    assert.deepEqual(await ui.featureCollisions(page), [], `${name}: with ${key}'s information open, no marker overlaps it or any other panel`);
    assert.match(text, /Reconstructed/, `${name}: the information states what kind of data a place is`);
    assert.ok(await ui.featureMarkerPressed(page, key), `${name}: ${key}'s marker reads as selected while its information is open`);
    await ui.closeInfoStrict(page);
  }

  // The moons panel owns its own area too: with it open (the sheet on a wide screen, the top drawer on a phone) no marker shows under it.
  await ui.openMoonPanel(page);
  await page.waitForTimeout(500);
  assert.deepEqual(await ui.featureCollisions(page), [], `${name}: with the moons panel open no marker overlaps it, its button or the timeline`);
  await ui.closeMoonPanel(page);
}

async function run(name, viewport) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`${name} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${name} console: ${message.text()}`); });
  const notes = {};
  results[name] = notes;
  try {
    await page.goto(`${base}?experience=jupiter-io`);
    await page.waitForSelector("canvas");
    await ui.waitForShell(page);
    const canvas = page.getByTestId("earth-moon-canvas");
    assert.equal(await canvas.getAttribute("data-bodies"), "jupiter,io,europa,ganymede,callisto", `${name}: Jupiter and its four mapped moons are the mounted bodies`);
    assert.equal(await canvas.getAttribute("data-scene-center"), "jupiter", `${name}: Jupiter is the scene centre`);
    assert.equal(await canvas.getAttribute("data-lighting"), "per-body", `${name}: each body is lit by its own Sun direction`);
    assert.equal(await canvas.getAttribute("data-composition-paths"), "1", `${name}: Io's loop is drawn (the other mapped moons' orbits are in the batch)`);
    await ui.pausePlayback(page);
    const options = await ui.bodyOptions(page);
    // T-053: the sky is every experience's last item ("sky"). T-098: the four mapped moons are listed; the 111 small moons are not (names on demand).
    assert.deepEqual(options, ["jupiter", "io", "europa", "ganymede", "callisto", "sky"], `${name}: the object list is Jupiter, the four mapped moons and the sky`);
    const body = await ui.pageText(page);
    assert.doesNotMatch(body, /apollo|columbia|mission|perseid/i, `${name}: no other experience's content`);
    const scales = await scaleOptions(page);
    // T-085: one scale means no scale control at all (it was a held button before), so the options are empty and True stays in force.
    assert.deepEqual(scales, [], `${name}: true scale only, so no scale control (the other scales would bury or enlarge Io)`);
    assert.equal(await ui.hasScaleControl(page), false, `${name}: no scale control for one scale`);

    const start = (await ui.seekRange(page)).min;
    await seek(page, start);
    await preset(page, "jupiter", "overview");
    notes.overviewJupiter = await ui.sceneBody(page, "jupiter");
    assert.ok(notes.overviewJupiter?.inView && notes.overviewJupiter.as === "sphere" && notes.overviewJupiter.radiusPx > 3, `${name}: Jupiter is drawn as a sphere in view in the overview (scene readout ${JSON.stringify(notes.overviewJupiter)})`);
    for (const id of ["jupiter", "io"]) {
      assert.ok(await labelCentre(page, id), `${name}: the ${id} label is shown`);
    }

    // Io moves: its label on screen and its position readout change between two dates six hours apart (about a third of an orbit).
    const ioAt0 = await labelCentre(page, "io");
    const panel0 = await openPanel(page, "io", "Io");
    assert.match(panel0, /Distance from Jupiter/, `${name}: Io's distance from Jupiter is shown`);
    assert.match(panel0, /Io position/, `${name}: Io's position is shown`);
    await ui.closeInfoStrict(page);
    await seek(page, start + 6 * 3_600_000);
    await preset(page, "jupiter", "overview");
    const ioAt1 = await labelCentre(page, "io");
    const panel1 = await openPanel(page, "io", "Io");
    assert.notEqual(panel0, panel1, `${name}: Io's readings change in six hours`);
    await ui.closeInfoStrict(page);
    notes.ioLabel = { t0: ioAt0, sixHours: ioAt1 };
    assert.ok(ioAt0 && ioAt1 && Math.hypot(ioAt1[0] - ioAt0[0], ioAt1[1] - ioAt0[1]) > 10, `${name}: Io moves on screen (${JSON.stringify(notes.ioLabel)})`);

    // The four presets each frame something drawn, and a focused body is drawn as a sphere in view.
    await seek(page, start + 3_600_000);
    notes.lit = {};
    for (const [objectId, key] of [["jupiter", "overview"], ["jupiter", "focus-jupiter"], ["io", "focus-io"], ["io", "follow-io"]]) {
      await preset(page, objectId, key);
      notes.lit[key] = await ui.sceneDrawsSomething(page);
      assert.ok(notes.lit[key].bodies + notes.lit[key].paths > 0, `${name}/${key}: something is drawn (scene readout ${JSON.stringify(notes.lit[key])})`);
      if (key !== "overview") {
        const body = await ui.sceneBody(page, objectId);
        assert.ok(body?.inView && body.as === "sphere", `${name}/${key}: ${objectId} is drawn as a sphere in view (${JSON.stringify(body)})`);
      }
    }
    await seek(page, start + 9 * 3_600_000);
    await page.waitForTimeout(500);

    // Accuracy records: Jupiter's missing texture, Io's Horizons figure and class.
    const jupiterPanel = await openPanel(page, "jupiter", "Jupiter");
    await ui.openProvenance(page);
    const jupiterDetail = (await ui.provenanceDetail(page).innerText()).replace(/\s+/g, " ");
    assert.match(jupiterDetail, /flat in one colour/i, `${name}: Jupiter's missing texture is stated`);
    notes.jupiterPanel = jupiterPanel.slice(0, 300);
    await ui.closeInfoStrict(page);
    await openPanel(page, "io", "Io");
    await ui.openProvenance(page);
    const ioDetail = (await ui.provenanceDetail(page).innerText()).replace(/\s+/g, " ");
    // T-098: Io's position is JPL Horizons' through the core curve fits (no longer the mean elements).
    assert.match(ioDetail, /Horizons/i, `${name}: Io's source is stated`);
    assert.match(ioDetail, /0\.0994 m/, `${name}: the fits' figure for Io is stated`);
    notes.ioDetail = ioDetail.slice(0, 600);
    await ui.closeInfoStrict(page);
    await moons(page, name, notes);
    await places(page, name, notes);
  } finally {
    await page.close();
  }
}

try {
  await run("desktop", { width: 1280, height: 800 });
  await run("phone", { width: 390, height: 844 });
  // O-025 T-103 owner rule: panels avoid collisions and work on the smallest screens (a small phone and a short laptop).
  await run("small-phone", { width: 375, height: 667 });
  await run("short-laptop", { width: 1280, height: 720 });
} finally {
  await browser.close();
}
console.log(JSON.stringify({ results, errors }, null, 2));
if (outDir) writeFileSync(`${outDir}/results.json`, `${JSON.stringify({ at: new Date().toISOString(), results, errors }, null, 2)}\n`);
if (errors.length > 0) process.exit(1);
