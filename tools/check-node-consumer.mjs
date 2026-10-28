// Proves a developer's Node test can import the packed engine (O-044 T-182): `npm run check:node-consumer` builds `astraeus`, packs it, unpacks the tarball into a scratch
// consumer next to links to the installed peers and Vitest, and runs one Vitest test in the Node environment (no `test.server.deps.inline`) that builds
// `new Scene().addBody(sun).addBody(earth).toDefinition()`. Before the JSON import attributes it failed with ERR_IMPORT_ATTRIBUTE_MISSING (showers finding E9).
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scratch = mkdtempSync(join(tmpdir(), "astraeus-node-consumer-"));

function run(command, args, cwd, quiet = false) {
  const result = spawnSync(command, args, { cwd, stdio: quiet ? "pipe" : "inherit", encoding: "utf8", shell: process.platform === "win32" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed (exit ${result.status})\n${result.stdout ?? ""}${result.stderr ?? ""}`);
  return result.stdout;
}

let failed = false;
try {
  run(process.execPath, [join(root, "tools", "build-packages.mjs"), "astraeus"], root);
  run("npm", ["pack", join(root, "packages", "astraeus", "dist"), "--pack-destination", scratch, "--silent"], root, true);
  const tarball = readdirSync(scratch).find((file) => file.endsWith(".tgz"));
  const modules = join(scratch, "node_modules");
  mkdirSync(join(modules, "astraeus"), { recursive: true });
  run("tar", ["-xzf", join(scratch, tarball), "-C", join(modules, "astraeus"), "--strip-components=1"], scratch, true);
  // The consumer's own installs (peers, the engine's dependency and Vitest) are the checkout's, linked one by one; the engine itself is the unpacked tarball.
  for (const name of readdirSync(join(root, "node_modules"))) {
    if (name === "astraeus" || name.startsWith("astraeus-")) continue;
    symlinkSync(join(root, "node_modules", name), join(modules, name));
  }
  writeFileSync(join(scratch, "package.json"), JSON.stringify({ name: "node-consumer", private: true, type: "module" }));
  writeFileSync(join(scratch, "vitest.config.mjs"), 'export default { test: { environment: "node", include: ["consumer.test.mjs"] } };\n');
  writeFileSync(join(scratch, "consumer.test.mjs"), [
    'import { expect, test } from "vitest";',
    'import { Scene, classifyPositionError, earth, sun } from "astraeus";',
    'test("the packed package builds a scene in plain Node", () => {',
    "  const definition = new Scene().addBody(sun).addBody(earth).toDefinition();",
    "  expect(definition.composition).toBeDefined();",
    "  expect(definition.clock.startUtcMs).toEqual(expect.any(Number));",
    "});",
    'test("stateOf and provenanceOf answer for a built-in body", () => {',
    "  const scene = new Scene().addBody(sun).addBody(earth);",
    '  expect(Math.hypot(...scene.stateOf("earth", "2026-08-12T00:00:00Z").positionKm)).toBeGreaterThan(1.4e8);',
    '  expect(scene.provenanceOf("earth").sources.length).toBeGreaterThan(0);',
    '  expect(classifyPositionError(0.005)).toBe("approximate");',
    "});",
    "",
  ].join("\n"));
  run(process.execPath, [join(modules, "vitest", "vitest.mjs"), "run"], scratch);
} catch (error) {
  failed = true;
  console.error(String(error.message ?? error));
}
rmSync(scratch, { recursive: true, force: true });
console.log(`node consumer: ${failed ? "FAILED" : "pass"}`);
process.exit(failed ? 1 : 0);
