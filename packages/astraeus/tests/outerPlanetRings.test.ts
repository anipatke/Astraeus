import { describe, expect, it } from "vitest";
import { catalogue } from "../src/assets/catalogue";
import { parseRingSystem } from "../src/assets/rings";
import { readJson } from "../tools/import/test-io.mjs";

// Moved from the planets demo (O-059 T-270; first O-033 T-118): the catalogue's ring bands are the data files' bands, from the NSSDC fact sheets with a look from the donor.
const ROOT = new URL("../", import.meta.url).pathname;

describe("the outer planets' rings", () => {
  it("Saturn's, Uranus's and Neptune's rings come from the NSSDC fact sheets, with a look from the donor, and Pluto has none", () => {
    for (const name of ["saturn", "uranus", "neptune"] as const) {
      const rings = catalogue.get(name).visual.rings!;
      expect(rings.body).toBe(name);
      expect(rings.sources.join(" ")).toContain("nssdc.gsfc.nasa.gov/planetary/factsheet/");
      expect(rings.sources.join(" ")).toContain("Planetary Explorer");
      for (const band of rings.bands) expect(band.outerKm).toBeGreaterThan(band.innerKm);
      expect(parseRingSystem(readJson(`${ROOT}data/rings/${name}.json`)).bands).toEqual(rings.bands);
    }
    expect(catalogue.get("pluto").visual.rings).toBeUndefined();
  });

  it("Saturn draws its ring bands at the fact sheet's radii, the catalogue being the one source", () => {
    const rings = catalogue.get("saturn").visual.rings!;
    const source = readJson(`${ROOT}data/rings/saturn.json`) as { bands: { id: string; innerKm: number; outerKm: number }[] };
    expect(rings.bands.map((band) => band.id)).toEqual(source.bands.map((band) => band.id));
    for (const band of rings.bands) expect([band.innerKm, band.outerKm]).toEqual([source.bands.find((entry) => entry.id === band.id)!.innerKm, source.bands.find((entry) => entry.id === band.id)!.outerKm]);
  });

  it("Uranus draws its ring bands from the data file", () => {
    expect(catalogue.get("uranus").visual.rings!.bands).toHaveLength((readJson(`${ROOT}data/rings/uranus.json`) as { bands: unknown[] }).bands.length);
  });
});
