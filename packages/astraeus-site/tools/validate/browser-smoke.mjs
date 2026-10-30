// The smoke step of `npm run check:browser` (O-038 T-145), grown out of browser-lite.mjs: open every public page and every demo view once at desktop and phone size.
// Each load fails on any page or console error, a missing shell, or a scene with no body, orbit path or dot in view (the scene's own readouts; stars alone do not count; no picture). Nothing else is asserted.
// Views are discovered as browser-lite does: Apollo (no query), the keys of DEFINITIONS in src/main.tsx, the planets and showers experiences, and every data/showers/<name>.json.
// The made-up (synthetic) scenes are not public pages and are left to the DOM tests, except the Sun-centred probe path (O-046 T-193). Pages: index.html and assets.html beside app.html.
// Apollo 11 must also stop drawing once paused and untouched (the frames-drawn readout stops counting, O-031 T-149).
// Shower views (id starting "showers") must also draw the meteor stream: dots in view, not just any body (I-071). ASTRAEUS_VIEWS=showers limits the run to those views
// (the step against the scratch public build uses it, so the shipped stream copy is what loads).
// Run alone: ASTRAEUS_URL=<app.html url> ASTRAEUS_EVIDENCE_DIR=<new dir> node tools/validate/browser-smoke.mjs
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import * as ui from "./driver.mjs";
import { assertStreamDrawn } from "./stream-check.mjs";
import { launchBrowser, openContext, pageIn, watchErrors } from "./harness.mjs";

const root = new URL("../../", import.meta.url);
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir === undefined || outDir === "") { console.error("set ASTRAEUS_EVIDENCE_DIR to a fresh evidence directory"); process.exit(2); }
mkdirSync(outDir, { recursive: true });
if (readdirSync(outDir).length > 0) { console.error(`${outDir} is not empty; use a fresh directory`); process.exit(2); }

const appUrl = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const VIEWPORTS = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, mobile: false },
  { name: "phone", viewport: { width: 390, height: 844 }, mobile: true },
];

function discoverViews() {
  const source = readFileSync(new URL("src/main.tsx", root), "utf8");
  const block = /const DEFINITIONS[^\n]*>\s*=[^{\n]*\{([\s\S]*?)\n\};/.exec(source);
  if (block === null) throw new Error("could not find DEFINITIONS in src/main.tsx");
  const named = [...block[1].matchAll(/^\s*"?([A-Za-z0-9-]+)"?\s*:/gm)].map((match) => match[1]);
  const showers = readdirSync(new URL("../astraeus-demo-showers/data/showers/", root)).filter((file) => file.endsWith(".json")).map((file) => file.replace(/\.json$/, "")).sort();
  const views = [{ id: "apollo11", url: appUrl, scene: true }];
  for (const name of new Set([...named, "planets", "showers"])) views.push({ id: name, url: `${appUrl}?experience=${name}`, scene: true });
  for (const name of showers) views.push({ id: `showers-${name}`, url: `${appUrl}?experience=showers&shower=${name}`, scene: true });
  // O-046 T-193: the made-up Sun-centred probe path (dev server only; the public build leaves it out) gets the extra checks in `sunPathChecks`.
  views.push({ id: "synthetic-probe", url: `${appUrl}?experience=synthetic-probe`, scene: true, sunPath: true });
  for (const page of ["index", "assets"]) views.push({ id: `${page}-page`, url: new URL(`${page}.html`, appUrl).href, scene: false });
  const only = process.env.ASTRAEUS_VIEWS;
  return only === undefined || only === "" ? views : views.filter((view) => view.id.startsWith(only));
}

async function drawsSomething(page, view) {
  const deadline = Date.now() + 10000;
  const content = (d) => d.bodies + d.dots + d.paths; // the experience's own content; stars alone do not count
  let drawn = await ui.sceneDrawsSomething(page);
  while (content(drawn) === 0 && Date.now() < deadline) {
    await page.waitForTimeout(250);
    drawn = await ui.sceneDrawsSomething(page);
  }
  if (content(drawn) === 0) throw new Error(`the scene shows no body, dot or path in view (${JSON.stringify(drawn)})`);
  if (view.id.startsWith("showers")) {
    while ((drawn.dots === 0) && Date.now() < deadline) {
      await page.waitForTimeout(250);
      drawn = await ui.sceneDrawsSomething(page);
    }
    assertStreamDrawn(drawn.dots, view.id);
  }
  return drawn;
}

/** O-046 T-193: the probe path draws, its line (fixed to the Sun) sits at the same place in the view at two times, and its label is shown. Readouts only. */
async function sunPathChecks(page) {
  await ui.ensurePaused(page);
  const line = (p) => [p.minX, p.maxX, p.minY, p.maxY];
  await ui.seekToFraction(page, 0.2);
  await page.waitForTimeout(500);
  const first = await ui.scenePath(page, "probe");
  await ui.seekToFraction(page, 0.8);
  await page.waitForTimeout(500);
  const second = await ui.scenePath(page, "probe");
  if (first === undefined || !first.visible || first.inView === 0) throw new Error(`the Sun-centred probe path is not drawn in view (${JSON.stringify(first)} of ${JSON.stringify((await ui.scenePaths(page)).map((p) => p.id))})`);
  if (second === undefined || line(first).some((value, k) => Math.abs(value - line(second)[k]) > 0.002)) throw new Error(`the probe path line moved between two times (${JSON.stringify(line(first))} then ${JSON.stringify(second && line(second))})`);
  if (!(await ui.shownSceneLabelIds(page)).includes("probe")) throw new Error("the probe path's label is not shown");
  return { first: line(first), second: line(second) };
}

async function load(browser, view, size) {
  const errors = [];
  const failures = [];
  const started = Date.now();
  const context = await openContext(browser, { viewport: size.viewport, ...(size.mobile ? { isMobile: true, hasTouch: true } : {}) });
  const page = await pageIn(context);
  watchErrors(page, errors);
  let drawn;
  try {
    await page.goto(view.url, { waitUntil: "load", timeout: 60000 });
    if (view.scene) {
      await ui.waitForShell(page, { timeout: 60000 });
      drawn = await drawsSomething(page, view);
      // O-031 T-149: a paused, untouched scene stops drawing (Apollo 11 is the one view checked; the rule is the same for all).
      if (view.sunPath) drawn = { ...drawn, sunPath: await sunPathChecks(page) };
      if (view.id === "apollo11") { await ui.ensurePaused(page); drawn = { ...drawn, idleAtFrames: await ui.waitUntilSceneIdle(page) }; }
    } else {
      await page.waitForTimeout(500);
    }
  } catch (error) {
    failures.push(String(error?.message ?? error).split("\n")[0]);
  } finally {
    await context.close();
  }
  failures.push(...errors);
  const seconds = Math.round((Date.now() - started) / 100) / 10;
  const record = { label: view.id, size: size.name, ok: failures.length === 0, seconds, drawn, failures };
  console.log(`${record.ok ? "ok  " : "FAIL"} ${view.id.padEnd(22)} ${size.name.padEnd(8)} ${String(seconds).padStart(5)}s`);
  for (const failure of failures) console.log(`       - ${failure}`);
  return record;
}

const views = discoverViews();
const browser = await launchBrowser();
const results = [];
try {
  console.log(`smoke: ${views.length} views (${views.map((view) => view.id).join(", ")}), ${VIEWPORTS.length} sizes`);
  for (const view of views) for (const size of VIEWPORTS) results.push(await load(browser, view, size));
} finally {
  await browser.close();
}
const failed = results.filter((result) => !result.ok);
writeFileSync(`${outDir}/results.json`, JSON.stringify({ at: new Date().toISOString(), appUrl, loads: results.length, failed: failed.length, results }, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} loads passed; results in ${outDir}`);
if (failed.length > 0) process.exit(1);
