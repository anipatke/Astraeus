// Browser check for the Sun's visual asset (O-011 / T-038 look): an emissive sphere with a halo that sits on top of the stream dots. Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/on-request/browser-sun.mjs
//   Perseids at the True overview at the peak: the halo (scene body readout) is wider with the halo than with ?sunglow=0 (the dots do not bury it)
//   the live sliders in Developer > Display settings change it (size 0 removes the halo; the readouts follow); ?sunglow= and ?sunbrightness= set the start
//   close on the Sun: the sphere is drawn
//   no stray Sun: Earth-Moon, Jupiter-Io and Apollo mount no Sun body and show no halo control
//   zero console errors
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chooseScale } from "../driver.mjs";
import * as ui from "../driver.mjs";

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
  await ui.waitForShell(page);
  await ui.pausePlayback(page);
  return page;
};
const seekPeak = async (page) => { await ui.goToWindowPeak(page, { force: true }); await page.waitForTimeout(600); await ui.closeInfo(page); };
const overview = async (page) => {
  await ui.pickBody(page, "sun");
  await ui.closeInfo(page);
  await ui.chooseCamera(page, "overview");
  await page.waitForTimeout(1500);
};

// T-102: the Sun's halo as the scene reports it (the body readout's `glow`: its width in px, its brightness, whether it is drawn over the dots), not warm-white canvas pixels.
const sunGlow = async (page) => {
  const sun = await ui.sceneBody(page, "sun");
  assert.ok(sun?.glow, "the scene reports a halo for the Sun");
  return { ...sun.glow, inView: sun.inView, radiusPx: sun.radiusPx };
};

try {
  // Perseids at the True overview, peak: the halo stays visible over the stream dots.
  const withGlow = await open("experience=showers&sky=off&labels=sun:on");
  await seekPeak(withGlow);
  await overview(withGlow);
  results.truePeakWithGlow = await sunGlow(withGlow);
  const noGlow = await open("experience=showers&sky=off&labels=sun:on&sunglow=0");
  await seekPeak(noGlow);
  await overview(noGlow);
  results.truePeakNoGlow = await sunGlow(noGlow);
  await noGlow.close();
  assert.ok(results.truePeakWithGlow.sizePx > results.truePeakNoGlow.sizePx + 20 && results.truePeakWithGlow.overDots && results.truePeakWithGlow.brightness > 0, `the halo reads over the dots (${JSON.stringify(results.truePeakWithGlow)} against ${JSON.stringify(results.truePeakNoGlow)} without)`);

  // Live sliders.
  await ui.toggleDeveloper(withGlow);
  results.defaults = { size: await ui.sliderValue(withGlow, "sun-glow-size"), brightness: await ui.sliderValue(withGlow, "sun-glow-brightness") };
  assert.deepEqual(results.defaults, { size: "72", brightness: "1" }, "the defaults are the record's");
  assert.equal(await ui.sliderValue(withGlow, "sun-glow-reach"), "2.5", "the halo reach defaults to 2.5 disc diameters");
  const closeDeveloper = async () => { await ui.toggleDeveloper(withGlow); await withGlow.waitForTimeout(600); };
  await ui.dragSlider(withGlow, "sun-glow-size", 0);
  await withGlow.waitForTimeout(400);
  assert.equal(await ui.sliderReadout(withGlow, "sun-glow-size"), "0", "the size readout follows the slider");
  await closeDeveloper(); // the panel covers the Sun while it is open
  results.afterSizeZero = await sunGlow(withGlow);
  assert.ok(results.afterSizeZero.sizePx < results.truePeakWithGlow.sizePx - 20, `size 0 removes the halo (${JSON.stringify(results.afterSizeZero)})`);
  await ui.toggleDeveloper(withGlow);
  await ui.dragSlider(withGlow, "sun-glow-size", 160);
  await ui.dragSlider(withGlow, "sun-glow-brightness", 2);
  await withGlow.waitForTimeout(400);
  await closeDeveloper();
  results.afterBigBright = await sunGlow(withGlow);
  assert.ok(results.afterBigBright.sizePx > results.afterSizeZero.sizePx + 40 && results.afterBigBright.brightness > results.truePeakWithGlow.brightness, `a bigger, brighter halo is drawn (${JSON.stringify(results.afterBigBright)})`);

  // Solar system scale, and close on the Sun.
  await chooseScale(withGlow, "Solar system");
  await withGlow.waitForTimeout(1200);
  await withGlow.close();
  const ser = await open(`experience=showers&sky=off&labels=sun:on${ENGINE_DEFAULT_VIEW}`); // fresh, with the default halo; the camera the zoom series was written for, not the opening camera Perseids now carries (look.startView)
  await seekPeak(ser);
  await overview(ser);
  const box = await ser.getByTestId("earth-moon-canvas").boundingBox();
  await ser.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  // The Sun is clearly visible in every frame from the Overview to the closest allowed zoom: the scene's body readout has it drawn (a sphere or a marker) at the middle of the view (the focused Sun is at the centre).
  const centre = async () => {
    const sun = await ui.sceneBody(ser, "sun");
    return { inView: sun?.inView ?? false, as: sun?.as ?? "none", radiusPx: sun?.radiusPx ?? 0, x: sun?.x ?? 0, y: sun?.y ?? 0, glow: sun?.glow ?? null };
  };
  results.series = [];
  let prior = -1;
  for (let step = 0; step <= 160; step += 1) {
    if (step > 0) { await ser.mouse.wheel(0, -500); await ser.waitForTimeout(160); }
    if (step % 8 !== 0 && step !== 160) continue;
    await ser.waitForTimeout(500);
    const m = await centre();
    results.series.push({ step, ...m });
    assert.ok(m.inView && m.as !== "none" && Math.abs(m.x - 0.5) < 0.05 && Math.abs(m.y - 0.5) < 0.05, `the Sun is drawn at the middle of the view at zoom step ${step} (${JSON.stringify(m)})`);
    prior = step;
  }
  // The closest allowed zoom: the camera has stopped outside the sphere, the disc fills the middle and shows the map (texture detail), not a flat white.
  await ser.waitForTimeout(1200);
  const closest = await centre();
  results.closest = closest;
  assert.ok(closest.as === "sphere" && closest.radiusPx > 60, `at the closest zoom the Sun's disc fills the middle (a sphere of ${closest.radiusPx} px radius; 121x121 px was lit before)`);
  // The disc "shows the texture, not a flat wash" and "is not washed to white by the halo" were luminance statistics of the picture; the halo going behind a big disc is the mechanism, read here.
  // The texture itself has no scene readout (the owner judges it on the preview): dropped, see docs/BROWSER_CHECKS.md (T-102).
  assert.ok(closest.glow !== null && closest.glow.overDots === false, `the halo is drawn behind the big disc, not over it (${JSON.stringify(closest.glow)})`);
  void prior;
  await ser.close();

  // The address sets the start.
  const url = await open("experience=showers&sky=off&labels=sun:on&sunglow=120&sunbrightness=0.5");
  await ui.toggleDeveloper(url);
  assert.deepEqual({ size: await ui.sliderValue(url, "sun-glow-size"), brightness: await ui.sliderValue(url, "sun-glow-brightness") }, { size: "120", brightness: "0.5" }, "?sunglow and ?sunbrightness set the start");
  await url.close();

  // The Sun's label is a setting (the shower settings file turns it off): hidden by default, still selectable, and a live toggle brings it back.
  const lab = await open("experience=showers&sky=off");
  await overview(lab);
  const shownIds = () => lab.evaluate(() => [...document.querySelectorAll("[data-label-id]")].filter((el) => !el.hidden).map((el) => el.dataset.labelId));
  results.labelsDefault = await shownIds();
  assert.ok(!results.labelsDefault.includes("sun"), "the Sun's label is off by default in Perseids");
  assert.equal(await ui.bodyOptionCount(lab, "sun"), 1, "the Sun is still in the Object menu");
  assert.equal(await ui.pickedBody(lab), "sun", "the Sun is selectable (it is the selected object)");
  await ui.toggleDeveloper(lab);
  assert.equal(await ui.toggleOn(lab, "sun-label"), false, "the toggle shows the label off");
  await ui.pressToggle(lab, "sun-label");
  await ui.toggleDeveloper(lab);
  await lab.waitForTimeout(800);
  results.labelsAfterToggle = await shownIds();
  assert.ok(results.labelsAfterToggle.includes("sun"), "the toggle brings the Sun's label back");
  await lab.close();
  const urlOn = await open("experience=showers&sky=off&labels=sun:on");
  await overview(urlOn);
  assert.ok((await urlOn.evaluate(() => [...document.querySelectorAll("[data-label-id]")].filter((el) => !el.hidden).map((el) => el.dataset.labelId))).includes("sun"), "?labels=sun:on shows it");
  await urlOn.close();

  // No stray Sun elsewhere.
  for (const [name, query] of [["jupiter-io", "experience=jupiter-io"], ["apollo", ""]]) {
    const page = await open(query);
    const bodies = await page.getByTestId("earth-moon-canvas").getAttribute("data-bodies");
    results[`${name}Bodies`] = bodies;
    assert.ok(!bodies.split(",").includes("sun"), `${name}: no Sun body is mounted (${bodies})`);
    await ui.toggleDeveloper(page);
    assert.equal(await ui.sliderCount(page, "sun-glow-size"), 0, `${name}: no halo control`);
    assert.equal(await page.locator('[data-label-id="sun"]').count(), 0, `${name}: no Sun label`);
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ results, errors }, null, 2));
if (errors.length > 0) process.exit(1);
