import { describe, expect, it } from "vitest";
import { buildPlanetScene, placesOf, type MapCoordinates, type PackageFeature, type PlanetSystem } from "../src/experiences/planets/planetScene";
import { parseMoonCatalogue } from "../src/experiences/planets/moonList";
import { parsePlanetSettings, PlanetSettingsError } from "../src/experiences/planets/planetSettings";
import { jupiterIoScene } from "../src/experiences/jupiter-io/jupiterIo";
import jupiterFile from "../data/planets/jupiter.json";
import callistoFeatures from "astraeus-data/bodies/callisto/features.json";
import callistoMap from "astraeus-data/bodies/callisto/map.json";
import europaFeatures from "astraeus-data/bodies/europa/features.json";
import europaMap from "astraeus-data/bodies/europa/map.json";
import ganymedeFeatures from "astraeus-data/bodies/ganymede/features.json";
import ganymedeMap from "astraeus-data/bodies/ganymede/map.json";
import ioFeatures from "astraeus-data/bodies/io/features.json";
import ioMap from "astraeus-data/bodies/io/map.json";

// A made-up planet first (ARCH-03): its own words, a made-up moon list over two of Mars's listed moons (a dot has to be a moon the engine lists), no fitted data read.
const madeUpFile = {
  id: "made-up",
  label: "Made-up planet",
  order: 1,
  default: false,
  system: "made-up",
  experienceLabel: "A made-up planet",
  window: { startUtc: "2030-01-01T00:00:00Z", endUtc: "2030-01-15T00:00:00Z" },
  clockRate: 600,
  rates: [60, 600],
  centre: { id: "mars", labelPriority: 50, labelMaxDistance: 1000, description: "A made-up centre.", knownLimitations: ["Made up."] },
  moons: { listSource: "A made-up list", featuredFamilyId: "family-a", fitSource: "Made-up fit", follow: "moon", mapped: [{ id: "moon", labelPriority: 40, labelMaxDistance: 500, description: "A made-up mapped moon." }] },
  bodyFeatures: [],
  story: { panels: "data/stories/made-up/panels.json" },
  camera: { maxFocusDistance: 500, far: 5000 },
  startView: { focus: "mars", azimuthDeg: 10, elevationDeg: 20, distance: 50 },
};
const madeUpMoons = parseMoonCatalogue({
  format: "astraeus.moon-catalogue/1",
  parent: "mars",
  asOf: "2030-01-01",
  families: [{ id: "family-a", label: "Family A", description: "Made up." }, { id: "family-b", label: "Family B", description: "Made up." }],
  sources: { list: { title: "A made-up list", url: "https://example.invalid/list" } },
  moons: [
    { id: "moon", name: "Mapped one", family: "family-a", meanRadiusKm: 1737.4, radiusBasis: "measured", sources: { list: "list" } },
    { id: "phobos", name: "Dot A", family: "family-a", meanRadiusKm: 5, radiusBasis: "estimate", sources: { list: "list" } },
    { id: "deimos", name: "Dot B", family: "family-b", meanRadiusKm: 3, radiusBasis: "estimate", sources: { list: "list" } },
  ],
});
const madeUpSystem: PlanetSystem = { bodies: [{ id: "mars" }, { id: "moon" }], moonList: madeUpMoons, packages: {}, data: [] };
const madeUpPanels = { pauseSeconds: 6, autoOpen: false, panels: [] };

describe("planet settings (T-117)", () => {
  it("accepts a made-up planet's file and Jupiter's", () => {
    expect(parsePlanetSettings(madeUpFile).window).toEqual({ startUtcMs: Date.UTC(2030, 0, 1), endUtcMs: Date.UTC(2030, 0, 15) });
    expect(parsePlanetSettings(jupiterFile).id).toBe("jupiter");
  });

  it("names the field when a setting is wrong or unknown", () => {
    const bad = (change: Record<string, unknown>, field: RegExp) => expect(() => parsePlanetSettings({ ...madeUpFile, ...change })).toThrow(field);
    bad({ id: "Made Up" }, /settings\.id/);
    bad({ window: { startUtc: "2030-01-15T00:00:00Z", endUtc: "2030-01-01T00:00:00Z" } }, /window\.endUtc/);
    bad({ rates: [] }, /settings\.rates/);
    bad({ bodyFeatures: ["nowhere"] }, /bodyFeatures.*nowhere/);
    bad({ story: { panels: "elsewhere/panels.json" } }, /story\.panels/);
    bad({ moons: { ...madeUpFile.moons, follow: "phobos" } }, /moons\.follow/);
    bad({ colour: "red" }, /settings\.colour/);
    bad({ startView: { ...madeUpFile.startView, elevationDeg: 90 } }, /startView\.elevationDeg/);
    bad({ startView: { ...madeUpFile.startView, extra: 1 } }, /startView\.extra/);
    expect(() => parsePlanetSettings({ ...madeUpFile, startView: { ...madeUpFile.startView, distance: -1 } })).toThrow(PlanetSettingsError);
    expect(parsePlanetSettings({ ...madeUpFile, startView: { ...madeUpFile.startView, azimuthDeg: -10 } }).startView.azimuthDeg).toBe(350);
  });

  it("keeps the moon list source, featured family and fit source together, and takes a mapped moon's own known limits", () => {
    const { fitSource: _dropped, ...withoutFit } = madeUpFile.moons;
    expect(() => parsePlanetSettings({ ...madeUpFile, moons: withoutFit })).toThrow(/moons\.listSource.*moons\.fitSource/);
    const withLimits = { ...madeUpFile, moons: { ...madeUpFile.moons, mapped: [{ ...madeUpFile.moons.mapped[0], knownLimitations: ["Said of the moon."] }] } };
    expect(parsePlanetSettings(withLimits).moons!.mapped[0]!.knownLimitations).toEqual(["Said of the moon."]);
  });
});

describe("planet scene builder (T-117, T-270)", () => {
  it("builds a made-up planet from its settings alone, with no Jupiter in it", () => {
    const scene = buildPlanetScene(parsePlanetSettings(madeUpFile), madeUpSystem, madeUpPanels);
    expect(scene.bodies.map((body) => [body.id, body.label])).toEqual([["mars", "Mars"], ["moon", "Moon"]]);
    expect(scene.bodies[1]!.description).toBe("A made-up mapped moon.");
    expect(scene.bodies[0]!.facts).toEqual([{ label: "Known moons", value: scene.moonPanel!.summary }]);
    expect(scene.bodySets).toEqual([expect.objectContaining({ id: "made-up-small-moons", count: 2, families: ["family-a", "family-b"] })]);
    expect(scene.moonPanel!.count).toBe(3);
    expect(scene.moonPanel!.summary).toMatch(/^3 moons in the A made-up list list of 1 January 2030$/);
    expect(scene.timeline).toMatchObject({ windowStartUtcMs: Date.UTC(2030, 0, 1), windowEndUtcMs: Date.UTC(2030, 0, 15), openUtcMs: Date.UTC(2030, 0, 1), rates: [60, 600], rate: 600 });
    expect(scene.scales).toEqual(["true-scale"]);
    expect(scene.camera.followChoices).toEqual(["moon"]);
    expect(scene.camera.reach).toBe(500);
    expect(scene.camera.farEarthRadii).toBe(5000);
    expect(scene.camera.pose).toEqual({ focus: "mars", azimuthDeg: 10, elevationDeg: 20, distance: 50 });
    expect(JSON.stringify(scene.bodies)).not.toMatch(/jupiter/i);
  });

  it("refuses settings and a system that disagree, naming the moon", () => {
    const withMoon = (id: string) => ({ ...madeUpFile, moons: { ...madeUpFile.moons, mapped: [...madeUpFile.moons.mapped, { id, labelPriority: 1, labelMaxDistance: 1, description: "x" }] } });
    expect(() => buildPlanetScene(parsePlanetSettings(withMoon("phobos")), madeUpSystem, madeUpPanels)).toThrow(/phobos/);
    expect(() => buildPlanetScene(parsePlanetSettings({ ...madeUpFile, moons: { ...madeUpFile.moons, featuredFamilyId: "family-z" } }), madeUpSystem, madeUpPanels)).toThrow(/family-z/);
    expect(() => buildPlanetScene(parsePlanetSettings(madeUpFile), { ...madeUpSystem, moonList: undefined }, madeUpPanels)).toThrow(/moon list source/);
    expect(() => buildPlanetScene(parsePlanetSettings(madeUpFile), { ...madeUpSystem, bodies: [{ id: "moon" }, { id: "mars" }] }, madeUpPanels)).toThrow(/centres on "mars"/);
  });
});

describe("the planet places rule (I-048)", () => {
  const place = (id: string, extra: Record<string, unknown>) => ({ id, name: id, featureType: "crater", category: "craters", description: "Made up.", ...extra });
  const features = [place("surface", { latitude: 10, longitude: 20 }), place("ring-gap", { latitude: 0, longitude: 0, ringRadius: 2.9 }), place("inner-moon", { latitude: 0, longitude: 0, moonRadius: 1.5 }), place("no-position", {})];
  const categories = { categories: [{ key: "craters", label: "Craters", color: "#ffffff" }] };

  it("shows the centre's surface places only: no ring or inner-moon entry, no entry without a position", () => {
    const scene = buildPlanetScene(parsePlanetSettings({ ...madeUpFile, bodyFeatures: ["mars"] }), { ...madeUpSystem, packages: { mars: { features: { features }, categories } } }, madeUpPanels);
    expect(scene.places).toEqual([{ body: "mars", count: 1 }]);
    expect(placesOf(features, undefined).map((entry) => entry.id)).toEqual(["surface"]);
  });

  it("converts stored west longitudes as the places load when the map record says they are west (T-131), and only then", () => {
    const longitudeOf = (map: unknown) => placesOf(features, map as never)[0]!.longitudeDeg;
    const west = { sourceLongitude: "IAU planetographic, positive-west, 0-360", markerLongitudeFromSource: { scale: 1, offsetDeg: 0 } };
    expect(longitudeOf(west)).toBe(160);
    expect(longitudeOf({ sourceLongitude: "IAU planetographic, positive-west, 0-360", markerLongitudeFromSource: { scale: -1, offsetDeg: 180 } })).toBe(20);
    expect(longitudeOf(undefined)).toBe(20);
  });
});

describe("the real Jupiter scene places the Galilean moons' places (T-140, I-067)", () => {
  const stored = (file: { features: { id: string; longitude?: number }[] }, id: string) => file.features.find((feature) => feature.id === id)!.longitude;
  const placed = (file: { features: PackageFeature[] }, map: { coordinates: MapCoordinates }, id: string) => placesOf(file.features, map.coordinates).find((entry) => entry.id === id)!.longitudeDeg;

  it("draws Europa's Tyre at 33 (180 - 146.6 W stored as 147) and Pwyll at 180 - 271 = -91", () => {
    expect(stored(europaFeatures, "tyre")).toBe(147);
    expect(placed(europaFeatures, europaMap, "tyre")).toBeCloseTo(33, 0);
    expect(placed(europaFeatures, europaMap, "pwyll")).toBe(180 - stored(europaFeatures, "pwyll")!);
    expect(jupiterIoScene.places.map((set) => set.body).sort()).toEqual(["callisto", "europa", "ganymede", "io"]);
  });

  it("leaves Io, Ganymede and Callisto places as stored", () => {
    for (const [file, map] of [[ioFeatures, ioMap], [ganymedeFeatures, ganymedeMap], [callistoFeatures, callistoMap]] as const) {
      for (const feature of file.features.filter((f) => f.latitude !== undefined && f.longitude !== undefined)) expect(placed(file as never, map as never, feature.id), feature.id).toBe(feature.longitude);
    }
  });
});
