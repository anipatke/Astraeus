// Browser smoke for the made-up debris-ring experience (group capability). Run the app on port 5199, then:
// PLAYWRIGHT_CORE=<path to playwright-core> ASTRAEUS_EVIDENCE_DIR=<fresh dir> node tools/validate/browser-synthetic-ring.mjs
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
let pacing = [];
const counterReadings = {};
const readCounter = async (counter, groupId) => ({
  fps: Number(await counter.locator("[data-frame-fps]").innerText()),
  longestMs: parseFloat(await counter.locator("[data-frame-longest]").innerText()),
  over: await counter.locator("[data-frame-over]").innerText(),
  fills: groupId === null ? null : Number(await counter.locator(`[data-fill-count="${groupId}"]`).innerText()),
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
const shot = async (name) => { if (outDir) await page.screenshot({ path: `${outDir}/${name}.png` }); };

try {
  await page.goto(`${base}?experience=synthetic-ring`);
  await page.waitForSelector("canvas");
  await page.getByRole("region", { name: "Timeline controls" }).waitFor();
  const canvas = page.getByTestId("earth-moon-canvas");
  // The points layer is mounted and the group is listed once.
  assert.equal(await canvas.getAttribute("data-point-groups"), "1");
  assert.equal(await page.locator('option[value="debris-ring"]').count(), 1);
  assert.equal(await page.locator('option[value="columbia"]').count(), 0);
  await page.getByRole("button", { name: "Pause playback" }).click();

  // Select the group: its information panel states that it is made up.
  const panel = page.locator("#info-panel");
  await page.getByLabel("Select object").selectOption("debris-ring");
  await panel.waitFor();
  assert.equal(await panel.getAttribute("data-info-id"), "debris-ring");
  const badge = panel.locator(".provenance-badge");
  assert.match(await badge.innerText(), /^Illustrative ⓘ/);
  await badge.click();
  const detail = await panel.locator(".provenance-detail").innerText();
  assert.match(detail, /Made up/);
  assert.match(detail, /two-body/i);
  const infoUnderTrue = await panel.innerText();

  // Focus and follow work at true scale; capture the ring.
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.waitForTimeout(1000);
  await shot("ring-true-overview");
  await page.getByRole("button", { name: "Focus ring", exact: true }).click();
  await page.waitForTimeout(1200);
  await shot("ring-true-focus");
  await page.getByRole("button", { name: "Follow ring", exact: true }).click();
  await page.waitForTimeout(1200);
  await shot("ring-true-follow");

  // Scale switches leave the group's information (its State-derived content) unchanged.
  const readable = page.getByRole("button", { name: "Readable", exact: true });
  await readable.click();
  assert.equal(await readable.getAttribute("aria-pressed"), "true");
  await page.waitForTimeout(800);
  assert.equal(await canvas.getAttribute("data-point-groups"), "1");
  assert.equal(await panel.innerText(), infoUnderTrue, "group information is identical under True and Readable");
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.waitForTimeout(1000);
  await shot("ring-readable-overview");
  await page.getByRole("button", { name: "Focus ring", exact: true }).click();
  await page.waitForTimeout(1200);
  await shot("ring-readable-focus");
  const trueButton = page.getByRole("button", { name: "True", exact: true });
  await trueButton.click();
  await page.waitForTimeout(600);
  assert.equal(await panel.innerText(), infoUnderTrue, "group information is unchanged after switching back");

  // Playback moves the clock without errors, and Apollo stays the default experience.
  await page.getByRole("button", { name: "Play playback" }).click();
  await page.waitForTimeout(500);
  // Frame pacing while the ring plays at the default rate. Software rendering, so relative evidence only: no assertion.
  pacing = await page.evaluate(() => new Promise((resolve) => {
    const deltas = [];
    let last = performance.now();
    const end = last + 4000;
    const tick = (now) => {
      deltas.push(now - last);
      last = now;
      if (now < end) requestAnimationFrame(tick); else resolve(deltas);
    };
    requestAnimationFrame(tick);
  }));
  // Frame-rate counter (T-031): absent with Developer mode off, plausible values with it on.
  const devButton = page.getByRole("button", { name: "Developer mode" });
  const counter = page.getByTestId("frame-rate");
  assert.equal(await counter.count(), 0, "no counter with Developer mode off");
  await devButton.click();
  await counter.locator("[data-frame-fps]").waitFor({ timeout: 10000 });
  counterReadings.ring = await readCounter(counter, "debris-ring");
  assert.ok(counterReadings.ring.fps > 0, "ring fps is positive");
  assert.ok(counterReadings.ring.fills >= 1, "ring fill count is at least 1");
  assert.match(await counter.innerText(), /this browser and machine/);
  await counter.getByTestId("fps-graph").waitFor({ timeout: 10000 });
  await counter.locator(".fps-graph line.tone-good, .fps-graph line.tone-warn, .fps-graph line.tone-bad").first().waitFor({ state: "attached", timeout: 10000 });
  assert.match(await counter.getByTestId("fps-graph").textContent(), /frames per second[\s\S]*s ago[\s\S]*now \(/, "graph is labelled");
  await shot("ring-counter-on");
  await devButton.click();
  assert.equal(await counter.count(), 0, "counter gone when Developer mode is turned off");

  await page.goto(base);
  await page.waitForSelector("canvas");
  await page.getByRole("button", { name: "Developer mode" }).click();
  await page.getByTestId("frame-rate").locator("[data-frame-fps]").waitFor({ timeout: 10000 });
  counterReadings.apollo = await readCounter(page.getByTestId("frame-rate"), null);
  assert.ok(counterReadings.apollo.fps > 0, "Apollo fps is positive");
  await shot("apollo-counter-on");
  assert.equal(await page.getByTestId("earth-moon-canvas").getAttribute("data-point-groups"), "0");
  assert.equal(await page.locator('option[value="columbia"]').count(), 1);
  assert.equal(await page.locator('option[value="debris-ring"]').count(), 0);
} finally {
  await browser.close();
}
const sorted = [...pacing].sort((x, y) => x - y);
const pick = (q) => Number((sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0).toFixed(1));
const framePacingMs = { frames: pacing.length, median: pick(0.5), p95: pick(0.95), max: pick(1), over33ms: pacing.filter((d) => d > 33.4).length };
console.log(JSON.stringify({ framePacingMs, counterReadings, errors }, null, 2));
if (errors.length > 0) process.exit(1);
