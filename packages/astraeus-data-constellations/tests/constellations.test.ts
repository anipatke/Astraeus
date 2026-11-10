import { Scene, earth } from "astraeus";
import { describe, expect, it } from "vitest";
import { constellations } from "../src/index.js";

// O-067 T-305: the helper hands back public sky figures that a real scene accepts.
const reason = async (run: () => Promise<unknown>): Promise<string> => {
  try { await run(); } catch (error) { return (error as Error).message; }
  return "";
};

describe("constellations()", () => {
  it("builds one figure from its abbreviation, with a label, segments and provenance and no facts", async () => {
    const [ori, ...rest] = await constellations(["Ori"]);
    expect(rest).toEqual([]);
    expect(ori).toMatchObject({ id: "Ori", label: "Orion", kind: "figure" });
    expect(ori?.segments?.length).toBeGreaterThan(5);
    expect(ori?.segments?.[0]?.[0]).toHaveProperty("star");
    expect(ori?.provenance?.sources.join(" ")).toContain("CC BY-SA 4.0");
    expect(ori?.facts).toBeUndefined();
    expect(ori?.description).toBeUndefined();
  });

  it("builds several in the order asked, and all 88 with unique ids", async () => {
    expect((await constellations(["UMa", "Cru"])).map((f) => f.id)).toEqual(["UMa", "Cru"]);
    const all = await constellations("all");
    expect(all).toHaveLength(88);
    expect(new Set(all.map((f) => f.id)).size).toBe(88);
  });

  it("adds boundary outlines only when asked, Serpens as two, ids predictable, prefix applied", async () => {
    expect(await constellations(["Ori", "Ser"])).toHaveLength(2);
    const withOutlines = await constellations(["Ori", "Ser"], { outlines: true, idPrefix: "c-" });
    expect(withOutlines.map((f) => f.id)).toEqual(["c-Ori", "c-Ori-boundary", "c-Ser", "c-Ser-boundary-1", "c-Ser-boundary-2"]);
    const [, ori, , caput, cauda] = withOutlines;
    expect(ori).toMatchObject({ kind: "boundary", label: "Orion" });
    expect(ori?.points?.length).toBeGreaterThan(3);
    expect(ori?.segments).toBeUndefined();
    expect([caput?.label, cauda?.label]).toEqual(["Serpens Caput", "Serpens Cauda"]);
    expect((await constellations("all", { outlines: true }))).toHaveLength(89 + 88);
  });

  it("passes shown, colours and listed to every figure and outline, and leaves them out otherwise", async () => {
    const set = await constellations(["Ori"], { outlines: true, shown: "whenTraced", color: "red", labelColor: "white", listed: false });
    expect(set.every((f) => f.shown === "whenTraced" && f.color === "red" && f.labelColor === "white" && f.listed === false)).toBe(true);
    const plain = (await constellations(["Ori"]))[0] as unknown as Record<string, unknown>;
    for (const key of ["shown", "color", "labelColor", "listed"]) expect(key in plain).toBe(false);
  });

  it("names unknown and repeated abbreviations in the error", async () => {
    expect(await reason(() => constellations(["Ori", "Xyz", "ori"]))).toContain("Xyz, ori");
    expect(await reason(() => constellations(["Ori", "Tau", "Ori"]))).toMatch(/repeated: Ori/);
  });

  it("loads in a real scene: all 88 with outlines resolve every star end (no unknown-star)", async () => {
    // No fetch stub: the engine reads its own star list from disk in Node (I-167).
    const scene = new Scene();
    scene.addBody(earth);
    scene.addSkyFigures(await constellations("all", { outlines: true }));
    scene.check();
    await expect(scene.load()).resolves.toBeUndefined();
  });
});
