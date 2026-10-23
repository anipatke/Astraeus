// Proves the engine works alone (O-035 T-158): copies packages/astraeus, its data packages (astraeus-data, astraeus-data-<planet>: engine-side data
// its tests read, O-036 T-161) and the shared root config into a scratch folder with no demo and no site, links the installed dependencies, then
// type-checks, lints and tests the copy. Anything that reaches outside the copy fails there (a missing import or file). The publishable build
// (tools/build-packages.mjs, checked by `npm run check:pack`) is a separate gate; this one runs on source.
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scratch = mkdtempSync(join(tmpdir(), "astraeus-engine-alone-"));
const started = Date.now();

// Git-ignored files (caches such as tools/import/.horizons-cache, about 2.5 GB) are not copied: a fresh clone would not have them either.
const listed = spawnSync("git", ["ls-files", "--others", "--ignored", "--exclude-standard", "--directory", "--", "packages/astraeus/"], { cwd: root, encoding: "utf8", maxBuffer: 1 << 28 });
if (listed.error || listed.status !== 0) {
  rmSync(scratch, { recursive: true, force: true });
  console.error(`engine alone: cannot list git-ignored files (${listed.error ? listed.error.message : `git exited ${listed.status}`}); git is required`);
  process.exit(1);
}
const ignoredFiles = new Set(listed.stdout.split("\n").filter(Boolean).map((p) => resolve(root, p.replace(/\/$/, ""))));
const ignored = (src) => ignoredFiles.has(resolve(src));

function copy(from, to) {
  cpSync(join(root, from), join(scratch, to ?? from), {
    recursive: true,
    filter: (src) => !/[\\/](node_modules|coverage)([\\/]|$)/.test(src) && !/[\\/]data[\\/]local([\\/]|$)/.test(src) && !ignored(src),
  });
}

const dataPackages = readdirSync(join(root, "packages")).filter((name) => name === "astraeus-data" || name.startsWith("astraeus-data-"));
copy("packages/astraeus");
for (const name of dataPackages) copy(`packages/${name}`);
for (const file of ["tsconfig.json", "vitest.config.ts", "eslint.config.js"]) copy(file);
copy("tools/lint");
writeFileSync(join(scratch, "package.json"), JSON.stringify({
  name: "engine-alone", private: true, type: "module", workspaces: ["packages/*"],
}, null, 2));

// Link each installed dependency one by one; the workspace links (astraeus*) are not copied, so no path can
// lead back into the real checkout. The engine's own name points at the copy.
mkdirSync(join(scratch, "node_modules"));
for (const name of readdirSync(join(root, "node_modules"))) {
  if (name === "astraeus" || name.startsWith("astraeus-")) continue;
  symlinkSync(join(root, "node_modules", name), join(scratch, "node_modules", name));
}
for (const name of ["astraeus", ...dataPackages]) symlinkSync(join(scratch, "packages", name), join(scratch, "node_modules", name));

const steps = [
  ["typecheck", ["node_modules/typescript/bin/tsc", "--noEmit"]],
  ["lint", ["--require", "./tools/lint/use-typescript6.cjs", "node_modules/eslint/bin/eslint.js", "packages"]],
  ["test", ["node_modules/vitest/vitest.mjs", "run"]],
];
let failed = null;
for (const [name, args] of steps) {
  const t = Date.now();
  console.log(`\n== engine alone: ${name}`);
  const r = spawnSync(process.execPath, args, { cwd: scratch, stdio: "inherit", env: { ...process.env, CI: "1" } });
  console.log(`== ${name}: ${r.status === 0 ? "pass" : "FAIL"} (${((Date.now() - t) / 1000).toFixed(1)} s)`);
  if (r.status !== 0) { failed = name; break; }
}
rmSync(scratch, { recursive: true, force: true });
console.log(`\nengine alone: ${failed ? `FAILED at ${failed}` : "pass"} in ${((Date.now() - started) / 1000).toFixed(1)} s`);
process.exit(failed ? 1 : 0);
