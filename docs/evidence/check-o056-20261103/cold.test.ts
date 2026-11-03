// O-056 Check probes, cold (no preload): what a Node consumer sees.
import { beforeEach, describe, expect, it, vi } from "vitest";

const WHEN = "2026-03-01T00:00:00Z";
const INTERNAL = /loadPlanetSeries|NotLoadedError|moon fits are not loaded|planet series are not loaded|loadJupiterMoons|prepare\(/;
const failure = (call: () => unknown): string => { try { call(); } catch (e) { return `${(e as { code?: string }).code}: ${(e as Error).message}`; } return "ok"; };
beforeEach(() => { vi.resetModules(); });

describe("cold reads before load", () => {
  it.each(["mars", "venus", "earth", "saturn", "moon"])("stateOf(%s) before load", async (id) => {
    const api = await import("/home/user/code/Astraeus/packages/astraeus/src/api/index.ts");
    const s = new api.Scene().addBody(api.sun).addBody(api.earth).addBody(api.moon).addBody(api.mars).addBody(api.venus).addBody(api.saturn);
    const f = failure(() => s.stateOf(id, WHEN));
    // record whatever happens; a planet must be missing-data naming scene.load with no internal
    console.log(`COLD stateOf ${id}: ${f}`);
    if (f !== "ok") { expect(f).toMatch(/^missing-data: /); expect(f).toContain("scene.load"); expect(f).not.toMatch(INTERNAL); }
  });
  it("provenanceOf before load answers for planets (catalogue record)", async () => {
    const api = await import("/home/user/code/Astraeus/packages/astraeus/src/api/index.ts");
    const s = new api.Scene().addBody(api.sun).addBody(api.mars);
    console.log(`COLD provenanceOf mars: ${failure(() => s.provenanceOf("mars"))}`);
  });
  it("load then every body answers, including the Sun and the Moon", async () => {
    const api = await import("/home/user/code/Astraeus/packages/astraeus/src/api/index.ts");
    const s = new api.Scene().addBody(api.sun).addBody(api.earth).addBody(api.moon).addBody(api.mars).setTime(WHEN);
    await s.load();
    for (const id of ["sun", "earth", "moon", "mars"]) expect(failure(() => s.stateOf(id, WHEN))).toBe("ok");
    for (const id of ["sun", "earth", "moon", "mars"]) expect(failure(() => s.provenanceOf(id))).toBe("ok");
    // independent oracle: Mars-Sun distance between perihelion 2.066e8 and aphelion 2.492e8 km
    const r = Math.hypot(...s.stateOf("mars", WHEN).positionKm);
    expect(r).toBeGreaterThan(2.06e8); expect(r).toBeLessThan(2.50e8);
  });
  it("out-of-span message names no internal", async () => {
    const api = await import("/home/user/code/Astraeus/packages/astraeus/src/api/index.ts");
    const s = new api.Scene().addBody(api.sun).addBody(api.saturn).setTimeline({ start: "1945-01-01T00:00:00Z", end: "1946-01-01T00:00:00Z" });
    let m = "";
    try { await s.load(); } catch (e) { m = `${(e as { code?: string }).code}: ${(e as Error).message}`; }
    console.log(`COLD out-of-span: ${m}`);
    expect(m).toMatch(/^out-of-span: /);
    expect(m).not.toMatch(INTERNAL);
  });
  it("load of a moon whose package is not passed rejects missing-data; the message names no internal", async () => {
    const api = await import("/home/user/code/Astraeus/packages/astraeus/src/api/index.ts");
    const s = new api.Scene().addBody(api.sun).addBody(api.saturn).addBody(api.titan).setTime(WHEN);
    let m = "";
    try { await s.load(); } catch (e) { m = `${(e as { code?: string }).code}: ${(e as Error).message}`; }
    console.log(`COLD titan no data: ${m}`);
    expect(m).toMatch(/^missing-data: /);
    expect(m).not.toMatch(INTERNAL);
  });
  it("the scene timeline read on a cold scene with a planet does not throw an internal", async () => {
    const api = await import("/home/user/code/Astraeus/packages/astraeus/src/api/index.ts");
    const s = new api.Scene().addBody(api.sun).addBody(api.mars);
    console.log(`COLD timeline: ${failure(() => s.timeline)}`);
    console.log(`COLD check: ${failure(() => s.check())}`);
  });
});
