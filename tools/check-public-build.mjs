// `npm run check:public-build` (O-086 T-389): build the public site into a scratch folder and run the two file checks on it, with no browser:
// public-build-assets.mjs (licences, local-only bytes, no made-up scenes, page load budgets, required pages) and public-addresses.mjs (no retired links).
// Each run writes docs/evidence/public-build-<stamp>/ (summary.txt, one log per check, the assets check's results.json), whether it passes or fails.
// The build is the one `check:browser` makes for its public steps (buildPublicSite in runner.mjs). Exit code 1 when the build or a check fails.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, appendFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadLimits, overrun } from "./gate-limits.mjs";
import { buildPublicSite } from "../packages/astraeus-site/tools/validate/runner.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const validate = join(root, "packages", "astraeus-site", "tools", "validate");

/** The two file checks, each a node script run with the built folder (and, for the first, a results file) as arguments. */
export const CHECKS = [
  { name: "public-build-assets", script: join(validate, "public-build-assets.mjs"), results: true },
  { name: "public-addresses", script: join(validate, "public-addresses.mjs") },
];

const stamp = () =>
  new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "Z");

/**
 * Run `checks` on the built folder `distDir`, writing summary.txt, a log per check and any results file into `evidenceDir`.
 * Resolves to `{ ok, rows }`; a check passes when its script exits 0. Time alone never fails it.
 */
export function runChecks({ distDir, evidenceDir, checks = CHECKS, limits = loadLimits(), log = console.log }) {
  mkdirSync(evidenceDir, { recursive: true });
  const say = (text) => {
    log(text);
    appendFileSync(join(evidenceDir, "summary.txt"), `${text}\n`);
  };
  const rows = [];
  for (const check of checks) {
    const started = Date.now();
    const args = [check.script, distDir, ...(check.results ? [join(evidenceDir, `${check.name}-results.json`)] : [])];
    const run = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", maxBuffer: 2 ** 28 });
    const seconds = Math.round((Date.now() - started) / 100) / 10;
    writeFileSync(join(evidenceDir, `${check.name}.log`), `${run.stdout ?? ""}${run.stderr ?? ""}${run.error ?? ""}`);
    const passed = run.status === 0;
    say(`${check.name} | ${passed ? "passed" : `FAILED (exit ${run.status})`} | ${seconds}s`);
    rows.push({ name: check.name, passed, seconds });
  }
  const ok = rows.every((row) => row.passed);
  const total = Math.round(rows.reduce((sum, row) => sum + row.seconds, 0));
  say(`file checks ${ok ? "passed" : "FAILED"} | ${total}s`);
  return { ok, rows };
}

/** Build, check, clean up; resolves to the exit code. `build` and `checks` can be replaced (tests). */
export function checkPublicBuild({
  build = buildPublicSite,
  checks = CHECKS,
  evidenceRoot = join(root, "docs", "evidence"),
} = {}) {
  const evidenceDir = join(evidenceRoot, `public-build-${stamp()}`);
  mkdirSync(evidenceDir, { recursive: true });
  const scratch = mkdtempSync(join(tmpdir(), "astraeus-public-build-"));
  const distDir = join(scratch, "public");
  const started = Date.now();
  try {
    const built = build(distDir);
    writeFileSync(join(evidenceDir, "public-build.log"), `${built.stdout ?? ""}${built.stderr ?? ""}`);
    if (built.status !== 0) {
      appendFileSync(join(evidenceDir, "summary.txt"), "public build FAILED (see public-build.log)\n");
      console.error(`public build failed; evidence: ${evidenceDir}`);
      return 1;
    }
    const limits = loadLimits();
    const { ok } = runChecks({ distDir, evidenceDir, checks, limits });
    const seconds = Math.round((Date.now() - started) / 100) / 10;
    const warning = overrun("check:public-build", seconds, limits.gates["check:public-build"]);
    if (warning) console.log(warning);
    console.log(`evidence: ${evidenceDir}`);
    return ok ? 0 : 1;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(checkPublicBuild());
}
