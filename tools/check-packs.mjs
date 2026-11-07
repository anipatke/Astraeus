// The pack check (O-036 T-161): `npm run check:pack` builds every publishable package (tools/build-packages.mjs), runs `npm pack --dry-run --json` on each build
// folder and fails on a file outside the allow-list, a forbidden file, a missing manifest field, an `exports` target that is not packed, or a size or file
// count above the limit (the engine has no file count: a stray file fails, see strayFiles). Nothing is published. Limits come from docs/NPM_PACKAGING.md ("Size limits for the pack check"); the engine's are re-measured at
// about 10% above its pack of 2026-10-23 (7.0 MB packed, 8.6 MB unpacked, 405 files) now that the moon and Milky Way pictures live in astraeus-data.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildPackage, PACKAGES } from "./build-packages.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MB = 1_000_000;

/** Limits in bytes (packed, unpacked) and file counts. `astraeus` has no file count: `strayFiles` names a packed file that is not a real source module (O-051 T-218, owner choice). The planet packages were raised in O-047 T-200. */
export const LIMITS = {
  astraeus: { packed: 8 * MB, unpacked: 9.5 * MB },
  // Files raised from 40 to 130 for the place lists (owner, 2026-11-06, O-059 T-268); sizes unchanged.
  "astraeus-data": { packed: 39 * MB, unpacked: 39 * MB, files: 130 },
  "astraeus-data-jupiter": { packed: 34 * MB, unpacked: 37 * MB, files: 2_900 },
  "astraeus-data-saturn": { packed: 59 * MB, unpacked: 64 * MB, files: 7_000 },
  "astraeus-data-uranus": { packed: 45 * MB, unpacked: 47 * MB, files: 1_050 },
  "astraeus-data-neptune": { packed: 20.5 * MB, unpacked: 22 * MB, files: 580 },
  "astraeus-data-mars": { packed: 6.1 * MB, unpacked: 6.2 * MB, files: 80 },
  "astraeus-data-pluto": { packed: 2 * MB, unpacked: 2.1 * MB, files: 140 },
};

const COMMON = ["package\\.json", "README\\.md", "CHANGELOG\\.md", "LICENSE", "NOTICE", "licenses/[^/]+"];
const CODE = "src/.+\\.(?:js|d\\.ts)";
/** Files each package may contain (anything else fails). */
const ALLOWED = {
  astraeus: [...COMMON, CODE, "src/.+\\.(?:css|jpg|png|json)", "data/.+\\.json"],
  "astraeus-data": [...COMMON, CODE, "src/textures/[^/]+\\.jpg", "data/bodies/[^/]+\\.(?:json|md)", "data/bodies/[a-z]+/[a-z]+\\.json"],
  position: [...COMMON, CODE, "data/[a-z]+-moons/index\\.json", "data/[a-z]+-moons/(?:list|fit-errors)\\.json", "data/[a-z]+-moons/[^/]+/\\d{4}\\.bin"],
};
/** Never packed, whatever else matches. */
const FORBIDDEN = /(?:\.test\.|\.spec\.|(?:^|\/)tests?\/|(?:^|\/)tools\/|horizons-cache|\.map$|\.env|\.tsbuildinfo|tsconfig|(?<!\.d)\.tsx?$|vitest|\/local\/)/;

/** The libraries the engine takes from the host app (T-163): peer dependencies of `astraeus`, never bundled or listed as dependencies. */
const PEER_LIBRARIES = ["react", "react-dom", "@react-three/fiber", "three"];
const REQUIRED_FIELDS = ["name", "version", "description", "license", "repository", "keywords", "exports", "types", "files", "type"];

function targetsOf(value) {
  if (typeof value === "string") return [value];
  if (value !== null && typeof value === "object") return Object.values(value).flatMap(targetsOf);
  return [];
}

/** Whether an `exports` target is packed: a file by its path, a `*` pattern (O-059 T-268, `./bodies/*`) by at least one packed file under it. */
export function exportTargetPacked(target, paths) {
  const wanted = target.replace(/^\.\//, "");
  if (!wanted.includes("*")) return paths.includes(wanted);
  const pattern = new RegExp(`^${wanted.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".+")}$`);
  return paths.some((path) => pattern.test(path));
}

function packOf(name) {
  const dir = join(root, "packages", name, "dist");
  const run = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: dir, encoding: "utf8", maxBuffer: 1 << 28 });
  if (run.status !== 0) throw new Error(`${name}: npm pack --dry-run failed\n${run.stderr}`);
  // npm 11 prints an array of packs; npm 12 prints an object keyed by package name.
  const parsed = JSON.parse(run.stdout);
  return { dir, pack: Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0] };
}

const RELATIVE_SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(?\s*)(["'])(\.[^"']*)\1/g;

/** Relative imports and exports in compiled .js and .d.ts files that name no file extension; webpack 5 refuses them in a "type": "module" package (I-077). */
export function extensionlessImports(dir) {
  const found = [];
  const visit = (folder) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (/\.(?:js|d\.ts)$/.test(entry.name)) {
        for (const match of readFileSync(path, "utf8").matchAll(RELATIVE_SPECIFIER)) {
          if (!/\.[a-z]+$/i.test(match[2].replace(/^(\.\.?\/)+/, ""))) found.push(`${path.slice(dir.length + 1)}: ${match[2]}`);
        }
      }
    }
  };
  visit(join(dir, "src"));
  return found;
}

/** Compiled-code problems: extensionless relative imports (I-077) and, in a position package, a chunk URL that Vite could inline (I-078). */
function codeProblems(name, dir) {
  const problems = extensionlessImports(dir).map((one) => `${name}: extensionless relative import in ${one}`);
  if (name.startsWith("astraeus-data-")) {
    const urls = readFileSync(join(dir, "src", "chunks.js"), "utf8").match(/new URL\([^)]*\)/g) ?? [];
    if (urls.length === 0) problems.push(`${name}: src/chunks.js lists no chunk`);
    if (urls.some((url) => !/\.bin\?no-inline"/.test(url))) problems.push(`${name}: a chunk URL in src/chunks.js lacks ?no-inline (Vite would inline it)`);
    if (!existsSync(join(dir, "src", "chunks.d.ts"))) problems.push(`${name}: src/chunks.d.ts is missing (chunkUrls would be untyped)`);
  }
  return problems;
}

/** The `astraeus` peer range a data package states for an engine at `version`: its current minor (`0.7.3` gives `>=0.7.0 <0.8.0`), the one it was tested with (O-053 T-230, API-07). */
export function enginePeerRange(version) {
  const [major, minor] = version.split(".").map(Number);
  return major === 0 ? `>=0.${minor}.0 <0.${minor + 1}.0` : `>=${major}.${minor}.0 <${major + 1}.0.0`;
}

/** The React range the engine takes: all of React 19. */
export const REACT_PEER_RANGE = ">=19 <20";

/** The problems with the peer libraries of a manifest: `astraeus` must list them as peerDependencies and not as dependencies, and a data package's `astraeus` peer is the engine's current minor. */
function peerProblems(name, manifest) {
  const problems = [];
  if (manifest.devDependencies !== undefined) problems.push(`${name}: package.json still lists devDependencies`);
  if (name.startsWith("astraeus-data")) {
    const engine = JSON.parse(readFileSync(join(root, "packages", "astraeus", "package.json"), "utf8")).version;
    const wanted = enginePeerRange(engine);
    if (manifest.peerDependencies?.astraeus !== wanted) problems.push(`${name}: astraeus peer is ${manifest.peerDependencies?.astraeus ?? "missing"}, the engine's current minor is ${wanted}`);
  }
  if (name !== "astraeus") return problems;
  for (const library of ["react", "react-dom"]) {
    if (manifest.peerDependencies?.[library] !== REACT_PEER_RANGE) problems.push(`${name}: ${library} peer is ${manifest.peerDependencies?.[library] ?? "missing"}, it must cover all of React 19 (${REACT_PEER_RANGE})`);
  }
  for (const library of PEER_LIBRARIES) {
    if (manifest.dependencies?.[library] !== undefined) problems.push(`${name}: ${library} is a dependency; it must be a peerDependency (the host app's copy is used)`);
    if (manifest.peerDependencies?.[library] === undefined) problems.push(`${name}: ${library} is not a peerDependency`);
  }
  return problems;
}

/**
 * Packed files of `astraeus` that trace to no real file: a `src/**` `.js`, `.node.js` or `.d.ts` needs `packages/astraeus/src/**` `.ts` or `.tsx` of the same name, any other file under `src` or `data`
 * needs the same path in the package source, and a top-level entry must be `package.json` or one the package's `x-publish.files` lists. So a new module passes and a stray file fails by name.
 */
export function strayFiles(paths, sourceDir, publishFiles) {
  const top = new Set(["package.json", ...publishFiles]);
  return paths.filter((path) => {
    const [first] = path.split("/");
    if (!top.has(first)) return true;
    if (first !== "src" && first !== "data") return false;
    const code = first === "src" ? /^(.+?)(?:\.node)?\.js$|^(.+)\.d\.ts$/.exec(path) : null;
    if (code !== null) {
      const stem = code[1] ?? code[2];
      return !existsSync(join(sourceDir, `${stem}.ts`)) && !existsSync(join(sourceDir, `${stem}.tsx`));
    }
    return !existsSync(join(sourceDir, path));
  });
}

/** The stray-file problems of the engine's pack (none for the other packages). */
function strayProblems(name, paths) {
  if (name !== "astraeus") return [];
  const source = join(root, "packages", name);
  const publish = JSON.parse(readFileSync(join(source, "package.json"), "utf8"))["x-publish"]?.files ?? [];
  return strayFiles(paths, source, publish).map((path) => `${name}: stray file ${path} (no source module or listed file behind it)`);
}

/** Sizes (and, where a package has one, the file count) over the package's limits. */
function sizeProblems(name, pack) {
  const problems = [];
  const limit = LIMITS[name];
  if (pack.size > limit.packed) problems.push(`${name}: packed ${(pack.size / MB).toFixed(2)} MB is over ${(limit.packed / MB).toFixed(1)} MB`);
  if (pack.unpackedSize > limit.unpacked) problems.push(`${name}: unpacked ${(pack.unpackedSize / MB).toFixed(2)} MB is over ${(limit.unpacked / MB).toFixed(1)} MB`);
  if (limit.files !== undefined && pack.entryCount > limit.files) problems.push(`${name}: ${pack.entryCount} files is over ${limit.files}`);
  return problems;
}

/**
 * The packed engine's ring facts (O-057 I-147; they used to be read by the node consumer check through a packed internal file, past the package's `exports`): Saturn has bands, Mars none.
 * Read here, where reading packed files is the check's job, by a child Node process importing the packed catalogue from `dir`.
 */
export function ringFactProblems(dir) {
  const script = 'const { catalogue } = await import(process.argv[1]); console.log(JSON.stringify({ saturn: catalogue.get("saturn").visual.rings?.bands?.length ?? 0, mars: catalogue.get("mars").visual.rings ?? null }));';
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", script, pathToFileURL(join(dir, "src", "assets", "catalogue.js")).href], { encoding: "utf8" });
  if (run.status !== 0) return [`astraeus: the packed catalogue would not import (${run.stderr.trim().split("\n").at(-1)})`];
  const facts = JSON.parse(run.stdout);
  const problems = [];
  if (!(facts.saturn > 0)) problems.push("astraeus: the packed catalogue gives Saturn no ring bands");
  if (facts.mars !== null) problems.push("astraeus: the packed catalogue gives Mars rings");
  return problems;
}

/**
 * The lines of a consumer check's source that reach past the package's public entry (O-057 I-147, API-01): an import of a subpath other than `style.css` and `package.json`, a `new URL` built
 * from `import.meta.resolve`, a relative `import("../...")`, or a path into the unpacked package's own folders (written whole or in parts). Each as `line N: text`.
 */
export function pastTheEntry(source) {
  const found = [];
  const patterns = [
    /["'`]astraeus\/(?!package\.json["'`]|style\.css["'`])[^"'`]*["'`]/,
    /new URL\([^\n]*import\.meta\.resolve|import\.meta\.resolve\([^\n]*new URL/,
    /import\(\s*[^\n)]*["'`]\.\.?\//,
    /["'`]\.\.?\/(?:src|assets|api|core|app)\/[^"'`]*["'`]/,
    /node_modules\/astraeus\/(?!package\.json|style\.css)/,
    // The same path given in parts: join(dir, "node_modules", "astraeus", "src", ...) or join(dir, "astraeus", "src", ...).
    /["'`]node_modules["'`]\s*,\s*["'`]astraeus["'`]\s*,\s*["'`](?!package\.json["'`]|style\.css["'`])/,
    /["'`]astraeus["'`]\s*,\s*["'`](?:src|assets|api|core|app)["'`]/,
  ];
  source.split("\n").forEach((line, index) => {
    if (patterns.some((pattern) => pattern.test(line))) found.push(`line ${index + 1}: ${line.trim().slice(0, 120)}`);
  });
  return found;
}

/** The problems with one packed package: files outside the allow-list, a thin manifest, missing exports targets, notices, and sizes over the limits. */
function problemsOf(name, dir, pack) {
  const problems = [];
  const paths = pack.files.map((file) => file.path);
  const allowed = new RegExp(`^(?:${(ALLOWED[name] ?? ALLOWED.position).join("|")})$`);
  for (const path of paths) {
    if (FORBIDDEN.test(path)) problems.push(`${name}: forbidden file ${path}`);
    else if (!allowed.test(path)) problems.push(`${name}: unexpected file ${path}`);
  }
  problems.push(...strayProblems(name, paths));
  const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  if (manifest.name !== name) problems.push(`${name}: package.json names ${manifest.name}`);
  const sourceVersion = JSON.parse(readFileSync(join(root, "packages", name, "package.json"), "utf8")).version;
  if (manifest.version !== sourceVersion) problems.push(`${name}: version is ${manifest.version}, the source package.json says ${sourceVersion}`);
  for (const field of REQUIRED_FIELDS) if (manifest[field] === undefined) problems.push(`${name}: package.json has no ${field}`);
  if (manifest.private === true) problems.push(`${name}: package.json is private`);
  if (Object.keys(manifest).some((key) => key.startsWith("x-"))) problems.push(`${name}: package.json still has an x- build block`);
  for (const target of targetsOf(manifest.exports)) if (!exportTargetPacked(target, paths)) problems.push(`${name}: exports names ${target}, which is not packed`);
  problems.push(...peerProblems(name, manifest));
  for (const required of ["README.md", "LICENSE"]) if (!paths.includes(required)) problems.push(`${name}: ${required} is not packed`);
  if (!paths.includes("NOTICE") && !paths.some((path) => path.startsWith("licenses/"))) problems.push(`${name}: no NOTICE or licenses/ (PROV-01, PROV-02)`);
  problems.push(...codeProblems(name, dir));
  if (name === "astraeus") problems.push(...ringFactProblems(dir));
  problems.push(...sizeProblems(name, pack));
  return problems;
}

/** Builds (unless `build` is false) and checks every package; returns one row per package and the problems found. */
export function checkPacks({ build = true, only = PACKAGES } = {}) {
  const rows = [];
  const problems = [];
  for (const name of PACKAGES.filter((one) => only.includes(one))) {
    if (build) buildPackage(name);
    const { dir, pack } = packOf(name);
    problems.push(...problemsOf(name, dir, pack));
    rows.push({ name, packedMB: pack.size / MB, unpackedMB: pack.unpackedSize / MB, files: pack.entryCount, limit: LIMITS[name] });
  }
  return { ok: problems.length === 0, rows, problems };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const started = Date.now();
  const result = checkPacks();
  for (const row of result.rows) {
    console.log(`${row.name.padEnd(24)} packed ${row.packedMB.toFixed(2).padStart(6)} MB (limit ${(row.limit.packed / MB).toFixed(1)})  unpacked ${row.unpackedMB.toFixed(2).padStart(6)} MB (limit ${(row.limit.unpacked / MB).toFixed(1)})  ${String(row.files).padStart(5)} files (${row.limit.files === undefined ? "no count limit; stray-file check" : `limit ${row.limit.files}`})`);
  }
  for (const problem of result.problems) console.error(`FAIL ${problem}`);
  console.log(result.ok ? `pack check: pass (${((Date.now() - started) / 1000).toFixed(1)} s)` : `pack check: FAIL (${result.problems.length} problems)`);
  process.exit(result.ok ? 0 : 1);
}
