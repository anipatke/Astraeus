import { describe, expect, it } from "vitest";
import { bodyMetrics, resolverTrajectory } from "../src/app/bodyMetrics";
import { catalogueItem } from "../src/app/catalogueItem";
import { drawnRadii } from "../src/app/bodyDraw";
import {
  assetWithOverride,
  compositionOf,
  experienceWithGroups,
  initialObjectIdOf,
  mountedBodiesOf,
  scaleChoiceIdsOf,
  sceneCenterOf,
  sunCentredOf,
  visualOverridesOf,
  type ExperienceDefinition,
} from "../src/app/experienceDefinition";
import { createSceneResolver } from "../src/app/sceneLayout";
import { createOrbitCameraState } from "../src/app/CameraController";
import { readoutPairOf } from "../src/app/sceneLayout";
import { catalogue } from "../src/assets/catalogue";
import { createComposition, earthMoonSystem, sunEarthSystem } from "../src/assets/compositions";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createSolarSystemScale, trueScale } from "../src/core/scalePolicy";
import type { StateResolver } from "../src/core/stateResolver";
import { apollo11Definition } from "../src/experiences/apollo11/apollo11Definition";
import { apolloMetrics } from "../src/experiences/apollo11/apolloMetrics";
import { apollo11Mission } from "../src/experiences/apollo11/apollo11";
import { earthMoonExplorer } from "../src/experiences/earth-moon/earthMoonExplorer";
import { buildShowerDefinition, createEarthPathLayer, parentOrbitIdOf, showerComposition } from "../src/experiences/showers/showerDefinition";
import { madeUpOrbits } from "./helpers/measuredOrbits";
import { parseShowerSettings } from "../src/experiences/showers/showerSettings";
import { scaleChoicesFor } from "../src/shell/scaleModel";
import { syntheticBareDefinition, syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import { syntheticBeltDefinition, syntheticRingDefinition } from "../src/synthetic/syntheticRingDefinition";
import perseidsFile from "../data/showers/perseids.json";

const adapter = createOrbAstronomyAdapter();
const resolver = createSceneResolver(adapter);
const settings = parseShowerSettings(perseidsFile);
const perseids = buildShowerDefinition(settings, { kind: "loaded", orbits: madeUpOrbits(7, 50) });
const EARTH_EXAGGERATION = settings.look.planetExaggeration;
const peak = Date.parse(settings.activity.peakUtc);
const start = Date.parse(settings.activity.startUtc);

describe("every experience names a composition", () => {
  it.each([
    ["the Earth–Moon Explorer", earthMoonExplorer, earthMoonSystem],
    ["Apollo", apollo11Definition, earthMoonSystem],
    ["Perseids", perseids, showerComposition(settings)],
    ["the synthetic marker", syntheticDefinition, earthMoonSystem],
    ["the synthetic ring", syntheticRingDefinition, earthMoonSystem],
    ["the synthetic belt", syntheticBeltDefinition, sunEarthSystem],
  ] as const)("%s", (_name, definition, composition) => {
    expect(compositionOf(definition)).toEqual(composition);
  });

  it("leaves only the bodiless fixture without one, on purpose", () => {
    expect(compositionOf(syntheticBareDefinition)).toBeUndefined();
    expect(mountedBodiesOf(syntheticBareDefinition)).toEqual([]);
  });

  it("no longer offers an earth-moon scene layer", () => {
    for (const definition of [earthMoonExplorer, apollo11Definition, perseids, syntheticDefinition, syntheticRingDefinition, syntheticBeltDefinition]) {
      expect(definition.sceneLayers as readonly string[]).not.toContain("earth-moon");
    }
  });
});

describe("the Earth–Moon Explorer", () => {
  it("is Earth and the Moon with the timeline and four camera presets, and nothing mission-shaped", () => {
    expect(mountedBodiesOf(earthMoonExplorer)).toEqual(["earth", "moon"]);
    expect(earthMoonExplorer.trackedBodies).toEqual([]);
    expect(earthMoonExplorer.experience.objects.map((object) => object.id)).toEqual(["earth", "moon"]);
    expect(earthMoonExplorer.experience.cameraPresets.map((preset) => preset.id)).toEqual(["overview", "focus-earth", "focus-moon", "follow-moon"]);
    expect(earthMoonExplorer.experience.events).toEqual([]);
    expect(earthMoonExplorer.developerSections).toBeUndefined();
    expect(earthMoonExplorer.clock.startUtcMs).toBe(earthMoonExplorer.experience.window.startUtcMs);
  });

  it("takes its labels and provenance from the catalogue", () => {
    const [earth, moon] = earthMoonExplorer.experience.objects;
    expect(earth.label).toBe(catalogue.get("earth").definition.label);
    expect(earth.provenance).toBe(catalogue.get("earth").definition.accuracy.position);
    expect(moon.provenance).toBe(catalogue.get("moon").definition.accuracy.position);
  });

  it("reports the Moon's distance, phase and position and Earth's distance to the Moon", () => {
    const metrics = earthMoonExplorer.createMetrics({ clock: undefined as never, resolver, catalogue });
    const t = earthMoonExplorer.clock.startUtcMs;
    expect(metrics("moon", t).map((metric) => metric.kind)).toEqual(["distance", "phase", "coordinates"]);
    expect(metrics("earth", t).map((metric) => metric.label)).toEqual(["Distance to Moon"]);
    const distance = metrics("moon", t)[0];
    expect(distance.kind === "distance" ? distance.value : 0).toBeCloseTo(Math.hypot(...resolver.stateOf("moon", t, "earth").positionKm), 6);
    const phase = metrics("moon", t)[1];
    expect(phase.kind === "phase" ? phase.fraction : -1).toBeGreaterThanOrEqual(0);
  });

  it("matches the lunar illumination the scene's own readout uses", async () => {
    const { lunarIlluminatedFraction } = await import("../src/core/illumination");
    const t = Date.UTC(2025, 0, 13, 22, 27);
    const metrics = bodyMetrics(resolver, ["earth", "moon"]);
    const phase = metrics("moon", t).find((metric) => metric.kind === "phase");
    const expected = lunarIlluminatedFraction(resolver.stateOf("moon", t, "earth"), resolver.sunFrom("earth", t));
    expect(phase?.kind === "phase" ? phase.fraction : null).toBeCloseTo(expected, 12);
  });
});

describe("Apollo", () => {
  it("declares the Earth–Moon composition and the two original scale choices", () => {
    expect(compositionOf(apollo11Definition)).toBe(earthMoonSystem);
    expect(scaleChoiceIdsOf(apollo11Definition)).toEqual(["true-scale"]);
  });

  it("keeps Earth's and the Moon's rows as they were, and the spacecraft's after them", () => {
    const metrics = apolloMetrics(apollo11Mission.bodies, resolver);
    const eagle = apollo11Mission.bodies[1];
    const t = Math.round((eagle.trajectory.bounds.startUtcMs + eagle.trajectory.bounds.endUtcMs) / 2);
    expect(metrics("earth", t).map((m) => [m.id, m.label])).toEqual([["earth-to-moon", "Distance to Moon"]]);
    expect(metrics("moon", t).map((m) => [m.id, m.label])).toEqual([["moon-range", "Distance from Earth"]]);
    expect(metrics("eagle", t).map((m) => m.id)).toEqual(["eagle-range", "eagle-speed", "eagle-to-moon"]);
    expect(metrics("nothing", t)).toEqual([]);
  });

  it("reads the Moon about Earth the same way the old provider did", async () => {
    const { MoonTrajectory } = await import("../src/core/moonTrajectory");
    const t = Date.UTC(1969, 6, 20, 20, 17);
    const old = new MoonTrajectory(adapter).stateAt(t);
    const now = resolverTrajectory(resolver, "moon", "earth").stateAt(t);
    expect(Array.from(now.positionKm)).toEqual(Array.from(old.positionKm));
    expect(now.frame).toBe(old.frame);
  });
});

describe("Perseids in the Sun-centred composition", () => {
  it("mounts the Sun, Earth, the planets and the comet about the Sun, with no Moon anywhere", () => {
    expect(compositionOf(perseids)).toEqual(showerComposition(settings));
    expect(sceneCenterOf(perseids)).toBe("sun");
    expect(mountedBodiesOf(perseids)).toEqual(["sun", "earth", "mercury", "venus", "mars", "jupiter", "swift-tuttle"]);
    const ids = experienceWithGroups(perseids).objects.map((object) => object.id);
    expect(ids).toEqual(expect.arrayContaining(["sun", "earth", "mars", "swift-tuttle", `${settings.id}-stream`, "earth-path", parentOrbitIdOf(settings)]));
    expect(ids).not.toContain("moon");
    expect(JSON.stringify(experienceWithGroups(perseids))).not.toMatch(/\bMoon\b/);
  });

  it("leaves every orbit line out of the Object list but offers each from its body", () => {
    const objects = experienceWithGroups(perseids).objects;
    const orbits = objects.filter((object) => object.id.endsWith("-orbit") || object.id === "earth-path");
    expect(orbits.length).toBeGreaterThanOrEqual(5);
    for (const orbit of orbits) {
      expect(orbit.listed).toBe(false);
      expect(objects.find((object) => object.id === orbit.partOf)?.listed).not.toBe(false);
    }
    expect(objects.filter((object) => object.listed !== false).map((object) => object.id)).toEqual(expect.arrayContaining(["sun", "earth", "swift-tuttle", `${settings.id}-stream`]));
  });

  it("declares Earth's path and the parent's orbit as orbit paths about the Sun", () => {
    const { paths, sun } = sunCentredOf(perseids);
    expect(sun).toBeUndefined();
    // Earth's path, then one orbit per catalogued planet (T-049), then the parent's whole orbit (T-038).
    expect(paths.map((path) => [path.object.id, path.kind])).toEqual([
      ["earth-path", "orbit"],
      ...["mercury", "venus", "mars", "jupiter"].map((id) => [`${id}-orbit`, "orbit"]),
      [parentOrbitIdOf(settings), "orbit"],
    ]);
    expect(paths.every((path) => path.object.provenance !== undefined)).toBe(true);
  });

  it("puts Earth on its path at the start and at the peak", () => {
    const layer = createEarthPathLayer(settings);
    const span = layer.span as { startUtcMs: number; endUtcMs: number };
    const samples = layer.samples ?? 0;
    const vertices = Array.from({ length: samples }, (_, i) => layer.source.stateAt(Math.round(span.startUtcMs + (i / (samples - 1)) * (span.endUtcMs - span.startUtcMs)), "sun").positionKm);
    const distanceToSegment = (p: ArrayLike<number>, a: ArrayLike<number>, b: ArrayLike<number>): number => {
      const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
      const u = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / (ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2)));
      return Math.hypot(ap[0] - u * ab[0], ap[1] - u * ab[1], ap[2] - u * ab[2]);
    };
    for (const t of [start, peak]) {
      const earth = resolver.stateOf("earth", t, "sun").positionKm;
      const gap = Math.min(...vertices.slice(1).map((v, i) => distanceToSegment(earth, vertices[i], v)));
      // Daily vertices: the chord sags about 11,000 km below the arc, under two Earth radii.
      expect(gap).toBeLessThan(2 * 6371);
    }
  });

  it("offers true and solar-system scale and states Earth's factor in its own info", () => {
    expect(scaleChoiceIdsOf(perseids)).toEqual(["true-scale", "solar-system"]);
    expect(visualOverridesOf(perseids).get("earth")?.exaggeration).toBe(EARTH_EXAGGERATION);
    const earth = perseids.experience.objects.find((object) => object.id === "earth");
    expect(earth?.knownLimitations?.join(" ")).toContain(`${EARTH_EXAGGERATION} times larger`);
  });

  it("draws Earth at its declared factor under the solar-system policy and everything else at true size", () => {
    const policy = createSolarSystemScale({ exaggeration: { earth: EARTH_EXAGGERATION }, defaultExaggeration: 1 });
    const earth = catalogue.get("earth").definition;
    const moon = catalogue.get("moon").definition;
    expect(drawnRadii(earth, policy).equatorial).toBeCloseTo(EARTH_EXAGGERATION, 9);
    expect(drawnRadii(moon, policy).equatorial).toBeCloseTo(moon.radiusKm / earth.radiusKm, 12);
    expect(drawnRadii(earth, trueScale).equatorial).toBe(1);
  });

  it("leaves Geminids-style settings to the same builder", () => {
    expect(buildShowerDefinition(settings, { kind: "loaded", orbits: madeUpOrbits(7, 50) }).composition).toEqual(showerComposition(settings));
  });
});

describe("a Moon-free experience never reads the Moon", () => {
  it("answers every Perseids metric without asking the resolver about the Moon", () => {
    const asked: string[] = [];
    const spy: StateResolver = {
      stateOf: (body, t, centre) => { asked.push(body, centre); return resolver.stateOf(body, t, centre); },
      offsetKm: (from, centre, t) => { asked.push(from, centre); return resolver.offsetKm(from, centre, t); },
      sunFrom: (centre, t) => { asked.push(centre); return resolver.sunFrom(centre, t); },
    };
    const metrics = perseids.createMetrics({ clock: undefined as never, resolver: spy, catalogue });
    for (const id of ["sun", "earth", `${settings.id}-stream`, "moon", "nothing"]) metrics(id, peak);
    expect(asked).not.toContain("moon");
    expect(asked.length).toBeGreaterThan(0);
  });
});

describe("visual overrides and scale choices", () => {
  const withOverrides = (visualOverrides: ExperienceDefinition["visualOverrides"]): ExperienceDefinition => ({ ...earthMoonExplorer, ...(visualOverrides === undefined ? {} : { visualOverrides }) });

  it("lays an override over the record without touching the catalogue", () => {
    const sun = catalogue.get("sun");
    const drawn = assetWithOverride(sun, { marker: { sizePx: 12 }, material: { color: "#ffffff", roughness: 1, metalness: 0 } });
    expect(drawn.visual.marker?.sizePx).toBe(12);
    expect(drawn.visual.material.color).toBe("#ffffff");
    expect(sun.visual.marker?.sizePx).toBe(9);
    expect(assetWithOverride(sun, undefined)).toBe(sun);
  });

  it("keeps the belt's Sun marker at its former size through an override", () => {
    expect(visualOverridesOf(syntheticBeltDefinition).get("sun")?.marker?.sizePx).toBe(10);
  });

  it("hides a body without removing it as a centre", () => {
    const hidden = withOverrides({ moon: { visible: false } });
    expect(mountedBodiesOf(hidden)).toEqual(["earth"]);
    expect(sceneCenterOf(hidden)).toBe("earth");
  });

  it.each([
    ["an uncatalogued body", { saturn: { exaggeration: 2 } }, /catalogue lacks/],
    ["a factor below 1", { earth: { exaggeration: 0.5 } }, /at least 1/],
    ["a non-finite factor", { earth: { exaggeration: Number.POSITIVE_INFINITY } }, /at least 1/],
  ] as const)("rejects %s", (_what, overrides, message) => {
    expect(() => visualOverridesOf(withOverrides(overrides))).toThrow(message);
  });

  it("validates the scale choices an experience offers", () => {
    expect(scaleChoiceIdsOf(earthMoonExplorer)).toEqual(["true-scale", "readable-scale"]);
    expect(scaleChoiceIdsOf(syntheticBeltDefinition)).toBeUndefined();
    expect(() => scaleChoiceIdsOf({ ...earthMoonExplorer, scaleChoices: [] })).toThrow(/at least one/);
    expect(() => scaleChoiceIdsOf({ ...earthMoonExplorer, scaleChoices: ["true-scale", "true-scale"] })).toThrow(/twice/);
    expect(() => scaleChoiceIdsOf({ ...earthMoonExplorer, scaleChoices: ["huge"] })).toThrow(/unknown scale choice/);
    expect(scaleChoicesFor(["true-scale", "solar-system"]).map((choice) => choice.label)).toEqual(["True", "Solar system"]);
  });
});

describe("catalogueItem", () => {
  it("writes a body's shell item from the catalogue and lets the experience add only its own words", () => {
    const item = catalogueItem("earth", { description: "Mine.", labelPriority: 7 });
    expect(item).toMatchObject({ id: "earth", label: "Earth", description: "Mine.", labelPriority: 7 });
    expect(item.provenance).toBe(catalogue.get("earth").definition.accuracy.position);
    expect(() => catalogueItem("saturn")).toThrow();
  });
});

describe("default selection and camera focus come from the experience, not from Earth", () => {
  // Earth-free compositions of built-in bodies: the Moon alone, and the Sun alone.
  const moonAlone = createComposition(catalogue, { id: "moon-alone", bodies: ["moon"], defaultCenter: "moon" });
  const sunAlone = createComposition(catalogue, { id: "sun-alone", bodies: ["sun"], defaultCenter: "sun" });
  const around = (composition: typeof moonAlone, objects: ExperienceDefinition["experience"]["objects"]): ExperienceDefinition => ({
    ...earthMoonExplorer,
    composition,
    experience: { ...earthMoonExplorer.experience, objects },
  });

  it.each([
    ["the Moon alone", moonAlone, "moon"],
    ["the Sun alone", sunAlone, "sun"],
  ] as const)("starts %s selected on, and focused on, a body it mounts", (_name, composition, body) => {
    const definition = around(composition, [catalogueItem(body)]);
    expect(mountedBodiesOf(definition)).toEqual([body]);
    expect(sceneCenterOf(definition)).toBe(body);
    expect(initialObjectIdOf(definition)).toBe(body);
    expect(createOrbitCameraState(16, sceneCenterOf(definition)).focus).toBe(body);
    expect(mountedBodiesOf(definition)).not.toContain("earth");
  });

  it("falls back to the first shell item when the centre is not listed, never to a body that is not mounted", () => {
    const definition = around(moonAlone, [{ id: "first-thing", label: "First thing" }]);
    expect(initialObjectIdOf(definition)).toBe("first-thing");
    expect(initialObjectIdOf(syntheticBareDefinition)).toBe("survey-marker");
  });

  it("keeps the three experiences starting where they did: on their own centre", () => {
    expect(initialObjectIdOf(earthMoonExplorer)).toBe("earth");
    expect(initialObjectIdOf(apollo11Definition)).toBe("earth");
    expect(initialObjectIdOf(perseids)).toBe("sun");
  });

  it("measures a developer-readout pair only where a satellite and its planet are both mounted", () => {
    expect(readoutPairOf(mountedBodiesOf(earthMoonExplorer))).toEqual({ parent: "earth", child: "moon" });
    expect(readoutPairOf(mountedBodiesOf(perseids))).toBeNull();
    expect(readoutPairOf(mountedBodiesOf(around(moonAlone, [catalogueItem("moon")])))).toBeNull();
  });
});
