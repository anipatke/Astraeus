// Public-build output gate (design C.3). Hashes every file under dist/ and fails if any matches a local-only source texture,
// byte for byte or embedded in a text asset as base64.
//   ASTRAEUS_PUBLIC_BUILD=1 npm run build && node tools/validate/public-build-assets.mjs [distDir] [resultsFile]
// It also fails a build that holds any made-up (synthetic) experience (T-068), and a build whose page loads outgrow their limits (tools/validate/load-budget.mjs, T-070).
// Local-only sources are the images a body record imports and declares `localOnly` (src/assets/bodies/*.ts), plus every file under the
// git-ignored data/local/ (fetched data and similar; except a file whose own provenance declares a shippable licence, the GMN's CC BY 4.0, which a story may ship from data/stories/): none of that content, and no path under data/local/, may be in the build.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkEngineLicences, gatherPackageCredits } from "../site/package-credits.mjs";
import { checkLoadBudget, NON_PUBLIC_PLANET_FILES, proveLoadBudgetFails, PUBLIC_PLANETS } from "./load-budget.mjs";

/** The site pages a public build must contain: the pitch page, its assets sub-page and the app. */
export const REQUIRED_PAGES = ["index.html", "assets.html", "app.html", "api/index.html"];
// The repository root (this file is packages/astraeus-site/tools/validate/). Sources sit in their packages: the engine's textures, stars and synthetic scenes, the Showers demo's data/local, the Planets demo's settings.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
/** The folder of package `name` under `rootDir`, or `rootDir` itself when it has no packages folder (the made-up roots the self-checks build). */
const packageDir = (rootDir, name) => (existsSync(join(rootDir, "packages", name)) ? join(rootDir, "packages", name) : rootDir);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const TEXT_EXTENSIONS = /\.(js|mjs|css|html|json|svg|map)$/;
/** A window of source bytes, aligned to three so its base64 is the same wherever it sits inside a data URI. */
const WINDOW_BYTES = 96;

function* walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

/** Source files of every texture a body record declares local-only: [{ file, path }]. */
export function findLocalOnlySources(rootDir = root) {
  const engine = packageDir(rootDir, "astraeus");
  const bodies = join(engine, "src", "assets", "bodies");
  const sources = [];
  for (const name of readdirSync(bodies)) {
    const text = readFileSync(join(bodies, name), "utf8");
    if (!/localOnly\s*:/.test(text)) continue;
    for (const match of text.matchAll(/from\s+["']\.\.\/textures\/([^"']+)["']/g)) {
      sources.push({ file: match[1], path: join(engine, "src", "assets", "textures", match[1]) });
    }
  }
  return sources;
}

/** Every file under data/local/ (fetched, never committed, never shipped): [{ file, path, text: true }]. Empty when nothing has been fetched. */
export function findLocalDataSources(rootDir = root) {
  const directory = join(packageDir(rootDir, "astraeus-demo-showers"), "data", "local");
  try {
    statSync(directory);
  } catch {
    return [];
  }
  return [...walk(directory)].filter((path) => !declaresShippableLicence(path)).map((path) => ({ file: `data/local/${path.slice(directory.length + 1)}`, path, text: true }));
}

/** Licences that allow a measured-orbit file to ship (the fetch tool and the loader keep the same list). A fetched file that declares one is a story's shippable data, copied under data/stories/; a fetched file that declares none, or another licence, stays checked. */
export const SHIPPABLE_LICENCES = ["CC BY 4.0", "CC0 1.0"];
function declaresShippableLicence(path) {
  if (!path.endsWith(".json")) return false;
  try {
    return SHIPPABLE_LICENCES.includes(JSON.parse(readFileSync(path, "utf8"))?.provenance?.licence);
  } catch {
    return false;
  }
}

/** Hashes `distDir` against `sources` ([{ file, path }]); returns { ok, files, checked, matches }. */
export function checkPublicBuild({ distDir, sources }) {
  const wanted = sources.map(({ file, path, text: isText }) => {
    const bytes = readFileSync(path);
    const start = Math.max(0, Math.floor((bytes.length - WINDOW_BYTES) / 2 / 3) * 3);
    const window = bytes.subarray(start, start + WINDOW_BYTES);
    return { file, hash: sha256(bytes), size: bytes.length, needle: window.toString("base64"), rawNeedle: isText === true ? window.toString("latin1") : null };
  });
  const matches = [];
  let checked = 0;
  for (const path of walk(distDir)) {
    const bytes = readFileSync(path);
    checked += 1;
    const hash = sha256(bytes);
    if (/[\\/]data[\\/]local[\\/]/.test(path)) matches.push({ source: "data/local/", path, how: "path under data/local" });
    const text = TEXT_EXTENSIONS.test(path) ? bytes.toString("latin1") : "";
    for (const source of wanted) {
      if (hash === source.hash) matches.push({ source: source.file, path, how: "identical file" });
      else if (text.includes(source.needle)) matches.push({ source: source.file, path, how: "embedded as base64" });
      else if (source.rawNeedle !== null && text.includes(source.rawNeedle)) matches.push({ source: source.file, path, how: "embedded as text" });
    }
  }
  return { ok: matches.length === 0, checked, sources: wanted.map(({ file, hash, size }) => ({ file, sha256: hash, bytes: size })), matches };
}

/** Which files of a made-up data/local/ are still checked: a file with no licence, and one with a non-shippable licence, are; a declared CC BY 4.0 file is not. */
export function proveLicenceHandling() {
  const project = mkdtempSync(join(tmpdir(), "astraeus-ship-"));
  try {
    const local = join(project, "data", "local");
    mkdirSync(local, { recursive: true });
    writeFileSync(join(local, "unlicensed-orbits.json"), JSON.stringify({ provenance: { database: "Made-up orbit catalogue with no licence" }, rows: [] }));
    writeFileSync(join(local, "unlicensed-stars.json"), JSON.stringify({ provenance: { source: "Made-up star catalogue with no licence" }, stars: [] }));
    writeFileSync(join(local, "gmn-iau-7.json"), JSON.stringify({ provenance: { licence: "CC BY 4.0" }, rows: [] }));
    writeFileSync(join(local, "other-nc.json"), JSON.stringify({ provenance: { licence: "CC BY-NC 4.0" }, rows: [] }));
    return findLocalDataSources(project).map((source) => source.file).sort();
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
}

/** The committed star asset the public build draws (HYG, CC BY-SA 4.0). */
export const STAR_ASSET = "src/assets/stars/hyg-v42-naked-eye.json";
/** The licences a star file may declare to ship. A catalogue that declares none, or another licence, never qualifies. */
export const STAR_LICENCES = ["CC BY-SA 4.0"];

/**
 * The star asset must carry a complete licence record (PROV-02) with a shippable licence, and the build must contain it byte for
 * byte, so the public sky is the licensed HYG set and not an empty one. Returns { ok, problems, file, sha256, bytes }.
 */
export function checkStarAsset({ distDir, rootDir = root, starPath = join(packageDir(rootDir, "astraeus"), STAR_ASSET) }) {
  const problems = [];
  let bytes = null;
  let provenance = null;
  try {
    bytes = readFileSync(starPath);
    provenance = JSON.parse(bytes.toString("utf8"))?.provenance ?? null;
  } catch (error) {
    problems.push(`star asset unreadable: ${error.message}`);
  }
  if (provenance !== null) {
    for (const key of ["source", "version", "licence", "licenceUrl", "attribution", "accessed"]) {
      if (typeof provenance[key] !== "string" || provenance[key] === "") problems.push(`star asset provenance has no ${key}`);
    }
    if (!STAR_LICENCES.includes(provenance.licence)) problems.push(`star asset licence "${provenance.licence}" is not one of ${STAR_LICENCES.join(", ")}`);
  } else if (bytes !== null) problems.push("star asset has no provenance record");
  const hash = bytes === null ? null : sha256(bytes);
  if (hash !== null && ![...walk(distDir)].some((path) => sha256(readFileSync(path)) === hash)) problems.push("the build does not contain the star asset");
  return { ok: problems.length === 0, problems, file: STAR_ASSET, sha256: hash, bytes: bytes?.length ?? 0 };
}

/** Proves the star check can pass and fail: the real asset in a made-up build, an empty build, and a bad licence record. */
export function proveStarAssetHandling() {
  const temp = mkdtempSync(join(tmpdir(), "astraeus-star-asset-"));
  try {
    const good = join(temp, "good");
    const empty = join(temp, "empty");
    mkdirSync(join(good, "assets"), { recursive: true });
    mkdirSync(empty, { recursive: true });
    writeFileSync(join(good, "assets", "hyg-v42-naked-eye-AbC123.json"), readFileSync(join(packageDir(root, "astraeus"), STAR_ASSET)));
    writeFileSync(join(empty, "index.html"), "<html></html>");
    const body = JSON.parse(readFileSync(join(packageDir(root, "astraeus"), STAR_ASSET), "utf8"));
    const bad = join(temp, "bad.json");
    writeFileSync(bad, JSON.stringify({ ...body, provenance: { ...body.provenance, licence: "CC BY-NC 4.0", attribution: "" } }));
    return { good: checkStarAsset({ distDir: good }), empty: checkStarAsset({ distDir: empty }), badLicence: checkStarAsset({ distDir: good, starPath: bad }) };
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

/** The entry keys of the made-up (synthetic) experiences; a public build must not mount them (T-068). */
export const SYNTHETIC_KEYS = ["synthetic", "synthetic-bare", "synthetic-ring", "synthetic-belt", "synthetic-listed", "synthetic-eccentric", "synthetic-probe"];

/**
 * The made-up experiences are test fixtures: a public build must contain none of them. Fails on a file whose name carries a synthetic module
 * (each is its own chunk) and on a text asset that still holds an entry key or a synthetic source module's name. Returns { ok, matches }.
 */
export function checkNoSyntheticExperiences({ distDir, rootDir = root }) {
  const modules = existsSync(join(packageDir(rootDir, "astraeus"), "src", "synthetic")) ? readdirSync(join(packageDir(rootDir, "astraeus"), "src", "synthetic")).map((name) => name.replace(/\.[^.]+$/, "")) : [];
  const matches = [];
  for (const path of walk(distDir)) {
    const name = path.slice(distDir.length + 1);
    if (modules.some((module) => name.includes(module)) || /(^|[\\/])synthetic/i.test(name)) matches.push({ path: name, how: "file name" });
    else if (TEXT_EXTENSIONS.test(path)) {
      const text = readFileSync(path, "latin1");
      const key = SYNTHETIC_KEYS.find((candidate) => text.includes(`"${candidate}"`) || text.includes(`'${candidate}'`));
      if (key !== undefined) matches.push({ path: name, how: `entry key ${key}` });
    }
  }
  return { ok: matches.length === 0, modules, matches };
}

/** Proves the synthetic check can fail: a made-up build holding a synthetic chunk, and one holding only an entry key, fail; a clean one passes. */
export function proveSyntheticCheck() {
  const temp = mkdtempSync(join(tmpdir(), "astraeus-synthetic-"));
  try {
    const [clean, chunk, key] = ["clean", "chunk", "key"].map((name) => join(temp, name, "assets"));
    for (const directory of [clean, chunk, key]) mkdirSync(directory, { recursive: true });
    for (const directory of [clean, chunk, key]) writeFileSync(join(directory, "app-AbC.js"), 'const a = { "earth-moon": 1 };');
    writeFileSync(join(chunk, "syntheticDefinition-AbC.js"), "export const x = 1;");
    writeFileSync(join(key, "app-AbC.js"), 'const a = { "synthetic-ring": 1 };');
    return { clean: checkNoSyntheticExperiences({ distDir: join(temp, "clean") }), chunk: checkNoSyntheticExperiences({ distDir: join(temp, "chunk") }), key: checkNoSyntheticExperiences({ distDir: join(temp, "key") }) };
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

/**
 * A public build offers Jupiter alone in the planets demo (T-136). Fails on a file whose name is one only another planet's view lists (its maps and system
 * chunks, from the load-budget page sets), and on a text asset that holds another planet's settings (`system: "<planet>"`). Returns { ok, matches }.
 */
export function checkOnlyPublicPlanets({ distDir, rootDir = root, publicPlanets = PUBLIC_PLANETS, nonPublicFiles = NON_PUBLIC_PLANET_FILES }) {
  const settingsDir = join(packageDir(rootDir, "astraeus-demo-planets"), "data", "planets");
  const others = existsSync(settingsDir) ? readdirSync(settingsDir).filter((name) => name.endsWith(".json")).map((name) => name.replace(/\.json$/, "")).filter((name) => !publicPlanets.includes(name)) : [];
  const stems = nonPublicFiles.map((file) => file.replace(/\.[^.]+$/, ""));
  const matches = [];
  for (const path of walk(distDir)) {
    const name = path.slice(distDir.length + 1);
    const base = name.slice(name.lastIndexOf("/") + 1);
    const stem = base.replace(/-[A-Za-z0-9_]{8}(?=\.[^.]+$)/, "").replace(/\.[^.]+$/, "");
    if (stems.includes(stem)) matches.push({ path: name, how: "another planet's file" });
    else if (TEXT_EXTENSIONS.test(path)) {
      const text = readFileSync(path, "latin1");
      const planet = others.find((other) => new RegExp(`["']?system["']?\\s*:\\s*["']${other}["']`).test(text));
      if (planet !== undefined) matches.push({ path: name, how: `settings of ${planet}` });
    }
  }
  return { ok: matches.length === 0, others, matches };
}

/** Proves the planet check can fail: a build holding another planet's map, and one holding its settings, fail; a Jupiter-only one passes. */
export function proveOnlyPublicPlanets() {
  const temp = mkdtempSync(join(tmpdir(), "astraeus-planets-"));
  try {
    const root2 = join(temp, "root", "data", "planets");
    mkdirSync(root2, { recursive: true });
    for (const name of ["jupiter", "mars"]) writeFileSync(join(root2, `${name}.json`), "{}");
    const [clean, map, settings] = ["clean", "map", "settings"].map((name) => join(temp, name, "assets"));
    for (const directory of [clean, map, settings]) {
      mkdirSync(directory, { recursive: true });
      writeFileSync(join(directory, "app-AbCdEf12.js"), 'const a = { system: "jupiter" };');
    }
    writeFileSync(join(map, "mars-2k-AbCdEf12.jpg"), "x");
    writeFileSync(join(settings, "app-AbCdEf12.js"), 'const a = { system: "mars", label: "Mars" };');
    const options = { rootDir: join(temp, "root"), nonPublicFiles: ["mars-2k.jpg", "mars.js"] };
    return { clean: checkOnlyPublicPlanets({ distDir: join(temp, "clean"), ...options }), map: checkOnlyPublicPlanets({ distDir: join(temp, "map"), ...options }), settings: checkOnlyPublicPlanets({ distDir: join(temp, "settings"), ...options }) };
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

/** Proves the check can fail: a fake unlicensed texture is found as a file and as base64, and a clean build passes. */
export function proveItFails() {
  const temp = mkdtempSync(join(tmpdir(), "astraeus-public-build-"));
  try {
    const fake = Buffer.from(Array.from({ length: 4096 }, (_, i) => (i * 131 + 7) % 251));
    const texture = join(temp, "fake-unlicensed.jpg");
    writeFileSync(texture, fake);
    const sources = [{ file: "fake-unlicensed.jpg", path: texture }];
    const clean = join(temp, "clean");
    const copied = join(temp, "copied");
    const embedded = join(temp, "embedded");
    for (const directory of [clean, copied, embedded]) mkdirSync(join(directory, "assets"), { recursive: true });
    for (const directory of [clean, copied, embedded]) writeFileSync(join(directory, "assets", "index.js"), "export const a = 1;");
    writeFileSync(join(copied, "assets", "fake-renamed.bin"), fake);
    writeFileSync(join(embedded, "assets", "index.js"), `export const texture = "data:image/jpeg;base64,${fake.toString("base64")}";`);
    // A made-up fetched data file under a fake data/local/, found as a copied file, as text inside a script, and by its path alone.
    const dataDir = join(temp, "project", "data", "local");
    mkdirSync(dataDir, { recursive: true });
    const dataText = JSON.stringify({ stars: Array.from({ length: 200 }, (_, i) => [i * 1.7, (i % 90) - 45, 4 + (i % 25) / 10, null]) });
    writeFileSync(join(dataDir, "made-up-stars.json"), dataText);
    const dataSources = findLocalDataSources(join(temp, "project"));
    const dataCopied = join(temp, "data-copied");
    const dataEmbedded = join(temp, "data-embedded");
    const dataPath = join(temp, "data-path");
    for (const directory of [dataCopied, dataEmbedded, dataPath]) mkdirSync(join(directory, "assets"), { recursive: true });
    writeFileSync(join(dataCopied, "assets", "renamed.bin"), dataText);
    writeFileSync(join(dataEmbedded, "assets", "index.js"), `export const stars = ${dataText};`);
    mkdirSync(join(dataPath, "data", "local"), { recursive: true });
    writeFileSync(join(dataPath, "data", "local", "other.txt"), "unrelated");
    return {
      clean: checkPublicBuild({ distDir: clean, sources }),
      copied: checkPublicBuild({ distDir: copied, sources }),
      embedded: checkPublicBuild({ distDir: embedded, sources }),
      dataSources: dataSources.length,
      dataClean: checkPublicBuild({ distDir: clean, sources: dataSources }),
      dataCopied: checkPublicBuild({ distDir: dataCopied, sources: dataSources }),
      dataEmbedded: checkPublicBuild({ distDir: dataEmbedded, sources: dataSources }),
      dataPath: checkPublicBuild({ distDir: dataPath, sources: dataSources }),
    };
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const distDir = resolve(process.argv[2] ?? join(root, "dist"));
  const localData = findLocalDataSources();
  const sources = [...findLocalOnlySources(), ...localData];
  // Every texture is licensed since I-029 and a clean checkout has no unlicensed data/local/ files, so the source list may be empty. The validator then still proves
  // itself on made-up files (it must fail on a copied or embedded one and pass a clean build) and still fails any path under data/local/ in the build.
  const proof = proveItFails();
  const selfProof = proof.clean.ok && !proof.copied.ok && !proof.embedded.ok && proof.dataClean.ok && !proof.dataCopied.ok && !proof.dataEmbedded.ok && !proof.dataPath.ok;
  const missingPages = REQUIRED_PAGES.filter((page) => !existsSync(join(distDir, page)));
  const checked = checkPublicBuild({ distDir, sources });
  const starAsset = checkStarAsset({ distDir });
  const synthetic = checkNoSyntheticExperiences({ distDir });
  const syntheticProof = proveSyntheticCheck();
  const syntheticSelfProof = syntheticProof.clean.ok && !syntheticProof.chunk.ok && !syntheticProof.key.ok;
  const planets = checkOnlyPublicPlanets({ distDir });
  const planetProof = proveOnlyPublicPlanets();
  const planetSelfProof = planetProof.clean.ok && !planetProof.map.ok && !planetProof.settings.ok;
  const packageCredits = gatherPackageCredits();
  const engineLicences = checkEngineLicences();
  const loadBudget = checkLoadBudget({ distDir });
  const budgetProof = proveLoadBudgetFails();
  const budgetSelfProof = budgetProof.within.ok && !budgetProof.heavier.ok && !budgetProof.missing.ok && !budgetProof.unlistedImport.ok && !budgetProof.unlistedFile.ok;
  const result = { distDir, packageCredits: packageCredits.map(({ package: name, licenceFiles, dataLicences }) => ({ package: name, licenceFiles, dataLicenceFiles: dataLicences.length })), engineLicences, loadBudget, budgetSelfProof, localDataFilesChecked: localData.length, requiredPages: REQUIRED_PAGES, missingPages, starAsset, synthetic, syntheticSelfProof, planets, planetSelfProof, selfProof, ...checked, ok: selfProof && syntheticSelfProof && budgetSelfProof && engineLicences.ok && loadBudget.ok && checked.ok && missingPages.length === 0 && starAsset.ok && synthetic.ok && planets.ok && planetSelfProof };
  if (process.argv[3] !== undefined) writeFileSync(resolve(process.argv[3]), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}
