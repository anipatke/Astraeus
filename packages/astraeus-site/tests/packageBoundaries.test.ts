import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

// The package boundary (O-035 T-156, ARCH-03): packages meet only through the names and entries a package declares in its `exports`.
// The data packages (astraeus-data, astraeus-data-<planet>, O-036 T-161) are engine-side data: they import only the engine (types), the engine's code imports none of them (its tests and vitest.setup.ts may, to register what a customer hands to mount), and the demos and the site may.
// Checked: no relative import into another package, the engine's code imports no other package, a demo imports the engine and the data packages, the site imports the engine, the demos and the data packages,
// and every `package/entry` import is an entry the target declares (and that points at a real file).
// Vite `import.meta.glob` patterns (string or array form) are read too, because a glob cannot take a package name and so is a path. Relative and `/packages/...` patterns are checked against every package their path can match (a wildcard, partial name or brace list in the package-name segment reaches several, a brace list holding a `/` is expanded, and a call's `base` option is resolved first; a `**` above a package reaches it from an unknown place), and a match on any other package fails unless a named rule allows it.
// Four named rules allow a glob into another package: DATA-OF-ENGINE (any package may glob the engine's `data/`), DATA-OF-DATA-PACKAGE (any package may glob a data package's `data/`) and DATA-OF-DEMO (the site, and only the site, may glob a demo's `data/`), both only when that package declares a `data/*` entry; and TEST-READS-ENGINE-TEXT (a file in a package's top-level `tests/` folder may glob the engine's `src/` when that glob call's own options say `query: "?raw"`, to read source as text for a rule check, never to import it).
// One more rule (O-041 T-169, ARCH-03): a demo built on the public API (`PUBLIC_API_DEMOS`) imports the engine only through its `.` entry, `astraeus`, the way a customer's app would, in its `src/` (its tests may use the engine's inside); another package and a deep `astraeus/...` entry fail.
// Not checked: an alias-based glob (neither relative nor `/`-rooted), file paths a test or script reads at run time, and paths that leave `packages/` for the repository root (docs, vercel.json).

const ENGINE = "astraeus";
const SITE = "astraeus-site";
/** Demos that are stories on the public API: their `src/` imports `astraeus` and nothing else outside the package. */
const PUBLIC_API_DEMOS: ReadonlySet<string> = new Set(["astraeus-demo-apollo11", "astraeus-demo-showers"]);
const isDemo = (name: string) => name.startsWith("astraeus-demo-");
const isData = (name: string) => name === "astraeus-data" || name.startsWith("astraeus-data-");
/** Engine files that are not shipped code: its tests and the test setup. */
const isEngineTestFile = (where: string) => where.startsWith(`${ENGINE}/tests/`) || where === `${ENGINE}/vitest.setup.ts`;

type Exports = Record<string, string>;
interface PackageInfo { dir: string; exports: Exports }

function loadPackages(packagesDir: string): Map<string, PackageInfo> {
  const found = new Map<string, PackageInfo>();
  for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
    const manifest = join(packagesDir, entry.name, "package.json");
    if (!entry.isDirectory() || !existsSync(manifest)) continue;
    const json = JSON.parse(readFileSync(manifest, "utf8")) as { name: string; exports?: Exports };
    found.set(json.name, { dir: join(packagesDir, entry.name), exports: json.exports ?? {} });
  }
  return found;
}

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", "coverage"].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(path));
    else if (/\.(tsx?|mjs|cjs|js)$/.test(entry.name)) out.push(path);
  }
  return out;
}

/** Module specifiers named by static, dynamic and re-export statements, `require` and test mocks. */
function specifiers(source: string): string[] {
  return [...source.matchAll(/(?:\bfrom|\bimport|vi\.mock|vi\.importActual|\brequire)\s*\(?\s*["'`]([^"'`]+)["'`]/g)].map((match) => match[1]);
}

/** The text of a call's argument list, from just after its `(` to the matching `)`, with comments removed. */
function callArguments(source: string, open: number): string {
  let depth = 1;
  let quote = "";
  let out = "";
  for (let at = open + 1; at < source.length; at++) {
    const c = source[at];
    if (quote) {
      out += c;
      if (c === "\\") out += source[++at] ?? "";
      else if (c === quote) quote = "";
    } else if (source.startsWith("//", at)) {
      const end = source.indexOf("\n", at);
      at = end < 0 ? source.length : end;
    } else if (source.startsWith("/*", at)) {
      const end = source.indexOf("*/", at + 2);
      at = end < 0 ? source.length : end + 1;
    } else {
      if ("\"'`".includes(c)) quote = c;
      else if (c === "(") depth++;
      else if (c === ")" && --depth === 0) break;
      out += c;
    }
  }
  return out;
}

/** The patterns of every `import.meta.glob` call (the first argument as one string or an array of strings, a leading `!` removed), whether that call's own options ask for the file text (`query: "?raw"`), and the `base` folder its options name, if any. */
function globPatterns(source: string): { pattern: string; raw: boolean; base?: string }[] {
  const out: { pattern: string; raw: boolean; base?: string }[] = [];
  for (const call of source.matchAll(/import\.meta\.glob\b/g)) {
    let at = call.index + call[0].length;
    let angle = 0;
    while (at < source.length && !(source[at] === "(" && angle === 0)) { if (source[at] === "<") angle++; else if (source[at] === ">") angle--; at++; }
    const args = callArguments(source, at).trim();
    const list = args.startsWith("[") ? args.slice(0, args.indexOf("]")) : (/^(["'`])[^"'`]*\1/.exec(args)?.[0] ?? "");
    const options = args.slice(list.length);
    const raw = /\bquery\s*:\s*["'`]\?raw["'`]/.test(options);
    const base = /\bbase\s*:\s*(["'`])([^"'`]*)\1/.exec(options)?.[2];
    for (const text of list.matchAll(/(["'`])([^"'`]*)\1/g)) out.push({ pattern: text[2].replace(/^!/, ""), raw, base });
  }
  return out;
}

/** A pattern with every brace list that holds a `/` expanded into its alternatives (`{a/src,b/src}` reaches two folders); brace lists within one segment stay for segmentMatches. */
function expandBraces(pattern: string): string[] {
  let open = -1;
  let depth = 0;
  for (let at = 0; at < pattern.length; at++) {
    if (pattern[at] === "{" && depth++ === 0) open = at;
    else if (pattern[at] === "}" && --depth === 0) {
      const inner = pattern.slice(open + 1, at);
      if (!inner.includes("/")) continue;
      const parts: string[] = [];
      let level = 0;
      let current = "";
      for (const c of inner) {
        if (c === "{") level++;
        if (c === "}") level--;
        if (c === "," && level === 0) { parts.push(current); current = ""; } else current += c;
      }
      parts.push(current);
      return parts.flatMap((part) => expandBraces(pattern.slice(0, open) + part + pattern.slice(at + 1)));
    }
  }
  return [pattern];
}

/** A path split at `/`, except inside braces. */
function pathSegments(path: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = "";
  for (const c of path) {
    if (c === "{") depth++;
    if (c === "}") depth--;
    if (c === "/" && depth === 0) { if (current) out.push(current); current = ""; } else current += c;
  }
  if (current) out.push(current);
  return out;
}

/** Whether one glob segment (`*`, `?`, `{a,b}`, `[..]`) can match one literal folder name. */
function segmentMatches(segment: string, name: string): boolean {
  const body = segment.replace(/[.+^$()|\\]/g, "\\$&").replace(/\*+/g, "[^/]*").replace(/\?/g, "[^/]").replace(/\{([^}]*)\}/g, (_, list: string) => `(?:${list.split(",").join("|")})`);
  return new RegExp(`^${body}$`).test(name);
}

/**
 * Where a glob pattern can reach inside a package folder: undefined when it cannot match inside it, otherwise the pattern's remaining segments below the folder
 * (the package-name segment may be a wildcard, a partial name or a brace list, so a pattern can reach several packages; a `**` at or above the folder reaches it from an unknown place, reported as `**`).
 */
function globReach(patternPath: string, packageDir: string): string[] | undefined {
  const pattern = pathSegments(patternPath);
  const folder = pathSegments(packageDir);
  for (let i = 0; i < folder.length; i++) {
    if (i >= pattern.length) return undefined;
    if (pattern[i] === "**") return ["**"];
    if (!segmentMatches(pattern[i], folder[i])) return undefined;
  }
  return pattern.slice(folder.length);
}

/** The file an export target points at for a subpath, or undefined when the package does not declare the subpath. */
function exportTarget(exports: Exports, sub: string): string | undefined {
  if (exports[sub] !== undefined) return exports[sub];
  let best: { key: string; star: string } | undefined;
  for (const key of Object.keys(exports)) {
    const at = key.indexOf("*");
    if (at < 0) continue;
    const head = key.slice(0, at);
    const tail = key.slice(at + 1);
    if (sub.startsWith(head) && sub.endsWith(tail) && sub.length >= key.length - 1 && (!best || head.length > best.key.indexOf("*"))) best = { key, star: sub.slice(head.length, sub.length - tail.length) };
  }
  return best ? exports[best.key].replace("*", best.star) : undefined;
}

/** Offences of the `import.meta.glob` patterns in one file; the named rules below are the only ways a glob may leave its package. */
function globOffences(packages: Map<string, PackageInfo>, packagesDir: string, from: string, file: string, where: string, text: string): string[] {
  const offences: string[] = [];
  const rooted = (path: string) => path.startsWith("/packages/") ? resolve(packagesDir, path.slice("/packages/".length)) : resolve(dirname(packagesDir), path.slice(1));
  for (const { pattern, raw, base } of globPatterns(text)) {
    const baseDir = base === undefined ? dirname(file) : base.startsWith("/") ? rooted(base) : resolve(dirname(file), base);
    const absolutes = expandBraces(pattern).map((one) => one.startsWith("/") ? rooted(one) : one.startsWith(".") || base !== undefined ? resolve(baseDir, one) : undefined);
    for (const [name, info] of packages) {
      const reaches = name === from ? [] : absolutes.flatMap((absolute) => absolute === undefined ? [] : [globReach(absolute.split(sep).join("/"), info.dir.split(sep).join("/"))]).filter((below) => below !== undefined);
      if (reaches.length === 0) continue;
      const below = reaches.find((one) => one[0] !== "data" && !(one[0] === "src" && raw)) ?? reaches[0];
      const dataOfEngine = name === ENGINE;
      const dataOfDemo = from === SITE && isDemo(name);
      const dataOfDataPackage = isData(name);
      const declaresData = info.exports["./data/*"] !== undefined;
      const testReadsEngineText = dataOfEngine && raw && where.startsWith(`${from}/tests/`) && below[0] === "src";
      if (testReadsEngineText) continue; // TEST-READS-ENGINE-TEXT
      if (below[0] === "data" && declaresData && (dataOfEngine || dataOfDemo || dataOfDataPackage)) continue; // DATA-OF-ENGINE, DATA-OF-DEMO, DATA-OF-DATA-PACKAGE
      offences.push(`${where}: glob into ${name} (${pattern}); only a data/* glob into the engine (any package) or into a demo (the site) is allowed, never code`);
    }
  }
  return offences;
}

/** Which package may import which: the engine's code none, a data package only the engine, a demo the engine and the data packages, the site those and the demos. */
function directionOffence(from: string, first: string, where: string): string | null {
  if (from === ENGINE) return isData(first) && isEngineTestFile(where) ? null : `${where}: the engine imports ${first}`;
  if (isData(from)) return first === ENGINE ? null : `${where}: data package ${from} imports ${first}`;
  if (isDemo(from)) return first === ENGINE || isData(first) ? null : `${where}: demo ${from} imports ${first}`;
  if (from === SITE) return first === ENGINE || isDemo(first) || isData(first) ? null : `${where}: imports ${first}`;
  return null;
}

/** Offences of a public-API demo's `src/`: every import that is not relative must be exactly `astraeus`. */
function publicApiOffences(from: string, where: string, text: string): string[] {
  const offences: string[] = [];
  for (const raw of specifiers(text)) {
    const spec = raw.split("?")[0];
    if (spec.startsWith(".") || spec === ENGINE) continue;
    offences.push(`${where}: ${from} is built on the public API and may import only "${ENGINE}", not ${spec}`);
  }
  return offences;
}

function boundaryOffences(packagesDir: string, publicApiDemos: ReadonlySet<string> = PUBLIC_API_DEMOS): string[] {
  const packages = loadPackages(packagesDir);
  const byDir = new Map([...packages].map(([name, info]) => [info.dir, name]));
  const offences: string[] = [];
  for (const [from, info] of packages) {
    for (const file of sourceFiles(info.dir)) {
      const where = relative(packagesDir, file).split(sep).join("/");
      const text = readFileSync(file, "utf8");
      offences.push(...globOffences(packages, packagesDir, from, file, where, text));
      if (publicApiDemos.has(from) && relative(info.dir, file).split(sep)[0] === "src") offences.push(...publicApiOffences(from, where, text));
      for (const raw of specifiers(text)) {
        const spec = raw.split("?")[0];
        if (spec.startsWith(".")) {
          const target = resolve(dirname(file), spec);
          for (const [dir, name] of byDir) if (name !== from && (target === dir || target.startsWith(dir + sep))) offences.push(`${where}: relative path into ${name} (${raw}); import its declared entry instead`);
          continue;
        }
        const [first, ...rest] = spec.split("/");
        const target = packages.get(first);
        if (!target || first === from) continue;
        const direction = directionOffence(from, first, where);
        if (direction !== null) offences.push(direction);
        const entry = exportTarget(target.exports, rest.length ? `./${rest.join("/")}` : ".");
        if (entry === undefined) offences.push(`${where}: ${spec} is not an entry ${first} declares in exports`);
        else if (!existsSync(join(target.dir, entry))) offences.push(`${where}: ${spec} points at ${entry}, which does not exist`);
      }
    }
  }
  return offences.sort();
}

/** A scratch `packages/` folder with made-up packages: an engine, a demo, a second demo and a site, each with one source file. */
function scratchPackages(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "astraeus-boundaries-"));
  const manifests: Record<string, object> = {
    [ENGINE]: { name: ENGINE, exports: { ".": "./src/core/clock.ts", "./core/*": "./src/core/*.ts", "./data/*": "./data/*" } },
    "astraeus-demo-a": { name: "astraeus-demo-a", exports: { "./things/*": "./src/things/*.ts", "./data/*": "./data/*" } },
    "astraeus-demo-b": { name: "astraeus-demo-b", exports: {} },
    [SITE]: { name: SITE, exports: {} },
  };
  for (const [name, manifest] of Object.entries(manifests)) {
    mkdirSync(join(dir, name, "src", "core"), { recursive: true });
    mkdirSync(join(dir, name, "src", "things"), { recursive: true });
    mkdirSync(join(dir, name, "tests"), { recursive: true });
    writeFileSync(join(dir, name, "package.json"), JSON.stringify(manifest));
  }
  mkdirSync(join(dir, ENGINE, "data"), { recursive: true });
  mkdirSync(join(dir, "astraeus-demo-a", "data"), { recursive: true });
  writeFileSync(join(dir, ENGINE, "src/core/clock.ts"), "export const clock = 1;\n");
  writeFileSync(join(dir, "astraeus-demo-a", "src/things/thing.ts"), "export const thing = 1;\n");
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
}
const GLOB = "import.meta" + ".glob";
const use = (spec: string) => `import "${spec}";\n`;

describe("package boundaries (ARCH-03)", () => {
  it("holds across the real packages", () => {
    const packagesDir = resolve(__dirname, "../..");
    expect(loadPackages(packagesDir).size).toBe(12);
    expect(boundaryOffences(packagesDir)).toEqual([]);
  });

  it("accepts imports through the package name and a declared entry", () => {
    const dir = scratchPackages({
      "astraeus-demo-a/src/things/use.ts": use("astraeus/core/clock"),
      [`${SITE}/src.ts`]: use("astraeus/core/clock") + use("astraeus-demo-a/things/thing?raw") + use("../../docs/evidence/x.txt"),
    });
    try { expect(boundaryOffences(dir)).toEqual([]); } finally { rmSync(dir, { recursive: true }); }
  });

  it("lets the data packages be imported by tests, demos and the site, and by no engine code", () => {
    const dir = scratchPackages({
      "astraeus-data-x/package.json": JSON.stringify({ name: "astraeus-data-x", exports: { ".": "./src/index.ts", "./data/*": "./data/*" } }),
      "astraeus-data-x/src/index.ts": use("astraeus/core/clock"),
      "astraeus-data-x/data/a.json": "{}",
      [`${ENGINE}/tests/uses.ts`]: use("astraeus-data-x"),
      [`${ENGINE}/vitest.setup.ts`]: use("astraeus-data-x"),
      "astraeus-demo-a/src/things/uses.ts": use("astraeus-data-x") + `const a = ${GLOB}("../../../astraeus-data-x/data/*.json");\n`,
      [`${SITE}/src/uses.ts`]: use("astraeus-data-x"),
    });
    try { expect(boundaryOffences(dir)).toEqual([]); } finally { rmSync(dir, { recursive: true }); }
    const bad = scratchPackages({
      "astraeus-data-x/package.json": JSON.stringify({ name: "astraeus-data-x", exports: { ".": "./src/index.ts" } }),
      "astraeus-data-x/src/index.ts": use("astraeus-demo-a/things/thing"),
      [`${ENGINE}/src/core/uses.ts`]: use("astraeus-data-x"),
    });
    try {
      expect(boundaryOffences(bad)).toEqual([
        "astraeus-data-x/src/index.ts: data package astraeus-data-x imports astraeus-demo-a",
        "astraeus/src/core/uses.ts: the engine imports astraeus-data-x",
      ].sort());
    } finally { rmSync(bad, { recursive: true }); }
  });

  it("holds a demo built on the public API to the `astraeus` entry in its src, proved on a made-up offence", () => {
    const files = {
      "astraeus-demo-a/src/things/ok.ts": use("astraeus") + use("./thing") + use("../../data/x.json"),
      "astraeus-demo-a/src/things/deep.ts": use("astraeus/core/clock"),
      "astraeus-demo-a/src/things/app.ts": use("astraeus/app/App"),
      "astraeus-demo-a/src/things/data.ts": use("astraeus-data-x"),
      "astraeus-demo-a/tests/usesInternals.ts": use("astraeus/core/clock"),
      [`${SITE}/src/deep.ts`]: use("astraeus/core/clock"),
    };
    const dir = scratchPackages(files);
    try {
      expect(boundaryOffences(dir, new Set(["astraeus-demo-a"]))).toEqual([
        'astraeus-demo-a/src/things/app.ts: astraeus-demo-a is built on the public API and may import only "astraeus", not astraeus/app/App',
        'astraeus-demo-a/src/things/data.ts: astraeus-demo-a is built on the public API and may import only "astraeus", not astraeus-data-x',
        'astraeus-demo-a/src/things/deep.ts: astraeus-demo-a is built on the public API and may import only "astraeus", not astraeus/core/clock',
        "astraeus-demo-a/src/things/app.ts: astraeus/app/App is not an entry astraeus declares in exports",
      ].sort());
      // The same files are fine for a demo that has not taken the rule on.
      expect(boundaryOffences(dir).some((line) => line.includes("built on the public API"))).toBe(false);
    } finally { rmSync(dir, { recursive: true }); }
  });

  it("fails each kind of bad import", () => {
    const dir = scratchPackages({
      "astraeus-demo-a/src/things/deep.ts": use("../../../astraeus/src/core/clock"),
      "astraeus-demo-a/src/things/undeclared.ts": use("astraeus/src/core/clock"),
      "astraeus-demo-a/src/things/sibling.ts": use("astraeus-demo-b/anything"),
      "astraeus-demo-a/src/things/site.ts": use("astraeus-site/main"),
      "astraeus-demo-b/src/missing.ts": use("astraeus/core/nothing"),
      [`${ENGINE}/src/core/up.ts`]: use("astraeus-demo-a/things/thing"),
      [`${SITE}/src/deep.ts`]: use("../../astraeus-demo-a/src/things/thing"),
    });
    try {
      expect(boundaryOffences(dir)).toEqual([
        "astraeus-demo-a/src/things/deep.ts: relative path into astraeus (../../../astraeus/src/core/clock); import its declared entry instead",
        "astraeus-demo-a/src/things/sibling.ts: demo astraeus-demo-a imports astraeus-demo-b",
        "astraeus-demo-a/src/things/sibling.ts: astraeus-demo-b/anything is not an entry astraeus-demo-b declares in exports",
        "astraeus-demo-a/src/things/site.ts: demo astraeus-demo-a imports astraeus-site",
        "astraeus-demo-a/src/things/site.ts: astraeus-site/main is not an entry astraeus-site declares in exports",
        "astraeus-demo-a/src/things/undeclared.ts: astraeus/src/core/clock is not an entry astraeus declares in exports",
        "astraeus-demo-b/src/missing.ts: astraeus/core/nothing points at ./src/core/nothing.ts, which does not exist",
        "astraeus-site/src/deep.ts: relative path into astraeus-demo-a (../../astraeus-demo-a/src/things/thing); import its declared entry instead",
        "astraeus/src/core/up.ts: the engine imports astraeus-demo-a",
      ].sort());
    } finally { rmSync(dir, { recursive: true }); }
  });

  it("reads import.meta.glob patterns, string and array forms, and allows only the named data rules", () => {
    const dir = scratchPackages({
      "astraeus-demo-a/src/things/okData.ts": `const a = ${GLOB}<unknown>("../../../astraeus/data/bodies/{io,europa}/*.json", { eager: true });\n`,
      [`${SITE}/src/okData.ts`]: `const a = ${GLOB}(["../../astraeus-demo-a/data/*.json", "!../../astraeus-demo-a/data/x/*"], { eager: true });\nconst b = ${GLOB}("../../astraeus/data/**/*.bin");\n`,
      "astraeus-demo-a/src/things/codeGlob.ts": `const a = ${GLOB}("../../../astraeus/src/core/*.ts");\n`,
      "astraeus-demo-a/src/things/arrayGlob.ts": `const a = ${GLOB}<Record<string, unknown>>(["../../../astraeus/data/*.json", "../../../astraeus/tools/**/*.mjs"]);\n`,
      "astraeus-demo-a/src/things/demoData.ts": `const a = ${GLOB}("../../../astraeus-demo-b/data/*.json");\n`,
      [`${SITE}/src/demoCode.ts`]: `const a = ${GLOB}<Record<string, unknown>>("../../astraeus-demo-a/src/things/*.ts");\n`,
      [`${ENGINE}/src/core/engineGlob.ts`]: `const a = ${GLOB}("../../../astraeus-demo-a/data/*.json");\n`,
      [`${SITE}/src/ownTests.ts`]: `const a = ${GLOB}("../../astraeus/tests/*.ts");\n`,
      [`${SITE}/tests/readsText.ts`]: `const a = ${GLOB}("../../astraeus/src/core/*.ts", { query: "?raw", import: "default", eager: true });\n`,
      [`${SITE}/tests/importsCode.ts`]: `const a = ${GLOB}("../../astraeus/src/core/*.ts", { eager: true });\n`,
      [`${SITE}/src/readsTextNotInTests.ts`]: `const a = ${GLOB}("../../astraeus/src/core/*.ts", { query: "?raw" });\n`,
      [`${SITE}/src/wildName.ts`]: `const a = ${GLOB}("../../*/src/**/*.ts");\n`,
      [`${SITE}/src/partialName.ts`]: `const a = ${GLOB}("../../astraeus-demo-*/src/**/*.ts");\n`,
      [`${SITE}/src/braceName.ts`]: `const a = ${GLOB}("../../{astraeus,astraeus-demo-a}/src/**/*.ts");\n`,
      [`${SITE}/src/deepStar.ts`]: `const a = ${GLOB}("../../**/src/*.ts");\n`,
      [`${SITE}/src/rootStart.ts`]: `const a = ${GLOB}("/packages/astraeus-demo-a/src/things/*.ts");\n`,
      [`${SITE}/src/rootWild.ts`]: `const a = ${GLOB}("/packages/*/src/things/*.ts");\n`,
      [`${SITE}/tests/wildRaw.ts`]: `const a = ${GLOB}("../../*/src/**/*.ts", { query: "?raw" });\n`,
      [`${SITE}/tests/laterComment.ts`]: `const a = ${GLOB}("../../astraeus/src/core/*.ts", { eager: true });\n// the other one reads ?raw text\n`,
      [`${SITE}/src/deep/tests/notTopLevel.ts`]: `const a = ${GLOB}("../../../../astraeus/src/core/*.ts", { query: "?raw" });\n`,
      [`${SITE}/src/braceSlash.ts`]: `const a = ${GLOB}("../../{astraeus-demo-a/src,astraeus-demo-b/src}/**/*.ts");\n`,
      [`${SITE}/src/baseOption.ts`]: `const a = ${GLOB}("./things/*.ts", { base: "../../astraeus-demo-a/src" });\n`,
      [`${SITE}/src/own.ts`]: `const a = ${GLOB}("./pages/*.ts");\n`,
    });
    const message = (where: string, name: string, pattern: string) => `${where}: glob into ${name} (${pattern}); only a data/* glob into the engine (any package) or into a demo (the site) is allowed, never code`;
    try {
      expect(boundaryOffences(dir)).toEqual([
        message("astraeus-demo-a/src/things/arrayGlob.ts", "astraeus", "../../../astraeus/tools/**/*.mjs"),
        message("astraeus-demo-a/src/things/codeGlob.ts", "astraeus", "../../../astraeus/src/core/*.ts"),
        message("astraeus-demo-a/src/things/demoData.ts", "astraeus-demo-b", "../../../astraeus-demo-b/data/*.json"),
        message("astraeus-site/src/demoCode.ts", "astraeus-demo-a", "../../astraeus-demo-a/src/things/*.ts"),
        message("astraeus-site/src/wildName.ts", "astraeus", "../../*/src/**/*.ts"),
        message("astraeus-site/src/wildName.ts", "astraeus-demo-a", "../../*/src/**/*.ts"),
        message("astraeus-site/src/wildName.ts", "astraeus-demo-b", "../../*/src/**/*.ts"),
        message("astraeus-site/src/partialName.ts", "astraeus-demo-a", "../../astraeus-demo-*/src/**/*.ts"),
        message("astraeus-site/src/partialName.ts", "astraeus-demo-b", "../../astraeus-demo-*/src/**/*.ts"),
        message("astraeus-site/src/braceName.ts", "astraeus", "../../{astraeus,astraeus-demo-a}/src/**/*.ts"),
        message("astraeus-site/src/braceName.ts", "astraeus-demo-a", "../../{astraeus,astraeus-demo-a}/src/**/*.ts"),
        ...["astraeus", "astraeus-demo-a", "astraeus-demo-b"].map((name) => message("astraeus-site/src/deepStar.ts", name, "../../**/src/*.ts")),
        message("astraeus-site/src/rootStart.ts", "astraeus-demo-a", "/packages/astraeus-demo-a/src/things/*.ts"),
        ...["astraeus", "astraeus-demo-a", "astraeus-demo-b"].map((name) => message("astraeus-site/src/rootWild.ts", name, "/packages/*/src/things/*.ts")),
        ...["astraeus-demo-a", "astraeus-demo-b"].map((name) => message("astraeus-site/tests/wildRaw.ts", name, "../../*/src/**/*.ts")),
        message("astraeus-site/tests/laterComment.ts", "astraeus", "../../astraeus/src/core/*.ts"),
        message("astraeus-site/src/deep/tests/notTopLevel.ts", "astraeus", "../../../../astraeus/src/core/*.ts"),
        message("astraeus-site/src/readsTextNotInTests.ts", "astraeus", "../../astraeus/src/core/*.ts"),
        message("astraeus-site/tests/importsCode.ts", "astraeus", "../../astraeus/src/core/*.ts"),
        message("astraeus-site/src/ownTests.ts", "astraeus", "../../astraeus/tests/*.ts"),
        ...["astraeus-demo-a", "astraeus-demo-b"].map((name) => message("astraeus-site/src/braceSlash.ts", name, "../../{astraeus-demo-a/src,astraeus-demo-b/src}/**/*.ts")),
        message("astraeus-site/src/baseOption.ts", "astraeus-demo-a", "./things/*.ts"),
        message("astraeus/src/core/engineGlob.ts", "astraeus-demo-a", "../../../astraeus-demo-a/data/*.json"),
      ].sort());
    } finally { rmSync(dir, { recursive: true }); }
  });
});
