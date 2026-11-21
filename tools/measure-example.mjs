// Measures what an example app downloads on first open (O-043 T-178): `npm run measure:example [hello-scene]`.
// Builds the example through tools/build-example.mjs, then reads the emitted index.html and follows the entry script's STATIC imports (dynamic import() is on demand and left out).
// First-open files are the module scripts, modulepreloads, stylesheets and their static imports; every other .js or .css in the build is on demand. Pictures and JSON data are not counted.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { buildExample } from "./build-example.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Files named by the page's script, modulepreload and stylesheet tags, as paths relative to the build folder. */
function pageFiles(html) {
  const files = [];
  for (const tag of html.match(/<(?:script|link)\b[^>]*>/g) ?? []) {
    const isScript = /^<script/.test(tag) && /type="module"/.test(tag);
    const isLink = /rel="(?:modulepreload|stylesheet)"/.test(tag);
    const target = /(?:src|href)="([^"]+)"/.exec(tag)?.[1];
    if ((isScript || isLink) && target) files.push(target.replace(/^\//, ""));
  }
  return files;
}

/** The scripts a script imports statically (`import"./a.js"`, `from"./a.js"`, `export*from"./a.js"`); `import("./a.js")` is dynamic and not followed. */
function staticImports(source) {
  const found = [];
  for (const match of source.matchAll(/(?:\bfrom|\bimport)\s*["'](\.{1,2}\/[^"']+\.js)["']/g)) found.push(match[1]);
  return found;
}

/** Counts a build folder: every .js and .css file with raw and gzip bytes, marked first-open or on-demand, and the first-open totals. */
export function measureBuild(dir) {
  const html = readFileSync(join(dir, "index.html"), "utf8");
  const firstOpen = new Set();
  const queue = pageFiles(html)
    .filter((file) => !/^[a-z]+:/i.test(file))
    .map((file) => ({ file, from: "index.html" }));
  while (queue.length > 0) {
    const { file, from } = queue.shift();
    if (firstOpen.has(file)) continue;
    // A missing first-open file would make the total too small, so the measure fails rather than skipping it (C-116 O2).
    if (!existsSync(join(dir, file))) throw new Error(`measure-example: ${from} loads ${file}, which is not in ${dir}`);
    firstOpen.add(file);
    if (file.endsWith(".js"))
      for (const spec of staticImports(readFileSync(join(dir, file), "utf8")))
        queue.push({ file: posix.normalize(posix.join(posix.dirname(file), spec)), from: file });
  }
  const all = [];
  const walk = (sub) => {
    for (const entry of readdirSync(join(dir, sub), { withFileTypes: true })) {
      const path = sub ? `${sub}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(path);
      else if (/\.(js|css)$/.test(entry.name)) all.push(path);
    }
  };
  walk("");
  const rows = all.sort().map((file) => {
    const bytes = readFileSync(join(dir, file));
    return {
      file,
      raw: bytes.length,
      gzip: gzipSync(bytes).length,
      when: firstOpen.has(file) ? "first-open" : "on-demand",
    };
  });
  const totals = { raw: 0, gzip: 0 };
  for (const row of rows)
    if (row.when === "first-open") {
      totals.raw += row.raw;
      totals.gzip += row.gzip;
    }
  return { rows, totals };
}

/** The fixed-format table: file, raw bytes, gzip bytes, when; then the first-open totals. */
export function formatMeasure({ rows, totals }) {
  const lines = ["file\traw\tgzip\twhen", ...rows.map((row) => `${row.file}\t${row.raw}\t${row.gzip}\t${row.when}`)];
  lines.push(`first-open total\t${totals.raw}\t${totals.gzip}\t`);
  return lines.join("\n");
}

/** The astraeus-data pictures an example's build may emit, by file name without the hash (O-076 T-321): `hello-sky` imports `astraeus-data/milky-way`, so its build copies the Milky Way alone, never the moon and Venus maps. The engine's own planet pictures are not astraeus-data's and are not checked. Examples not listed are not checked. */
export const ALLOWED_PICTURES = { "hello-sky": ["milky-way"] };

/** The names (no extension) of every picture in astraeus-data, from its textures folder. */
export const dataPictureNames = () =>
  readdirSync(join(root, "packages", "astraeus-data", "src", "textures"))
    .filter((file) => /\.jpe?g$/i.test(file))
    .map((file) => file.replace(/\.jpe?g$/i, ""));

/** The `.jpg` files in a build folder that are one of `dataPictures` but not in `allowed` (an emitted name is the picture's name and a hash: `titan-4k-9d8e7f.jpg` is `titan-4k`). */
export function unexpectedPictures(dir, allowed, dataPictures = dataPictureNames()) {
  const found = [];
  const walk = (sub) => {
    for (const entry of readdirSync(join(dir, sub), { withFileTypes: true })) {
      const path = sub ? `${sub}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      const name = /^(.+?)(?:-[A-Za-z0-9_-]{6,8})?\.jpe?g$/i.exec(entry.name);
      if (!name) continue;
      const picture = dataPictures.find(
        (candidate) => entry.name.startsWith(`${candidate}-`) || entry.name === `${candidate}.jpg`,
      );
      if (picture !== undefined && !allowed.includes(picture)) found.push(path);
    }
  };
  walk("");
  return found.sort();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const name = process.argv[2] ?? "hello-scene";
  buildExample(name);
  const dir = join(root, "examples", name, "dist");
  console.log(formatMeasure(measureBuild(dir)));
  const allowed = ALLOWED_PICTURES[name];
  if (allowed) {
    const extra = unexpectedPictures(dir, allowed);
    if (extra.length > 0)
      throw new Error(`measure-example: ${name} emitted pictures it should not: ${extra.join(", ")}`);
    console.log(`pictures: only ${allowed.join(", ")} emitted`);
  }
}
