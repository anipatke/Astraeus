// O-055 Full Objective Check probes (C-145 recheck, copied from C-144). Run from the repo root:
//   npx vitest run --config docs/evidence/check-o055-recheck-20261102/vitest.probe.config.ts
import { defineConfig, mergeConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import base from "../../../vitest.config";

const root = fileURLToPath(new URL("../../../", import.meta.url));
export default mergeConfig(base, defineConfig({ root, test: { include: ["docs/evidence/check-o055-recheck-20261102/probes/**/*.probe.test.ts"], testTimeout: 60_000 } }));
