// Proves the engine works alone (O-035 T-158): copies packages/astraeus, its data packages (astraeus-data, astraeus-data-<planet>: engine-side data
// its tests read, O-036 T-161) and the shared root config into a scratch folder with no demo and no site, links the installed dependencies, then
// type-checks, lints and tests the copy. Anything that reaches outside the copy fails there (a missing import or file). The publishable build
// (tools/build-packages.mjs, checked by `npm run check:pack`) is a separate gate; this one runs on source.
//
// `--three <version|newest>` (O-091 T-415) links a registry three (and the @types/three, Fiber, React and React DOM that go with it) in place of the
// root copies, to prove the engine against a version the peer range admits; `npm run check:three-newest` passes `newest`. No flag: the steps are unchanged.
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import semver from "semver";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const keepGoing = process.argv.includes("--keep-going"); // run every step even after a failure (to record all of a newer three's failures)
const threeFlag = process.argv.indexOf("--three");
const threeArg = threeFlag === -1 ? null : process.argv[threeFlag + 1];
if (threeFlag !== -1 && !threeArg) {
  console.error("engine alone: --three needs a version or `newest`");
  process.exit(1);
}
function npmView(spec) {
  const r = spawnSync("npm", ["view", spec, "version", "--json"], { cwd: root, encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`npm view ${spec} failed: ${r.stderr || r.stdout}`);
  return [JSON.parse(r.stdout || "[]")].flat();
}
function installedVersion(name) {
  return JSON.parse(readFileSync(join(root, "node_modules", name, "package.json"), "utf8")).version;
}

let pair = null; // { three, types, typesNote, range } when --three is given
if (threeArg) {
  try {
    const range = JSON.parse(readFileSync(join(root, "packages", "astraeus", "package.json"), "utf8")).peerDependencies
      .three;
    let three = threeArg;
    if (threeArg === "newest") three = semver.maxSatisfying(npmView(`three@${range}`), range);
    else if (!semver.valid(threeArg) || !semver.satisfies(threeArg, range))
      throw new Error(`three ${threeArg} is not in the engine's peer range ${range}`);
    if (!three) throw new Error(`no published three satisfies ${range}`);
    const minor = semver.minor(three);
    const same = semver.maxSatisfying(npmView(`@types/three@~0.${minor}.0`), `~0.${minor}.0`);
    const types = same ?? semver.maxSatisfying(npmView("@types/three@*"), "*");
    pair = { three, types, range, typesNote: same ? "" : ` (no @types/three 0.${minor}.x published; newest overall)` };
  } catch (e) {
    console.error(`engine alone: ${e.message}`);
    process.exit(1);
  }
}

const scratch = mkdtempSync(join(tmpdir(), "astraeus-engine-alone-"));
const started = Date.now();

// Git-ignored files (caches such as tools/import/.horizons-cache, about 2.5 GB) are not copied: a fresh clone would not have them either.
const listed = spawnSync(
  "git",
  ["ls-files", "--others", "--ignored", "--exclude-standard", "--directory", "--", "packages/astraeus/"],
  { cwd: root, encoding: "utf8", maxBuffer: 1 << 28 },
);
if (listed.error || listed.status !== 0) {
  rmSync(scratch, { recursive: true, force: true });
  console.error(
    `engine alone: cannot list git-ignored files (${listed.error ? listed.error.message : `git exited ${listed.status}`}); git is required`,
  );
  process.exit(1);
}
const ignoredFiles = new Set(
  listed.stdout
    .split("\n")
    .filter(Boolean)
    .map((p) => resolve(root, p.replace(/\/$/, ""))),
);
const ignored = (src) => ignoredFiles.has(resolve(src));

function copy(from, to) {
  cpSync(join(root, from), join(scratch, to ?? from), {
    recursive: true,
    filter: (src) =>
      !/[\\/](node_modules|coverage)([\\/]|$)/.test(src) && !/[\\/]data[\\/]local([\\/]|$)/.test(src) && !ignored(src),
  });
}

const dataPackages = readdirSync(join(root, "packages")).filter(
  (name) => name === "astraeus-data" || name.startsWith("astraeus-data-"),
);
copy("packages/astraeus");
for (const name of dataPackages) copy(`packages/${name}`);
for (const file of ["tsconfig.json", "vitest.config.ts", "eslint.config.js"]) copy(file);
copy("tools/lint");
writeFileSync(
  join(scratch, "package.json"),
  JSON.stringify(
    {
      name: "engine-alone",
      private: true,
      type: "module",
      workspaces: ["packages/*"],
    },
    null,
    2,
  ),
);

// Link each installed dependency one by one; the workspace links (astraeus*) are not copied, so no path can
// lead back into the real checkout. The engine's own name points at the copy.
mkdirSync(join(scratch, "node_modules"));
for (const name of readdirSync(join(root, "node_modules"))) {
  if (name === "astraeus" || name.startsWith("astraeus-")) continue;
  symlinkSync(join(root, "node_modules", name), join(scratch, "node_modules", name));
}
for (const name of ["astraeus", ...dataPackages])
  symlinkSync(join(scratch, "packages", name), join(scratch, "node_modules", name));

if (pair) {
  const peers = join(scratch, ".peers");
  mkdirSync(peers);
  writeFileSync(join(peers, "package.json"), JSON.stringify({ name: "peers", private: true }));
  const specs = [
    `three@${pair.three}`,
    `@types/three@${pair.types}`,
    `@react-three/fiber@${installedVersion("@react-three/fiber")}`,
    `react@${installedVersion("react")}`,
    `react-dom@${installedVersion("react-dom")}`,
  ];
  const r = spawnSync(
    "npm",
    ["install", "--no-save", "--ignore-scripts", "--no-audit", "--no-fund", "--prefix", peers, ...specs],
    {
      stdio: "inherit",
    },
  );
  if (r.status !== 0) {
    rmSync(scratch, { recursive: true, force: true });
    console.error("engine alone: installing the peer set failed");
    process.exit(1);
  }
  const ls = spawnSync("npm", ["ls", "three", "--all", "--parseable", "--prefix", peers], { encoding: "utf8" });
  const copies = new Set(ls.stdout.split("\n").filter((l) => /[\\/]node_modules[\\/]three$/.test(l)));
  if (copies.size !== 1) {
    rmSync(scratch, { recursive: true, force: true });
    console.error(
      `engine alone: expected one copy of three in the peer set, found ${copies.size}:\n${[...copies].join("\n")}`,
    );
    process.exit(1);
  }
  // Replace the root links for the five names; a scope folder (@types, @react-three) is rebuilt entry by entry.
  for (const name of ["three", "@types/three", "@react-three/fiber", "react", "react-dom"]) {
    const link = join(scratch, "node_modules", name);
    const scope = name.startsWith("@") ? name.split("/")[0] : null;
    if (scope) {
      const dir = join(scratch, "node_modules", scope);
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir);
      for (const entry of readdirSync(join(root, "node_modules", scope)))
        symlinkSync(join(root, "node_modules", scope, entry), join(dir, entry));
    }
    rmSync(link, { force: true });
    symlinkSync(join(peers, "node_modules", name), link);
  }
  const rev = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", 'import * as T from "three"; console.log(T.REVISION);'],
    {
      cwd: scratch,
      encoding: "utf8",
    },
  );
  console.log(`three ${pair.three} (REVISION ${rev.stdout.trim()}), @types/three ${pair.types}${pair.typesNote}`);
}

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
  if (r.status !== 0) {
    failed ??= name;
    if (!keepGoing) break;
  }
}
rmSync(scratch, { recursive: true, force: true });
console.log(
  `\nengine alone: ${failed ? `FAILED at ${failed}` : "pass"} in ${((Date.now() - started) / 1000).toFixed(1)} s`,
);
process.exit(failed ? 1 : 0);
