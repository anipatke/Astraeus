// Lighting comparison (T-049): the same frames drawn with each body lit by its own Sun direction (the default) and with one point light
// at the Sun's scaled position (?lighting=single-sun), compared pixel by pixel. Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-lighting.mjs
// It writes a screenshot pair per frame and prints the numbers; it asserts only that both models mount, draw and log no console error.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const DAY = 86_400_000;

const FRAMES = [
  { experience: "earth-moon", target: "moon", preset: "Focus Moon", offsetsDays: [3, 10, 17, 24], ownStrength: "1.4,0.08" },
  { experience: "earth-moon", target: "earth", preset: "Focus Earth", offsetsDays: [3, 17] },
  { experience: "jupiter-io", target: "io", preset: "Focus Io", offsetsDays: [0.1, 0.9, 5] },
  { experience: "jupiter-io", target: "jupiter", preset: "Overview", offsetsDays: [0.1, 0.9] },
];

async function capture(experience, lighting, frame, offsetDays, sunLight = null) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  try {
    await page.goto(`${base}?experience=${experience}&lighting=${lighting}${sunLight === null ? "" : `&sunLight=${sunLight}`}`);
    await page.waitForSelector("canvas");
    await page.getByRole("region", { name: "Timeline controls" }).waitFor();
    const canvas = page.getByTestId("earth-moon-canvas");
    assert.equal(await canvas.getAttribute("data-lighting"), lighting, `the scene runs the ${lighting} model`);
    await page.getByRole("button", { name: "Pause playback" }).click();
    const min = Number(await page.locator('input[aria-label="Seek timeline"]').getAttribute("min"));
    await page.locator('input[aria-label="Seek timeline"]').evaluate((input, time) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, String(time));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, Math.round(min + offsetDays * DAY));
    await page.getByLabel("Select object").selectOption(frame.target);
    const compact = page.locator(".object-camera-picker");
    if (await compact.isVisible()) {
      const value = await compact.evaluate((select, label) => [...select.options].find((o) => o.textContent.trim() === label)?.value ?? null, frame.preset);
      await compact.selectOption(value);
    } else {
      await page.getByRole("button", { name: frame.preset, exact: true }).click();
    }
    // Hide the HTML labels so only the rendered bodies are compared, then wait for the camera to settle: two shots 700 ms apart must match.
    await page.evaluate(() => { for (const el of document.querySelectorAll(".scene-labels")) el.style.visibility = "hidden"; });
    let previous = null;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await page.waitForTimeout(700);
      const shot = (await canvas.screenshot()).toString("base64");
      if (shot === previous) return shot;
      previous = shot;
    }
    throw new Error(`${experience} ${lighting}: the frame never settled`);
  } finally {
    await page.close();
  }
}

const compare = async (a, b) => {
  const page = await browser.newPage();
  try {
    return await page.evaluate(async ([first, second]) => {
      const read = async (data) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const c = document.createElement("canvas");
        c.width = image.width; c.height = image.height;
        const ctx = c.getContext("2d");
        ctx.drawImage(image, 0, 0);
        return ctx.getImageData(0, 0, c.width, c.height).data;
      };
      const [p, q] = [await read(first), await read(second)];
      let lit = 0, sum = 0, max = 0, over8 = 0, brightP = 0, brightQ = 0;
      for (let i = 0; i < p.length; i += 4) {
        const lp = (p[i] + p[i + 1] + p[i + 2]) / 3;
        const lq = (q[i] + q[i + 1] + q[i + 2]) / 3;
        if (lp > 20 || lq > 20) {
          lit += 1;
          const d = Math.max(Math.abs(p[i] - q[i]), Math.abs(p[i + 1] - q[i + 1]), Math.abs(p[i + 2] - q[i + 2]));
          sum += d; if (d > max) max = d; if (d > 8) over8 += 1;
        }
        brightP += lp; brightQ += lq;
      }
      return { litPixels: lit, meanAbsDiff: lit ? sum / lit : 0, maxChannelDiff: max, fractionOver8: lit ? over8 / lit : 0, meanBrightnessPerBody: brightP / (p.length / 4), meanBrightnessSingleSun: brightQ / (q.length / 4) };
    }, [a, b]);
  } finally {
    await page.close();
  }
};

const rows = [];
try {
  for (const frame of FRAMES) {
    for (const days of frame.offsetsDays) {
      const perBody = await capture(frame.experience, "per-body", frame, days);
      const single = await capture(frame.experience, "single-sun", frame, days);
      const stats = await compare(perBody, single);
      const name = `${frame.experience}-${frame.target}-d${days}`;
      // Control: the single light given the framed body's own strength, so only its position can differ.
      const own = frame.ownStrength;
      const control = own === undefined ? null : await compare(perBody, await capture(frame.experience, "single-sun", frame, days, own));
      if (control !== null) stats.control = { sunLight: own, meanAbsDiff: control.meanAbsDiff, maxChannelDiff: control.maxChannelDiff, fractionOver8: control.fractionOver8 };
      if (outDir) {
        writeFileSync(`${outDir}/${name}-per-body.png`, Buffer.from(perBody, "base64"));
        writeFileSync(`${outDir}/${name}-single-sun.png`, Buffer.from(single, "base64"));
      }
      assert.ok(stats.litPixels > 300, `${name}: something is drawn under both models (${stats.litPixels})`);
      rows.push({ name, ...stats });
    }
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ rows, errors }, null, 2));
if (errors.length > 0) process.exit(1);
