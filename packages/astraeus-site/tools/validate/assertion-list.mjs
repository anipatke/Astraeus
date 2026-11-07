// The list of the browser check's raise sites of the forms below (O-060 T-281, I-149): for each script in tools/validate, each such site, written with the guard that decides it
// as `if (guard) => site`, or the bare site when nothing guards it. The scripts are parsed (TypeScript 6 syntax tree), not scanned; the forms are these (failure lists are found partly by name, see the last limits below):
//   - a `throw` statement, or `new XError(...)` outside one;
//   - `assert(...)`, `assert.x(...)`, any call to a function named `assert...`, and `process.exit(...)`;
//   - `.push(...)` on a failure list: a name containing problem, failure, error, fail or violation, or any array a script hands on as such a property (`problems: list`);
//   - a call to a function declared in the same script that itself holds a raise site (found by repeating until no new one appears).
// The guard is every enclosing `if`/`else`, `?:`, `&&`, `||` and `??` test, so loosening a tolerance or disabling a guard changes the entry. Text is printed from the tree: spacing and comments do not matter.
// `tests/browserAssertions.test.ts` holds the current scripts to the list built from baseline commit 6aad8e6a (`tests/fixtures/browserAssertionsBaseline.json`).
// It proves each baseline raise site of the forms above, and its guard text, still appears in the scripts (with the reviewed exceptions named in the test). It does not see a guard's meaning
// outside that text (an edit to a helper a guard calls, a changed value it reads, or an early `return` before it), and it does not see these failure routes: an exit code set by assignment
// (`process.exitCode = 1`), a failure list built by `.push` under a name that is not a failure name (`matches`, `found`), or a failure returned as a literal (`ok: false`, as in engine-budget.mjs).
// `tests/browserExitPath.test.ts` proves a failing step fails the run; the Full Objective Check's independent rebuild is what shows nothing else was lost.
// Rebuild the baseline list (reads the commit with git, never the working tree):
//   node packages/astraeus-site/tools/validate/assertion-list.mjs 6aad8e6a > packages/astraeus-site/tests/fixtures/browserAssertionsBaseline.json
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript6";

const here = dirname(fileURLToPath(import.meta.url));
const FAILURE_LIST = /problem|failure|error|fail|violation/i;
const printer = ts.createPrinter({ removeComments: true });

const nameOf = (node) => (ts.isIdentifier(node) ? node.text : ts.isPropertyAccessExpression(node) ? node.name.text : undefined);
const squash = (text) => text.replace(/\s+/g, " ").trim();

/** The arrays a script hands on as failures: `problems: list`, `{ problems }`. */
function handedOnLists(root) {
  const names = new Set();
  const visit = (node) => {
    if (ts.isPropertyAssignment(node) && FAILURE_LIST.test(node.name.getText()) && ts.isIdentifier(node.initializer)) names.add(node.initializer.text);
    ts.forEachChild(node, visit);
  };
  visit(root);
  return names;
}

/** Whether `node` is itself a raise site, given the failure-list names and the local raising functions. */
function isRaise(node, lists, raisers) {
  if (ts.isThrowStatement(node)) return true;
  if (ts.isNewExpression(node)) return /Error$/.test(node.expression.getText()) && !ts.isThrowStatement(node.parent);
  if (!ts.isCallExpression(node)) return false;
  const callee = node.expression;
  const name = nameOf(callee);
  if (ts.isIdentifier(callee)) return /^assert/.test(callee.text) || raisers.has(callee.text);
  if (!ts.isPropertyAccessExpression(callee)) return false;
  const receiver = nameOf(callee.expression);
  if (receiver === "assert" || (receiver === "process" && name === "exit")) return true;
  return name === "push" && receiver !== undefined && (FAILURE_LIST.test(receiver) || lists.has(receiver));
}

/** The tests that decide whether `node` runs, outermost first. */
function guardsOf(node) {
  const guards = [];
  for (let child = node, parent = child.parent; parent; child = parent, parent = parent.parent) {
    if (ts.isIfStatement(parent) && child !== parent.expression) {
      const test = squash(printer.printNode(ts.EmitHint.Expression, parent.expression, parent.getSourceFile()));
      guards.unshift(child === parent.thenStatement ? `(${test})` : `!(${test})`);
    } else if (ts.isConditionalExpression(parent) && child !== parent.condition) {
      const test = squash(printer.printNode(ts.EmitHint.Expression, parent.condition, parent.getSourceFile()));
      guards.unshift(child === parent.whenTrue ? `(${test})` : `!(${test})`);
    } else if (ts.isBinaryExpression(parent) && child === parent.right && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(parent.operatorToken.kind)) {
      const test = squash(printer.printNode(ts.EmitHint.Expression, parent.left, parent.getSourceFile()));
      guards.unshift(parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ? `(${test})` : `${parent.operatorToken.kind === ts.SyntaxKind.BarBarToken ? "!" : "nullish "}(${test})`);
    }
  }
  return guards;
}

/** The raise sites in one source text, each as `if (guard) && ... => site` or the bare site, in source order. */
export function extractAssertions(source) {
  const file = ts.createSourceFile("script.mjs", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const lists = handedOnLists(file);
  const raisers = new Set();
  const found = [];
  for (let again = true; again; ) {
    again = false;
    found.length = 0;
    const visit = (node, owner) => {
      const declared = ts.isFunctionDeclaration(node) ? node.name?.text : ts.isVariableDeclaration(node) && node.initializer !== undefined && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) ? nameOf(node.name) : undefined;
      const here = declared ?? owner;
      if (isRaise(node, lists, raisers)) {
        found.push(node);
        if (here !== undefined && !raisers.has(here)) { raisers.add(here); again = true; }
      }
      ts.forEachChild(node, (child) => visit(child, here));
    };
    visit(file, undefined);
  }
  return found.map((node) => {
    const site = squash(printer.printNode(ts.EmitHint.Unspecified, node, file));
    const guards = guardsOf(node);
    return guards.length === 0 ? site : `if ${guards.join(" && ")} => ${site}`;
  });
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
