// Builds the example app (O-036 T-162): `node tools/build-example.mjs`. examples/hello-scene, examples/hello-react, examples/hello-planets and examples/hello-sky live outside the workspaces and install the PACKED tarballs
// of the engine (built by tools/build-packages.mjs, packed with `npm pack` from each package's dist/), never a workspace link, so it proves what a customer gets.
//   1. build the packages, 2. pack `astraeus` into each example's .packs (git-ignored), 3. npm install the tarball and vite there, 4. vite build -> examples/<name>/dist. `node tools/build-example.mjs hello-react` builds one.
// Serve one with `npm run preview` inside the example (or `npx vite preview examples/hello-scene --port 5496`).
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/** The example apps, each outside the workspaces and installed from the packed tarballs. */
export const EXAMPLES = ["hello-scene", "hello-react", "hello-planets", "hello-sky"];
/** The packages the examples install: the engine only (it draws Earth, the Moon and a path with no data package). */
export const EXAMPLE_PACKAGES = ["astraeus"];
/** The packages an example installs when it needs more than the engine (`hello-sky` adds the constellations package). */
const EXTRA_PACKAGES = { "hello-sky": ["astraeus-data-constellations"] };
const packagesOf = (name) => [...EXAMPLE_PACKAGES, ...(EXTRA_PACKAGES[name] ?? [])];

/** The environment without the outer npm run's own settings (`npm_config_*`, `NODE_ENV`, vitest's own variables): a nested `npm install` rejects some of them (the registry, cache, proxy and certificate settings are kept) (`--allow-scripts` from a parent `npm test` / `npx`, I-164) and a test mode makes a bigger bundle (2.07 MB instead of 1.75 MB under `npm test`), so the example must install the same way however it is started. */
function cleanEnv() {
  return Object.fromEntries(Object.entries(process.env).filter(([name]) => (!/^(?:npm_config_|NODE_ENV$|VITEST|VITE_|TEST$|MODE$)/i.test(name) || /^npm_config_(?:registry|cache|userconfig|globalconfig|proxy|https_proxy|noproxy|cafile|strict_ssl|@.+:registry)$/i.test(name))));
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", env: cleanEnv(), shell: process.platform === "win32" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed (exit ${result.status})`);
}

function buildOne(name) {
  const example = join(root, "examples", name);
  const packs = join(example, ".packs");
  rmSync(packs, { recursive: true, force: true });
  for (const pkg of packagesOf(name)) rmSync(join(example, "node_modules", pkg), { recursive: true, force: true });
  mkdirSync(packs, { recursive: true });
  for (const pkg of packagesOf(name)) run("npm", ["pack", join(root, "packages", pkg, "dist"), "--pack-destination", packs, "--silent"], root);
  const tarballs = readdirSync(packs).filter((file) => file.endsWith(".tgz")).map((file) => join(packs, file));
  run("npm", ["install", "--prefer-offline", "--no-save", "--no-package-lock", "--no-audit", "--no-fund", ...tarballs], example);
  run("npx", ["vite", "build"], example);
}

/** Builds the packages once, then every example (or only `only`, an example's folder name). `buildPackages: false` uses the packages' dist as it stands (a caller that has just built them, e.g. the pack test, so one test owns that build). */
export function buildExample(only, { buildPackages = true } = {}) {
  if (buildPackages) run(process.execPath, [join(root, "tools", "build-packages.mjs"), ...new Set(EXAMPLES.filter((name) => !only || only === name).flatMap(packagesOf))], root);
  for (const name of EXAMPLES) if (!only || only === name) buildOne(name);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) buildExample(process.argv[2]);
