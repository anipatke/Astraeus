import { moonDataFolder } from "./moonData";
import { describe, expect, it } from "vitest";
import { parseMoonCatalogue } from "../src/assets/moonCatalogue";
import { exists, readJson } from "../tools/import/test-io.mjs";

// The core moon lists for Mars, Saturn, Uranus, Neptune and Pluto (data/moons/<planet>.json, O-033 T-115), parsed by the same
// parser as Jupiter's, against each planet's T-114 curve-fit index.
const ROOT = new URL("../", import.meta.url).pathname;
interface RawMoon { id: string; naifId: number; family: string; radiusBasis: string; discoveryYear: number; ephemeris: { set: string; body: string }; bodyPackage: string | null; sources: { list: string; family: string; familyBasis: string[]; radius: string; discovery: string } }
interface Raw { parent: string; ephemeris: { path: string; moonCount: number }; sources: Record<string, { title: string; url: string }>; families: { id: string; sources: string[] }[]; moons: RawMoon[] }

const EXPECTED: Record<string, Record<string, number>> = {
  mars: { "mars-moons": 2 },
  saturn: { major: 7, "small-regular": 17, inuit: 39, gallic: 19, norse: 210 },
  uranus: { major: 5, inner: 13, caliban: 3, retrograde: 6, loner: 1 },
  neptune: { triton: 1, inner: 7, sao: 3, neso: 3, loner: 2 },
  pluto: { charon: 1, small: 4 },
};
const MAPPED: Record<string, string[]> = { mars: [], saturn: ["mimas", "enceladus", "tethys", "dione", "rhea", "titan", "iapetus"], uranus: [], neptune: ["triton"], pluto: ["charon"] };

describe.each(Object.keys(EXPECTED))("%s moon list (core data)", (planet) => {
  const raw = readJson(`${ROOT}data/moons/${planet}.json`) as Raw;
  const fits = readJson(`${moonDataFolder(planet)}index.json`) as { bodies: { id: string; role: string; naifId: number }[] };
  const fitMoons = fits.bodies.filter((body) => body.role === "moon");
  const catalogue = parseMoonCatalogue(raw);

  it("parses with the shared parser and names its planet", () => {
    expect(catalogue.parent).toBe(planet);
    expect(raw.ephemeris).toEqual({ path: `data/ephemerides/${planet}-moons/index.json`, moonCount: fitMoons.length });
  });

  it("has an entry for every moon in the curve-fit index and a fit for every entry", () => {
    expect(raw.moons.map((moon) => moon.id).sort()).toEqual(fitMoons.map((body) => body.id).sort());
    for (const moon of raw.moons) {
      expect(moon.ephemeris).toEqual({ set: `${planet}-moons`, body: moon.id });
      expect(moon.naifId).toBe(fitMoons.find((body) => body.id === moon.id)?.naifId);
    }
  });

  it("puts every moon in one declared family with the expected counts, and every family has moons", () => {
    const counts = Object.fromEntries(catalogue.families.map((family) => [family.id, catalogue.moons.filter((moon) => moon.family === family.id).length]));
    expect(counts).toEqual(EXPECTED[planet]);
  });

  it("gives every moon a size, its basis, a discovery year and sources that resolve", () => {
    for (const moon of raw.moons) {
      expect(["measured", "estimate"]).toContain(moon.radiusBasis);
      expect(moon.discoveryYear, moon.id).toBeGreaterThanOrEqual(1600);
      for (const id of [moon.sources.list, moon.sources.family, moon.sources.radius, moon.sources.discovery, ...moon.sources.familyBasis]) expect(raw.sources[id], `${moon.id} ${id}`).toBeDefined();
    }
    for (const family of raw.families) for (const id of family.sources) expect(raw.sources[id], `${family.id} ${id}`).toBeDefined();
    for (const source of Object.values(raw.sources)) expect(source.url).toMatch(/^https:\/\//);
  });

  it("marks exactly the moons with a Planetary Explorer map, each linked to an existing body package", () => {
    const linked = raw.moons.filter((moon) => moon.bodyPackage !== null).map((moon) => moon.id);
    expect(linked.sort()).toEqual([...MAPPED[planet]].sort());
    for (const moon of raw.moons.filter((m) => m.bodyPackage !== null)) {
      expect(exists(`${ROOT}${moon.bodyPackage}/features.json`), moon.id).toBe(true);
      expect(moon.bodyPackage).toBe(`data/bodies/${moon.id}`);
    }
  });

  it("holds no story or demo wording", () => {
    expect(JSON.stringify(raw)).not.toMatch(/\b(story|demo|panel|tour)\b/i);
  });
});

describe("brightness-based sizes are marked", () => {
  const saturn = readJson(`${ROOT}data/moons/saturn.json`) as Raw & { moons: (RawMoon & { meanRadiusKm: number })[] };
  const byId = (id: string) => saturn.moons.find((moon) => moon.id === id);
  it("marks the irregular moons estimates and the big moons measured", () => {
    expect(byId("titan")?.radiusBasis).toBe("measured");
    expect(byId("phoebe")?.radiusBasis).toBe("measured");
    expect(byId("siarnaq")?.radiusBasis).toBe("measured");
    expect(byId("s2023-s01")?.radiusBasis).toBe("estimate");
    expect(saturn.moons.filter((moon) => moon.family === "norse" && moon.radiusBasis === "estimate").length).toBeGreaterThan(150);
  });
  it("marks the one stand-in size", () => {
    expect(byId("s2009-s2")).toMatchObject({ radiusBasis: "estimate", meanRadiusKm: 0.15 });
  });
});
