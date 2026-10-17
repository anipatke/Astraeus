// Browser check for the made-up Sun-centred belt (declared camera reach), now a Sun-centred composition (T-044). Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/on-request/browser-synthetic-belt.mjs
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
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
const shot = async (name) => { if (outDir) await page.screenshot({ path: `${outDir}/${name}.png` }); };
// Count bright pixels in a screenshot of the canvas: the belt is visible when dots are drawn.
const litPixels = async (target = page) => {
  const png = (await target.getByTestId("earth-moon-canvas").screenshot()).toString("base64");
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const copy = document.createElement("canvas");
    copy.width = image.width; copy.height = image.height;
    const ctx = copy.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
    let lit = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 120) lit += 1;
    return lit;
  }, png);
};
const lit = {};
const sunCentred = {};
const compositionCounts = {};

// T-041: the Sun and two paths. Pixel families on the canvas, by colour: Sun marker (pale yellow), Earth's path (blue),
// the made-up far path (purple), belt dots (amber). Counted from a canvas screenshot, so they are relative evidence.
const colourCounts = async (target) => {
  // Hide the text labels while counting so only drawn geometry is measured.
  await ui.hideSceneLabels(target);
  const png = (await target.getByTestId("earth-moon-canvas").screenshot()).toString("base64");
  await ui.showSceneLabels(target);
  return target.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const copy = document.createElement("canvas");
    copy.width = image.width; copy.height = image.height;
    const ctx = copy.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const px = ctx.getImageData(0, 0, copy.width, copy.height).data;
    const counts = { sun: 0, earthPath: 0, farPath: 0, belt: 0 };
    for (let i = 0; i < px.length; i += 4) {
      const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
      if (r > 235 && g > 225 && b > 140 && b < 215) counts.sun += 1;
      else if (b > 90 && b - r > 25 && g >= r && b > g) counts.earthPath += 1;
      else if (b > 90 && r > g + 8 && b - g > 20) counts.farPath += 1;
      else if (r > 170 && g > 140 && b < 190 && r - b > 35) counts.belt += 1;
    }
    return counts;
  }, png);
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
    await shot(`belt-${scale.toLowerCase()}-focus`);
    assert.ok(lit[`${scale}-focus`] > 50, `${scale}: belt dots are visible after focusing`);
    // Zoom far out with the wheel: the declared reach lets the camera keep going.
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    for (let i = 0; i < 12; i += 1) await page.mouse.wheel(0, 600);
    await page.waitForTimeout(800);
    lit[`${scale}-zoomed-out`] = await litPixels();
    await shot(`belt-${scale.toLowerCase()}-zoomed-out`);
    assert.ok(lit[`${scale}-zoomed-out`] > 50, `${scale}: belt still visible zoomed out`);
    for (let i = 0; i < 30; i += 1) await page.mouse.wheel(0, -600);
    await page.waitForTimeout(800);
    await shot(`belt-${scale.toLowerCase()}-zoomed-in`);
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
    // Counts of pixels within `radius` px of the canvas centre: the camera orbits the focused body, so what sits at the centre is that body.
    const nearCentre = async (radius) => {
      await ui.hideSceneLabels(target);
      const png = (await targetCanvas.screenshot()).toString("base64");
      await ui.showSceneLabels(target);
      return target.evaluate(async ([data, r]) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const copy = document.createElement("canvas");
        copy.width = image.width; copy.height = image.height;
        const ctx = copy.getContext("2d");
        ctx.drawImage(image, 0, 0);
        const cx = Math.round(image.width / 2);
        const cy = Math.round(image.height / 2);
        const px = ctx.getImageData(cx - r, cy - r, 2 * r + 1, 2 * r + 1).data;
        const counts = { sun: 0, path: 0, lit: 0 };
        for (let i = 0; i < px.length; i += 4) {
          const [red, green, blue] = [px[i], px[i + 1], px[i + 2]];
          if (red + green + blue > 45) counts.lit += 1;
          // T-038: the Sun is now an emissive sphere with a halo and its marker dot, so its pixels are bright warm white (it was a dot reading (227, 222, 196)
          // in the canvas); the earlier colour window no longer matches by design, and the textured disc is orange, so the predicate is warm-bright. Same assertion (the Sun stands at the scene's zero), new predicate.
          // Close in, the camera stops outside the Sun's sphere and the middle is its textured disc (orange), or the halo (white): any bright warm pixel counts.
          if (red > 170 && green > 60 && red - blue > 30 && red + green + blue > 300) counts.sun += 1;
          else if (blue > 60 && blue - red > 25) counts.path += 1;
        }
        return counts;
      }, [png, radius]);
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
        assert.ok(sun.sun > 20, `${label}/${scale}/${when}: the Sun marker sits at the scene's zero (${sun.sun})`);
        // Earth is a drawn body: focused, it fills the view; pulled back, the path line passes through it.
        await ui.pickBody(target, "earth");
        await closeInfo();
        await pickPreset("focus-earth");
        await target.waitForTimeout(1800);
        const near = await nearCentre(8);
        compositionCounts[`${label}-${scale}-${when}-earth-near`] = near;
        assert.ok(near.lit > 100, `${label}/${scale}/${when}: Earth is drawn where the camera focuses (${JSON.stringify(near)})`);
        const box = await targetCanvas.boundingBox();
        await target.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        for (let i = 0; i < 6; i += 1) await target.mouse.wheel(0, 600);
        await target.waitForTimeout(1200);
        const far = await nearCentre(8);
        compositionCounts[`${label}-${scale}-${when}-earth-far`] = far;
        assert.ok(far.path > 3, `${label}/${scale}/${when}: Earth's path line passes through Earth (${JSON.stringify(far)})`);
        if (outDir) await target.screenshot({ path: `${outDir}/${label}-${scale.toLowerCase()}-${when.replace(/ /g, "-")}-earth-on-path.png` });
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
      if (outDir) await target.screenshot({ path: `${outDir}/${label}-${scale.toLowerCase()}-sun-view.png` });
      assert.ok(counts.earthPath > 40, `${label}/${scale}: Earth's path is drawn (${counts.earthPath})`);
      assert.ok(counts.farPath > 40, `${label}/${scale}: the made-up path is drawn (${counts.farPath})`);
      assert.ok(counts.sun > 5, `${label}/${scale}: the Sun marker is drawn (${counts.sun})`);
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
