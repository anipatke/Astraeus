import { beforeEach, describe, expect, it, vi } from "vitest";

type Importer = Parameters<typeof import("../src/core/planetSeries").loadPlanetSeries>[0];

const fresh = async () => {
  vi.resetModules();
  return import("../src/core/planetSeries");
};
const realChunk = (): NonNullable<Importer> => () => import("../src/core/planetModels");

describe("loadPlanetSeries retry", () => {
  beforeEach(() => vi.resetModules());

  it("forgets a failed load and uses a later success", async () => {
    const { loadPlanetSeries, planetSeriesLoaded, planetSeriesSpan } = await fresh();
    const failure = new Error("chunk offline");
    await expect(loadPlanetSeries(() => Promise.reject(failure))).rejects.toBe(failure);
    expect(planetSeriesLoaded()).toBe(false);
    await expect(loadPlanetSeries(realChunk())).resolves.toBeUndefined();
    expect(planetSeriesLoaded()).toBe(true);
    expect(planetSeriesSpan().startUtcMs).toBeLessThan(planetSeriesSpan().endUtcMs);
  });

  it("shares one pending load, and does not import again after success", async () => {
    const { loadPlanetSeries } = await fresh();
    const importer = vi.fn(realChunk());
    const first = loadPlanetSeries(importer);
    const second = loadPlanetSeries(importer);
    await Promise.all([first, second]);
    expect(importer).toHaveBeenCalledTimes(1);
    await loadPlanetSeries(importer);
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it("lets every caller awaiting the failed load see the rejection", async () => {
    const { loadPlanetSeries } = await fresh();
    const failure = new Error("down");
    const importer = vi.fn(() => Promise.reject(failure));
    const calls = [loadPlanetSeries(importer), loadPlanetSeries(importer)];
    for (const call of calls) await expect(call).rejects.toBe(failure);
    expect(importer).toHaveBeenCalledTimes(1);
  });
});
