// Browser check for the made-up Sun-centred belt (declared camera reach), now a Sun-centred composition (T-044). Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/on-request/browser-synthetic-belt.mjs
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chooseScale } from "../driver.mjs";
import * as ui from "../driver.mjs";

import { pw } from "../playwright.mjs";
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
// T-102: the belt is visible when its dots are in view, from the scene's point readout (members in front of the camera and inside the view).
const litPixels = () => ui.sceneDotsInView(page);
const lit = {};
const sunCentred = {};
const compositionCounts = {};

// T-041: the Sun and two paths, read from the scene (T-102; they were pixel families by colour): the Sun as a drawn body in view, Earth's path and the made-up far path as
// drawn lines with vertices in view, the belt as dots in view.
const colourCounts = async (target) => {
  const sun = await ui.sceneBody(target, "sun");
  const earthPath = await ui.scenePath(target, "earth-path");
  const farPath = await ui.scenePath(target, "far-marker-path");
  return {
    sun: sun?.inView && sun.as !== "none" ? 1 : 0,
    earthPath: earthPath?.visible ? earthPath.inView : 0,
    farPath: farPath?.visible ? farPath.inView : 0,
    belt: await ui.sceneDotsInView(target),
  };
};

try {
  await page.goto(`${base}?experience=synthetic-belt`);
  await page.waitForSelector("canvas");
  await ui.waitForShell(page);
  const canvas = page.getByTestId("earth-moon-canvas");
  assert.equal(await canvas.getAttribute("data-point-groups"), "1");
  assert.equal(await canvas.getAttribute("data-bodies"), "sun,earth");
  assert.equal(await ui.bodyOptionCount(page, "dust-belt"), 1);
  await ui.pausePlayback(page);
  await ui.pickBody(page, "dust-belt");

  for (const scale of ["True", "Readable"]) {
    await chooseScale(page, scale);
    await ui.chooseCamera(page, "focus-belt");
    await page.waitForTimeout(1500);
    lit[`${scale}-focus`] = await litPixels();
    assert.ok(lit[`${scale}-focus`] > 50, `${scale}: belt dots are visible after focusing`);
    // Zoom far out with the wheel: the declared reach lets the camera keep going.
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 12; i += 1) await page.mouse.wheel(0, 600);
    await page.waitForTimeout(800);
    lit[`${scale}-zoomed-out`] = await litPixels();
    assert.ok(lit[`${scale}-zoomed-out`] > 50, `${scale}: belt still visible zoomed out`);
    for (let i = 0; i < 30; i += 1) await page.mouse.wheel(0, -600);
    await page.waitForTimeout(800);
  }
  await ui.playPlayback(page);
  await page.waitForTimeout(800);

  // T-044: the belt mounts the Sun and Earth about the Sun, with the Sun at the scene's zero. Each prior scenario above and in
  // checkSunCentred is kept unchanged (belt dots focus and zoom, Sun and path families in the Sun view, selection and info); these
  // add the composition: the scene says what it mounted, the Sun sits at the origin the camera orbits, and Earth is drawn on its path.
  const composition = async (target, label) => {
    const targetCanvas = target.getByTestId("earth-moon-canvas");
    assert.equal(await targetCanvas.getAttribute("data-scene-center"), "sun", `${label}: the scene is centred on the Sun`);
    assert.equal(await targetCanvas.getAttribute("data-bodies"), "sun,earth", `${label}: the Sun and Earth are mounted, in that order`);
    assert.equal(await targetCanvas.getAttribute("data-bodies"), "sun,earth", `${label}: the Sun and Earth are mounted and no Moon`);
    await ui.ensurePaused(target);
    const closeInfo = () => ui.closeInfo(target);
    const pickPreset = (presetId) => ui.chooseCamera(target, presetId);
    // T-102: what stands at the centre of the view (the camera orbits the focused body), from the scene's readouts: a body drawn within `radius` px of the middle, and whether Earth's path line
    // passes through the middle (its vertices' box in view contains it). They replace colour counts in a window about the centre.
    const nearCentre = async (radius) => {
      const box = await targetCanvas.boundingBox();
      const atMiddle = (body) => body?.inView && body.as !== "none" && Math.hypot((body.x - 0.5) * box.width, (body.y - 0.5) * box.height) <= radius;
      const earthPath = await ui.scenePath(target, "earth-path");
      return {
        sun: atMiddle(await ui.sceneBody(target, "sun")) ? 1 : 0,
        earth: atMiddle(await ui.sceneBody(target, "earth")) ? 1 : 0,
        path: earthPath?.visible && earthPath.lineMinX !== null && earthPath.lineMinX < 0.5 && earthPath.lineMaxX > 0.5 && earthPath.lineMinY < 0.5 && earthPath.lineMaxY > 0.5 ? 1 : 0,
      };
    };
    const seekTo = async (utc) => {
      await ui.seekTo(target, utc);
      await target.waitForTimeout(400);
    };
    for (const scale of ["True", "Readable"]) {
      await chooseScale(target, scale);
      for (const [when, utc] of [["start", Date.UTC(2030, 0, 1, 1, 0, 0)], ["twelve hours on", Date.UTC(2030, 0, 1, 13, 0, 0)]]) {
        await seekTo(utc);
        // The Sun is the scene's zero: focusing it puts its marker on the axis the camera orbits.
        await ui.pickBody(target, "sun");
        await closeInfo();
        await pickPreset("sun-view");
        await target.waitForTimeout(1800);
        // Zoom right in on the focused Sun so the belt's dots thin out around it and the marker stands alone at the centre.
        const sunBox = await targetCanvas.boundingBox();
        await target.mouse.move(sunBox.x + sunBox.width / 2, sunBox.y + sunBox.height / 2);
        for (let i = 0; i < 40; i += 1) await target.mouse.wheel(0, -600);
        await target.waitForTimeout(1200);
        const sun = await nearCentre(8);
        compositionCounts[`${label}-${scale}-${when}-sun`] = sun;
        assert.ok(sun.sun > 0, `${label}/${scale}/${when}: the Sun marker sits at the scene's zero (${JSON.stringify(sun)})`);
        // Earth is a drawn body: focused, it fills the view; pulled back, the path line passes through it.
        await ui.pickBody(target, "earth");
        await closeInfo();
        await pickPreset("focus-earth");
        await target.waitForTimeout(1800);
        const near = await nearCentre(8);
        compositionCounts[`${label}-${scale}-${when}-earth-near`] = near;
        assert.ok(near.earth > 0, `${label}/${scale}/${when}: Earth is drawn where the camera focuses (${JSON.stringify(near)})`);
        const box = await targetCanvas.boundingBox();
        await target.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        for (let i = 0; i < 6; i += 1) await target.mouse.wheel(0, 600);
        await target.waitForTimeout(1200);
        const far = await nearCentre(8);
        compositionCounts[`${label}-${scale}-${when}-earth-far`] = far;
        assert.ok(far.path > 0 && far.earth > 0, `${label}/${scale}/${when}: Earth's path line passes through Earth (${JSON.stringify(far)})`);
      }
    }
  };
  await composition(page, "desktop-composition");
  const phoneComposition = await browser.newPage({ viewport: { width: 390, height: 844 } });
  phoneComposition.on("pageerror", (error) => errors.push(`pageerror(phone composition): ${error.message}`));
  phoneComposition.on("console", (message) => { if (message.type() === "error") errors.push(`console(phone composition): ${message.text()}`); });
  try {
    await phoneComposition.goto(`${base}?experience=synthetic-belt`);
    await phoneComposition.waitForSelector("canvas");
    await ui.waitForShell(phoneComposition);
    await composition(phoneComposition, "phone-composition");
  } finally {
    await phoneComposition.close();
  }

  // T-041: the Sun and paths, at desktop and phone sizes, True and Readable scale. Prior scenarios above are kept unchanged.
  const checkSunCentred = async (target, label) => {
    const targetCanvas = target.getByTestId("earth-moon-canvas");
    assert.equal(await targetCanvas.getAttribute("data-sun-centred"), "3", `${label}: Sun and two paths are mounted`);
    for (const id of ["sun", "earth-path", "far-marker-path"]) {
      assert.equal(await ui.bodyOptionCount(target, id), 1, `${label}: ${id} is listed once`);
    }
    await ui.ensurePaused(target);
    // The belt only exists for its first day; go back to the start of the window (the earlier scenario played past it).
    await ui.seekTo(target, Date.UTC(2030, 0, 1, 1, 0, 0));
    await target.waitForTimeout(400);
    const closeInfo = () => ui.closeInfo(target);
    const pickPreset = (presetId) => ui.chooseCamera(target, presetId);
    for (const scale of ["True", "Readable"]) {
      await chooseScale(target, scale);
      await ui.pickBody(target, "sun");
      await closeInfo();
      await pickPreset("sun-view");
      await target.waitForTimeout(1800);
      const counts = await colourCounts(target);
      sunCentred[`${label}-${scale}`] = counts;
      assert.ok(counts.earthPath > 10, `${label}/${scale}: Earth's path is drawn (${counts.earthPath})`);
      assert.ok(counts.farPath > 10, `${label}/${scale}: the made-up path is drawn (${counts.farPath})`);
      assert.ok(counts.sun > 0, `${label}/${scale}: the Sun marker is drawn (${counts.sun})`);
      assert.ok(counts.belt > 100, `${label}/${scale}: the belt sits in the same view (${counts.belt})`);
      assert.equal((await ui.shownSceneLabelIds(target)).includes("sun"), true, `${label}/${scale}: the Sun is labelled`);
      // Each is selectable and its info says what it is and where it comes from.
      const expectations = [
        ["sun", /^Ephemeris/, /not the Sun's real size/],
        ["earth-path", /^Ephemeris/, /Earth's path round the Sun/],
        ["far-marker-path", /^Illustrative/, /invented object/],
      ];
      for (const [id, badge, text] of expectations) {
        await ui.pickBody(target, "earth");
        await ui.pickBody(target, id);
        const info = ui.infoPanel(target);
        await info.waitFor();
        assert.equal(await info.getAttribute("data-info-id"), id, `${label}/${scale}: ${id} opens its info`);
        assert.match(await ui.provenanceBadgeText(target), badge, `${label}/${scale}: ${id} provenance badge`);
        assert.match(await info.innerText(), text, `${label}/${scale}: ${id} description`);
        await closeInfo();
      }
    }
    // Earth's path and the belt each focus; the Sun-centred view zooms out and in without errors.
    await chooseScale(target, "True");
    await ui.pickBody(target, "earth-path");
    await closeInfo();
    await target.waitForTimeout(300);
  };
  await checkSunCentred(page, "desktop");

  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  phone.on("pageerror", (error) => errors.push(`pageerror(phone): ${error.message}`));
  phone.on("console", (message) => { if (message.type() === "error") errors.push(`console(phone): ${message.text()}`); });
  try {
    await phone.goto(`${base}?experience=synthetic-belt`);
    await phone.waitForSelector("canvas");
    await ui.waitForShell(phone);
    await checkSunCentred(phone, "phone");
  } finally {
    await phone.close();
  }

  // An experience that declares nothing is unchanged: Apollo and the ring have no Sun or paths.
  await page.goto(base);
  await page.waitForSelector("canvas");
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-sun-centred"), "0", "Apollo draws no Sun or paths");
  assert.equal(await ui.bodyOptionCount(page, "sun"), 0, "Apollo lists no Sun");
  await page.goto(`${base}?experience=synthetic-ring`);
  await page.waitForSelector("canvas");
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-sun-centred"), "0", "the ring draws no Sun or paths");
} finally {
  await browser.close();
}
console.log(JSON.stringify({ lit, sunCentred, compositionCounts, errors }, null, 2));
if (errors.length > 0) process.exit(1);
