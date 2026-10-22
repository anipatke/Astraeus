import { describe, expect, it } from "vitest";
import { catalogue } from "../src/assets/catalogue";
import { createComposition } from "../src/assets/compositions";
import { parseMoonCatalogue } from "../src/assets/moonCatalogue";
import { buildPlanetDefinition, type PlanetSystem } from "../src/experiences/planets/planetDefinition";
import { choosePlanet, PLANET_PARAM } from "../src/experiences/planets/planetChoice";
import { parsePlanetSettings, PlanetSettingsError } from "../src/experiences/planets/planetSettings";
import { jupiterIoExplorer } from "../src/experiences/jupiter-io/jupiterIo";
import jupiterFile from "../data/planets/jupiter.json";
import before from "./fixtures/jupiter-view-before.json";
import { jupiterViewSnapshot } from "./jupiterViewSnapshot";

// A made-up planet first (ARCH-03): its own words, a made-up moon list, catalogued bodies as stand-ins for the pictures, no fitted data.
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
  moons: { listSource: "A made-up list", featuredFamilyId: "family-a", follow: "moon", mapped: [{ id: "moon", labelPriority: 40, labelMaxDistance: 500, description: "A made-up mapped moon." }] },
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
    { id: "dot-a", name: "Dot A", family: "family-a", meanRadiusKm: 5, radiusBasis: "estimate", sources: { list: "list" } },
    { id: "dot-b", name: "Dot B", family: "family-b", meanRadiusKm: 3, radiusBasis: "estimate", sources: { list: "list" } },
  ],
});
const madeUpSystem: PlanetSystem = {
  catalogue: madeUpMoons,
  composition: createComposition(catalogue, { id: "made-up", bodies: ["mars", "moon"], defaultCenter: "mars" }),
  ephemeris: () => { throw new Error("a made-up system has no fitted positions"); },
  fitSource: "Made-up fit",
  tidalLockNote: "Made-up lock.",
  centreGmKm3S2: 42_828.37,
  packages: {},
  load: async () => undefined,
};
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
    bad({ moons: { ...madeUpFile.moons, follow: "dot-a" } }, /moons\.follow/);
    bad({ colour: "red" }, /settings\.colour/);
    expect(() => parsePlanetSettings({ ...madeUpFile, startView: { ...madeUpFile.startView, distance: -1 } })).toThrow(PlanetSettingsError);
  });
});

describe("planet definition builder (T-117)", () => {
  it("builds a made-up planet from its settings alone, with no Jupiter in it", () => {
    const definition = buildPlanetDefinition(parsePlanetSettings(madeUpFile), madeUpSystem, madeUpPanels);
    const ids = definition.experience.objects.map((object) => object.id);
    expect(ids).toEqual(["mars", "moon", "dot-a", "dot-b"]);
    expect(definition.experience.objects.find((object) => object.id === "dot-a")?.description).toBe("A small moon of Made-up planet in the Family A.");
    expect(definition.experience.objects.filter((object) => object.listed === false).map((object) => object.id)).toEqual(["dot-a", "dot-b"]);
    expect(definition.experience.cameraPresets.map((preset) => preset.id)).toEqual(["overview", "focus-mars", "focus-moon", "follow-moon"]);
    expect(definition.experience.moonFamilies?.planetLabel).toBe("Made-up planet");
    expect(definition.bodySets?.[0].members.map((member) => member.id)).toEqual(["dot-a", "dot-b"]);
    expect(definition.label).toBe("A made-up planet");
    expect(definition.visualOverrides).toBeUndefined();
    expect(JSON.stringify(definition)).not.toMatch(/jupiter/i);
  });

  it("refuses settings and a system that disagree, naming the moon", () => {
    const withMoon = (id: string) => ({ ...madeUpFile, moons: { ...madeUpFile.moons, mapped: [...madeUpFile.moons.mapped, { id, labelPriority: 1, labelMaxDistance: 1, description: "x" }] } });
    expect(() => buildPlanetDefinition(parsePlanetSettings(withMoon("dot-a")), madeUpSystem, madeUpPanels)).toThrow(/dot-a/);
    expect(() => buildPlanetDefinition(parsePlanetSettings({ ...madeUpFile, moons: { ...madeUpFile.moons, featuredFamilyId: "family-z" } }), madeUpSystem, madeUpPanels)).toThrow(/family-z/);
  });

  it("leaves Jupiter's view exactly as it was: window, bodies, story panels, families, tagged places, look", () => {
    expect(jupiterViewSnapshot(jupiterIoExplorer)).toEqual(before);
  });
});

describe("planet choice (T-117)", () => {
  const entries = [
    { name: "jupiter", label: "Jupiter", order: 5, isDefault: true },
    { name: "mars", label: "Mars", order: 4, isDefault: false },
  ];
  it("opens the default planet unless the address names another, and lists planets in order", () => {
    const opened = choosePlanet(entries, null)!;
    expect(opened.name).toBe("jupiter");
    expect(opened.switcher.param).toBe(PLANET_PARAM);
    expect(opened.switcher.options.map((option) => [option.value, option.active])).toEqual([["mars", false], ["jupiter", true]]);
    expect(choosePlanet(entries, "mars")!.name).toBe("mars");
    expect(choosePlanet(entries, "nope")!.name).toBe("jupiter");
    expect(choosePlanet([], null)).toBeUndefined();
  });
});

describe("the planet places rule (I-048)", () => {
  const place = (id: string, extra: Record<string, unknown>) => ({ id, name: id, featureType: "crater", category: "craters", description: "Made up.", ...extra });
  const package_ = {
    features: { features: [place("surface", { latitude: 10, longitude: 20 }), place("ring-gap", { latitude: 0, longitude: 0, ringRadius: 2.9 }), place("inner-moon", { latitude: 0, longitude: 0, moonRadius: 1.5 }), place("no-position", {})] },
    categories: { categories: [{ key: "craters", label: "Craters", color: "#ffffff", isFilterable: true }] },
  };
  it("shows the centre's surface places only: no ring or inner-moon entry, no entry without a position", () => {
    const definition = buildPlanetDefinition(parsePlanetSettings({ ...madeUpFile, bodyFeatures: ["mars"] }), { ...madeUpSystem, packages: { mars: package_ } } as unknown as PlanetSystem, madeUpPanels);
    expect(definition.experience.bodyFeatures!.map((set) => [set.bodyId, set.features.map((feature) => feature.id)])).toEqual([["mars", ["surface"]]]);
  });

  it("converts stored west longitudes as the places load when the map record says they are west (T-131), and only then", () => {
    const longitudeOf = (map: unknown) => {
      const definition = buildPlanetDefinition(parsePlanetSettings({ ...madeUpFile, bodyFeatures: ["mars"] }), { ...madeUpSystem, packages: { mars: { ...package_, ...(map === undefined ? {} : { map }) } } } as unknown as PlanetSystem, madeUpPanels);
      return definition.experience.bodyFeatures![0]!.features[0]!.longitude;
    };
    const west = { coordinates: { sourceLongitude: "IAU planetographic, positive-west, 0-360", markerLongitudeFromSource: { scale: 1, offsetDeg: 0 } } };
    expect(longitudeOf(west)).toBe(160);
    expect(longitudeOf({ coordinates: { sourceLongitude: "IAU planetographic, positive-west, 0-360", markerLongitudeFromSource: { scale: -1, offsetDeg: 180 } } })).toBe(20);
    expect(longitudeOf(undefined)).toBe(20);
  });
});
