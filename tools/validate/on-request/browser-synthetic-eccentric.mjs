// Browser check for the made-up belt with a made-up eccentric 1 to 51 AU orbit (?experience=synthetic-eccentric), T-054:
//   1. the marker rule: Earth is a sphere up close and a marker far away, swapped by the pixel threshold (a setting, ?markerpx=);
//   2. under the solar-system scale the enlarged Earth stays a sphere where the true-scale one is a marker;
//   3. the whole eccentric orbit is framed (both sizes) at true scale;
//   4. precision of a vertex of that orbit 50 AU from the Sun, by the same method as browser-precision.mjs.
// Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/on-request/browser-synthetic-eccentric.mjs
// Options: ASTRAEUS_URL (default http://localhost:5199/app.html), ASTRAEUS_EVIDENCE_DIR (eccentric.json; use a new directory).
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chooseScale } from "../driver.mjs";
import * as ui from "../driver.mjs";

import { pw } from "../playwright.mjs";
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const FRAMES = 60;
const PINK = "ff9fd0";
const EARTH_MARKER = "e8e8e8";
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const result = { markerRule: {}, solarSystemScale: {}, framing: {}, precisionAt50Au: {} };

const watch = (page, label) => {
  page.on("pageerror", (error) => errors.push(`pageerror(${label}): ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console(${label}): ${message.text()}`); });
};
const hook = () => {
  const events = new EventTarget();
  window.__THREE_DEVTOOLS__ = events;
  window.__probe = { renderer: null, camera: null, scene: null };
  events.addEventListener("observe", (event) => {
    const o = event.detail;
    if (o && o.isWebGLRenderer && !window.__probe.renderer) {
      window.__probe.renderer = o;
      const render = o.render.bind(o);
      o.render = (scene, camera) => { window.__probe.scene = scene; window.__probe.camera = camera; return render(scene, camera); };
    }
  });
};
const open = async (query, viewport) => {
  const page = await browser.newPage({ viewport });
  watch(page, `${query}@${viewport.width}`);
  await page.addInitScript(hook);
  await page.goto(`${base}?experience=synthetic-eccentric&sky=off${query}`);
  await page.waitForSelector("canvas");
  await ui.waitForShell(page);
  await ui.pausePlayback(page);
  return page;
};
const closeInfo = (page) => ui.closeInfo(page);
const pickPreset = (page, presetId) => ui.chooseCamera(page, presetId);
// The scene writes its state onto the <canvas> element itself.
const swapped = async (page) => page.locator("canvas").first().getAttribute("data-marker-bodies");
const wheel = async (page, clicks, delta) => {
  const box = await page.getByTestId("earth-moon-canvas").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < clicks; i += 1) await page.mouse.wheel(0, delta);
  await page.waitForTimeout(1200);
};
// T-102: Earth's marker from the scene's body readout (how Earth is drawn and where), not a probe of the scene graph plus near-white pixels round it: drawn is true when Earth is in view
// drawn as a marker (a sphere is not a marker).
const earthMarkerProbe = async (page) => {
  const body = await ui.sceneBody(page, "earth");
  return { drawn: Boolean(body?.inView && body.as === "marker"), as: body?.as ?? "none", radiusPx: body?.radiusPx ?? 0 };
};
// The eccentric orbit as the scene's path readout reports it, in canvas px: its vertices in view (of all its vertices) and the box they cover.
const pinkExtent = async (page) => {
  const line = await ui.scenePath(page, "eccentric-path");
  const box = await page.getByTestId("earth-moon-canvas").boundingBox();
  if (!line?.visible || line.inView === 0) return { count: 0, vertices: line?.vertices ?? 0, minX: Infinity, minY: Infinity, maxX: -1, maxY: -1, width: box.width, height: box.height };
  return { count: line.inView, vertices: line.vertices, minX: line.minX * box.width, minY: line.minY * box.height, maxX: line.maxX * box.width, maxY: line.maxY * box.height, width: box.width, height: box.height };
};

// --- 1 and 2: the marker rule, and the solar-system scale -------------------------------------------------------------------------
const markerRule = async (query, label) => {
  const page = await open(query, { width: 1280, height: 800 });
  try {
    const canvas = page.getByTestId("earth-moon-canvas");
    assert.equal(await canvas.getAttribute("data-bodies"), "sun,earth", `${label}: the Sun and Earth are mounted`);
    assert.equal(await canvas.getAttribute("data-sun-centred"), "3", `${label}: the Sun and two paths`);
    await chooseScale(page, "True");
    await ui.pickBody(page, "earth");
    await closeInfo(page);
    await pickPreset(page, "focus-earth");
    // This experience opens at its overview (I-028, T-040: a large centre body), so Focus Earth eases in from the whole orbit: measured about 2.4 s to get under a 100 px sphere, more than the 2.5 s this used to wait.
    await page.waitForTimeout(6000);
    const entry = { threshold: await page.locator("canvas").first().getAttribute("data-marker-px") };
    entry.earthClose = await swapped(page);
    await wheel(page, 12, 600);
    await page.waitForTimeout(2500);
    entry.earthPulledBack = await swapped(page);
    // Pulled back, Earth is at the centre of the view and alone: its marker, if drawn, is the near-white dot there.
    entry.earthPulledBackProbe = await earthMarkerProbe(page);
    await ui.pickBody(page, "sun");
    await closeInfo(page);
    await pickPreset(page, "sun-view");
    await page.waitForTimeout(2500);
    entry.sunViewTrue = await swapped(page);
    return { page, entry };
  } catch (error) {
    await page.close();
    throw error;
  }
};

{
  const { page, entry } = await markerRule("", "default");
  try {
    assert.equal(entry.threshold, "3", "the default threshold is 3 px");
    assert.equal(entry.earthClose, "", "Earth close up is a sphere");
    assert.equal(entry.earthPulledBack, "earth", "Earth pulled back is a marker");
    assert.equal(entry.sunViewTrue, "earth", "Earth seen from the Sun, one AU away, is a marker");
    assert.ok(entry.earthPulledBackProbe.drawn, `the marker is visible at Earth's place (${JSON.stringify(entry.earthPulledBackProbe)})`);
    result.markerRule.default = entry;

    // Solar-system scale: Earth is enlarged 200 times. With the camera right beside the Sun, Earth is 1 AU (23,500 Earth radii) away:
    // true-scale Earth is then a marker and the enlarged one (8 px in radius) is still a sphere. Same camera, same distance, same rule.
    const nearSun = async (scale) => {
      await chooseScale(page, scale);
      await ui.pickBody(page, "sun");
      await closeInfo(page);
      await pickPreset(page, "sun-view");
      await page.waitForTimeout(2000);
      await wheel(page, 80, -600);
      await page.waitForTimeout(2000);
      return swapped(page);
    };
    const enlarged = {};
    enlarged.nearSunTrue = await nearSun("True");
    enlarged.nearSunSolarSystem = await nearSun("Solar system");
    assert.equal(enlarged.nearSunTrue, "earth", "true scale, camera at the Sun: Earth 1 AU away is a marker");
    assert.equal(enlarged.nearSunSolarSystem, "", "solar-system scale, camera at the Sun: the enlarged Earth is a sphere");
    // Pulled far enough back, even the enlarged Earth is too small to show as a sphere.
    await wheel(page, 120, 600);
    await page.waitForTimeout(2000);
    enlarged.pulledFarBack = await swapped(page);
    assert.equal(enlarged.pulledFarBack, "earth", "pulled far enough back even the enlarged Earth becomes a marker");
    result.solarSystemScale = enlarged;
  } finally {
    await page.close();
  }
}
{
  // The threshold is a setting: 0 never swaps; a big one swaps sooner.
  const { page, entry } = await markerRule("&markerpx=0", "threshold-0");
  try {
    assert.equal(entry.threshold, "0", "?markerpx=0 is read");
    assert.equal(entry.earthPulledBack, "", "with the threshold at 0 Earth is never a marker");
    assert.equal(entry.sunViewTrue, "", "with the threshold at 0 Earth in the Sun view stays a (sub-pixel) sphere");
    assert.ok(!entry.earthPulledBackProbe.drawn, `no marker is drawn when the threshold is 0 (${JSON.stringify(entry.earthPulledBackProbe)})`);
    result.markerRule.threshold0 = entry;
  } finally {
    await page.close();
  }
}
{
  const { page, entry } = await markerRule("&markerpx=100", "threshold-100");
  try {
    result.markerRule.threshold100 = entry;
    assert.equal(entry.threshold, "100", "?markerpx=100 is read (the largest threshold the address accepts)");
    assert.equal(entry.earthClose, "", "Earth in the default close-up is about 240 px in radius, over even a 100 px threshold, so it stays a sphere");
    assert.equal(entry.earthPulledBack, "earth", "and it becomes a marker when pulled back");
  } finally {
    await page.close();
  }
}

// --- 3: the whole eccentric orbit is framed ---------------------------------------------------------------------------------------
for (const [label, viewport] of [["desktop", { width: 1280, height: 800 }], ["phone", { width: 390, height: 844 }]]) {
  const page = await open("", viewport);
  try {
    await chooseScale(page, "True");
    await ui.pickBody(page, "eccentric-path");
    await closeInfo(page);
    await pickPreset(page, "focus-eccentric");
    await page.waitForTimeout(4000);
    const extent = await pinkExtent(page);
    const margin = 2;
    assert.ok(extent.count >= 0.99 * extent.vertices && extent.vertices > 0, `${label}: the whole orbit is drawn in view (${extent.count} of ${extent.vertices} vertices)`);
    assert.ok(extent.minX >= margin && extent.minY >= margin && extent.maxX <= extent.width - 1 - margin && extent.maxY <= extent.height - 1 - margin, `${label}: the whole orbit is inside the view (${JSON.stringify(extent)})`);
    const spanFraction = Math.max((extent.maxX - extent.minX) / extent.width, (extent.maxY - extent.minY) / extent.height);
    assert.ok(spanFraction > 0.3, `${label}: the orbit fills a good part of the view (${spanFraction.toFixed(2)})`);
    result.framing[label] = { ...extent, spanFraction };
    // Zoom out as far as the declared reach allows: the orbit stays drawn, with no error.
    await wheel(page, 40, 600);
    const far = await pinkExtent(page);
    assert.ok(far.count > 5, `${label}: the orbit is still drawn at the farthest zoom (${far.count} vertices in view)`);
    result.framing[`${label}-zoomed-out`] = far;
  } finally {
    await page.close();
  }
}

// --- 4: precision 50 AU from the Sun ---------------------------------------------------------------------------------------------
{
  const page = await open("", { width: 1280, height: 800 });
  try {
    await chooseScale(page, "True");
    await ui.pickBody(page, "sun");
    await closeInfo(page);
    await pickPreset(page, "sun-view");
    await page.waitForTimeout(2000);
    const install = () => page.evaluate((colour) => {
      const { scene } = window.__probe;
      let line = null;
      scene.traverse((o) => { if (o.isLine && o.material?.color?.getHexString?.() === colour && line === null) line = o; });
      if (!line) return { ok: false };
      const project = (camera, x, y, z) => {
        const v = camera.matrixWorldInverse.elements, p = camera.projectionMatrix.elements;
        const vx = v[0] * x + v[4] * y + v[8] * z + v[12], vy = v[1] * x + v[5] * y + v[9] * z + v[13], vz = v[2] * x + v[6] * y + v[10] * z + v[14];
        const cx = p[0] * vx + p[4] * vy + p[8] * vz + p[12], cy = p[1] * vx + p[5] * vy + p[9] * vz + p[13], cw = p[3] * vx + p[7] * vy + p[11] * vz + p[15];
        return { x: (cx / cw * 0.5 + 0.5) * window.innerWidth, y: (1 - (cy / cw * 0.5 + 0.5)) * window.innerHeight, depth: -vz };
      };
      const a = line.geometry.getAttribute("position");
      const m = line.matrixWorld.elements;
      const at = (i) => [m[0] * a.getX(i) + m[4] * a.getY(i) + m[8] * a.getZ(i) + m[12], m[1] * a.getX(i) + m[5] * a.getY(i) + m[9] * a.getZ(i) + m[13], m[2] * a.getX(i) + m[6] * a.getY(i) + m[10] * a.getZ(i) + m[14]];
      // The vertex farthest from the GPU origin (the Sun is focused, so the origin is the Sun): the aphelion, about 51 AU out.
      let vertex = 0, far = 0;
      for (let i = 0; i < a.count; i += 1) { const q = at(i); const d = Math.hypot(q[0], q[1], q[2]); if (d > far) { far = d; vertex = i; } }
      window.__sample = () => {
        const camera = window.__probe.camera;
        const q = at(vertex);
        return { vertex: project(camera, ...q), distanceFromOriginUnits: Math.hypot(...q) };
      };
      return { ok: true, vertex, aphelionUnits: far };
    }, PINK);
    // Pull back until the aphelion vertex is on screen.
    let onScreen = false;
    for (let attempt = 0; attempt < 40 && !onScreen; attempt += 1) {
      await wheel(page, 4, 600);
      if (!(await install()).ok) continue;
      const s = await page.evaluate(() => window.__sample());
      onScreen = s.vertex.x >= 0 && s.vertex.x <= 1280 && s.vertex.y >= 0 && s.vertex.y <= 800 && s.vertex.depth > 0;
    }
    assert.ok(onScreen, "the aphelion vertex comes into view with the Sun focused");
    let settled = false;
    for (let attempt = 0; attempt < 30 && !settled; attempt += 1) {
      await page.waitForTimeout(1000);
      await install();
      const probe = await page.evaluate(async () => {
        const out = [];
        for (let i = 0; i < 4; i += 1) { await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); out.push(window.__sample()); }
        return out;
      });
      settled = Math.hypot(probe[3].vertex.x - probe[0].vertex.x, probe[3].vertex.y - probe[0].vertex.y) < 0.01;
    }
    assert.ok(settled, "the camera settled");
    const installed = await install();
    const frames = (n) => page.evaluate(async (count) => {
      const out = [];
      for (let i = 0; i < count; i += 1) { await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); out.push(window.__sample()); }
      return out;
    }, n);
    const still = await frames(FRAMES);
    const box = await page.getByTestId("earth-moon-canvas").boundingBox();
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await page.mouse.move(centre.x, centre.y);
    await page.mouse.down();
    const swept = [];
    for (let i = 0; i < FRAMES; i += 1) {
      await page.mouse.move(centre.x + (i + 1), centre.y + 0.4 * (i + 1));
      swept.push((await frames(1))[0]);
    }
    await page.mouse.up();
    // Cubic least-squares residual, as in browser-precision.mjs: what is left of a path once the camera's smooth motion is removed.
    const cubicResidualMax = (values) => {
      const n = values.length, degree = 3;
      const t = values.map((_, i) => (i / (n - 1)) * 2 - 1);
      const a = Array.from({ length: degree + 1 }, () => new Array(degree + 2).fill(0));
      for (let i = 0; i < n; i += 1) for (let r = 0; r <= degree; r += 1) { for (let c = 0; c <= degree; c += 1) a[r][c] += t[i] ** (r + c); a[r][degree + 1] += values[i] * t[i] ** r; }
      for (let col = 0; col <= degree; col += 1) {
        let pivot = col;
        for (let r = col + 1; r <= degree; r += 1) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
        [a[col], a[pivot]] = [a[pivot], a[col]];
        for (let r = col + 1; r <= degree; r += 1) { const f = a[r][col] / a[col][col]; for (let c = col; c <= degree + 1; c += 1) a[r][c] -= f * a[col][c]; }
      }
      const coef = new Array(degree + 1).fill(0);
      for (let r = degree; r >= 0; r -= 1) { let s = a[r][degree + 1]; for (let c = r + 1; c <= degree; c += 1) s -= a[r][c] * coef[c]; coef[r] = s / a[r][r]; }
      return Math.max(...values.map((v, i) => Math.abs(v - coef.reduce((s, k, p) => s + k * t[i] ** p, 0))));
    };
    const staticMaxPx = Math.max(...still.map((s) => Math.hypot(s.vertex.x - still[0].vertex.x, s.vertex.y - still[0].vertex.y)));
    const sweepResidualPx = Math.max(cubicResidualMax(swept.map((s) => s.vertex.x)), cubicResidualMax(swept.map((s) => s.vertex.y)));
    const AU_UNITS = 149_597_870.7 / 6371.0084;
    const spacing = (x) => 2 ** (Math.floor(Math.log2(x)) - 23);
    const unitsFromOrigin = still[0].distanceFromOriginUnits;
    result.precisionAt50Au = {
      method: "same as tools/validate/browser-precision.mjs: Float32 local position read back from the GPU buffer, projected in Float64 with the camera's matrices; static (60 frames, nothing moves) and sweep (60 frames, 1 px of drag per frame, cubic residual)",
      vertexIndex: installed.vertex,
      distanceFromOriginUnits: unitsFromOrigin,
      distanceFromOriginAu: unitsFromOrigin / AU_UNITS,
      float32GridSpacingUnits: spacing(unitsFromOrigin),
      float32GridSpacingKm: spacing(unitsFromOrigin) * 6371.0084,
      vertexOnScreenPx: { x: still[0].vertex.x, y: still[0].vertex.y },
      staticMaxDisplacementPx: staticMaxPx,
      sweepCubicResidualMaxPx: sweepResidualPx,
    };
    assert.ok(unitsFromOrigin / AU_UNITS > 50, `the measured vertex is more than 50 AU from the origin (${(unitsFromOrigin / AU_UNITS).toFixed(2)} AU)`);
    assert.ok(staticMaxPx <= 1, `the 50 AU vertex moves at most one pixel with nothing changing (${staticMaxPx})`);
    assert.ok(sweepResidualPx <= 1, `the 50 AU vertex wobbles at most one pixel in a sweep (${sweepResidualPx})`);
  } finally {
    await page.close();
  }
}
await browser.close();
result.errors = errors;
const text = JSON.stringify(result, null, 2);
if (outDir) writeFileSync(`${outDir}/eccentric.json`, `${text}\n`);
console.log(text);
if (errors.length > 0) process.exit(1);
