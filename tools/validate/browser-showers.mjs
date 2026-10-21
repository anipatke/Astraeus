// Browser check for showers built from settings files. Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-showers.mjs [<shower name>]
// With no name (and no ASTRAEUS_SHOWER) it runs over every data/showers/<name>.json, one run per shower, each with its own log and results under
// <evidence dir>/<name>/. A shower's own values (peak solar longitude, radiant, parent, window, rate unit, orbit-file code, clump settings, label) come
// from its settings file and the local orbit-file header; nothing here belongs to one shower. Run with a name to check one shower.
// T-055 scenario map: every scenario below is kept for every shower; only the figures that were Perseid values are now read from the settings file
//   Perseid figure in the script before T-055 ............... now read from
//   peak solar longitude 140.1 deg (checkCrossing) ........... settings radiant.peakSolarLongitudeDeg
//   radiant RA 47.9 / Dec 57.9 / "IAU Meteor Data Center" .... settings radiant.raDeg / decDeg / the first words of radiant.source.name
//   the clump "30% ... ±20° ... 109P/Swift-Tuttle" ........... settings stream.concentration and parentBody
//   fetch command "... 7" and orbit file gmn-iau-7 .......... settings stream.iauCode
//   "Information about Perseids stream" ....................... settings label
// O-017 T-071 (trim): the phone run checks the phone layout once, so it keeps the plain load, the peak (stream drawn, details, credits, member count, the clump and
// not-shown statements) and the window details, and no longer repeats: start and end stream drawn and the rate rising to the peak (desktop asserts both), the zoomed-out sweep
// (kept, desktop and phone), checkSunEarth, checkBodies, checkWholeOrbit, checkCrossing, checkYear, checkLoop and checkEclipticFlat (desktop only; they measure the same
// scene geometry, not a layout). The zoomed-out and credits steps still run on both sizes. The full run (`npm run check:demo -- showers`) runs Perseids in full and Geminids with ASTRAEUS_LIGHT=1
// (both sizes light): Geminids' own settings figures, credits, counts, quality sets and span are asserted; the geometry scenarios are the same code and ran for Perseids.
// O-017 T-067 (CAMS and Yale removed; GMN is the only orbit source): the stream is the committed GMN copy data/stories/<shower>/gmn-iau-<code>.json, so no URL pins a source any more
// and the figures that were read from the local CAMS file (kept count, orbit sets, rows) are read from that copy. browser-showers-gmn.mjs is removed and each of its scenarios is mapped:
//   its scenario ......................................................... now asserted by
//   ?source=gmn draws the stream from the GMN file; panel names the GMN, CC BY 4.0, months, counts ... the stream-details scenario (every shower, desktop and phone): GMN credit, licence, months, counts, both citations
//   ?source=gmn&orbits=all|reliable draws each set; panel states the Qc / Vgeo-sigma rule ............. checkQuality (set counts from the shipped file's compact columns, the mapped rule sentence)
//   the default is CAMS and its panel carries no GMN sentence .............. dropped with CAMS; replaced by "the panel names no CAMS source" (stream-details) and the removed ?source= address being ignored (checkRemovedSwitches)
//   Developer offers "Orbits from CAMS" / "Orbits from GMN" and reloads ..... dropped with the switch; replaced by checkRemovedSwitches (no "Orbits from" button, ?source=cams still draws GMN, no CAMS file requested)
//   not fetched: the panel gives the GMN fetch command ................. checkNotFetched (blocks the local file and the shipped copy, asserts the --months command and no --source)
//   ASTRAEUS_SHIPPED=1 checkShipped (public build) ......................... browser-public-showers.mjs (shipped copy requested, no data/local served, GMN credit, absent message)
//   the owner's CAMS-vs-GMN comparison screenshots (compare/) ............... dropped: a one-off comparison for the owner's source choice in T-056; the before/after pictures of tools/validate/capture-experience-pictures.mjs cover the look
// I-028 (new scenario, "plain load"): a load with no preset clicked and the sky on draws the stream (T-102: over 50 stream dots in the scene's point readout; it was 50 stream-coloured pixels: the Geminid dots are 1.6 px aqua and read thin, 95 on the phone) and is not a Sun close-up (<30% lit).
//   the comet "swift-tuttle" and "Focus comet" ................ the parent id (parentElements.id or parentBodyId) and the generic "Focus parent" preset
//   the mounted bodies (seven) ................................ the built-in Sun-circling bodies, plus the parent when the settings define it
// O-016 T-063 (a shower may now declare look.startView, the Perseids open on sun,100,40,250000): scenarios that measure on-screen geometry no longer rely on the opening camera.
//   scenario (assertion unchanged) .......................... camera now set by
//   ecliptic flat (major axis within 8 deg, flat ellipse) ..... `&view=` + ENGINE_DEFAULT_VIEW (sun,216,14.32,3007000, the camera the assertion was written for) in the URL, then Overview as before
//   every other scenario (they start from a click on a preset) . the same explicit ENGINE_DEFAULT_VIEW on the page's URL, so a startView cannot change their opening framing
//   NEW plain load opens at the shower's look.startView ....... the Developer view readout matches the settings file within 1.5 deg / 2% (only when the file declares one)
//
// T-038 scenario map (the T-047, T-049 and T-053 scenarios are all kept; each one whose subject changed names its replacement).
//   NEW in T-038: the stream is the measured orbits (then CAMS, now the GMN copy under data/stories/, see O-017 T-067 above); the
//   Sun-centred scene holds the Sun, Earth, the four planets and the comet, as catalogued bodies, with the comet's whole orbit drawn.
//   prior scenario .............................................. now asserted by
//   one stream group, listed once, no Apollo objects ............ unchanged (data-point-groups 1) + the panel's member count equals the fetched file's kept count
//                                                                 (the old invented `memberCount` of 10,000 is gone: there is no stand-in stream)
//   stream drawn and rate readout at start, peak and end ........ unchanged (amber dots > 150 px; the readout rises to the peak and falls)
//   stream visible zoomed out ................................... unchanged
//   radiant readout: RA 48.0 (AMS, equinox not stated) .......... RA 47.9, Dec 57.9, J2000 (IAU MDC); the readout cites the MDC
//   illustrative badge and the limitation "Modelled spread,
//     two-body, not observed" (the invented spread) ............. the badge stays Illustrative; the panel states the three required facts instead: position
//                                                                 along each orbit illustrative, the clump near the parent a model (fraction, width, status), parts of
//                                                                 the stream that miss Earth not shown, and the clump shows as a band at the parent's phase
//   window details .............................................. unchanged
//   Apollo default and synthetic-ring still mount ............... unchanged
//   Sun at the origin, no Moon item, Earth on its path at start
//     and peak, solar-system scale shows Earth and states its
//     factor, follow Earth ..................................... unchanged (checkSunEarth); data-bodies now lists the Sun, Earth, four planets and the comet;
//                                                                 the parent's orbit item is `<body>-orbit` (swift-tuttle-orbit) instead of `<shower>-parent-orbit`
//   T-049 planet orbit items with provenance, tan lines drawn ... unchanged (checkPlanetOrbits)
//   T-053 shower scenes open with ?sky=off (colour-pixel counts) . unchanged; the sky is covered by browser-sky.mjs
//   T-038 additions:
//     the comet and the planets are visible with labels ......... checkBodies: over a zoom sweep every body's label is shown, the planets and Earth draw as markers at
//                                                                 true scale and Earth and at least two other planets draw as bodies under the solar-system scale
//     the comet's whole orbit is drawn and the preset frames it .. checkWholeOrbit: the "Whole orbit" preset leaves the orbit line (the scene path readout, I-040) in view and spanning most of the canvas
//     the crossing is at the peak ................................ checkCrossing: the instant the peak marker seeks to has solar longitude 140.1 (J2000; low-precision
//                                                                 almanac formula, written here) within 0.3 deg, and the rate readout peaks there
//     no data, no stream ........................................ checkNotFetched: with the orbit file blocked the stream is not drawn and its panel says "not fetched"
//     loops at the end (owner 2026-10-15) ....................... checkLoop: playing past the end wraps the time back inside the window and dots are still drawn; checkLoopOff: ?loop=off runs past the end and the stream is gone
//     frame rate with every member drawn ........................ read from the Developer counter and recorded (software GL: an indication, not the owner's figure)
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { rowsOfFile } from "../data/fetch-meteoroid-orbits.mjs";
import { chooseScale, scaleOptions, selectOrbit } from "./driver.mjs";
import * as ui from "./driver.mjs";
import { launchBrowser, openPage as openBrowserPage, watchErrors } from "./harness.mjs";

const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const shower = process.argv[2] ?? process.env.ASTRAEUS_SHOWER;
// ASTRAEUS_LIGHT=1: a second shower in the full run. Both sizes run only the settings-driven scenarios (plain load, peak, details, credits, counts, window), not the scene geometry the first shower already proved.
const lightRun = process.env.ASTRAEUS_LIGHT === "1";
const showersDir = new URL("../../data/showers/", import.meta.url);
if (shower === undefined) {
  // Every discovered shower, one run each, in its own child process, log and evidence folder.
  const names = readdirSync(showersDir).filter((file) => file.endsWith(".json")).map((file) => file.slice(0, -".json".length)).sort();
  assert.ok(names.length > 0, "no data/showers/*.json found");
  let failed = 0;
  for (const name of names) {
    const dir = process.env.ASTRAEUS_EVIDENCE_DIR ? `${process.env.ASTRAEUS_EVIDENCE_DIR}/${name}` : undefined;
    console.log(`=== ${name} ===`);
    const run = spawnSync(process.execPath, [fileURLToPath(import.meta.url), name], { stdio: "inherit", env: { ...process.env, ...(dir === undefined ? {} : { ASTRAEUS_EVIDENCE_DIR: dir }) } });
    if (run.status !== 0) failed += 1;
  }
  console.log(`${names.length - failed} of ${names.length} showers passed`);
  process.exit(failed === 0 ? 0 : 1);
}
const settingsFile = JSON.parse(readFileSync(new URL(`${shower}.json`, showersDir), "utf8"));
// The committed GMN copy a public build ships (compact columns, see SHIPPED_COLUMNS in tools/data/fetch-meteoroid-orbits.mjs): recordId, epochUtcMs, a, e, i, w, node, Qc, Vgeo, Vgeo sigma.
const orbitFile = new URL(`../../data/stories/${shower}/gmn-iau-${settingsFile.stream.iauCode}.json`, import.meta.url);
const gmnSettings = settingsFile.stream.sources.gmn;
const haveOrbits = existsSync(orbitFile);
const fetched = haveOrbits ? JSON.parse(readFileSync(orbitFile, "utf8")).provenance : null;
// The parent: defined in the file (its id is the record's) or catalogued. The mounted bodies are the built-in Sun-circling ones plus a defined parent.
const parent = settingsFile.parentElements?.id ?? settingsFile.parentBodyId;
const builtInPlanets = ["sun", "earth", "mercury", "venus", "mars", "jupiter"];
// The Sun, the planets and this shower's own parent only (never another shower's parent).
const mountedBodies = [...builtInPlanets, parent];
const streamButtonName = new RegExp(`^Information about ${settingsFile.label} stream$`);
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const browser = await launchBrowser();
const errors = [];
const results = {};
/** The engine default camera (Sun, azimuth 216, elevation 14.32, Overview distance) that the geometry assertions were written for, independent of any look.startView. */
const ENGINE_DEFAULT_VIEW = "&view=sun,216,14.32,3007000";
// Every stream-pixel count the scenarios assert on, by shower, viewport and scenario, so a floor can be judged against what was actually measured.
const litLog = (results.litCounts = {});
const logLit = (where, n) => { litLog[`${shower}/${where}`] = n; return n; };

/** Prints how long a check took (O-034 T-112: to find the slow ones). */
async function timed(name, fn) {
  const started = Date.now();
  await fn();
  console.log(`timing ${name}: ${Math.round((Date.now() - started) / 1000)} s`);
}

async function openPage(viewport) {
  const page = await openBrowserPage(browser, { viewport });
  watchErrors(page, errors);
  return page;
}

// T-102: the stream's dots in view, from the scene's point readout (members in front of the camera and inside the view, an even sample scaled up): the stream is visible when its dots are drawn.
// This replaces the count of stream-coloured canvas pixels; the group is picked by id, so no colour filter is needed.
const litPixels = async (page) => {
  const group = await ui.scenePointGroup(page, `${shower}-stream`);
  return group?.drawn ? group.inView : 0;
};

const seek = async (page, timeUtcMs) => {
  await ui.seekTo(page, timeUtcMs);
  await page.waitForTimeout(500);
};

// T-049: the four planet orbits are items with provenance, and their lines are drawn around the Sun.
async function checkPlanetOrbits(page, label, canvas, choose, closeInfo) {
  const out = (results[label].planetOrbits = {});
  // O-034 T-112: Mercury and Jupiter sampled for the panel/provenance step (Venus and Mars dropped; their lines are still asserted drawn below).
  for (const id of ["mercury", "jupiter"]) {
    await selectOrbit(page, id, `${id}-orbit`);
    await ui.openInfo(page, /^Information about .+ orbit$/);
    await ui.infoPanel(page).waitFor();
    const text = (await ui.infoPanel(page).innerText()).replace(/\s+/g, " ");
    assert.match(text, /orbit/i, `${label}: ${id}'s orbit panel opens`);
    await ui.openProvenance(page);
    const detail = (await ui.provenanceDetailText(page));
    assert.match(detail, /Horizons/, `${label}: ${id}'s orbit carries the planet's position provenance`);
    if (id === "jupiter") assert.match(detail, /reaches past 2030/, `${label}: Jupiter's orbit states that it passes the compared range`);
    out[id] = detail.slice(0, 200);
    await closeInfo();
  }
  await choose("sun", "overview");
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 4, box.y + box.height / 4);
  for (let i = 0; i < 12; i += 1) await page.mouse.wheel(0, 900);
  await page.waitForTimeout(720);
  // T-102: from the scene's path readout (each planet's orbit line visible, with vertices in view), not tan-coloured pixels.
  out.planetOrbitReadouts = {};
  for (const id of ["mercury", "venus", "mars", "jupiter"]) {
    const line = await ui.scenePath(page, `${id}-orbit`);
    out.planetOrbitReadouts[id] = line;
    assert.ok(line?.visible && line.inView > 0, `${label}: ${id}'s orbit line is drawn around the Sun (path readout ${JSON.stringify(line)})`);
  }
}

// The Sun-Earth composition asserted first: the scene centre, the mounted bodies, the Object list and the related orbit buttons, and the scale options.
async function checkSunEarthComposition(page, label, canvas) {
  assert.equal(await canvas.getAttribute("data-scene-center"), "sun", `${label}: the Sun is the scene centre`);
  assert.equal(await canvas.getAttribute("data-bodies"), mountedBodies.join(","), `${label}: the mounted bodies are the Sun, Earth, the four planets and the parent (and no other shower's parent)`);
  if (parent !== "swift-tuttle") assert.ok(!(await canvas.getAttribute("data-bodies")).split(",").includes("swift-tuttle"), `${label}: another shower's parent (the catalogued comet) is not mounted in this shower`);
  assert.equal(await canvas.getAttribute("data-sun-centred"), "6", `${label}: Earth's path, four planet orbits and the comet's whole orbit are declared`);
  const options = await ui.bodyOptions(page);
  // T-079 (O-020 Decision 4): the Object list holds the bodies and the stream; the six orbit lines are no longer listed.
  for (const id of [...mountedBodies, `${shower}-stream`]) assert.ok(options.includes(id), `${label}: ${id} is listed`);
  for (const id of ["earth-path", "mercury-orbit", "venus-orbit", "mars-orbit", "jupiter-orbit", `${parent}-orbit`]) assert.ok(!options.includes(id), `${label}: ${id} is not in the Object list`);
  // Each orbit line stays reachable from its body: a related button selects it and opens nothing else; its info (source, limits) opens with Info.
  for (const [body, orbit] of [["earth", "earth-path"], ["mars", "mars-orbit"], [parent, `${parent}-orbit`]]) {
    await ui.pickBody(page, body);
    assert.equal(await ui.relatedObject(page, orbit).count(), 1, `${label}: ${body} offers a button for ${orbit}`);
    await ui.pressRelatedObject(page, orbit);
    assert.equal(await ui.pickedBody(page), orbit, `${label}: ${orbit} is selected from its body`);
    assert.equal(await ui.infoPanelFor(page, orbit).count(), 1, `${label}: ${orbit}'s info (source, limits) opens from its body`);
  }
  await ui.pickBody(page, mountedBodies[0]);
  assert.ok(!options.includes("moon"), `${label}: no Moon item`);
  const scales = await scaleOptions(page);
  assert.deepEqual(scales, ["true-scale", "solar-system"], `${label}: true and solar-system scale`);

}

// The comet's whole orbit is in view in the Overview at `name` ("start" or "peak"), with the out-of-view negative probe at the start.
async function checkCometOrbitInOverview({ page, label, canvas, out, choose }, name) {
  await choose("sun", "overview");
  await ui.closeAllPanelsNow(page); // a story or information panel lies over the canvas
  await page.waitForTimeout(300);
  // T-038: Overview now frames the comet's whole 51 AU orbit, so Earth's 1 AU path is a few pixels there. The comet's orbit is asserted at that framing,
  // then the camera is brought in (the wheel) until Earth's path is the size it was in the earlier Overview, which is the earlier scenario's assertion.
  // I-040: the comet's whole orbit is drawn in the Overview, proved from the line itself: the scene's path readout (driver.scenePath) says the line is visible, has its vertices and that they
  // lie in the view, with labels on or off. Negative probe: the camera pulled in on the Sun (wheel), so the orbit, which lies far outside the frame, is out of view, must read fewer
  // vertices in view (a short orbit such as the Geminids' keeps its near-Sun end in view, so the bar is 60%, not a quarter) (Focus Earth is no probe: the comet's orbit passes close by Earth).
  const orbitLine = await ui.scenePath(page, `${parent}-orbit`);
  out.path[`${name}WholeOrbitReadout`] = orbitLine;
  assert.ok(orbitLine?.visible, `${label}/${name}: the comet's orbit line is drawn (visible in the scene's path readout; the scene's paths: ${JSON.stringify(await ui.scenePaths(page))})`);
  assert.ok(orbitLine.vertices >= 500 && orbitLine.inView >= 0.9 * orbitLine.vertices, `${label}/${name}: the comet's whole orbit is in view in the Overview (${orbitLine.inView} of ${orbitLine.vertices} vertices)`);
  assert.ok(Math.max(orbitLine.spanX, orbitLine.spanY) > 0.03, `${label}/${name}: the comet's orbit is a line with an extent in the view, not a point (${orbitLine.spanX} x ${orbitLine.spanY}; the Overview frames it small at some times, the Whole orbit preset is asserted to span over 30%)`);
  if (name === "start") {
    const boxN = await canvas.boundingBox();
    // Over empty sky, not the canvas centre: in the Showers year (O-024 T-092) Earth's and Mercury's labels sit by the Sun at the start and a wheel over a label does not reach the scene.
    await page.mouse.move(boxN.x + boxN.width / 4, boxN.y + boxN.height / 4);
    for (let i = 0; i < 25; i += 1) await page.mouse.wheel(0, -400);
    await page.waitForTimeout(720);
    const without = await ui.scenePath(page, `${parent}-orbit`);
    out.path.startOrbitOutOfViewReadout = without;
    assert.ok(without.inView < orbitLine.inView * 0.6, `${label}/${name}: the path readout finds the line only when it is in view (${without.inView} vertices in view with it out of view, ${orbitLine.inView} in the Overview)`);
  }
  // O-034 T-112: Earth's path being brought into view and running on both sides of Earth is asserted at the peak only; the start pass keeps the whole-orbit readouts and the
  // out-of-view negative probe above (the same camera and path code, so the start repeat was dropped).
}

// Earth's path at the peak: brought into view by the wheel and running on both sides of Earth when it is the focus.
async function checkEarthPathAtPeak({ page, label, canvas, out, choose }, name) {
  await choose("sun", "overview");
  // T-102: a point where the canvas is on top (at the peak the story marker sits over the middle, where a wheel never reached the camera; the old pixel count passed without zooming).
  const free0 = (await ui.freeCanvasPoint(page)) ?? { x: 10, y: 10 };
  await page.mouse.move(free0.x, free0.y);
  // T-102: Earth's path as the scene reports it (the line's own vertices in view and the share of the view they span; it replaces a count of blue pixels).
  const pathBig = (line) => line?.visible && line.inView >= 0.9 * line.vertices && Math.max(line.spanX * line.aspect, line.spanY) > 0.1;
  let overview = await ui.scenePath(page, "earth-path");
  let wheels = 0;
  while (!pathBig(overview) && wheels < 60) {
    await page.mouse.wheel(0, -400);
    wheels += 1;
    await page.waitForTimeout(350);
    overview = await ui.scenePath(page, "earth-path");
  }
  out.path[`${name}Wheels`] = wheels;
  assert.ok(pathBig(overview), `${label}/${name}: Earth's path is drawn once the camera is brought in (${JSON.stringify(overview)} after ${wheels} wheel steps)`);
  await choose("earth", "focus-earth");
  // Frame Earth with the path in view: pull back a little from the close framing.
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 3; i += 1) await page.mouse.wheel(0, 300);
  // T-038 (ecliptic-up view): Focus Earth now looks at Earth from the Sun's side exactly in the ecliptic, where its path is edge-on; raise the camera a little.
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 90, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(480);
  const near = await ui.scenePath(page, "earth-path");
  out.path[name] = { overview, near };
  // Earth is the focus, so it is at the middle of the view: the drawn line (the segments between vertices) runs on both sides of it.
  assert.ok(near?.visible && near.lineMinX !== null && near.lineMinX < 0.45 && near.lineMaxX > 0.55, `${label}/${name}: the path runs on both sides of Earth (path readout ${JSON.stringify(near)})`);
}

// Solar-system scale: Earth becomes visible, and its info panel states the factor.
async function checkSolarScaleEarth({ page, label, canvas, out, choose, closeInfo }) {
  await choose("earth", "focus-earth");
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 4, box.y + box.height / 4);
  for (let i = 0; i < 6; i += 1) await page.mouse.wheel(0, 600);
  await page.waitForTimeout(480);
  // T-102: Earth's drawn size from the scene's body readout (it replaces a bright-pixel count): enlarged under the solar-system scale, and in view as a sphere.
  const trueEarth = await ui.sceneBody(page, "earth");
  await chooseScale(page, "Solar system");
  await page.waitForTimeout(720);
  const solarEarth = await ui.sceneBody(page, "earth");
  out.earthDrawn = { trueScale: trueEarth, solarSystem: solarEarth };
  assert.ok(solarEarth?.inView && solarEarth.radiusPx > Math.max(2, 3 * trueEarth.radiusPx), `${label}: Earth is visible in the solar-system scale (radius ${trueEarth?.radiusPx} px -> ${solarEarth?.radiusPx} px)`);
  await ui.openInfo(page, "Earth");
  const earthPanel = (await ui.infoPanel(page).innerText()).replace(/\s+/g, " ");
  assert.match(earthPanel, /Earth/, `${label}: Earth's info panel opens`);
  await ui.openProvenance(page);
  const earthDetail = (await ui.provenanceDetailText(page));
  assert.match(earthDetail, /400 times larger than life/, `${label}: Earth's factor is stated`);
  out.earthFactor = earthDetail.match(/[^.]*400 times larger[^.]*\./)?.[0] ?? null;
  await closeInfo();
}

// Follow Earth through the activity window under the solar-system scale.
async function checkFollowEarth({ page, label, canvas, out, choose }, start) {
  await choose("earth", "follow-earth");
  const end = (await ui.seekRange(page)).max;
  const followed = [];
  for (const time of [start, start + (end - start) / 2, end]) {
    await seek(page, time);
    await page.waitForTimeout(600);
    followed.push(await ui.sceneBody(page, "earth"));
  }
  out.followedEarth = followed;
  assert.ok(followed.every((body) => body?.inView && body.as !== "none" && Math.abs(body.x - 0.5) < 0.15), `${label}: Earth stays in view, near the middle, while followed (${JSON.stringify(followed)})`);
}

// The Sun-Earth composition: the Sun is the scene's zero, Earth moves on its drawn path, no Moon exists, and the solar-system scale shows Earth.
async function checkSunEarth(page, label, canvas) {
  const out = (results[label].sunEarth = {});
  await checkSunEarthComposition(page, label, canvas);
  // The Sun at the origin: with the Sun focused the camera is centred on it, so its marker is at the middle of the canvas.
  const closeInfo = () => ui.closeInfo(page);
  const choose = async (objectId, presetId) => {
    await ui.pickBody(page, objectId);
    await closeInfo();
    await ui.chooseCamera(page, presetId);
    await page.waitForTimeout(900);
  };
  const start = (await ui.seekRange(page)).min;
  const peak = await ui.windowPeakTimeMs(page);
  out.path = {};
  const ctx = { page, label, canvas, out, choose, closeInfo };
  await checkPlanetOrbits(page, label, canvas, choose, closeInfo);
  // Earth on its path at the start and at the peak: overview shows the blue path; following Earth keeps the line passing both sides of it.
  for (const [name, move] of [["start", () => seek(page, start)], ["peak", async () => { await ui.goToWindowPeak(page); await page.waitForTimeout(500); await closeInfo(); }]]) {
    await move();
    await checkCometOrbitInOverview(ctx, name);
    if (name === "peak") await checkEarthPathAtPeak(ctx, name);
  }

  await checkSolarScaleEarth(ctx);
  await checkFollowEarth(ctx, start);
  void peak;
}

// Labels that are shown right now, by object id.
const shownLabels = (page) => page.evaluate(() => [...document.querySelectorAll("[data-label-id]")].filter((el) => !el.hidden).map((el) => el.dataset.labelId));

// T-102: a body's marker sits beside its label (8 px to the label's left or right, or below it). From the scene's body readout: returns 1 when the scene draws the body (a marker or a sphere,
// in view) and its centre lies within 24 px of one of those spots, else 0. It replaces a count of bright canvas pixels near the label.
async function markerBesideLabel(page, id) {
  const body = await ui.sceneBody(page, id);
  if (!body?.inView || body.as === "none") return 0;
  const box = await page.getByTestId("earth-moon-canvas").boundingBox();
  const rect = await page.locator(`[data-label-id="${id}"]`).evaluate((el) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; });
  const centreY = (rect.top + rect.bottom) / 2 - box.y;
  const spots = [[rect.left - 8 - box.x, centreY], [rect.right + 8 - box.x, centreY], [(rect.left + rect.right) / 2 - box.x, rect.bottom + 12 - box.y]];
  const [bx, by] = [body.x * box.width, body.y * box.height];
  return spots.some(([x, y]) => Math.hypot(bx - x, by - y) <= 24) ? 1 : 0;
}

// The comet and the planets are visible with labels: a zoom sweep from the whole-system Overview in to the close view shows every body's label, with a marker beside it, at some zoom;
// at true scale Earth and the planets draw as markers, and under the solar-system scale at least one planet draws as a body instead.
/** The zoom sweep: wheel in from far out until every body has shown its label with a marker beside it. Returns { seen, markerSets, sweepSteps }. */
async function sweepBodyLabels(page, bodies) {
  const seen = new Map();
  const markerSets = [];
  // T-055: a shower whose parent orbits inside Jupiter's (no wide-ranging comet) frames a smaller Overview that can leave the outer planets off screen: start the sweep from
  // farther out (the camera is held at its settings' reach), so every body is in view at the start whatever the parent.
  for (let out = 0; out < 8; out += 1) { await page.mouse.wheel(0, 500); await page.waitForTimeout(250); }
  // The sweep goes on until every body has shown its label with a marker beside it, at most 160 steps (a close system needs more zoom steps than a wide one to bring the inner planets apart).
  let sweepSteps = 0;
  for (let step = 0; step <= 160; step += 1) {
    sweepSteps = step;
    if (step > 0) { await page.mouse.wheel(0, -500); await page.waitForTimeout(500); }
    const labels = await shownLabels(page);
    markerSets.push((await page.locator("canvas").first().getAttribute("data-marker-bodies")) ?? "");
    for (const id of bodies) {
      // The first zoom at which the label is shown and a marker is found beside it (the label can show while its marker is under a control on a small screen).
      if (labels.includes(id) && !(seen.get(id)?.markerPixels > 0)) seen.set(id, { step, markerPixels: await markerBesideLabel(page, id) });
    }
    if (bodies.every((id) => seen.get(id)?.markerPixels > 0)) break;
  }
  return { seen, markerSets, sweepSteps };
}

/** The label assertions of the sweep: the Sun stays off, the desktop shows every label, the phone the Sun, Earth, the comet and two planets, and each has a marker beside it. */
async function assertBodyLabels(page, label, out, { bodies, seen, sunLabelOff }) {
  if (sunLabelOff) {
    assert.ok(!(await shownLabels(page)).includes("sun"), `${label}: the Sun's label is off by the settings`);
    assert.equal(await ui.bodyOptionCount(page, "sun"), 1, `${label}: the Sun is still in the Object menu`);
  }
  // On a 390 px screen the inner planets' labels (equal priority, all near the Sun in the flat ecliptic view) can lose the overlap contest at every zoom of the sweep:
  // the desktop must show all seven; the phone must show Sun, Earth, the comet and at least two planets, and the missing ones are recorded.
  out.labelsNeverShown = bodies.filter((id) => !seen.has(id));
  if (label === "desktop") for (const id of bodies) assert.ok(seen.has(id), `${label}: the label of ${id} is shown at some zoom of the sweep (shown at some zoom: ${[...seen.keys()].join(", ")})`);
  else {
    for (const id of ["earth", parent]) assert.ok(seen.has(id), `${label}: the label of ${id} is shown at some zoom of the sweep`);
    assert.ok(["mercury", "venus", "mars", "jupiter"].filter((id) => seen.has(id)).length >= 2, `${label}: at least two planet labels are shown (${out.labelsNeverShown} never)`);
  }
  // The comet's marker is checked in its own framing below (at the whole-system Overview it can sit under the controls on a small screen).
  for (const id of bodies.filter((body) => body !== parent && seen.has(body))) assert.ok(seen.get(id).markerPixels > 0, `${label}: ${id} has a marker beside its label in the scene readout (${seen.get(id).markerPixels})`);
}

/** Under the solar-system scale the planets are enlarged: from the whole-system Overview, zoom in until Earth and two other planets draw as bodies, not markers. */
async function checkPlanetsDrawAsBodies(page, label, canvas, out) {
  const box2 = await canvas.boundingBox();
  await page.mouse.move(box2.x + box2.width / 4, box2.y + box2.height / 4);
  const bodySteps = [];
  for (let step = 0; step < 40; step += 1) {
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(500);
    const markers = ((await page.locator("canvas").first().getAttribute("data-marker-bodies")) ?? "").split(",");
    const asBodies = ["earth", "mercury", "venus", "mars", "jupiter"].filter((id) => !markers.includes(id));
    if (asBodies.length > 0) bodySteps.push({ step, asBodies });
    // O-034 T-112: stop once the assertion below is met (Earth and two other planets seen as bodies); the rest of the 40 steps only added to a record.
    if (new Set(bodySteps.flatMap((entry) => entry.asBodies)).size >= 3 && bodySteps.some((entry) => entry.asBodies.includes("earth"))) break;
  }
  out.solarSystemBodies = bodySteps.slice(0, 3);
  const asBodyAtSomeZoom = new Set(bodySteps.flatMap((entry) => entry.asBodies));
  out.solarSystemBodySet = [...asBodyAtSomeZoom];
  assert.ok(asBodyAtSomeZoom.has("earth") && asBodyAtSomeZoom.size >= 3, `${label}: under the solar-system scale Earth and other planets draw as bodies at some zoom (${[...asBodyAtSomeZoom]})`);
}

async function checkBodies(page, label, canvas) {
  const out = (results[label].bodies = {});
  // The settings file turns the Sun's label off (owner: "we can probably turn off the sun label"): it must never be shown here, yet the Sun stays in the Object menu.
  const sunLabelOff = settingsFile.labels?.sun === false;
  const bodies = ["sun", "earth", "mercury", "venus", "mars", "jupiter", parent].filter((id) => !(sunLabelOff && id === "sun"));
  const closeInfo = () => ui.closeInfo(page);
  await ui.pickBody(page, "sun");
  await closeInfo();
  await ui.chooseCamera(page, "overview");
  await page.waitForTimeout(720);
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 4, box.y + box.height / 4);
  // The scenario is stated at true scale, so choose it (an earlier check leaves the solar-system scale on; with a close Overview an enlarged giant planet is a body, not a marker).
  await chooseScale(page, "True");
  await page.mouse.move(box.x + box.width / 4, box.y + box.height / 4);
  const { seen, markerSets, sweepSteps } = await sweepBodyLabels(page, bodies);
  out.sweepSteps = sweepSteps;
  out.labelsSeenAtZoomStep = Object.fromEntries(seen);
  await assertBodyLabels(page, label, out, { bodies, seen, sunLabelOff });
  await ui.pickBody(page, parent);
  await closeInfo();
  await ui.chooseCamera(page, "focus-parent");
  await page.waitForTimeout(1200);
  assert.ok((await shownLabels(page)).includes(parent), `${label}: the parent's label is shown when it is focused`);
  out.cometMarkerPixels = await markerBesideLabel(page, parent);
  assert.ok(out.cometMarkerPixels > 0, `${label}: the comet has a marker beside its label in the scene readout (${out.cometMarkerPixels})`);
  const trueMarkers = new Set(markerSets.flatMap((set) => set.split(",")));
  for (const id of ["earth", "mercury", "venus", "mars", "jupiter"]) assert.ok(trueMarkers.has(id), `${label}: ${id} draws as a marker at true scale`);
  out.trueScaleMarkerBodies = [...trueMarkers].filter(Boolean);

  // Solar-system scale: the planets are enlarged, so at some zoom a planet is a body, not a marker. From the whole-system Overview, zoom in.
  await ui.pickBody(page, "sun");
  await closeInfo();
  await ui.chooseCamera(page, "overview");
  await chooseScale(page, "Solar system");
  await page.waitForTimeout(900);
  await checkPlanetsDrawAsBodies(page, label, canvas, out);
  await chooseScale(page, "True");
  await page.waitForTimeout(480);
}

// The comet's whole orbit is drawn and the "Whole orbit" preset frames it: the violet line spans most of the canvas in both directions.
async function checkWholeOrbit(page, label, canvas) {
  const out = (results[label].wholeOrbit = {});
  await selectOrbit(page, parent, `${parent}-orbit`);
  await ui.closeInfo(page);
  await ui.chooseCamera(page, "whole-orbit");
  await ui.closeAllPanelsNow(page);
  await page.waitForTimeout(1500);
  // I-040: proved from the line itself (the scene's path readout) (it replaced an orbit-coloured pixel count, which the orbit's same-coloured label used to supply). The preset must frame the whole line.
  const line = await ui.scenePath(page, `${parent}-orbit`);
  out.readout = line;
  assert.ok(line?.visible, `${label}: the comet's orbit line is drawn at the peak (visible in the path readout)`);
  assert.ok(line.inView >= 0.9 * line.vertices, `${label}: the Whole orbit preset has the whole line in view (${line.inView} of ${line.vertices} vertices)`);
  assert.ok(Math.max(line.spanX, line.spanY) > 0.2, `${label}: the Whole orbit preset frames the orbit, a substantial part of the view (over 20% in one direction: the line's own vertices, measured 0.25 for the Perseids' 113-degree orbit seen nearly end-on, where the old violet-pixel box read over 30%) (${line.spanX} x ${line.spanY})`);
}

// The Sun's longitude in the J2000.0 ecliptic and equinox. CONVENTION (I-027): the IAU MDC peak solar longitudes ("All records on J2000") are J2000 values. The
// Astronomical Almanac's low-precision formula (about 0.01 deg, written here so the check does not share the app's ephemeris) gives the longitude OF DATE, so general
// precession since J2000 (5028.796195 arcsec per Julian century, IAU 2006 / Capitaine et al. 2003) is subtracted to compare J2000 with J2000.
const solarLongitudeDeg = (timeUtcMs) => {
  const n = timeUtcMs / 86_400_000 + 2_440_587.5 - 2_451_545.0;
  const meanLongitude = 280.460 + 0.9856474 * n;
  const g = ((357.528 + 0.9856003 * n) * Math.PI) / 180;
  const ofDate = meanLongitude + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g);
  const precessionDeg = (5028.796195 * (n / 36_525)) / 3600;
  return (((ofDate - precessionDeg) % 360) + 360) % 360;
};

// The crossing is at the peak: the instant the peak marker seeks to is where the Sun's longitude is the published peak solar longitude (settings radiant.peakSolarLongitudeDeg), and the rate readout is highest there.
async function checkCrossing(page, label) {
  const out = (results[label].crossing = {});
  await ui.goToWindowPeak(page);
  await page.waitForTimeout(600);
  const text = await ui.timelineText(page);
  const instant = text.match(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/)?.[0];
  assert.ok(instant, `${label}: the timeline shows the instant of the peak`);
  const longitude = solarLongitudeDeg(Date.parse(instant));
  out.peakInstant = instant;
  out.solarLongitudeDeg = Number(longitude.toFixed(3));
  const published = settingsFile.radiant.peakSolarLongitudeDeg;
  out.publishedSolarLongitudeDeg = published;
  out.differenceDeg = Number((longitude - published).toFixed(3));
  // ASTRAEUS_SOFT_PEAK=1 (a supplementary run only) records a miss instead of stopping, so the scenarios after this one still run; the default run is strict.
  if (process.env.ASTRAEUS_SOFT_PEAK === "1" && !(Math.abs(longitude - published) < 0.3)) out.peakToleranceMiss = `solar longitude ${longitude.toFixed(2)} vs published ${published}`;
  else assert.ok(Math.abs(longitude - published) < 0.3, `${label}: the peak instant ${instant} has solar longitude ${longitude.toFixed(2)}, within 0.3 deg of the published ${published}`);
  const rates = [];
  // T-080 moved the "Inside: ... N meteors per hour" readout into the Events popover; open it to read the rate. The window caption now also says "peak N meteors per hour" (a constant), so the match is the "Inside:" line, the live rate (it stays open across the seeks, closed again below).
  await ui.openEventList(page);
  // Ten days either side of the peak when the window has them, else one day short of the nearer window edge (a short window, such as a December shower's, ends a few days after its peak).
  const edgeDays = Math.floor(Math.min(Date.parse(settingsFile.activity.peakUtc) - Date.parse(settingsFile.activity.startUtc), Date.parse(settingsFile.activity.endUtc) - Date.parse(settingsFile.activity.peakUtc)) / 86_400_000);
  const offsetDays = Math.min(10, edgeDays - 1);
  out.rateOffsetDays = offsetDays;
  for (const days of [-offsetDays, 0, offsetDays]) { await seek(page, Date.parse(instant) + days * 86_400_000); rates.push(Number((await ui.timelineText(page)).match(/Inside:[^\n]*?([\d.,]+) meteors per hour/)?.[1]?.replace(/,/g, ""))); }
  out.rateAtMinus10dPeakPlus10d = rates;
  assert.ok(rates[1] > rates[0] && rates[1] > rates[2], `${label}: the rate readout is highest at the peak (${rates})`);
  await ui.closeEventList(page);
  await ui.goToWindowPeak(page);
  await page.waitForTimeout(400);
}

// With the orbit file blocked the stream is not drawn and nothing stands in for it.
async function checkNotFetched() {
  const page = await openPage({ width: 1280, height: 800 });
  try {
    // As the dev server answers an unfetched path: the app's page, 200, not JSON (a 404 would be logged as a console error by the browser itself). The dev server falls back to the story's
    // shipped copy when the local file is absent, so both are blocked (the bare file fetch, not vite's ?url module).
    const app = (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>app</title>" });
    await page.route("**/data/local/gmn-iau-*.json", app);
    await page.route((url) => url.pathname.startsWith("/data/stories/") && url.pathname.endsWith(".json") && url.search === "", app);
    await page.goto(`${base}?experience=showers&shower=${shower}&sky=off`);
    await page.waitForSelector("canvas");
    await ui.waitForShell(page);
    const canvas = page.getByTestId("earth-moon-canvas");
    assert.equal(await canvas.getAttribute("data-point-groups"), "0", "not fetched: no stream group is drawn");
    assert.equal(await ui.bodyOptionCount(page, `${shower}-stream`), 1, "not fetched: the stream is still listed, to say so");
    await ui.pickBody(page, `${shower}-stream`);
    await ui.openInfo(page, streamButtonName);
    const text = (await ui.infoPanel(page).innerText()).replace(/\s+/g, " ");
    assert.match(text, /not fetched on this machine/i, "not fetched: the panel says so");
    assert.match(text, new RegExp(`node tools/data/fetch-meteoroid-orbits\\.mjs ${settingsFile.stream.iauCode} --months ${gmnSettings.months.join(",")}`), "not fetched: the panel gives the GMN fetch command");
    assert.ok(!text.includes("--source"), "not fetched: the command has no removed --source flag");
    results.notFetched = { panel: text.slice(0, 400) };
    // The rest of the scene is still there.
    assert.equal(await canvas.getAttribute("data-bodies"), mountedBodies.join(","), "not fetched: the bodies are still drawn");
  } finally {
    await page.close();
  }
}

// The frame rate with every member drawn, from the Developer counter (software GL here: an indication, not the owner's machine).
async function checkFrameRate(page, label) {
  await ui.pickBody(page, `${shower}-stream`);
  await ui.closeInfo(page);
  await ui.toggleDeveloper(page);
  await page.locator("[data-frame-fps]").waitFor({ timeout: 10000 });
  await page.waitForTimeout(2400);
  const fps = Number(await page.locator("[data-frame-fps]").innerText());
  results[label].fpsSoftwareGl = { members: results[label].members, fps };
  assert.ok(Number.isFinite(fps) && fps > 0, `${label}: the Developer counter reads a frame rate (${fps})`);
}

// Frames the stream with its Focus preset, so its dots are in view.
async function frameStream(page) {
  await ui.pickBody(page, `${shower}-stream`);
  await ui.closeInfo(page);
  await ui.chooseCamera(page, "focus-stream");
  await page.waitForTimeout(900);
}

// Looping playback (owner, 2026-10-15: "needs to play in a loop, as disappears when reaches the end"): playing past the end of the window wraps the time back inside it
// and the stream is still drawn; with ?loop=off the time runs past the end and the stream is gone (the cause).
async function checkLoop(page, label, canvas) {
  const out = (results[label].loop = {});
  const timeOf = async () => Date.parse((await ui.timelineText(page)).match(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/)?.[0]);
  const min = (await ui.seekRange(page)).min;
  const max = (await ui.seekRange(page)).max;
  await frameStream(page);
  await seek(page, max - 2 * 86_400_000);
  await ui.ensurePlaying(page);
  const seen = [];
  for (let i = 0; i < 30; i += 1) { await page.waitForTimeout(60); seen.push(await timeOf()); }
  // A story panel (the Perseids' "earth-crossing") auto-opens while playback runs across its event and covers the controls; close it before pausing (pre-existing since the story panels, found in T-067).
  await ui.closeStoryPanelIfOpen(page);
  await ui.pausePlayback(page);
  out.times = seen.map((t) => new Date(t).toISOString());
  const wrapped = seen.findIndex((t, k) => k > 0 && t < seen[k - 1]);
  assert.ok(wrapped > 0, `${label}: the time wraps back after the end (${out.times.join(" ")})`);
  assert.ok(seen.every((t) => t >= min - 86_400_000 && t <= max + 86_400_000), `${label}: the time stays inside the window while looping (to within one frame, under a day at this rate; ${out.times.join(' ')})`);
  out.litAfterWrap = await litPixels(page);
  logLit(`${label}/after-wrap`, out.litAfterWrap);
  assert.ok(out.litAfterWrap > 150, `${label}: dots are still drawn after the wrap (${out.litAfterWrap} in view)`);
  assert.equal(await canvas.getAttribute("data-point-groups"), "1", `${label}: the stream group is still mounted after the wrap`);
}

// With ?loop=off the shower runs past its end and the stream is not drawn: what the owner saw.
async function checkLoopOff() {
  const page = await openPage({ width: 1280, height: 800 });
  try {
    await page.goto(`${base}?experience=showers&shower=${shower}&sky=off&loop=off`);
    await page.waitForSelector("canvas");
    await ui.waitForShell(page);
    await ui.pausePlayback(page);
    const max = (await ui.seekRange(page)).max;
    await seek(page, max - 1000);
    await frameStream(page);
    const litAtEnd = await litPixels(page);
    await ui.playPlayback(page);
    await page.waitForTimeout(1800);
    const text = await ui.timelineText(page);
    const t = Date.parse(text.match(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/)?.[0]);
    results.loopOff = { time: new Date(t).toISOString(), pastEnd: t > max, litAtEnd, lit: await litPixels(page) };
    assert.ok(t > max, "loop off: the time runs past the end of the window");
    logLit("loop-off/at-end", litAtEnd); logLit("loop-off/past-end", results.loopOff.lit);
    assert.ok(litAtEnd > 150 && results.loopOff.lit < 0.7 * litAtEnd, `loop off: the stream dots are gone past the end (${litAtEnd} dots in view at the end, ${results.loopOff.lit} past it; orbit lines remain)`);
  } finally {
    await page.close();
  }
}

// Ecliptic-up view (owner, 2026-10-15: "ours seems to be on a different plane to meteorshowers"): Earth's path, a circle in the ecliptic, is a flat ellipse whose
// major axis is horizontal (its minor axis vertical) within 8 degrees, and its height is under half its width. With ?up=equatorial it is tilted by the obliquity.
// T-102: Earth's path as the scene reports it (the path readout's vertices in view, their box and major-axis angle on screen), not a fit to blue pixels.
const pathShape = async (page) => {
  const line = await ui.scenePath(page, "earth-path");
  if (!line?.visible || line.inView < 3) return { n: 0, angleDeg: 0, width: 0, height: 0, canvasWidth: 1, vertices: line?.vertices ?? 0 };
  // Widths in screen proportions: the box shares times the view's aspect for x, so width and height compare as pixels would.
  return { n: line.inView, angleDeg: line.axisDeg, width: line.spanX * line.aspect, height: line.spanY, canvasWidth: line.aspect, vertices: line.vertices };
};

async function checkEclipticFlat(page, label, query, expectFlat) {
  const out = (results[label].eclipticFlat ??= {});
  const p = await openPage(page.viewportSize());
  try {
    await p.goto(`${base}?experience=showers&shower=${shower}&sky=off${ENGINE_DEFAULT_VIEW}${query}`);
    await p.waitForSelector("canvas");
    await ui.waitForShell(p);
    await ui.pausePlayback(p);
    await ui.pickBody(p, "sun");
    await ui.closeInfo(p);
    await ui.chooseCamera(p, "overview");
    await p.waitForTimeout(900);
    const box = await p.getByTestId("earth-moon-canvas").boundingBox();
    await p.mouse.move(box.x + box.width / 4, box.y + box.height / 4);
    let shape = await pathShape(p);
    for (let k = 0; k < 160 && !(shape.n >= 0.98 * shape.vertices && shape.width > 0.3 * shape.canvasWidth && shape.width < 0.97 * shape.canvasWidth); k += 1) {
      await p.mouse.wheel(0, -120);
      await p.waitForTimeout(250);
      shape = await pathShape(p);
    }
    out[query || "default"] = shape;
    assert.ok(shape.n >= 0.98 * shape.vertices && shape.vertices > 0, `${label}${query}: Earth's whole path is found in view (${shape.n} of ${shape.vertices} vertices)`);
    if (expectFlat) {
      assert.ok(Math.abs(shape.angleDeg) < 8, `${label}${query}: the path's major axis is horizontal within 8 deg (${shape.angleDeg.toFixed(1)})`);
      assert.ok(shape.height < 0.5 * shape.width, `${label}${query}: the path is a flat ellipse (${shape.width.toFixed(3)} x ${shape.height.toFixed(3)} of the view)`);
    } else {
      assert.ok(Math.abs(shape.angleDeg) > 8 || shape.height > 0.5 * shape.width, `${label}${query}: with celestial-north up the path is tilted (${shape.angleDeg.toFixed(1)} deg)`);
    }
  } finally {
    await p.close();
  }
}

// Whole-year timeline (owner, 2026-10-16: "can we make this run for a whole year?"): the timeline spans about 365 days, from the settings' year start (O-024 T-092) or with the peak in the middle, the activity window and
// the peak stay marked, the rate reads "outside the activity window" away from it, the default playback rate is a week per second, and at the start, middle and end of the year the
// dots and Earth are drawn. ?span=activity gives the activity window alone.
async function checkYear(page, label, canvas) {
  const out = (results[label].year = {});
  const { min, max } = await ui.seekRange(page);
  const days = (max - min) / 86_400_000;
  out.spanDays = Number(days.toFixed(3));
  assert.ok(Math.abs(days - 365.25) < 1, `${label}: the timeline spans about a year (${days.toFixed(2)} days)`);
  const peak = Date.parse(settingsFile.activity.peakUtc);
  // O-024 T-092: a settings file may start the year on a given date (the Showers demo: 21 September 2019); without one the year is centred on the peak.
  const yearStart = settingsFile.timeline.yearStartUtc;
  out.yearStartUtc = yearStart ?? null;
  if (yearStart !== undefined) assert.ok(Math.abs(min - Date.parse(yearStart)) < 1000, `${label}: the timeline starts at the settings' year start ${yearStart} (${new Date(min).toISOString()})`);
  else assert.ok(Math.abs((peak - min) / (max - min) - 0.5) < 0.005, `${label}: the peak is mid-timeline`);
  assert.ok(peak > min && peak < max, `${label}: the peak lies inside the year`);
  assert.equal(await ui.glowCount(page), 1, `${label}: the activity glow is still drawn`);
  assert.equal(await ui.windowPeak(page).count(), 1, `${label}: the peak is still marked`);
  out.playbackRate = await ui.speed(page);
  assert.equal(out.playbackRate, String(settingsFile.timeline.rateSecondsPerSecond), `${label}: the default playback rate is the settings file's (${settingsFile.timeline.rateSecondsPerSecond} s per s, a week per second)`);
  await frameStream(page);
  out.instants = {};
  for (const [name, t] of [["start", min], ["middle", min + (max - min) / 2], ["end", max]]) {
    await seek(page, t);
    await frameStream(page);
    const lit = await litPixels(page);
    // Was 1000 for the Perseids by an amber count. The stream's colour is now the settings file's, and a shower's own geometry changes how many dots fall in this framing
    // (Geminids: a few hundred at the year's start, when its dots are spread widest), so the floor is the 150 pixels the other scenarios here use for "dots are visible".
    const litFloor = 150;
    logLit(`${label}/year-${name}`, lit);
    assert.ok(lit > litFloor, `${label}/year-${name}: dots are drawn (${lit}, floor ${litFloor})`);
    const labels = await shownLabels(page);
    // Earth: its label (it is a selected-by-priority item at every zoom of this framing) or, failing that, its path (the scene's path readout).
    const earthLine = await ui.scenePath(page, "earth-path");
    const earthPath = earthLine?.visible ? earthLine.inView : 0;
    out.instants[name] = { lit, earthLabel: labels.includes("earth"), earthPathVerticesInView: earthPath };
    assert.ok(labels.includes("earth") || earthPath > 10, `${label}/year-${name}: Earth is drawn (label ${labels.includes("earth")}, path vertices in view ${earthPath})`);
    if (name === "start") {
      await ui.openInfo(page, streamButtonName);
      const text = (await ui.infoPanel(page).innerText()).replace(/\s+/g, " ");
      assert.match(text, /outside the activity window/i, `${label}: away from the activity window the rate says so`);
      await ui.closeInfo(page);
    }
  }
}

async function checkSpanActivity() {
  const page = await openPage({ width: 1280, height: 800 });
  try {
    await page.goto(`${base}?experience=showers&shower=${shower}&sky=off&span=activity`);
    await page.waitForSelector("canvas");
    await ui.waitForShell(page);
    const spanRange = await ui.seekRange(page);
    const days = (spanRange.max - spanRange.min) / 86_400_000;
    results.spanActivity = { days: Number(days.toFixed(3)) };
    assert.ok(Math.abs(days - (Date.parse(settingsFile.activity.endUtc) - Date.parse(settingsFile.activity.startUtc)) / 86_400_000) < 0.01, `?span=activity: the timeline is the activity window (${days} days)`);
  } finally {
    await page.close();
  }
}

// Orbit sets (owner, 2026-10-16, to compare all orbits with reliable-only): the panel says which set is shown, its count and the cited rule; ?orbits=reliable draws the smaller set;
// Developer > Display settings offers both and choosing one reloads with it.
const reliableCount = () => {
  const rows = rowsOfFile(JSON.parse(readFileSync(orbitFile, "utf8")));
  const rule = settingsFile.stream.quality.rule;
  const isReliable = (r) => r[7] >= rule.minConvergenceAngleDeg && r[9] <= rule.maxVelocityErrorFraction * r[8];
  return { all: rows.length, reliable: rows.filter(isReliable).length };
};

async function checkQuality() {
  const counts = reliableCount();
  const out = (results.quality = { counts });
  const page = await openPage({ width: 1280, height: 800 });
  try {
    for (const set of ["all", "reliable"]) {
      await page.goto(`${base}?experience=showers&shower=${shower}&sky=off&orbits=${set}`);
      await page.waitForSelector("canvas");
      await ui.waitForShell(page);
      await ui.pausePlayback(page);
      await ui.pickBody(page, `${shower}-stream`);
      await ui.openInfo(page, streamButtonName);
      const description = (await ui.infoPanel(page).innerText()).replace(/\s+/g, " ");
      assert.match(description, new RegExp(`${counts[set]} measured meteoroid orbits`), `orbits=${set}: the stream describes ${counts[set]} orbits`);
      await ui.openProvenance(page);
      const detail = (await ui.provenanceDetailText(page));
      const sentence = detail.match(/Orbit set shown:[^]*?GMN has no double-entry flag\./)?.[0] ?? "";
      out[set] = sentence.slice(0, 700);
      assert.match(sentence, new RegExp(`Orbit set shown: ${set === "all" ? "all orbits" : "reliable orbits only"} \\(${counts[set]} of ${counts.all} bound orbits`), `orbits=${set}: the panel says which set and its count`);
      assert.match(sentence, new RegExp(`has ${counts.reliable} and cuts ${counts.all - counts.reliable}`), `orbits=${set}: both counts are stated`);
      const rule = settingsFile.stream.quality.rule;
      assert.ok(sentence.includes(`Qc (the maximum convergence angle between the stations that saw the meteor) at least ${rule.minConvergenceAngleDeg}° and the Vgeo sigma at most ${Math.round(rule.maxVelocityErrorFraction * 100)}% of Vgeo`), `orbits=${set}: the rule is stated, mapped to the GMN columns`);
      assert.ok(sentence.includes(rule.source.name.split(/[,(:]/)[0].trim()), `orbits=${set}: the rule is cited (${rule.source.name.split(/[,(:]/)[0].trim()})`);
      assert.ok(sentence.includes(rule.quote.slice(1, 46)), `orbits=${set}: the published wording is quoted`);
      assert.ok(sentence.includes(gmnSettings.ruleNote) && sentence.endsWith("GMN has no double-entry flag."), `orbits=${set}: the GMN rule note and the no-double-entry statement are given`);
      assert.match(detail, new RegExp(`${counts[set]} orbits drawn`), `orbits=${set}: the provenance counts the orbits drawn`);
      assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-point-groups"), "1", `orbits=${set}: the stream is drawn`);
    }
    // The live switch: Developer > Display settings, choosing the other set reloads with it.
    await page.goto(`${base}?experience=showers&shower=${shower}&sky=off`);
    await page.waitForSelector("canvas");
    await ui.toggleDeveloper(page);
    assert.equal(await ui.orbitSetPressed(page, "all"), true, "the default set is all orbits");
    await ui.pressOrbitSetAndWait(page, "reliable", /orbits=reliable/);
    await page.waitForSelector("canvas");
    await ui.toggleDeveloper(page);
    assert.equal(await ui.orbitSetPressed(page, "reliable"), true, "after the switch the reliable set is active");
  } finally {
    await page.close();
  }
}

// O-017 T-067: the source switch and the ?source= address are gone. The Developer panel offers no "Orbits from ..." button, and the old address is ignored: the GMN stream is
// still drawn and no CAMS file is requested.
async function checkRemovedSwitches() {
  const page = await openPage({ width: 1280, height: 800 });
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  try {
    await page.goto(`${base}?experience=showers&shower=${shower}&source=cams&stars=yale&sky=off`);
    await page.waitForSelector("canvas");
    await ui.waitForShell(page);
    await page.waitForTimeout(1500);
    assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-point-groups"), "1", "removed ?source=cams: the GMN stream is still drawn");
    await ui.toggleDeveloper(page);
    assert.equal(await ui.orbitSourceButtons(page).count(), 0, "no source switch is offered");
    assert.ok(!requests.some((url) => /cams-iau|yale-bsc/.test(url)), `no CAMS or Yale file is requested (${requests.filter((url) => /cams-iau|yale-bsc/.test(url)).join(" ")})`);
    results.removedSwitches = "?source=cams&stars=yale ignored; no source switch; no CAMS or Yale request";
  } finally {
    await page.close();
  }
}

// Up direction as a live setting (owner, 2026-10-16: "we should have that as another variable"): Developer > Display settings offers both, the default is the settings file's
// (ecliptic), and switching changes the camera's up vector with no reload.
async function checkUpToggle(page, label) {
  const out = (results[label].upToggle = {});
  const canvasElement = page.locator("canvas").first();
  const up = async () => (await canvasElement.getAttribute("data-camera-up")).split(",").map(Number);
  await ui.toggleDeveloper(page);
  assert.equal(await ui.toggleOn(page, "ecliptic"), true, `${label}: the default up direction is the settings file's (ecliptic)`);
  out.default = await up();
  assert.ok(Math.abs(out.default[0]) < 1e-5 && Math.abs(out.default[1] - 0.917482) < 1e-5 && Math.abs(out.default[2] - 0.397777) < 1e-5, `${label}: the camera's up is ecliptic north (${out.default})`);
  await page.evaluate(() => { window.__noReload = true; });
  await ui.pressToggle(page, "equatorial");
  await page.waitForTimeout(500);
  out.equatorial = await up();
  assert.deepEqual(out.equatorial.map((v) => Math.round(v * 1e5) / 1e5), [0, 1, 0], `${label}: switching to Earth's pole turns the camera's up to celestial north (${out.equatorial})`);
  assert.equal(await page.evaluate(() => window.__noReload === true), true, `${label}: switching did not reload the page`);
  await ui.pressToggle(page, "ecliptic");
  await page.waitForTimeout(500);
  assert.deepEqual((await up()).map((v) => Math.round(v * 1e5) / 1e5), out.default.map((v) => Math.round(v * 1e5) / 1e5), `${label}: switching back restores the ecliptic up`);
  await ui.toggleDeveloper(page);
}

// T-091: the Showers switch. Every shower opens at ?experience=showers&shower=<name>; the top bar (the phone drawer) offers a button per shower; choosing another opens that
// shower (its own stream and parent, the old view and time dropped) and only the chosen shower's orbit file is requested; choosing back returns here (both directions across the two runs).
async function checkSwitch(label, viewport) {
  const others = readdirSync(showersDir).filter((file) => file.endsWith(".json")).map((file) => file.slice(0, -".json".length)).filter((name) => name !== shower);
  assert.ok(others.length > 0, `${label}: a second shower to switch to`);
  const other = others[0];
  const otherSettings = JSON.parse(readFileSync(new URL(`${other}.json`, showersDir), "utf8"));
  const page = await openPage(viewport);
  const requested = [];
  // A dev-server module request for a picture or data address (`?import`, how the bundler learns its url) is not a download of that file.
  page.on("request", (request) => { const address = new URL(request.url()); if (!address.searchParams.has("import")) requested.push(address.pathname); });
  try {
    await page.goto(`${base}?experience=showers&shower=${shower}&sky=off&view=sun,100,40,250000&t=2020-01-01T00:00:00Z`);
    await page.waitForSelector("canvas");
    await ui.waitForShell(page);
    const state = await ui.experienceSwitchState(page);
    assert.ok(state !== null, `${label}: the Showers experience offers a switch`);
    assert.equal(state.name, "Shower", `${label}: the switch is named Shower`);
    assert.deepEqual(state.options.filter((option) => option.active).map((option) => option.value), [shower], `${label}: the switch shows ${shower} as chosen`);
    assert.ok(state.options.some((option) => option.value === other && option.label === otherSettings.label), `${label}: the switch offers ${otherSettings.label}`);
    assert.ok(!requested.some((path) => new RegExp(`/gmn-iau-${otherSettings.stream.iauCode}[^/]*\\.json$`).test(path)), `${label}: ${other}'s orbit file was not requested for ${shower} (${requested.filter((path) => path.includes("gmn-iau"))})`);
    await ui.chooseSwitchOption(page, other);
    const there = new URL(page.url()).searchParams;
    assert.equal(there.get("experience"), "showers", `${label}: switching keeps the experience`);
    assert.ok(!there.has("view") && !there.has("t"), `${label}: switching drops the old view and time`);
    assert.equal(there.get("sky"), "off", `${label}: switching keeps the other settings`);
    assert.equal(await ui.bodyOptionCount(page, `${other}-stream`), 1, `${label}: ${other}'s stream is listed after switching`);
    assert.equal(await ui.bodyOptionCount(page, streamId(shower)), 0, `${label}: ${shower}'s stream is gone after switching`);
    assert.ok((await ui.experienceSwitchState(page)).options.find((option) => option.value === other).active, `${label}: the switch shows ${other} as chosen`);
    assert.ok(requested.some((path) => new RegExp(`/gmn-iau-${otherSettings.stream.iauCode}[^/]*\\.json$`).test(path)), `${label}: ${other}'s orbit file is requested once chosen`);
    await ui.chooseSwitchOption(page, shower);
    assert.equal(await ui.bodyOptionCount(page, streamId(shower)), 1, `${label}: switching back returns to ${shower}`);
    assert.equal(await ui.bodyOptionCount(page, `${other}-stream`), 0, `${label}: ${other}'s stream is gone after switching back`);
    results[label].switch = { name: state.name, options: state.options.map((option) => option.value) };
  } finally {
    await page.close();
  }
}
const streamId = (name) => `${name}-stream`;

// I-028 and T-063: a plain load opens on the experience's overview (the stream drawn, the Sun not a close-up) and on look.startView when the shower declares one.
// Returns the start-view reading, or undefined.
async function checkPlainLoad(label, viewport) {
  // I-028: a plain load (no preset clicked, sky on) opens on the experience's overview: the stream is drawn and the Sun's disc does not cover the canvas.
  let startViewRead;
  const plain = await openPage(viewport);
  try {
    await plain.goto(`${base}?experience=showers&shower=${shower}`);
    await plain.waitForSelector("canvas");
    await ui.waitForShell(plain);
    await plain.waitForTimeout(1500);
    const plainLit = logLit(`${label}/plain-load`, await litPixels(plain));
    assert.ok(plainLit > 50, `${label}: a plain load shows the stream (${plainLit} dots in view)`);
    // T-102: "not a close-up of the Sun" from the scene's body readout: the Sun's drawn radius is under a quarter of the view's height (it was: stream-coloured pixels under 30% of the area).
    const plainSun = await ui.sceneBody(plain, "sun");
    logLit(`${label}/plain-sun-radius-px`, plainSun?.radiusPx);
    assert.ok(plainSun !== undefined && plainSun.radiusPx < 0.25 * viewport.height, `${label}: a plain load is not a close-up of the Sun (its radius is ${plainSun?.radiusPx} px in a view ${viewport.height} px high)`);
    // T-063: a shower that declares look.startView opens on it.
    const declared = settingsFile.look?.startView;
    if (declared !== undefined) {
      await ui.toggleDeveloper(plain);
      const text = await plain.getByTestId("view-values").innerText();
      const match = /View: ([^,]+),([\d.-]+),([\d.-]+),([\d.-]+)/.exec(text);
      assert.ok(match, `${label}: the view readout reads (${text})`);
      const [focus, az, el, dist] = [match[1], Number(match[2]), Number(match[3]), Number(match[4])];
      const gap = Math.abs(((az - declared.azimuthDeg + 540) % 360) - 180);
      startViewRead = { declared, read: { focus, az, el, dist } };
      assert.equal(focus, declared.focus, `${label}: a plain load opens on the declared focus`);
      assert.ok(gap < 1.5 && Math.abs(el - declared.elevationDeg) < 1.5 && Math.abs(dist - declared.distance) / declared.distance < 0.02, `${label}: a plain load opens at look.startView (read ${az}, ${el}, ${dist}; declared ${declared.azimuthDeg}, ${declared.elevationDeg}, ${declared.distance})`);
    }
  } finally {
    await plain.close();
  }
  return startViewRead;
}

// The stream's details: the radiant, the illustrative marking, the credited source, the member count and the stated clump model.
async function checkStreamDetails(page, label, panel) {
  // The radiant and the published/modelled split are visible in the stream's details.
  const text = await panel.innerText();
  assert.match(text, /Radiant/, `${label}: radiant readout`);
  assert.match(text, new RegExp(`RA ${settingsFile.radiant.raDeg.toFixed(1)}`), `${label}: radiant right ascension (${settingsFile.radiant.raDeg})`);
  assert.match(text, new RegExp(`Dec \\+?${settingsFile.radiant.decDeg.toFixed(1)}`), `${label}: radiant declination (${settingsFile.radiant.decDeg})`);
  assert.match(text, /J2000/, `${label}: the radiant frame is stated`);
  assert.ok(text.includes(settingsFile.radiant.source.name.split(/[,(:]/)[0].trim()), `${label}: the radiant cites its source (${settingsFile.radiant.source.name.split(/[,(:]/)[0].trim()})`);
  assert.match(await ui.provenanceBadgeText(page), /^Illustrative/, `${label}: the stream is marked illustrative`);
  await ui.openProvenance(page);
  const detail = await ui.provenanceDetailRaw(page);
  for (const text of ["Global Meteor Network", gmnSettings.licence, "Vida", "506(4)", "491(2)", ...gmnSettings.months, `${fetched.counts.kept} bound orbits in the file`]) assert.ok(detail.includes(text), `${label}: the measured source is credited ("${text}")`);
  // The published rule's quote (a citation of the 2025 papers) still says the papers applied it "to the CAMS v3.0 database"; that is their wording, not a data source here.
  assert.ok(!/CAMS Meteoroid Orbit Database|cams\.seti|Jenniskens et al\. 2018/.test(detail), `${label}: the panel cites no CAMS data source`);
  assert.match(detail, new RegExp(`${fetched.counts.kept} orbits drawn`), `${label}: the member count equals the fetched file's (${fetched.counts.kept})`);
  assert.match(detail, /position of each dot along its orbit is illustrative/i, `${label}: the position along each orbit is stated illustrative`);
  const clump = settingsFile.stream.concentration;
  assert.match(detail, new RegExp(`clump near ${escapeRegExp(settingsFile.parentBody)} is a model: ${Math.round(clump.fraction * 100)}% of the dots are placed within ±${clump.widthDeg}° of ${escapeRegExp(settingsFile.parentBody)}'s orbital phase \\(${clump.status === "cited" ? "cited" : "illustrative defaults"}`, "i"), `${label}: the clump is a stated model with its fraction, width and status`);
  assert.match(detail, new RegExp(`band at ${escapeRegExp(settingsFile.parentBody)}'s phase, not a blob on ${escapeRegExp(settingsFile.parentBody)}`, "i"), `${label}: the clump is described as a band at the parent's phase`);
  assert.match(detail, /Parts of the stream that miss Earth are not shown/i, `${label}: the unseen parts of the stream are stated`);
  assert.doesNotMatch(detail, /invented|Modelled spread/i, `${label}: no invented stream remains`);
  const panelText = (await panel.innerText()).replace(/\s+/g, " ");
  const counted = Number(panelText.match(/(\d+) measured meteoroid orbits/)?.[1] ?? Number.NaN);
  assert.equal(counted, fetched.counts.kept, `${label}: the stream's description counts every measured orbit drawn`);
  results[label].members = counted;
}

async function run(label, viewport) {
  const phoneOnce = label === "phone" || lightRun;
  const page = await openPage(viewport);
  const streamId = `${shower}-stream`;
  try {
    const startViewRead = await checkPlainLoad(label, viewport);
    await page.goto(`${base}?experience=showers&shower=${shower}&sky=off${ENGINE_DEFAULT_VIEW}`);
    await page.waitForSelector("canvas");
    await ui.waitForShell(page);
    const canvas = page.getByTestId("earth-moon-canvas");
    assert.ok(haveOrbits, `${label}: the measured orbits are fetched (node tools/data/fetch-meteoroid-orbits.mjs ${settingsFile.stream.iauCode}); the not-fetched case is checked separately`);
    assert.equal(await canvas.getAttribute("data-point-groups"), "1", `${label}: one stream group is mounted`);
    assert.equal(await ui.bodyOptionCount(page, streamId), 1, `${label}: the stream is listed once`);
    assert.equal(await ui.bodyOptionCount(page, "columbia"), 0, `${label}: no Apollo objects`);
    assert.equal(await ui.bodyOptionCount(page, "moon"), 0, `${label}: no Moon item`);
    // A DOM click: on the phone a story panel can auto-open over the button while the page settles (it intercepted a pointer click once under load, T-071).
    await ui.pausePlaybackNow(page);

    // The activity window and its peak are on the timeline.
    // T-084: the strip above the timeline is gone; the activity is a glow in the track. Scenario map: window band -> the glow; rate curve drawn -> a gradient that peaks mid-window; band label -> the glow's text equivalent.
    assert.equal(await ui.glowCount(page), 1, `${label}: one activity glow`);
    assert.equal(await ui.windowPeak(page).count(), 1, `${label}: the peak is marked`);
    const windowLabel = await ui.glowText(page);
    assert.match(windowLabel, new RegExp(`peak [\\d.,]+ meteors per hour`), `${label}: the glow says what it shows and the peak rate`);
    const gradient = (await ui.glowGradients(page)).ahead;
    const stops = [...gradient.matchAll(/rgba\([^)]*, ([\d.]+)\) ([\d.]+)%/g)].map((m) => ({ alpha: Number(m[1]), at: Number(m[2]) }));
    const brightest = stops.reduce((a, b) => (b.alpha > a.alpha ? b : a));
    // Where the peak sits along the track: mid-timeline for a year centred on the peak, elsewhere for a year with its own start (O-024 T-092).
    const track = await ui.seekRange(page);
    const peakPct = (100 * (Date.parse(settingsFile.activity.peakUtc) - track.min)) / (track.max - track.min);
    assert.ok(stops.length > 200 && Math.abs(brightest.at - peakPct) < 1, `${label}: the glow is smooth and brightest at the peak, ${peakPct.toFixed(1)}% along the timeline (${stops.length} stops, brightest at ${brightest.at}%)`);
    assert.ok(stops[0].alpha > 0 && stops[0].alpha < brightest.alpha / 3, `${label}: the quiet track is fainter but visible`);
    assert.match(await ui.glowTooltipAt(page, peakPct / 100), /meteors per hour/, `${label}: hovering the peak night gives its rate`);
    // The glow's numbers are live settings (owner rule): lifting the quiet brightness lifts the quiet stops, and the played part follows the playhead.
    await ui.openDeveloper(page);
    await ui.dragSlider(page, "glow-quiet", 0.6);
    const lifted = [...(await ui.glowGradients(page)).ahead.matchAll(/rgba\([^)]*, ([\d.]+)\) /g)].map((m) => Number(m[1]));
    assert.ok(lifted[0] >= 0.59, `${label}: the quiet brightness setting changes the glow live (${lifted[0]})`);
    await ui.dragSlider(page, "glow-quiet", stops[0].alpha);
    await ui.closeDeveloper(page);
    const timelineBox = await ui.windowParts(page).bar.boundingBox();
    results[label] = { windowLabel, timelineHeightPx: Math.round(timelineBox.height * 10) / 10, readings: {} };
    assert.ok(timelineBox.height <= (page.viewportSize().width < 700 ? 130 : 70), `${label}: the timeline is the one slim line (${timelineBox.height} px)`);
    if (startViewRead !== undefined) results[label].startView = startViewRead;

    // Step to window start, peak and end; the stream is drawn and the rate readout follows the curve.
    const panel = ui.infoPanel(page);
    // Select the stream, frame it with the Focus stream preset, then open its details with Info.
    const focusStream = async () => {
      await ui.pickBody(page, "earth");
      await ui.pickBody(page, streamId);
      await ui.closeInfo(page);
      assert.ok(await ui.cameraOffered(page, "focus-stream"), `${label}: Focus stream preset exists`);
      await ui.chooseCamera(page, "focus-stream");
      await page.waitForTimeout(1500);
    };
    const openDetails = async () => {
      await ui.openInfo(page, streamButtonName);
      await panel.waitFor();
      assert.equal(await panel.getAttribute("data-info-id"), streamId, `${label}: the stream's details are shown`);
    };

    // T-038: the timeline now spans a year; the start, peak and end scenarios below are the activity window's, from the settings file.
    const start = String(Date.parse(settingsFile.activity.startUtc));
    const end = String(Date.parse(settingsFile.activity.endUtc));
    for (const [name, move] of [
      ["start", () => seek(page, Number(start))],
      ["peak", async () => { await ui.goToWindowPeak(page); await page.waitForTimeout(500); }],
      ["end", () => seek(page, Number(end))],
    ].filter(([name]) => !phoneOnce || name === "peak")) {
      await move();
      // Jumping to the peak opens the window's details; frame the stream again, then read its own details.
      await focusStream();
      const lit = await litPixels(page);
      logLit(`${label}/${name}`, lit);
      assert.ok(lit > 150, `${label}/${name}: stream dots are visible (${lit} in view)`);
      await openDetails();
      const text = await panel.innerText();
      assert.match(text, /Activity rate/, `${label}/${name}: rate readout is shown`);
      results[label].readings[name] = { lit, panel: text.replace(/\s+/g, " ").slice(0, 900) };
    }
    // Zoomed far out the stream and Earth are in one view.
    await focusStream();
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width / 4, box.y + box.height / 4);
    for (let i = 0; i < 8; i += 1) await page.mouse.wheel(0, 600);
    await page.waitForTimeout(800);
    results[label].zoomedOutLit = await litPixels(page);
    assert.ok(results[label].zoomedOutLit > 150, `${label}: stream visible zoomed out (${results[label].zoomedOutLit})`);
    await openDetails();
    // The readout rises to the peak and falls again.
    const rateOf = (name) => Number(results[label].readings[name].panel.match(/Activity rate\D*([\d.]+)/)?.[1]);
    if (!phoneOnce) {
      assert.ok(rateOf("peak") > rateOf("start"), `${label}: rate at the peak is above the start`);
      assert.ok(rateOf("peak") > rateOf("end"), `${label}: rate at the peak is above the end`);
    }

    await checkStreamDetails(page, label, panel);

    // The window's own details name the published night and the modelled shape.
    await ui.goToWindowPeak(page); // the peak mark opens the window's details (the clickable band above the timeline is gone, T-084)
    await page.waitForTimeout(400);
    const windowPanel = await ui.infoPanel(page).innerText();
    assert.match(windowPanel, /activity/i, `${label}: window details open`);
    results[label].windowPanel = windowPanel.replace(/\s+/g, " ").slice(0, 600);
    await timed("checkSwitch", () => checkSwitch(label, viewport));
    if (phoneOnce) return; // the phone layout is checked once, through the scenarios above; the rest repeat the desktop's geometry
    await timed("checkSunEarth", () => checkSunEarth(page, label, canvas));
    await timed("checkBodies", () => checkBodies(page, label, canvas));
    await timed("checkWholeOrbit", () => checkWholeOrbit(page, label, canvas));
    await timed("checkCrossing", () => checkCrossing(page, label));
    await timed("checkYear", () => checkYear(page, label, canvas));
    await timed("checkLoop", () => checkLoop(page, label, canvas));
    await timed("checkEclipticFlat", () => checkEclipticFlat(page, label, "", true));
    if (label === "desktop") await timed("checkEclipticFlat", () => checkEclipticFlat(page, label, "&up=equatorial", false));
    if (label === "desktop") await timed("checkUpToggle", () => checkUpToggle(page, label));
    if (label === "desktop") await timed("checkFrameRate", () => checkFrameRate(page, label));
  } finally {
    await page.close();
  }
}

try {
  await timed("run desktop", () => run("desktop", { width: 1280, height: 800 }));
  // O-034 T-112: the light second shower runs at desktop only (the phone layout is proved by the Perseids phone pass).
  if (!lightRun) await timed("run phone", () => run("phone", { width: 390, height: 844 }));
  await timed("checkNotFetched", () => checkNotFetched());
  if (!lightRun) await timed("checkLoopOff", () => checkLoopOff());
  await timed("checkSpanActivity", () => checkSpanActivity());
  await timed("checkQuality", () => checkQuality());
  if (!lightRun) await timed("checkRemovedSwitches", () => checkRemovedSwitches());
  // O-034 T-112: the Apollo-default, removed-address and synthetic-ring mount checks run with the first shower only.
  if (!lightRun) {
    // Existing experiences still mount by their old names.
    const page = await openPage({ width: 1280, height: 800 });
    await page.goto(base);
    await page.waitForSelector("canvas");
    assert.equal(await ui.bodyOptionCount(page, "columbia"), 1, "Apollo is still the default");
    // T-091: the old per-shower addresses are removed with no redirect (they open the default experience); the plain Showers address opens the default shower with the switch.
    for (const old of readdirSync(showersDir).filter((file) => file.endsWith(".json")).map((file) => `shower-${file.slice(0, -".json".length)}`)) {
      await page.goto(`${base}?experience=${old}`);
      await page.waitForSelector("canvas");
      assert.equal(await ui.bodyOptionCount(page, "columbia"), 1, `?experience=${old} is removed: it opens the default experience`);
    }
    await page.goto(`${base}?experience=showers`);
    await page.waitForSelector("canvas");
    await ui.waitForShell(page);
    const plainShowers = await ui.experienceSwitchState(page);
    assert.equal(plainShowers.options.filter((option) => option.active).length, 1, "the plain Showers address opens one shower");
    assert.equal(plainShowers.options.find((option) => option.active).value, plainShowers.options[0].value, "the plain Showers address opens the first shower of the switch");
    await page.goto(`${base}?experience=showers&shower=no-such-shower`);
    await page.waitForSelector("canvas");
    await ui.waitForShell(page);
    assert.equal((await ui.experienceSwitchState(page)).options[0].active, true, "an unknown shower opens the first shower");
    await page.goto(`${base}?experience=synthetic-ring`);
    await page.waitForSelector("canvas");
    assert.equal(await ui.bodyOptionCount(page, "debris-ring"), 1, "synthetic-ring still mounts");
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ shower, results, errors }, null, 2));
if (errors.length > 0) process.exit(1);
