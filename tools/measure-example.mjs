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
  const queue = pageFiles(html);
  while (queue.length > 0) {
    const file = queue.shift();
    if (firstOpen.has(file) || !existsSync(join(dir, file))) continue;
    firstOpen.add(file);
    if (file.endsWith(".js")) for (const spec of staticImports(readFileSync(join(dir, file), "utf8"))) queue.push(posix.normalize(posix.join(posix.dirname(file), spec)));
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
    return { file, raw: bytes.length, gzip: gzipSync(bytes).length, when: firstOpen.has(file) ? "first-open" : "on-demand" };
  });
  const totals = { raw: 0, gzip: 0 };
  for (const row of rows) if (row.when === "first-open") { totals.raw += row.raw; totals.gzip += row.gzip; }
  return { rows, totals };
}

/** The fixed-format table: file, raw bytes, gzip bytes, when; then the first-open totals. */
export function formatMeasure({ rows, totals }) {
  const lines = ["file\traw\tgzip\twhen", ...rows.map((row) => `${row.file}\t${row.raw}\t${row.gzip}\t${row.when}`)];
  lines.push(`first-open total\t${totals.raw}\t${totals.gzip}\t`);
  return lines.join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const name = process.argv[2] ?? "hello-scene";
  buildExample(name);
  console.log(formatMeasure(measureBuild(join(root, "examples", name, "dist"))));
}
