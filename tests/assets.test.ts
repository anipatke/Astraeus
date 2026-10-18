import { describe, expect, it } from "vitest";
import { Group, Points } from "three";
import { catalogue, createCatalogue, type BodyAsset, type VisualEntry } from "../src/assets/catalogue";
import { BUILT_IN_BINDINGS, BUILT_IN_BODIES, EARTH, MOON, SUN } from "../src/core/bodies";
import type { CelestialBodyDefinition, StateSourceBinding } from "../src/core/body";
import { createProvenance } from "../src/core/provenance";
import { readableScale, trueScale } from "../src/core/scalePolicy";
import { createStateResolver } from "../src/core/stateResolver";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createMarker, describeBody, drawnRadii, markerOf } from "../src/app/bodyDraw";
import { EARTH_ATMOSPHERE, EARTH_MATERIAL } from "../src/assets/bodies/earth";
import { MOON_MATERIAL } from "../src/assets/bodies/moon";
import type { BodyVisual } from "../src/assets/visual";

const provenance = createProvenance({ sourceType: "illustrative", sources: ["made up"], accuracy: "none", notes: "" });
const accuracy = { dimensions: provenance, position: provenance, validUtc: { startUtcMs: 0, endUtcMs: 1e12 }, orientationLimitations: [] };
const fake = (id: string, extra: Partial<CelestialBodyDefinition> = {}): CelestialBodyDefinition => ({
  id, label: id, radiusKm: 1000, orientation: "none", accuracy, ...extra,
});
const flat: BodyVisual = { kind: "sphere", material: { color: "#808080", roughness: 1, metalness: 0 } };
const binding = (body: string): StateSourceBinding => ({ body, create: () => { throw new Error("not built"); } });

describe("body catalogue", () => {
  it("builds from the built-in records and hands the resolver exactly its inputs", () => {
    expect(catalogue.ids()).toEqual(["sun", "earth", "moon", "mercury", "venus", "mars", "jupiter", "io", "europa", "ganymede", "callisto", "swift-tuttle"]);
    expect(catalogue.definitions()).toEqual(BUILT_IN_BODIES);
    expect(catalogue.sources()).toEqual(BUILT_IN_BINDINGS);
    expect(catalogue.get("sun").source).toBeUndefined();
    expect(catalogue.get("moon").source?.body).toBe("moon");
    expect(catalogue.has("saturn")).toBe(false);
    expect(() => catalogue.get("saturn")).toThrow(/unknown body/);
    const resolver = createStateResolver(catalogue.definitions(), catalogue.sources(), createOrbAstronomyAdapter());
    expect(resolver.stateOf("moon", Date.UTC(2026, 3, 1), "earth").positionKm.length).toBe(3);
  });

  it("throws on a duplicate id, a parented body without a source, a root with one, or a visual without a definition", () => {
    const root = fake("r");
    const child = fake("c", { parentId: "r" });
    const entries: VisualEntry[] = [{ body: "r", visual: flat }, { body: "c", visual: flat }];
    expect(() => createCatalogue([root, child], [binding("c")], entries)).not.toThrow();
    expect(() => createCatalogue([root, root], [], [{ body: "r", visual: flat }])).toThrow(/duplicate body id/);
    expect(() => createCatalogue([root, child], [], entries)).toThrow(/parent but no state source/);
    expect(() => createCatalogue([root, child], [binding("r"), binding("c")], entries)).toThrow(/must not have a state source/);
    expect(() => createCatalogue([root], [], [...entries])).toThrow(/has no definition/);
    expect(() => createCatalogue([root, child], [binding("c")], [entries[0]])).toThrow(/has no visual/);
    expect(() => createCatalogue([root, child], [binding("c"), binding("x")], entries)).toThrow(/has no definition/);
  });
});

describe("visual records", () => {
  it("keep today's Sun, Earth and Moon appearance in one place", () => {
    const earth = catalogue.get("earth").visual;
    const moon = catalogue.get("moon").visual;
    const sun = catalogue.get("sun").visual;
    expect(sun.kind).toBe("marker");
    expect(sun.marker?.sizePx).toBe(9);
    expect(earth).toMatchObject({ kind: "sphere", material: EARTH_MATERIAL, atmosphere: EARTH_ATMOSPHERE, textureYawRad: 0, light: { ambient: 0.18, directional: 1.8 } });
    expect(moon).toMatchObject({ kind: "sphere", material: MOON_MATERIAL, textureYawRad: 0, light: { ambient: 0.08, directional: 1.4 } });
    expect(moon.atmosphere).toBeUndefined();
    expect(earth.material).toEqual({ color: "#e8e8e8", roughness: 0.82, metalness: 0.05 });
    expect(moon.material).toEqual({ color: "#f3ede4", roughness: 0.98, metalness: 0.02 });
  });
});

describe("BodyView plan", () => {
  const asset = (definition: CelestialBodyDefinition, visual: BodyVisual): BodyAsset => ({ definition, visual });

  it("draws a sphere of the mapped mean radius, with a texture, an atmosphere, both, or neither", () => {
    const earth = describeBody(catalogue.get("earth"), trueScale);
    expect(earth).toMatchObject({ kind: "sphere", poleScale: 1, atmosphere: EARTH_ATMOSPHERE });
    expect(earth.textureUrl).toBe(catalogue.get("earth").visual.texture!.url);
    expect(earth.radii).toEqual({ equatorial: 1, polar: 1 });
    const moon = describeBody(catalogue.get("moon"), readableScale);
    expect(moon.radii.equatorial).toBe(readableScale.mapRadius(MOON.radiusKm));
    expect(moon.atmosphere).toBeUndefined();
    const bare = describeBody(asset(fake("made-up", { radiusKm: 3185.5 }), flat), trueScale);
    expect(bare.textureUrl).toBeUndefined();
    expect(bare.atmosphere).toBeUndefined();
    expect(bare.material).toEqual(flat.material);
    expect(bare.radii.equatorial).toBe(trueScale.mapRadius(3185.5));
    const hazy = describeBody(asset(fake("hazy"), { ...flat, atmosphere: { color: "#fff" } }), trueScale);
    expect(hazy.atmosphere).toEqual({ color: "#fff" });
  });

  it("maps a spheroid's equatorial and polar radii independently under each policy", () => {
    const jupiterLike = fake("spheroid", { radiusKm: 69_911, equatorialRadiusKm: 71_492, polarRadiusKm: 66_854 });
    for (const policy of [trueScale, readableScale]) {
      const radii = drawnRadii(jupiterLike, policy);
      expect(radii.equatorial).toBe(policy.mapRadius(71_492));
      expect(radii.polar).toBe(policy.mapRadius(66_854));
      expect(radii.equatorial).not.toBe(policy.mapRadius(jupiterLike.radiusKm));
      const plan = describeBody(asset(jupiterLike, flat), policy);
      expect(plan.radii.equatorial * plan.poleScale).toBeCloseTo(radii.polar, 12);
    }
    expect(drawnRadii(fake("one-radius", { equatorialRadiusKm: 5 }), trueScale)).toEqual({ equatorial: trueScale.mapRadius(1000), polar: trueScale.mapRadius(1000) });
  });

  it("draws a marker from the record, unless the experience names its own colour and size", () => {
    const sun = catalogue.get("sun");
    expect(markerOf(sun)).toEqual({ color: "#fff1b0", sizePx: 9 });
    expect(markerOf(sun, { color: "#ff0000", sizePx: 14 })).toEqual({ color: "#ff0000", sizePx: 14 });
    expect(markerOf(sun, { color: undefined, sizePx: undefined })).toEqual({ color: "#fff1b0", sizePx: 9 });
    const { group, position } = createMarker(sun, 3);
    expect(group).toBeInstanceOf(Group);
    const points = group.children[0] as Points;
    expect(points.layers.mask).toBe(1 << 3);
    expect(position.count).toBe(1);
    const madeUp = createMarker(asset(fake("beacon"), { kind: "marker", material: { color: "#00ff00", roughness: 1, metalness: 0 }, marker: { sizePx: 5 } }), 3);
    expect((madeUp.group.children[0] as Points).material).toMatchObject({ size: 5 });
    expect(describeBody(sun, trueScale).kind).toBe("marker");
  });

  it("keeps the core definitions free of appearance", () => {
    for (const definition of [SUN, EARTH, MOON]) expect(Object.keys(definition)).not.toContain("visual");
  });
});
