// Browser check for the sky behind every experience (T-053). Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-sky.mjs
//
// Scenarios, each run for Apollo (the default), the Earth-Moon Explorer and Perseids, at 1280x800 and 390x844:
//   stars are drawn ........................ the <canvas> element's data-sky-stars is the star count (8404 when data/local/yale-bsc-v65.json is fetched, 0 and
//                                            the panel says "not fetched" when it is not); more bright pixels than the same view with ?sky=off
//   the sky is fixed under a centre change .. Developer mode reads back a probe direction (orientation in, screen position out). After each
//                                            of: the Readable scale, Overview, Focus and Follow requests, the screen position equals the
//                                            position computed here from the camera's orientation alone
//   the sky turns with the camera ........... a mouse drag moves the probe
//   the panel cites both sources ............ the Sky item's provenance names the Yale catalogue and ESO/S. Brunier
//   the Milky Way picture switch ........... the picture is off by default, with all the stars; ?milkyway=on draws it (fewer lit pixels than the full sky, more
//                                            bright pixels than no sky); the Developer-mode "Milky Way picture" button toggles it live
//   frame rate .............................. with and without the sky, from the Developer tools counter (recorded, not asserted)
//   zero console errors ..................... page errors and console errors are collected for the whole run
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const haveStars = existsSync(new URL("../../data/local/yale-bsc-v65.json", import.meta.url));
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = { starsFetched: haveStars, runs: {} };

const EXPERIENCES = [["apollo", ""], ["earth-moon", "experience=earth-moon"], ["perseids", "experience=shower-perseids"]];
const SIZES = [["desktop", { width: 1280, height: 800 }], ["mobile", { width: 390, height: 844 }]];
// Must equal SKY_PROBE_DIRECTION in src/app/SkyView.ts (render frame).
const PROBE = (() => { const v = [0.62, 0.35, -0.7]; const n = Math.hypot(...v); return v.map((x) => x / n); })();
const FOV_DEG = 45;

const open = async (viewport, query, deviceScaleFactor = 1) => {
  const page = await browser.newPage({ viewport, deviceScaleFactor });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await page.goto(`${base}?${query}`);
  await page.waitForSelector("canvas");
  // The sky's attribute appears once the scene has mounted; with ?sky=off it never does, so wait for the canvas to settle instead.
  if (!query.includes("sky=off")) await page.waitForFunction(() => document.querySelector("canvas")?.dataset.skyStars !== undefined, null, { timeout: 20000 });
  await page.waitForTimeout(2500);
  if (haveStars && !query.includes("sky=off")) await page.waitForFunction(() => document.querySelector("canvas")?.dataset.skyStars !== "0", null, { timeout: 15000 });
  return page;
};

/** Bright pixels on the canvas: the stars and the Milky Way's brighter parts, not the dark background. */
const brightPixels = async (page) => {
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
    let bright = 0;
    let lit = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const lum = 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
      if (lum > 110) bright += 1;
      if (lum > 8) lit += 1;
    }
    return { bright, lit, total: pixels.length / 4 };
  }, png);
};

/** Where a camera with orientation q (x, y, z, w) puts the probe: rotate the direction by q's inverse, then perspective-project. */
function expectedNdc([qx, qy, qz, qw], aspect) {
  const [x, y, z] = PROBE;
  // v' = q^-1 v q, with q^-1 = (-qx, -qy, -qz, qw)
  const [ix, iy, iz] = [-qx, -qy, -qz];
  const tx = 2 * (iy * z - iz * y);
  const ty = 2 * (iz * x - ix * z);
  const tz = 2 * (ix * y - iy * x);
  const v = [x + qw * tx + (iy * tz - iz * ty), y + qw * ty + (iz * tx - ix * tz), z + qw * tz + (ix * ty - iy * tx)];
  const tan = Math.tan((FOV_DEG * Math.PI) / 360);
  return [v[0] / -v[2] / (tan * aspect), v[1] / -v[2] / tan];
}

const readProbe = async (page) => {
  const raw = await page.locator("canvas").getAttribute("data-sky-probe");
  assert.ok(raw, "the canvas carries data-sky-probe while Developer mode is on");
  const probe = JSON.parse(raw);
  const box = await page.getByTestId("earth-moon-canvas").boundingBox();
  return { ...probe, aspect: box.width / box.height };
};

const checkProbe = async (page, label, step) => {
  await page.waitForTimeout(900);
  const probe = await readProbe(page);
  const expected = expectedNdc(probe.quaternion, probe.aspect);
  assert.ok(Math.abs(probe.ndc[0] - expected[0]) < 1e-3 && Math.abs(probe.ndc[1] - expected[1]) < 1e-3, `${label}: after ${step} the probe is where the camera orientation alone puts it (got ${probe.ndc}, expected ${expected})`);
  return probe;
};

const fpsOf = async (page) => {
  await page.locator("[data-frame-fps]").waitFor({ timeout: 10000 });
  await page.waitForTimeout(4000);
  return Number(await page.locator("[data-frame-fps]").innerText());
};

try {
  for (const [name, query] of EXPERIENCES) {
    for (const [sizeName, viewport] of SIZES) {
      const label = `${name}-${sizeName}`;
      const out = (results.runs[label] = {});
      // The same view without the sky, for the star pixels and the frame-rate comparison.
      const off = await open(viewport, [query, "sky=off"].filter(Boolean).join("&"));
      assert.equal(await off.locator("canvas").getAttribute("data-sky-stars"), null, `${label}: ?sky=off draws no sky`);
      const offPixels = await brightPixels(off);
      await off.getByRole("button", { name: "Developer mode" }).click();
      out.fpsWithoutSky = await fpsOf(off);
      await off.close();

      const page = await open(viewport, [query, "milkyway=on"].filter(Boolean).join("&"));
      const canvas = page.getByTestId("earth-moon-canvas");
      assert.equal(await page.locator("canvas").getAttribute("data-sky-picture"), "on", `${label}: ?milkyway=on starts with the picture on`);
      const stars = await page.locator("canvas").getAttribute("data-sky-stars");
      out.stars = Number(stars);
      if (haveStars) assert.equal(stars, "8404", `${label}: every star of V 6.5 or brighter is drawn`);
      else assert.equal(stars, "0", `${label}: with no star file the sky draws no stars`);
      const onPixels = await brightPixels(page);
      out.pixels = { on: onPixels, off: offPixels };
      assert.ok(onPixels.lit > offPixels.lit + 0.02 * onPixels.total, `${label}: the sky lights more of the canvas than a black background (${onPixels.lit} vs ${offPixels.lit})`);
      if (haveStars) assert.ok(onPixels.bright > offPixels.bright + (sizeName === "mobile" ? 5 : 20), `${label}: stars are drawn (bright pixels ${onPixels.bright} vs ${offPixels.bright})`);
      if (outDir) await page.screenshot({ path: join(outDir, `${label}.png`) });

      // The picture switch: the same view with the picture off still draws every star and the picture's light is gone.
      const noPicture = await open(viewport, query); // the default: the picture is off (owner decision 2026-10-15)
      assert.equal(await noPicture.locator("canvas").getAttribute("data-sky-stars"), stars, `${label}: the default (picture off) keeps every star`);
      const noPicturePixels = await brightPixels(noPicture);
      out.pixels.noPicture = noPicturePixels;
      if (haveStars) assert.ok(noPicturePixels.bright > offPixels.bright + (sizeName === "mobile" ? 5 : 20), `${label}: stars are drawn with the picture off (bright pixels ${noPicturePixels.bright} vs ${offPixels.bright})`);
      assert.ok(noPicturePixels.lit < onPixels.lit, `${label}: the picture lights pixels the stars alone do not (${noPicturePixels.lit} vs ${onPixels.lit})`);
      assert.ok(noPicturePixels.lit < offPixels.lit + 0.02 * onPixels.total, `${label}: with the picture off the canvas is nearly the bare scene plus stars (${noPicturePixels.lit} vs ${offPixels.lit})`);
      if (outDir) await noPicture.screenshot({ path: join(outDir, `${label}-picture-off.png`) });
      await noPicture.getByRole("button", { name: "Developer mode" }).click();
      assert.equal(await noPicture.locator("canvas").getAttribute("data-sky-picture"), "off", `${label}: the picture is off by default`);
      out.fpsPictureOff = await fpsOf(noPicture);
      const toggle = noPicture.getByRole("button", { name: "Milky Way picture" });
      assert.equal(await toggle.getAttribute("aria-pressed"), "false", `${label}: the button shows the picture off`);
      await toggle.evaluate((element) => element.click());
      await noPicture.waitForFunction(() => document.querySelector("canvas")?.dataset.skyPicture === "on", null, { timeout: 5000 });
      // The brightness sliders change the star uniform in place: the canvas attribute follows the slider, with no rebuild.
      assert.equal(await noPicture.locator("canvas").getAttribute("data-sky-star-brightness"), "1", `${label}: star brightness starts at 1`);
      const starSlider = noPicture.getByRole("slider", { name: "Star brightness" });
      await starSlider.fill("1.5");
      await noPicture.waitForFunction(() => document.querySelector("canvas")?.dataset.skyStarBrightness === "1.5", null, { timeout: 5000 });
      assert.equal(await noPicture.getByTestId("star-brightness-value").innerText(), "1.50", `${label}: the slider shows its value`);
      assert.equal(await noPicture.locator("canvas").getAttribute("data-sky-stars"), stars, `${label}: moving the slider keeps every star (no rebuild)`);
      await noPicture.getByRole("slider", { name: "Milky Way brightness" }).fill("0.5");
      assert.equal(await noPicture.getByTestId("milky-way-brightness-value").innerText(), "0.50", `${label}: the Milky Way slider shows its value`);
      await noPicture.close();
      const urlGain = await open(viewport, [query, "stars=1.4"].filter(Boolean).join("&"));
      assert.equal(await urlGain.locator("canvas").getAttribute("data-sky-star-brightness"), "1.4", `${label}: ?stars=1.4 sets the star brightness`);
      await urlGain.close();
      const forcedOn = await open(viewport, [query, "milkyway=on"].filter(Boolean).join("&"));
      assert.ok((await brightPixels(forcedOn)).lit > noPicturePixels.lit, `${label}: ?milkyway=on draws the picture`);
      await forcedOn.close();

      // The panel's Sky item.
      await page.getByLabel("Select object").selectOption("sky");
      if (!(await page.locator("#info-panel").count())) await page.getByRole("button", { name: /^Info/ }).click();
      await page.locator("#info-panel").waitFor();
      await page.locator("#info-panel .provenance-badge").click();
      const detail = (await page.locator("#info-panel .provenance-detail").innerText()).replace(/\s+/g, " ");
      assert.match(detail, /Yale Bright Star Catalogue/, `${label}: the Sky item cites the star catalogue`);
      assert.match(detail, /ESO\/S\. Brunier/, `${label}: the Sky item cites the Milky Way image`);
      if (haveStars) assert.match(detail, /8404 stars/, `${label}: the panel counts the stars`);
      else assert.match(detail, /not fetched/, `${label}: the panel says the stars are not fetched`);
      out.panel = detail.slice(0, 400);
      await page.locator("#info-panel .info-panel-close").click();
      await page.getByLabel("Select object").selectOption({ index: 0 });

      // Fixed under a centre change; turns with the camera.
      await page.getByRole("button", { name: "Developer mode" }).click();
      out.fpsWithSky = await fpsOf(page);
      const probes = [await checkProbe(page, label, "start")];
      for (const request of [/^Readable$/, /^Overview$/, /^Focus /, /^Follow /, /^True$/]) {
        const button = page.getByRole("button", { name: request }).first();
        if ((await button.count()) === 0 || !(await button.isEnabled())) continue;
        await button.evaluate((element) => element.click()); // the developer panel covers some controls on a phone
        probes.push(await checkProbe(page, label, String(request)));
      }
      // A phone shows the camera modes as a native select instead of buttons.
      const picker = page.getByLabel("Camera mode");
      if (probes.length < 3 && (await picker.count()) > 0) {
        for (const value of await picker.locator("option:not([disabled])").evaluateAll((options) => options.map((option) => option.value))) {
          await picker.selectOption(value);
          probes.push(await checkProbe(page, label, `camera mode ${value}`));
        }
      }
      out.probeChecks = probes.length;
      assert.ok(probes.length >= 3, `${label}: at least the start and two requests were checked`);
      const before = probes.at(-1);
      const box = await canvas.boundingBox();
      // A drag needs a point where the canvas itself is on top; the developer panel can cover most of a phone's screen.
      let start = null;
      for (const [fx, fy] of [[0.15, 0.4], [0.5, 0.3], [0.15, 0.15], [0.85, 0.15], [0.5, 0.6]]) {
        const point = { x: box.x + box.width * fx, y: box.y + box.height * fy };
        if (await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName === "CANVAS", point)) { start = point; break; }
      }
      if (start === null) {
        out.dragSkipped = "the developer panel covers the whole canvas at this size";
      } else {
        await page.mouse.move(start.x, start.y);
        await page.mouse.down();
        await page.mouse.move(Math.min(start.x + 120, box.x + box.width - 2), start.y + 40, { steps: 8 });
        await page.mouse.up();
        const after = await checkProbe(page, label, "a drag");
        assert.ok(Math.hypot(after.ndc[0] - before.ndc[0], after.ndc[1] - before.ndc[1]) > 0.02, `${label}: the sky turns with the camera (${before.ndc} -> ${after.ndc})`);
      }
      await page.close();
    }
  }
  // A high-DPI screen: the stars are drawn at the device pixel ratio without errors.
  {
    const page = await open({ width: 1280, height: 800 }, "milkyway=off", 2);
    assert.equal(await page.locator("canvas").getAttribute("data-sky-stars"), haveStars ? "8404" : "0", "dpr2: every star is drawn");
    if (outDir) await page.screenshot({ path: join(outDir, "apollo-desktop-dpr2-picture-off.png") });
    await page.close();
  }
  assert.deepEqual(errors, [], "no page or console errors");
  results.errors = 0;
  console.log(JSON.stringify(results, null, 2));
} finally {
  if (outDir) writeFileSync(join(outDir, "browser-sky.json"), `${JSON.stringify({ ...results, errors }, null, 2)}\n`);
  await browser.close();
}
