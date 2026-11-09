import { describe, expect, it } from "vitest";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { isPlanetId, PLANET_IDS } from "../src/core/planetSeries";
import fixture from "./fixtures/outer-planets-horizons.json";

// Saturn, Uranus, Neptune and Pluto: the planet series (each the system barycentre as JPL Horizons reports the planet, O-063 T-290; Pluto since
// O-033 T-114) against JPL Horizons heliocentric ICRF vectors of the planet centres (699, 799, 899, 999) archived at the six dates of
// tests/planets.test.ts (fetched 2026-10-20, tests/fixtures/outer-planets-horizons-source.txt).
const adapter = createOrbAstronomyAdapter();
const OUTER = ["saturn", "uranus", "neptune", "pluto"] as const;
/**
 * Worst allowed vector distance from Horizons (km) and separation (arcsec). The series alone is the system barycentre, so it differs from the
 * planet centre by the planet's own wobble about it, measured at these dates (2026-11-10): Saturn 302 km (0.045"), Uranus 32 km, Neptune 74 km
 * (both 0.004"), Pluto 2,132 km (0.099"). The moon package's offset closes the gap (tests/planetAccuracyFlybys.test.ts, within 1 km;
 * tests/planetMoonSystems.test.ts for Pluto). Before O-063 these limits were VSOP87A's own error: 3,000, 21,000 and 40,000 km.
 */
const targets = { saturn: [310, 0.05], uranus: [40, 0.01], neptune: [80, 0.01], pluto: [2200, 0.12] } as const;

describe("outer planet series against JPL Horizons planet centres (six dates 1969 to 2030)", () => {
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
