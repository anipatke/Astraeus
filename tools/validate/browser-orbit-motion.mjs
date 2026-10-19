// Browser check that an orbit's trailing arc stays on its body while time plays fast (I-035): Jupiter-Io at the fastest playback rate, every frame
// the arc head's distance from the body's drawn position (`data-orbit-head-gap`, a share of the orbit's size; 1 px is under 0.002 of a 600 px orbit)
// must stay tiny, with zero console errors. PLAYWRIGHT_CORE=<path> ASTRAEUS_URL=http://localhost:5493/app.html node tools/validate/browser-orbit-motion.mjs
import assert from "node:assert/strict";
import { seekToFraction, setFastestSpeed, ensurePlaying } from "./driver.mjs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const out = {};
for (const experience of ["jupiter-io", "synthetic"]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (error) => errors.push(`${experience} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${experience} console: ${message.text()}`); });
  await page.goto(`${base}?experience=${experience}&view=${experience === "jupiter-io" ? "jupiter" : "earth"},0,89,330&scale=true-scale`);
  await page.waitForSelector("canvas");
  // Under load the first readings can take longer than the first watch; wait for them to be published.
  await page.waitForFunction(() => Number.isFinite(Number(document.querySelector("canvas")?.dataset.orbitHeadGap)), undefined, { timeout: 30000 });
  // Watches the published readings every frame for `ms`: the head's gap from the body and the longest arc segment, both shares of the orbit's size.
  const watch = (ms) => page.evaluate((duration) => new Promise((resolve) => {
    const canvas = document.querySelector("canvas");
    let frames = 0; let maxGap = 0; let maxSegment = 0; let readings = 0; const t0 = performance.now();
    const tick = () => {
      frames += 1;
      const gap = Number(canvas.dataset.orbitHeadGap);
      const segment = Number(canvas.dataset.orbitArcSegment);
      if (Number.isFinite(gap) && Number.isFinite(segment)) { maxGap = Math.max(maxGap, gap); maxSegment = Math.max(maxSegment, segment); readings += 1; }
      if (performance.now() - t0 < duration) requestAnimationFrame(tick); else resolve({ frames, readings, maxGap, maxSegment });
    };
    requestAnimationFrame(tick);
  }), ms);
  const seek = (fraction) => seekToFraction(page, fraction);
  const check = (name, stats) => {
    out[experience][name] = stats;
    assert.ok(stats.readings > 5, `${experience} ${name}: readings published`);
    assert.ok(stats.maxGap < 0.002, `${experience} ${name}: arc head stays on its body (max gap ${stats.maxGap})`);
    // A 0.2-orbit arc through 32 points has segments near 0.04 of the orbit's radius; a chord to a stale point would be several times longer.
    assert.ok(stats.maxSegment < 0.1, `${experience} ${name}: no chord in the arc (longest segment ${stats.maxSegment} of the orbit's size)`);
  };
  out[experience] = {};
  check("load-first-second", await watch(1000));
  await page.waitForTimeout(2000);
  await seek(0.6);
  check("after-seek", await watch(1000));
  await seek(0.2);
  check("after-second-seek", await watch(1000));
  const last = await setFastestSpeed(page);
  await ensurePlaying(page);
  check("fast-playback", await watch(4000));
  await seek(0.4);
  check("seek-mid-play", await watch(1500));
  out[experience].rate = last;
  await page.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
assert.deepEqual(errors, [], "no console errors");
console.log("orbit arc motion: ok");
