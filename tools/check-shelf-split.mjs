// Proves the shelf is picked by import (O-080 T-334, viewer-interface note section 11): `node tools/check-shelf-split.mjs [--no-build] [--import a,b] [--allow a]`.
// Builds a throwaway page inside examples/hello-scene that imports only the parts named by `--import` (default `filterChips`) from the PACKED `astraeus` tarball, as a customer's app would, then fails
// when the emitted JS carries the marker class of any shelf part other than the allowed ones (default: those imported). CSS is not checked: the parts' sheets are in the shared stylesheet
// (the note's fallback, recorded in T-334: a view cannot import its sheet, because the Node copy of the entry files cannot load CSS, tests/interfaceLeftovers.test.ts); its bytes are printed. `--import filterChips,explainer --allow filterChips` must fail: that is the check's own proof.
// `--no-build` reuses the packed tarball already installed in examples/hello-scene (a caller that has just built the packages). Exit 0 passes, 1 fails.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { buildExample } from "./build-example.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The class each part's view and stylesheet draw with: present in a build only when that part's module tree was bundled. */
export const MARKERS = {
  panel: "shelf-panel", customBlock: "shelf-custom-block", explainer: "shelf-explainer", actions: "shelf-actions", filterChips: "shelf-chips", colourKey: "shelf-colour-key", chart: "shelf-chart",
};

/** Every .js and .css file under `dir`, as paths relative to it. */
function emitted(dir, sub = "") {
  return readdirSync(join(dir, sub), { withFileTypes: true }).flatMap((entry) => {
    const path = sub === "" ? entry.name : `${sub}/${entry.name}`;
    if (entry.isDirectory()) return emitted(dir, path);
    return /\.(js|css)$/.test(entry.name) ? [path] : [];
  });
}

/** The markers found in each emitted file of a build folder, for the parts not in `allowed`; plus the bytes of what the build emitted. */
export function findStrays(dir, allowed, imported = []) {
  const strays = [];
  const seen = new Set();
  let raw = 0, gzip = 0, css = 0;
  for (const file of emitted(dir)) {
    const bytes = readFileSync(join(dir, file));
    raw += bytes.length; gzip += gzipSync(bytes).length;
    if (file.endsWith(".css")) css += bytes.length;
    const text = bytes.toString("utf8");
    for (const [part, marker] of Object.entries(MARKERS)) if (file.endsWith(".js") && text.includes(marker)) seen.add(part);
    for (const [part, marker] of Object.entries(MARKERS)) if (file.endsWith(".js") && !allowed.includes(part) && text.includes(marker)) strays.push({ part, marker, file });
  }
  // A part the page imports must be in the build, else the check proves nothing (the page's own use was dropped).
  const missing = imported.filter((part) => !seen.has(part));
  return { strays, missing, raw, gzip, css };
}

const option = (name) => { const at = process.argv.indexOf(name); return at < 0 ? undefined : process.argv[at + 1]; };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const imports = (option("--import") ?? "filterChips").split(",").filter(Boolean);
  const used = [...new Set([...imports, ...(imports.includes("panel") ? ["customBlock"] : [])])];
  const allowed = (option("--allow") ?? used.join(",")).split(",").filter(Boolean);
  for (const part of [...imports, ...allowed]) if (!(part in MARKERS)) { console.error(`check-shelf-split: unknown part "${part}" (parts: ${Object.keys(MARKERS).join(", ")})`); process.exit(1); }
  if (!process.argv.includes("--no-build")) buildExample("hello-scene");
  const example = join(root, "examples", "hello-scene");
  const page = join(example, ".split-check");
  rmSync(page, { recursive: true, force: true });
  mkdirSync(page, { recursive: true });
  const calls = { filterChips: 'filterChips({ id: "f", choices: [{ value: "a", label: "A" }] })', explainer: 'explainer({ id: "e", paragraphs: ["x"] })', actions: 'actions({ id: "a", actions: [{ id: "go", label: "Go" }] })', colourKey: 'colourKey({ id: "k", entries: [] })',  chart: 'chart({ id: "c", axisLabel: "x", bins: [{ from: 0, to: 1, count: 1 }] })', panel: 'panel({ id: "p", button: { label: "P" }, title: "P", blocks: [customBlock({ id: "b" })] })', customBlock: 'customBlock({ id: "b" })' };
  writeFileSync(join(page, "index.html"), '<!doctype html><html><body><div id="app"></div><script type="module" src="./main.js"></script></body></html>\n');
  writeFileSync(join(page, "main.js"), `import { mount, Scene, earth, ${used.join(", ")} } from "astraeus";\nconst parts = [${used.map((part) => calls[part]).join(", ")}];\nconst scene = new Scene().addBody(earth)${imports.includes("panel") ? ".addParts([parts[0]])" : ""};\nmount(document.getElementById("app"), scene);\nconsole.log(parts.length);\n`);
  try {
    const built = spawnSync("npx", ["vite", "build", page, "--outDir", "dist", "--emptyOutDir"], { cwd: example, stdio: "inherit", shell: process.platform === "win32" });
    if (built.status !== 0) throw new Error(`vite build failed (exit ${built.status})`);
    const { strays, missing, raw, gzip, css } = findStrays(join(page, "dist"), allowed, used);
    console.log(`check-shelf-split: imported ${imports.join(", ")}; allowed ${allowed.join(", ")}; emitted ${raw} B raw, ${gzip} B gzip (css ${css} B)`);
    if (missing.length > 0) { console.error(`check-shelf-split: FAIL the page imports ${missing.join(", ")} but its marker class is not in the emitted JS: the check would prove nothing`); process.exitCode = 1; }
    if (strays.length > 0) {
      for (const { part, marker, file } of strays) console.error(`check-shelf-split: FAIL ${part} (marker "${marker}") is in ${file}, though the page does not import it`);
      process.exitCode = 1;
    } else if (missing.length === 0) console.log("check-shelf-split: ok, no other part's marker class in the emitted JS");
  } finally {
    rmSync(page, { recursive: true, force: true });
  }
}
