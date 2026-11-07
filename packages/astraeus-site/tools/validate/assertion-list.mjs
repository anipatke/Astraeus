// The list of every assertion the browser check can raise (O-060 T-281): for each script in tools/validate, the text of each call that can fail the run
// (`assert.*(...)`, `new Error(...)`, `assertStreamDrawn(...)`, `assertScaleInUse(...)`, `problems.push(...)`, `failures.push(...)`, `errors.push(...)`, `process.exit(...)`).
// `tests/browserAssertions.test.ts` holds the current scripts to the list built from baseline commit 6aad8e6a (`tests/fixtures/browserAssertionsBaseline.json`), so removing or
// loosening one fails a test. Rebuild the baseline list (reads the commit with git, never the working tree):
//   node packages/astraeus-site/tools/validate/assertion-list.mjs 6aad8e6a > packages/astraeus-site/tests/fixtures/browserAssertionsBaseline.json
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CALLS = /(?:\bassert\.[A-Za-z]+|\bassert|\bnew Error|\bassertStreamDrawn|\bassertScaleInUse|\b(?:problems|failures|errors)\.push|\bprocess\.exit)\s*\(/y;

/** Index just past the string or template literal starting at `i` (a template's `${...}` parts are skipped whole). */
function skipQuoted(text, i) {
  const quote = text[i];
  let k = i + 1;
  while (k < text.length && text[k] !== quote) {
    if (text[k] === "\\") k += 1;
    else if (quote === "`" && text[k] === "$" && text[k + 1] === "{") k = skipBraces(text, k + 1);
    k += 1;
  }
  return k + 1;
}

/** Index of the `}` closing the `{` at `i`. */
function skipBraces(text, i) {
  let depth = 0;
  for (let k = i; k < text.length; k += 1) {
    const c = text[k];
    if (c === '"' || c === "'" || c === "`") k = skipQuoted(text, k) - 1;
    else if (c === "{") depth += 1;
    else if (c === "}" && (depth -= 1) === 0) return k;
  }
  return text.length;
}

/** Index just past the `)` closing the `(` at `i`. */
function skipParens(text, i) {
  let depth = 0;
  for (let k = i; k < text.length; k += 1) {
    const c = text[k];
    if (c === '"' || c === "'" || c === "`") k = skipQuoted(text, k) - 1;
    else if (c === "/" && text[k + 1] === "/") k = text.indexOf("\n", k) - 1 < k ? text.length : text.indexOf("\n", k) - 1;
    else if (c === "/" && text[k + 1] === "*") k = text.indexOf("*/", k) + 1;
    else if (c === "(") depth += 1;
    else if (c === ")" && (depth -= 1) === 0) return k + 1;
  }
  return text.length;
}

/** The assertion calls in one source text, each as its whitespace-normalised text, in source order (comments and string contents are not searched). */
export function extractAssertions(source) {
  const found = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (c === '"' || c === "'" || c === "`") { i = skipQuoted(source, i); continue; }
    if (c === "/" && source[i + 1] === "/") { const end = source.indexOf("\n", i); i = end < 0 ? source.length : end; continue; }
    if (c === "/" && source[i + 1] === "*") { const end = source.indexOf("*/", i); i = end < 0 ? source.length : end + 2; continue; }
    CALLS.lastIndex = i;
    const match = /[A-Za-z_$.]/.test(source[i - 1] ?? " ") ? null : CALLS.exec(source);
    if (match !== null && !/\bfunction\s+$/.test(source.slice(Math.max(0, i - 12), i))) {
      const end = skipParens(source, i + match[0].length - 1);
      found.push(source.slice(i, end).replace(/\s+/g, " "));
      i = end;
    } else i += 1;
  }
  return found;
}

/** { script: [assertion, ...] } for every .mjs script in tools/validate, read from `read(name)`. */
export function listAssertions(names, read) {
  return Object.fromEntries(names.filter((name) => name !== "assertion-list.mjs").sort().map((name) => [name, extractAssertions(read(name))]));
}

export function currentAssertions() {
  const names = readdirSync(here).filter((name) => name.endsWith(".mjs"));
  return listAssertions(names, (name) => readFileSync(join(here, name), "utf8"));
}

/** The same list as it was at `commit`, read with git. */
export function assertionsAt(commit) {
  const dir = "packages/astraeus-site/tools/validate";
  const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 2 ** 26, cwd: join(here, "..", "..", "..", "..") });
  const names = git("ls-tree", "--name-only", commit, `${dir}/`).split("\n").filter((path) => path.endsWith(".mjs")).map((path) => path.slice(dir.length + 1));
  return listAssertions(names, (name) => git("show", `${commit}:${dir}/${name}`));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const commit = process.argv[2];
  if (commit === undefined) { console.error("usage: node assertion-list.mjs <commit>"); process.exit(2); }
  console.log(JSON.stringify({ commit, assertions: assertionsAt(commit) }, null, 1));
}
