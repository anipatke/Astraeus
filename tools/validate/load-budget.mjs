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

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** The app page, its script and style, and what every experience loads: the sky stars. Each entry is `<stem>.<ext>` of a hashed file in assets/, or a page at the top. */
const APP_SHARED = ["app.html", "app.js", "app.css", "catalogueItem.js", "hyg-v42-naked-eye.json"];
const PLANET_TEXTURES = ["earth-bmng-july-4k.jpg", "jupiter-2k.jpg"];
const SHOWER_COMMON = ["showerDefinition.js", "showerSettings.js", "measuredOrbits.js", "panels.js", "ephemerisProvenance.js", "planetModels.js", "mars-2k.jpg", "mercury-2k.jpg", "venus-2k.jpg", "sun-2k.jpg", ...PLANET_TEXTURES];

/**
 * One limit per page set, in bytes, raw and gzipped. Each is the measurement of 2026-10-17 (lossless stream trim; textures kept at their original quality by owner decision; the index page and the whole build re-measured with the three new demo-card pictures, T-074) plus 5% headroom, rounded up to the next 10,000 bytes.
 * A change that makes a page heavier must raise its limit here on purpose, in the same change, with the new measurement.
 */
export const PAGES = [
  { id: "index.html", files: [], htmlPage: "index.html", rawLimit: 600_000, gzipLimit: 530_000 },
  { id: "assets.html", files: [], htmlPage: "assets.html", rawLimit: 274_000, gzipLimit: 240_000 },
  { id: "app.html (Apollo 11)", files: [...APP_SHARED, "panels.js", "apollo11Definition.js", "ephemerisProvenance.js", "moon-lroc-2k.jpg", "earth-bmng-july-4k.jpg"], rawLimit: 4_250_000, gzipLimit: 2_860_000 },
  // T-098: Jupiter's moons. The other three mapped moons' pictures, the curve-fit index (jupiter-moons.js) and the window's year of fit chunks
  // (2016.bin: the larger files; the smaller ones are inlined in jupiterIo.js), and the 2014 and 2015 chunks of the slow moons whose orbit lines reach back that far. Measured 2026-10-18 on the public build plus 5%.
  { id: "app.html?experience=jupiter-io", files: [...APP_SHARED, "panels.js", "jupiterIo.js", "planetModels.js", "io-2k.jpg", "jupiter-2k.jpg", "europa-2k.jpg", "ganymede-2k.jpg", "callisto-2k.jpg", "jupiter-moons.js"], fetchedFiles: ["2016.bin", "2014.bin", "2015.bin"], rawLimit: 8_110_000, gzipLimit: 5_220_000 },
  { id: "app.html?experience=showers", files: [...APP_SHARED, ...SHOWER_COMMON, "gmn-iau-7.json"], rawLimit: 11_190_000, gzipLimit: 7_430_000 },
  { id: "app.html?experience=showers&shower=geminids", files: [...APP_SHARED, ...SHOWER_COMMON, "gmn-iau-4.json"], rawLimit: 13_790_000, gzipLimit: 8_280_000 },
];
/** Every file of the build together (also the net for a file no page set lists). */
// T-098 raised it for the Jupiter moons (three moon pictures, the fit index and the 2016 fit chunks): measured 2026-10-18 plus 5%.
export const BUILD_LIMIT = { id: "whole build", rawLimit: 25_700_000, gzipLimit: 17_410_000 };

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

/**
 * Measures every page set of a build and compares it with its limit. Returns { ok, pages: [{ id, files, raw, gzip, rawLimit, gzipLimit, problems }], problems }.
 * `pages` and `buildLimit` default to the real table; tests pass their own.
 */
export function checkLoadBudget({ distDir, pages = PAGES, buildLimit = BUILD_LIMIT }) {
  const names = [...walk(distDir)].map((path) => relativeTo(distDir, path));
  const results = [];
  for (const page of pages) {
    const problems = [];
    let files = [];
    if (page.htmlPage !== undefined) {
      if (names.includes(page.htmlPage)) files = siteFiles(distDir, names, page.htmlPage);
      else problems.push(`${page.htmlPage} is not in the build`);
    } else {
      // A stem that names one file lists it. A stem that names several (same-named modules split per importer) lists only those a listed
      // script imports at load, followed through the chain: the page fetches those and no others, and an unrelated new chunk still fails.
      const several = new Set();
      const severalEntries = [];
      for (const entry of page.files) {
        const found = findFiles(names, entry);
        if (found.length === 0) problems.push(`${entry} is not in the build (the page set is out of date)`);
        else if (found.length === 1) files.push(found[0]);
        else { severalEntries.push([entry, found]); for (const name of found) several.add(name); }
      }
      for (let queue = files.filter((name) => name.endsWith(".js")); queue.length > 0;) {
        const next = [];
        for (const file of queue) {
          for (const imported of staticImportsOf(readFileSync(join(distDir, file), "latin1"))) {
            if (several.has(imported) && !files.includes(imported)) { files.push(imported); next.push(imported); }
          }
        }
        queue = next;
      }
      // Files the page fetches by URL rather than imports (a window's curve-fit chunks): every file with the stem counts.
      for (const entry of page.fetchedFiles ?? []) {
        const found = findFiles(names, entry);
        if (found.length === 0) problems.push(`${entry} is not in the build (the page set is out of date)`);
        files.push(...found.filter((name) => !files.includes(name)));
      }
      for (const [entry, found] of severalEntries) {
        if (!found.some((name) => files.includes(name))) problems.push(`${entry} names ${found.length} files, none of which a listed script imports (the page set is out of date)`);
      }
      files = [...new Set(files)];
      const listed = new Set(files);
      for (const file of files.filter((name) => name.endsWith(".js"))) {
        for (const imported of staticImportsOf(readFileSync(join(distDir, file), "latin1"))) {
          if (!listed.has(imported)) problems.push(`${file} imports ${imported}, which the page set does not list`);
        }
      }
    }
    const sizes = sizesOf(distDir, files);
    if (sizes.raw > page.rawLimit) problems.push(`${sizes.raw} bytes raw is over the limit of ${page.rawLimit}`);
    if (sizes.gzip > page.gzipLimit) problems.push(`${sizes.gzip} bytes gzipped is over the limit of ${page.gzipLimit}`);
    results.push({ id: page.id, ...sizes, rawLimit: page.rawLimit, gzipLimit: page.gzipLimit, problems });
  }
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
