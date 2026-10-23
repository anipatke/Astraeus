import { describe, expect, it } from "vitest";
import html from "../../astraeus-site/assets.html?raw";
import { exists, readJson } from "../tools/import/test-io.mjs";

// The core Jupiter moon catalogue (data/moons/jupiter.json, O-025 T-097) against the T-096 curve fits, the O-018 body packages and the catalogue page.
const ROOT = new URL("../", import.meta.url).pathname;
interface Moon {
  id: string; name: string; naifId: number; family: string; meanRadiusKm: number; radiusBasis: string; discoveryYear: number;
  ephemeris: { set: string; body: string }; bodyPackage: string | null;
  sources: { list: string; family: string; familyBasis: string[]; radius: string; discovery: string };
}
const catalogue = readJson(`${ROOT}data/moons/jupiter.json`) as { sources: Record<string, { title: string; url: string }>; families: { id: string; sources: string[] }[]; moons: Moon[] };
const fits = readJson(`${ROOT}data/ephemerides/jupiter-moons/index.json`) as { bodies: { id: string; role: string; naifId: number }[] };
const fitMoons = fits.bodies.filter((body) => body.role === "moon");

describe("Jupiter moon catalogue (core data)", () => {
  it("has an entry for every moon in the curve fits and a fit for every entry", () => {
    expect(catalogue.moons.map((moon) => moon.id).sort()).toEqual(fitMoons.map((body) => body.id).sort());
    expect(new Set(catalogue.moons.map((moon) => moon.id)).size).toBe(catalogue.moons.length);
    for (const moon of catalogue.moons) {
      expect(moon.ephemeris).toEqual({ set: "jupiter-moons", body: moon.id });
      expect(moon.naifId).toBe(fitMoons.find((body) => body.id === moon.id)?.naifId);
    }
  });

  it("puts every moon in exactly one declared family, and every family has moons", () => {
    const declared = new Set(catalogue.families.map((family) => family.id));
    for (const moon of catalogue.moons) expect(declared.has(moon.family), moon.id).toBe(true);
    for (const family of catalogue.families) expect(catalogue.moons.some((moon) => moon.family === family.id), family.id).toBe(true);
    const count = (id: string) => catalogue.moons.filter((moon) => moon.family === id).length;
    expect([count("galilean"), count("inner"), count("himalia"), count("ananke"), count("carme"), count("pasiphae")]).toEqual([4, 4, 11, 28, 41, 23]);
  });

  it("gives every moon a size, a discovery year and sources that resolve", () => {
    for (const moon of catalogue.moons) {
      expect(moon.meanRadiusKm, moon.id).toBeGreaterThan(0);
      expect(["measured", "estimate"]).toContain(moon.radiusBasis);
      expect(moon.discoveryYear).toBeGreaterThanOrEqual(1610);
      for (const id of [moon.sources.list, moon.sources.family, moon.sources.radius, moon.sources.discovery, ...moon.sources.familyBasis]) expect(catalogue.sources[id], `${moon.id} ${id}`).toBeDefined();
    }
    for (const source of Object.values(catalogue.sources)) expect(source.url).toMatch(/^https:\/\//);
  });

  it("links exactly the four mapped moons to their O-018 body packages", () => {
    const linked = catalogue.moons.filter((moon) => moon.bodyPackage !== null).map((moon) => moon.id);
    expect(linked).toEqual(["io", "europa", "ganymede", "callisto"]);
    for (const moon of catalogue.moons.filter((m) => m.bodyPackage !== null)) {
      expect(exists(`${ROOT}${moon.bodyPackage}/features.json`), moon.id).toBe(true);
      expect(moon.bodyPackage).toBe(`data/bodies/${moon.id}`);
    }
  });

  it("holds no story or demo wording", () => {
    expect(JSON.stringify(catalogue)).not.toMatch(/\b(story|demo|panel|tour)\b/i);
  });

  it("is listed by family on the catalogue page, every moon once", () => {
    const listed = [...html.matchAll(/data-moon="([^"]+)"/g)].map((m) => m[1]);
    expect(listed.sort()).toEqual(catalogue.moons.map((moon) => moon.id).sort());
    for (const family of catalogue.families) expect(html).toContain(`data-moon-family="${family.id}"`);
  });
});
