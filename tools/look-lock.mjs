// Rewrites the computed-look baseline (packages/astraeus/tests/fixtures/computed-look.baseline.json) from the current stylesheets. Run it only when a look change is
// intended, then review the baseline diff: every changed line is one element's computed style. The test is packages/astraeus/tests/computedLook.test.ts.
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const r = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "packages/astraeus/tests/computedLook.test.ts"], { cwd: root, stdio: "inherit", env: { ...process.env, LOOK_UPDATE: "1" } });
process.exit(r.status ?? 1);
