import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPlanetScene, type PlanetSystem } from "../src/experiences/planets/planetScene";
import { parsePlanetSettings } from "../src/experiences/planets/planetSettings";
import { earthSystem } from "../src/experiences/planets/systems/earth";
import { marsSystem, MARS_CHUNK_URLS } from "../src/experiences/planets/systems/mars";
import { mercurySystem } from "../src/experiences/planets/systems/mercury";
import { venusSystem } from "../src/experiences/planets/systems/venus";
import earthFile from "../data/planets/earth.json";
import marsFile from "../data/planets/mars.json";
import mercuryFile from "../data/planets/mercury.json";
import venusFile from "../data/planets/venus.json";
import earthFeatures from "astraeus-data/bodies/earth/features.json";
import moonFeatures from "astraeus-data/bodies/moon/features.json";
import marsFeatures from "astraeus-data/bodies/mars/features.json";
import mercuryFeatures from "astraeus-data/bodies/mercury/features.json";
import venusFeatures from "astraeus-data/bodies/venus/features.json";

// Mercury, Venus, Earth and Mars in the planet switch (O-033 T-119): one settings file and one small system each, built by the one planet builder.
// Whether each needs the planet series, and what each shows on a body's card, are held by tests/planetViews.test.ts; what Mars loads, by the engine's tests/planetChunksWindow.test.ts.
const panels = { pauseSeconds: 6, autoOpen: false, panels: [] };
const views: Record<string, { file: unknown; system: PlanetSystem }> = {
  mercury: { file: mercuryFile, system: mercurySystem },
  venus: { file: venusFile, system: venusSystem },
  earth: { file: earthFile, system: earthSystem },
  mars: { file: marsFile, system: marsSystem },
};
const build = (id: string) => buildPlanetScene(parsePlanetSettings(views[id].file), views[id].system, panels);
const placed = (features: readonly { id: string; latitude?: number; longitude?: number }[]) => features.filter((feature) => feature.latitude !== undefined && feature.longitude !== undefined);

afterEach(() => vi.unstubAllGlobals());

describe("the four inner planets' views", () => {
  it("open on their own planet with its own objects", () => {
    expect(build("mercury").bodies.map((body) => body.id)).toEqual(["mercury"]);
    expect(build("venus").bodies.map((body) => body.id)).toEqual(["venus"]);
    expect(build("earth").bodies.map((body) => body.id)).toEqual(["earth", "moon"]);
    expect(build("mars").bodies.map((body) => body.id)).toEqual(["mars", "phobos", "deimos"]);
    expect(build("mars").camera.followChoices).toEqual(["phobos"]);
    expect(build("mars").bodies.filter((body) => body.orbit).map((body) => body.id)).toEqual(["phobos", "deimos"]);
    expect(build("mercury").camera.followChoices).toEqual([]);
  });

  it("carry the tagged places of the existing packages untouched (Earth 20, Moon 30, Mercury 16, Venus 19, Mars 32 with its two moons' orbit entries not placed)", () => {
    expect(marsFeatures.features).toHaveLength(32);
    expect(marsFeatures.features.filter((feature) => feature.latitude === undefined).map((feature) => feature.id)).toEqual(["phobos", "deimos"]);
    const counts = (id: string) => Object.fromEntries(build(id).places.map((set) => [set.body, set.count]));
    expect(counts("earth")).toEqual({ earth: 20, moon: 30 });
    expect(counts("mercury")).toEqual({ mercury: 16 });
    expect(counts("venus")).toEqual({ venus: 19 });
    expect(counts("mars")).toEqual({ mars: 30 });
    for (const [source, count] of [[earthFeatures, 20], [moonFeatures, 30], [mercuryFeatures, 16], [venusFeatures, 19], [marsFeatures, 30]] as const) expect(placed(source.features as never)).toHaveLength(count);
  });

  it("gives Mars its moon list and Earth, Mercury and Venus none", () => {
    expect(build("mars").moonPanel!.count).toBe(2);
    expect(build("mars").bodySets).toEqual([]);
    for (const id of ["mercury", "venus", "earth"]) {
      expect(build(id).moonPanel, id).toBeUndefined();
      expect(build(id).bodySets, id).toEqual([]);
    }
  });

  it("downloads nothing for Mercury, Venus and Earth, and Mars asks for its own moon-fit files only", async () => {
    const requested: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => { requested.push(String(url)); throw new Error("stubbed: no network in tests"); });
    for (const id of ["mercury", "venus", "earth"]) await build(id).load({ data: views[id].system.data });
    expect(requested).toEqual([]);
    expect(Object.keys(MARS_CHUNK_URLS).sort()).toEqual(["deimos/2016.bin", "mars/2016.bin", "phobos/2016.bin"]);
    for (const url of Object.values(MARS_CHUNK_URLS)) expect(url).toMatch(/mars-moons\/(mars|phobos|deimos)\/2016/);
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
    expect(() => buildPlanetScene(parsePlanetSettings(marsFile), { ...marsSystem, moonList: undefined }, panels)).toThrow(/moon list source/);
  });
});
