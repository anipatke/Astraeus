// O-059 T-267: `Scene.addBodySet`, proved on a made-up system (ARCH-03): members with elements about a made-up centre, each input changed alone, the reads, check and load,
// the typed `bad-body-set` errors, and (listed members) the same internal body set the demo builds today, with its data loaded through `data`.
import { afterEach, describe, expect, it, vi } from "vitest";
import { Scene, SceneError, sun, earth, io, jupiter, moon, pluto, charon, type BodySetInput, type BodySetMemberInput, type DataSource } from "astraeus";
import { familiesWithPalette } from "../src/app/bodySet";
import { bodySetsOf } from "../src/app/experienceDefinition";
import { createEphemerisGroup } from "../src/core/ephemerisGroup";
import { JUPITER_MOON_SYSTEM } from "../src/core/bodies/jupiterMoons";
import { PLUTO_MOON_SYSTEM } from "../src/core/bodies/planetMoons";
import { prepareScene } from "../src/api/prepared";
import { readBytes, readJson } from "../tools/import/test-io.mjs";
import { moonDataFolder } from "./moonData";
import { definitionOf, missingDataOf } from "../src/api/definitionOf";

const T0 = Date.parse("2026-01-01T00:00:00Z");
const DAY = 86_400_000;
const GM = 4.0e5;
const PROVENANCE = { sourceType: "illustrative", sources: ["Made up for a test"], accuracy: "Not real.", notes: "Invented members." } as const;
const elements = (k: number, extra: object = {}) => ({ semiMajorAxisKm: 30_000 + 4_000 * k, eccentricity: 0.05 * k, inclinationDeg: 3 + k, raanDeg: 20 + 7 * k, argumentOfPeriapsisDeg: 40 + 5 * k, trueAnomalyDeg: 10 + 30 * k, ...extra });
const member = (k: number, family = "inner", extra: Partial<BodySetMemberInput> = {}): BodySetMemberInput => ({ id: `bit-${k}`, label: `Bit ${k}`, radiusKm: 4 + k, family, elements: elements(k), ...extra });
const set = (extra: Partial<BodySetInput> = {}): BodySetInput => ({
  id: "swarm",
  families: [{ id: "inner", label: "Inner swarm" }, { id: "outer", label: "Outer swarm" }],
  members: [member(0), member(1), member(2, "outer")],
  provenance: PROVENANCE,
  centerGmKm3S2: GM,
  ...extra,
});
/** A made-up centre: a body with its own gravity, so it can be a body set's centre. The scene's centre is Earth; the set circles it unless `center` says otherwise. */
/** A made-up centre of a made-up system: a body on a Sun orbit with no gravity of its own on record. */
const WANDERER = { id: "wanderer", label: "Wanderer", elements: { semiMajorAxisAu: 2, eccentricity: 0.1, inclinationDeg: 5, ascendingNodeDeg: 40, argumentOfPerihelionDeg: 70, meanAnomalyDeg: 0 }, epoch: { jd: 2461041.5, timeScale: "UTC" }, frame: "ecliptic-j2000", source: { name: "Invented", url: "https://example.invalid/", solution: "Invented", accessed: "2026-01-01" }, accuracy: { classification: "approximate", statement: "Invented.", validFromUtc: "2026-01-01T00:00:00Z", validToUtc: "2027-01-01T00:00:00Z", limitations: [] }, marker: { color: "#ffffff", sizePx: 3 } } as never;
const base = () => new Scene().addBody(earth).addBody(moon).setTime(T0).setTimeline({ start: T0, end: T0 + 60 * DAY });
const layerOf = (scene: Scene, data: readonly DataSource[] = []) => bodySetsOf(definitionOf(scene, data))[0]!;
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return "no error"; };

describe("addBodySet with made-up members (elements)", () => {
  it("builds the internal body set: group, members, families with palette colours, centre gravity, no balance point", () => {
    const layer = layerOf(base().addBodySet(set()));
    expect(layer.id).toBe("swarm");
    expect(layer.group.id).toBe("swarm");
    expect(layer.group.center).toBe("earth");
    expect(layer.group.members).toEqual(["bit-0", "bit-1", "bit-2"]);
    expect(layer.members).toEqual([{ id: "bit-0", label: "Bit 0", radiusKm: 4, family: "inner" }, { id: "bit-1", label: "Bit 1", radiusKm: 5, family: "inner" }, { id: "bit-2", label: "Bit 2", radiusKm: 6, family: "outer" }]);
    expect(layer.families).toEqual(familiesWithPalette([{ id: "inner", label: "Inner swarm" }, { id: "outer", label: "Outer swarm" }]));
    expect(layer.centreGmKm3S2).toBe(GM);
    expect(layer.bodyFamilies).toEqual({});
    expect(layer.extraOrbits).toBeUndefined();
    expect(layer.balancePoint).toBeUndefined();
    expect(layer.group.provenance).toEqual(PROVENANCE);
  });

  it("each member's elements are honoured: the centre-relative radius stays between periapsis and apoapsis and returns after one period", () => {
    const scene = base().addBodySet(set());
    for (const k of [0, 1, 2]) {
      const e = elements(k);
      const period = 2 * Math.PI * Math.sqrt(e.semiMajorAxisKm ** 3 / GM) * 1000;
      const norm = (ms: number) => Math.hypot(...scene.stateOf(`bit-${k}`, ms).positionKm);
      for (const fraction of [0, 0.2, 0.5, 0.8]) expect(norm(T0 + Math.round(fraction * period))).toBeGreaterThanOrEqual(e.semiMajorAxisKm * (1 - e.eccentricity) * 0.9999);
      const a = scene.stateOf(`bit-${k}`, T0);
      const b = scene.stateOf(`bit-${k}`, T0 + Math.round(period));
      for (let i = 0; i < 3; i += 1) expect(b.positionKm[i]).toBeCloseTo(a.positionKm[i], 0);
      expect(a.body).toBe(`bit-${k}`);
      expect(a.center).toBe("earth");
      expect(a.velocityKmS).toBeDefined();
    }
    // At the epoch the member is where its true anomaly puts it.
    const e = elements(0);
    expect(Math.hypot(...scene.stateOf("bit-0", T0).positionKm)).toBeCloseTo(e.semiMajorAxisKm * (1 - e.eccentricity ** 2) / (1 + e.eccentricity * Math.cos(e.trueAnomalyDeg * Math.PI / 180)), 3);
  });

  it("the batch fill and the single state agree, and a time outside the scene's window is bad-time", () => {
    const scene = base().addBodySet(set());
    const group = layerOf(scene).group;
    const out = new Float64Array(9);
    group.fillPositionsKm(T0 + DAY, out);
    [0, 1, 2].forEach((index) => expect(Array.from(scene.stateOf(`bit-${index}`, T0 + DAY).positionKm)).toEqual(Array.from(out.subarray(3 * index, 3 * index + 3))));
    expect(codeOf(() => scene.stateOf("bit-0", T0 + 400 * DAY))).toBe("bad-time");
    expect(codeOf(() => scene.stateOf("bit-0", "not a time"))).toBe("bad-time");
  });

  it("the elements' own moment and plane move the member; another moment with the same sky is a different place", () => {
    const at = (extra: object) => Array.from(base().addBodySet(set({ members: [member(0, "inner", { elements: elements(0, extra) })] })).stateOf("bit-0", T0 + 5 * DAY).positionKm);
    const plain = at({});
    expect(at({ time: T0 - 3 * DAY })).not.toEqual(plain);
    expect(at({ time: T0 })).toEqual(plain);
    expect(at({ plane: "ecliptic-j2000" })).not.toEqual(plain);
    expect(at({ plane: "EQJ" })).toEqual(plain);
  });

  it("each input changed alone changes only its own part of the built set", () => {
    const baseline = layerOf(base().addBodySet(set()));
    const changed = (extra: Partial<BodySetInput>) => layerOf(base().addBodySet(set(extra)));
    expect(changed({ families: [{ id: "inner", label: "Inner swarm", color: "#112233" }, { id: "outer", label: "Outer swarm" }] }).families.map((f) => f.color)).toEqual(["#112233", baseline.families[1]!.color]);
    expect(changed({ families: [{ id: "inner", label: "Inner swarm" }, { id: "outer", label: "Outer swarm", brightness: 2.5 }] }).families.map((f) => f.brightness)).toEqual([undefined, 2.5]);
    expect(changed({ families: [{ id: "inner", label: "Renamed" }, { id: "outer", label: "Outer swarm" }] }).families[0]!.label).toBe("Renamed");
    expect(changed({ centerGmKm3S2: GM * 4 }).centreGmKm3S2).toBe(GM * 4);
    expect(changed({ provenance: { ...PROVENANCE, accuracy: "Other." } }).group.provenance.accuracy).toBe("Other.");
    expect(changed({ id: "other" }).id).toBe("other");
    expect(changed({ balancePoint: { body: "bit-1", gmKm3S2: 9 } }).balancePoint).toEqual({ body: "bit-1", gmKm3S2: 9 });
    expect(changed({ orbitHistoryMs: 5 * DAY }).members).toEqual(baseline.members);
    expect(changed({ members: [member(0), member(1, "inner", { radiusKm: 99, label: "Big" }), member(2, "outer")] }).members[1]).toEqual({ id: "bit-1", label: "Big", radiusKm: 99, family: "inner" });
    expect(changed({ members: [member(0), member(1, "outer"), member(2, "outer")] }).members.map((m) => m.family)).toEqual(["inner", "outer", "outer"]);
    for (const alone of [changed({ families: [{ id: "inner", label: "Inner swarm", color: "#112233" }, { id: "outer", label: "Outer swarm" }] }), changed({ centerGmKm3S2: GM * 4 }), changed({ orbitHistoryMs: DAY })]) {
      expect(alone.members).toEqual(baseline.members);
    }
  });

  it("a centre other than the scene's first body is used, and a family with no colour cycles the palette in order", () => {
    const layer = layerOf(base().addBodySet(set({ center: moon, centerGmKm3S2: 1000 })));
    expect(layer.group.center).toBe("moon");
    const many = layerOf(base().addBodySet(set({ families: Array.from({ length: 10 }, (_, i) => ({ id: `f${i}`, label: `F${i}` })), members: [member(0, "f9")] })));
    expect(many.families.map((f) => f.color)).toEqual(familiesWithPalette(Array.from({ length: 10 }, (_, i) => ({ id: `f${i}`, label: `F${i}` }))).map((f) => f.color));
  });

  it("each member becomes a selectable shell item after the bodies and paths: unlisted by default, with its words and its own or the set's provenance", () => {
    const own = { ...PROVENANCE, accuracy: "Own." };
    const scene = base().addTrajectory({ id: "probe", center: "earth", samples: [0, 1].map((i) => ({ time: T0 + i * DAY, positionKm: [1e5 + i, 0, 0] })) }).addBodySet(set({ members: [member(0, "inner", { description: "Words.", facts: [{ label: "Colour", value: "grey" }], listed: true, provenance: own, knownLimitations: ["Invented."] }), member(1)] }));
    const ids = definitionOf(scene).experience.objects.map((object) => object.id);
    expect(ids).toEqual(["earth", "moon", "probe", "bit-0", "bit-1"]);
    const [first, second] = definitionOf(scene).experience.objects.slice(3);
    expect(first).toMatchObject({ label: "Bit 0", listed: true, description: "Words.", facts: [{ label: "Colour", value: "grey" }], provenance: own, knownLimitations: ["Invented."] });
    expect(second).toMatchObject({ label: "Bit 1", listed: false, provenance: PROVENANCE });
    expect(second!.description).toMatch(/Inner swarm/);
    expect(definitionOf(scene).experience.cameraPresets.map((p) => p.id)).not.toContain("focus-bit-0");
  });

  it("stateOf and provenanceOf accept member ids, and story panels may name them", () => {
    const own = { ...PROVENANCE, accuracy: "Own." };
    const scene = base().addBodySet(set({ members: [member(0, "inner", { provenance: own }), member(1)] })).addStoryPanels({ panels: [{ id: "p", at: { utc: "2026-01-01T00:01:00Z" }, title: "A bit", body: ["Made up."], badge: "illustrative", sources: ["Invented"], object: "bit-1" }] });
    expect(scene.provenanceOf("bit-0")).toEqual(own);
    expect(scene.provenanceOf("bit-1")).toEqual(PROVENANCE);
    expect(scene.panels.map((panel) => panel.object)).toEqual(["bit-1"]);
    expect(definitionOf(scene).experience.storyPanels?.panels.map((panel) => panel.objectId)).toEqual(["bit-1"]);
    expect(codeOf(() => scene.stateOf("ghost", T0))).toBe("unknown-body");
  });

  it("a view cannot name a set or a member: it is in every view", () => {
    expect(codeOf(() => base().addBodySet(set()).setViews([{ id: "a", label: "A", objects: ["bit-0"] }, { id: "b", label: "B", objects: ["earth"] }], { place: "panel" }).check())).toBe("bad-view");
    expect(codeOf(() => base().addBodySet(set()).setViews([{ id: "a", label: "A", objects: ["swarm"] }, { id: "b", label: "B", objects: ["earth"] }], { place: "panel" }).check())).toBe("bad-view");
  });

  it("reads: a fresh frozen list that answers before and after a build, and in order added", () => {
    const scene = base().addBodySet(set()).addBodySet(set({ id: "second", members: [member(5, "inner"), member(6)], families: [{ id: "inner", label: "I" }] }));
    const reads = scene.bodySets;
    expect(reads).toEqual([{ id: "swarm", center: "earth", count: 3, families: ["inner", "outer"] }, { id: "second", center: "earth", count: 2, families: ["inner"] }]);
    expect(Object.isFrozen(reads)).toBe(true);
    expect(Object.isFrozen(reads[0])).toBe(true);
    expect(Object.isFrozen(reads[0]!.families)).toBe(true);
    expect(scene.bodySets).not.toBe(reads);
    expect(new Scene().bodySets).toEqual([]);
    definitionOf(scene);
    expect(scene.bodySets).toEqual(reads);
    expect(new Scene().addBody(earth).addBodySet(set({ center: "moon" })).bodySets[0]!.center).toBe("moon");
  });

  it("scene.check passes for a good set and throws the same SceneError as toDefinition for a bad one; scene.load resolves without data", async () => {
    const good = base().addBodySet(set());
    expect(() => good.check()).not.toThrow();
    await expect(good.load()).resolves.toBeUndefined();
    expect(good.stateOf("bit-0", T0 + DAY).positionKm).toHaveLength(3);
    expect(codeOf(() => base().addBodySet(set({ center: "mars" })).check())).toBe("bad-body-set");
    expect(codeOf(() => new Scene().addBodySet(set()).check())).toBe("empty-scene");
  });

  it("the bodies named in a set take its colour, and one with an orbit of its own keeps it", () => {
    const layer = layerOf(new Scene().addBody(earth).addBody(moon, { orbit: true }).setTime(T0).addBodySet(set({ bodies: [{ id: moon, family: "outer" }] })));
    // Without an orbit of its own it is not a listed moon of the centre's moon system, so the batch cannot draw its line: refused.
    expect(codeOf(() => base().addBodySet(set({ bodies: [{ id: moon, family: "outer" }] })).check())).toBe("bad-body-set");
    expect(layer.bodyFamilies).toEqual({ moon: "outer" });
    expect(layer.extraOrbits).toBeUndefined();
  });
});

describe("addBodySet refuses bad input with bad-body-set", () => {
  const rows: readonly (readonly [string, Partial<BodySetInput>])[] = [
    ["no families", { families: [] }],
    ["17 families", { families: Array.from({ length: 17 }, (_, i) => ({ id: `f${i}`, label: "F" })) }],
    ["a repeated family", { families: [{ id: "inner", label: "A" }, { id: "inner", label: "B" }] }],
    ["a family colour that is not hex", { families: [{ id: "inner", label: "A", color: "red" }, { id: "outer", label: "B" }] }],
    ["a family brightness of zero", { families: [{ id: "inner", label: "A", brightness: 0 }, { id: "outer", label: "B" }] }],
    ["no members", { members: [] }],
    ["a member in an unlisted family", { members: [member(0, "ghost")] }],
    ["a repeated member", { members: [member(0), member(0)] }],
    ["a member that is neither elements nor a listed moon", { members: [{ id: "nameless", family: "inner" }] }],
    ["elements without a label", { members: [{ id: "x", family: "inner", radiusKm: 3, elements: elements(0) }] }],
    ["elements without a radius", { members: [{ id: "x", family: "inner", label: "X", elements: elements(0) }] }],
    ["an unbound orbit", { members: [member(0, "inner", { elements: elements(0, { eccentricity: 1.2 }) })] }],
    ["a non-finite element", { members: [member(0, "inner", { elements: elements(0, { raanDeg: Number.NaN }) })] }],
    ["a plane that is not one of the two", { members: [member(0, "inner", { elements: elements(0, { plane: "galactic" }) })] }],
    ["a mix of listed and made-up members", { members: [member(0), { id: "amalthea", family: "inner" }] }],
    ["a centre gravity of zero", { centerGmKm3S2: 0 }],
    ["a negative orbit history", { orbitHistoryMs: -1 }],
    ["a balance point that is not in the set", { balancePoint: { body: "ghost", gmKm3S2: 5 } }],
    ["a balance point with no gravity", { balancePoint: { body: "bit-0", gmKm3S2: 0 } }],
    ["a body in an unlisted family", { bodies: [{ id: "moon", family: "ghost" }] }],
    ["a body the scene lacks", { bodies: [{ id: "io", family: "inner" }] }],
    ["no provenance", { provenance: undefined as never }],
    ["bad facts", { members: [member(0, "inner", { facts: [{ label: "", value: "x" }] })] }],
    ["a member with the set's id", { members: [member(0, "inner", { id: "swarm" })] }],
  ];
  it.each(rows)("%s", (_name, extra) => {
    expect(codeOf(() => base().addBodySet(set(extra)).check())).toBe("bad-body-set");
  });

  it("no gravity for the centre: a made-up centre without a record needs centerGmKm3S2", () => {
    const withoutGm = set({ centerGmKm3S2: undefined });
    expect(codeOf(() => base().addBodySet(withoutGm).check())).toBe("no error"); // the built-in centre has a record
    const scene = new Scene().addBody(sun).addBodyFromElements(WANDERER);
    expect(codeOf(() => scene.addBodySet({ ...withoutGm, center: "wanderer" }).check())).toBe("bad-body-set");
    // A made-up centre with a stated gravity is a whole made-up system: the members circle it.
    const system = new Scene().addBody(sun).addBodyFromElements(WANDERER).setTime(T0).addBodySet(set({ center: "wanderer" }));
    expect(() => system.check()).not.toThrow();
    expect(layerOf(system).group.center).toBe("wanderer");
    expect(system.stateOf("bit-0", T0).center).toBe("wanderer");
  });

  it("the id is shared with no body, path, group or member, and a member id cannot be added later", () => {
    expect(codeOf(() => base().addBodySet(set({ id: "earth" })))).toBe("duplicate-id");
    expect(codeOf(() => base().addBodySet(set()).addBodySet(set()))).toBe("duplicate-id");
    expect(codeOf(() => base().addBodySet(set()).addBodySet(set({ id: "other" })))).toBe("duplicate-id"); // same member ids
    expect(codeOf(() => base().addBodySet(set({ members: [member(0, "inner", { id: "moon" })] })))).toBe("duplicate-id");
    expect(codeOf(() => base().addBodySet(set()).addGroup({ plane: "ecliptic-j2000", id: "bit-0", orbits: [{ id: "a", semiMajorAxisKm: 9e4, eccentricity: 0.1, inclinationDeg: 5, raanDeg: 40, argumentOfPeriapsisDeg: 70 }] }))).toBe("duplicate-id");
    expect(codeOf(() => base().addBodySet(set()).addTrajectory({ id: "swarm", center: "earth", samples: [0, 1].map((i) => ({ time: T0 + i * DAY, positionKm: [1e5 + i, 0, 0] })) }))).toBe("duplicate-id");
  });

  it("a set cannot be added once a viewer has taken the scene", () => {
    const scene = base().addBodySet(set());
    expect(codeOf(() => scene.addBodySet(set({ id: "later", members: [member(7)] })))).toBe("no error"); // check and toDefinition leave it editable
    prepareScene(scene);
    expect(codeOf(() => scene.addBodySet(set({ id: "too-late", members: [member(8)] })))).toBe("scene-mounted");
    expect(scene.bodySets.map((read) => read.id)).toEqual(["swarm", "later"]); // reads still answer
  });
});

describe("addBodySet with listed moons (positions through data)", () => {
  const folder = moonDataFolder("jupiter");
  const index = readJson(`${folder}index.json`) as { bodies: { chunks: { path: string }[] }[] };
  const chunkUrls: Record<string, string> = Object.fromEntries(index.bodies.flatMap((body) => body.chunks.map(({ path }) => [path, `${folder}${path}`])));
  const data: DataSource[] = [{ name: "astraeus-data-jupiter", provides: [], moonPositions: { center: "jupiter", loadIndex: async () => index, chunkUrls } }];
  const T1 = Date.parse("2020-03-05T00:00:00Z");
  const listed = (extra: Partial<BodySetInput> = {}): BodySetInput => ({
    id: "small",
    families: [{ id: "inner", label: "Inner" }, { id: "far", label: "Far" }],
    members: [{ id: "amalthea", family: "inner" }, { id: "thebe", family: "inner", listed: true }, { id: "himalia", family: "far", label: "H" }],
    bodies: [{ id: io, family: "inner" }],
    provenance: PROVENANCE,
    ...extra,
  });
  const jupiterScene = (extra: Partial<BodySetInput> = {}) => new Scene().addBody(jupiter).addBody(io).addBodySet(listed(extra)).setTimeline({ start: Date.UTC(2020, 2, 1), end: Date.UTC(2020, 2, 20) });

  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("builds what the demo builds: the listed moons' group, the family-coloured body with its line in the batch, the system's gravity", () => {
    const layer = layerOf(jupiterScene(), data);
    const expectedGroup = createEphemerisGroup({ id: "small", center: "jupiter", ephemeris: JUPITER_MOON_SYSTEM.ephemeris, members: ["amalthea", "thebe", "himalia"], bounds: layer.group.bounds!, provenance: PROVENANCE });
    expect(layer.group.members).toEqual(expectedGroup.members);
    expect(layer.group.center).toBe(expectedGroup.center);
    expect(layer.group.count).toBe(3);
    expect(layer.members.map((m) => [m.id, m.label, m.family])).toEqual([["amalthea", "Amalthea", "inner"], ["thebe", "Thebe", "inner"], ["himalia", "H", "far"]]);
    expect(layer.members[0]!.radiusKm).toBeGreaterThan(0);
    expect(layer.families).toEqual(familiesWithPalette([{ id: "inner", label: "Inner" }, { id: "far", label: "Far" }]));
    expect(layer.bodyFamilies).toEqual({ io: "inner" });
    expect(layer.extraOrbits!.group.id).toBe("small-orbits");
    expect(layer.extraOrbits!.group.members).toEqual(["io"]);
    expect(layer.extraOrbits!.families).toEqual(["inner"]);
    expect(layer.extraOrbits!.group.provenance.accuracy).toBe("As each moon's own record.");
    expect(layer.centreGmKm3S2).toBe(JUPITER_MOON_SYSTEM.config.centreGmKm3S2);
    expect(layer.balancePoint).toBeUndefined();
    expect(bodySetsOf(definitionOf(jupiterScene(), data))).toHaveLength(1);
  });

  it("a body with an orbit of its own keeps it: it takes the family colour but has no line in the batch", () => {
    const scene = new Scene().addBody(jupiter).addBody(io, { orbit: true }).addBodySet(listed());
    const layer = layerOf(scene, data);
    expect(layer.bodyFamilies).toEqual({ io: "inner" });
    expect(layer.extraOrbits).toBeUndefined();
  });

  it("the centre's balance point is used when its body is drawn here, and a stated one wins", () => {
    const pdata: DataSource[] = [{ name: "astraeus-data-pluto", provides: [] }];
    const plutoScene = (extra: Partial<BodySetInput> = {}) => new Scene().addBody(pluto).addBody(charon).addBodySet({ id: "p", families: [{ id: "a", label: "A" }], members: [{ id: "nix", family: "a" }, { id: "hydra", family: "a" }], bodies: [{ id: charon, family: "a" }], provenance: PROVENANCE, ...extra }).setTimeline({ start: Date.UTC(2020, 2, 1), end: Date.UTC(2020, 2, 20) });
    expect(layerOf(plutoScene(), pdata).balancePoint).toEqual(PLUTO_MOON_SYSTEM.config.balancePoint);
    expect(layerOf(plutoScene({ balancePoint: { body: "nix", gmKm3S2: 3 } }), pdata).balancePoint).toEqual({ body: "nix", gmKm3S2: 3 });
    expect(layerOf(plutoScene({ bodies: [] }), pdata).balancePoint).toBeUndefined();
  });

  it("a moon of another planet, or an unlisted name, is bad-body-set", () => {
    expect(codeOf(() => jupiterScene({ members: [{ id: "nix", family: "inner" }] }).check({ data: [...data, { name: "astraeus-data-pluto", provides: [] }] }))).toBe("bad-body-set");
    expect(codeOf(() => new Scene().addBody(jupiter).addBodySet(listed({ bodies: [{ id: io, family: "inner" }] })).check({ data }))).toBe("bad-body-set");
  });

  it("scene.check and missingData ask for the package the members need, and accept it when passed", () => {
    expect(codeOf(() => jupiterScene().check({ data: [{ name: "made-up", provides: ["io"] }] }))).toBe("missing-data");
    const onlySet = new Scene().addBody(jupiter).addBodySet({ ...listed(), bodies: undefined });
    expect(missingDataOf(onlySet, [])).toEqual(["astraeus-data-jupiter"]);
    expect(missingDataOf(onlySet, data)).toEqual([]);
    expect(() => jupiterScene().check({ data })).not.toThrow();
  });

  /** A fetch that serves the committed fits and notes every file asked for. */
  const countingFetch = () => {
    const fetched: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      fetched.push(url);
      const bytes = readBytes(url) as Uint8Array;
      return { ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
    });
    return fetched;
  };

  it("scene.load loads the members' chunks and stateOf then answers like the fit", async () => {
    const fetched = countingFetch();
    JUPITER_MOON_SYSTEM.install(null);
    const scene = jupiterScene();
    expect(codeOf(() => scene.stateOf("amalthea", T1))).toBe("missing-data");
    await scene.load({ data });
    for (const id of ["io", "amalthea", "thebe", "himalia"]) expect(fetched.some((url) => url.endsWith(`${id}/2020.bin`))).toBe(true);
    for (const id of ["amalthea", "himalia"]) {
      expect(Array.from(scene.stateOf(id, T1).positionKm)).toEqual(Array.from(JUPITER_MOON_SYSTEM.ephemeris().stateOf(id, T1).positionKm));
    }
    expect(scene.provenanceOf("thebe")).toEqual(PROVENANCE);
  });

  it("orbitHistoryMs asks for the chunks before the window; without it none is loaded", async () => {
    const earlier = (fetched: string[]) => fetched.filter((url) => /\/(amalthea|himalia|thebe)\/2019\.bin$/.test(url));
    let fetched = countingFetch();
    JUPITER_MOON_SYSTEM.install(null);
    await jupiterScene().load({ data });
    expect(earlier(fetched)).toEqual([]);
    vi.unstubAllGlobals();
    fetched = countingFetch();
    JUPITER_MOON_SYSTEM.install(null);
    await jupiterScene({ orbitHistoryMs: 60 * DAY }).load({ data });
    expect(earlier(fetched).length).toBeGreaterThan(0);
  });
});
