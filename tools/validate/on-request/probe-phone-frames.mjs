// Phone-class frame-time probe (O-025 T-098): opens an experience at phone size with the CPU throttled through the DevTools protocol and
// records the time between animation frames while the clock plays. Run the app first, then:
//   PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_URL=http://localhost:5690/app.html node tools/validate/on-request/probe-phone-frames.mjs \
//     [--experience jupiter-io] [--throttle 4] [--seconds 8] [--view <focus,az,el,distance>] [--label <name>] [--out <file.json>]
// Headless Chromium draws with SwiftShader (the graphics run on the CPU too), so the absolute numbers are far above a real phone's; only a
// comparison between two runs made the same way on the same machine means anything.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import * as ui from "../driver.mjs";
import { launchBrowser, openPage, watchErrors } from "../harness.mjs";

const arg = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`);
  return at < 0 ? fallback : process.argv[at + 1];
};
const experience = arg("experience", "jupiter-io");
const throttle = Number(arg("throttle", "4"));
const seconds = Number(arg("seconds", "8"));
const view = arg("view", null);
const label = arg("label", experience);
const out = arg("out", null);

const base = process.env.ASTRAEUS_URL ?? "http://localhost:5690/app.html";
const browser = await launchBrowser();
const errors = [];
let result;
try {
  const page = await openPage(browser, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  watchErrors(page, errors);
  const search = new URLSearchParams({ experience });
  if (view !== null) search.set("view", view);
  const loadStarted = Date.now();
  await page.goto(`${base}?${search}`);
  await page.waitForSelector("canvas");
  await ui.waitForShell(page, { timeout: 120_000 });
  const loadMs = Date.now() - loadStarted;
  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  await page.waitForTimeout(3000);
  const frames = await page.evaluate((ms) => new Promise((resolve) => {
    const times = [];
    const started = performance.now();
    const step = (now) => {
      times.push(now);
      if (now - started < ms) requestAnimationFrame(step);
      else resolve(times);
    };
    requestAnimationFrame(step);
  }), seconds * 1000);
  await client.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  const gaps = frames.slice(1).map((time, index) => time - frames[index]).sort((a, b) => a - b);
  const pick = (q) => gaps[Math.min(gaps.length - 1, Math.floor(q * gaps.length))];
  const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const canvas = page.getByTestId("earth-moon-canvas");
  result = {
    label,
    experience,
    view,
    throttle,
    seconds,
    viewport: "390x844 @1x, touch",
    loadMs,
    frames: gaps.length,
    meanMs: Number(mean.toFixed(1)),
    p50Ms: Number(pick(0.5).toFixed(1)),
    p95Ms: Number(pick(0.95).toFixed(1)),
    maxMs: Number(gaps[gaps.length - 1].toFixed(1)),
    fps: Number((1000 / mean).toFixed(1)),
    bodies: await canvas.getAttribute("data-bodies"),
    bodySetMembers: await canvas.getAttribute("data-body-set-members"),
    at: new Date().toISOString(),
    errors,
  };
} finally {
  await browser.close();
}
console.log(JSON.stringify(result, null, 2));
if (out !== null) {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
}
if (errors.length > 0) process.exit(1);
