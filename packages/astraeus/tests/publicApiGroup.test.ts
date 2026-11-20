// The group call of the public API (O-042 T-173), proved on a made-up ring of orbits (ARCH-03): a group draws as one set of dots on the points layer, with one menu item,
// info card, provenance and known limits, joins the camera menu and story panels, places dots reproducibly, clumps near a body, and refuses bad input with `bad-group`.
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon, type GroupInput } from "astraeus";
import { experienceWithGroups, groupsOf } from "../src/app/experienceDefinition";
import type { ExperienceDefinition } from "../src/app/experienceDefinition";
import { definitionOf } from "../src/api/definitionOf";

const T0 = Date.parse("2026-01-01T00:00:00Z");
const orbit = (k: number) => ({ id: `rock-${k}`, semiMajorAxisKm: 80_000 + 5_000 * k, eccentricity: 0.1 + 0.02 * k, inclinationDeg: 5 + k, raanDeg: 40 + 3 * k, argumentOfPeriapsisDeg: 70 + k });
const ring = (extra: Partial<GroupInput> = {}): GroupInput => ({ id: "ring", plane: "ecliptic-j2000", orbits: [0, 1, 2, 3, 4, 5].map(orbit), ...extra });
const base = () => new Scene().addBody(earth).addBody(moon).setTime(T0);
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return "no error"; };
const positions = (definition: ExperienceDefinition, time = T0 + 3_600_000) => {
  const out = new Float64Array(18);
  groupsOf(definition)[0]!.group.fillPositionsKm(time, out);
  return Array.from(out);
};

describe("addGroup", () => {
  it("draws the orbits as one group on the points layer, with one menu item, colour, dot size and provenance", () => {
    const definition = definitionOf(base().addGroup(ring({ label: "Ring", color: "#ff8800", dotSizePx: 4, refillAfterMs: 600_000, description: "Six made-up rocks." })));
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
    const plain = groupsOf(definitionOf(base().addGroup(ring({ knownLimitations: ["Invented rocks."] }))))[0]!.object.knownLimitations!;
    expect(plain[0]).toBe("Invented rocks.");
    expect(plain.some((line) => /illustrative/.test(line))).toBe(true);
    expect(plain.some((line) => /two-body/.test(line))).toBe(true);
    expect(plain.some((line) => /clump/.test(line))).toBe(false);
    const clumped = groupsOf(definitionOf(base().addGroup(ring({ clump: { near: "moon", fraction: 0.5, widthDeg: 20 } }))))[0]!.object.knownLimitations!;
    expect(clumped.some((line) => /50% of the dots are drawn near Moon/.test(line))).toBe(true);
  });

  it("joins the automatic camera menu and can be named by a story panel", () => {
    const scene = base().addGroup(ring({ label: "Ring" })).addStoryPanels([{ id: "p", at: { time: "2026-01-01T00:01:00Z" }, title: "The ring", body: ["Made up."], provenance: { sourceType: "illustrative" as const, sources: ["Invented"], accuracy: "None claimed.", notes: "Made up." }, object: "ring" }]);
    scene.camera.follow("ring");
    const definition = definitionOf(scene);
    const presets = definition.experience.cameraPresets.map((preset) => preset.id);
    expect(presets).toContain("focus-ring");
    expect(presets).toContain("follow-ring");
    expect(definition.experience.startCameraPresetId).toBe("follow-ring");
    expect(definition.experience.storyPanels?.panels.map((panel) => panel.objectId)).toEqual(["ring"]);
    expect(() => definitionOf(new Scene().addBody(earth).addStoryPanels([{ id: "p", at: { time: "2026-01-01T00:00:00Z" }, title: "x", body: ["y"], provenance: { sourceType: "illustrative" as const, sources: ["z"], accuracy: "None claimed.", notes: "Made up." }, object: "ring" }]))).toThrow();
  });

  it("places the dots the same way for the same seed and differently for another, along the listed orbits", () => {
    const a = positions(definitionOf(base().addGroup(ring({ seed: 3 }))));
    const b = positions(definitionOf(base().addGroup(ring({ seed: 3 }))));
    const c = positions(definitionOf(base().addGroup(ring({ seed: 4 }))));
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
    const spread = positions(definitionOf(base().addGroup(ring({ seed: 1 }))));
    const clumped = positions(definitionOf(base().addGroup(ring({ seed: 1, clump: { near: "moon", fraction: 1, widthDeg: 10 } }))));
    expect(clumped).not.toEqual(spread);
  });

  it("circles another body in the scene when asked, and keeps ids in one namespace", () => {
    const definition = definitionOf(base().addGroup(ring({ center: "moon", plane: "EQJ" })));
    expect(groupsOf(definition)[0]!.group.center).toBe("moon");
    expect(codeOf(() => base().addGroup(ring()).addBody("mars").addGroup(ring({ id: "mars" })))).toBe("duplicate-id");
    expect(codeOf(() => base().addGroup(ring()).addGroup(ring()))).toBe("duplicate-id");
    expect(codeOf(() => base().addGroup(ring({ id: "earth" })))).toBe("duplicate-id");
  });

  it("names the code by what is wrong with the centre: unknown-body when it is not a catalogued body, bad-group when it is catalogued but not in the scene (I-084)", () => {
    expect(codeOf(() => base().addGroup(ring({ center: "made-up-centre" })))).toBe("unknown-body");
    expect(codeOf(() => definitionOf(new Scene().addBody(earth).addGroup(ring({ center: "moon" }))))).toBe("bad-group");
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
    // The plane is required (O-057 T-276): a plain JavaScript caller who leaves it out, or names another, is refused with bad-group and no default is applied.
    for (const plane of [undefined, "ecliptic", 5]) expect(codeOf(() => base().addGroup({ ...ring(), plane } as never)), String(plane)).toBe("bad-group");
    for (const plane of ["ecliptic-j2000", "EQJ"] as const) expect(codeOf(() => base().addGroup(ring({ plane })))).toBe("no error");
    // An unbound orbit (eccentricity 1 or more) and a bad shape are refused when the scene is built.
    for (const worse of [{ eccentricity: 1.2 }, { semiMajorAxisKm: -5 }, { inclinationDeg: 200 }]) {
      const scene = base().addGroup(ring({ orbits: [{ ...orbit(0), ...worse }] }));
      expect(codeOf(() => definitionOf(scene)), JSON.stringify(worse)).toBe("bad-group");
    }
    expect(() => base().addGroup({ ...ring(), id: "x", orbits: [{ ...orbit(0), id: "" }] })).toThrowError(/addGroup/);
  });

  it("refuses a centre or clump body the scene does not hold, and a clump on the centre itself", () => {
    expect(codeOf(() => definitionOf(new Scene().addBody(earth).addGroup(ring({ center: "moon" }))))).toBe("bad-group");
    expect(codeOf(() => definitionOf(new Scene().addBody(earth).addGroup(ring({ clump: { near: "moon", fraction: 0.5, widthDeg: 10 } }))))).toBe("bad-group");
    expect(codeOf(() => definitionOf(base().addGroup(ring({ clump: { near: "earth", fraction: 0.5, widthDeg: 10 } }))))).toBe("bad-group");
    expect(codeOf(() => base().addGroup(ring({ center: "nowhere" })))).toBe("unknown-body");
  });

  it("gives a group no info-card bars", () => {
    const definition = definitionOf(base().addGroup(ring()));
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
      epoch: { jd: 2_461_000.5, timeScale: "TDB", ttMinusUtcSeconds: 69.184 }, plane: "ecliptic-j2000",
      source: { name: "Invented Survey", url: "https://example.invalid/rock", solution: "A", accessed: "2026-10-24" },
      accuracy: { classification: "indicative", statement: "Made up.", valid: { start: "2025-01-01T00:00:00Z", end: "2027-01-01T00:00:00Z" }, limitations: ["Invented for a test."] },
      marker: { color: "#ff9966", sizePx: 8 },
    }).addGroup(ring({ center: "sun", clump: { near: "made-up-rock", fraction: 0.5, widthDeg: 20 }, refillSliceMs: 0 })).setTime(T0);
    const layer = definitionOf(scene).groups![0]!;
    expect(layer.refillSliceMs).toBe(0);
    expect(layer.object.knownLimitations!.join(" ")).toContain("Made-up rock");
  });

  it("refuses a clump near a body that is neither catalogued nor added from elements, and a bad refillSliceMs", () => {
    expect(codeOf(() => base().addGroup(ring({ clump: { near: "made-up-rock", fraction: 0.5, widthDeg: 20 } })))).toBe("bad-group");
    for (const bad of [-1, Number.NaN, Infinity]) expect(codeOf(() => base().addGroup(ring({ refillSliceMs: bad })))).toBe("bad-group");
  });
});

// O-077 T-323: an orbit may carry its catalogue mean anomaly at its own time; a group where every orbit does places each dot at its real position.
describe("measured positions with meanAnomalyDeg (O-077 T-323)", () => {
  const AU_KM = 149_597_870.7;
  // Ceres from JPL SBDB, epoch JD 2461200.5 TDB, ecliptic J2000.
  const CERES = { semiMajorAxisAu: 2.765552595034094, eccentricity: 0.07969229514816586, inclinationDeg: 10.58802780183462, ascendingNodeDeg: 80.24862682043221, argumentOfPerihelionDeg: 73.29421453021587, meanAnomalyDeg: 274.4193463761342 };
  const EPOCH_UTC_MS = (2461200.5 - 2440587.5) * 86_400_000 - 69_184;
  const YEAR_MS = 365.25 * 86_400_000;
  const ceresOrbit = { id: "1", time: EPOCH_UTC_MS, meanAnomalyDeg: CERES.meanAnomalyDeg, semiMajorAxisKm: CERES.semiMajorAxisAu * AU_KM, eccentricity: CERES.eccentricity, inclinationDeg: CERES.inclinationDeg, raanDeg: CERES.ascendingNodeDeg, argumentOfPeriapsisDeg: CERES.argumentOfPerihelionDeg };
  const measuredRing = (extra: Partial<GroupInput> = {}): GroupInput => ring({ orbits: [0, 1, 2, 3, 4, 5].map((k) => ({ ...orbit(k), time: T0 - k * 86_400_000, meanAnomalyDeg: 50 * k - 30 })), ...extra });
  const observed = { sourceType: "observed" as const, sources: ["Made-up survey"], accuracy: "Made up.", notes: "Invented rocks." };

  it("agrees with addBodyFromElements for the same record, at the epoch and a year later", async () => {
    const { sun } = await import("astraeus");
    const scene = new Scene().addBody(sun).addBodyFromElements({
      id: "ceres", label: "Ceres", elements: CERES,
      epoch: { jd: 2461200.5, timeScale: "TDB", ttMinusUtcSeconds: 69.184 }, plane: "ecliptic-j2000",
      source: { name: "JPL Small-Body Database", url: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=1", solution: "JPL 48", accessed: "2026-11-20" },
      accuracy: { classification: "indicative", statement: "Two-body.", valid: { start: "2026-01-01T00:00:00Z", end: "2028-12-31T00:00:00Z" }, limitations: ["Two-body."] },
      marker: { color: "#ff9966", sizePx: 8 },
    }).addGroup({ id: "belt", plane: "ecliptic-j2000", center: "sun", orbits: [ceresOrbit] }).setTimeline({ start: EPOCH_UTC_MS, end: EPOCH_UTC_MS + 2 * YEAR_MS });
    const group = definitionOf(scene).groups![0]!.group;
    for (const t of [EPOCH_UTC_MS, EPOCH_UTC_MS + YEAR_MS]) {
      const dot = new Float64Array(3);
      group.fillPositionsKm(t, dot);
      const body = scene.stateOf("ceres", t).positionKm;
      // Both paths use the Sun's GM 132712440018 km³/s² and the same epoch, so they differ only by rounding (well under a metre); 1e-3 km leaves room for it.
      expect(Math.hypot(dot[0]! - body[0]!, dot[1]! - body[1]!, dot[2]! - body[2]!)).toBeLessThan(1e-3);
    }
  });

  it("keeps the caller's sourceType on the card and in scene.groups, with the measured note and limit and the motion limit", () => {
    const scene = base().addGroup(measuredRing({ provenance: observed, knownLimitations: ["Invented rocks."] }));
    const read = scene.groups[0]!;
    const layer = groupsOf(definitionOf(scene))[0]!;
    const card = experienceWithGroups(definitionOf(scene)).objects.find((object) => object.id === "ring")!;
    expect(read.provenance).toEqual({ ...observed, notes: "Invented rocks. Each dot's position along its orbit comes from its record's mean anomaly at the record's epoch, advanced by unperturbed two-body motion about the centre." });
    expect(layer.group.provenance).toEqual(read.provenance);
    expect(card.provenance).toEqual(read.provenance);
    expect(read.knownLimitations).toEqual([
      "Invented rocks.",
      "Each dot's position comes from its record's mean anomaly by unperturbed two-body motion from the record's epoch; perturbations are ignored, so a dot drifts from the true position the further the time is from that epoch.",
      "Motion is unperturbed two-body motion about the centre.",
    ]);
    expect(layer.object.knownLimitations).toEqual(read.knownLimitations);
  });

  it("leaves an illustrative group's card exactly as before", () => {
    const read = base().addGroup(ring({ provenance: observed, knownLimitations: ["Invented rocks."] })).groups[0]!;
    expect(read.provenance).toEqual({
      sourceType: "illustrative",
      sources: ["Made-up survey"],
      accuracy: "Made up. Orbit elements are as listed (observed); the position along each orbit is illustrative.",
      notes: "Invented rocks. Each orbit's shape and orientation come from its record, but the records give no position along the orbit: that position is an even spread of mean anomaly at the reference time, a drawing choice (illustrative), advanced by unperturbed two-body motion about the centre.",
    });
    expect(read.description).toBe("6 listed orbits, each drawn as one dot. One item stands for the whole group; its focus point is the centroid of the dots.");
    expect(read.knownLimitations).toEqual([
      "Invented rocks.",
      "The position of each dot along its orbit is illustrative: the list gives the orbit's shape and orientation, and the dots are spread evenly along them.",
      "Motion is unperturbed two-body motion about the centre.",
    ]);
  });

  it("places the same dots whatever the reference time and list order", () => {
    const a = positions(definitionOf(base().addGroup(measuredRing())));
    const b = positions(definitionOf(base().addGroup(measuredRing({ referenceTime: T0 + 40 * 86_400_000 }))));
    for (let k = 0; k < a.length; k++) expect(Math.abs(a[k]! - b[k]!)).toBeLessThan(1e-6);
    const reversed = measuredRing();
    const back = positions(definitionOf(base().addGroup({ ...reversed, orbits: [...reversed.orbits].reverse() })));
    for (let k = 0; k < 6; k++) expect(back.slice(3 * (5 - k), 3 * (5 - k) + 3)).toEqual(a.slice(3 * k, 3 * k + 3));
  });

  it("refuses a mix, a non-finite mean anomaly, and seed or clump, with bad-group naming the cause", () => {
    const orbits = measuredRing().orbits;
    const mixed = [orbits[0]!, { ...orbits[1]!, meanAnomalyDeg: undefined }, ...orbits.slice(2)];
    expect(codeOf(() => base().addGroup(ring({ orbits: mixed })))).toBe("bad-group");
    expect(() => base().addGroup(ring({ orbits: mixed }))).toThrow(/orbit "rock-1" gives no meanAnomalyDeg/);
    for (const bad of [Number.NaN, Infinity, "12" as unknown as number]) {
      expect(codeOf(() => base().addGroup(ring({ orbits: [orbits[0]!, { ...orbits[1]!, meanAnomalyDeg: bad }] })))).toBe("bad-group");
    }
    expect(() => base().addGroup(measuredRing({ seed: 0 }))).toThrow(/seed only shuffles illustrative positions/);
    expect(codeOf(() => base().addGroup(measuredRing({ seed: 0 })))).toBe("bad-group");
    expect(() => base().addGroup(measuredRing({ clump: { near: "moon", fraction: 0.5, widthDeg: 20 } }))).toThrow(/clump only shapes illustrative positions/);
  });
});
