import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { catalogue } from "../src/assets/catalogue";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { solarSystemPolicyForTest } from "./scalePolicies";
import { trueScale } from "../src/core/scalePolicy";
import { createStateResolver } from "../src/core/stateResolver";
import { BUILT_IN_BINDINGS, BUILT_IN_BODIES } from "../src/core/bodies";
import { createMarker, DEFAULT_BODY_MARKER, drawnRadii, drawsAsMarker, markerOf, markerSettingsFromSearch, projectedRadiusPx } from "../src/app/bodyDraw";
import { TRACK_LAYER } from "../src/app/TrackedBodyView";
import { assignBodyLayers } from "../src/app/sceneFraming";
import { syntheticSun } from "../src/synthetic/syntheticRingDefinition";
import { syntheticEccentricDefinition } from "../src/synthetic/syntheticEccentricDefinition";
import { assetWithOverride, mountedBodiesOf, visualOverridesOf } from "../src/app/experienceDefinition";

const FOV = 45;
const HEIGHT = 800;
const AU_UNITS = 149_597_870.7 / 6371.0084;

describe("the marker rule: a sphere under the threshold is a marker, at it a sphere", () => {
  const threshold = DEFAULT_BODY_MARKER.minSpherePx;

  it("decides at the boundary: just below is a marker, exactly at and above are spheres", () => {
    expect(drawsAsMarker(threshold - 1e-9)).toBe(true);
    expect(drawsAsMarker(threshold)).toBe(false);
    expect(drawsAsMarker(threshold + 1e-9)).toBe(false);
    expect(drawsAsMarker(0)).toBe(true);
    expect(drawsAsMarker(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("takes the threshold from the settings, and a threshold of 0 never swaps", () => {
    expect(drawsAsMarker(5, { ...DEFAULT_BODY_MARKER, minSpherePx: 6 })).toBe(true);
    expect(drawsAsMarker(5, { ...DEFAULT_BODY_MARKER, minSpherePx: 5 })).toBe(false);
    expect(drawsAsMarker(0.001, { ...DEFAULT_BODY_MARKER, minSpherePx: 0 })).toBe(false);
  });

  it("projects a sphere's radius to pixels the way the camera does", () => {
    const camera = new PerspectiveCamera(FOV, 1.6, 0.05, 1e7);
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, -1);
    camera.updateMatrixWorld();
    const radius = 2;
    const distance = 100;
    // The sphere's limb point above its centre, projected with Three's own matrices.
    const limb = new Vector3(0, radius, -distance).project(camera);
    const centre = new Vector3(0, 0, -distance).project(camera);
    expect(((limb.y - centre.y) / 2) * HEIGHT).toBeCloseTo(projectedRadiusPx(radius, distance, FOV, HEIGHT), 1);
    expect(projectedRadiusPx(1, 0, FOV, HEIGHT)).toBe(Number.POSITIVE_INFINITY);
  });

  it("makes Earth a marker at a Sun-centred distance and a sphere close up (the synthetic belt: Earth is 1 AU from the Sun)", () => {
    const earth = drawnRadii(catalogue.get("earth").definition, trueScale).equatorial;
    expect(earth).toBeCloseTo(1, 2);
    const far = projectedRadiusPx(earth, AU_UNITS, FOV, HEIGHT);
    const near = projectedRadiusPx(earth, 3, FOV, HEIGHT);
    expect(far).toBeLessThan(0.1);
    expect(drawsAsMarker(far)).toBe(true);
    expect(near).toBeGreaterThan(200);
    expect(drawsAsMarker(near)).toBe(false);
  });

  it("swaps at one distance: the radius over distance at which it reaches the threshold", () => {
    const radius = 1;
    const swapDistance = (radius * (HEIGHT / 2)) / (threshold * Math.tan((FOV * Math.PI) / 360));
    expect(drawsAsMarker(projectedRadiusPx(radius, swapDistance * 1.001, FOV, HEIGHT))).toBe(true);
    expect(drawsAsMarker(projectedRadiusPx(radius, swapDistance * 0.999, FOV, HEIGHT))).toBe(false);
  });

  it("under the solar-system scale an enlarged planet stays a sphere at distances where the true-scale one is a marker", () => {
    const policy = solarSystemPolicyForTest({ earth: 200 });
    const definition = catalogue.get("earth").definition;
    const trueRadius = drawnRadii(definition, trueScale).equatorial;
    const enlarged = drawnRadii(definition, policy).equatorial;
    expect(enlarged / trueRadius).toBeCloseTo(200, 6);
    const distance = 1500;
    expect(drawsAsMarker(projectedRadiusPx(trueRadius, distance, FOV, HEIGHT))).toBe(true);
    expect(drawsAsMarker(projectedRadiusPx(enlarged, distance, FOV, HEIGHT))).toBe(false);
  });
});

describe("the marker never changes State or metrics", () => {
  const resolver = createStateResolver(BUILT_IN_BODIES, BUILT_IN_BINDINGS, createOrbAstronomyAdapter());
  const t = Date.UTC(2026, 7, 13, 12);

  it("takes no State as input, and every state is equal before and after the rule runs under any setting", () => {
    const before = BUILT_IN_BODIES.map((body) => resolver.stateOf(body.id, t, "sun"));
    for (const minSpherePx of [0, 3, 20]) drawsAsMarker(projectedRadiusPx(1, 1e6, FOV, HEIGHT), { ...DEFAULT_BODY_MARKER, minSpherePx });
    const after = BUILT_IN_BODIES.map((body) => resolver.stateOf(body.id, t, "sun"));
    expect(after).toEqual(before);
    // The rule's whole input is a screen radius and a settings record; there is nowhere for a State to enter.
    expect(drawsAsMarker.length).toBeLessThanOrEqual(2);
  });
});

describe("marker settings are settings", () => {
  it("default to a 3 px threshold and a 6 px dot, and read ?markerpx= from the address", () => {
    expect(DEFAULT_BODY_MARKER).toEqual({ minSpherePx: 3, markerPx: 6 });
    expect(markerSettingsFromSearch("")).toEqual(DEFAULT_BODY_MARKER);
    expect(markerSettingsFromSearch("?markerpx=8")).toEqual({ minSpherePx: 8, markerPx: 6 });
    expect(markerSettingsFromSearch("?markerpx=0")).toEqual({ minSpherePx: 0, markerPx: 6 });
  });

  it("ignore an unusable ?markerpx= with a warning", () => {
    const warnings: string[] = [];
    const original = console.warn;
    console.warn = (message: string) => warnings.push(message);
    try {
      for (const bad of ["?markerpx=", "?markerpx=abc", "?markerpx=-1", "?markerpx=101"]) expect(markerSettingsFromSearch(bad)).toEqual(DEFAULT_BODY_MARKER);
    } finally {
      console.warn = original;
    }
    expect(warnings).toHaveLength(4);
  });

  it("size the stand-in dot from the record when it states one, else the setting", () => {
    expect(markerOf(catalogue.get("earth"), {}, DEFAULT_BODY_MARKER.markerPx).sizePx).toBe(6);
    expect(markerOf(catalogue.get("swift-tuttle")).sizePx).toBe(7);
    expect(markerOf(catalogue.get("earth"), { sizePx: 12 }, 6).sizePx).toBe(12);
    const { group } = createMarker(catalogue.get("earth"), TRACK_LAYER, undefined, 6);
    expect(group.children).toHaveLength(1);
    expect(group.children[0].layers.test({ mask: 1 << TRACK_LAYER } as never)).toBe(true);
  });
});

describe("the comet is always a marker; a planet is a sphere that may become one", () => {
  it("draws the comet on the overlay layer and gives lit layers only to spheres", () => {
    const layers = assignBodyLayers(["sun", "earth", "swift-tuttle"], TRACK_LAYER);
    expect(layers.get("swift-tuttle")).toBe(TRACK_LAYER);
    expect(layers.get("earth")).not.toBe(TRACK_LAYER);
    expect(catalogue.get("earth").visual.kind).toBe("sphere");
    expect(catalogue.get("swift-tuttle").visual.kind).toBe("marker");
  });
});

describe("the synthetic long-orbit experience", () => {
  it("mounts the Sun and Earth, enlarges Earth only through the solar-system scale override, and offers both scales", () => {
    expect(mountedBodiesOf(syntheticEccentricDefinition)).toEqual(["sun", "earth"]);
    expect(syntheticEccentricDefinition.scaleChoices).toEqual(["true-scale", "solar-system"]);
    const earth = assetWithOverride(catalogue.get("earth"), visualOverridesOf(syntheticEccentricDefinition).get("earth"));
    expect(earth.definition).toBe(catalogue.get("earth").definition);
    expect(syntheticSun.object.id).toBe("sun");
  });
});
