// I-164: the engine's first download is held to ENGINE_LIMIT in the ordinary test run, so growth fails at the change that causes it (the browser check's public-build-assets step only found it at the Objective's end).
// It builds the packed engine and the plain example (tools/build-example.mjs, a few seconds) and measures it the way `node tools/measure-example.mjs` does. Nothing else in the suite reads those build folders.
import { describe, expect, it } from "vitest";
import { buildExample } from "../../../tools/build-example.mjs";
import { checkEngineBudget, ENGINE_LIMIT } from "../tools/validate/engine-budget.mjs";

describe("engine budget", () => {
  it("keeps the plain example's first download within ENGINE_LIMIT, and fails when the limit is set below it", () => {
    buildExample("hello-scene");
    const result = checkEngineBudget();
    expect(result.problems).toEqual([]);
    expect(result.raw).toBeLessThanOrEqual(ENGINE_LIMIT.rawLimit);
    expect(result.gzip).toBeLessThanOrEqual(ENGINE_LIMIT.gzipLimit);
    const tight = checkEngineBudget({ limit: { rawLimit: result.raw - 1, gzipLimit: result.gzip - 1 } });
    expect(tight.ok).toBe(false);
    expect(tight.problems).toHaveLength(2);
  }, 120_000);
});
