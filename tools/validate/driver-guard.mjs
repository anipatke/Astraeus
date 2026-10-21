// The guard for the shared interface driver (O-020 T-083): no browser script may find or operate an interface control itself.
//   node tools/validate/driver-guard.mjs        exits 1 and lists every offending line
//   tests/browserDriverGuard.test.ts            runs the same check in the unit tests
//
// THE RULE. A script in tools/validate/ or tools/validate/on-request/ reaches the interface only through `driver.mjs`. Outside the driver a script may NOT:
//   - call getByRole, getByText, getByLabel, getByPlaceholder, getByTitle or getByAltText;
//   - call click, dblclick, fill, selectOption, check, uncheck, press, focus, hover or tap on anything, or use `keyboard.`;
//   - call locator(...), querySelector(...) or querySelectorAll(...) with any selector other than the exceptions below, or with a selector it builds at run time.
//   - launch a browser (`chromium.launch`), open a page or context (`newPage`, `newContext`) or load `playwright.mjs` itself: `harness.mjs` is the one place that does (`launchBrowser`, `openPage`, `openContext`, `pageIn`, `watchErrors`, `checkScript`; O-037 T-126);
//   - take or save a screenshot (`.screenshot(`): browser checks never take or save pictures; the owner judges looks on the preview, and every check reads the scene's own readouts (data-paths, data-points, data-body-screen, the sky and frame data) instead (T-102).
// EXCEPTIONS (reads, never operation of a shell control):
//   - the scene canvas: `canvas`, and `getByTestId(...)` (a stable test id the app sets for tests);
//   - data-attribute readouts: a selector that begins `[data-` (for example `[data-label-id="sun"]`, `[data-frame-fps]`, `[data-metric="eagle-altitude"]`).
//   - `new Array(n).fill(0)` (array fill, not the browser's).
// A script that needs anything else adds a function to driver.mjs; the driver is the single place that knows what the interface looks like.
// Scripts named in OPT_OUT may be added only with a reason (none today). To move a script onto the driver: replace each flagged line with the driver function that does that thing, adding one to driver.mjs when none exists.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
/** Files that are the driver or its guard, and so may do what scripts may not. */
const OWN_FILES = new Set(["driver.mjs", "driver-guard.mjs", "harness.mjs"]);
/** Scripts allowed to bypass the rule, with the reason. Empty. */
export const OPT_OUT = new Map();

const OPERATIONS = /\.(click|dblclick|selectOption|check|uncheck|press|focus|hover|tap)\s*\(|\.fill\s*\((?!\s*0\s*\))/;
const SCREENSHOT = /\.screenshot\s*\(/;
const LAUNCH = /\bchromium\.launch\s*\(|\.(newPage|newContext)\s*\(|\bfrom\s+["'][./]*playwright\.mjs["']/;
const KEYBOARD = /\bkeyboard\./;
const BY_TEXT = /\.(getByRole|getByText|getByLabel|getByPlaceholder|getByTitle|getByAltText)\s*\(/;
const SELECTOR_CALL = /\.(locator|querySelector|querySelectorAll|waitForSelector|\$|\$\$)\s*\(\s*(?:(["'`])((?:\\.|(?!\2).)*)\2|([^)]{0,40}))/g;
const ALLOWED_SELECTOR = /^(canvas\b|\[data-)/;

/** Source with comments and whole-line noise removed, line by line (strings that contain `//` after a colon, as URLs do, are kept). */
function codeLines(text) {
  const lines = [];
  let inBlock = false;
  text.split("\n").forEach((raw, index) => {
    let line = raw;
    if (inBlock) { const end = line.indexOf("*/"); if (end < 0) return; line = line.slice(end + 2); inBlock = false; }
    line = line.replace(/\/\*.*?\*\//g, " ");
    const open = line.indexOf("/*");
    if (open >= 0) { line = line.slice(0, open); inBlock = true; }
    line = line.replace(/(^|\s)\/\/.*$/, "$1");
    lines.push({ number: index + 1, text: line });
  });
  return lines;
}

/** Every line in one file's text that reaches around the driver. */
export function violationsIn(text) {
  const found = [];
  for (const { number, text: line } of codeLines(text)) {
    const problems = [];
    if (OPERATIONS.test(line)) problems.push("operates an element directly");
    if (SCREENSHOT.test(line)) problems.push("takes a screenshot (checks read the scene's readouts; looks are judged on the preview)");
    if (LAUNCH.test(line)) problems.push("launches a browser or opens a page itself (use the harness: launchBrowser, openPage, openContext, pageIn or checkScript)");
    if (KEYBOARD.test(line)) problems.push("presses keys directly");
    if (BY_TEXT.test(line)) problems.push("finds an element by role, label or text");
    for (const match of line.matchAll(SELECTOR_CALL)) {
      const literal = match[3];
      if (literal === undefined || !ALLOWED_SELECTOR.test(literal.replace(/^\$\{[^}]*\}/, ""))) problems.push(literal === undefined ? "builds a selector at run time" : `selector ${JSON.stringify(literal)} belongs in the driver`);
    }
    if (problems.length > 0) found.push({ line: number, text: line.trim(), problems });
  }
  return found;
}

/** The browser scripts the rule covers. */
export function scriptFiles(root = here) {
  const files = [];
  for (const directory of [root, join(root, "on-request")]) {
    for (const name of readdirSync(directory)) if (name.endsWith(".mjs") && !OWN_FILES.has(name)) files.push(join(directory, name));
  }
  return files.filter((file) => !OPT_OUT.has(relative(root, file)));
}

/** Violations across every covered script: `{file, line, text, problems}`. */
export function findViolations(root = here) {
  return scriptFiles(root).flatMap((file) => violationsIn(readFileSync(file, "utf8")).map((v) => ({ file: relative(root, file), ...v })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const violations = findViolations();
  for (const v of violations) console.log(`${v.file}:${v.line}: ${v.problems.join("; ")}\n    ${v.text}`);
  console.log(violations.length === 0 ? "driver guard: every script uses the driver" : `driver guard: ${violations.length} line(s) reach around the driver`);
  process.exit(violations.length === 0 ? 0 : 1);
}
