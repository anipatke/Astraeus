// Lite browser check (the lite tier from I-033): one quick pass for everyday scene-affecting changes (Task handoff, Quick Checks).
//
// Covers, for EVERY experience, at desktop 1440x900 and phone 390x844 (one browser, a fresh context and page per load):
//   - the canvas draws (a screenshot of it has lit pixels, so it is not blank),
//   - the timeline controls (the shell) are present,
//   - the object list opens one object's information panel,
//   - zero console errors and zero page errors.
// For experiences that have story panels (data/stories/<name>/panels.json: Apollo and the Perseids today): one panel opens from its timeline marker.
// Also loads the site pages index.html and assets.html at both sizes: no console errors, no horizontal scroll.
//
// Experiences are discovered, not listed by hand: Apollo is the default (no ?experience=), the named ones are the keys of DEFINITIONS in src/main.tsx,
// and every data/showers/<name>.json is ?experience=shower-<name>.
//
// Deliberately does NOT cover (run the full set for those: every tools/validate/browser-*.mjs, for Full Objective Checks and before a release or merge):
//   exact numbers and readouts (browser-shell, browser-precision), camera presets and labels (browser-anchor-labels, browser-earth-moon, browser-jupiter-io),
//   lighting and the Sun (browser-lighting, browser-sun), the sky and its map (browser-sky, browser-sky-map), shower streams, sources and orbits
//   (browser-showers, browser-public-showers), the made-up experiences' own behaviour (browser-synthetic*), story panel timing, auto-open
//   and settings (browser-story-panels), view links (browser-view-link), and the spike scripts. A pass here is a smoke result, not a substitute for those.
//
// Run: start the app, then
//   npx vite --port 5199
//   PLAYWRIGHT_CORE=/home/user/code/planetary-explorer/node_modules/playwright-core/index.js \
//   ASTRAEUS_EVIDENCE_DIR=docs/evidence/lite-<UTC stamp> node tools/validate/browser-lite.mjs
// ASTRAEUS_URL (default http://localhost:5199/app.html) is the app page; the site pages are read from the same directory.
// ASTRAEUS_EVIDENCE_DIR is required and must be new or empty, so evidence never overwrites an earlier run. Exit code is non-zero if any load fails.
import { mkdirSync, readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const outDir = process.env.ASTRAEUS_EVIDENCE_DIR;
if (outDir === undefined || outDir === "") {
  console.error("set ASTRAEUS_EVIDENCE_DIR to a fresh evidence directory (it is required so evidence never overwrites an earlier run)");
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });
if (readdirSync(outDir).length > 0) {
  console.error(`${outDir} is not empty; use a fresh directory`);
  process.exit(2);
}

const pw = await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core");
const chromium = pw.chromium ?? pw.default.chromium;
const appUrl = process.env.ASTRAEUS_URL ?? "http://localhost:5199/app.html";
const siteUrl = (name) => new URL(name, appUrl).href;

// ---- Discover the experiences ----
const mainSource = readFileSync(new URL("src/main.tsx", root), "utf8");
const definitionsBlock = /const DEFINITIONS[^\n]*>\s*=\s*\{([\s\S]*?)\n\};/.exec(mainSource);
if (definitionsBlock === null) throw new Error("could not find DEFINITIONS in src/main.tsx");
const named = [...definitionsBlock[1].matchAll(/^\s*"?([A-Za-z0-9-]+)"?\s*:/gm)].map((match) => match[1]);
const showers = readdirSync(new URL("data/showers/", root)).filter((file) => file.endsWith(".json")).map((file) => file.replace(/\.json$/, "")).sort();
const hasPanels = (storyName) => existsSync(new URL(`data/stories/${storyName}/panels.json`, root));
const experiences = [
  { id: "apollo11", query: "", panelStory: hasPanels("apollo11") ? "apollo11" : undefined },
  ...named.map((name) => ({ id: name, query: `?experience=${name}`, panelStory: hasPanels(name) ? name : undefined })),
  ...showers.map((name) => ({ id: `shower-${name}`, query: `?experience=shower-${name}`, panelStory: hasPanels(name) ? name : undefined })),
];
if (named.length === 0) throw new Error("found no named experiences in src/main.tsx");

const VIEWPORTS = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, mobile: false },
  { name: "phone", viewport: { width: 390, height: 844 }, mobile: true },
];

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const results = [];

// Pixels on the canvas that are not near-black: something is drawn.
async function litPixels(page) {
  const png = (await page.getByTestId("earth-moon-canvas").screenshot()).toString("base64");
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
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 60) lit += 1;
    return lit;
  }, png);
}

const hasHorizontalScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

// One load: runs the checks, never throws; every failed check is collected so the run reports them all.
async function load(label, url, size, checks) {
  const failures = [];
  const detail = {};
  const errors = [];
  const check = async (what, fn) => {
    try { await fn(); } catch (error) { failures.push(`${what}: ${String(error?.message ?? error).split("\n")[0]}`); }
  };
  const started = Date.now();
  const context = await browser.newContext({ viewport: size.viewport, ...(size.mobile ? { isMobile: true, hasTouch: true } : {}) });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  const shotName = `${label}-${size.name}.png`;
  try {
    await page.goto(url, { waitUntil: "load", timeout: 60000 });
    await checks(page, check, detail);
    await page.waitForTimeout(300);
    await check("screenshot", () => page.screenshot({ path: `${outDir}/${shotName}` }));
  } catch (error) {
    failures.push(`load: ${String(error?.message ?? error).split("\n")[0]}`);
    try { await page.screenshot({ path: `${outDir}/${shotName}` }); } catch { /* the page may be gone */ }
  } finally {
    await context.close();
  }
  for (const error of errors) failures.push(error);
  const seconds = Math.round((Date.now() - started) / 100) / 10;
  const record = { label, size: size.name, viewport: `${size.viewport.width}x${size.viewport.height}`, url, ok: failures.length === 0, seconds, screenshot: shotName, detail, failures };
  results.push(record);
  console.log(`${record.ok ? "ok  " : "FAIL"} ${label.padEnd(26)} ${record.viewport.padEnd(9)} ${String(seconds).padStart(5)}s${Object.keys(detail).length ? ` ${JSON.stringify(detail)}` : ""}`);
  for (const failure of failures) console.log(`       - ${failure}`);
}

// ---- Experience checks ----
function experienceChecks(experience) {
  return async (page, check, detail) => {
    await check("canvas present", () => page.waitForSelector("canvas", { timeout: 60000 }));
    await check("timeline/shell present", () => page.getByRole("region", { name: "Timeline controls" }).waitFor({ timeout: 60000 }));
    // Hold playback still so the scene and any auto-opening panel settle; a story panel's own hold may already have paused it.
    const pause = page.getByRole("button", { name: "Pause playback" });
    if (await pause.count()) await pause.click({ timeout: 5000 }).catch(() => undefined);
    await page.waitForTimeout(1500);
    await check("canvas draws", async () => {
      const lit = await litPixels(page);
      detail.litPixels = lit;
      if (lit < 200) throw new Error(`only ${lit} lit pixels`);
    });
    await check("object information opens", async () => {
      const select = page.getByLabel("Select object");
      await select.waitFor({ timeout: 10000 });
      const choice = await select.evaluate((element) => [...element.options].filter((option) => !option.disabled).map((option) => ({ value: option.value, text: option.textContent.trim() })));
      if (choice.length === 0) throw new Error("the object list has no enabled object");
      const wanted = choice[choice.length > 1 ? 1 : 0];
      await select.selectOption(wanted.value);
      const panel = page.locator("#info-panel");
      if ((await panel.count()) === 0) await page.getByRole("button", { name: /^Information about / }).first().click({ timeout: 10000 });
      await panel.waitFor({ timeout: 10000 });
      if ((await panel.innerText()).trim() === "") throw new Error("the information panel is empty");
      detail.object = wanted.value;
      const close = page.locator("#info-panel .info-panel-close");
      if (await close.count()) await close.click({ timeout: 5000 }).catch(() => undefined);
    });
    if (experience.panelStory !== undefined) {
      await check("story panel opens from its timeline marker", async () => {
        const markers = page.locator(".timeline-panel-marker");
        const count = await markers.count();
        if (count === 0) throw new Error("no timeline panel markers");
        const marker = markers.first();
        const id = await marker.getAttribute("data-panel-id");
        await marker.click({ force: true });
        await page.locator(`.story-panel[data-panel-id="${id}"]`).waitFor({ timeout: 10000 });
        detail.panel = id;
      });
    }
  };
}

// ---- Site page checks ----
const siteChecks = async (page, check, detail) => {
  await page.waitForTimeout(800);
  await check("no horizontal scroll", async () => {
    if (await hasHorizontalScroll(page)) throw new Error("the page scrolls sideways");
  });
  detail.title = await page.title().catch(() => "");
};

try {
  console.log(`lite browser check: ${experiences.length} experiences (${experiences.map((e) => e.id).join(", ")}) + 2 site pages, ${VIEWPORTS.length} sizes`);
  for (const experience of experiences) {
    for (const size of VIEWPORTS) await load(experience.id, `${appUrl}${experience.query}`, size, experienceChecks(experience));
  }
  for (const page of ["index.html", "assets.html"]) {
    for (const size of VIEWPORTS) await load(page.replace(/\.html$/, "-page"), siteUrl(page), size, siteChecks);
  }
} finally {
  await browser.close();
}

const failed = results.filter((result) => !result.ok);
writeFileSync(`${outDir}/results.json`, JSON.stringify({ tier: "lite (I-033)", at: new Date().toISOString(), appUrl, experiences: experiences.map((e) => e.id), loads: results.length, failed: failed.length, results }, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} loads passed; results and screenshots in ${outDir}`);
if (failed.length > 0) {
  console.log("FAILED:");
  for (const result of failed) console.log(`  ${result.label} ${result.size}: ${result.failures.join(" | ")}`);
  process.exit(1);
}
