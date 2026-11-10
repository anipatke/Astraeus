// First-load size budget of the public build (O-017 T-070): the files each page downloads, measured raw and gzipped, against one limit per page.
//   node tools/validate/load-budget.mjs [distDir]      prints each page's bytes and limit; exits 1 if any page is over its limit
// public-build-assets.mjs runs the same check on every public build. The page sets below are the files a browser fetched in headless Chromium on the
// public build (docs/evidence/o017-t070-*/first-load-*.json); the check keeps them honest: a listed file that is not in the build, or a static import of a
// listed script that is not listed, fails, so an eager new chunk cannot slip past the limit. Pictures an experience draws are listed with it.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

// The repository root (this file is packages/astraeus-site/tools/validate/).
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");

/** The app page, its script and style, and what every experience loads: the sky stars. Each entry is `<stem>.<ext>` of a hashed file in assets/, or a page at the top. */
const APP_SHARED = ["app.html", "app.js", "app.css", "preload-helper.js", "hyg-v42-naked-eye.json", "elementsBody.js", "timeScale.js", "licence.js"];
/** Shared chunks the dev-free production build splits out but the public build folds into their importers; listed when present, not required (2026-10-20). */
const SPLIT_CHUNKS = new Set(["preload-helper.js", "ephemerisProvenance.js", "elementsBody.js", "timeScale.js", "bodyMetrics.js", "events.js", "trackedMetrics.js", "listedOrbitGroup.js", "orbitGroup.js", "settingsFields.js", "licence.js", "moonFamilies.js", "planetSystemParts.js"]);
const VIEW_LIMITS = JSON.parse(readFileSync(join(root, "packages", "astraeus-demo-planets", "src", "experiences", "planets", "viewLimits.json"), "utf8"));
const PLANET_TEXTURES = ["earth-bmng-july-4k.jpg", "jupiter-2k.jpg"];
const SHOWER_COMMON = ["showerScene.js", "scene.js", "bodyMetrics.js", "events.js", "listedOrbitGroup.js", "orbitGroup.js", "showerSettings.js", "measuredOrbits.js", "ephemerisProvenance.js", "planetModels.js", "mars-2k.jpg", "mercury-2k.jpg", "venus-2k-balanced.jpg", "sun-2k.jpg", ...PLANET_TEXTURES];

/** One planet's view of the planets experience (T-121): the shared page, the planet's own settings/system scripts, its moon index when it has moons, and its pictures. The fit chunks (.bin) the system script names by URL count too. */
const planetView = (name, textures, { moons = true, ...limits }) => ({
  planet: name,
  id: `app.html?experience=planets&planet=${name}`,
  files: [...APP_SHARED, "planetSettings.js", "planetScene.js", "moonFamilies.js", "events.js", "moonList.js", "planetModels.js", "planetSystemParts.js", `${name}.js`, ...(moons ? [`${name}-moons.js`] : []), ...textures],
  namedBy: [`${name}.js`],
  ...(VIEW_LIMITS[name] ? { indexLimit: VIEW_LIMITS[name].indexRawBytes } : {}),
  ...limits,
});

/**
 * One limit per page set, in bytes, raw and gzipped, on the page's OWN share: its first load less the engine's share of it (`engineShareOf`; the engine has its own limit in `engine-budget.mjs`), so engine growth never trips a demo.
 * App-page limits: the page's own share measured on the public build of 2026-11-01 (the engine's share from `engine-share.json`) plus 5%, rounded up to the next 10,000 bytes (owner decision, O-051 T-221: split engine and demo limits). The planet views the public build omits were measured the same way on a local build (their page sets are not held against a public build).
 * The site pages (index, assets, API) contain no engine code and keep their standing limits. A change that makes a page's own share heavier must raise its limit here on purpose, in the same change, with the new measurement.
 */
export const ALL_PAGES = [
  { id: "index.html", files: [], htmlPage: "index.html", rawLimit: 600_000, gzipLimit: 530_000 },
  { id: "assets.html", files: [], htmlPage: "assets.html", rawLimit: 670_000, gzipLimit: 520_000 },
  // I-142: the API reference text grows with the documented API (118,927 B raw, 26,894 B gzip after O-056), and the compressed size is what a visitor downloads, so the raw limit was raised and the gzip limit kept (owner decision, 2026-11-03); raw raised again to 200,000 B for the O-059 public forms (owner, 2026-11-07). tests/apiReference.test.ts holds the generated page to these limits.
  { id: "api/index.html", files: [], htmlPage: "api/index.html", rawLimit: 200_000, gzipLimit: 44_000 }, // gzip 40,000 -> 44,000: owner 2026-11-10 ("Raise to 44 KB"), room for the rest of 0.9.0 (O-065 T-296)
  { id: "app.html (Apollo 11)", files: [...APP_SHARED, "panels.js", "apollo11Scene.js", "scene.js", "bodyMetrics.js", "events.js", "trackedMetrics.js", "ephemerisProvenance.js", "moon-lroc-2k.jpg", "earth-bmng-july-4k.jpg"], rawLimit: 4_240_000, gzipLimit: 2_850_000 },
  // T-098: Jupiter's moons. The other three mapped moons' pictures, the curve-fit index (jupiter-moons.js) and the window's year of fit chunks
  // (2016.bin: the larger files; the smaller ones are inlined in jupiterIo.js), and the 2014 and 2015 chunks of the slow moons whose orbit lines reach back that far.
  // O-033 T-121: the planets experience, one page set per planet view (the old jupiter-io address opens Jupiter's).
  // Each outer planet's moon index chunk is also held to the stated limit in `src/experiences/planets/viewLimits.json`, the file tests/planetSystems.test.ts takes its fit-chunk and index limits from.
  planetView("jupiter", ["jupiter-2k.jpg", "io-2k.jpg", "europa-2k.jpg", "ganymede-2k.jpg", "callisto-2k.jpg"], { rawLimit: 6_570_000, gzipLimit: 4_560_000 }),
  planetView("saturn", ["saturn-2k.jpg", "mimas-4k.jpg", "enceladus-4k.jpg", "tethys-4k.jpg", "dione-4k.jpg", "rhea-4k.jpg", "titan-4k.jpg", "iapetus-4k.jpg"], { rawLimit: 23_510_000, gzipLimit: 20_570_000 }),
  planetView("uranus", ["uranus-2k.jpg"], { rawLimit: 3_510_000, gzipLimit: 2_030_000 }),
  planetView("neptune", ["neptune-2k.jpg", "triton-4k.jpg"], { rawLimit: 4_000_000, gzipLimit: 2_630_000 }),
  planetView("pluto", ["pluto-4k.jpg", "charon-2k.jpg"], { rawLimit: 3_350_000, gzipLimit: 2_100_000 }),
  planetView("mercury", ["mercury-2k.jpg"], { moons: false, rawLimit: 2_580_000, gzipLimit: 1_420_000 }),
  // T-141 (O-039, I-068): the Venus view is the one page that opts in to desktop texture variants (`desktopTextures`), so a desktop window fetches `venus-8k-balanced.jpg` (14,474,577 B) instead of the 2k file (1,090,552 B); the set lists the 8k file, the heavier case.
  planetView("venus", ["venus-8k-balanced.jpg"], { moons: false, rawLimit: 16_860_000, gzipLimit: 15_650_000 }),
  planetView("earth", ["earth-bmng-july-4k.jpg", "moon-lroc-2k.jpg"], { moons: false, rawLimit: 3_890_000, gzipLimit: 2_730_000 }),
  planetView("mars", ["mars-2k.jpg"], { rawLimit: 2_420_000, gzipLimit: 1_230_000 }),
  // The showers pages list only the chosen shower's panels chunk (`storyPanels`), not every story's (T-152).
  { id: "app.html?experience=showers", files: [...APP_SHARED, ...SHOWER_COMMON, "gmn-iau-7.json"], storyPanels: "perseids", rawLimit: 8_970_000, gzipLimit: 6_760_000 },
  { id: "app.html?experience=showers&shower=geminids", files: [...APP_SHARED, ...SHOWER_COMMON, "gmn-iau-4.json"], storyPanels: "geminids", rawLimit: 10_630_000, gzipLimit: 7_340_000 },
];
/**
 * The planets a public build offers: Jupiter alone (owner, 2026-10-22; T-136). The other eight planet views exist only in a local build, so their page sets
 * (still listed above, with their limits) are not held against a public build, which this check runs on.
 */
export const PUBLIC_PLANETS = ["jupiter"];
/** The files only a local build's other planet views list (their maps and system chunks), by stem as the page sets name them; a public build must hold none (T-136). */
export const NON_PUBLIC_PLANET_FILES = (() => {
  const wanted = new Set(ALL_PAGES.filter((page) => page.planet !== undefined && !PUBLIC_PLANETS.includes(page.planet)).flatMap((page) => page.files));
  for (const page of ALL_PAGES) if (page.planet === undefined || PUBLIC_PLANETS.includes(page.planet)) for (const file of page.files) wanted.delete(file);
  // Left out of the list on purpose: the `<planet>-moons.js` indexes (core body records lazy-load them, so they stay in the build but are never fetched) and the inner planets' maps (the catalogue keeps those bodies).
  return [...wanted].filter((file) => /\.(jpg|js|bin)$/.test(file) && !/-moons\.js$/.test(file) && !["mars-2k.jpg", "mercury-2k.jpg", "venus-2k.jpg"].includes(file));
})();
export const PAGES = ALL_PAGES.filter((page) => page.planet === undefined || PUBLIC_PLANETS.includes(page.planet));
/** Every file of the build together (also the net for a file no page set lists). */
// Measured 2026-10-21 on the public build, plus 5%, rounded up to the next 10,000 bytes; the whole build includes the engine, which has ample room here.
export const BUILD_LIMIT = { id: "whole build", rawLimit: 54_610_000, gzipLimit: 44_130_000 };

function* walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}
const relativeTo = (distDir, path) => path.slice(distDir.length + 1).split("\\").join("/");

/** The sidecar the browser check's public build writes (`ASTRAEUS_ENGINE_SHARE=1`, vite.config.ts): per script chunk, the rendered bytes from the engine package and in all. Not part of any page. */
export const ENGINE_SHARE_FILE = "engine-share.json";

/** The engine-share table of a build, or undefined when the build was made without it. */
export function readEngineShares(distDir) {
  const file = join(distDir, ENGINE_SHARE_FILE);
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : undefined;
}

/**
 * The engine's share of a set of built files: each script chunk's raw and gzip size scaled by the ratio of its rendered bytes that come from the engine package (chunk-level, so a chunk that
 * mixes engine and demo code counts in proportion). Pictures, data and chunks the table does not name count as the page's own.
 */
function engineShareOf(distDir, files, shares) {
  let raw = 0;
  let gzip = 0;
  for (const file of files) {
    const entry = shares?.[file];
    if (entry === undefined || entry.total === 0 || entry.engine === 0) continue;
    const bytes = readFileSync(join(distDir, file));
    raw += (bytes.length * entry.engine) / entry.total;
    gzip += (gzipSync(bytes).length * entry.engine) / entry.total;
  }
  return { raw: Math.round(raw), gzip: Math.round(gzip) };
}

/** The built file for a `<stem>.<ext>` entry: assets/<stem>-<8 hash characters>.<ext>, or the page itself. Undefined when the build has none. */
/** Every hashed file in the build whose stem is the entry's (several when the bundler splits same-named modules, e.g. one `panels` chunk per story). */
function findFiles(names, entry) {
  if (entry.endsWith(".html")) return names.includes(entry) ? [entry] : [];
  const dot = entry.lastIndexOf(".");
  const pattern = new RegExp(`^assets/${entry.slice(0, dot).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-[A-Za-z0-9_-]{8}\\.${entry.slice(dot + 1)}$`);
  return names.filter((name) => pattern.test(name));
}

/** The assets/ files a site page names, and the ones those name in turn (a script or style it loads): the most a visitor can download, lazy pictures included. */
function siteFiles(distDir, names, page) {
  const found = new Set([page]);
  const queue = [page];
  while (queue.length > 0) {
    const text = readFileSync(join(distDir, queue.pop()), "latin1");
    for (const match of text.matchAll(/\/?(assets\/[A-Za-z0-9_.-]+)/g)) {
      if (names.includes(match[1]) && !found.has(match[1])) {
        found.add(match[1]);
        if (/\.(js|css)$/.test(match[1])) queue.push(match[1]);
      }
    }
  }
  return [...found];
}

/** The scripts a built script imports at load (not the dynamic `import(...)`): the names of their files. */
export const staticImportsOf = (text) => [...text.matchAll(/(?:\bfrom|\bimport)\s*["']\.\/([A-Za-z0-9_.-]+\.js)["']/g)].map((match) => `assets/${match[1]}`);

const sizesOf = (distDir, files) => {
  let raw = 0;
  let gzip = 0;
  for (const file of files) {
    const bytes = readFileSync(join(distDir, file));
    raw += bytes.length;
    gzip += gzipSync(bytes).length;
  }
  return { files: files.length, raw, gzip };
};

/** The files of a page set that lists an HTML page: the site files of that page, or a problem when it is not in the build. */
function htmlPageFiles(distDir, names, page, problems) {
  if (names.includes(page.htmlPage)) return siteFiles(distDir, names, page.htmlPage);
  problems.push(`${page.htmlPage} is not in the build`);
  return [];
}

/** Adds to `files` the chunks of a stem that names several files, when a listed script imports them at load, followed through the chain. */
function followSplitChunks(distDir, files, several) {
  for (let queue = files.filter((name) => name.endsWith(".js")); queue.length > 0;) {
    const next = [];
    for (const file of queue) {
      for (const imported of staticImportsOf(readFileSync(join(distDir, file), "latin1"))) {
        if (several.has(imported) && !files.includes(imported)) { files.push(imported); next.push(imported); }
      }
    }
    queue = next;
  }
}

/** Files the page fetches by URL rather than imports (a window's curve-fit chunks): every file with the stem counts. */
function addFetchedFiles(names, page, files, problems) {
  for (const entry of page.fetchedFiles ?? []) {
    const found = findFiles(names, entry);
    if (found.length === 0) problems.push(`${entry} is not in the build (the page set is out of date)`);
    files.push(...found.filter((name) => !files.includes(name)));
  }
}

/** Files a listed script names by URL (the fit chunks and pictures a planet's system script ships): every one of them counts. */
function addNamedFiles(distDir, names, page, files) {
  for (const entry of page.namedBy ?? []) {
    for (const script of findFiles(names, entry)) {
      for (const match of readFileSync(join(distDir, script), "latin1").matchAll(/\/?(assets\/[A-Za-z0-9_.-]+)/g)) {
        if (names.includes(match[1]) && !files.includes(match[1])) files.push(match[1]);
      }
    }
  }
}

/** The one panels chunk a page's story fetches (T-152): the app script's lazy lookup maps `data/stories/<story>/panels.json` to its hashed chunk; only the chosen story's counts. */
function addStoryPanels(distDir, names, page, files, problems) {
  if (page.storyPanels === undefined) return;
  for (const app of findFiles(names, "app.js")) {
    const match = readFileSync(join(distDir, app), "latin1").match(new RegExp(`stories/${page.storyPanels}/panels\\.json":\\(\\)=>[^\`]*\`\\./(panels-[A-Za-z0-9_-]{8}\\.js)\``));
    if (match !== null && !files.includes(`assets/${match[1]}`)) { files.push(`assets/${match[1]}`); return; }
  }
  problems.push(`the app script names no panels chunk for the story "${page.storyPanels}" (the page set is out of date)`);
}

/**
 * Adds to `files` the unlisted scripts a listed script imports at load that the engine-share table says are wholly engine code, followed through the chain (I-136). A refactor inside the engine
 * that only re-chunks it (a module moved so two importers share a new chunk) is then no page set's business: the chunk counts in the page's first load as engine share, and the engine
 * limit (engine-budget.mjs) holds engine growth. A chunk with any demo code, or one the table does not name, still has to be listed.
 */
function followEngineChunks(distDir, files, shares) {
  if (shares === undefined) return;
  for (let queue = files.filter((name) => name.endsWith(".js")); queue.length > 0;) {
    const next = [];
    for (const file of queue) {
      for (const imported of staticImportsOf(readFileSync(join(distDir, file), "latin1"))) {
        const entry = shares[imported];
        if (!files.includes(imported) && existsSync(join(distDir, imported)) && entry !== undefined && entry.total > 0 && entry.engine === entry.total) { files.push(imported); next.push(imported); }
      }
    }
    queue = next;
  }
}

/** A problem for every script in `files` that imports a script the page set does not list. */
function unlistedImportProblems(distDir, files) {
  const listed = new Set(files);
  const problems = [];
  for (const file of files.filter((name) => name.endsWith(".js"))) {
    for (const imported of staticImportsOf(readFileSync(join(distDir, file), "latin1"))) {
      if (!listed.has(imported)) problems.push(`${file} imports ${imported}, which the page set does not list`);
    }
  }
  return problems;
}

/**
 * The files of a page set that lists stems. A stem that names one file lists it. A stem that names several (same-named modules split per importer) lists only those a listed
 * script imports at load, followed through the chain: the page fetches those and no others, and an unrelated new chunk still fails.
 */
function stemPageFiles(distDir, names, page, problems, shares) {
  let files = [];
  const several = new Set();
  const severalEntries = [];
  for (const entry of page.files) {
    const found = findFiles(names, entry);
    if (found.length === 0) { if (!SPLIT_CHUNKS.has(entry)) problems.push(`${entry} is not in the build (the page set is out of date)`); }
    else if (found.length === 1) files.push(found[0]);
    else { severalEntries.push([entry, found]); for (const name of found) several.add(name); }
  }
  followSplitChunks(distDir, files, several);
  addFetchedFiles(names, page, files, problems);
  addNamedFiles(distDir, names, page, files);
  addStoryPanels(distDir, names, page, files, problems);
  for (const [entry, found] of severalEntries) {
    if (!found.some((name) => files.includes(name))) problems.push(`${entry} names ${found.length} files, none of which a listed script imports (the page set is out of date)`);
  }
  files = [...new Set(files)];
  followEngineChunks(distDir, files, shares);
  problems.push(...unlistedImportProblems(distDir, files));
  return files;
}

/** The moon index is one chunk of the build (its JSON as a script), so the stated index limit holds it too. The fit chunks' stated limit is held by tests/planetSystems.test.ts, which measures them as served (the build inlines the small ones as text, which is bigger). */
function moonIndexProblems(distDir, names, page, files) {
  const problems = [];
  for (const file of files.filter((name) => (page.namedBy ?? []).some((entry) => findFiles(names, entry.replace(/\.js$/, "-moons.js")).includes(name)))) {
    const bytes = statSync(join(distDir, file)).size;
    if (bytes > page.indexLimit) problems.push(`the moon index chunk is ${bytes} bytes, over the view's stated limit of ${page.indexLimit}`);
  }
  return problems;
}

/** The problems of one page set and its measured sizes. */
function checkPage(distDir, names, page, shares) {
  const problems = [];
  const files = page.htmlPage !== undefined ? htmlPageFiles(distDir, names, page, problems) : stemPageFiles(distDir, names, page, problems, shares);
  const sizes = sizesOf(distDir, files);
  // A page's limit holds what the page adds beyond the engine: its first load less the engine's share of it (the engine has its own limit, engine-budget.mjs).
  const engine = engineShareOf(distDir, files, shares);
  const own = { raw: sizes.raw - engine.raw, gzip: sizes.gzip - engine.gzip };
  const note = `(own share: ${sizes.raw} B in all less ${engine.raw} B engine)`;
  if (own.raw > page.rawLimit) problems.push(`${own.raw} bytes raw is over the limit of ${page.rawLimit} ${note}`);
  if (own.gzip > page.gzipLimit) problems.push(`${own.gzip} bytes gzipped is over the limit of ${page.gzipLimit} (own share: ${sizes.gzip} B in all less ${engine.gzip} B engine)`);
  if (page.indexLimit !== undefined) problems.push(...moonIndexProblems(distDir, names, page, files));
  return { id: page.id, ...sizes, engineRaw: engine.raw, engineGzip: engine.gzip, ownRaw: own.raw, ownGzip: own.gzip, rawLimit: page.rawLimit, gzipLimit: page.gzipLimit, problems };
}

/**
 * Measures every page set of a build and compares it with its limit. Returns { ok, pages: [{ id, files, raw, gzip, rawLimit, gzipLimit, problems }], problems }.
 * `pages` and `buildLimit` default to the real table; tests pass their own.
 */
export function checkLoadBudget({ distDir, pages = PAGES, buildLimit = BUILD_LIMIT, shares = readEngineShares(distDir), requireShares = true }) {
  const names = [...walk(distDir)].map((path) => relativeTo(distDir, path)).filter((name) => name !== ENGINE_SHARE_FILE);
  const results = pages.map((page) => checkPage(distDir, names, page, shares));
  const whole = sizesOf(distDir, names);
  const wholeProblems = [];
  if (whole.raw > buildLimit.rawLimit) wholeProblems.push(`${whole.raw} bytes raw is over the limit of ${buildLimit.rawLimit}`);
  if (whole.gzip > buildLimit.gzipLimit) wholeProblems.push(`${whole.gzip} bytes gzipped is over the limit of ${buildLimit.gzipLimit}`);
  if (requireShares && shares === undefined) wholeProblems.push(`${ENGINE_SHARE_FILE} is not in the build, so the engine's share of each page is unknown (build with ASTRAEUS_ENGINE_SHARE=1, as the browser check does)`);
  results.push({ id: buildLimit.id, ...whole, rawLimit: buildLimit.rawLimit, gzipLimit: buildLimit.gzipLimit, problems: wholeProblems });
  return { ok: results.every((result) => result.problems.length === 0), pages: results };
}

/**
 * Proves the budget can fail, on a made-up build and a made-up table: a build inside its limits passes; the same build with a heavier picture, with a listed
 * file removed, with a script that imports an unlisted script, and with a heavier file the page sets do not list (the whole-build limit) each fail.
 */
export function proveLoadBudgetFails() {
  const temp = mkdtempSync(join(tmpdir(), "astraeus-load-budget-"));
  try {
    // Noise does not gzip away, so the made-up sizes are what the limits see.
    const noise = (length) => Buffer.from(Array.from({ length }, (_, k) => (k * 2654435761 >>> 7) & 255));
    const pages = [{ id: "app", files: ["app.html", "app.js", "picture.jpg"], rawLimit: 6_000, gzipLimit: 6_000 }];
    const buildLimit = { id: "whole build", rawLimit: 9_000, gzipLimit: 9_000 };
    const make = (name, change = () => {}, shares = undefined) => {
      const dir = join(temp, name);
      mkdirSync(join(dir, "assets"), { recursive: true });
      writeFileSync(join(dir, "app.html"), "<html></html>");
      writeFileSync(join(dir, "assets", "app-AbCdEf12.js"), "export const a = 1;");
      writeFileSync(join(dir, "assets", "picture-AbCdEf12.jpg"), noise(3_000));
      change(dir);
      return checkLoadBudget({ distDir: dir, pages, buildLimit, shares, requireShares: false });
    };
    return {
      within: make("within"),
      heavier: make("heavier", (dir) => writeFileSync(join(dir, "assets", "picture-AbCdEf12.jpg"), noise(7_000))),
      missing: make("missing", (dir) => rmSync(join(dir, "assets", "picture-AbCdEf12.jpg"))),
      unlistedImport: make("unlisted-import", (dir) => {
        writeFileSync(join(dir, "assets", "app-AbCdEf12.js"), 'import"./extra-AbCdEf12.js";');
        writeFileSync(join(dir, "assets", "extra-AbCdEf12.js"), "export const b = 2;");
      }),
      engineChunk: make("engine-chunk", (dir) => {
        writeFileSync(join(dir, "assets", "app-AbCdEf12.js"), 'import"./extra-AbCdEf12.js";');
        writeFileSync(join(dir, "assets", "extra-AbCdEf12.js"), "export const b = 2;");
      }, { "assets/extra-AbCdEf12.js": { engine: 20, total: 20 } }),
      mixedChunk: make("mixed-chunk", (dir) => {
        writeFileSync(join(dir, "assets", "app-AbCdEf12.js"), 'import"./extra-AbCdEf12.js";');
        writeFileSync(join(dir, "assets", "extra-AbCdEf12.js"), "export const b = 2;");
      }, { "assets/extra-AbCdEf12.js": { engine: 10, total: 20 } }),
      unlistedFile: make("unlisted-file", (dir) => writeFileSync(join(dir, "assets", "extra-AbCdEf12.jpg"), noise(7_000))),
    };
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

/**
 * Made-up builds for a stem the bundler splits into several chunks (one `panels` chunk per story, T-089): a page set naming the stem once
 * admits exactly the chunks its scripts import, through a chain; leaving the stem out, or naming it where no listed script imports it, fails.
 */
export function proveSameStemChunks() {
  const dir = mkdtempSync(join(tmpdir(), "astraeus-same-stem-"));
  try {
    mkdirSync(join(dir, "assets"));
    writeFileSync(join(dir, "app.html"), "<html></html>");
    writeFileSync(join(dir, "assets", "first-AbCdEf12.js"), 'import"./panels-AAAAAAAA.js";');
    writeFileSync(join(dir, "assets", "second-AbCdEf12.js"), 'import"./panels-BBBBBBBB.js";');
    writeFileSync(join(dir, "assets", "panels-AAAAAAAA.js"), "export const a = 1;");
    writeFileSync(join(dir, "assets", "panels-BBBBBBBB.js"), 'import"./panels-CCCCCCCC.js";export const b = 2;');
    writeFileSync(join(dir, "assets", "panels-CCCCCCCC.js"), "export const c = 3;");
    writeFileSync(join(dir, "assets", "stray-AbCdEf12.js"), "export const d = 4;");
    const limits = { rawLimit: 100_000, gzipLimit: 100_000 };
    const check = (files) => checkLoadBudget({ distDir: dir, pages: [{ id: "page", files, ...limits }], buildLimit: { id: "whole build", ...limits }, requireShares: false }).pages[0];
    return {
      first: check(["app.html", "first.js", "panels.js"]),
      chained: check(["app.html", "second.js", "panels.js"]),
      stemLeftOut: check(["app.html", "first.js"]),
      notImported: check(["app.html", "stray.js", "panels.js"]),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const distDir = resolve(process.argv[2] ?? join(root, "dist"));
  if (!existsSync(distDir)) {
    console.error(`load-budget: ${distDir} does not exist`);
    process.exit(1);
  }
  const result = checkLoadBudget({ distDir });
  for (const page of result.pages) console.log(`${page.problems.length === 0 ? "ok  " : "FAIL"} ${page.id}: ${page.files} files, ${page.raw} B raw / ${page.gzip} B gzip in all, ${page.engineRaw ?? 0} / ${page.engineGzip ?? 0} from the engine, own ${page.ownRaw ?? page.raw} B raw (limit ${page.rawLimit}), ${page.ownGzip ?? page.gzip} B gzip (limit ${page.gzipLimit})${page.problems.map((problem) => `\n       ${problem}`).join("")}`);
  if (!result.ok) process.exit(1);
}
