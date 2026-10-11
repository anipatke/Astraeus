// Browser check for the made-up Sun-centred belt (declared camera reach). Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-synthetic-belt.mjs
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/";
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

// T-041: the Sun and two paths. Pixel families on the canvas, by colour: Sun marker (pale yellow), Earth's path (blue),
// the made-up far path (purple), belt dots (amber). Counted from a canvas screenshot, so they are relative evidence.
const colourCounts = async (target) => {
  // Hide the text labels while counting so only drawn geometry is measured.
  await target.evaluate(() => { for (const el of document.querySelectorAll(".scene-labels")) el.style.visibility = "hidden"; });
  const png = (await target.getByTestId("earth-moon-canvas").screenshot()).toString("base64");
  await target.evaluate(() => { for (const el of document.querySelectorAll(".scene-labels")) el.style.visibility = ""; });
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
  await page.getByRole("region", { name: "Timeline controls" }).waitFor();
  const canvas = page.getByTestId("earth-moon-canvas");
  assert.equal(await canvas.getAttribute("data-point-groups"), "1");
  assert.equal(await canvas.getAttribute("data-earth-moon"), "false");
  assert.equal(await page.locator('option[value="dust-belt"]').count(), 1);
  await page.getByRole("button", { name: "Pause playback" }).click();
  await page.getByLabel("Select object").selectOption("dust-belt");

  for (const scale of ["True", "Readable"]) {
    await page.getByRole("button", { name: scale, exact: true }).click();
    await page.getByRole("button", { name: "Focus belt", exact: true }).click();
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
  await page.getByRole("button", { name: "Play playback" }).click();
  await page.waitForTimeout(800);

  // T-041: the Sun and paths, at desktop and phone sizes, True and Readable scale. Prior scenarios above are kept unchanged.
  const checkSunCentred = async (target, label) => {
    const targetCanvas = target.getByTestId("earth-moon-canvas");
    assert.equal(await targetCanvas.getAttribute("data-sun-centred"), "3", `${label}: Sun and two paths are mounted`);
    for (const id of ["sun", "earth-path", "far-marker-path"]) {
      assert.equal(await target.locator(`option[value="${id}"]`).count(), 1, `${label}: ${id} is listed once`);
    }
    const pause = target.getByRole("button", { name: "Pause playback", exact: true });
    if (await pause.count()) await pause.click();
    // The belt only exists for its first day; go back to the start of the window (the earlier scenario played past it).
    await target.locator('input[aria-label="Seek timeline"]').evaluate((input, time) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(time));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, Date.UTC(2030, 0, 1, 1, 0, 0));
    await target.waitForTimeout(400);
    const closeInfo = async () => { const c = target.locator("#info-panel .info-panel-close"); if (await c.count()) await c.click(); };
    const pickPreset = async (name) => {
      const compact = target.locator(".object-camera-picker");
      if (await compact.isVisible()) {
        const value = await compact.evaluate((select, text) => [...select.options].find((o) => o.textContent.trim() === text)?.value ?? null, name);
        assert.ok(value, `${label}: preset ${name} exists`);
        await compact.selectOption(value);
      } else {
        await target.getByRole("button", { name, exact: true }).click();
      }
    };
    for (const scale of ["True", "Readable"]) {
      await target.getByRole("button", { name: scale, exact: true }).click();
      await target.getByLabel("Select object").selectOption("sun");
      await closeInfo();
      await pickPreset("Sun view");
      await target.waitForTimeout(1800);
      const counts = await colourCounts(target);
      sunCentred[`${label}-${scale}`] = counts;
      if (outDir) await target.screenshot({ path: `${outDir}/${label}-${scale.toLowerCase()}-sun-view.png` });
      assert.ok(counts.earthPath > 40, `${label}/${scale}: Earth's path is drawn (${counts.earthPath})`);
      assert.ok(counts.farPath > 40, `${label}/${scale}: the made-up path is drawn (${counts.farPath})`);
      assert.ok(counts.sun > 5, `${label}/${scale}: the Sun marker is drawn (${counts.sun})`);
      assert.ok(counts.belt > 100, `${label}/${scale}: the belt sits in the same view (${counts.belt})`);
      assert.equal(await target.locator('.scene-object-label[data-label-id="sun"]').evaluate((el) => !el.hidden), true, `${label}/${scale}: the Sun is labelled`);
      // Each is selectable and its info says what it is and where it comes from.
      const expectations = [
        ["sun", /^Ephemeris/, /not the Sun's real size/],
        ["earth-path", /^Ephemeris/, /Earth's path round the Sun/],
        ["far-marker-path", /^Illustrative/, /invented object/],
      ];
      for (const [id, badge, text] of expectations) {
        await target.getByLabel("Select object").selectOption("earth");
        await target.getByLabel("Select object").selectOption(id);
        const info = target.locator("#info-panel");
        await info.waitFor();
        assert.equal(await info.getAttribute("data-info-id"), id, `${label}/${scale}: ${id} opens its info`);
        assert.match(await info.locator(".provenance-badge").innerText(), badge, `${label}/${scale}: ${id} provenance badge`);
        assert.match(await info.innerText(), text, `${label}/${scale}: ${id} description`);
        await closeInfo();
      }
    }
    // Earth's path and the belt each focus; the Sun-centred view zooms out and in without errors.
    await target.getByRole("button", { name: "True", exact: true }).click();
    await target.getByLabel("Select object").selectOption("earth-path");
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
    await phone.getByRole("region", { name: "Timeline controls" }).waitFor();
    await checkSunCentred(phone, "phone");
  } finally {
    await phone.close();
  }

  // An experience that declares nothing is unchanged: Apollo and the ring have no Sun or paths.
  await page.goto(base);
  await page.waitForSelector("canvas");
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-sun-centred"), "0", "Apollo draws no Sun or paths");
  assert.equal(await page.locator('option[value="sun"]').count(), 0, "Apollo lists no Sun");
  await page.goto(`${base}?experience=synthetic-ring`);
  await page.waitForSelector("canvas");
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-sun-centred"), "0", "the ring draws no Sun or paths");
} finally {
  await browser.close();
}
console.log(JSON.stringify({ lit, sunCentred, errors }, null, 2));
if (errors.length > 0) process.exit(1);
