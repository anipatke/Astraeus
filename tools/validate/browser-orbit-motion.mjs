// Browser check that an orbit's trailing arc stays on its body while time plays fast (I-035): Jupiter-Io at the fastest playback rate, every frame
// the arc head's distance from the body's drawn position (`data-orbit-head-gap`, a share of the orbit's size; 1 px is under 0.002 of a 600 px orbit)
// must stay tiny, with zero console errors. PLAYWRIGHT_CORE=<path> ASTRAEUS_URL=http://localhost:5493/app.html node tools/validate/browser-orbit-motion.mjs
import assert from "node:assert/strict";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const out = {};
for (const experience of ["jupiter-io", "earth-moon"]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (error) => errors.push(`${experience} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${experience} console: ${message.text()}`); });
  await page.goto(`${base}?experience=${experience}&view=${experience === "jupiter-io" ? "jupiter" : "earth"},0,89,330&scale=true-scale`);
  await page.waitForSelector("canvas");
  await page.waitForTimeout(3000);
  const rate = page.getByLabel("Playback speed");
  const last = await rate.evaluate((select) => select.options[select.options.length - 1].value);
  await rate.selectOption(last);
  await page.getByRole("button", { name: "Play" }).click();
  const stats = await page.evaluate(() => new Promise((resolve) => {
    const canvas = document.querySelector("canvas");
    let frames = 0; let max = 0; let readings = 0; const t0 = performance.now();
    const tick = () => {
      frames += 1;
      const gap = Number(canvas.dataset.orbitHeadGap);
      if (Number.isFinite(gap)) { max = Math.max(max, gap); readings += 1; }
      if (performance.now() - t0 < 6000) requestAnimationFrame(tick); else resolve({ frames, readings, maxGap: max });
    };
    requestAnimationFrame(tick);
  }));
  const time = await page.locator(".timeline-time").first().textContent().catch(() => null);
  out[experience] = { rate: last, ...stats, time };
  assert.ok(stats.readings > 20, `${experience}: the head gap was published`);
  assert.ok(stats.maxGap < 0.002, `${experience}: arc head stays on its body (max gap ${stats.maxGap} of the orbit's size)`);
  await page.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
assert.deepEqual(errors, [], "no console errors");
console.log("orbit arc motion: ok");
