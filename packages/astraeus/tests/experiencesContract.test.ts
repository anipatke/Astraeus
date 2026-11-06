import { describe, expect, it } from "vitest";
import { bodyMetrics, resolverTrajectory } from "../src/app/bodyMetrics";
import { catalogueItem } from "../src/app/catalogueItem";
import {
  assetWithOverride,
  compositionOf,
  initialObjectIdOf,
  mountedBodiesOf,
  scaleChoiceIdsOf,
  sceneCenterOf,
  visualOverridesOf,
  type ExperienceDefinition,
} from "../src/app/experienceDefinition";
import { createSceneResolver, readoutPairOf } from "../src/app/sceneLayout";
import { createOrbitCameraState } from "../src/app/CameraController";
import { catalogue } from "../src/assets/catalogue";
import { createComposition, earthMoonSystem, sunEarthSystem } from "../src/assets/compositions";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { scaleChoicesFor } from "../src/shell/scaleModel";
import { syntheticBareDefinition, syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import { syntheticBeltDefinition, syntheticRingDefinition } from "../src/synthetic/syntheticRingDefinition";

// Moved from the site's tests (O-059 T-272): the compositions, readouts, overrides and selection rules are the engine's, held on the made-up definitions. The rows that used Apollo 11's and the Perseids' definitions
// are held on those demos' scenes, as far as a host can read them, in the site (tests/demoScenes.test.ts).

const adapter = createOrbAstronomyAdapter();
const resolver = createSceneResolver(adapter);

describe("every experience names a composition", () => {
  it.each([
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
    for (const definition of [syntheticDefinition, syntheticRingDefinition, syntheticBeltDefinition]) {
      expect(definition.sceneLayers as readonly string[]).not.toContain("earth-moon");
    }
  });
});

describe("the Earth and Moon readouts", () => {
  it("reports the Moon's distance, phase and position and Earth's distance to the Moon", () => {
    const metrics = bodyMetrics(resolver, earthMoonSystem.bodies);
    const t = Date.UTC(2025, 0, 1);
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

describe("the Moon about Earth", () => {
  it("reads the Moon about Earth the same way the old provider did", async () => {
    const { MoonTrajectory } = await import("../src/core/moonTrajectory");
    const t = Date.UTC(1969, 6, 20, 20, 17);
    const old = new MoonTrajectory(adapter).stateAt(t);
    const now = resolverTrajectory(resolver, "moon", "earth").stateAt(t);
    expect(Array.from(now.positionKm)).toEqual(Array.from(old.positionKm));
    expect(now.frame).toBe(old.frame);
  });
});

describe("visual overrides and scale choices", () => {
  const withOverrides = (visualOverrides: ExperienceDefinition["visualOverrides"]): ExperienceDefinition => ({ ...syntheticDefinition, ...(visualOverrides === undefined ? {} : { visualOverrides }) });

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
    ["an uncatalogued body", { ceres: { exaggeration: 2 } }, /catalogue lacks/],
    ["a factor below 1", { earth: { exaggeration: 0.5 } }, /at least 1/],
    ["a non-finite factor", { earth: { exaggeration: Number.POSITIVE_INFINITY } }, /at least 1/],
  ] as const)("rejects %s", (_what, overrides, message) => {
    expect(() => visualOverridesOf(withOverrides(overrides))).toThrow(message);
  });

  it("validates the scale choices an experience offers", () => {
    expect(scaleChoiceIdsOf(syntheticDefinition)).toBeUndefined();
    expect(scaleChoiceIdsOf(syntheticBeltDefinition)).toBeUndefined();
    expect(() => scaleChoiceIdsOf({ ...syntheticDefinition, scaleChoices: [] })).toThrow(/at least one/);
    expect(() => scaleChoiceIdsOf({ ...syntheticDefinition, scaleChoices: ["true-scale", "true-scale"] })).toThrow(/twice/);
    expect(() => scaleChoiceIdsOf({ ...syntheticDefinition, scaleChoices: ["huge"] })).toThrow(/unknown scale choice/);
    expect(scaleChoicesFor(["true-scale", "solar-system"]).map((choice) => choice.label)).toEqual(["True", "Solar system"]);
  });
});

describe("catalogueItem", () => {
  it("writes a body's shell item from the catalogue and lets the experience add only its own words", () => {
    const item = catalogueItem("earth", { description: "Mine.", labelPriority: 7 });
    expect(item).toMatchObject({ id: "earth", label: "Earth", description: "Mine.", labelPriority: 7 });
    expect(item.provenance).toBe(catalogue.get("earth").definition.accuracy.position);
    expect(() => catalogueItem("ceres")).toThrow();
  });
});

describe("default selection and camera focus come from the experience, not from Earth", () => {
  // Earth-free compositions of built-in bodies: the Moon alone, and the Sun alone.
  const moonAlone = createComposition(catalogue, { id: "moon-alone", bodies: ["moon"], defaultCenter: "moon" });
  const sunAlone = createComposition(catalogue, { id: "sun-alone", bodies: ["sun"], defaultCenter: "sun" });
  const around = (composition: typeof moonAlone, objects: ExperienceDefinition["experience"]["objects"]): ExperienceDefinition => ({
    ...syntheticDefinition,
    composition,
    experience: { ...syntheticDefinition.experience, objects },
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

  it("keeps the made-up experiences starting where they did: on their own centre", () => {
    expect(initialObjectIdOf(syntheticDefinition)).toBe("earth");
    expect(initialObjectIdOf(syntheticBeltDefinition)).toBe("sun");
  });

  it("measures a developer-readout pair only where a satellite and its planet are both mounted", () => {
    expect(readoutPairOf(mountedBodiesOf(syntheticDefinition))).toEqual({ parent: "earth", child: "moon" });
    expect(readoutPairOf(mountedBodiesOf(syntheticBeltDefinition))).toBeNull();
    expect(readoutPairOf(mountedBodiesOf(around(moonAlone, [catalogueItem("moon")])))).toBeNull();
  });
});
