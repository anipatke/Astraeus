// The smoke step of `npm run check:browser` (O-038 T-145), grown out of browser-lite.mjs: open every public page and every demo view once at desktop and phone size.
// Each load fails on any page or console error, a missing shell, or a scene with no body, orbit path or dot in view (the scene's own readouts; stars alone do not count; no picture). Nothing else is asserted.
// Views are discovered as browser-lite does: Apollo (no query), the planets and showers experiences (src/main.tsx no longer holds a table of definitions since O-059 T-272; the made-up scenes are listed below), and every data/showers/<name>.json.
// The made-up (synthetic) scenes are not public pages and are left to the DOM tests, except the Sun-centred probe path (O-046 T-193). Pages: index.html and assets.html beside app.html.
// Apollo 11 must also stop drawing once paused and untouched (the frames-drawn readout stops counting, O-031 T-149).
// Shower views (id starting "showers") must also draw the meteor stream: dots in view, not just any body (I-071). ASTRAEUS_VIEWS=showers limits the run to those views
// (the step against the scratch public build uses it, so the shipped stream copy is what loads).
// Run alone: ASTRAEUS_URL=<app.html url> ASTRAEUS_EVIDENCE_DIR=<new dir> node tools/validate/browser-smoke.mjs
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import * as ui from "./driver.mjs";
import { assertStreamDrawn } from "./stream-check.mjs";
import { launchBrowser, openContext, pageIn, watchErrors } from "./harness.mjs";

const root = new URL("../../", import.meta.url);
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir === undefined || outDir === "") { console.error("set ASTRAEUS_EVIDENCE_DIR to a fresh evidence directory"); process.exit(2); }
mkdirSync(outDir, { recursive: true });
if (readdirSync(outDir).length > 0) { console.error(`${outDir} is not empty; use a fresh directory`); process.exit(2); }

const appUrl = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const VIEWPORTS = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, mobile: false },
  { name: "phone", viewport: { width: 390, height: 844 }, mobile: true },
];

function discoverViews() {
  const showers = readdirSync(new URL("../astraeus-demo-showers/data/showers/", root)).filter((file) => file.endsWith(".json")).map((file) => file.replace(/\.json$/, "")).sort();
  const views = [{ id: "apollo11", url: appUrl, scene: true }];
  for (const name of ["planets", "showers"]) views.push({ id: name, url: `${appUrl}?experience=${name}`, scene: true });
  for (const name of showers) views.push({ id: `showers-${name}`, url: `${appUrl}?experience=showers&shower=${name}`, scene: true });
  // O-046 T-193: the made-up Sun-centred probe path (dev server only; the public build leaves it out) gets the extra checks in `sunPathChecks`.
  views.push({ id: "synthetic-probe", url: `${appUrl}?experience=synthetic-probe`, scene: true, sunPath: true });
  // O-047 T-203: the made-up 1977-to-170-AU journey (dev server only): moons at their dates, Saturn's orbit line, and the whole path framed at its end (`journeyChecks`).
  views.push({ id: "synthetic-journey", url: `${appUrl}?experience=synthetic-journey`, scene: true, journey: true });
  for (const page of ["index", "assets"]) views.push({ id: `${page}-page`, url: new URL(`${page}.html`, appUrl).href, scene: false });
  const only = process.env.ASTRAEUS_VIEWS;
  return only === undefined || only === "" ? views : views.filter((view) => view.id.startsWith(only));
}

async function drawsSomething(page, view) {
  const deadline = Date.now() + 10000;
  const content = (d) => d.bodies + d.dots + d.paths; // the experience's own content; stars alone do not count
  let drawn = await ui.sceneDrawsSomething(page);
  while (content(drawn) === 0 && Date.now() < deadline) {
    await page.waitForTimeout(250);
    drawn = await ui.sceneDrawsSomething(page);
  }
  if (content(drawn) === 0) throw new Error(`the scene shows no body, dot or path in view (${JSON.stringify(drawn)})`);
  if (view.id.startsWith("showers")) {
    while ((drawn.dots === 0) && Date.now() < deadline) {
      await page.waitForTimeout(250);
      drawn = await ui.sceneDrawsSomething(page);
    }
    assertStreamDrawn(drawn.dots, view.id);
  }
  return drawn;
}

/**
 * O-046 T-193: the probe path draws, its label is shown at two times (the scene opens following the probe, and the followed label wins any collision, I-108), and its line (fixed to the Sun)
 * sits at the same place in the view at two times. The camera follows the probe, so the line check first picks the Sun, which stays put in the view. Readouts only.
 */
async function sunPathChecks(page) {
  await ui.ensurePaused(page);
  const line = (p) => [p.minX, p.maxX, p.minY, p.maxY];
  const labelShownAt = async (fraction) => {
    await ui.seekToFraction(page, fraction);
    await ui.waitForSceneReady(page);
    return (await ui.shownSceneLabelIds(page)).includes("probe");
  };
  const labelFirst = await labelShownAt(0.2);
  const labelSecond = await labelShownAt(0.8);
  if (!labelFirst || !labelSecond) throw new Error(`the probe path's label is not shown (at 0.2: ${labelFirst}, at 0.8: ${labelSecond})`);
  await ui.pickBody(page, "sun");
  await ui.waitForBodySettled(page, "sun"); // the camera eases to the Sun
  await ui.seekToFraction(page, 0.2);
  await ui.waitForSceneReady(page);
  const first = await ui.scenePath(page, "probe");
  await ui.seekToFraction(page, 0.8);
  await ui.waitForSceneReady(page);
  const second = await ui.scenePath(page, "probe");
  if (first === undefined || !first.visible || first.inView === 0) throw new Error(`the Sun-centred probe path is not drawn in view (${JSON.stringify(first)} of ${JSON.stringify((await ui.scenePaths(page)).map((p) => p.id))})`);
  if (second === undefined || line(first).some((value, k) => Math.abs(value - line(second)[k]) > 0.002)) throw new Error(`the probe path line moved between two times (${JSON.stringify(line(first))} then ${JSON.stringify(second && line(second))})`);
  return { first: line(first), second: line(second) };
}

const JOURNEY_MOONS = [["1979-03-05T12:00:00Z", ["io", "europa", "ganymede", "callisto"]], ["1980-11-12T12:00:00Z", ["titan", "rhea", "dione", "tethys", "enceladus", "mimas", "iapetus"]]];
const JOURNEY_END_UTC_MS = Date.UTC(2026, 0, 1);
const JOURNEY_SATURN_UTC_MS = Date.UTC(1980, 10, 12);
const JOURNEY_URANUS_UTC_MS = Date.UTC(1986, 0, 24);
const URANUS_MOONS = ["miranda", "ariel", "umbriel", "titania", "oberon"];

/**
 * O-047 T-203: on the made-up journey, each giant planet's moons are in the scene at the encounter date (a drawn body or marker, never "none"), Saturn's orbit line is drawn, and with the Sun
 * picked and the clock at the end the camera zooms out to frame the 170 AU path whole (I-114): every vertex in view, its label shown, a body still drawn. Reads the scene's own readouts.
 */
async function journeyChecks(page) {
  await ui.ensurePaused(page);
  const moons = {};
  for (const [iso, ids] of JOURNEY_MOONS) {
    try { await ui.seekToReady(page, Date.parse(iso), { ids }); } catch (error) { throw new Error(`at ${iso} the moons ${ids.join(", ")} are not in the scene: ${error.message}`); }
    moons[iso] = ids;
  }
  const saturnOrbit = await ui.scenePath(page, "saturn-orbit");
  if (saturnOrbit === undefined || !saturnOrbit.visible) throw new Error(`Saturn's orbit line is not drawn (${JSON.stringify((await ui.scenePaths(page)).map((p) => p.id))})`);
  await ui.seekToReady(page, JOURNEY_END_UTC_MS - 1000);
  await ui.pickBody(page, "sun");
  await ui.waitForBodySettled(page, "sun");
  if (!(await ui.zoomOutFully(page, "traveller"))) throw new Error("no free point on the scene to zoom from");
  await ui.waitForPathSettled(page, "traveller");
  const path = await ui.scenePath(page, "traveller");
  if (path === undefined || !path.visible || path.vertices === 0 || path.inView < path.vertices) throw new Error(`the 170 AU path is not framed whole at the farthest zoom-out (${JSON.stringify(path)})`);
  const labels = await ui.shownSceneLabelIds(page);
  if (!labels.includes("traveller")) throw new Error(`the path's label is not shown at 170 AU (${JSON.stringify(labels)})`);
  const followed = await followAcrossStretchesChecks(page);
  const closeMarkers = await closeMarkerChecks(page);
  const nearSaturn = await nearSaturnChecks(page);
  const nearUranus = await nearUranusChecks(page);
  return { followed, closeMarkers, nearSaturn, nearUranus, moons, saturnOrbit: saturnOrbit.id, path: { vertices: path.vertices, inView: path.inView, spanX: path.spanX, spanY: path.spanY }, labels };
}

const JOURNEY_JUPITER_UTC_MS = Date.UTC(1979, 2, 5);
const JUPITER_CLOSE_EVENTS = ["Made-up pass of Io", "Made-up pass of Jupiter", "Made-up pass of Europa", "Made-up pass of Ganymede"];

/**
 * O-050 T-217: the traveller is one path with one menu entry (no "(Unavailable)"), drawn against the Sun, then Jupiter for 20 days either side of its pass, then the Sun. With the camera on it,
 * seeking to either side of each of the two boundaries keeps it followed: its line stays in view and runs through the middle of the screen. Readouts only.
 */
async function followAcrossStretchesChecks(page) {
  await ui.ensurePaused(page);
  const options = (await ui.bodyOptionDetails(page)).filter((option) => option.value === "traveller");
  if (options.length !== 1 || /unavailable/i.test(options[0].label)) throw new Error(`the traveller must be one menu entry without "(Unavailable)" (${JSON.stringify(options)})`);
  await ui.pickBody(page, "traveller");
  const days = [-30, -19, 19, 30];
  const seen = {};
  for (const d of days) {
    await ui.seekToReady(page, JOURNEY_JUPITER_UTC_MS + d * 86_400_000);
    await ui.waitForPathSettled(page, "traveller"); // the camera catches up with the probe after the jump
    const line = await ui.scenePath(page, "traveller"); // a path is not in the body readout; with the camera on the probe, its line runs through the middle of the view (the probe is where the line starts)
    const centred = line !== undefined && line.lineMinX <= 0.53 && line.lineMaxX >= 0.47 && line.lineMinY <= 0.53 && line.lineMaxY >= 0.47;
    if (line === undefined || !line.visible || line.inView === 0 || !centred) throw new Error(`the camera lost the traveller ${d} days from the Jupiter pass (${JSON.stringify(line)})`);
    seen[d] = line.inView;
  }
  const path = await ui.scenePath(page, "traveller");
  if (path === undefined || !path.visible || path.vertices === 0) throw new Error(`the traveller's path is not drawn (${JSON.stringify(path)})`);
  return { seen, path: { vertices: path.vertices, inView: path.inView } };
}

const overlap = (a, b) => a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;

/**
 * O-050 T-217: the four events within nine hours of the Jupiter pass gather under one numbered mark (O-050 T-214). At 1280x720 (desktop load) or 375x667 (phone load), pressing it lists each
 * as a full-size button, the list sits inside the screen with no two items overlapping, and pressing each item seeks the clock to its own event and closes the list. Readouts only.
 */
async function closeMarkerChecks(page) {
  const phone = await ui.isPhoneLayout(page);
  const size = phone ? { width: 375, height: 667 } : { width: 1280, height: 720 };
  await ui.resizeViewport(page, size);
  await ui.ensurePaused(page);
  await ui.seekToReady(page, Date.UTC(1977, 8, 5) + 86_400_000);
  const groups = await ui.markerGroups(page);
  let index = -1;
  for (let i = 0; i < groups.length && index < 0; i += 1) {
    await ui.pressMarkerGroup(page, i);
    const list = await ui.markerGroupList(page);
    if (list !== null && JUPITER_CLOSE_EVENTS.every((name) => list.items.some((item) => item.label === `Go to ${name}`))) index = i;
    else if (list !== null) await ui.pressMarkerGroup(page, i);
  }
  if (index < 0) throw new Error(`no numbered mark holds the Jupiter-pass events at ${size.width}x${size.height} (${JSON.stringify(groups)})`);
  const members = [];
  for (const name of JUPITER_CLOSE_EVENTS) {
    if ((await ui.markerGroupList(page)) === null) await ui.pressMarkerGroup(page, index);
    const list = await ui.markerGroupList(page);
    const item = list.items.find((entry) => entry.label === `Go to ${name}`);
    const inside = (b) => b.x >= 0 && b.y >= 0 && b.x + b.width <= list.viewport.width && b.y + b.height <= list.viewport.height;
    if (!inside(list.box) || !inside(item.box)) throw new Error(`the list item "${name}" is off the ${size.width}x${size.height} screen (${JSON.stringify({ list: list.box, item: item.box })})`);
    if (item.box.height < 32 || item.box.width < 32) throw new Error(`the list item "${name}" is smaller than 32 px (${JSON.stringify(item.box)})`);
    const crossing = list.items.filter((other) => other !== item && overlap(other.box, item.box));
    if (crossing.length > 0) throw new Error(`the list item "${name}" overlaps ${crossing.map((c) => c.label).join(", ")}`);
    await ui.pressMarkerGroupItem(page, item.label);
    const clock = await ui.waitForClockSettled(page);
    if (Math.abs(clock - item.timeUtcMs) > 30 * 60_000) throw new Error(`pressing "${name}" left the clock at ${new Date(clock).toISOString()}, not its event (${new Date(item.timeUtcMs).toISOString()})`);
    if ((await ui.markerGroupList(page)) !== null) throw new Error(`the list stayed open after pressing "${name}"`);
    await ui.closeInfoQuietly(page);
    members.push(name);
  }
  await ui.resizeViewport(page, phone ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  return { size: `${size.width}x${size.height}`, groupCount: groups[index].count, members };
}

/**
 * O-048 T-209: with the whole-path reach (far plane past 170 AU) the camera goes close to Saturn at its flyby date; Saturn must still draw as a sphere in view, its rings (the scene's
 * `data-rings` band count) are in the scene, the orbit lines of Europa, Ganymede and Titan are drawn, and the renderer reports its depth mode (logarithmic). Also reads the frames drawn per second while
 * the camera is nudged (a headless, software-GL number: a frame-time cost sanity figure, not a GPU measurement). Readouts only.
 */
async function nearSaturnChecks(page) {
  await ui.seekToReady(page, JOURNEY_SATURN_UTC_MS, { ids: ["saturn"] });
  await ui.pickBody(page, "saturn");
  await ui.waitForBodySettled(page, "saturn");
  const point = await ui.freeCanvasPoint(page);
  if (point === null) throw new Error("no free point on the scene to zoom in from");
  await ui.wheelUntilSettled(page, point, -600, ui.bodyZoomReadout(page, "saturn"));
  await ui.waitForBodySettled(page, "saturn");
  const canvas = page.locator("canvas").first();
  const depthMode = await canvas.getAttribute("data-depth-mode");
  const rings = Number(await ui.sceneCanvas(page).getAttribute("data-rings")); // on the canvas wrapper, not the drawing surface
  const saturn = await ui.sceneBody(page, "saturn");
  if (saturn === undefined || saturn.as !== "sphere" || !saturn.inView || !(saturn.radiusPx > 20)) throw new Error(`Saturn does not draw as a large sphere near the camera (${JSON.stringify(saturn)}, depth ${depthMode})`);
  if (!(rings > 0)) throw new Error(`Saturn's rings are not in the scene (data-rings ${rings})`);
  if (depthMode !== "logarithmic") throw new Error(`the renderer's depth mode is ${depthMode}, not logarithmic`);
  const orbits = await ui.scenePaths(page);
  const missing = ["europa-orbit", "ganymede-orbit", "titan-orbit"].filter((id) => !orbits.some((path) => path.id === id));
  if (missing.length > 0) throw new Error(`moon orbit lines are not in the scene: ${missing.join(", ")} (${JSON.stringify(orbits.map((p) => p.id))})`);
  const before = await ui.framesDrawn(page);
  const started = Date.now();
  // Fixed on purpose: this is a measurement window (frames drawn per second over 3 s of nudging), so its length is the quantity, not a wait for a condition.
  while (Date.now() - started < 3000) { await page.mouse.wheel(0, 40); await page.waitForTimeout(30); await page.mouse.wheel(0, -40); await page.waitForTimeout(30); }
  const framesPerSecond = Math.round(((await ui.framesDrawn(page)) - before) / ((Date.now() - started) / 1000));
  return { depthMode, rings, saturn: { as: saturn.as, radiusPx: saturn.radiusPx }, framesPerSecond };
}

/**
 * O-049 T-212: on the made-up journey in January 1986 the five main Uranus moons, added by id as listed moons (grey spheres, positions from `astraeus-data-uranus`), are in the scene with orbit
 * lines drawn. With Uranus picked each moon is a drawn body or marker (never "none") with its orbit line drawn, and each, picked and approached, draws as a sphere. Their labels are read and returned. Readouts only.
 */
async function nearUranusChecks(page) {
  await ui.seekToReady(page, JOURNEY_URANUS_UTC_MS, { ids: ["uranus"] });
  await ui.pickBody(page, "uranus");
  await ui.waitForBodySettled(page, "uranus");
  const bodies = await ui.sceneBodies(page);
  const missing = URANUS_MOONS.filter((id) => !bodies.some((body) => body.id === id && body.as !== "none"));
  if (missing.length > 0) throw new Error(`the Uranus moons ${missing.join(", ")} are not in the scene in 1986 (${JSON.stringify(bodies.map((b) => `${b.id}:${b.as}`))})`);
  const orbits = await ui.scenePaths(page);
  const noLine = URANUS_MOONS.filter((id) => !orbits.some((path) => path.id === `${id}-orbit` && path.visible));
  if (noLine.length > 0) throw new Error(`Uranus moon orbit lines are not drawn: ${noLine.join(", ")} (${JSON.stringify(orbits.map((p) => p.id))})`);
  // The moons are true size (a few hundred km beside a 25,000 km planet), so each one is picked and approached to read it as a sphere.
  const spheres = {};
  for (const id of URANUS_MOONS) {
    await ui.pickBody(page, id);
    await ui.waitForBodySettled(page, id);
    const point = await ui.freeCanvasPoint(page);
    if (point === null) throw new Error(`no free point on the scene to zoom in on ${id}`);
    await ui.wheelUntilSettled(page, point, -600, ui.bodyZoomReadout(page, id));
    await ui.waitForBodySettled(page, id);
    const moon = await ui.sceneBody(page, id);
    if (moon === undefined || moon.as !== "sphere" || !moon.inView || !(moon.radiusPx > 20)) throw new Error(`${id} does not draw as a large sphere when approached (${JSON.stringify(moon)})`);
    spheres[id] = Math.round(moon.radiusPx);
  }
  const labels = (await ui.shownSceneLabelIds(page)).filter((id) => URANUS_MOONS.includes(id));
  return { spheres, labels };
}

async function load(browser, view, size) {
  const errors = [];
  const failures = [];
  const started = Date.now();
  const context = await openContext(browser, { viewport: size.viewport, ...(size.mobile ? { isMobile: true, hasTouch: true } : {}) });
  const page = await pageIn(context);
  watchErrors(page, errors);
  let drawn;
  try {
    await page.goto(view.url, { waitUntil: "load", timeout: 60000 });
    if (view.scene) {
      await ui.waitForShell(page, { timeout: 60000 });
      drawn = await drawsSomething(page, view);
      // O-031 T-149: a paused, untouched scene stops drawing (Apollo 11 is the one view checked; the rule is the same for all).
      if (view.journey) drawn = { ...drawn, journey: await journeyChecks(page) };
      if (view.sunPath) drawn = { ...drawn, sunPath: await sunPathChecks(page) };
      if (view.id === "apollo11") { await ui.ensurePaused(page); drawn = { ...drawn, idleAtFrames: await ui.waitUntilSceneIdle(page) }; }
    } else {
      await page.waitForTimeout(500);
    }
  } catch (error) {
    failures.push(String(error?.message ?? error).split("\n")[0]);
  } finally {
    await context.close();
  }
  failures.push(...errors);
  const seconds = Math.round((Date.now() - started) / 100) / 10;
  const record = { label: view.id, size: size.name, ok: failures.length === 0, seconds, drawn, failures };
  console.log(`${record.ok ? "ok  " : "FAIL"} ${view.id.padEnd(22)} ${size.name.padEnd(8)} ${String(seconds).padStart(5)}s`);
  for (const failure of failures) console.log(`       - ${failure}`);
  return record;
}

const views = discoverViews();
const browser = await launchBrowser();
const results = [];
try {
  console.log(`smoke: ${views.length} views (${views.map((view) => view.id).join(", ")}), ${VIEWPORTS.length} sizes`);
  for (const view of views) {
    // O-060 T-281: the made-up journey is the long load (a minute at each size), so its two sizes run side by side in two contexts of this one browser; every other load runs alone, in turn.
    if (view.journey) results.push(...(await Promise.all(VIEWPORTS.map((size) => load(browser, view, size)))));
    else for (const size of VIEWPORTS) results.push(await load(browser, view, size));
  }
} finally {
  await browser.close();
}
const failed = results.filter((result) => !result.ok);
writeFileSync(`${outDir}/results.json`, JSON.stringify({ at: new Date().toISOString(), appUrl, loads: results.length, failed: failed.length, results }, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} loads passed; results in ${outDir}`);
if (failed.length > 0) process.exit(1);
