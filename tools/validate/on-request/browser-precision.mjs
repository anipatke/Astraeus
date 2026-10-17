// Precision of a true-scale body one astronomical unit from the Sun in the Sun-centred belt (T-045, design A.4 item 9).
// Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/on-request/browser-precision.mjs
//
// Method. The page is paused at one clock time, True scale, 1280x800. Three.js's devtools hook hands over the renderer; its render call is
// wrapped to keep the last camera and scene. For each of 60 frames the script reads what the GPU is given -- the Float32 local
// positions of Earth's sphere and of the Earth-path vertex nearest Earth -- and projects them with the camera's own matrices in Float64
// to pixel coordinates. Two experiments per focus (the focused Earth, then the Sun marker):
//   static: nothing moves for 60 frames; the figure is the largest distance any frame lies from the first frame.
//   sweep:  the camera orbits by 1 px of mouse drag per frame for 60 frames; the figure is the largest residual of the path from a cubic
//           fit through the 60 positions, i.e. the high-frequency wobble left once the smooth motion of the camera is taken out.
// Both are in pixels. The GPU's own Float32 matrix arithmetic is not included (a headless software renderer is the only GPU here).
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const FRAMES = 60;
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
await page.addInitScript(() => {
  const hook = new EventTarget();
  window.__THREE_DEVTOOLS__ = hook;
  window.__probe = { renderer: null, camera: null, scene: null };
  hook.addEventListener("observe", (event) => {
    const o = event.detail;
    if (o && o.isWebGLRenderer && !window.__probe.renderer) {
      window.__probe.renderer = o;
      const render = o.render.bind(o);
      o.render = (scene, camera) => { window.__probe.scene = scene; window.__probe.camera = camera; return render(scene, camera); };
    }
  });
});

const photograph = (name) => (outDir ? page.screenshot({ path: `${outDir}/${name}.png` }) : Promise.resolve());

// Runs in the page: finds Earth's sphere and Earth's path line, and returns a function-free sampler installed on window.
const install = () => page.evaluate(() => {
  const { scene } = window.__probe;
  let earth = null;
  let line = null;
  scene.traverse((o) => {
    if (o.isMesh && o.geometry?.type === "SphereGeometry" && Math.abs(o.geometry.parameters.radius - 1) < 0.01 && earth === null) earth = o;
    if (o.isLine && o.material?.color?.getHexString?.() === "7ab8ff" && line === null) line = o;
  });
  if (!earth || !line) return { ok: false, earth: !!earth, line: !!line };
  const project = (camera, x, y, z) => {
    const v = camera.matrixWorldInverse.elements;
    const p = camera.projectionMatrix.elements;
    const vx = v[0] * x + v[4] * y + v[8] * z + v[12];
    const vy = v[1] * x + v[5] * y + v[9] * z + v[13];
    const vz = v[2] * x + v[6] * y + v[10] * z + v[14];
    const cx = p[0] * vx + p[4] * vy + p[8] * vz + p[12];
    const cy = p[1] * vx + p[5] * vy + p[9] * vz + p[13];
    const cw = p[3] * vx + p[7] * vy + p[11] * vz + p[15];
    const w = window.innerWidth;
    const h = window.innerHeight;
    return { x: (cx / cw * 0.5 + 0.5) * w, y: (1 - (cy / cw * 0.5 + 0.5)) * h, depth: -vz };
  };
  let vertex = -1;
  window.__sample = (reselect) => {
    const camera = window.__probe.camera;
    const e = earth.matrixWorld.elements;
    const centre = [e[12], e[13], e[14]];
    const a = line.geometry.getAttribute("position");
    const m = line.matrixWorld.elements;
    const at = (i) => [m[0] * a.getX(i) + m[4] * a.getY(i) + m[8] * a.getZ(i) + m[12], m[1] * a.getX(i) + m[5] * a.getY(i) + m[9] * a.getZ(i) + m[13], m[2] * a.getX(i) + m[6] * a.getY(i) + m[10] * a.getZ(i) + m[14]];
    if (reselect || vertex < 0) {
      let best = Infinity;
      for (let i = 0; i < a.count; i += 1) {
        const q = at(i);
        const d = Math.hypot(q[0] - centre[0], q[1] - centre[1], q[2] - centre[2]);
        // Only vertices in front of the camera: a point behind it has no screen position.
        if (d < best && project(camera, ...q).depth > 0) { best = d; vertex = i; }
      }
    }
    const q = at(vertex);
    const edge = project(camera, centre[0] + 1, centre[1], centre[2]);
    const c = project(camera, ...centre);
    return {
      earth: c,
      vertex: project(camera, ...q),
      vertexIndex: vertex,
      earthLocalUnitsFromOrigin: Math.hypot(...centre),
      earthRadiusPx: Math.hypot(edge.x - c.x, edge.y - c.y),
      cameraDistanceToEarth: c.depth,
    };
  };
  return { ok: true };
});

const frames = async (n) => page.evaluate(async (count) => {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    out.push(window.__sample(i === 0));
  }
  return out;
}, n);

// Cubic least-squares residual: what is left of a path once its smooth motion is removed.
function cubicResidualMax(values) {
  const n = values.length;
  const degree = 3;
  const t = values.map((_, i) => (i / (n - 1)) * 2 - 1);
  const a = Array.from({ length: degree + 1 }, () => new Array(degree + 2).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let r = 0; r <= degree; r += 1) {
      for (let c = 0; c <= degree; c += 1) a[r][c] += t[i] ** (r + c);
      a[r][degree + 1] += values[i] * t[i] ** r;
    }
  }
  for (let col = 0; col <= degree; col += 1) {
    let pivot = col;
    for (let r = col + 1; r <= degree; r += 1) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    for (let r = col + 1; r <= degree; r += 1) {
      const f = a[r][col] / a[col][col];
      for (let c = col; c <= degree + 1; c += 1) a[r][c] -= f * a[col][c];
    }
  }
  const coef = new Array(degree + 1).fill(0);
  for (let r = degree; r >= 0; r -= 1) {
    let s = a[r][degree + 1];
    for (let c = r + 1; c <= degree; c += 1) s -= a[r][c] * coef[c];
    coef[r] = s / a[r][r];
  }
  return Math.max(...values.map((v, i) => Math.abs(v - coef.reduce((s, k, p) => s + k * t[i] ** p, 0))));
}

const range = (xs) => Math.max(...xs) - Math.min(...xs);
const summarise = (series) => {
  const pick = (key, axis) => series.map((s) => s[key][axis]);
  const staticMax = (key) => Math.max(...series.map((s) => Math.hypot(s[key].x - series[0][key].x, s[key].y - series[0][key].y)));
  return {
    staticMaxDisplacementPx: { earthCentre: staticMax("earth"), pathVertex: staticMax("vertex") },
    rangePx: { earthCentre: Math.hypot(range(pick("earth", "x")), range(pick("earth", "y"))), pathVertex: Math.hypot(range(pick("vertex", "x")), range(pick("vertex", "y"))) },
    sweepCubicResidualMaxPx: {
      earthCentre: Math.max(cubicResidualMax(pick("earth", "x")), cubicResidualMax(pick("earth", "y"))),
      pathVertex: Math.max(cubicResidualMax(pick("vertex", "x")), cubicResidualMax(pick("vertex", "y"))),
    },
  };
};

const result = { method: "see the header of tools/validate/browser-precision.mjs", viewport: "1280x800", scale: "True", frames: FRAMES, clockUtc: null, focus: {} };
try {
  await page.goto(`${base}?experience=synthetic-belt`);
  await page.waitForSelector("canvas");
  await page.getByRole("region", { name: "Timeline controls" }).waitFor();
  const canvas = page.getByTestId("earth-moon-canvas");
  assert.equal(await canvas.getAttribute("data-scene-center"), "sun", "the belt is a Sun-centred scene");
  await page.getByRole("button", { name: "Pause playback", exact: true }).click();
  const clock = Date.UTC(2030, 0, 1, 13, 0, 0);
  result.clockUtc = new Date(clock).toISOString();
  await page.locator('input[aria-label="Seek timeline"]').evaluate((input, time) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(time));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, clock);
  await page.getByRole("button", { name: "True", exact: true }).click();
  const closeInfo = async () => { const c = page.locator("#info-panel .info-panel-close"); if (await c.count()) await c.click(); };
  const box = await canvas.boundingBox();
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  const measure = async (label, selectId, preset, zoom) => {
    await page.getByLabel("Select object").selectOption(selectId);
    await closeInfo();
    await page.getByRole("button", { name: preset, exact: true }).click();
    await page.waitForTimeout(2000);
    if (zoom !== 0) {
      await page.mouse.move(centre.x, centre.y);
      for (let i = 0; i < Math.abs(zoom); i += 1) await page.mouse.wheel(0, Math.sign(zoom) * 600);
      await page.waitForTimeout(1500);
    }
    // The camera eases to its target; wait until nothing moves on screen before measuring.
    let settled = false;
    for (let attempt = 0; attempt < 30 && !settled; attempt += 1) {
      await page.waitForTimeout(1000);
      if (!(await install()).ok) continue;
      const probe = await frames(4);
      settled = Math.hypot(probe[3].vertex.x - probe[0].vertex.x, probe[3].vertex.y - probe[0].vertex.y) < 0.01;
    }
    assert.ok(settled, `${label}: the camera settled`);
    const installed = await install();
    assert.ok(installed.ok, `${label}: Earth's sphere and path are in the scene (${JSON.stringify(installed)})`);
    await photograph(`precision-${label}`);
    const still = await frames(FRAMES);
    await page.mouse.move(centre.x, centre.y);
    await page.mouse.down();
    const swept = [];
    for (let i = 0; i < FRAMES; i += 1) {
      await page.mouse.move(centre.x + (i + 1), centre.y + 0.4 * (i + 1));
      swept.push((await frames(1))[0]);
    }
    await page.mouse.up();
    const first = still[0];
    result.focus[label] = {
      focus: selectId,
      preset,
      earthDistanceFromGpuOriginUnits: first.earthLocalUnitsFromOrigin,
      earthRadiusPx: first.earthRadiusPx,
      cameraDistanceToEarthUnits: first.cameraDistanceToEarth,
      pathVertexIndex: first.vertexIndex,
      // A vertex off screen (the close-up of Earth) swings across thousands of pixels as the camera turns: not a precision measure.
      pathVertexOnScreen: first.vertex.x >= 0 && first.vertex.x <= 1280 && first.vertex.y >= 0 && first.vertex.y <= 800,
      still: summarise(still),
      sweep: summarise(swept),
    };
  };
  await measure("earth-focus", "earth", "Focus Earth", 0);
  // Pulled back until the nearest path vertex is on screen beside Earth.
  await measure("earth-focus-wide", "earth", "Focus Earth", 6);
  await measure("sun-focus", "sun", "Sun view", 0);
  await measure("sun-focus-zoomed-out", "sun", "Sun view", 3);

  // The floating origin holds a focused body at the GPU origin, so a focused Earth cannot jitter from Float32 placement; with the Sun
  // focused Earth sits a full astronomical unit from the origin and the Float32 grid there is the figure that matters.
  const AU_UNITS = 149_597_870.7 / 6371.0084;
  const spacing = (x) => 2 ** (Math.floor(Math.log2(x)) - 23);
  result.float32GridAtOneAu = { auInEarthRadii: AU_UNITS, spacingUnits: spacing(AU_UNITS), spacingKm: spacing(AU_UNITS) * 6371.0084 };
  // One scaled unit is one Earth radius, so a focused-Sun view's Earth radius in pixels is also pixels per unit there.
  result.float32GridAtOneAu.pixelsAtSunFocus = result.float32GridAtOneAu.spacingUnits * result.focus["sun-focus"].earthRadiusPx;
  if (outDir) writeFileSync(`${outDir}/precision.json`, `${JSON.stringify(result, null, 2)}\n`);
  for (const [label, entry] of Object.entries(result.focus)) {
    for (const [what, value] of Object.entries(entry.still.staticMaxDisplacementPx).filter(([what]) => what !== "pathVertex" || entry.pathVertexOnScreen)) assert.ok(value <= 1, `${label}: ${what} moves at most one pixel with nothing changing (${value})`);
    for (const [what, value] of Object.entries(entry.sweep.sweepCubicResidualMaxPx).filter(([what]) => what !== "pathVertex" || entry.pathVertexOnScreen)) assert.ok(value <= 1, `${label}: ${what} wobbles at most one pixel in a sweep (${value})`);
  }
} finally {
  await browser.close();
}
result.errors = errors;
const text = JSON.stringify(result, null, 2);
if (outDir) writeFileSync(`${outDir}/precision.json`, `${text}\n`);
console.log(text);
if (errors.length > 0) process.exit(1);
