// O-045 T-185: stateOf and provenanceOf for every body in a scene, and the accuracy helpers as root exports, proved on a made-up elements body (ARCH-03).
import { describe, expect, it } from "vitest";
import { APPROXIMATE_LIMIT_FRACTION, INDICATIVE_LIMIT_FRACTION, Scene, SceneError, classifyPositionError, earth, moon, parseElementsBodyRecord, sun, type ElementsBodyRecord } from "astraeus";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";

const T = Date.UTC(2026, 7, 12);
const record: ElementsBodyRecord = {
  id: "rock", label: "Rock",
  elements: { semiMajorAxisAu: 2.5, eccentricity: 0.3, inclinationDeg: 10, ascendingNodeDeg: 40, argumentOfPerihelionDeg: 70, meanAnomalyDeg: 20 },
  epoch: { jd: 2461000.5, timeScale: "TDB", ttMinusUtcSeconds: 69.184 },
  frame: "ecliptic-j2000",
  source: { name: "Made up", url: "https://example.org/rock", solution: "S1", accessed: "2026-10-28" },
  accuracy: { classification: "indicative", statement: "Made up.", validFromUtc: "2020-01-01T00:00:00Z", validToUtc: "2030-01-01T00:00:00Z", limitations: [] },
  marker: { color: "#aabbcc", sizePx: 6 },
};
const code = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return "none"; };
const viewerState = (scene: Scene, id: string, t: number) => scene.toDefinition().catalogue
  ? scene.toDefinition().catalogue!.get(id).source!.create(createOrbAstronomyAdapter()).stateAt(t)
  : undefined;

describe("stateOf for any body", () => {
  it("gives the State the catalogue source draws for a moon and an elements body", () => {
    const scene = new Scene().addBody(sun).addBody(earth).addBody(moon).addBodyFromElements(record);
    for (const id of ["moon", "rock"]) {
      const expected = viewerState(scene, id, T)!;
      const got = scene.stateOf(id, T);
      expect(got.center).toBe(expected.center);
      got.positionKm.forEach((v, i) => expect(Math.abs(v - expected.positionKm[i]!)).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(expected.positionKm[i]!))));
    }
  });

  it("answers for the Earth, and for built-in Swift-Tuttle", () => {
    const scene = new Scene().addBody(sun).addBody(earth).addBody("swift-tuttle");
    expect(Math.hypot(...scene.stateOf("earth", T).positionKm) / 149_597_870.7).toBeGreaterThan(0.98);
    expect(Math.hypot(...scene.stateOf("swift-tuttle", T).positionKm)).toBeGreaterThan(1e9);
  });

  it("refuses an id the scene lacks and a moment outside the data", () => {
    const scene = new Scene().addBody(sun).addBodyFromElements(record);
    expect(code(() => scene.stateOf("earth", T))).toBe("unknown-body");
    // Catalogue sources are unbounded (the viewer draws them at any date), so only a path has a data range.
    const path = new Scene().addBody(earth).addTrajectory({ id: "probe", samples: [0, 1].map((m) => ({ time: T + m * 60_000, positionKm: [8_000 + m, 0, 0], velocityKmS: [1, 0, 0] })) });
    expect(path.stateOf("probe", T + 30_000).positionKm[0]).toBeCloseTo(8_000.5, 6);
    expect(code(() => path.stateOf("probe", T + 5 * 60_000))).toBe("bad-time");
    expect(code(() => scene.stateOf("rock", Date.UTC(2040, 0, 1)))).toBe("none");
  });
});

describe("provenanceOf", () => {
  it("carries the class and fraction for Swift-Tuttle and an elements body, and leaves them out for others", () => {
    const scene = new Scene().addBody(sun).addBody(earth).addBody("swift-tuttle").addBodyFromElements(record);
    expect(scene.provenanceOf("swift-tuttle")).toMatchObject({ accuracyClass: "approximate", maxErrorFraction: 0.00857 });
    expect(scene.provenanceOf("rock")).toMatchObject({ accuracyClass: "indicative", maxErrorFraction: INDICATIVE_LIMIT_FRACTION });
    expect(scene.provenanceOf("earth")).not.toHaveProperty("accuracyClass");
    expect(code(() => scene.provenanceOf("mars"))).toBe("unknown-body");
  });
});

describe("root accuracy helpers", () => {
  it("classify a comparison and parse a record", () => {
    expect([classifyPositionError(0.005), classifyPositionError(0.03), classifyPositionError(0.2)]).toEqual(["approximate", "indicative", null]);
    expect([APPROXIMATE_LIMIT_FRACTION, INDICATIVE_LIMIT_FRACTION]).toEqual([0.01, 0.05]);
    expect(parseElementsBodyRecord(record).id).toBe("rock");
    expect(() => parseElementsBodyRecord({ ...record, id: "Bad Id" })).toThrow(/id/);
  });
});
