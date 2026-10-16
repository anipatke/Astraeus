// T-056: the Perseids from the Global Meteor Network (GMN) orbits, and CAMS beside them, in headless Chromium (software GL).
//   PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-showers-gmn.mjs
// Needs the vite dev server (ASTRAEUS_URL, default http://localhost:5199/app.html) and both data/local/cams-iau-7.json and data/local/gmn-iau-7.json.
// Asserts, with zero console errors:
//   ?source=gmn draws the stream (stream-coloured pixels) from the GMN file; the panel names the GMN, CC BY 4.0, the months and the counts;
//   the default (no ?source) is CAMS and its panel carries no GMN sentence; ?source=gmn&orbits=reliable draws the smaller set and states the Qc / Vgeo-sigma rule;
//   Developer > Display settings offers "Orbits from CAMS" / "Orbits from GMN" and choosing one reloads with ?source=.
// ASTRAEUS_SHIPPED=1 instead checks the public build (see checkShipped).
// With ASTRAEUS_EVIDENCE_DIR set it also writes the owner's comparison screenshots to <dir>/compare/ (desktop 1440x900, paused AT the peak instant,
// the timeline read back to prove it): per source an overview (plain load), the whole-orbit preset, a close view of Earth's crossing, and a 16:9 card of the scene;
// then GMN all against GMN reliable at the same camera.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync } from "node:fs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
const settings = JSON.parse(readFileSync(new URL("../../data/showers/perseids.json", import.meta.url), "utf8"));
const file = (source) => JSON.parse(readFileSync(new URL(`../../data/local/${source}-iau-7.json`, import.meta.url), "utf8"));
const rule = settings.stream.quality.rule;
const reliableOf = (rows) => rows.filter((r) => r[9] >= rule.minConvergenceAngleDeg && r[11] <= rule.maxVelocityErrorFraction * r[10]);
const peakMs = Date.parse(settings.activity.peakUtc);
const VIEWPORT = { width: 1440, height: 900 };
const compare = outDir ? `${outDir}/compare` : null;
if (compare) mkdirSync(compare, { recursive: true });

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = { peakUtc: settings.activity.peakUtc, shots: [] };

async function openPage(viewport = VIEWPORT) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  return page;
}

async function load(page, query) {
  await page.goto(`${base}?experience=shower-perseids${query}`);
  await page.waitForSelector("canvas");
  await page.getByRole("region", { name: "Timeline controls" }).waitFor();
  await page.waitForTimeout(2500);
}

const timelineReading = async (page) => (await page.getByRole("region", { name: "Timeline controls" }).innerText()).match(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/)?.[0];

async function pauseAtPeak(page) {
  if (await page.getByRole("button", { name: "Pause playback" }).count()) await page.getByRole("button", { name: "Pause playback" }).click();
  await page.locator('input[aria-label="Seek timeline"]').evaluate((input, time) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(time));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, peakMs);
  await page.waitForTimeout(800);
  const reading = await timelineReading(page);
  assert.ok(reading !== undefined && Math.abs(Date.parse(reading) - peakMs) <= 60_000, `the timeline reads the peak instant (${reading} vs ${settings.activity.peakUtc})`);
  assert.ok(await page.getByRole("button", { name: "Play playback", exact: true }).count(), "playback is paused");
  return reading;
}

async function preset(page, objectId, name) {
  await page.getByLabel("Select object").selectOption(objectId);
  const close = page.locator("#info-panel .info-panel-close");
  if (await close.count()) await close.click();
  const compact = page.locator(".object-camera-picker");
  if (await compact.isVisible()) {
    const value = await compact.evaluate((select, text) => [...select.options].find((o) => o.textContent.trim() === text)?.value ?? null, name);
    assert.ok(value, `the ${name} preset exists`);
    await compact.selectOption(value);
  } else await page.getByRole("button", { name, exact: true }).click();
  await page.waitForTimeout(3000);
}

// Earth's crossing: the Overview preset, scrolled in 8 steps so the inner planets' paths, Earth and the stream crossing them fill the picture; the same moves for every source.
// (Focus Earth is no use here: the dots lie along whole orbits, so none are within sight of Earth at that scale; the crossing reads as the stream passing through Earth's path.)
async function closeOnEarth(page) {
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.waitForTimeout(2500);
  const box = await page.getByTestId("earth-moon-canvas").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let k = 0; k < 8; k += 1) { await page.mouse.wheel(0, -300); await page.waitForTimeout(100); }
  await page.waitForTimeout(2500);
}

// Stream-coloured pixels on the canvas (the same hue test as browser-showers.mjs).
async function litPixels(page) {
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
    const hueOf = (r, g, b) => {
      const max = Math.max(r, g, b); const min = Math.min(r, g, b);
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
      const gap = Math.abs(hueOf(r, g, b) - target);
      if (Math.min(gap, 360 - gap) < 25) lit += 1;
    }
    return lit;
  }, { data: png, colour: settings.look.streamColor });
}

async function streamPanel(page) {
  await page.getByLabel("Select object").selectOption("perseids-stream");
  if (!(await page.locator("#info-panel").count())) await page.getByRole("button", { name: /^Information about Perseids stream$/ }).click();
  const description = (await page.locator("#info-panel").innerText()).replace(/\s+/g, " ");
  await page.locator("#info-panel .provenance-badge").click();
  const detail = (await page.locator("#info-panel .provenance-detail").innerText()).replace(/\s+/g, " ");
  return { description, detail };
}

// ---- the public build: the Perseids load the stream from the story's shipped copy --------------------------------------------------------------
// ASTRAEUS_SHIPPED=1 against `vite preview` of an ASTRAEUS_PUBLIC_BUILD=1 build (no data/local is served there).
async function checkShipped() {
  const shipped = JSON.parse(readFileSync(new URL("../../data/stories/perseids/gmn-iau-7.json", import.meta.url), "utf8"));
  const kept = shipped.provenance.counts.kept;
  const page = await openPage({ width: 1280, height: 800 });
  const requests = [];
  page.on("response", (response) => requests.push({ url: response.url(), status: response.status() }));
  try {
    await load(page, "&sky=off");
    await page.getByRole("button", { name: "Pause playback" }).click();
    const fromShipped = requests.filter((r) => /\/gmn-iau-7[^/]*\.json$/.test(new URL(r.url).pathname));
    assert.ok(fromShipped.length >= 1 && fromShipped.every((r) => r.status === 200), `the stream is loaded from the shipped copy (${JSON.stringify(fromShipped)})`);
    assert.ok(!requests.some((r) => r.url.includes("/data/local/") && r.status === 200), "no data/local file is served");
    const panel = await streamPanel(page);
    assert.match(panel.description, new RegExp(`${kept} measured meteoroid orbits`), "the shipped copy's orbits are drawn");
    for (const text of ["Global Meteor Network", "CC BY 4.0", "Vida", "506(4)", "491(2)", "Read from 202507 and 202508", `${kept} bound orbits kept`]) assert.ok(panel.detail.includes(text), `the panel credits the GMN: "${text}"`);
    const lit = await litPixels(page);
    assert.ok(lit > 150, `the stream is drawn from the shipped copy (${lit} stream-coloured pixels)`);
    assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-point-groups"), "1", "one stream group is mounted");
    results.shipped = { requests: fromShipped, kept, lit, licence: shipped.provenance.licence };
    // CAMS can never ship (I-030): the public build offers only the sources it ships, so ?source=cams falls back to the shipped GMN stream and the Developer panel has no source switch.
    await load(page, "&sky=off&source=cams");
    await page.getByRole("button", { name: "Pause playback" }).click();
    const cams = await streamPanel(page);
    assert.match(cams.description, new RegExp(`${kept} measured meteoroid orbits`), "?source=cams in the public build: the shipped GMN orbits are drawn instead of nothing");
    assert.ok(cams.detail.includes("Global Meteor Network"), "?source=cams in the public build: the panel names the GMN source actually drawn");
    assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-point-groups"), "1", "?source=cams in the public build: a stream group is drawn");
    await page.getByRole("button", { name: "Developer mode" }).click();
    assert.equal(await page.getByRole("button", { name: /^Orbits from (CAMS|GMN)$/ }).count(), 0, "no source switch is offered in the public build");
  } finally {
    await page.close();
  }
}

// ---- assertions -------------------------------------------------------------------------------------------------------------------------------
async function checkSources() {
  const gmn = file("gmn");
  const cams = file("cams");
  const gmnRows = gmn.rows;
  const counts = { gmnAll: gmnRows.length, gmnReliable: reliableOf(gmnRows).length, camsAll: cams.rows.length };
  results.counts = { ...counts, gmnProvenance: gmn.provenance.counts };
  const page = await openPage({ width: 1280, height: 800 });
  try {
    for (const set of ["all", "reliable"]) {
      await load(page, `&sky=off&source=gmn&orbits=${set}`);
      await page.getByRole("button", { name: "Pause playback" }).click();
      const { description, detail } = await streamPanel(page);
      const shown = set === "all" ? counts.gmnAll : counts.gmnReliable;
      assert.match(description, new RegExp(`${shown} measured meteoroid orbits`), `gmn/${set}: the stream describes ${shown} orbits`);
      assert.ok(detail.includes("Global Meteor Network"), `gmn/${set}: the panel names the Global Meteor Network`);
      assert.ok(detail.includes("CC BY 4.0"), `gmn/${set}: the panel states the licence`);
      assert.ok(detail.includes("Read from 202507 and 202508"), `gmn/${set}: the panel names the months`);
      assert.ok(detail.includes(`${gmn.provenance.counts.members} records, ${gmn.provenance.counts.unbound} unbound orbits dropped, ${gmn.provenance.counts.kept} bound orbits kept`), `gmn/${set}: the panel gives the counts`);
      assert.ok(detail.includes(`Orbit set shown: ${set === "all" ? "all orbits" : "reliable orbits only"} (${shown} of ${counts.gmnAll} bound orbits`), `gmn/${set}: the panel says which set and its count`);
      assert.ok(detail.includes(`has ${counts.gmnReliable} and cuts ${counts.gmnAll - counts.gmnReliable}`), `gmn/${set}: both counts are stated`);
      assert.ok(detail.includes("Qc") && detail.includes("Vgeo sigma"), `gmn/${set}: the rule is mapped to GMN's own columns`);
      assert.ok(detail.includes(`${shown} orbits drawn`), `gmn/${set}: the provenance counts the orbits drawn`);
      assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-point-groups"), "1", `gmn/${set}: the stream is drawn`);
      const lit = await litPixels(page);
      assert.ok(lit > 150, `gmn/${set}: stream-coloured pixels are drawn (${lit})`);
      results[`gmn-${set}`] = { description: description.slice(0, 300), lit };
    }
    // The default is the GMN (owner, 2026-10-16) and credits it: licence, the network and both citations.
    await load(page, "&sky=off");
    await page.getByRole("button", { name: "Pause playback" }).click();
    const dflt = await streamPanel(page);
    assert.match(dflt.description, new RegExp(`${counts.gmnAll} measured meteoroid orbits`), "the default source is the GMN");
    for (const text of ["Global Meteor Network", "CC BY 4.0", "Vida", "506(4)", "491(2)"]) assert.ok(dflt.detail.includes(text), `the default panel credits the GMN: "${text}"`);
    // CAMS stays available at ?source=cams and says nothing of the GMN.
    await load(page, "&sky=off&source=cams");
    await page.getByRole("button", { name: "Pause playback" }).click();
    const { description, detail } = await streamPanel(page);
    assert.match(description, new RegExp(`${counts.camsAll} measured meteoroid orbits`), "?source=cams draws the CAMS orbits");
    assert.ok(!detail.includes("Global Meteor Network"), "the CAMS panel carries no GMN sentence");
    assert.ok(detail.includes("CAMS"), "the CAMS panel names CAMS");
    // The live switch, from the default.
    await load(page, "&sky=off");
    await page.getByRole("button", { name: "Developer mode" }).click();
    assert.equal(await page.getByRole("button", { name: "Orbits from GMN" }).getAttribute("aria-pressed"), "true", "GMN is the active source by default");
    await Promise.all([page.waitForURL(/source=cams/), page.getByRole("button", { name: "Orbits from CAMS" }).click()]);
    await page.waitForSelector("canvas");
    await page.getByRole("button", { name: "Developer mode" }).click();
    assert.equal(await page.getByRole("button", { name: "Orbits from CAMS" }).getAttribute("aria-pressed"), "true", "after the switch CAMS is active");
    results.switch = "GMN (default) -> CAMS reloads with ?source=cams and marks CAMS active";
    // Not fetched: with the GMN file blocked the stream is not drawn and the panel gives the GMN command.
    await page.route("**/data/local/gmn-iau-*.json", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>app</title>" }));
    const shippedBlock = (url) => url.pathname.startsWith("/data/stories/") && url.search === ""; // the bare file fetch, not vite's ?url module
    await page.route(shippedBlock, (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>app</title>" })); // the shipped copy is the dev fallback
    await load(page, "&sky=off&source=gmn");
    const absent = await streamPanel(page);
    assert.ok(absent.description.includes("--source gmn --months 202507,202508"), "not fetched: the panel gives the GMN fetch command");
    assert.notEqual(await page.getByTestId("earth-moon-canvas").getAttribute("data-point-groups"), "1", "not fetched: no stream group");
    await page.unroute("**/data/local/gmn-iau-*.json");
    await page.unroute(shippedBlock);
  } finally {
    await page.close();
  }
}

// ---- the owner's comparison screenshots -------------------------------------------------------------------------------------------------------
// One camera path per source, the same for both: plain load (overview) paused at the peak, whole orbit, a close view of Earth's crossing.
async function shoot(page, name) {
  const path = `${compare}/${name}.png`;
  await page.screenshot({ path });
  results.shots.push({ name: `${name}.png`, timeline: await timelineReading(page) });
}

// The card: the picture alone, a centred 16:9 crop of the canvas with every control, label and panel hidden (the scene runs under the bottom panel, so the crop may too).
async function card(page, name) {
  const box = await page.getByTestId("earth-moon-canvas").boundingBox();
  const height = Math.min(box.height, (box.width * 9) / 16);
  const width = (height * 16) / 9;
  const clip = { x: Math.round(box.x + (box.width - width) / 2), y: Math.round(box.y + (box.height - height) / 2), width: Math.round(width), height: Math.round(height) };
  await page.addStyleTag({ content: "[data-hide-chrome] * { visibility: hidden !important } [data-hide-chrome] canvas { visibility: visible !important }" });
  await page.evaluate(() => document.body.setAttribute("data-hide-chrome", ""));
  await page.screenshot({ path: `${compare}/${name}.png`, clip });
  await page.evaluate(() => document.body.removeAttribute("data-hide-chrome"));
  results.shots.push({ name: `${name}.png`, clip, timeline: await timelineReading(page) });
}

async function captureSource(source, query) {
  const page = await openPage();
  try {
    await load(page, `&source=${source}${query}`); // sky on: no sky=off
    const reading = await pauseAtPeak(page);
    await page.waitForTimeout(1500);
    await shoot(page, `${source}-overview-peak`);
    await card(page, `${source}-card-overview-peak`);
    await preset(page, "swift-tuttle-orbit", "Whole orbit");
    await shoot(page, `${source}-whole-orbit-peak`);
    await card(page, `${source}-card-whole-orbit-peak`);
    await closeOnEarth(page);
    assert.equal(await timelineReading(page), reading, `${source}: still paused at the peak`);
    await shoot(page, `${source}-earth-crossing-peak`);
    await card(page, `${source}-card-earth-crossing-peak`);
  } finally {
    await page.close();
  }
}

async function captureSets() {
  for (const set of ["all", "reliable"]) {
    const page = await openPage();
    try {
      await load(page, `&source=gmn&orbits=${set}`);
      const reading = await pauseAtPeak(page);
      await page.waitForTimeout(1500);
      await shoot(page, `gmn-${set}-overview-peak`);
      await closeOnEarth(page);
      assert.equal(await timelineReading(page), reading, `gmn ${set}: still paused at the peak`);
      await shoot(page, `gmn-${set}-earth-crossing-peak`);
    } finally {
      await page.close();
    }
  }
}

try {
  if (process.env.ASTRAEUS_SHIPPED === "1") await checkShipped();
  else await checkSources();
  if (compare && process.env.ASTRAEUS_SHIPPED !== "1") {
    await captureSource("cams", "");
    await captureSource("gmn", "");
    await captureSets();
  }
  assert.deepEqual(errors, [], `console errors: ${errors.join(" | ")}`);
  results.errors = errors;
  console.log(JSON.stringify(results, null, 2));
  console.log("browser-showers-gmn: ok, zero console errors");
} catch (error) {
  console.error(JSON.stringify({ ...results, errors }, null, 2));
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
