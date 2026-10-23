// Builds the example app (O-036 T-162): `node tools/build-example.mjs`. examples/hello-scene lives outside the workspaces and installs the PACKED tarballs
// of the engine (built by tools/build-packages.mjs, packed with `npm pack` from each package's dist/), never a workspace link, so it proves what a customer gets.
//   1. build the packages, 2. pack `astraeus` into examples/hello-scene/.packs (git-ignored), 3. npm install the tarball and vite there, 4. vite build -> examples/hello-scene/dist.
// Serve the result with `npm run preview` inside the example (or `npx vite preview examples/hello-scene --port 5496`).
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const example = join(root, "examples", "hello-scene");
const packs = join(example, ".packs");
/** The packages the example installs: the engine only (it draws Earth, the Moon and a path with no data package). */
export const EXAMPLE_PACKAGES = ["astraeus"];

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed (exit ${result.status})`);
}

export function buildExample() {
  run(process.execPath, [join(root, "tools", "build-packages.mjs"), ...EXAMPLE_PACKAGES], root);
  rmSync(packs, { recursive: true, force: true });
  rmSync(join(example, "node_modules", "astraeus"), { recursive: true, force: true });
  mkdirSync(packs, { recursive: true });
  for (const name of EXAMPLE_PACKAGES) run("npm", ["pack", join(root, "packages", name, "dist"), "--pack-destination", packs, "--silent"], root);
  const tarballs = readdirSync(packs).filter((file) => file.endsWith(".tgz")).map((file) => join(packs, file));
  run("npm", ["install", "--no-save", "--no-package-lock", "--no-audit", "--no-fund", ...tarballs], example);
  run("npx", ["vite", "build"], example);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) buildExample();
