// Browser validation for Spike 02 (brief sections 15-19). Run: npm run dev (port 5199), then
//   PLAYWRIGHT_CORE=<path to playwright-core> node tools/validate/browser-spike02.mjs
// Writes docs/evidence/spike02-browser.json and screenshots. Headless SwiftShader Chromium.
import { mkdirSync, writeFileSync } from "node:fs";
const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const URL = process.env.ASTRAEUS_URL ?? "http://localhost:5199/";
const OUT = "docs/evidence/spike02";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
await page.goto(URL);
await page.waitForSelector("canvas");

const results = [];
const click = (name) => page.getByRole("button", { name, exact: true }).click();
const pause = async () => { const b = page.getByRole("button", { name: "Pause", exact: true }); if (await b.count()) await b.click(); };
const readTime = async () => (await page.locator(".controls .readout").first().textContent()).trim();
const mission = async () => (await page.locator(".mission .readout").allTextContents()).map((s) => s.trim());
const overlay = async () => page.locator("dl.overlay").innerText().catch(() => "");
const seek = async (utc) => { await page.getByLabel("UTC date and time").fill(utc); await click("Seek (UTC)"); };
async function scenario(id, { utc, focus, follow, scale, note }) {
  await pause();
  await click(scale === "true" ? "True" : "Readable");
  await seek(utc);
  if (follow) await click(`Follow ${follow}`); else await click(`Focus ${focus}`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${id}.png` });
  const rec = { id, utc, scale: scale ?? "readable", focus: follow ? `follow ${follow}` : focus, time: await readTime(), mission: await mission(), note };
  results.push(rec); return rec;
}

await click("Developer mode");
await click("Mission window"); // preset + seek to window start
const sc = [
  ["earth-orbit", "1969-07-16 14:30:00", { follow: "Columbia (CSM)" }, "close Earth orbit (parking orbit, backward-propagated)"],
  ["translunar", "1969-07-18 12:00:00", { follow: "Columbia (CSM)" }, "translunar coast"],
  ["lunar-orbit-columbia", "1969-07-21 06:00:00", { follow: "Columbia (CSM)" }, "close lunar orbit"],
  ["lunar-surface-eagle", "1969-07-21 06:00:00", { follow: "Eagle (LM)" }, "Eagle on the surface"],
  ["return", "1969-07-23 12:00:00", { follow: "Columbia (CSM)" }, "trans-Earth coast"],
  ["entry", "1969-07-24 16:30:00", { follow: "Columbia (CSM)" }, "entry interface"],
];
for (const scale of ["readable", "true"]) for (const [id, utc, f, note] of sc) await scenario(`${id}-${scale}`, { utc, scale, note, ...f });

// Same scientific state on both scales: the physical readout must match across scales.
const pairs = sc.map(([id]) => ({ id, same: JSON.stringify(results.find((r) => r.id === `${id}-readable`).mission) === JSON.stringify(results.find((r) => r.id === `${id}-true`).mission) }));

// Focus transitions at a fixed time must not alter scientific state.
await pause(); await seek("1969-07-19 12:00:00");
const focusStates = [];
for (const name of ["Focus Earth", "Focus Moon", "Focus Columbia (CSM)", "Focus Eagle (LM)", "Follow Columbia (CSM)", "Earth–Moon overview"]) {
  await click(name); await page.waitForTimeout(700);
  focusStates.push({ name, time: await readTime(), mission: await mission() });
}
const focusUnchanged = new Set(focusStates.map((s) => JSON.stringify([s.time, s.mission]))).size === 1;

// Event jumps: every event lands on its own timestamp.
const options = await page.getByLabel("Mission event").locator("option").allTextContents();
const values = await page.getByLabel("Mission event").locator("option").evaluateAll((o) => o.map((x) => x.value));
const jumps = [];
for (let i = 0; i < values.length; i++) {
  await page.getByLabel("Mission event").selectOption(values[i]); await click("Jump to event"); await page.waitForTimeout(150);
  jumps.push({ id: values[i], label: options[i], time: await readTime() });
}

// Rate changes: simulated seconds elapsed per real second, measured through the timestamp readout.
const parse = (s) => Date.parse(s.split(" ·")[0].replace(/Z?$/, "Z").replace(/ZZ$/, "Z"));
const rates = [];
for (const r of ["1×", "100×", "1,000×", "10,000×"]) {
  await pause(); await seek("1969-07-17 00:00:00"); await click(r); await click("Play");
  const w0 = Date.now(); await page.waitForTimeout(4000);
  await click("Pause"); const w1 = Date.now(); await page.waitForTimeout(300); // pause first: a playing readout can lag
  const t1 = parse(await readTime()); const t0 = Date.parse("1969-07-17T00:00:00Z");
  rates.push({ rate: r, simSecPerRealSec: (t1 - t0) / (w1 - w0) });
}

// Rebasing continuity: follow Columbia while playing at 100x through lunar orbit (one orbit takes about 2 h, so about 70 s of wall time); sample range/speed.
await pause(); await seek("1969-07-20 17:00:00"); await click("Follow Columbia (CSM)"); await click("100×"); await click("Play");
const track = [];
for (let i = 0; i < 30; i++) { await page.waitForTimeout(400); const m = await mission(); track.push({ time: await readTime(), m: m[0] }); }
await pause();

// Spike 01 regression: orientation/phase/terminator readouts at the USNO reference dates.
const usno = [];
await click("Readable"); await click("Focus Moon");
for (const utc of ["2024-01-04 03:30:00", "2024-01-11 11:57:00", "2024-01-18 03:52:00", "2024-01-25 17:54:00"]) {
  await seek(utc); await page.waitForTimeout(600); usno.push({ utc, overlay: await overlay() });
}
await page.screenshot({ path: `${OUT}/spike01-regression.png` });

writeFileSync("docs/evidence/spike02-browser.json", JSON.stringify({ url: URL, errors, results, scalePairsIdentical: pairs, focusUnchanged, focusStates, jumps, rates, track, usno }, null, 2));
console.log(JSON.stringify({ errors, pairs, focusUnchanged, rates, jumps: jumps.length }, null, 1));
await browser.close();
