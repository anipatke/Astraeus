// Browser check for the app inside another page (T-082, O-020 Decision 5). The portfolio embeds the app in an iframe; this opens a stand-in
// page with an iframe of the portfolio's size (driver.openInPortfolioFrame) and, for each demo, asserts:
//   - framed, the shell is flagged embedded and its bars are slimmer than the same demo alone (control height, top bar and timeline height);
//   - alone (full screen), the shell is not flagged embedded and keeps the full layout (36 px controls on desktop, 44 px on a phone);
//   - the shared controls are still reachable in the frame: play and pause, the speed picker, the object list, the Events list, the Developer cog;
//   - the frame never scrolls sideways, the bars stay inside the frame, and there are no console or page errors.
// Sizes: a laptop (1280x800, frame 660 high) and a phone (390x844, frame 460 high). Earth–Moon is checked while it exists (T-093 removes it).
//   PLAYWRIGHT_CORE=<path> ASTRAEUS_URL=<app.html url> [ASTRAEUS_EVIDENCE_DIR=<fresh dir>] node tools/validate/browser-embedded.mjs
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import * as ui from "./driver.mjs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir !== undefined) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", ...ui.FRAMING_BROWSER_ARGS] });
const errors = [];
const results = [];
const note = (text) => console.log(text);

const SIZES = [
  { name: "laptop", viewport: { width: 1280, height: 800 }, phone: false },
  { name: "phone", viewport: { width: 390, height: 844 }, phone: true, touch: true },
];
const DEMOS = [
  { name: "apollo11", query: "", events: true },
  { name: "showers", query: "?experience=showers" },
  { name: "geminids", query: "?experience=showers&shower=geminids" },
  { name: "earth-moon", query: "?experience=earth-moon" },
  { name: "jupiter-io", query: "?experience=jupiter-io" },
];

async function open(size, demo, framed) {
  const context = await browser.newContext({ viewport: size.viewport, isMobile: size.touch === true, hasTouch: size.touch === true });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(`${demo.name}/${size.name}/${framed ? "framed" : "alone"} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${demo.name}/${size.name}/${framed ? "framed" : "alone"} console: ${message.text()}`); });
  const url = `${base}${demo.query}`;
  let target = page;
  if (framed) target = await ui.openInPortfolioFrame(page, url, { timeout: 60000 });
  else { await page.goto(url, { waitUntil: "load", timeout: 60000 }); await ui.waitForShell(page, { timeout: 60000 }); }
  await ui.ensurePausedQuietly(target);
  await target.waitForTimeout(1200);
  return { context, page, target };
}

for (const size of SIZES) {
  for (const demo of DEMOS) {
    const label = `${demo.name}/${size.name}`;
    const alone = await open(size, demo, false);
    const aloneLook = await ui.embeddedLook(alone.target);
    await alone.context.close();
    const framed = await open(size, demo, true);
    const frame = framed.target;
    const look = await ui.embeddedLook(frame);

    assert.equal(aloneLook.embedded, "false", `${label}: alone, the shell is not embedded`);
    assert.equal(look.embedded, "true", `${label}: framed, the shell is embedded`);
    assert.equal(look.phone, String(size.phone), `${label}: the frame picks the ${size.name} layout by its own width`);
    assert.equal(look.scrollsHorizontally, false, `${label}: no sideways scroll in the frame`);
    assert.ok(look.timeline.bottom <= look.viewport.height && look.timeline.left >= 0 && look.timeline.right <= look.viewport.width, `${label}: the timeline sits inside the frame`);
    if (size.phone) {
      // A phone keeps its 44 px targets and drawers; the margins and timeline padding tighten.
      assert.ok(look.controlHeight >= 44, `${label}: touch targets stay at least 44 px (${look.controlHeight})`);
      assert.ok(look.timeline.height < aloneLook.timeline.height, `${label}: the timeline is slimmer framed (${look.timeline.height} < ${aloneLook.timeline.height})`);
      assert.ok(look.topGap < aloneLook.topGap, `${label}: the pill sits closer to the corner framed`);
    } else {
      assert.equal(Math.round(aloneLook.controlHeight), 36, `${label}: alone keeps 36 px controls`);
      assert.ok(look.controlHeight <= 32, `${label}: framed controls are slim (${look.controlHeight})`);
      assert.ok(look.topBar.height < aloneLook.topBar.height, `${label}: the top bar is slimmer framed (${look.topBar.height} < ${aloneLook.topBar.height})`);
      assert.ok(look.timeline.height < aloneLook.timeline.height, `${label}: the timeline is slimmer framed (${look.timeline.height} < ${aloneLook.timeline.height})`);
      assert.ok(look.timelineBottomGap < aloneLook.timelineBottomGap, `${label}: the timeline sits closer to the edge framed`);
    }

    // The shared controls still work inside the frame.
    await ui.playPlayback(frame);
    assert.equal(await ui.isPlaying(frame), true, `${label}: Play works in the frame`);
    await ui.pausePlayback(frame);
    assert.equal(await ui.isPlaying(frame), false, `${label}: Pause works in the frame`);
    const before = await ui.speed(frame);
    const fastest = await ui.setFastestSpeed(frame);
    assert.equal(await ui.speed(frame), fastest, `${label}: the speed picker works in the frame`);
    await ui.setSpeed(frame, before);
    await ui.pickFirstBody(frame);
    assert.ok((await ui.pickedBody(frame)).length > 0, `${label}: the object list works in the frame`);
    if (demo.events === true) {
      await ui.toggleEventList(frame);
      assert.ok(await ui.eventListOpen(frame), `${label}: the Events list opens in the frame`);
      assert.ok((await ui.eventRowCount(frame)) > 0, `${label}: the Events list has rows in the frame`);
      await ui.toggleEventList(frame);
    }
    await ui.toggleDeveloper(frame, { expand: false });
    assert.equal(await ui.developerOpen(frame), true, `${label}: the Developer cog opens its panel in the frame`);
    await ui.closeDeveloper(frame);
    assert.equal(await ui.developerOpen(frame), false, `${label}: and closes it`);

    if (outDir !== undefined) await framed.page.screenshot({ path: `${outDir}/${demo.name}-${size.name}-framed.png` });
    results.push({ label, alone: { controlHeight: aloneLook.controlHeight, topBar: aloneLook.topBar?.height, timeline: aloneLook.timeline.height }, framed: { controlHeight: look.controlHeight, topBar: look.topBar?.height, timeline: look.timeline.height } });
    note(`ok ${label}: controls ${aloneLook.controlHeight} -> ${look.controlHeight}, bar ${aloneLook.topBar?.height} -> ${look.topBar?.height}, timeline ${aloneLook.timeline.height} -> ${look.timeline.height}`);
    await framed.context.close();
  }
}
await browser.close();
if (outDir !== undefined) writeFileSync(`${outDir}/embedded-results.json`, JSON.stringify({ results, errors }, null, 2));
if (errors.length > 0) { console.log(errors.join("\n")); throw new Error(`${errors.length} console or page errors`); }
console.log("zero console errors");
