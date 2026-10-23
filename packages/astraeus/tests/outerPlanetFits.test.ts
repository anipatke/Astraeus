import { describe, expect, it } from "vitest";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { isPlanetId, PLANET_IDS } from "../src/core/planetSeries";
import fixture from "./fixtures/outer-planets-horizons.json";

// Saturn, Uranus, Neptune (VSOP87A curve fits) and Pluto (the system barycentre, a curve fit of Horizons states), O-033 T-114, against JPL Horizons heliocentric
// ICRF vectors archived at the six dates of tests/planets.test.ts (fetched 2026-10-20, tests/fixtures/outer-planets-horizons-source.txt).
const adapter = createOrbAstronomyAdapter();
const OUTER = ["saturn", "uranus", "neptune", "pluto"] as const;
/**
 * Worst allowed vector distance from Horizons (km) and separation (arcsec). VSOP87A's own error against DE441 is the limit for the first three
 * (measured at fit time: Saturn 2,256 km and 0.32", Uranus 19,070 km and 1.36", Neptune 36,192 km and 1.62", all VSOP87A model error, not fit
 * error: the fits are within 1 km of VSOP87A); Pluto's planet fit is the Pluto system barycentre (Horizons body 9, within 1 km of it), so it differs from Pluto's centre by Pluto's own offset, up to about 2,130 km (0.075 arcsec); tests/planetMoonSystems.test.ts holds the placement with the offset to a kilometre.
 */
const targets = { saturn: [3000, 0.4], uranus: [21000, 1.5], neptune: [40000, 1.8], pluto: [2200, 0.12] } as const;

describe("outer planet curve fits against JPL Horizons (six dates 1969 to 2030)", () => {
  for (const planet of OUTER) {
    it(`${planet} stays within ${targets[planet][0]} km and ${targets[planet][1]} arcsec of the archived vectors`, () => {
      const samples = fixture.bodies[planet].samples;
      expect(samples).toHaveLength(6);
      let distance = 0, arcsec = 0;
      for (const sample of samples) {
        const p = adapter.planetPositionFromSunKm(planet, sample.utcMs);
        const h = sample.positionKm;
        distance = Math.max(distance, Math.hypot(p[0] - h[0], p[1] - h[1], p[2] - h[2]));
        const cosine = (p[0] * h[0] + p[1] * h[1] + p[2] * h[2]) / (Math.hypot(p[0], p[1], p[2]) * Math.hypot(h[0], h[1], h[2]));
        arcsec = Math.max(arcsec, Math.acos(Math.min(1, cosine)) * (180 / Math.PI) * 3600);
      }
      expect(distance).toBeLessThan(targets[planet][0]);
      expect(arcsec).toBeLessThan(targets[planet][1]);
    });
  }

  it("accepts all eight planet ids and nothing else", () => {
    expect([...PLANET_IDS]).toEqual(["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]);
    for (const id of PLANET_IDS) expect(isPlanetId(id)).toBe(true);
    expect(isPlanetId("earth")).toBe(false);
    expect(isPlanetId("ceres")).toBe(false);
  });

  it("was fetched from the Horizons targets 699, 799, 899 and 999 about the Sun", () => {
    expect(OUTER.map((planet) => fixture.bodies[planet].command)).toEqual(["699", "799", "899", "999"]);
    expect(fixture.center).toMatch(/500@10/);
  });
});
