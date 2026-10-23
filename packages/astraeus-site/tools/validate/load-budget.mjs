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
const APP_SHARED = ["app.html", "app.js", "app.css", "catalogueItem.js", "hyg-v42-naked-eye.json", "elementsBody.js", "timeScale.js"];
/** Shared chunks the dev-free production build splits out but the public build folds into their importers; listed when present, not required (2026-10-20). */
const SPLIT_CHUNKS = new Set(["ephemerisProvenance.js", "elementsBody.js", "timeScale.js", "bodyMetrics.js", "events.js", "spacecraftMetrics.js", "listedOrbitGroup.js", "orbitGroup.js", "settingsFields.js"]);
const VIEW_LIMITS = JSON.parse(readFileSync(join(root, "packages", "astraeus-demo-planets", "src", "experiences", "planets", "viewLimits.json"), "utf8"));
const PLANET_TEXTURES = ["earth-bmng-july-4k.jpg", "jupiter-2k.jpg"];
const SHOWER_COMMON = ["showerDefinition.js", "compositions.js", "bodyMetrics.js", "events.js", "listedOrbitGroup.js", "orbitGroup.js", "showerSettings.js", "settingsFields.js", "measuredOrbits.js", "ephemerisProvenance.js", "planetModels.js", "mars-2k.jpg", "mercury-2k.jpg", "venus-2k-balanced.jpg", "sun-2k.jpg", ...PLANET_TEXTURES];

/** One planet's view of the planets experience (T-121): the shared page, the planet's own settings/system scripts, its moon index when it has moons, and its pictures. The fit chunks (.bin) the system script names by URL count too. */
const planetView = (name, textures, { moons = true, parts = false, ...limits }) => ({
  planet: name,
  id: `app.html?experience=planets&planet=${name}`,
  files: [...APP_SHARED, "planetSettings.js", "settingsFields.js", "planetDefinition.js", "moonCatalogue.js", "compositions.js", "planetModels.js", ...(parts ? ["planetSystemParts.js"] : []), `${name}.js`, ...(moons ? [`${name}-moons.js`] : []), ...textures],
  namedBy: [`${name}.js`],
  ...(VIEW_LIMITS[name] ? { indexLimit: VIEW_LIMITS[name].indexRawBytes } : {}),
  ...limits,
});

/**
 * One limit per page set, in bytes, raw and gzipped. Each is the measurement of 2026-10-17 (lossless stream trim; textures kept at their original quality by owner decision; the index page and the whole build re-measured with the three new demo-card pictures, T-074) plus 5% headroom, rounded up to the next 10,000 bytes.
 * The four app pages and the whole build were re-measured 2026-10-20 after planets became curve fits (T-101; planetModels shrank 6.5x), plus 5%, rounded up to the next 10,000 bytes (owner decision). The page sets also list the shared chunks the build now splits out (elementsBody, timeScale, bodyMetrics, events, orbitGroup, listedOrbitGroup, spacecraftMetrics).
 * The Apollo and showers sets also list `compositions.js`, the chunk split out when the planets experience shared it (T-121).
 * A change that makes a page heavier must raise its limit here on purpose, in the same change, with the new measurement.
 */
const ALL_PAGES = [
  // T-120 (O-033): index.html measured 399,236 B raw / 352,149 B gzip (14 files) on 2026-10-21, against 410,463 / 367,851 (13 files) before: the four new planet thumbnails (36,448 B) replace the Moon and Io ones, so the page got lighter and the standing limit is left as it was.
  { id: "index.html", files: [], htmlPage: "index.html", rawLimit: 600_000, gzipLimit: 530_000 },
  // T-120 (O-033), raised on purpose: assets.html grew from the old limit to 629,684 B raw / 493,085 B gzip (22 files) measured 2026-10-21 with its 13 new body thumbnails (site/t-*.jpg, about 300 KB, lazy-loaded), the generated moon lists for five planets (343 moons) and the tagged-places list (403 places). New limit: that measurement plus 5%, rounded up to the next 10,000 bytes.
  { id: "assets.html", files: [], htmlPage: "assets.html", rawLimit: 670_000, gzipLimit: 520_000 },
  // T-165 (O-040): the API reference, one static page with inline style and no script; about 25 KB raw, limit rounded up generously for the page to grow with each Objective's exports.
  { id: "api/index.html", files: [], htmlPage: "api/index.html", rawLimit: 100_000, gzipLimit: 30_000 },
  { id: "app.html (Apollo 11)", files: [...APP_SHARED, "panels.js", "apollo11Definition.js", "compositions.js", "bodyMetrics.js", "events.js", "spacecraftMetrics.js", "ephemerisProvenance.js", "moon-lroc-2k.jpg", "earth-bmng-july-4k.jpg"], rawLimit: 4_370_000, gzipLimit: 2_900_000 },
  // T-098: Jupiter's moons. The other three mapped moons' pictures, the curve-fit index (jupiter-moons.js) and the window's year of fit chunks
  // (2016.bin: the larger files; the smaller ones are inlined in jupiterIo.js), and the 2014 and 2015 chunks of the slow moons whose orbit lines reach back that far. Re-measured 2026-10-20 after planets became curve fits (T-101), plus 5% (owner decision).
  // O-033 T-121: the planets experience, one page set per planet view (the old jupiter-io address opens Jupiter's). Figures measured on the public build of 2026-10-21 plus 5%, rounded up to the next 10,000 bytes.
  // Each outer planet's moon index chunk is also held to the stated limit in `src/experiences/planets/viewLimits.json`, the file tests/planetSystems.test.ts takes its fit-chunk and index limits from.
  planetView("jupiter", ["jupiter-2k.jpg", "io-2k.jpg", "europa-2k.jpg", "ganymede-2k.jpg", "callisto-2k.jpg"], { rawLimit: 7_130_000, gzipLimit: 4_900_000 }),
  planetView("saturn", ["saturn-2k.jpg", "mimas-4k.jpg", "enceladus-4k.jpg", "tethys-4k.jpg", "dione-4k.jpg", "rhea-4k.jpg", "titan-4k.jpg", "iapetus-4k.jpg"], { parts: true, rawLimit: 24_490_000, gzipLimit: 21_260_000 }),
  planetView("uranus", ["uranus-2k.jpg"], { parts: true, rawLimit: 4_300_000, gzipLimit: 2_520_000 }),
  planetView("neptune", ["neptune-2k.jpg", "triton-4k.jpg"], { parts: true, rawLimit: 4_610_000, gzipLimit: 2_930_000 }),
  planetView("pluto", ["pluto-4k.jpg", "charon-2k.jpg"], { parts: true, rawLimit: 4_020_000, gzipLimit: 2_410_000 }),
  planetView("mercury", ["mercury-2k.jpg"], { moons: false, rawLimit: 3_080_000, gzipLimit: 1_710_000 }),
  // T-141 (O-039, I-068), re-measured 2026-10-22 on a local build: the Venus view is the one page that opts in to desktop texture variants (`desktopTextures` on the planets definition), so a desktop window fetches `venus-8k-balanced.jpg` (14,474,577 B) instead of the 2k file (1,090,552 B).
  // The set lists the 8k file, the heavier case: 16,543,654 B raw / 15,185,633 B gzip, plus 5%, rounded up to the next 10,000 bytes. A window under 768 px fetches the 2k file instead: 3,159,629 B raw / 1,848,065 B gzip (the earlier limit, 3,100,000 / 1,730,000, was already below that).
  planetView("venus", ["venus-8k-balanced.jpg"], { moons: false, rawLimit: 17_380_000, gzipLimit: 15_950_000 }),
  planetView("earth", ["earth-bmng-july-4k.jpg", "moon-lroc-2k.jpg"], { moons: false, rawLimit: 4_420_000, gzipLimit: 3_030_000 }),
  planetView("mars", ["mars-2k.jpg"], { rawLimit: 2_930_000, gzipLimit: 1_520_000 }),
  // T-152 (O-030): the showers pages list only the chosen shower's panels chunk (`storyPanels`), not every story's. perseids page 9,965,936 B raw / 6,995,644 B gzip (24 files) before, 9,944,191 / 6,987,339 (20 files) after; geminids page 12,450,409 / 7,801,854 before, 12,430,767 / 7,794,282 after (public build, 2026-10-23). Limits lowered by the saving, rounded up to the next 10,000 bytes.
  { id: "app.html?experience=showers", files: [...APP_SHARED, ...SHOWER_COMMON, "gmn-iau-7.json"], storyPanels: "perseids", rawLimit: 10_070_000, gzipLimit: 7_040_000 },
  { id: "app.html?experience=showers&shower=geminids", files: [...APP_SHARED, ...SHOWER_COMMON, "gmn-iau-4.json"], storyPanels: "geminids", rawLimit: 12_680_000, gzipLimit: 7_890_000 },
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
// T-098 raised it for the Jupiter moons; T-121 (O-033) raised it on purpose for the nine planet views' pictures (the outer planets' 4k moon maps) and fit chunks: re-measured 2026-10-21 on the public build, plus 5%, rounded up to the next 10,000 bytes.
export const BUILD_LIMIT = { id: "whole build", rawLimit: 54_610_000, gzipLimit: 44_130_000 };

function* walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}
const relativeTo = (distDir, path) => path.slice(distDir.length + 1).split("\\").join("/");

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
function stemPageFiles(distDir, names, page, problems) {
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
function checkPage(distDir, names, page) {
  const problems = [];
  const files = page.htmlPage !== undefined ? htmlPageFiles(distDir, names, page, problems) : stemPageFiles(distDir, names, page, problems);
  const sizes = sizesOf(distDir, files);
  if (sizes.raw > page.rawLimit) problems.push(`${sizes.raw} bytes raw is over the limit of ${page.rawLimit}`);
  if (sizes.gzip > page.gzipLimit) problems.push(`${sizes.gzip} bytes gzipped is over the limit of ${page.gzipLimit}`);
  if (page.indexLimit !== undefined) problems.push(...moonIndexProblems(distDir, names, page, files));
  return { id: page.id, ...sizes, rawLimit: page.rawLimit, gzipLimit: page.gzipLimit, problems };
}

/**
 * Measures every page set of a build and compares it with its limit. Returns { ok, pages: [{ id, files, raw, gzip, rawLimit, gzipLimit, problems }], problems }.
 * `pages` and `buildLimit` default to the real table; tests pass their own.
 */
export function checkLoadBudget({ distDir, pages = PAGES, buildLimit = BUILD_LIMIT }) {
  const names = [...walk(distDir)].map((path) => relativeTo(distDir, path));
  const results = pages.map((page) => checkPage(distDir, names, page));
  const whole = sizesOf(distDir, names);
  const wholeProblems = [];
  if (whole.raw > buildLimit.rawLimit) wholeProblems.push(`${whole.raw} bytes raw is over the limit of ${buildLimit.rawLimit}`);
  if (whole.gzip > buildLimit.gzipLimit) wholeProblems.push(`${whole.gzip} bytes gzipped is over the limit of ${buildLimit.gzipLimit}`);
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
    const make = (name, change = () => {}) => {
      const dir = join(temp, name);
      mkdirSync(join(dir, "assets"), { recursive: true });
      writeFileSync(join(dir, "app.html"), "<html></html>");
      writeFileSync(join(dir, "assets", "app-AbCdEf12.js"), "export const a = 1;");
      writeFileSync(join(dir, "assets", "picture-AbCdEf12.jpg"), noise(3_000));
      change(dir);
      return checkLoadBudget({ distDir: dir, pages, buildLimit });
    };
    return {
      within: make("within"),
      heavier: make("heavier", (dir) => writeFileSync(join(dir, "assets", "picture-AbCdEf12.jpg"), noise(7_000))),
      missing: make("missing", (dir) => rmSync(join(dir, "assets", "picture-AbCdEf12.jpg"))),
      unlistedImport: make("unlisted-import", (dir) => {
        writeFileSync(join(dir, "assets", "app-AbCdEf12.js"), 'import"./extra-AbCdEf12.js";');
        writeFileSync(join(dir, "assets", "extra-AbCdEf12.js"), "export const b = 2;");
      }),
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
    const check = (files) => checkLoadBudget({ distDir: dir, pages: [{ id: "page", files, ...limits }], buildLimit: { id: "whole build", ...limits } }).pages[0];
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
  for (const page of result.pages) console.log(`${page.problems.length === 0 ? "ok  " : "FAIL"} ${page.id}: ${page.files} files, ${page.raw} B raw (limit ${page.rawLimit}), ${page.gzip} B gzip (limit ${page.gzipLimit})${page.problems.map((problem) => `\n       ${problem}`).join("")}`);
  if (!result.ok) process.exit(1);
}
