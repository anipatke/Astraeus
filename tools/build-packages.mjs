// Builds the publishable packages (O-036 T-161): `node tools/build-packages.mjs [astraeus astraeus-data ...]` (default: all, engine first).
// Each package is built into <package>/dist, which is the folder `npm pack` / `npm publish` takes:
//   1. tsc compiles src/ to plain ES modules with .d.ts (Vite library mode was rejected: it pasted every picture into the code).
//   2. A picture or `?url` import becomes `new URL("./x.jpg", import.meta.url).href` and the file is copied, so a customer's bundler (Vite, webpack 5,
//      Parcel) emits it as an asset; `__PUBLIC_BUILD__` becomes `false`.
//   3. Data folders are hard-linked (copied across file systems), the manifest is rewritten from the source manifest's `x-publish` block, and the
//      README, LICENSE, NOTICE and licenses are added. A data package gets `src/chunks.js`: a literal URL for each position chunk, so a build copies
//      only the chunk files of the systems it imports.
//   4. A named import from a .json file becomes a default import plus a destructuring (webpack 5 allows only the default export of JSON in an ES module).
//   5. Relative imports and exports get their `.js` (or `/index.js`) written out, because the packages are `"type": "module"` and webpack 5 treats those
//      as fully specified (I-077). Plain Node and bare browser modules still cannot load the code: a package like `astraeus` imports CSS and pictures.
import { spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, linkSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const PACKAGES = ["astraeus", "astraeus-data", "astraeus-data-jupiter", "astraeus-data-saturn", "astraeus-data-uranus", "astraeus-data-neptune", "astraeus-data-mars", "astraeus-data-pluto"];
const ASSET = /\.(?:jpg|jpeg|png|webp)$/;

function walk(dir, visit) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, visit);
    else visit(path);
  }
}

/** Hard-link a folder tree (copy when the file system refuses), skipping git-ignored local data. */
function linkTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    if (entry.name === "local" || entry.name === ".horizons-cache") continue;
    const source = join(from, entry.name);
    const target = join(to, entry.name);
    if (entry.isDirectory()) linkTree(source, target);
    else if (!existsSync(target)) {
      try { linkSync(source, target); } catch { copyFileSync(source, target); }
    }
  }
}

/** Rewrites asset and ?url imports in the compiled files of `out`, copying each file from `pkg` (the source tree the compiled one mirrors). */
function rewriteAssets(out, pkg) {
  let count = 0;
  walk(out, (file) => {
    if (!file.endsWith(".js")) return;
    const before = readFileSync(file, "utf8");
    let text = before.replace(/^import (\w+) from "(\.[^"?]+)(\?url)?";$/gm, (whole, name, rel, query) => {
      if (!ASSET.test(rel) && query === undefined) return whole;
      const dest = resolve(dirname(file), rel);
      const source = resolve(pkg, relative(out, dest));
      if (!existsSync(source)) throw new Error(`${file}: ${rel} is not in ${source}`);
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(source, dest);
      count += 1;
      return `const ${name} = new URL(${JSON.stringify(rel)}, import.meta.url).href;`;
    });
    text = text.replace(/\b__PUBLIC_BUILD__\b/g, "false");
    if (text !== before) writeFileSync(file, text);
  });
  return count;
}

/** `import { a as b, c } from "x.json";` becomes a default import and `const { a: b, c } = ...;` (I-077: webpack 5 allows only the default export of JSON). */
function defaultJsonImports(out) {
  let count = 0;
  walk(out, (file) => {
    if (!file.endsWith(".js")) return;
    const before = readFileSync(file, "utf8");
    const text = before.replace(/^import \{([^}]+)\} from ("[^"]+\.json");$/gm, (whole, names, spec) => {
      count += 1;
      const holder = `json${count}`;
      return `import ${holder} from ${spec};\nconst { ${names.split(",").map((one) => one.trim().replace(/\s+as\s+/, ": ")).join(", ")} } = ${holder};`;
    });
    if (text !== before) writeFileSync(file, text);
  });
}

/** A relative specifier made fully specified: `./scene` becomes `./scene.js` or, for a folder, `./api/index.js`. Other specifiers are returned as they are. */
function fullySpecified(file, spec) {
  if (!spec.startsWith(".") || /\.[a-z]+$/i.test(spec.replace(/^(\.\.?\/)+/, ""))) return spec;
  const target = resolve(dirname(file), spec);
  if (existsSync(`${target}.js`) || existsSync(`${target}.d.ts`)) return `${spec}.js`;
  if (existsSync(join(target, "index.js")) || existsSync(join(target, "index.d.ts"))) return `${spec.replace(/\/$/, "")}/index.js`;
  throw new Error(`${file}: cannot resolve ${spec}`);
}

/** Writes the extension into every relative `from "x"`, `import "x"`, `import("x")` and `export ... from "x"` of the compiled .js and .d.ts files in `out`. */
function addExtensions(out) {
  walk(out, (file) => {
    if (!file.endsWith(".js") && !file.endsWith(".d.ts")) return;
    const before = readFileSync(file, "utf8");
    const text = before.replace(/(\bfrom\s*|\bimport\s*\(?\s*|\bimport\s+)(["'])(\.[^"']*)\2/g, (whole, lead, quote, spec) => `${lead}${quote}${fullySpecified(file, spec)}${quote}`);
    if (text !== before) writeFileSync(file, text);
  });
}

/** The chunk list of a position package: one literal URL per `<moon>/<year>.bin`. */
function writeChunkList(pkg, out) {
  const data = readdirSync(join(pkg, "data")).filter((name) => name.endsWith("-moons"));
  const lines = [];
  for (const set of data) {
    for (const moon of readdirSync(join(pkg, "data", set)).sort()) {
      const folder = join(pkg, "data", set, moon);
      if (!statSync(folder).isDirectory()) continue;
      for (const file of readdirSync(folder).sort()) {
        if (file.endsWith(".bin")) lines.push(`  ${JSON.stringify(`${moon}/${file}`)}: new URL(${JSON.stringify(`../data/${set}/${moon}/${file}?no-inline`)}, import.meta.url).href,`);
      }
    }
  }
  writeFileSync(join(out, "src", "chunks.js"), `// Generated by tools/build-packages.mjs: ${lines.length} chunk files.\nexport const chunkUrls = Object.freeze({\n${lines.join("\n")}\n});\n`);
  // tsc does not copy a hand-written .d.ts, so the list's declaration goes beside it (TypeScript users would otherwise see `chunkUrls` as any).
  copyFileSync(join(pkg, "src", "chunks.d.ts"), join(out, "src", "chunks.d.ts"));
  return lines.length;
}

export function buildPackage(name) {
  const pkg = join(root, "packages", name);
  const out = join(pkg, "dist");
  const manifest = JSON.parse(readFileSync(join(pkg, "package.json"), "utf8"));
  const publish = manifest["x-publish"];
  if (publish === undefined) throw new Error(`${name}: package.json has no x-publish block`);
  rmSync(out, { recursive: true, force: true });

  // 1. tsc
  const config = join(pkg, "tsconfig.build.tmp.json");
  const paths = name === "astraeus" ? {} : { astraeus: [join(root, "packages", "astraeus", "dist", "src", "api", "index.d.ts")] };
  writeFileSync(config, JSON.stringify({
    extends: join(root, "tsconfig.json"),
    compilerOptions: { noEmit: false, declaration: true, rootDir: pkg, outDir: out, paths, types: ["vite/client"] },
    include: [join(pkg, "src"), ...(existsSync(join(pkg, "data")) && name === "astraeus" ? [join(pkg, "data")] : [])],
  }));
  const tsc = spawnSync(process.execPath, [join(root, "node_modules", "typescript", "bin", "tsc"), "-p", config], { cwd: root, encoding: "utf8" });
  rmSync(config, { force: true });
  if (tsc.status !== 0) throw new Error(`${name}: tsc failed\n${tsc.stdout}${tsc.stderr}`);

  // 2. pictures and ?url files
  const assets = rewriteAssets(out, pkg);
  defaultJsonImports(out);
  addExtensions(out);

  // 3. data, chunk list, style, manifest and notices
  // The engine ships only the data its code imports (tsc emitted it); a data package ships its whole data folder.
  if (publish.linkData === true) linkTree(join(pkg, "data"), join(out, "data"));
  walk(join(pkg, "src"), (file) => {
    if (!file.endsWith(".css")) return;
    const dest = join(out, relative(pkg, file));
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(file, dest);
  });
  const chunks = name.startsWith("astraeus-data-") ? writeChunkList(pkg, out) : 0;
  for (const file of ["README.md", "CHANGELOG.md", "NOTICE"]) if (existsSync(join(pkg, file))) copyFileSync(join(pkg, file), join(out, file));
  copyFileSync(join(root, "LICENSE"), join(out, "LICENSE"));
  if (existsSync(join(pkg, "licenses"))) cpSync(join(pkg, "licenses"), join(out, "licenses"), { recursive: true });
  const { "x-publish": _publishBlock, "x-internal-exports": _internal, devDependencies: _dev, ...rest } = manifest;
  const published = { ...rest, exports: publish.exports, types: publish.exports["."].types, files: publish.files };
  writeFileSync(join(out, "package.json"), `${JSON.stringify(published, null, 2)}\n`);
  return { name, out, assets, chunks };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const wanted = process.argv.slice(2);
  const names = wanted.length > 0 ? wanted : PACKAGES;
  const started = Date.now();
  for (const name of PACKAGES.filter((one) => names.includes(one))) {
    const result = buildPackage(name);
    console.log(`built ${name}: ${result.assets} pictures rewritten${result.chunks > 0 ? `, ${result.chunks} chunk URLs` : ""}`);
  }
  console.log(`done in ${((Date.now() - started) / 1000).toFixed(1)} s`);
}
