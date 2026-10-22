import { describe, expect, it } from "vitest";
import { Object3D } from "three";
import { catalogue, createCatalogue, rootBodyId, type VisualEntry } from "../src/assets/catalogue";
import { CompositionError, createComposition, earthMoonSystem, SIDEREAL_MONTH_MS, sunEarthSystem } from "../src/assets/compositions";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import type { CelestialBodyDefinition, StateSourceBinding } from "../src/core/body";
import { directionFromCenterToSun, directionToSun } from "../src/core/illumination";
import { createProvenance } from "../src/core/provenance";
import { earthStateAt, sunPositionFromEarthAt } from "../src/core/referenceCenters";
import { readableScale, trueScale, type ScalePolicy } from "../src/core/scalePolicy";
import { createStateResolver } from "../src/core/stateResolver";
import { createState, type Quaternion, type State } from "../src/core/state";
import type { Trajectory } from "../src/core/trajectory";
import {
  compositionOf,
  mountedBodiesOf,
  sceneCenterOf,
  type ExperienceDefinition,
} from "../src/app/experienceDefinition";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { PointsView } from "../src/app/PointsView";
import { eqjToRenderVector } from "../src/app/renderCoordinates";
import {
  createSceneResolver,
  readoutPairOf,
  placeBody,
  placeComposition,
  trackedAbsolute,
} from "../src/app/sceneLayout";
import { assignBodyLayers, BARE_SCENE_SPAN, defaultDistance, focusLimits, focusRadius } from "../src/app/sceneFraming";
import { TRACK_LAYER, TrackedBodyView } from "../src/app/TrackedBodyView";
import { apollo11Definition } from "../src/experiences/apollo11/apollo11Definition";
import { apollo11Mission } from "../src/experiences/apollo11/apollo11";
import { buildShowerDefinition } from "../src/experiences/showers/showerDefinition";
import { madeUpOrbits } from "./helpers/measuredOrbits";
import { parseShowerSettings } from "../src/experiences/showers/showerSettings";
import perseidsFile from "../data/showers/perseids.json";
import { syntheticBareDefinition, syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import { syntheticBeltDefinition, syntheticRingDefinition, syntheticRingLayer } from "../src/synthetic/syntheticRingDefinition";
import { PerspectiveCamera } from "three";
import { createSceneHierarchy, hasEarthMoon, placeBodies, placementAbout } from "./scenePlacement";

const adapter = createOrbAstronomyAdapter();
const DATES = [Date.UTC(2023, 0, 15, 3), Date.UTC(2024, 6, 1, 12), Date.UTC(2025, 2, 20, 9, 30)];
const provenance = createProvenance({ sourceType: "illustrative", sources: ["made up"], accuracy: "none", notes: "" });
const accuracy = { dimensions: provenance, position: provenance, validUtc: { startUtcMs: 0, endUtcMs: 1e12 }, orientationLimitations: [] };

describe("compositions", () => {
  it("name catalogued ids only, with their natural centre", () => {
    expect(earthMoonSystem).toMatchObject({ id: "earth-moon", bodies: ["earth", "moon"], defaultCenter: "earth" });
    expect(sunEarthSystem).toMatchObject({ id: "sun-earth", bodies: ["sun", "earth"], defaultCenter: "sun" });
    expect(earthMoonSystem.paths).toEqual([{ body: "moon", spanMs: SIDEREAL_MONTH_MS }]);
    expect(Object.isFrozen(earthMoonSystem)).toBe(true);
  });

  it("rejects an id the catalogue lacks, a repeat, a centre not in the list, and a path off the list", () => {
    const base = { id: "x", bodies: ["earth", "moon"], defaultCenter: "earth" };
    expect(() => createComposition(catalogue, base)).not.toThrow();
    expect(() => createComposition(catalogue, { ...base, bodies: ["earth", "ceres"] })).toThrow(/catalogue lacks/);
    expect(() => createComposition(catalogue, { ...base, bodies: ["earth", "earth"] })).toThrow(/twice/);
    expect(() => createComposition(catalogue, { ...base, defaultCenter: "sun" })).toThrow(/not one of its bodies/);
    expect(() => createComposition(catalogue, { ...base, bodies: [] })).toThrow(CompositionError);
    expect(() => createComposition(catalogue, { ...base, paths: [{ body: "sun", spanMs: 1 }] })).toThrow(/not one of its bodies/);
    expect(() => createComposition(catalogue, { ...base, paths: [{ body: "moon", spanMs: 0 }] })).toThrow(/positive finite span/);
  });
});

describe("experience definitions name their compositions", () => {
  const withAlias: readonly (readonly [string, ExperienceDefinition, boolean])[] = [
    ["Apollo", apollo11Definition, true],
    ["synthetic", syntheticDefinition, true],
    ["the ring", syntheticRingDefinition, true],
    ["a shower", buildShowerDefinition(parseShowerSettings(perseidsFile), { kind: "loaded", orbits: madeUpOrbits(7, 50) }), false],
    ["bare", syntheticBareDefinition, false],
    ["the belt", syntheticBeltDefinition, false],
  ];
  it.each(withAlias)("%s: usesEarthMoon is %s-consistent and the centre is as before", (_name, definition, earthMoon) => {
    expect(hasEarthMoon(definition)).toBe(earthMoon);
    if (earthMoon) {
      expect(compositionOf(definition)).toBe(earthMoonSystem);
      expect(mountedBodiesOf(definition)).toEqual(["earth", "moon"]);
      expect(sceneCenterOf(definition)).toBe("earth");
    }
  });

  it("gives a scene with no composition no bodies and the zero it declares, and refuses to guess one", () => {
    expect(compositionOf(syntheticBareDefinition)).toBeUndefined();
    expect(mountedBodiesOf(syntheticBareDefinition)).toEqual([]);
    expect(sceneCenterOf(syntheticBareDefinition)).toBe("earth");
    expect(() => sceneCenterOf({ ...syntheticBareDefinition, sceneCenter: undefined })).toThrow(/must declare its sceneCenter/);
  });

  it("mounts the belt as the Sun and Earth about the Sun", () => {
    expect(compositionOf(syntheticBeltDefinition)).toBe(sunEarthSystem);
    expect(mountedBodiesOf(syntheticBeltDefinition)).toEqual(["sun", "earth"]);
    expect(sceneCenterOf(syntheticBeltDefinition)).toBe("sun");
  });

  it("rejects a scene centre outside the catalogue or the composition", () => {
    expect(() => sceneCenterOf({ ...syntheticDefinition, sceneCenter: "ceres" })).toThrow(/not in the catalogue/);
    expect(() => sceneCenterOf({ ...syntheticDefinition, sceneCenter: "sun" })).toThrow(/not one of composition/);
    expect(sceneCenterOf({ ...syntheticDefinition, sceneCenter: "moon" })).toBe("moon");
  });
});

describe("Apollo's framing numbers come out of the body definitions exactly", () => {
  const moonRadius = 1737.4 / 6371;
  it.each([[trueScale], [readableScale]] as const)("limits, default distances and radii under %o", (policy: ScalePolicy) => {
    for (const span of [6, 60.3, 600]) {
      const frame = { centre: "earth", span };
      expect(focusLimits("earth", frame, policy, {})).toEqual({ min: 1.15, max: Math.max(30, span * 3.5) });
      expect(focusLimits("moon", frame, policy, {})).toEqual({ min: moonRadius * 1.6, max: Math.max(30, span * 3.5) });
      expect(focusLimits("columbia", frame, policy, {})).toEqual({ min: 0.002, max: Math.max(30, span * 3.5) });
      expect(defaultDistance("earth", frame, policy)).toBe(Math.max(3.2, span * 2.4));
      expect(defaultDistance("moon", frame, policy)).toBe(moonRadius * 4);
      expect(defaultDistance("columbia", frame, policy)).toBe(0.3);
    }
    expect(focusRadius("earth", policy)).toBe(1);
    expect(focusRadius("moon", policy)).toBe(moonRadius);
    expect(focusRadius("columbia", policy)).toBe(0);
  });

  it("keeps the camera outside the Sun's drawn sphere (T-038: it is emissive with a true radius), and treats the centre body of another scene as the whole-scene body", () => {
    const frame = { centre: "sun", span: 23_455 };
    expect(focusLimits("sun", frame, trueScale, {}).min).toBeCloseTo((695_700 / catalogue.get("earth").definition.radiusKm) * 1.15, 9);
    // The scene frames the Sun by its paths' reach (it is marker-kind), so this default is not what the camera uses for it.
    expect(defaultDistance("sun", frame, trueScale)).toBe(Math.max(3.2, 23_455 * 2.4));
    expect(focusLimits("earth", frame, trueScale, {}).min).toBe(1.6);
    expect(defaultDistance("earth", frame, trueScale)).toBe(4);
    const moonCentred = { centre: "moon", span: 60 };
    expect(focusLimits("moon", moonCentred, trueScale, {}).min).toBe(moonRadius * 1.15);
    expect(defaultDistance("moon", moonCentred, trueScale)).toBe(Math.max(3.2, 60 * 2.4));
  });

  it("keeps Earth and the Moon on render layers 1 and 2, and the Sun on the overlay layer", () => {
    expect([...assignBodyLayers(["earth", "moon"], TRACK_LAYER)]).toEqual([["earth", 1], ["moon", 2]]);
    expect([...assignBodyLayers(["sun", "earth"], TRACK_LAYER)]).toEqual([["sun", TRACK_LAYER], ["earth", 1]]);
  });
});

describe("the scene places Earth and the Moon exactly as before", () => {
  const placement = placementAbout("earth", adapter);
  it.each(DATES)("positions, orientations and lights at %i", (date) => {
    for (const policy of [trueScale, readableScale]) {
      const oldHierarchy = createSceneHierarchy();
      const moonFromEarth = placement.resolver.stateOf("moon", date, "earth");
      const oldPlaced = placeBodies(oldHierarchy, earthStateAt(adapter, date), moonFromEarth, policy, new FloatingOrigin());

      const composed = placeComposition(["earth", "moon"], placement, policy, date);
      expect(composed.absolutes.get("earth")).toEqual(oldPlaced.earthAbsolute);
      expect(composed.absolutes.get("moon")).toEqual(oldPlaced.moonAbsolute);
      expect(composed.span).toBe(Math.hypot(
        oldPlaced.moonAbsolute[0] - oldPlaced.earthAbsolute[0],
        oldPlaced.moonAbsolute[1] - oldPlaced.earthAbsolute[1],
        oldPlaced.moonAbsolute[2] - oldPlaced.earthAbsolute[2],
      ));
      for (const [id, group, mesh, state] of [
        ["earth", oldHierarchy.earthGroup, oldHierarchy.earthMesh, composed.states.get("earth")!],
        ["moon", oldHierarchy.moonGroup, oldHierarchy.moonMesh, composed.states.get("moon")!],
      ] as const) {
        const newGroup = new Object3D();
        const newMesh = new Object3D();
        placeBody(newGroup, newMesh, state, state.positionKm, catalogue.get(id).visual.textureYawRad ?? 0, policy, new FloatingOrigin());
        expect(newGroup.position.toArray()).toEqual(group.position.toArray());
        expect(newMesh.quaternion.toArray()).toEqual(mesh.quaternion.toArray());
      }
    }
    // Each body's own Sun direction, from the resolver, against the formulas the scene used before.
    const sunFromEarth = sunPositionFromEarthAt(adapter, date);
    const moonFromEarth = placement.resolver.stateOf("moon", date, "earth");
    const oldEarth = directionFromCenterToSun(sunFromEarth);
    const oldMoon = directionToSun(moonFromEarth, sunFromEarth);
    const newEarth = directionFromCenterToSun(placement.resolver.sunFrom("earth", date));
    const newMoon = directionFromCenterToSun(placement.resolver.sunFrom("moon", date));
    for (let k = 0; k < 3; k += 1) {
      expect(newEarth[k]).toBeCloseTo(oldEarth[k], 12);
      expect(newMoon[k]).toBeCloseTo(oldMoon[k], 12);
    }
  });

  it("an Earth-centred scene adds nothing to Earth-centred data: tracked positions are the samples", () => {
    const columbia = apollo11Mission.bodies[0];
    const t = (columbia.trajectory.bounds.startUtcMs + columbia.trajectory.bounds.endUtcMs) / 2;
    const state = columbia.trajectory.stateAt(t);
    expect(trackedAbsolute(state, trueScale, placement)).toEqual(eqjToRenderVector(trueScale.mapPosition(state.positionKm)));
  });

  it("draws the Moon's path from the resolver's samples, the same ones the loop was drawn from", () => {
    const t = DATES[0];
    const path = earthMoonSystem.paths![0];
    const viaResolver = placement.resolver.stateOf(path.body, t, "earth").positionKm;
    expect(Array.from(viaResolver)).toEqual(Array.from(adapter.moonPositionKm(t)));
  });
});

describe("tracked data and groups follow the scene centre", () => {
  const columbia = apollo11Mission.bodies[0];
  const mid = (columbia.trajectory.bounds.startUtcMs + columbia.trajectory.bounds.endUtcMs) / 2;

  it("a Moon-centred scene shifts Earth-measured data by the Earth's offset from the Moon", () => {
    const placement = placementAbout("moon", adapter);
    const state = columbia.trajectory.stateAt(mid);
    const earthFromMoon = placement.resolver.offsetKm("earth", "moon", mid);
    const expected = eqjToRenderVector(trueScale.mapPosition([0, 1, 2].map((k) => state.positionKm[k] + earthFromMoon[k])));
    expect(trackedAbsolute(state, trueScale, placement)).toEqual(expected);
  });

  it("a relative trail is drawn from each sample's own-time offset, and unchanged when the scene is Earth-centred", () => {
    const camera = new PerspectiveCamera();
    const lineOf = (centre: string) => {
      const view = new TrackedBodyView(columbia);
      view.update(mid, trueScale, new FloatingOrigin(), camera, placementAbout(centre, adapter));
      const travelled = view.group.children[0] as import("three").Line;
      const positions = travelled.geometry.getAttribute("position");
      return [positions.getX(0), positions.getY(0), positions.getZ(0)];
    };
    const first = columbia.trajectory.stateAt(columbia.pathTimesUtcMs[0]);
    const earthCentred = lineOf("earth");
    // The line buffer is Float32; the samples are placed as they are (no offset is added in an Earth-centred scene).
    eqjToRenderVector(trueScale.mapPosition(first.positionKm)).forEach((value, k) => expect(earthCentred[k]).toBeCloseTo(value, 6));
    const moonCentred = lineOf("moon");
    const shift = placementAbout("moon", adapter).resolver.offsetKm("earth", "moon", columbia.pathTimesUtcMs[0]);
    const expected = eqjToRenderVector(trueScale.mapPosition([0, 1, 2].map((k) => first.positionKm[k] + shift[k])));
    moonCentred.forEach((value, k) => expect(value).toBeCloseTo(expected[k], 3));
  });

  it("the ring group, centred on Earth, is the same in an Earth-centred scene and offset in a Sun-centred one", () => {
    const t = syntheticRingLayer.group.bounds!.startUtcMs + 600_000;
    const read = (centre: string) => {
      const view = new PointsView(syntheticRingLayer);
      view.sync(t, placementAbout(centre, adapter), trueScale);
      view.place(new FloatingOrigin());
      return view.absolute();
    };
    const earthCentred = read("earth");
    const sunCentred = read("sun");
    const earthFromSun = placementAbout("sun", adapter).resolver.offsetKm("earth", "sun", t);
    const delta = [0, 1, 2].map((k) => sunCentred[k] - earthCentred[k]);
    const expected = eqjToRenderVector(trueScale.mapPosition(earthFromSun));
    delta.forEach((value, k) => expect(value).toBeCloseTo(expected[k], 3));
  });
});

// A made-up system: a star, a world about it, and a moonlet about the world; nothing here is a real body.
const fake = (id: string, parentId: string | undefined, radiusKm: number, orientation: CelestialBodyDefinition["orientation"] = "none"): CelestialBodyDefinition => ({
  id, label: id, radiusKm, ...(parentId === undefined ? {} : { parentId }), orientation, accuracy,
});
const spin: Quaternion = [0, 0, Math.SQRT1_2, Math.SQRT1_2];
const fakeBinding = (body: string, center: string, position: number[], orientation: Quaternion | null): StateSourceBinding => ({
  body,
  create: (): Trajectory => ({
    body,
    stateAt: (timeUtcMs, from = center) => {
      if (from !== center) throw new RangeError(`${body} holds center ${center}`);
      return createState({ body, center, timeUtcMs, positionKm: position.map((v) => v * (1 + timeUtcMs / 1e9)), orientation });
    },
  }),
});
const fakeDefinitions = [fake("star", undefined, 700_000), fake("world", "star", 6_000, "iau-rotation"), fake("moonlet", "world", 800)];
const fakeBindings = [fakeBinding("world", "star", [1.5e8, 0, 0], spin), fakeBinding("moonlet", "world", [0, 4e5, 0], null)];
const flatVisual: VisualEntry["visual"] = { kind: "sphere", material: { color: "#888888", roughness: 1, metalness: 0 }, light: { ambient: 0.1, directional: 1 } };
const fakeCatalogue = createCatalogue(fakeDefinitions, fakeBindings, [
  { body: "star", visual: { kind: "marker", material: flatVisual.material, marker: { sizePx: 8 } } },
  { body: "world", visual: flatVisual },
  { body: "moonlet", visual: flatVisual },
]);
const fakeResolver = createStateResolver(fakeCatalogue.definitions(), fakeCatalogue.sources(), adapter);

describe("generic lookups on a made-up catalogue", () => {
  it("finds the root and the pair the developer readout measures without naming a body", () => {
    expect(rootBodyId(fakeCatalogue)).toBe("star");
    expect(readoutPairOf(["star", "world", "moonlet"], fakeCatalogue)).toEqual({ parent: "world", child: "moonlet" });
    expect(readoutPairOf(["star", "world"], fakeCatalogue)).toBeNull();
    expect(readoutPairOf(["moonlet"], fakeCatalogue)).toBeNull();
    expect(readoutPairOf([], fakeCatalogue)).toBeNull();
  });
});

describe("a made-up composition of three bodies about a centre that is not Earth", () => {
  const system = createComposition(fakeCatalogue, { id: "made-up", bodies: ["star", "world", "moonlet"], defaultCenter: "world" });
  const placement = { resolver: fakeResolver, center: system.defaultCenter };
  const T = 1_000_000;

  it("places every body from the centre, with the centre at the zero", () => {
    const composed = placeComposition(system.bodies, placement, trueScale, T);
    const s = 1 + T / 1e9;
    expect(Array.from(composed.absolutes.get("world")!)).toEqual(Array.from(eqjToRenderVector([0, 0, 0])));
    expect(composed.absolutes.get("star")).toEqual(eqjToRenderVector(trueScale.mapPosition([-1.5e8 * s, -0, -0])));
    expect(composed.absolutes.get("moonlet")).toEqual(eqjToRenderVector(trueScale.mapPosition([0, 4e5 * s, 0])));
    expect(composed.centre).toEqual(composed.absolutes.get("world"));
    const star = composed.absolutes.get("star")!;
    expect(composed.span).toBe(Math.hypot(star[0], star[1], star[2]));
  });

  it("frames, limits and focuses each body from its own definition", () => {
    const composed = placeComposition(system.bodies, placement, trueScale, T);
    const frame = { centre: "world", span: composed.span, bodies: fakeCatalogue };
    expect(focusLimits("world", frame, trueScale, {})).toEqual({ min: 1.15 * (6_000 / 6371), max: Math.max(30, composed.span * 3.5) });
    expect(focusLimits("moonlet", frame, trueScale, {}).min).toBe((800 / 6371) * 1.6);
    expect(focusLimits("star", frame, trueScale, {}).min).toBe(0.002);
    expect(defaultDistance("world", frame, trueScale)).toBe(Math.max(3.2, composed.span * 2.4));
    expect(defaultDistance("moonlet", frame, trueScale)).toBe((800 / 6371) * 4);
    expect(focusRadius("moonlet", trueScale, fakeCatalogue)).toBe(800 / 6371);
    expect(focusRadius("star", trueScale, fakeCatalogue)).toBe(0);
    expect([...assignBodyLayers(system.bodies, TRACK_LAYER, fakeCatalogue)]).toEqual([["star", TRACK_LAYER], ["world", 1], ["moonlet", 2]]);
  });

  it("anchors each label and focus at the body's placed point, and mounts each as an object", () => {
    const composed = placeComposition(system.bodies, placement, readableScale, T);
    for (const id of system.bodies) {
      const group = new Object3D();
      const mesh = new Object3D();
      const state = composed.states.get(id)!;
      const origin = new FloatingOrigin();
      const absolute = placeBody(group, fakeDefinitions.find((d) => d.id === id)!.orientation === "none" ? null : mesh, state, state.positionKm, 0, readableScale, origin);
      expect(absolute).toEqual(composed.absolutes.get(id));
      expect(group.position.toArray()).toEqual(Array.from(origin.toLocal(absolute)));
    }
    composed.states.get("world")!.orientation!.forEach((value, k) => expect(value).toBeCloseTo(spin[k], 12));
  });
});

const BODIES = ["sun", "earth", "moon"] as const;
const bytes = (state: State) => `${Array.from(new Uint8Array(state.positionKm.buffer, state.positionKm.byteOffset, 24)).join(",")}|${state.orientation === null ? "" : Array.from(state.orientation).map((v) => v.toString(16)).join(",")}`;
const allStates = (resolver: ReturnType<typeof createSceneResolver>) => DATES.flatMap((t) => BODIES.flatMap((b) => BODIES.map((c) => `${b}/${t}/${c}:${bytes(resolver.stateOf(b, t, c))}`)));

describe("State is untouched by how a scene presents it (design E step 3)", () => {
  it("(i) is byte-identical for every body, time and centre whatever the scene centre, scale or camera", () => {
    const reference = allStates(createSceneResolver(adapter));
    const resolver = createSceneResolver(adapter);
    const camera = new PerspectiveCamera();
    // Built once: sampling the Apollo trajectory in the constructor costs about 75 ms, which times 18 passes made this case the suite's slowest under coverage (I-060).
    const tracked = new TrackedBodyView(apollo11Mission.bodies[0]);
    for (const centre of BODIES) {
      for (const policy of [trueScale, readableScale]) {
        for (const t of DATES) {
          const placement = { resolver, center: centre };
          placeComposition(BODIES, placement, policy, t);
          tracked.update(t, policy, new FloatingOrigin(), camera, placement);
          const view = new PointsView(syntheticRingLayer);
          view.sync(syntheticRingLayer.group.bounds!.startUtcMs, placement, policy);
          camera.position.set(1 + t % 7, 2, 3);
        }
        expect(allStates(resolver)).toEqual(reference);
      }
    }
  });

  it("(ii) round-trips within 1e-6 km, and the Sun from Earth is exactly the negated Earth from the Sun", () => {
    const resolver = createSceneResolver(adapter);
    for (const t of DATES) {
      const moonFromSun = resolver.stateOf("moon", t, "sun").positionKm;
      const earthFromSun = resolver.stateOf("earth", t, "sun").positionKm;
      const moonFromEarth = resolver.stateOf("moon", t, "earth").positionKm;
      for (let k = 0; k < 3; k += 1) expect(Math.abs(moonFromSun[k] - earthFromSun[k] - moonFromEarth[k])).toBeLessThan(1e-6);
      const sunFromEarth = resolver.stateOf("sun", t, "earth").positionKm;
      for (let k = 0; k < 3; k += 1) expect(sunFromEarth[k]).toBe(-earthFromSun[k]);
    }
  });

  it("(iii) two experiences with separately created resolvers give identical bytes", () => {
    const first = createSceneResolver(createOrbAstronomyAdapter());
    const second = createSceneResolver(createOrbAstronomyAdapter());
    // Mount the Apollo scene on one and the belt on the other, in different orders, before comparing.
    placeComposition(mountedBodiesOf(apollo11Definition), { resolver: first, center: sceneCenterOf(apollo11Definition) }, trueScale, DATES[0]);
    placeComposition(mountedBodiesOf(syntheticBeltDefinition), { resolver: second, center: sceneCenterOf(syntheticBeltDefinition) }, readableScale, DATES[2]);
    expect(allStates(first)).toEqual(allStates(second));
  });
});

describe("a scene with nothing else drawn frames by the bare span", () => {
  it("has no second body to measure against", () => {
    const placement = placementAbout("earth", adapter);
    expect(placeComposition([], placement, trueScale, DATES[0]).span).toBe(BARE_SCENE_SPAN);
    expect(placeComposition(["earth"], placement, trueScale, DATES[0]).span).toBe(BARE_SCENE_SPAN);
  });
});
