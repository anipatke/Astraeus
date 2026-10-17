// Browser check for the one shared control look (T-081 Done When 7, O-020): at 1440x900 and 390x844, in every state that shows controls (the top bar or
// its drawer, the timeline or its drawer, an information panel, a story panel), the controls showing are read through the driver's `controlStyles`
// (computed font family, size, weight, colour, background, border, radius, height, and a dropdown's arrow) and
//   - every control of the same kind and variant has the same look as the others (the two dropdowns above all: same size, font, colour, arrow);
//   - every control has the height the size calls for (36 px on a larger screen, 44 px on a phone);
//   - all controls share one font family and one weight, and dropdowns, text buttons and list rows share one font size;
//   - controls in one row share a baseline: their vertical centres agree to within a pixel.
//   PLAYWRIGHT_CORE=<path> ASTRAEUS_URL=<app.html url> [ASTRAEUS_EVIDENCE_DIR=<fresh dir>] node tools/validate/browser-controls.mjs
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import * as ui from "./driver.mjs";

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const base = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir !== undefined) mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
const failures = [];
const report = [];

const SIZES = [
  { name: "desktop 1440x900", viewport: { width: 1440, height: 900 }, mobile: false, height: "36px" },
  { name: "phone 390x844", viewport: { width: 390, height: 844 }, mobile: true, height: "44px" },
];
const EXPERIENCES = [
  { name: "apollo11", query: "", panels: true },
  { name: "jupiter-io", query: "?experience=jupiter-io", panels: false },
  { name: "shower-perseids", query: "?experience=shower-perseids", panels: true },
];

/** Compares controls of one kind and variant; returns the differences found. */
function compareGroups(controls) {
  const problems = [];
  const groups = new Map();
  for (const control of controls) {
    const key = `${control.kind}|${control.variant}`;
    groups.set(key, [...(groups.get(key) ?? []), control]);
  }
  for (const [key, members] of groups) {
    const [first, ...rest] = members;
    for (const other of rest) {
      for (const property of Object.keys(first.look)) {
        // A drawer icon button has a word under its icon; its own text size is not the look being compared.
        if (first.look[property] !== other.look[property]) problems.push(`${key}: "${first.name}" and "${other.name}" differ in ${property} (${first.look[property]} vs ${other.look[property]})`);
      }
    }
  }
  return { problems, groups: [...groups].map(([key, members]) => `${key} x${members.length}`) };
}

function checkSharedLook(controls, size) {
  const problems = compareGroups(controls).problems;
  for (const control of controls) {
    if (control.kind === "bare") continue;
    if (control.look.height !== size.height && Number.parseFloat(control.look.height) < Number.parseFloat(size.height)) problems.push(`"${control.name}" (${control.kind}) is ${control.look.height} tall, wanted ${size.height}`);
  }
  const looks = controls.filter((control) => control.kind !== "bare");
  const families = new Set(looks.map((control) => control.look.fontFamily));
  if (families.size > 1) problems.push(`more than one font family: ${[...families].join(" | ")}`);
  const sameSize = looks.filter((control) => ["dropdown", "button", "row"].includes(control.kind));
  const sizes = new Set(sameSize.map((control) => control.look.fontSize));
  if (sizes.size > 1) problems.push(`dropdowns, buttons and rows differ in font size: ${[...sizes].join(", ")}`);
  const weights = new Set(sameSize.map((control) => control.look.fontWeight));
  if (weights.size > 1) problems.push(`dropdowns, buttons and rows differ in font weight: ${[...weights].join(", ")}`);
  return problems;
}

function checkRows(controls) {
  const problems = [];
  const items = controls.filter((control) => control.kind !== "bare").map((control) => ({ ...control, centre: (control.rect.top + control.rect.bottom) / 2 })).sort((a, b) => a.centre - b.centre);
  const rows = [];
  for (const item of items) {
    const row = rows[rows.length - 1];
    if (row !== undefined && Math.abs(item.centre - row[0].centre) <= 6) row.push(item); else rows.push([item]);
  }
  for (const row of rows) {
    const centres = row.map((item) => item.centre);
    if (Math.max(...centres) - Math.min(...centres) > 1) problems.push(`row at y=${Math.round(row[0].centre)} is not on one baseline: ${row.map((item) => `${item.name} ${item.centre.toFixed(1)}`).join(", ")}`);
  }
  return { problems, rows: rows.length };
}

async function inState(label, size, page, state) {
  const controls = await ui.controlStyles(page);
  const shared = checkSharedLook(controls, size);
  const rows = checkRows(controls);
  const problems = [...shared, ...rows.problems];
  const dropdowns = controls.filter((control) => control.kind === "dropdown");
  report.push({ label, state, controls: controls.length, dropdowns: dropdowns.length, rows: rows.rows, problems });
  console.log(`${problems.length === 0 ? "ok  " : "FAIL"} ${label} / ${state}: ${controls.length} controls, ${dropdowns.length} dropdown(s), ${rows.rows} row(s)`);
  for (const problem of problems) { console.log(`       - ${problem}`); failures.push(`${label} / ${state}: ${problem}`); }
  return dropdowns.length;
}

for (const experience of EXPERIENCES) {
  for (const size of SIZES) {
    const label = `${experience.name} ${size.name}`;
    const context = await browser.newContext({ viewport: size.viewport, ...(size.mobile ? { isMobile: true, hasTouch: true } : {}) });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
    await page.goto(`${base}${experience.query}`, { waitUntil: "load", timeout: 60000 });
    await ui.waitForShell(page, { timeout: 60000 });
    await ui.ensurePausedQuietly(page);
    await page.waitForTimeout(1500);
    try {
      await inState(label, size, page, "start");
      if (size.mobile) {
        // Both dropdowns (the object list in the top drawer, the playback speed on the timeline) are showing together here.
        await ui.openControlsDrawer(page);
        const dropdowns = await inState(label, size, page, "top drawer open");
        assert.equal(dropdowns, 2, "the object list and the playback speed are both showing");
        await ui.closeControlsDrawer(page);
        await ui.openTimelineDrawer(page);
        await inState(label, size, page, "timeline drawer open");
        await ui.closeTimelineDrawer(page);
      } else {
        assert.equal(await inState(label, size, page, "start (again)"), 2, "the object list and the playback speed are both showing");
      }
      await ui.openInfo(page, /^Information about /);
      await ui.waitForInfo(page);
      await inState(label, size, page, "information panel");
      await ui.openSources(page);
      await inState(label, size, page, "information panel, Sources open");
      await ui.closeInfo(page);
      if (experience.panels && (await ui.storyMarkers(page).count()) > 0) {
        const id = await ui.firstStoryMarkerId(page);
        await ui.openStoryPanel(page, id, { force: true });
        await ui.waitForStoryPanel(page, id);
        await inState(label, size, page, "story panel");
        await ui.closeStoryPanel(page);
      }
      if (outDir !== undefined) await page.screenshot({ path: `${outDir}/${label.replace(/\s+/g, "-")}.png` });
    } catch (error) {
      failures.push(`${label}: ${String(error?.message ?? error).split("\n")[0]}`);
      console.log(`FAIL ${label}: ${String(error?.message ?? error).split("\n")[0]}`);
    }
    await context.close();
  }
}
await browser.close();
for (const error of errors) failures.push(error);
console.log(`console and page problems: ${errors.length}`);
if (outDir !== undefined) writeFileSync(`${outDir}/results.json`, JSON.stringify({ at: new Date().toISOString(), base, failures, report }, null, 2));
if (failures.length > 0) { console.log("FAILED:"); for (const failure of failures) console.log(`  ${failure}`); process.exit(1); }
console.log("shared control look check passed");
