// Builds the example app (O-036 T-162): `node tools/build-example.mjs`. examples/hello-scene and examples/hello-react live outside the workspaces and install the PACKED tarballs
// of the engine (built by tools/build-packages.mjs, packed with `npm pack` from each package's dist/), never a workspace link, so it proves what a customer gets.
//   1. build the packages, 2. pack `astraeus` into each example's .packs (git-ignored), 3. npm install the tarball and vite there, 4. vite build -> examples/<name>/dist. `node tools/build-example.mjs hello-react` builds one.
// Serve one with `npm run preview` inside the example (or `npx vite preview examples/hello-scene --port 5496`).
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/** The example apps, each outside the workspaces and installed from the packed tarballs. */
export const EXAMPLES = ["hello-scene", "hello-react"];
/** The packages the examples install: the engine only (it draws Earth, the Moon and a path with no data package). */
export const EXAMPLE_PACKAGES = ["astraeus"];

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed (exit ${result.status})`);
}

function buildOne(name) {
  const example = join(root, "examples", name);
  const packs = join(example, ".packs");
  rmSync(packs, { recursive: true, force: true });
  rmSync(join(example, "node_modules", "astraeus"), { recursive: true, force: true });
  mkdirSync(packs, { recursive: true });
  for (const pkg of EXAMPLE_PACKAGES) run("npm", ["pack", join(root, "packages", pkg, "dist"), "--pack-destination", packs, "--silent"], root);
  const tarballs = readdirSync(packs).filter((file) => file.endsWith(".tgz")).map((file) => join(packs, file));
  run("npm", ["install", "--no-save", "--no-package-lock", "--no-audit", "--no-fund", ...tarballs], example);
  run("npx", ["vite", "build"], example);
}

/** Builds the packages once, then every example (or only `only`, an example's folder name). */
export function buildExample(only) {
  run(process.execPath, [join(root, "tools", "build-packages.mjs"), ...EXAMPLE_PACKAGES], root);
  for (const name of EXAMPLES) if (!only || only === name) buildOne(name);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) buildExample(process.argv[2]);
