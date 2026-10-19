// Lite browser check (the lite tier from I-033): one quick pass for everyday scene-affecting changes (Task handoff, Quick Checks).
//
// Covers, for EVERY experience, at desktop 1440x900 and phone 390x844 (one browser, a fresh context and page per load):
//   - the canvas draws (the scene reports a body, dots, a path or stars in view, so it is not blank),
//   - the timeline controls (the shell) are present,
//   - the object list opens one object's information panel,
//   - the page heading (T-070): app.html's own title is "Astraeus"; once the experience is open the title is "<its label> · Astraeus" (a made-up one, which has no label, keeps "Astraeus"),
//   - zero console errors and zero page errors.
// For experiences that have story panels (data/stories/<name>/panels.json: Apollo and the Perseids today): one panel opens from its timeline marker.
// Also loads the site pages index.html and assets.html at both sizes: no console errors, no horizontal scroll.
//
// Experiences are discovered, not listed by hand: Apollo is the default (no ?experience=), the named ones are the keys of DEFINITIONS in src/main.tsx,
// and every data/showers/<name>.json is ?experience=showers&shower=<name> (plus the plain ?experience=showers address).
//
// Deliberately does NOT cover (run the full set for those: every tools/validate/browser-*.mjs, for Full Objective Checks and before a release or merge):
//   exact numbers and readouts (browser-shell, browser-precision), camera presets and labels (browser-anchor-labels, browser-jupiter-io),
//   the Sun (browser-sun), the sky (browser-sky), shower streams, sources and orbits
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
import * as ui from "./driver.mjs";
import { DEMO_ADDRESSES } from "./public-addresses.mjs";

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
// DEFINITIONS holds the real ones; SYNTHETIC the made-up ones, which only the dev server mounts (a public build leaves them out, T-068).
const blocks = ["DEFINITIONS", "SYNTHETIC"].map((name) => new RegExp(`const ${name}[^\\n]*>\\s*=[^{\\n]*\\{([\\s\\S]*?)\\n\\};`).exec(mainSource));
if (blocks.includes(null)) throw new Error("could not find DEFINITIONS and SYNTHETIC in src/main.tsx");
const named = blocks.flatMap((block) => [...block[1].matchAll(/^\s*"?([A-Za-z0-9-]+)"?\s*:/gm)].map((match) => match[1]));
const showers = readdirSync(new URL("data/showers/", root)).filter((file) => file.endsWith(".json")).map((file) => file.replace(/\.json$/, "")).sort();
const hasPanels = (storyName) => existsSync(new URL(`data/stories/${storyName}/panels.json`, root));
const experiences = [
  { id: "apollo11", query: "", panelStory: hasPanels("apollo11") ? "apollo11" : undefined },
  ...named.map((name) => ({ id: name, query: `?experience=${name}`, panelStory: hasPanels(name) ? name : undefined })),
  { id: "showers", query: "?experience=showers", panelStory: showers.length > 0 && hasPanels(showers[0]) ? showers[0] : undefined },
  ...showers.map((name) => ({ id: `showers-${name}`, query: `?experience=showers&shower=${name}`, panelStory: hasPanels(name) ? name : undefined })),
];
if (named.length === 0) throw new Error("found no named experiences in src/main.tsx");

const VIEWPORTS = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, mobile: false },
  { name: "phone", viewport: { width: 390, height: 844 }, mobile: true },
];

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const results = [];

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
  try {
    if (checks.watchesLoader === true) await ui.watchLoader(page);
    await page.goto(url, { waitUntil: "load", timeout: 60000 });
    await checks(page, check, detail);
    await page.waitForTimeout(300);
  } catch (error) {
    failures.push(`load: ${String(error?.message ?? error).split("\n")[0]}`);
  } finally {
    await context.close();
  }
  for (const error of errors) failures.push(error);
  const seconds = Math.round((Date.now() - started) / 100) / 10;
  const record = { label, size: size.name, viewport: `${size.viewport.width}x${size.viewport.height}`, url, ok: failures.length === 0, seconds, detail, failures };
  results.push(record);
  console.log(`${record.ok ? "ok  " : "FAIL"} ${label.padEnd(26)} ${record.viewport.padEnd(9)} ${String(seconds).padStart(5)}s${Object.keys(detail).length ? ` ${JSON.stringify(detail)}` : ""}`);
  for (const failure of failures) console.log(`       - ${failure}`);
}

// ---- Experience checks ----
function experienceChecks(experience) {
  const run = async (page, check, detail) => {
    await check("canvas present", () => page.waitForSelector("canvas", { timeout: 60000 }));
    await check("page heading names the experience once it is open", async () => {
      const served = await page.request.get(appUrl.split("?")[0]);
      if (!/<title>Astraeus<\/title>/.test(await served.text())) throw new Error("app.html's own title is not exactly Astraeus");
      const title = await page.evaluate(() => document.title);
      detail.title = title;
      if (/spike/i.test(title)) throw new Error(`the title still says spike: ${title}`);
      const made = experience.id.startsWith("synthetic");
      if (made ? title !== "Astraeus" : !/^.+ \u00b7 Astraeus$/.test(title)) throw new Error(`unexpected page title "${title}"`);
    });
    await check("loading screen was shown from the first paint and is gone once the scene is ready", async () => {
      if (!(await ui.loaderWasSeen(page))) throw new Error("the loader was not in the page, loading, at first paint");
      await ui.waitForLoaderGone(page, { timeout: 15000 });
      if ((await ui.loaderState(page)) !== "absent") throw new Error("the loader is still in the page");
    });
    await check("timeline/shell present", () => ui.waitForShell(page, { timeout: 60000 }));
    // Hold playback still so the scene and any auto-opening panel settle; a story panel's own hold may already have paused it.
    await ui.ensurePausedQuietly(page);
    await page.waitForTimeout(1500);
    await check("canvas draws", async () => {
      const drawn = await ui.sceneDrawsSomething(page);
      detail.drawn = drawn;
      if (drawn.bodies + drawn.dots + drawn.paths + drawn.stars === 0) throw new Error(`the scene reports nothing drawn in view (${JSON.stringify(drawn)})`);
    });
    await check("object information opens", async () => {
      await ui.waitForBodyPicker(page, { timeout: 10000 });
      const choice = await ui.pickableBodies(page);
      if (choice.length === 0) throw new Error("the object list has no enabled object");
      const wanted = choice[choice.length > 1 ? 1 : 0];
      await ui.pickBody(page, wanted.value);
      const panel = ui.infoPanel(page);
      await ui.openInfo(page, /^Information about /, { timeout: 10000 });
      await panel.waitFor({ timeout: 10000 });
      if ((await panel.innerText()).trim() === "") throw new Error("the information panel is empty");
      detail.object = wanted.value;
      await ui.closeInfoQuietly(page);
    });
    if (experience.panelStory !== undefined) {
      await check("story panel opens from its timeline marker", async () => {
        if ((await ui.storyMarkers(page).count()) === 0) throw new Error("no timeline panel markers");
        const id = await ui.firstStoryMarkerId(page);
        await ui.openStoryPanel(page, id, { force: true });
        await ui.storyPanel(page, id).waitFor({ timeout: 10000 });
        detail.panel = id;
      });
    }
  };
  run.watchesLoader = true;
  return run;
}

// ---- Site page checks ----
const siteChecks = async (page, check, detail) => {
  await page.waitForTimeout(800);
  await check("no horizontal scroll", async () => {
    if (await hasHorizontalScroll(page)) throw new Error("the page scrolls sideways");
  });
  detail.title = await page.title().catch(() => "");
};

/** The catalogue page lists Jupiter's moons by family (O-025 T-097): the families that the core data names, each with its moons, 115 in all. */
const assetsChecks = async (page, check, detail) => {
  await siteChecks(page, check, detail);
  await check("catalogue page lists Jupiter's moons by family", async () => {
    const families = await ui.catalogueMoonFamilies(page);
    const data = JSON.parse(readFileSync(new URL("data/moons/jupiter.json", root), "utf8"));
    const ids = families.flatMap((family) => family.moons);
    if (families.length !== data.families.length) throw new Error(`${families.length} families on the page, ${data.families.length} in the data`);
    if (ids.length !== data.moons.length || new Set(ids).size !== ids.length) throw new Error(`${ids.length} moons listed, ${data.moons.length} in the data`);
    for (const family of families) if (family.count !== family.moons.length) throw new Error(`${family.family}: count ${family.count} but ${family.moons.length} listed`);
    detail.moonFamilies = Object.fromEntries(families.map((family) => [family.family, family.count]));
  });
};

/** The home page opens every real experience (T-074): each address the owner's portfolio embeds (O-020 Decision 5) is a link on it. */
const THREE_ADDRESSES = DEMO_ADDRESSES;
const indexChecks = async (page, check, detail) => {
  await siteChecks(page, check, detail);
  await check("home page links all three experience addresses", async () => {
    const hrefs = await ui.homeDemoLinks(page);
    const missing = THREE_ADDRESSES.filter((address) => !hrefs.includes(address));
    if (missing.length > 0) throw new Error(`the home page does not link ${missing.join(", ")}`);
    const broken = await ui.homeBrokenPictures(page);
    if (broken.length > 0) throw new Error(`card pictures did not load: ${broken.join(", ")}`);
    detail.demoLinks = hrefs;
  });
};

try {
  console.log(`lite browser check: ${experiences.length} experiences (${experiences.map((e) => e.id).join(", ")}) + 2 site pages, ${VIEWPORTS.length} sizes`);
  for (const experience of experiences) {
    for (const size of VIEWPORTS) await load(experience.id, `${appUrl}${experience.query}`, size, experienceChecks(experience));
  }
  for (const page of ["index.html", "assets.html"]) {
    for (const size of VIEWPORTS) await load(page.replace(/\.html$/, "-page"), siteUrl(page), size, page === "index.html" ? indexChecks : assetsChecks);
  }
} finally {
  await browser.close();
}

const failed = results.filter((result) => !result.ok);
writeFileSync(`${outDir}/results.json`, JSON.stringify({ tier: "lite (I-033)", at: new Date().toISOString(), appUrl, experiences: experiences.map((e) => e.id), loads: results.length, failed: failed.length, results }, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} loads passed; results in ${outDir}`);
if (failed.length > 0) {
  console.log("FAILED:");
  for (const result of failed) console.log(`  ${result.label} ${result.size}: ${result.failures.join(" | ")}`);
  process.exit(1);
}
