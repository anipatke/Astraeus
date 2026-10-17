// Browser check for the Sun's visual asset (O-011 / T-038 look): an emissive sphere with a halo that sits on top of the stream dots. Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/on-request/browser-sun.mjs
//   Perseids at the True overview at the peak: warm-white pixels around the Sun are more with the halo than with ?sunglow=0 (the dots do not bury it)
//   the live sliders in Developer > Display settings change it (size 0 removes the halo; the readouts follow); ?sunglow= and ?sunbrightness= set the start
//   close on the Sun: the sphere is drawn; Solar system scale and True overview screenshots are taken
//   no stray Sun: Earth-Moon, Jupiter-Io and Apollo mount no Sun body and show no halo control
//   zero console errors
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const results = {};

// Perseids now opens on its own camera (look.startView, O-015). The scenarios below were written for the engine default camera, so they ask for it by address.
const ENGINE_DEFAULT_VIEW = "&view=sun,216,14.32,3007000";

const open = async (query, viewport = { width: 1280, height: 800 }) => {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  await page.goto(`${base}?${query}`);
  await page.waitForSelector("canvas");
  await page.getByRole("region", { name: "Timeline controls" }).waitFor();
  await page.getByRole("button", { name: "Pause playback" }).click();
  return page;
};
const shot = async (page, name) => { if (outDir) await page.screenshot({ path: `${outDir}/${name}.png` }); };
const seekPeak = async (page) => { await page.locator("button.timeline-window-peak").click({ force: true }); await page.waitForTimeout(600); const close = page.locator("#info-panel .info-panel-close"); if (await close.count()) await close.click(); };
const overview = async (page) => {
  await page.getByLabel("Select object").selectOption("sun");
  const close = page.locator("#info-panel .info-panel-close");
  if (await close.count()) await close.click();
  const compact = page.locator(".object-camera-picker");
  if (await compact.isVisible()) await compact.selectOption(await compact.evaluate((s) => [...s.options].find((o) => o.textContent.trim() === "Overview")?.value));
  else await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.waitForTimeout(1500);
};

// Warm-white pixels (the Sun's colour, bright) within `radius` of the point 8 px left of the Sun's label.
const sunPixels = async (page, radius = 40) => {
  const box = await page.getByTestId("earth-moon-canvas").boundingBox();
  const rect = await page.locator('[data-label-id="sun"]').evaluate((el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, bottom: r.bottom }; });
  const [cx, cy] = [rect.left - 8 - box.x, (rect.top + rect.bottom) / 2 - box.y];
  const png = (await page.getByTestId("earth-moon-canvas").screenshot()).toString("base64");
  return page.evaluate(async ({ data, cx, cy, radius }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const c = document.createElement("canvas");
    c.width = image.width; c.height = image.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const px = ctx.getImageData(0, 0, c.width, c.height).data;
    let count = 0;
    for (let y = Math.max(0, Math.floor(cy - radius)); y < Math.min(c.height, cy + radius); y += 1) {
      for (let x = Math.max(0, Math.floor(cx - radius)); x < Math.min(c.width, cx + radius); x += 1) {
        if (Math.hypot(x - cx, y - cy) > radius) continue;
        const i = 4 * (y * c.width + x);
        if (px[i] > 200 && px[i + 1] > 190 && px[i + 2] > 120 && px[i] - px[i + 2] < 120) count += 1;
      }
    }
    return count;
  }, { data: png, cx, cy, radius });
};

try {
  // Perseids at the True overview, peak: the halo stays visible over the stream dots.
  const withGlow = await open("experience=shower-perseids&sky=off&labels=sun:on");
  await seekPeak(withGlow);
  await overview(withGlow);
  results.truePeakWithGlow = await sunPixels(withGlow);
  await shot(withGlow, "perseids-true-overview-peak");
  const noGlow = await open("experience=shower-perseids&sky=off&labels=sun:on&sunglow=0");
  await seekPeak(noGlow);
  await overview(noGlow);
  results.truePeakNoGlow = await sunPixels(noGlow);
  await shot(noGlow, "perseids-true-overview-peak-sunglow0");
  await noGlow.close();
  assert.ok(results.truePeakWithGlow > results.truePeakNoGlow + 150, `the halo reads over the dots (${results.truePeakWithGlow} warm-white pixels against ${results.truePeakNoGlow} without)`);

  // Live sliders.
  await withGlow.getByRole("button", { name: "Developer mode" }).click();
  const size = withGlow.getByRole("slider", { name: "Sun glow size" });
  const bright = withGlow.getByRole("slider", { name: "Sun glow brightness" });
  results.defaults = { size: await size.inputValue(), brightness: await bright.inputValue() };
  assert.deepEqual(results.defaults, { size: "72", brightness: "1" }, "the defaults are the record's");
  assert.equal(await withGlow.getByRole("slider", { name: "Sun glow reach" }).inputValue(), "2.5", "the halo reach defaults to 2.5 disc diameters");
  const setRange = (locator, value) => locator.evaluate((input, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(v)); input.dispatchEvent(new Event("input", { bubbles: true })); }, value);
  const closeDeveloper = async () => { await withGlow.getByRole("button", { name: "Developer mode" }).click(); await withGlow.waitForTimeout(600); };
  await setRange(size, 0);
  await withGlow.waitForTimeout(400);
  assert.equal(await withGlow.getByTestId("sun-glow-size-value").innerText(), "0", "the size readout follows the slider");
  await closeDeveloper(); // the panel covers the Sun while it is open
  results.afterSizeZero = await sunPixels(withGlow);
  assert.ok(results.afterSizeZero < results.truePeakWithGlow - 100, `size 0 removes the halo (${results.afterSizeZero})`);
  await withGlow.getByRole("button", { name: "Developer mode" }).click();
  await setRange(size, 160);
  await setRange(bright, 2);
  await withGlow.waitForTimeout(400);
  await closeDeveloper();
  await shot(withGlow, "perseids-glow-160-bright-2");
  results.afterBigBright = await sunPixels(withGlow, 60);
  assert.ok(results.afterBigBright > results.afterSizeZero + 100, `a bigger, brighter halo is drawn (${results.afterBigBright})`);

  // Solar system scale, and close on the Sun.
  await withGlow.getByRole("button", { name: "Solar system", exact: true }).click();
  await withGlow.waitForTimeout(1200);
  await shot(withGlow, "perseids-solar-system-overview-peak");
  await withGlow.close();
  const ser = await open(`experience=shower-perseids&sky=off&labels=sun:on${ENGINE_DEFAULT_VIEW}`); // fresh, with the default halo; the camera the zoom series was written for, not the opening camera Perseids now carries (look.startView)
  await seekPeak(ser);
  await overview(ser);
  const box = await ser.getByTestId("earth-moon-canvas").boundingBox();
  await ser.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  // The Sun is clearly visible in every frame from the Overview to the closest allowed zoom: bright pixels in a window about the scene's zero (the focused Sun is at the centre).
  const centre = async (radius = 30) => {
    const png = (await ser.getByTestId("earth-moon-canvas").screenshot()).toString("base64");
    return ser.evaluate(async ({ data, radius }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${data}`;
      await image.decode();
      const c = document.createElement("canvas");
      c.width = image.width; c.height = image.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(image, 0, 0);
      const [cx, cy] = [Math.round(c.width / 2), Math.round(c.height / 2)];
      const px = ctx.getImageData(cx - radius, cy - radius, 2 * radius + 1, 2 * radius + 1).data;
      let bright = 0, sum = 0, sumSq = 0, n = 0;
      for (let i = 0; i < px.length; i += 4) {
        const l = (px[i] + px[i + 1] + px[i + 2]) / 3;
        n += 1; sum += l; sumSq += l * l;
        if (px[i] + px[i + 1] + px[i + 2] > 200) bright += 1;
      }
      const mean = sum / n;
      return { bright, mean, std: Math.sqrt(Math.max(0, sumSq / n - mean * mean)) };
    }, { data: png, radius });
  };
  results.series = [];
  let prior = -1;
  for (let step = 0; step <= 160; step += 1) {
    if (step > 0) { await ser.mouse.wheel(0, -500); await ser.waitForTimeout(160); }
    if (step % 8 !== 0 && step !== 160) continue;
    await ser.waitForTimeout(500);
    const m = await centre();
    results.series.push({ step, ...m, mean: Number(m.mean.toFixed(1)), std: Number(m.std.toFixed(1)) });
    assert.ok(m.bright > 40, `the Sun is clearly visible at zoom step ${step} (${m.bright} bright pixels at the centre)`);
    await shot(ser, `sun-series-${String(step).padStart(3, "0")}`);
    prior = step;
  }
  // The closest allowed zoom: the camera has stopped outside the sphere, the disc fills the middle and shows the map (texture detail), not a flat white.
  await ser.waitForTimeout(1200);
  const closest = await centre(60);
  results.closest = { ...closest, mean: Number(closest.mean.toFixed(1)), std: Number(closest.std.toFixed(1)) };
  assert.ok(closest.bright > 8000, `at the closest zoom the Sun's disc fills the middle (${closest.bright} bright pixels in 121x121)`);
  assert.ok(closest.std > 6, `the disc shows the texture, not a flat wash (luminance spread ${closest.std.toFixed(1)})`);
  assert.ok(closest.mean < 250, `the disc is not washed to white by the halo (mean ${closest.mean.toFixed(0)})`);
  await shot(ser, "sun-closest-textured");
  void prior;
  await ser.close();

  // The address sets the start.
  const url = await open("experience=shower-perseids&sky=off&labels=sun:on&sunglow=120&sunbrightness=0.5");
  await url.getByRole("button", { name: "Developer mode" }).click();
  assert.deepEqual({ size: await url.getByRole("slider", { name: "Sun glow size" }).inputValue(), brightness: await url.getByRole("slider", { name: "Sun glow brightness" }).inputValue() }, { size: "120", brightness: "0.5" }, "?sunglow and ?sunbrightness set the start");
  await url.close();

  // The Sun's label is a setting (the shower settings file turns it off): hidden by default, still selectable, and a live toggle brings it back.
  const lab = await open("experience=shower-perseids&sky=off");
  await overview(lab);
  const shownIds = () => lab.evaluate(() => [...document.querySelectorAll("[data-label-id]")].filter((el) => !el.hidden).map((el) => el.dataset.labelId));
  results.labelsDefault = await shownIds();
  assert.ok(!results.labelsDefault.includes("sun"), "the Sun's label is off by default in Perseids");
  assert.equal(await lab.locator('option[value="sun"]').count(), 1, "the Sun is still in the Object menu");
  assert.equal(await lab.getByLabel("Select object").inputValue(), "sun", "the Sun is selectable (it is the selected object)");
  await lab.getByRole("button", { name: "Developer mode" }).click();
  const toggle = lab.getByRole("button", { name: "Sun label" });
  assert.equal(await toggle.getAttribute("aria-pressed"), "false", "the toggle shows the label off");
  await toggle.click();
  await lab.getByRole("button", { name: "Developer mode" }).click();
  await lab.waitForTimeout(800);
  results.labelsAfterToggle = await shownIds();
  assert.ok(results.labelsAfterToggle.includes("sun"), "the toggle brings the Sun's label back");
  await lab.close();
  const urlOn = await open("experience=shower-perseids&sky=off&labels=sun:on");
  await overview(urlOn);
  assert.ok((await urlOn.evaluate(() => [...document.querySelectorAll("[data-label-id]")].filter((el) => !el.hidden).map((el) => el.dataset.labelId))).includes("sun"), "?labels=sun:on shows it");
  await urlOn.close();

  // No stray Sun elsewhere.
  for (const [name, query] of [["earth-moon", "experience=earth-moon"], ["jupiter-io", "experience=jupiter-io"], ["apollo", ""]]) {
    const page = await open(query);
    const bodies = await page.getByTestId("earth-moon-canvas").getAttribute("data-bodies");
    results[`${name}Bodies`] = bodies;
    assert.ok(!bodies.split(",").includes("sun"), `${name}: no Sun body is mounted (${bodies})`);
    await page.getByRole("button", { name: "Developer mode" }).click();
    assert.equal(await page.getByRole("slider", { name: "Sun glow size" }).count(), 0, `${name}: no halo control`);
    assert.equal(await page.locator('[data-label-id="sun"]').count(), 0, `${name}: no Sun label`);
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ results, errors }, null, 2));
if (errors.length > 0) process.exit(1);
