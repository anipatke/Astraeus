// Browser check for showers built from settings files. Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-showers.mjs [<shower name>]
// With no name (and no ASTRAEUS_SHOWER) it runs over every data/showers/<name>.json, one run per shower, each with its own log and screenshots under
// <evidence dir>/<name>/. A shower's own values (peak solar longitude, radiant, parent, window, rate unit, orbit-file code, clump settings, label) come
// from its settings file and the local orbit-file header; nothing here belongs to one shower. Run with a name to check one shower.
// T-055 scenario map: every scenario below is kept for every shower; only the figures that were Perseid values are now read from the settings file
//   Perseid figure in the script before T-055 ............... now read from
//   peak solar longitude 140.1 deg (checkCrossing) ........... settings radiant.peakSolarLongitudeDeg
//   radiant RA 47.9 / Dec 57.9 / "IAU Meteor Data Center" .... settings radiant.raDeg / decDeg / the first words of radiant.source.name
//   the clump "30% ... ±20° ... 109P/Swift-Tuttle" ........... settings stream.concentration and parentBody
//   fetch command "... 7" and orbit file cams-iau-7 .......... settings stream.iauCode
//   "Information about Perseids stream" ....................... settings label
//   the comet "swift-tuttle" and "Focus comet" ................ the parent id (parentElements.id or parentBodyId) and the generic "Focus parent" preset
//   the mounted bodies (seven) ................................ the built-in Sun-circling bodies, plus the parent when the settings define it
//
// T-038 scenario map (the T-047, T-049 and T-053 scenarios are all kept; each one whose subject changed names its replacement).
//   NEW in T-038: the stream is the measured CAMS orbits, fetched to data/local/ by tools/data/fetch-meteoroid-orbits.mjs (git-ignored, never shipped); the
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
//     the comet's whole orbit is drawn and the preset frames it .. checkWholeOrbit: the "Whole orbit" preset leaves the violet orbit spanning most of the canvas
//     the crossing is at the peak ................................ checkCrossing: the instant the peak marker seeks to has solar longitude 140.1 (J2000; low-precision
//                                                                 almanac formula, written here) within 0.3 deg, and the rate readout peaks there
//     no data, no stream ........................................ checkNotFetched: with the orbit file blocked the stream is not drawn and its panel says "not fetched"
//     loops at the end (owner 2026-10-15) ....................... checkLoop: playing past the end wraps the time back inside the window and dots are still drawn; checkLoopOff: ?loop=off runs past the end and the stream is gone
//     frame rate with every member drawn ........................ read from the Developer counter and recorded (software GL: an indication, not the owner's figure)
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/";
const shower = process.argv[2] ?? process.env.ASTRAEUS_SHOWER;
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
const orbitFile = new URL(`../../data/local/cams-iau-${settingsFile.stream.iauCode}.json`, import.meta.url);
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
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = {};
// Every stream-pixel count the scenarios assert on, by shower, viewport and scenario, so a floor can be judged against what was actually measured.
const litLog = (results.litCounts = {});
const logLit = (where, n) => { litLog[`${shower}/${where}`] = n; return n; };

async function openPage(viewport) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  return page;
}

// Stream-coloured pixels on the canvas (amber dots, not the grey orbit lines, white text or blue Earth): the stream is visible when its dots are drawn.
const litPixels = async (page) => {
  const png = (await page.getByTestId("earth-moon-canvas").screenshot()).toString("base64");
  return page.evaluate(async ({ data, colour }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const copy = document.createElement("canvas");
    copy.width = image.width; copy.height = image.height;
    const ctx = copy.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
    // T-055: the stream's colour is the settings file's (it was a fixed amber), so a pixel counts when its hue is within 25 degrees of the stream colour's and it is bright and saturated.
    const hueOf = (r, g, b) => {
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max === min) return null;
      const d = max - min;
      const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return (h * 60 + 360) % 360;
    };
    const target = hueOf(parseInt(colour.slice(1, 3), 16), parseInt(colour.slice(3, 5), 16), parseInt(colour.slice(5, 7), 16));
    let lit = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
      const max = Math.max(r, g, b);
      if (max <= 150 || (max - Math.min(r, g, b)) / max < 0.35) continue;
      const hue = hueOf(r, g, b);
      const gap = Math.abs(hue - target);
      if (Math.min(gap, 360 - gap) < 25) lit += 1;
    }
    return lit;
  }, { data: png, colour: settingsFile.look.streamColor });
};

// Pixels in the colours of Earth's path (blue) and the parent's orbit (violet); Earth itself is invisible at true scale, so these are the lines.
const pathPixels = async (page) => {
  const png = (await page.getByTestId("earth-moon-canvas").screenshot()).toString("base64");
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const copy = document.createElement("canvas");
    copy.width = image.width; copy.height = image.height;
    const ctx = copy.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
    const half = Math.floor(copy.width / 2);
    const count = { blue: 0, violet: 0, left: 0, right: 0, bright: 0 };
    for (let i = 0; i < pixels.length; i += 4) {
      const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
      const x = (i / 4) % copy.width;
      if (b > 90 && b - r > 35 && b - g > 15 && g >= r) { count.blue += 1; if (x < half) count.left += 1; else count.right += 1; }
      if (b > 110 && r - g > 15 && b - r > 25) count.violet += 1;
      if (r + g + b > 60) count.bright += 1;
    }
    return count;
  }, png);
};

const seek = async (page, timeUtcMs) => {
  await page.locator('input[aria-label="Seek timeline"]').evaluate((input, time) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(time));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, timeUtcMs);
  await page.waitForTimeout(500);
};

// Planet orbit lines are drawn in the planets' own tan material colours at 70% opacity (about 150,120,90): not the blue of Earth's path,
// the violet of the parent's orbit or the amber of the stream.
const planetOrbitPixels = async (page) => {
  const png = (await page.getByTestId("earth-moon-canvas").screenshot()).toString("base64");
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const copy = document.createElement("canvas");
    copy.width = image.width; copy.height = image.height;
    const ctx = copy.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
    let tan = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
      if (r > 110 && r < 200 && r - g > 15 && r - g < 45 && g - b > 15 && g - b < 50 && r - b > 40) tan += 1;
    }
    return tan;
  }, png);
};

// T-049: the four planet orbits are items with provenance, and their lines are drawn around the Sun.
async function checkPlanetOrbits(page, label, shot, canvas, choose, closeInfo) {
  const out = (results[label].planetOrbits = {});
  for (const id of ["mercury", "venus", "mars", "jupiter"]) {
    await page.getByLabel("Select object").selectOption(`${id}-orbit`);
    if (!(await page.locator("#info-panel").count())) await page.getByRole("button", { name: new RegExp(`^Information about .+ orbit$`) }).click();
    await page.locator("#info-panel").waitFor();
    const text = (await page.locator("#info-panel").innerText()).replace(/\s+/g, " ");
    assert.match(text, /orbit/i, `${label}: ${id}'s orbit panel opens`);
    await page.locator("#info-panel .provenance-badge").click();
    const detail = (await page.locator("#info-panel .provenance-detail").innerText()).replace(/\s+/g, " ");
    assert.match(detail, /Horizons/, `${label}: ${id}'s orbit carries the planet's position provenance`);
    if (id === "jupiter") assert.match(detail, /reaches past 2030/, `${label}: Jupiter's orbit states that it passes the compared range`);
    out[id] = detail.slice(0, 200);
    await closeInfo();
  }
  await choose("sun", "Overview");
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 12; i += 1) await page.mouse.wheel(0, 900);
  await page.waitForTimeout(1200);
  out.tanPixels = await planetOrbitPixels(page);
  assert.ok(out.tanPixels > 150, `${label}: the planets' orbit lines are drawn around the Sun (${out.tanPixels})`);
  await shot("planet-orbits");
}

// The Sun-Earth composition: the Sun is the scene's zero, Earth moves on its drawn path, no Moon exists, and the solar-system scale shows Earth.
async function checkSunEarth(page, label, shot, canvas) {
  const out = (results[label].sunEarth = {});
  assert.equal(await canvas.getAttribute("data-scene-center"), "sun", `${label}: the Sun is the scene centre`);
  assert.equal(await canvas.getAttribute("data-bodies"), mountedBodies.join(","), `${label}: the mounted bodies are the Sun, Earth, the four planets and the parent (and no other shower's parent)`);
  if (parent !== "swift-tuttle") assert.ok(!(await canvas.getAttribute("data-bodies")).split(",").includes("swift-tuttle"), `${label}: another shower's parent (the catalogued comet) is not mounted in this shower`);
  assert.equal(await canvas.getAttribute("data-sun-centred"), "6", `${label}: Earth's path, four planet orbits and the comet's whole orbit are declared`);
  const options = await page.getByLabel("Select object").evaluate((select) => [...select.options].map((o) => o.value));
  for (const id of [...mountedBodies, "earth-path", "mercury-orbit", "venus-orbit", "mars-orbit", "jupiter-orbit", `${parent}-orbit`, `${shower}-stream`]) assert.ok(options.includes(id), `${label}: ${id} is listed`);
  assert.ok(!options.includes("moon"), `${label}: no Moon item`);
  const scales = await page.locator(".scale-choices button[data-scale]").evaluateAll((buttons) => buttons.map((b) => b.dataset.scale));
  assert.deepEqual(scales, ["true-scale", "solar-system"], `${label}: true and solar-system scale`);

  // The Sun at the origin: with the Sun focused the camera is centred on it, so its marker is at the middle of the canvas.
  const closeInfo = async () => { const close = page.locator("#info-panel .info-panel-close"); if (await close.count()) await close.click(); };
  const choose = async (objectId, name) => {
    await page.getByLabel("Select object").selectOption(objectId);
    await closeInfo();
    const compact = page.locator(".object-camera-picker");
    if (await compact.isVisible()) {
      const value = await compact.evaluate((select, text) => [...select.options].find((o) => o.textContent.trim() === text)?.value ?? null, name);
      assert.ok(value, `${label}: preset exists: ${name}`);
      await compact.selectOption(value);
    } else {
      await page.getByRole("button", { name, exact: true }).click();
    }
    await page.waitForTimeout(1500);
  };
  const start = Number(await page.locator('input[aria-label="Seek timeline"]').getAttribute("min"));
  const peak = Number(await page.locator("button.timeline-window-peak").evaluate((button) => button.dataset.timeUtcMs ?? 0)) || null;
  out.path = {};
  await checkPlanetOrbits(page, label, shot, canvas, choose, closeInfo);
  // Earth on its path at the start and at the peak: overview shows the blue path; following Earth keeps the line passing both sides of it.
  for (const [name, move] of [["start", () => seek(page, start)], ["peak", async () => { await page.locator("button.timeline-window-peak").click(); await page.waitForTimeout(500); await closeInfo(); }]]) {
    await move();
    await choose("sun", "Overview");
    // T-038: Overview now frames the comet's whole 51 AU orbit, so Earth's 1 AU path is a few pixels there. The comet's orbit is asserted at that framing,
    // then the camera is brought in (the wheel) until Earth's path is the size it was in the earlier Overview, which is the earlier scenario's assertion.
    const whole = await pathPixels(page);
    assert.ok(whole.violet > 60, `${label}/${name}: the comet's whole orbit is drawn in the Overview (${whole.violet})`);
    const box0 = await canvas.boundingBox();
    await page.mouse.move(box0.x + box0.width / 2, box0.y + box0.height / 2);
    let overview = whole;
    let wheels = 0;
    while (overview.blue <= 100 && wheels < 60) {
      await page.mouse.wheel(0, -400);
      wheels += 1;
      await page.waitForTimeout(350);
      overview = await pathPixels(page);
    }
    out.path[`${name}Wheels`] = wheels;
    assert.ok(overview.blue > 100, `${label}/${name}: Earth's path is drawn once the camera is brought in (${overview.blue} after ${wheels} wheel steps)`);
    await shot(`sun-overview-${name}`);
    await choose("earth", "Focus Earth");
    // Frame Earth with the path in view: pull back a little from the close framing.
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 3; i += 1) await page.mouse.wheel(0, 300);
    // T-038 (ecliptic-up view): Focus Earth now looks at Earth from the Sun's side exactly in the ecliptic, where its path is edge-on; raise the camera a little.
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 90, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(800);
    const near = await pathPixels(page);
    out.path[name] = { overview, near };
    assert.ok(near.left > 20 && near.right > 20, `${label}/${name}: the path runs on both sides of Earth (${near.left}/${near.right})`);
    await shot(`earth-on-path-${name}`);
  }

  // Solar-system scale: Earth becomes visible, and its info panel states the factor.
  await choose("earth", "Focus Earth");
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < 6; i += 1) await page.mouse.wheel(0, 600);
  await page.waitForTimeout(800);
  const trueCount = (await pathPixels(page)).bright;
  await page.getByRole("button", { name: "Solar system", exact: true }).click();
  await page.waitForTimeout(1200);
  const solarCount = (await pathPixels(page)).bright;
  out.brightPixels = { trueScale: trueCount, solarSystem: solarCount };
  assert.ok(solarCount > trueCount + 150, `${label}: Earth is visible in the solar-system scale (${trueCount} -> ${solarCount})`);
  await shot("earth-solar-system");
  await page.getByRole("button", { name: /^Information about Earth$/ }).click();
  const earthPanel = (await page.locator("#info-panel").innerText()).replace(/\s+/g, " ");
  assert.match(earthPanel, /Earth/, `${label}: Earth's info panel opens`);
  await page.locator("#info-panel .provenance-badge").click();
  const earthDetail = (await page.locator("#info-panel .provenance-detail").innerText()).replace(/\s+/g, " ");
  assert.match(earthDetail, /400 times larger than life/, `${label}: Earth's factor is stated`);
  out.earthFactor = earthDetail.match(/[^.]*400 times larger[^.]*\./)?.[0] ?? null;
  await closeInfo();

  // Follow Earth through the activity window under the solar-system scale.
  await choose("earth", "Follow Earth");
  const end = Number(await page.locator('input[aria-label="Seek timeline"]').getAttribute("max"));
  const sizes = [];
  for (const time of [start, start + (end - start) / 2, end]) {
    await seek(page, time);
    await page.waitForTimeout(600);
    sizes.push((await pathPixels(page)).bright);
  }
  out.followBright = sizes;
  assert.ok(sizes.every((count) => count > 500), `${label}: Earth stays in view while followed (${sizes})`);
  await shot("follow-earth-end");
  void peak;
}

// Labels that are shown right now, by object id.
const shownLabels = (page) => page.evaluate(() => [...document.querySelectorAll("[data-label-id]")].filter((el) => !el.hidden).map((el) => el.dataset.labelId));

// Bright pixels within `radius` of a canvas-relative point.
const brightNear = async (page, x, y, radius = 6) => {
  const png = (await page.getByTestId("earth-moon-canvas").screenshot()).toString("base64");
  return page.evaluate(async ({ data, x, y, radius }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const copy = document.createElement("canvas");
    copy.width = image.width; copy.height = image.height;
    const ctx = copy.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
    let count = 0;
    for (let py = Math.max(0, Math.floor(y - radius)); py < Math.min(copy.height, Math.ceil(y + radius)); py += 1) {
      for (let px = Math.max(0, Math.floor(x - radius)); px < Math.min(copy.width, Math.ceil(x + radius)); px += 1) {
        const i = 4 * (py * copy.width + px);
        if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 200) count += 1;
      }
    }
    return count;
  }, { data: png, x, y, radius });
};

// A body's marker sits beside its label: 8 px to the label's left, right or below it. Returns the best bright-pixel count over those spots.
async function markerBesideLabel(page, id) {
  const box = await page.getByTestId("earth-moon-canvas").boundingBox();
  const rect = await page.locator(`[data-label-id="${id}"]`).evaluate((el) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; });
  const centreY = (rect.top + rect.bottom) / 2 - box.y;
  const spots = [[rect.left - 8 - box.x, centreY], [rect.right + 8 - box.x, centreY], [(rect.left + rect.right) / 2 - box.x, rect.bottom + 12 - box.y]];
  let best = 0;
  for (const [x, y] of spots) best = Math.max(best, await brightNear(page, x, y));
  return best;
}

// The comet and the planets are visible with labels: a zoom sweep from the whole-system Overview in to the close view shows every body's label, with a marker beside it, at some zoom;
// at true scale Earth and the planets draw as markers, and under the solar-system scale at least one planet draws as a body instead.
async function checkBodies(page, label, shot, canvas) {
  const out = (results[label].bodies = {});
  // The settings file turns the Sun's label off (owner: "we can probably turn off the sun label"): it must never be shown here, yet the Sun stays in the Object menu.
  const sunLabelOff = settingsFile.labels?.sun === false;
  const bodies = ["sun", "earth", "mercury", "venus", "mars", "jupiter", parent].filter((id) => !(sunLabelOff && id === "sun"));
  const closeInfo = async () => { const close = page.locator("#info-panel .info-panel-close"); if (await close.count()) await close.click(); };
  await page.getByLabel("Select object").selectOption("sun");
  await closeInfo();
  const compact = page.locator(".object-camera-picker");
  if (await compact.isVisible()) {
    const value = await compact.evaluate((select) => [...select.options].find((o) => o.textContent.trim() === "Overview")?.value ?? null);
    await compact.selectOption(value);
  } else await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.waitForTimeout(1200);
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const seen = new Map();
  const markerSets = [];
  // The scenario is stated at true scale, so choose it (an earlier check leaves the solar-system scale on; with a close Overview an enlarged giant planet is a body, not a marker).
  await page.getByRole("button", { name: "True", exact: true }).click();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
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
      if (labels.includes(id) && !(seen.get(id)?.markerPixels > 3)) seen.set(id, { step, markerPixels: await markerBesideLabel(page, id) });
    }
    if (bodies.every((id) => seen.get(id)?.markerPixels > 3)) break;
  }
  await shot("bodies-sweep");
  out.sweepSteps = sweepSteps;
  out.labelsSeenAtZoomStep = Object.fromEntries(seen);
  if (sunLabelOff) {
    assert.ok(!(await shownLabels(page)).includes("sun"), `${label}: the Sun's label is off by the settings`);
    assert.equal(await page.locator('option[value="sun"]').count(), 1, `${label}: the Sun is still in the Object menu`);
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
  for (const id of bodies.filter((body) => body !== parent && seen.has(body))) assert.ok(seen.get(id).markerPixels > 3, `${label}: ${id} has a bright marker beside its label (${seen.get(id).markerPixels})`);
  await page.getByLabel("Select object").selectOption(parent);
  await closeInfo();
  if (await compact.isVisible()) {
    const value = await compact.evaluate((select) => [...select.options].find((o) => o.textContent.trim() === "Focus parent")?.value ?? null);
    assert.ok(value, `${label}: the Focus parent preset exists`);
    await compact.selectOption(value);
  } else await page.getByRole("button", { name: "Focus parent", exact: true }).click();
  await page.waitForTimeout(2000);
  assert.ok((await shownLabels(page)).includes(parent), `${label}: the parent's label is shown when it is focused`);
  out.cometMarkerPixels = await markerBesideLabel(page, parent);
  assert.ok(out.cometMarkerPixels > 3, `${label}: the comet has a bright marker beside its label (${out.cometMarkerPixels})`);
  await shot("comet-focus");
  const trueMarkers = new Set(markerSets.flatMap((set) => set.split(",")));
  for (const id of ["earth", "mercury", "venus", "mars", "jupiter"]) assert.ok(trueMarkers.has(id), `${label}: ${id} draws as a marker at true scale`);
  out.trueScaleMarkerBodies = [...trueMarkers].filter(Boolean);

  // Solar-system scale: the planets are enlarged, so at some zoom a planet is a body, not a marker. From the whole-system Overview, zoom in.
  await page.getByLabel("Select object").selectOption("sun");
  await closeInfo();
  if (await compact.isVisible()) {
    const value = await compact.evaluate((select) => [...select.options].find((o) => o.textContent.trim() === "Overview")?.value ?? null);
    await compact.selectOption(value);
  } else await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Solar system", exact: true }).click();
  await page.waitForTimeout(1500);
  const box2 = await canvas.boundingBox();
  await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2);
  const bodySteps = [];
  for (let step = 0; step < 40; step += 1) {
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(500);
    const markers = ((await page.locator("canvas").first().getAttribute("data-marker-bodies")) ?? "").split(",");
    const asBodies = ["earth", "mercury", "venus", "mars", "jupiter"].filter((id) => !markers.includes(id));
    if (asBodies.length > 0) bodySteps.push({ step, asBodies });
  }
  out.solarSystemBodies = bodySteps.slice(0, 3);
  const asBodyAtSomeZoom = new Set(bodySteps.flatMap((entry) => entry.asBodies));
  out.solarSystemBodySet = [...asBodyAtSomeZoom];
  assert.ok(asBodyAtSomeZoom.has("earth") && asBodyAtSomeZoom.size >= 3, `${label}: under the solar-system scale Earth and other planets draw as bodies at some zoom (${[...asBodyAtSomeZoom]})`);
  await shot("bodies-solar-system");
  await page.getByRole("button", { name: "True", exact: true }).click();
  await page.waitForTimeout(800);
}

// The comet's whole orbit is drawn and the "Whole orbit" preset frames it: the violet line spans most of the canvas in both directions.
async function checkWholeOrbit(page, label, shot, canvas) {
  const out = (results[label].wholeOrbit = {});
  await page.getByLabel("Select object").selectOption(`${parent}-orbit`);
  const close = page.locator("#info-panel .info-panel-close");
  if (await close.count()) await close.click();
  const compact = page.locator(".object-camera-picker");
  if (await compact.isVisible()) {
    const value = await compact.evaluate((select) => [...select.options].find((o) => o.textContent.trim() === "Whole orbit")?.value ?? null);
    assert.ok(value, `${label}: the Whole orbit preset exists`);
    await compact.selectOption(value);
  } else await page.getByRole("button", { name: "Whole orbit", exact: true }).click();
  await page.waitForTimeout(2500);
  const png = (await canvas.screenshot()).toString("base64");
  const extent = await page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const copy = document.createElement("canvas");
    copy.width = image.width; copy.height = image.height;
    const ctx = copy.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
    let [minX, maxX, minY, maxY, count] = [copy.width, 0, copy.height, 0, 0];
    for (let i = 0; i < pixels.length; i += 4) {
      const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
      if (b > 110 && r - g > 15 && b - r > 25) { const x = (i / 4) % copy.width; const y = Math.floor(i / 4 / copy.width); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); count += 1; }
    }
    return { minX, maxX, minY, maxY, count, width: copy.width, height: copy.height };
  }, png);
  out.violet = extent;
  const spanY = (extent.maxY - extent.minY) / extent.height;
  const spanX = (extent.maxX - extent.minX) / extent.width;
  assert.ok(extent.count > 150, `${label}: the comet's whole orbit is drawn (${extent.count} violet pixels)`);
  assert.ok(Math.max(spanX, spanY) > 0.3, `${label}: the Whole orbit preset frames the orbit, a substantial part of the canvas (over 30% in one direction; the orbit is inclined 113 degrees to the ecliptic the camera now looks along) (${spanX.toFixed(2)} x ${spanY.toFixed(2)})`);
  await shot("whole-orbit");
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
  await page.locator("button.timeline-window-peak").click();
  await page.waitForTimeout(600);
  const text = await page.getByRole("region", { name: "Timeline controls" }).innerText();
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
  // Ten days either side of the peak when the window has them, else one day short of the nearer window edge (a short window, such as a December shower's, ends a few days after its peak).
  const edgeDays = Math.floor(Math.min(Date.parse(settingsFile.activity.peakUtc) - Date.parse(settingsFile.activity.startUtc), Date.parse(settingsFile.activity.endUtc) - Date.parse(settingsFile.activity.peakUtc)) / 86_400_000);
  const offsetDays = Math.min(10, edgeDays - 1);
  out.rateOffsetDays = offsetDays;
  for (const days of [-offsetDays, 0, offsetDays]) { await seek(page, Date.parse(instant) + days * 86_400_000); rates.push(Number((await page.getByRole("region", { name: "Timeline controls" }).innerText()).match(/([\d.]+) meteors per hour/)?.[1])); }
  out.rateAtMinus10dPeakPlus10d = rates;
  assert.ok(rates[1] > rates[0] && rates[1] > rates[2], `${label}: the rate readout is highest at the peak (${rates})`);
  await page.locator("button.timeline-window-peak").click();
  await page.waitForTimeout(400);
}

// With the orbit file blocked the stream is not drawn and nothing stands in for it.
async function checkNotFetched() {
  const page = await openPage({ width: 1280, height: 800 });
  try {
    // As the dev server answers an unfetched path: the app's page, 200, not JSON (a 404 would be logged as a console error by the browser itself).
    await page.route("**/data/local/cams-iau-*.json", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>app</title>" }));
    await page.goto(`${base}?experience=shower-${shower}&sky=off`);
    await page.waitForSelector("canvas");
    await page.getByRole("region", { name: "Timeline controls" }).waitFor();
    const canvas = page.getByTestId("earth-moon-canvas");
    assert.equal(await canvas.getAttribute("data-point-groups"), "0", "not fetched: no stream group is drawn");
    assert.equal(await page.locator(`option[value="${shower}-stream"]`).count(), 1, "not fetched: the stream is still listed, to say so");
    await page.getByLabel("Select object").selectOption(`${shower}-stream`);
    if (!(await page.locator("#info-panel").count())) await page.getByRole("button", { name: streamButtonName }).click();
    const text = (await page.locator("#info-panel").innerText()).replace(/\s+/g, " ");
    assert.match(text, /not fetched on this machine/i, "not fetched: the panel says so");
    assert.match(text, new RegExp(`node tools/data/fetch-meteoroid-orbits\\.mjs ${settingsFile.stream.iauCode}`), "not fetched: the panel gives the command");
    results.notFetched = { panel: text.slice(0, 400) };
    if (outDir) await page.screenshot({ path: `${outDir}/not-fetched.png` });
    // The rest of the scene is still there.
    assert.equal(await canvas.getAttribute("data-bodies"), mountedBodies.join(","), "not fetched: the bodies are still drawn");
  } finally {
    await page.close();
  }
}

// The frame rate with every member drawn, from the Developer counter (software GL here: an indication, not the owner's machine).
async function checkFrameRate(page, label) {
  await page.getByLabel("Select object").selectOption(`${shower}-stream`);
  const close = page.locator("#info-panel .info-panel-close");
  if (await close.count()) await close.click();
  await page.getByRole("button", { name: "Developer mode" }).click();
  await page.locator("[data-frame-fps]").waitFor({ timeout: 10000 });
  await page.waitForTimeout(4000);
  const fps = Number(await page.locator("[data-frame-fps]").innerText());
  results[label].fpsSoftwareGl = { members: results[label].members, fps };
  assert.ok(Number.isFinite(fps) && fps > 0, `${label}: the Developer counter reads a frame rate (${fps})`);
}

// Frames the stream with its Focus preset, so the amber pixels are its dots.
async function frameStream(page) {
  await page.getByLabel("Select object").selectOption(`${shower}-stream`);
  const close = page.locator("#info-panel .info-panel-close");
  if (await close.count()) await close.click();
  const compact = page.locator(".object-camera-picker");
  if (await compact.isVisible()) {
    const value = await compact.evaluate((select) => [...select.options].find((o) => o.textContent.trim() === "Focus stream")?.value ?? null);
    await compact.selectOption(value);
  } else await page.getByRole("button", { name: "Focus stream", exact: true }).click();
  await page.waitForTimeout(1500);
}

// Looping playback (owner, 2026-10-15: "needs to play in a loop, as disappears when reaches the end"): playing past the end of the window wraps the time back inside it
// and the stream is still drawn; with ?loop=off the time runs past the end and the stream is gone (the cause).
async function checkLoop(page, label, canvas) {
  const out = (results[label].loop = {});
  const timeOf = async () => Date.parse((await page.getByRole("region", { name: "Timeline controls" }).innerText()).match(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/)?.[0]);
  const min = Number(await page.locator('input[aria-label="Seek timeline"]').getAttribute("min"));
  const max = Number(await page.locator('input[aria-label="Seek timeline"]').getAttribute("max"));
  await frameStream(page);
  await seek(page, max - 2 * 86_400_000);
  if (await page.getByRole("button", { name: "Play playback", exact: true }).count()) await page.getByRole("button", { name: "Play playback", exact: true }).click();
  const seen = [];
  for (let i = 0; i < 30; i += 1) { await page.waitForTimeout(60); seen.push(await timeOf()); }
  await page.getByRole("button", { name: "Pause playback" }).click();
  out.times = seen.map((t) => new Date(t).toISOString());
  const wrapped = seen.findIndex((t, k) => k > 0 && t < seen[k - 1]);
  assert.ok(wrapped > 0, `${label}: the time wraps back after the end (${out.times.join(" ")})`);
  assert.ok(seen.every((t) => t >= min - 86_400_000 && t <= max + 86_400_000), `${label}: the time stays inside the window while looping (to within one frame, under a day at this rate; ${out.times.join(' ')})`);
  out.litAfterWrap = await litPixels(page);
  logLit(`${label}/after-wrap`, out.litAfterWrap);
  assert.ok(out.litAfterWrap > 150, `${label}: dots are still drawn after the wrap (${out.litAfterWrap})`);
  assert.equal(await canvas.getAttribute("data-point-groups"), "1", `${label}: the stream group is still mounted after the wrap`);
}

// With ?loop=off the shower runs past its end and the stream is not drawn: what the owner saw.
async function checkLoopOff() {
  const page = await openPage({ width: 1280, height: 800 });
  try {
    await page.goto(`${base}?experience=shower-${shower}&sky=off&loop=off`);
    await page.waitForSelector("canvas");
    await page.getByRole("region", { name: "Timeline controls" }).waitFor();
    await page.getByRole("button", { name: "Pause playback" }).click();
    const max = Number(await page.locator('input[aria-label="Seek timeline"]').getAttribute("max"));
    await seek(page, max - 1000);
    await frameStream(page);
    const litAtEnd = await litPixels(page);
    await page.getByRole("button", { name: "Play playback", exact: true }).click();
    await page.waitForTimeout(3000);
    const text = await page.getByRole("region", { name: "Timeline controls" }).innerText();
    const t = Date.parse(text.match(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/)?.[0]);
    results.loopOff = { time: new Date(t).toISOString(), pastEnd: t > max, litAtEnd, lit: await litPixels(page) };
    assert.ok(t > max, "loop off: the time runs past the end of the window");
    logLit("loop-off/at-end", litAtEnd); logLit("loop-off/past-end", results.loopOff.lit);
    assert.ok(litAtEnd > 150 && results.loopOff.lit < 0.7 * litAtEnd, `loop off: the stream dots are gone past the end (${litAtEnd} lit pixels at the end, ${results.loopOff.lit} past it; orbit lines remain)`);
  } finally {
    await page.close();
  }
}

// Ecliptic-up view (owner, 2026-10-15: "ours seems to be on a different plane to meteorshowers"): Earth's path, a circle in the ecliptic, is a flat ellipse whose
// major axis is horizontal (its minor axis vertical) within 8 degrees, and its height is under half its width. With ?up=equatorial it is tilted by the obliquity.
const pathShape = async (page) => {
  const png = (await page.getByTestId("earth-moon-canvas").screenshot()).toString("base64");
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const copy = document.createElement("canvas");
    copy.width = image.width; copy.height = image.height;
    const ctx = copy.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
    let [n, sx, sy, sxx, syy, sxy, minX, maxX, minY, maxY] = [0, 0, 0, 0, 0, 0, copy.width, 0, copy.height, 0];
    for (let i = 0; i < pixels.length; i += 4) {
      const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
      if (b > 90 && b - r > 35 && b - g > 15 && g >= r) {
        const x = (i / 4) % copy.width; const y = Math.floor(i / 4 / copy.width);
        n += 1; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
    const [mx, my] = [sx / n, sy / n];
    const [cxx, cyy, cxy] = [sxx / n - mx * mx, syy / n - my * my, sxy / n - mx * my];
    const angle = (0.5 * Math.atan2(2 * cxy, cxx - cyy) * 180) / Math.PI; // major axis angle from horizontal
    return { n, angleDeg: angle, width: maxX - minX, height: maxY - minY, canvasWidth: copy.width };
  }, png);
};

async function checkEclipticFlat(page, label, query, expectFlat) {
  const out = (results[label].eclipticFlat ??= {});
  const p = await openPage(page.viewportSize());
  try {
    await p.goto(`${base}?experience=shower-${shower}&sky=off${query}`);
    await p.waitForSelector("canvas");
    await p.getByRole("region", { name: "Timeline controls" }).waitFor();
    await p.getByRole("button", { name: "Pause playback" }).click();
    await p.getByLabel("Select object").selectOption("sun");
    const closeInfo = p.locator("#info-panel .info-panel-close");
    if (await closeInfo.count()) await closeInfo.click();
    const compact = p.locator(".object-camera-picker");
    if (await compact.isVisible()) {
      const value = await compact.evaluate((select) => [...select.options].find((o) => o.textContent.trim() === "Overview")?.value ?? null);
      await compact.selectOption(value);
    } else await p.getByRole("button", { name: "Overview", exact: true }).click();
    await p.waitForTimeout(1500);
    const box = await p.getByTestId("earth-moon-canvas").boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    let shape = await pathShape(p);
    for (let k = 0; k < 160 && !(shape.n > 300 && shape.width > 0.3 * shape.canvasWidth && shape.width < 0.97 * shape.canvasWidth); k += 1) {
      await p.mouse.wheel(0, -120);
      await p.waitForTimeout(250);
      shape = await pathShape(p);
    }
    out[query || "default"] = shape;
    assert.ok(shape.n > 250, `${label}${query}: Earth's path is found (${shape.n} blue pixels)`);
    if (expectFlat) {
      assert.ok(Math.abs(shape.angleDeg) < 8, `${label}${query}: the path's major axis is horizontal within 8 deg (${shape.angleDeg.toFixed(1)})`);
      assert.ok(shape.height < 0.5 * shape.width, `${label}${query}: the path is a flat ellipse (${shape.width} x ${shape.height})`);
    } else {
      assert.ok(Math.abs(shape.angleDeg) > 8 || shape.height > 0.5 * shape.width, `${label}${query}: with celestial-north up the path is tilted (${shape.angleDeg.toFixed(1)} deg)`);
    }
    if (outDir) await p.screenshot({ path: `${outDir}/${label}-ecliptic-flat${query.replace(/\W/g, "-")}.png` });
  } finally {
    await p.close();
  }
}

// Whole-year timeline (owner, 2026-10-16: "can we make this run for a whole year?"): the timeline spans about 365 days with the peak in the middle, the activity window and
// the peak stay marked, the rate reads "outside the activity window" away from it, the default playback rate is a week per second, and at the start, middle and end of the year the
// dots and Earth are drawn. ?span=activity gives the activity window alone.
async function checkYear(page, label, canvas) {
  const out = (results[label].year = {});
  const slider = page.locator('input[aria-label="Seek timeline"]');
  const [min, max] = [Number(await slider.getAttribute("min")), Number(await slider.getAttribute("max"))];
  const days = (max - min) / 86_400_000;
  out.spanDays = Number(days.toFixed(3));
  assert.ok(Math.abs(days - 365.25) < 1, `${label}: the timeline spans about a year (${days.toFixed(2)} days)`);
  const peak = Date.parse(settingsFile.activity.peakUtc);
  assert.ok(Math.abs((peak - min) / (max - min) - 0.5) < 0.005, `${label}: the peak is mid-timeline`);
  assert.equal(await page.locator("button.timeline-window").count(), 1, `${label}: the activity window is still marked`);
  assert.equal(await page.locator("button.timeline-window-peak").count(), 1, `${label}: the peak is still marked`);
  out.playbackRate = await page.getByLabel("Playback speed").inputValue();
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
    // Earth: its label (it is a selected-by-priority item at every zoom of this framing) or, failing that, its blue path.
    const earthPath = (await pathPixels(page)).blue;
    out.instants[name] = { lit, earthLabel: labels.includes("earth"), earthPathPixels: earthPath };
    assert.ok(labels.includes("earth") || earthPath > 100, `${label}/year-${name}: Earth is drawn (label ${labels.includes("earth")}, path pixels ${earthPath})`);
    if (name === "start") {
      if (!(await page.locator("#info-panel").count())) await page.getByRole("button", { name: streamButtonName }).click();
      const text = (await page.locator("#info-panel").innerText()).replace(/\s+/g, " ");
      assert.match(text, /outside the activity window/i, `${label}: away from the activity window the rate says so`);
      const close = page.locator("#info-panel .info-panel-close");
      if (await close.count()) await close.click();
    }
  }
}

async function checkSpanActivity() {
  const page = await openPage({ width: 1280, height: 800 });
  try {
    await page.goto(`${base}?experience=shower-${shower}&sky=off&span=activity`);
    await page.waitForSelector("canvas");
    await page.getByRole("region", { name: "Timeline controls" }).waitFor();
    const slider = page.locator('input[aria-label="Seek timeline"]');
    const days = (Number(await slider.getAttribute("max")) - Number(await slider.getAttribute("min"))) / 86_400_000;
    results.spanActivity = { days: Number(days.toFixed(3)) };
    assert.ok(Math.abs(days - (Date.parse(settingsFile.activity.endUtc) - Date.parse(settingsFile.activity.startUtc)) / 86_400_000) < 0.01, `?span=activity: the timeline is the activity window (${days} days)`);
  } finally {
    await page.close();
  }
}

// Orbit sets (owner, 2026-10-16, to compare all orbits with reliable-only): the panel says which set is shown, its count and the cited rule; ?orbits=reliable draws the smaller set;
// Developer > Display settings offers both and choosing one reloads with it.
const reliableCount = () => {
  const rows = JSON.parse(readFileSync(orbitFile, "utf8")).rows;
  const rule = settingsFile.stream.quality.rule;
  const isReliable = (r) => r[9] >= rule.minConvergenceAngleDeg && r[11] <= rule.maxVelocityErrorFraction * r[10];
  return { all: rows.length, reliable: rows.filter(isReliable).length, pairsFlagged: rows.filter((r) => r[12] === 1).length, pairsFlaggedReliable: rows.filter((r) => r[12] === 1 && isReliable(r)).length };
};

async function checkQuality() {
  const counts = reliableCount();
  const out = (results.quality = { counts });
  const page = await openPage({ width: 1280, height: 800 });
  try {
    for (const set of ["all", "reliable"]) {
      await page.goto(`${base}?experience=shower-${shower}&sky=off&orbits=${set}`);
      await page.waitForSelector("canvas");
      await page.getByRole("region", { name: "Timeline controls" }).waitFor();
      await page.getByRole("button", { name: "Pause playback" }).click();
      await page.getByLabel("Select object").selectOption(`${shower}-stream`);
      if (!(await page.locator("#info-panel").count())) await page.getByRole("button", { name: streamButtonName }).click();
      const description = (await page.locator("#info-panel").innerText()).replace(/\s+/g, " ");
      assert.match(description, new RegExp(`${counts[set]} measured meteoroid orbits`), `orbits=${set}: the stream describes ${counts[set]} orbits`);
      await page.locator("#info-panel .provenance-badge").click();
      const detail = (await page.locator("#info-panel .provenance-detail").innerText()).replace(/\s+/g, " ");
      const sentence = detail.match(/Orbit set shown:[^]*?double entries[^.]*\./)?.[0] ?? "";
      out[set] = sentence.slice(0, 700);
      assert.match(sentence, new RegExp(`Orbit set shown: ${set === "all" ? "all orbits" : "reliable orbits only"} \\(${counts[set]} of ${counts.all} bound orbits`), `orbits=${set}: the panel says which set and its count`);
      assert.match(sentence, new RegExp(`has ${counts.reliable} and cuts ${counts.all - counts.reliable}`), `orbits=${set}: both counts are stated`);
      const rule = settingsFile.stream.quality.rule;
      assert.ok(sentence.includes(`convergence angle Q at least ${rule.minConvergenceAngleDeg}° and velocity error at most ${Math.round(rule.maxVelocityErrorFraction * 100)}%`), `orbits=${set}: the rule is stated`);
      assert.ok(sentence.includes(rule.source.name.split(/[,(:]/)[0].trim()), `orbits=${set}: the rule is cited (${rule.source.name.split(/[,(:]/)[0].trim()})`);
      assert.ok(sentence.includes(rule.quote.slice(1, 46)), `orbits=${set}: the published wording is quoted`);
      assert.ok(sentence.includes(`${counts.pairsFlagged} records flagged as double entries are kept in both sets (${counts.pairsFlaggedReliable} of them in the reliable set)`), `orbits=${set}: the double entries are counted (${counts.pairsFlagged}, ${counts.pairsFlaggedReliable} in the reliable set)`);
      assert.match(detail, new RegExp(`${counts[set]} orbits drawn`), `orbits=${set}: the provenance counts the orbits drawn`);
      assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-point-groups"), "1", `orbits=${set}: the stream is drawn`);
      if (outDir) await page.screenshot({ path: `${outDir}/quality-${set}.png` });
    }
    // The live switch: Developer > Display settings, choosing the other set reloads with it.
    await page.goto(`${base}?experience=shower-${shower}&sky=off`);
    await page.waitForSelector("canvas");
    await page.getByRole("button", { name: "Developer mode" }).click();
    const reliableButton = page.getByRole("button", { name: `Reliable only (${counts.reliable})` });
    assert.equal(await page.getByRole("button", { name: `All orbits (${counts.all})` }).getAttribute("aria-pressed"), "true", "the default set is all orbits");
    await Promise.all([page.waitForURL(/orbits=reliable/), reliableButton.click()]);
    await page.waitForSelector("canvas");
    await page.getByRole("button", { name: "Developer mode" }).click();
    assert.equal(await page.getByRole("button", { name: `Reliable only (${counts.reliable})` }).getAttribute("aria-pressed"), "true", "after the switch the reliable set is active");
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
  await page.getByRole("button", { name: "Developer mode" }).click();
  const [ecliptic, equatorial] = [page.getByRole("button", { name: "Planets' plane (ecliptic)" }), page.getByRole("button", { name: "Earth's pole (equatorial)" })];
  assert.equal(await ecliptic.getAttribute("aria-pressed"), "true", `${label}: the default up direction is the settings file's (ecliptic)`);
  out.default = await up();
  assert.ok(Math.abs(out.default[0]) < 1e-5 && Math.abs(out.default[1] - 0.917482) < 1e-5 && Math.abs(out.default[2] - 0.397777) < 1e-5, `${label}: the camera's up is ecliptic north (${out.default})`);
  await page.evaluate(() => { window.__noReload = true; });
  await equatorial.click();
  await page.waitForTimeout(500);
  out.equatorial = await up();
  assert.deepEqual(out.equatorial.map((v) => Math.round(v * 1e5) / 1e5), [0, 1, 0], `${label}: switching to Earth's pole turns the camera's up to celestial north (${out.equatorial})`);
  assert.equal(await page.evaluate(() => window.__noReload === true), true, `${label}: switching did not reload the page`);
  await ecliptic.click();
  await page.waitForTimeout(500);
  assert.deepEqual((await up()).map((v) => Math.round(v * 1e5) / 1e5), out.default.map((v) => Math.round(v * 1e5) / 1e5), `${label}: switching back restores the ecliptic up`);
  await page.getByRole("button", { name: "Developer mode" }).click();
}

async function run(label, viewport) {
  const page = await openPage(viewport);
  const shot = async (name) => { if (outDir) await page.screenshot({ path: `${outDir}/${label}-${name}.png` }); };
  const streamId = `${shower}-stream`;
  try {
    await page.goto(`${base}?experience=shower-${shower}&sky=off`);
    await page.waitForSelector("canvas");
    await page.getByRole("region", { name: "Timeline controls" }).waitFor();
    const canvas = page.getByTestId("earth-moon-canvas");
    assert.ok(haveOrbits, `${label}: the measured orbits are fetched (node tools/data/fetch-meteoroid-orbits.mjs ${settingsFile.stream.iauCode}); the not-fetched case is checked separately`);
    assert.equal(await canvas.getAttribute("data-point-groups"), "1", `${label}: one stream group is mounted`);
    assert.equal(await page.locator(`option[value="${streamId}"]`).count(), 1, `${label}: the stream is listed once`);
    assert.equal(await page.locator('option[value="columbia"]').count(), 0, `${label}: no Apollo objects`);
    assert.equal(await page.locator('option[value="moon"]').count(), 0, `${label}: no Moon item`);
    await page.getByRole("button", { name: "Pause playback" }).click();

    // The activity window and its peak are on the timeline.
    const windowButton = page.locator("button.timeline-window");
    assert.equal(await windowButton.count(), 1, `${label}: one activity window`);
    const peakButton = page.locator("button.timeline-window-peak");
    assert.equal(await peakButton.count(), 1, `${label}: the peak is marked`);
    assert.ok(await page.locator(".timeline-window-curve path").count() >= 2, `${label}: the rate curve is drawn`);
    const windowLabel = await windowButton.getAttribute("aria-label");
    const [startText, endText] = windowLabel.split(", ").slice(1).join(", ").split(" to ");
    results[label] = { windowLabel, startText, endText, readings: {} };

    // Step to window start, peak and end; the stream is drawn and the rate readout follows the curve.
    const panel = page.locator("#info-panel");
    // Select the stream, frame it with the Focus stream preset, then open its details with Info.
    const focusStream = async () => {
      await page.getByLabel("Select object").selectOption("earth");
      await page.getByLabel("Select object").selectOption(streamId);
      const close = page.locator("#info-panel .info-panel-close");
      if (await close.count()) await close.click();
      const compactPicker = page.locator(".object-camera-picker");
      if (await compactPicker.isVisible()) {
        const value = await compactPicker.evaluate((select) => [...select.options].find((o) => o.textContent.trim() === "Focus stream")?.value ?? null);
        assert.ok(value, `${label}: Focus stream preset exists`);
        await compactPicker.selectOption(value);
      } else {
        await page.getByRole("button", { name: "Focus stream", exact: true }).click();
      }
      await page.waitForTimeout(1500);
    };
    const openDetails = async () => {
      if (!(await panel.count())) await page.getByRole("button", { name: streamButtonName }).click();
      await panel.waitFor();
      assert.equal(await panel.getAttribute("data-info-id"), streamId, `${label}: the stream's details are shown`);
    };

    // T-038: the timeline now spans a year; the start, peak and end scenarios below are the activity window's, from the settings file.
    const start = String(Date.parse(settingsFile.activity.startUtc));
    const end = String(Date.parse(settingsFile.activity.endUtc));
    for (const [name, move] of [
      ["start", () => seek(page, Number(start))],
      ["peak", async () => { await peakButton.click(); await page.waitForTimeout(500); }],
      ["end", () => seek(page, Number(end))],
    ]) {
      await move();
      // Jumping to the peak opens the window's details; frame the stream again, then read its own details.
      await focusStream();
      const lit = await litPixels(page);
      logLit(`${label}/${name}`, lit);
      assert.ok(lit > 150, `${label}/${name}: stream dots are visible (${lit})`);
      await shot(`${name}-focus`);
      await openDetails();
      const text = await panel.innerText();
      assert.match(text, /Activity rate/, `${label}/${name}: rate readout is shown`);
      results[label].readings[name] = { lit, panel: text.replace(/\s+/g, " ").slice(0, 900) };
      await shot(name);
    }
    // Zoomed far out the stream and Earth are in one view.
    await focusStream();
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 8; i += 1) await page.mouse.wheel(0, 600);
    await page.waitForTimeout(800);
    results[label].zoomedOutLit = await litPixels(page);
    assert.ok(results[label].zoomedOutLit > 150, `${label}: stream visible zoomed out (${results[label].zoomedOutLit})`);
    await shot("zoomed-out");
    await openDetails();
    // The readout rises to the peak and falls again.
    const rateOf = (name) => Number(results[label].readings[name].panel.match(/Activity rate\D*([\d.]+)/)?.[1]);
    assert.ok(rateOf("peak") > rateOf("start"), `${label}: rate at the peak is above the start`);
    assert.ok(rateOf("peak") > rateOf("end"), `${label}: rate at the peak is above the end`);

    // The radiant and the published/modelled split are visible in the stream's details.
    const text = await panel.innerText();
    assert.match(text, /Radiant/, `${label}: radiant readout`);
    assert.match(text, new RegExp(`RA ${settingsFile.radiant.raDeg.toFixed(1)}`), `${label}: radiant right ascension (${settingsFile.radiant.raDeg})`);
    assert.match(text, new RegExp(`Dec \\+?${settingsFile.radiant.decDeg.toFixed(1)}`), `${label}: radiant declination (${settingsFile.radiant.decDeg})`);
    assert.match(text, /J2000/, `${label}: the radiant frame is stated`);
    assert.ok(text.includes(settingsFile.radiant.source.name.split(/[,(:]/)[0].trim()), `${label}: the radiant cites its source (${settingsFile.radiant.source.name.split(/[,(:]/)[0].trim()})`);
    const badge = panel.locator(".provenance-badge");
    assert.match(await badge.innerText(), /^Illustrative/, `${label}: the stream is marked illustrative`);
    await badge.click();
    const detail = await panel.locator(".provenance-detail").innerText();
    assert.match(detail, /CAMS/, `${label}: the measured source is cited`);
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
    await shot("stream-details");

    // The window's own details name the published night and the modelled shape.
    await windowButton.click({ force: true }); // the peak marker sits on the window's centre now that the timeline is a year; it opens the same window details
    await page.waitForTimeout(400);
    const windowPanel = await page.locator("#info-panel").innerText();
    assert.match(windowPanel, /activity/i, `${label}: window details open`);
    results[label].windowPanel = windowPanel.replace(/\s+/g, " ").slice(0, 600);
    await shot("window-details");
    await checkSunEarth(page, label, shot, canvas);
    await checkBodies(page, label, shot, canvas);
    await checkWholeOrbit(page, label, shot, canvas);
    await checkCrossing(page, label);
    await checkYear(page, label, canvas);
    await checkLoop(page, label, canvas);
    await checkEclipticFlat(page, label, "", true);
    if (label === "desktop") await checkEclipticFlat(page, label, "&up=equatorial", false);
    if (label === "desktop") await checkUpToggle(page, label);
    if (label === "desktop") await checkFrameRate(page, label);
  } finally {
    await page.close();
  }
}

try {
  await run("desktop", { width: 1280, height: 800 });
  await run("phone", { width: 390, height: 844 });
  await checkNotFetched();
  await checkLoopOff();
  await checkSpanActivity();
  await checkQuality();
  // Existing experiences still mount by their old names.
  const page = await openPage({ width: 1280, height: 800 });
  await page.goto(base);
  await page.waitForSelector("canvas");
  assert.equal(await page.locator('option[value="columbia"]').count(), 1, "Apollo is still the default");
  await page.goto(`${base}?experience=synthetic-ring`);
  await page.waitForSelector("canvas");
  assert.equal(await page.locator('option[value="debris-ring"]').count(), 1, "synthetic-ring still mounts");
  await page.close();
} finally {
  await browser.close();
}
console.log(JSON.stringify({ shower, results, errors }, null, 2));
if (errors.length > 0) process.exit(1);
