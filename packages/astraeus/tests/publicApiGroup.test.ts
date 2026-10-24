// The group call of the public API (O-042 T-173), proved on a made-up ring of orbits (ARCH-03): a group draws as one set of dots on the points layer, with one menu item,
// info card, provenance and known limits, joins the camera menu and story panels, places dots reproducibly, clumps near a body, and refuses bad input with `bad-group`.
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon, type GroupInput } from "astraeus";
import { experienceWithGroups, groupsOf } from "../src/app/experienceDefinition";

const T0 = Date.parse("2026-01-01T00:00:00Z");
const orbit = (k: number) => ({ id: `rock-${k}`, semiMajorAxisKm: 80_000 + 5_000 * k, eccentricity: 0.1 + 0.02 * k, inclinationDeg: 5 + k, raanDeg: 40 + 3 * k, argumentOfPeriapsisDeg: 70 + k });
const ring = (extra: Partial<GroupInput> = {}): GroupInput => ({ id: "ring", orbits: [0, 1, 2, 3, 4, 5].map(orbit), ...extra });
const base = () => new Scene().addBody(earth).addBody(moon).setTime(T0);
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return "no error"; };
const positions = (definition: ReturnType<Scene["toDefinition"]>, time = T0 + 3_600_000) => {
  const out = new Float64Array(18);
  groupsOf(definition)[0]!.group.fillPositionsKm(time, out);
  return Array.from(out);
};

describe("addGroup", () => {
  it("draws the orbits as one group on the points layer, with one menu item, colour, dot size and provenance", () => {
    const definition = base().addGroup(ring({ label: "Ring", color: "#ff8800", dotSizePx: 4, refillAfterMs: 600_000, description: "Six made-up rocks." })).toDefinition();
    expect(definition.sceneLayers).toEqual(["tracked-bodies", "points"]);
    const [layer] = groupsOf(definition);
    expect(layer).toMatchObject({ color: "#ff8800", pointSizePx: 4, refillAfterMs: 600_000 });
    expect(layer!.group.count).toBe(6);
    expect(layer!.group.center).toBe("earth");
    expect(layer!.object).toMatchObject({ id: "ring", label: "Ring", description: "Six made-up rocks." });
    expect(layer!.group.provenance.sourceType).toBe("illustrative");
    const items = experienceWithGroups(definition).objects.filter((object) => object.id === "ring");
    expect(items).toHaveLength(1);
    expect(items[0]!.provenance).toBeDefined();
  });

  it("states its known limits: the caller's first, then the placement and motion limits, and the clump when drawn", () => {
    const plain = groupsOf(base().addGroup(ring({ knownLimitations: ["Invented rocks."] })).toDefinition())[0]!.object.knownLimitations!;
    expect(plain[0]).toBe("Invented rocks.");
    expect(plain.some((line) => /illustrative/.test(line))).toBe(true);
    expect(plain.some((line) => /two-body/.test(line))).toBe(true);
    expect(plain.some((line) => /clump/.test(line))).toBe(false);
    const clumped = groupsOf(base().addGroup(ring({ clump: { near: "moon", fraction: 0.5, widthDeg: 20 } })).toDefinition())[0]!.object.knownLimitations!;
    expect(clumped.some((line) => /50% of the dots are drawn near Moon/.test(line))).toBe(true);
  });

  it("joins the automatic camera menu and can be named by a story panel", () => {
    const scene = base().addGroup(ring({ label: "Ring" })).addStoryPanels({ panels: [{ id: "p", at: { utc: "2026-01-01T00:01:00Z" }, title: "The ring", body: ["Made up."], badge: "illustrative", sources: ["Invented"], object: "ring" }] });
    scene.camera.follow("ring");
    const definition = scene.toDefinition();
    const presets = definition.experience.cameraPresets.map((preset) => preset.id);
    expect(presets).toContain("focus-ring");
    expect(presets).toContain("follow-ring");
    expect(definition.experience.startCameraPresetId).toBe("follow-ring");
    expect(definition.experience.storyPanels?.panels.map((panel) => panel.objectId)).toEqual(["ring"]);
    expect(() => new Scene().addBody(earth).addStoryPanels({ panels: [{ id: "p", at: { utc: "2026-01-01T00:00:00Z" }, title: "x", body: ["y"], badge: "illustrative", sources: ["z"], object: "ring" }] }).toDefinition()).toThrow();
  });

  it("places the dots the same way for the same seed and differently for another, along the listed orbits", () => {
    const a = positions(base().addGroup(ring({ seed: 3 })).toDefinition());
    const b = positions(base().addGroup(ring({ seed: 3 })).toDefinition());
    const c = positions(base().addGroup(ring({ seed: 4 })).toDefinition());
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    // Each dot stays within its own orbit's reach: between periapsis and apsis about Earth.
    for (let k = 0; k < 6; k++) {
      const { semiMajorAxisKm: s, eccentricity: e } = orbit(k);
      const r = Math.hypot(a[3 * k]!, a[3 * k + 1]!, a[3 * k + 2]!);
      expect(r).toBeGreaterThanOrEqual(s * (1 - e) * 0.999);
      expect(r).toBeLessThanOrEqual(s * (1 + e) * 1.001);
    }
  });

  it("clumps a stated share near a body's place along its orbit", () => {
    const spread = positions(base().addGroup(ring({ seed: 1 })).toDefinition());
    const clumped = positions(base().addGroup(ring({ seed: 1, clump: { near: "moon", fraction: 1, widthDeg: 10 } })).toDefinition());
    expect(clumped).not.toEqual(spread);
  });

  it("circles another body in the scene when asked, and keeps ids in one namespace", () => {
    const definition = base().addGroup(ring({ center: "moon", plane: "EQJ" })).toDefinition();
    expect(groupsOf(definition)[0]!.group.center).toBe("moon");
    expect(codeOf(() => base().addGroup(ring()).addBody("mars").addGroup(ring({ id: "mars" })))).toBe("duplicate-id");
    expect(codeOf(() => base().addGroup(ring()).addGroup(ring()))).toBe("duplicate-id");
    expect(codeOf(() => base().addGroup(ring({ id: "earth" })))).toBe("duplicate-id");
  });

  it("refuses bad input with bad-group, naming the group", () => {
    const orbits = ring().orbits;
    const cases: Partial<GroupInput>[] = [
      { orbits: [] },
      { orbits: [orbit(0), orbit(0)] },
      { orbits: [{ ...orbit(0), id: "" }] },
      { color: "red" },
      { dotSizePx: 0 },
      { refillAfterMs: -1 },
      { knownLimitations: [""] },
      { clump: { near: "nowhere", fraction: 0.5, widthDeg: 10 } },
      { clump: { near: "moon", fraction: 2, widthDeg: 10 } },
      { clump: { near: "moon", fraction: 0.5, widthDeg: 0 } },
      { id: "" },
    ];
    for (const bad of cases) expect(codeOf(() => base().addGroup({ ...ring(), ...bad })), JSON.stringify(bad)).toBe("bad-group");
    expect(orbits).toHaveLength(6);
    // An unbound orbit (eccentricity 1 or more) and a bad shape are refused when the scene is built.
    for (const worse of [{ eccentricity: 1.2 }, { semiMajorAxisKm: -5 }, { inclinationDeg: 200 }]) {
      const scene = base().addGroup(ring({ orbits: [{ ...orbit(0), ...worse }] }));
      expect(codeOf(() => scene.toDefinition()), JSON.stringify(worse)).toBe("bad-group");
    }
    expect(() => base().addGroup({ ...ring(), id: "x", orbits: [{ ...orbit(0), id: "" }] })).toThrowError(/addGroup/);
  });

  it("refuses a centre or clump body the scene does not hold, and a clump on the centre itself", () => {
    expect(codeOf(() => new Scene().addBody(earth).addGroup(ring({ center: "moon" })).toDefinition())).toBe("bad-group");
    expect(codeOf(() => new Scene().addBody(earth).addGroup(ring({ clump: { near: "moon", fraction: 0.5, widthDeg: 10 } })).toDefinition())).toBe("bad-group");
    expect(codeOf(() => base().addGroup(ring({ clump: { near: "earth", fraction: 0.5, widthDeg: 10 } })).toDefinition())).toBe("bad-group");
    expect(codeOf(() => base().addGroup(ring({ center: "nowhere" })))).toBe("unknown-body");
  });

  it("gives a group no info-card bars", () => {
    const definition = base().addGroup(ring()).toDefinition();
    const metrics = definition.createMetrics({ resolver: undefined as never } as never);
    expect(metrics("ring", T0)).toEqual([]);
  });
});

describe("clump near an elements body and refillSliceMs (O-042 T-177)", () => {
  it("clumps near a body added with addBodyFromElements", async () => {
    const { Scene: S, sun } = await import("astraeus");
    const scene = new S().addBody(sun).addBodyFromElements({
      id: "made-up-rock", label: "Made-up rock",
      elements: { semiMajorAxisAu: 2, eccentricity: 0.3, inclinationDeg: 10, ascendingNodeDeg: 80, argumentOfPerihelionDeg: 50, meanAnomalyDeg: 20 },
      epoch: { jd: 2_461_000.5, timeScale: "TDB", ttMinusUtcSeconds: 69.184 }, frame: "ecliptic-j2000",
      source: { name: "Invented Survey", url: "https://example.invalid/rock", solution: "A", accessed: "2026-10-24" },
      accuracy: { classification: "indicative", statement: "Made up.", validFromUtc: "2025-01-01T00:00:00Z", validToUtc: "2027-01-01T00:00:00Z", limitations: ["Invented for a test."] },
      marker: { color: "#ff9966", sizePx: 8 },
    }).addGroup(ring({ center: "sun", clump: { near: "made-up-rock", fraction: 0.5, widthDeg: 20 }, refillSliceMs: 0 })).setTime(T0);
    const layer = scene.toDefinition().groups![0]!;
    expect(layer.refillSliceMs).toBe(0);
    expect(layer.object.knownLimitations!.join(" ")).toContain("Made-up rock");
  });

  it("refuses a clump near a body that is neither catalogued nor added from elements, and a bad refillSliceMs", () => {
    expect(codeOf(() => base().addGroup(ring({ clump: { near: "made-up-rock", fraction: 0.5, widthDeg: 20 } })))).toBe("bad-group");
    for (const bad of [-1, Number.NaN, Infinity]) expect(codeOf(() => base().addGroup(ring({ refillSliceMs: bad })))).toBe("bad-group");
  });
});
