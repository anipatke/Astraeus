import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

// The package boundary (O-035 T-156, ARCH-03): packages meet only through the names and entries a package declares in its `exports`.
// Checked: no relative import into another package, the engine imports no other package, a demo imports only the engine, the site imports the engine and the demos,
// and every `package/entry` import is an entry the target declares (and that points at a real file).
// Vite `import.meta.glob` patterns (string or array form) are read too, because a glob cannot take a package name and so is a relative path. A glob that crosses into another package's code (`src/`, `tools/`, `tests/`) fails.
// Three named rules allow a glob into another package: DATA-OF-ENGINE (any package may glob the engine's `data/`) and DATA-OF-DEMO (the site, and only the site, may glob a demo's `data/`), both only when that package declares a `data/*` entry; and TEST-READS-ENGINE-TEXT (a file under a package's `tests/` may glob the engine's `src/` with `?raw`, to read source as text for a rule check, never to import it).
// Not checked: file paths a test or script reads at run time, and paths that leave `packages/` for the repository root (docs, vercel.json).

const ENGINE = "astraeus";
const SITE = "astraeus-site";
const isDemo = (name: string) => name.startsWith("astraeus-demo-");

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

/** The patterns of every `import.meta.glob` call (the first argument as one string or an array of strings, a leading `!` removed), and whether the call asks for the file text (`?raw`). */
function globPatterns(source: string): { pattern: string; raw: boolean }[] {
  const out: { pattern: string; raw: boolean }[] = [];
  for (const call of source.matchAll(/import\.meta\.glob\b/g)) {
    let at = call.index + call[0].length;
    let angle = 0;
    while (at < source.length && !(source[at] === "(" && angle === 0)) { if (source[at] === "<") angle++; else if (source[at] === ">") angle--; at++; }
    const rest = source.slice(at + 1).trimStart();
    const list = rest.startsWith("[") ? rest.slice(0, rest.indexOf("]")) : (/^(["'`])[^"'`]*\1/.exec(rest)?.[0] ?? "");
    const raw = /\?raw/.test(rest.slice(0, 600).split("import.meta.glob")[0]);
    for (const text of list.matchAll(/(["'`])([^"'`]*)\1/g)) out.push({ pattern: text[2].replace(/^!/, ""), raw });
  }
  return out;
}

/** The directory a glob pattern starts from: its relative path up to the first wildcard or brace. */
function globBase(pattern: string): string {
  const stop = pattern.search(/[*{[?(]/);
  return stop < 0 ? pattern : pattern.slice(0, stop);
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
function globOffences(packages: Map<string, PackageInfo>, byDir: Map<string, string>, from: string, file: string, where: string, text: string): string[] {
  const offences: string[] = [];
  for (const { pattern, raw } of globPatterns(text)) {
    if (!pattern.startsWith(".")) continue;
    const target = resolve(dirname(file), globBase(pattern));
    for (const [dir, name] of byDir) {
      if (name === from || !(target === dir || target.startsWith(dir + sep))) continue;
      const inside = relative(dir, target).split(sep).join("/");
      const within = (folder: string) => inside === folder || inside.startsWith(`${folder}/`);
      const dataOfEngine = name === ENGINE;
      const dataOfDemo = from === SITE && isDemo(name);
      const declaresData = packages.get(name)!.exports["./data/*"] !== undefined;
      const testReadsEngineText = dataOfEngine && raw && /(^|\/)tests\//.test(where.slice(from.length)) && within("src");
      if (testReadsEngineText) continue; // TEST-READS-ENGINE-TEXT
      if (within("data") && declaresData && (dataOfEngine || dataOfDemo)) continue; // DATA-OF-ENGINE, DATA-OF-DEMO
      offences.push(`${where}: glob into ${name} (${pattern}); only a data/* glob into the engine (any package) or into a demo (the site) is allowed, never code`);
    }
  }
  return offences;
}

function boundaryOffences(packagesDir: string): string[] {
  const packages = loadPackages(packagesDir);
  const byDir = new Map([...packages].map(([name, info]) => [info.dir, name]));
  const offences: string[] = [];
  for (const [from, info] of packages) {
    for (const file of sourceFiles(info.dir)) {
      const where = relative(packagesDir, file).split(sep).join("/");
      const text = readFileSync(file, "utf8");
      offences.push(...globOffences(packages, byDir, from, file, where, text));
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
        if (from === ENGINE) offences.push(`${where}: the engine imports ${first}`);
        else if (isDemo(from) && first !== ENGINE) offences.push(`${where}: demo ${from} imports ${first}`);
        else if (from === SITE && first !== ENGINE && !isDemo(first)) offences.push(`${where}: imports ${first}`);
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
    [ENGINE]: { name: ENGINE, exports: { "./core/*": "./src/core/*.ts", "./data/*": "./data/*" } },
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
  for (const [path, text] of Object.entries(files)) writeFileSync(join(dir, path), text);
  return dir;
}
const GLOB = "import.meta" + ".glob";
const use = (spec: string) => `import "${spec}";\n`;

describe("package boundaries (ARCH-03)", () => {
  it("holds across the real packages", () => {
    const packagesDir = resolve(__dirname, "../..");
    expect(loadPackages(packagesDir).size).toBe(5);
    expect(boundaryOffences(packagesDir)).toEqual([]);
  });

  it("accepts imports through the package name and a declared entry", () => {
    const dir = scratchPackages({
      "astraeus-demo-a/src/things/use.ts": use("astraeus/core/clock"),
      [`${SITE}/src.ts`]: use("astraeus/core/clock") + use("astraeus-demo-a/things/thing?raw") + use("../../docs/evidence/x.txt"),
    });
    try { expect(boundaryOffences(dir)).toEqual([]); } finally { rmSync(dir, { recursive: true }); }
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
      [`${SITE}/src/own.ts`]: `const a = ${GLOB}("./pages/*.ts");\n`,
    });
    const message = (where: string, name: string, pattern: string) => `${where}: glob into ${name} (${pattern}); only a data/* glob into the engine (any package) or into a demo (the site) is allowed, never code`;
    try {
      expect(boundaryOffences(dir)).toEqual([
        message("astraeus-demo-a/src/things/arrayGlob.ts", "astraeus", "../../../astraeus/tools/**/*.mjs"),
        message("astraeus-demo-a/src/things/codeGlob.ts", "astraeus", "../../../astraeus/src/core/*.ts"),
        message("astraeus-demo-a/src/things/demoData.ts", "astraeus-demo-b", "../../../astraeus-demo-b/data/*.json"),
        message("astraeus-site/src/demoCode.ts", "astraeus-demo-a", "../../astraeus-demo-a/src/things/*.ts"),
        message("astraeus-site/src/readsTextNotInTests.ts", "astraeus", "../../astraeus/src/core/*.ts"),
        message("astraeus-site/tests/importsCode.ts", "astraeus", "../../astraeus/src/core/*.ts"),
        message("astraeus-site/src/ownTests.ts", "astraeus", "../../astraeus/tests/*.ts"),
        message("astraeus/src/core/engineGlob.ts", "astraeus-demo-a", "../../../astraeus-demo-a/data/*.json"),
      ].sort());
    } finally { rmSync(dir, { recursive: true }); }
  });
});
