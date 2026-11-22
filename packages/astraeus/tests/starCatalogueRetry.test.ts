import { beforeEach, describe, expect, it, vi } from "vitest";

const reader = vi.hoisted(() => ({ fetchBytesOf: vi.fn() }));
vi.mock("../src/core/readBytes", () => reader);

const goodFile = new TextEncoder().encode(JSON.stringify({ stars: [[10, 20, 1.5, 0.4, 123]] }));

describe("loadStarCatalogue retry", () => {
  beforeEach(() => {
    vi.resetModules();
    reader.fetchBytesOf.mockReset();
  });

  it("forgets a failed read, uses the next good one, then reads only once", async () => {
    reader.fetchBytesOf.mockRejectedValueOnce(new Error("offline")).mockResolvedValue(goodFile);
    const { loadStarCatalogue } = await import("../src/assets/sky");
    expect(await loadStarCatalogue()).toBeNull();
    const catalogue = await loadStarCatalogue();
    expect(catalogue?.stars).toHaveLength(1);
    expect(reader.fetchBytesOf).toHaveBeenCalledTimes(2);
    expect(await loadStarCatalogue()).toBe(catalogue);
    expect(reader.fetchBytesOf).toHaveBeenCalledTimes(2);
  });

  it("forgets a file that is not a valid star file", async () => {
    reader.fetchBytesOf.mockResolvedValueOnce(new TextEncoder().encode("{}")).mockResolvedValue(goodFile);
    const { loadStarCatalogue } = await import("../src/assets/sky");
    expect(await loadStarCatalogue()).toBeNull();
    expect((await loadStarCatalogue())?.stars).toHaveLength(1);
  });
});
