// The pack check (O-036 T-161): `npm run check:pack` builds every publishable package (tools/build-packages.mjs), runs `npm pack --dry-run --json` on each build
// folder and fails on a file outside the allow-list, a forbidden file, a missing manifest field, an `exports` target that is not packed, or a size or file
// count above the limit. Nothing is published. Limits come from docs/NPM_PACKAGING.md ("Size limits for the pack check"); the engine's are re-measured at
// about 10% above its pack of 2026-10-23 (7.0 MB packed, 8.6 MB unpacked, 405 files) now that the moon and Milky Way pictures live in astraeus-data.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPackage, PACKAGES } from "./build-packages.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MB = 1_000_000;

/** Limits in bytes (packed, unpacked) and file counts. */
export const LIMITS = {
  astraeus: { packed: 8 * MB, unpacked: 9.5 * MB, files: 450 },
  "astraeus-data": { packed: 39 * MB, unpacked: 39 * MB, files: 40 },
  "astraeus-data-jupiter": { packed: 25 * MB, unpacked: 25.5 * MB, files: 2_400 },
  "astraeus-data-saturn": { packed: 44 * MB, unpacked: 44.5 * MB, files: 6_000 },
  "astraeus-data-uranus": { packed: 36 * MB, unpacked: 36.5 * MB, files: 700 },
  "astraeus-data-neptune": { packed: 20 * MB, unpacked: 20.5 * MB, files: 400 },
  "astraeus-data-mars": { packed: 6.1 * MB, unpacked: 6.2 * MB, files: 80 },
  "astraeus-data-pluto": { packed: 2 * MB, unpacked: 2.1 * MB, files: 140 },
};

const COMMON = ["package\\.json", "README\\.md", "CHANGELOG\\.md", "LICENSE", "NOTICE", "licenses/[^/]+"];
const CODE = "src/.+\\.(?:js|d\\.ts)";
/** Files each package may contain (anything else fails). */
const ALLOWED = {
  astraeus: [...COMMON, CODE, "src/.+\\.(?:css|jpg|png|json)", "data/.+\\.json"],
  "astraeus-data": [...COMMON, CODE, "src/textures/[^/]+\\.jpg"],
  position: [...COMMON, CODE, "data/[a-z]+-moons/index\\.json", "data/[a-z]+-moons/[^/]+/\\d{4}\\.bin"],
};
/** Never packed, whatever else matches. */
const FORBIDDEN = /(?:\.test\.|\.spec\.|(?:^|\/)tests?\/|(?:^|\/)tools\/|horizons-cache|\.map$|\.env|\.tsbuildinfo|tsconfig|(?<!\.d)\.tsx?$|vitest|\/local\/)/;

const REQUIRED_FIELDS = ["name", "version", "description", "license", "repository", "keywords", "exports", "types", "files", "type"];

function targetsOf(value) {
  if (typeof value === "string") return [value];
  if (value !== null && typeof value === "object") return Object.values(value).flatMap(targetsOf);
  return [];
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

/** The problems with one packed package: files outside the allow-list, a thin manifest, missing exports targets, notices, and sizes over the limits. */
function problemsOf(name, dir, pack) {
  const problems = [];
  const paths = pack.files.map((file) => file.path);
  const allowed = new RegExp(`^(?:${(ALLOWED[name] ?? ALLOWED.position).join("|")})$`);
  for (const path of paths) {
    if (FORBIDDEN.test(path)) problems.push(`${name}: forbidden file ${path}`);
    else if (!allowed.test(path)) problems.push(`${name}: unexpected file ${path}`);
  }
  const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  if (manifest.name !== name) problems.push(`${name}: package.json names ${manifest.name}`);
  const sourceVersion = JSON.parse(readFileSync(join(root, "packages", name, "package.json"), "utf8")).version;
  if (manifest.version !== sourceVersion) problems.push(`${name}: version is ${manifest.version}, the source package.json says ${sourceVersion}`);
  for (const field of REQUIRED_FIELDS) if (manifest[field] === undefined) problems.push(`${name}: package.json has no ${field}`);
  if (manifest.private === true) problems.push(`${name}: package.json is private`);
  if (Object.keys(manifest).some((key) => key.startsWith("x-"))) problems.push(`${name}: package.json still has an x- build block`);
  for (const target of targetsOf(manifest.exports)) if (!paths.includes(target.replace(/^\.\//, ""))) problems.push(`${name}: exports names ${target}, which is not packed`);
  for (const required of ["README.md", "LICENSE"]) if (!paths.includes(required)) problems.push(`${name}: ${required} is not packed`);
  if (!paths.includes("NOTICE") && !paths.some((path) => path.startsWith("licenses/"))) problems.push(`${name}: no NOTICE or licenses/ (PROV-01, PROV-02)`);
  problems.push(...codeProblems(name, dir));
  const limit = LIMITS[name];
  if (pack.size > limit.packed) problems.push(`${name}: packed ${(pack.size / MB).toFixed(2)} MB is over ${(limit.packed / MB).toFixed(1)} MB`);
  if (pack.unpackedSize > limit.unpacked) problems.push(`${name}: unpacked ${(pack.unpackedSize / MB).toFixed(2)} MB is over ${(limit.unpacked / MB).toFixed(1)} MB`);
  if (pack.entryCount > limit.files) problems.push(`${name}: ${pack.entryCount} files is over ${limit.files}`);
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
    console.log(`${row.name.padEnd(24)} packed ${row.packedMB.toFixed(2).padStart(6)} MB (limit ${(row.limit.packed / MB).toFixed(1)})  unpacked ${row.unpackedMB.toFixed(2).padStart(6)} MB (limit ${(row.limit.unpacked / MB).toFixed(1)})  ${String(row.files).padStart(5)} files (limit ${row.limit.files})`);
  }
  for (const problem of result.problems) console.error(`FAIL ${problem}`);
  console.log(result.ok ? `pack check: pass (${((Date.now() - started) / 1000).toFixed(1)} s)` : `pack check: FAIL (${result.problems.length} problems)`);
  process.exit(result.ok ? 0 : 1);
}
