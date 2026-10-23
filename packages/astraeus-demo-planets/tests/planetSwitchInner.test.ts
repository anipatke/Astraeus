import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExperienceDefinition } from "astraeus/app/experienceDefinition";
import { MARS_MOON_SYSTEM } from "astraeus/core/bodies/planetMoons";
import { needsPlanetSeries } from "astraeus/app/planetNeeds";
import { buildPlanetDefinition, type PlanetSystem } from "../src/experiences/planets/planetDefinition";
import { parsePlanetSettings } from "../src/experiences/planets/planetSettings";
import { earthSystem } from "../src/experiences/planets/systems/earth";
import { marsSystem, MARS_CHUNK_URLS } from "../src/experiences/planets/systems/mars";
import { mercurySystem } from "../src/experiences/planets/systems/mercury";
import { venusSystem } from "../src/experiences/planets/systems/venus";
import earthFile from "../data/planets/earth.json";
import marsFile from "../data/planets/mars.json";
import mercuryFile from "../data/planets/mercury.json";
import venusFile from "../data/planets/venus.json";
import earthFeatures from "astraeus/data/bodies/earth/features.json";
import moonFeatures from "astraeus/data/bodies/moon/features.json";
import marsFeatures from "astraeus/data/bodies/mars/features.json";
import mercuryFeatures from "astraeus/data/bodies/mercury/features.json";
import venusFeatures from "astraeus/data/bodies/venus/features.json";

// Mercury, Venus, Earth and Mars in the planet switch (O-033 T-119): one settings file and one small system each, built by the one planet builder.
const panels = { pauseSeconds: 6, autoOpen: false, panels: [] };
const views: Record<string, { file: unknown; system: PlanetSystem }> = {
  mercury: { file: mercuryFile, system: mercurySystem },
  venus: { file: venusFile, system: venusSystem },
  earth: { file: earthFile, system: earthSystem },
  mars: { file: marsFile, system: marsSystem },
};
const build = (id: string): ExperienceDefinition => buildPlanetDefinition(parsePlanetSettings(views[id].file), views[id].system, panels);
const placed = (features: readonly { id: string; latitude?: number; longitude?: number }[]) => features.filter((feature) => feature.latitude !== undefined && feature.longitude !== undefined);

afterEach(() => vi.unstubAllGlobals());

describe("the four inner planets' views", () => {
  it("open on their own planet with its own objects", () => {
    expect(build("mercury").experience.objects.map((object) => object.id)).toEqual(["mercury"]);
    expect(build("venus").experience.objects.map((object) => object.id)).toEqual(["venus"]);
    expect(build("earth").experience.objects.map((object) => object.id)).toEqual(["earth", "moon"]);
    expect(build("mars").experience.objects.map((object) => object.id)).toEqual(["mars", "phobos", "deimos"]);
    expect(build("mars").experience.cameraPresets.map((preset) => preset.id)).toContain("follow-phobos");
    expect(build("mars").composition?.paths?.map((path) => path.body)).toEqual(["phobos", "deimos"]);
    expect(build("mercury").experience.cameraPresets.map((preset) => preset.id)).toEqual(["overview", "focus-mercury"]);
  });

  it("carry the tagged places of the existing packages untouched (Earth 20, Moon 30, Mercury 16, Venus 19, Mars 32 with its two moons' orbit entries not placed)", () => {
    const counts = (id: string, body: string) => build(id).experience.bodyFeatures!.find((set) => set.bodyId === body)!.features;
    expect(counts("earth", "earth")).toHaveLength(20);
    expect(counts("earth", "moon")).toHaveLength(30);
    expect(counts("mercury", "mercury")).toHaveLength(16);
    expect(counts("venus", "venus")).toHaveLength(19);
    expect(marsFeatures.features).toHaveLength(32);
    expect(counts("mars", "mars")).toHaveLength(30);
    expect(marsFeatures.features.filter((feature) => feature.latitude === undefined).map((feature) => feature.id)).toEqual(["phobos", "deimos"]);
    for (const [id, body, source] of [["earth", "earth", earthFeatures], ["earth", "moon", moonFeatures], ["mars", "mars", marsFeatures], ["mercury", "mercury", mercuryFeatures], ["venus", "venus", venusFeatures]] as const) {
      const shown = counts(id, body).map((feature) => [feature.id, feature.latitude, feature.longitude, feature.description]);
      expect(shown).toEqual(placed(source.features).map((feature) => { const f = feature as { id: string; latitude: number; longitude: number; description: string }; return [f.id, f.latitude, f.longitude, f.description]; }));
    }
  });

  it("gives Mars its moon list and Earth, Mercury and Venus none", () => {
    expect(build("mars").experience.moonFamilies?.families.map((family) => family.id)).toEqual(["mars-moons"]);
    expect(build("mars").bodySets).toEqual([]);
    for (const id of ["mercury", "venus", "earth"]) {
      expect(build(id).experience.moonFamilies, id).toBeUndefined();
      expect(build(id).bodySets, id).toEqual([]);
    }
  });

  it("loads the planet series only for the views centred on a planet; Earth, as in Apollo, needs none", () => {
    expect(needsPlanetSeries(build("earth"))).toBe(false);
    for (const id of ["mercury", "venus", "mars"]) expect(needsPlanetSeries(build(id)), id).toBe(true);
  });

  it("downloads nothing for Mercury, Venus and Earth, and for Mars only its own moon-fit files", async () => {
    const requested: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => { requested.push(String(url)); throw new Error("stubbed: no network in tests"); });
    for (const id of ["mercury", "venus", "earth"]) await build(id).prepare?.();
    expect(requested).toEqual([]);
    // The test setup has Mars's fits installed already; take them out so the view has to ask for its own.
    const installed = MARS_MOON_SYSTEM.ephemeris();
    MARS_MOON_SYSTEM.install(null);
    try { await expect(build("mars").prepare!()).rejects.toThrow(/stubbed/); } finally { MARS_MOON_SYSTEM.install(installed); }
    expect(requested.length).toBeGreaterThan(0);
    for (const url of requested) expect(url, url).toMatch(/mars-moons\/(mars|phobos|deimos)\/2016/);
    expect(Object.keys(MARS_CHUNK_URLS).sort()).toEqual(["deimos/2016.bin", "mars/2016.bin", "phobos/2016.bin"]);
  });

  it("accepts a planet with no moons and tagged places on its centre, and refuses a half-given moon list", () => {
    expect(parsePlanetSettings(mercuryFile).moons).toBeUndefined();
    expect(parsePlanetSettings(mercuryFile).bodyFeatures).toEqual(["mercury"]);
    const moons = (marsFile as { moons: Record<string, unknown> }).moons;
    const { featuredFamilyId: _dropped, ...withoutFamily } = moons;
    expect(() => parsePlanetSettings({ ...marsFile, moons: withoutFamily })).toThrow(/moons\.listSource/);
    expect(() => parsePlanetSettings({ ...marsFile, bodyFeatures: ["venus"] })).toThrow(/bodyFeatures/);
  });

  it("refuses a Mars file that lists a moon list source without a list", () => {
    expect(() => buildPlanetDefinition(parsePlanetSettings(marsFile), { ...marsSystem, catalogue: undefined }, panels)).toThrow(/moon fit parts but no moon list/);
  });
});
