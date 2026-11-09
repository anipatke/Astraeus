import { describe, expect, it } from "vitest";
import fits from "../data/ephemerides/planets/planets.json";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createPlanetModels } from "../src/core/planetModels";
import { PLANET_IDS } from "../src/core/planetSeries";
import fixture from "./fixtures/planet-accuracy-o063-horizons.json";

// The planet curve fits (O-025 T-101, Decision 11; every planet a fit of its system barycentre from JPL Horizons DE441 since O-063 T-290) against
// Horizons itself at dates that are not fit nodes (2 January of each year, tests/fixtures/planet-accuracy-o063-horizons.json), and the span they
// cover. Mercury's and Venus's barycentres are the planets; Mars's is within a metre of it. Compared in the ICRF equator: Horizons' ecliptic rows
// are turned back by its obliquity (84381.448"), the engine's by the adapter (EQJ). Years from 1972: before that Horizons' UT (UT1 to 1962) and
// the engine's smooth TT - UTC label the same instant up to 0.7 s apart (tests/planetAccuracyFlybys.test.ts measures those years).
const models = createPlanetModels();
const adapter = createOrbAstronomyAdapter();
type Row = [number, number, number, number, number];
const series = fixture.series as unknown as Record<string, Row[]>;
const OBLIQUITY = (84_381.448 / 3600) * (Math.PI / 180);
const icrfOf = ([, , x, y, z]: Row) => [x, y * Math.cos(OBLIQUITY) - z * Math.sin(OBLIQUITY), y * Math.sin(OBLIQUITY) + z * Math.cos(OBLIQUITY)];
/**
 * The Horizons rows of each planet's barycentre in the fixture (the body centre where barycentre and centre agree). Uranus and Neptune are fitted
 * to the barycentre their satellite ephemerides imply (Horizons' 799 or 899 about the Sun minus about the barycentre, O-063 Decision 1), which is
 * not the DE441 barycentre body 7 or 8 in this fixture; tests/planetAccuracyFlybys.test.ts holds them, with their moon packages, to Horizons'
 * planet centre within 1 km, and the importer's own check against its Horizons input is `worstErrorKm` below.
 */
const truthKey = { mercury: "mercury/body", venus: "venus/body", mars: "mars/body", jupiter: "jupiter/bary", saturn: "saturn/bary" } as const;

describe("planet curve fits", () => {
  it("stay within 1 km of the Horizons system barycentre (Mercury to Saturn) on 2 January of each year 1972 to 2044", () => {
    for (const [id, key] of Object.entries(truthKey)) {
      let worst = 0;
      for (const row of series[`${key}@sun/ecliptic/yearly`]) {
        if (row[0] < Date.UTC(1972, 0, 1)) continue;
        const a = adapter.planetPositionFromSunKm(id as keyof typeof truthKey, row[0]);
        const b = icrfOf(row);
        worst = Math.max(worst, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]));
      }
      expect(worst, id).toBeLessThan(1);
    }
  });

  it("store each planet's own checked worst figure, within the importer's 1 km target, for all eight", () => {
    expect(Object.keys(fits.planets)).toEqual([...PLANET_IDS]);
    for (const p of Object.values(fits.planets)) expect(p.worstErrorKm).toBeLessThan(1);
  });

  it("returns the contract the adapter checks, and refuses dates outside the fitted span", () => {
    const v = models.mars.xyz(new Date(Date.UTC(2019, 8, 21)));
    expect(v.coordinate_keywords).toBe("ecliptic rectangular j2000");
    expect(v.unit_keywords).toBe("au");
    expect(() => models.mars.xyz(new Date(Date.UTC(1940, 0, 1)))).toThrow(RangeError);
    expect(() => models.mars.xyz(new Date(Date.UTC(2050, 0, 1)))).toThrow(RangeError);
  });

  it("is small: all eight planets' coefficients take under 330 KB as stored (325 KB as Horizons barycentres, O-063 T-290; 408 KB as VSOP87A from 1950, O-047 T-200; Pluto's barycentre fit is 19 KB, not the 200 KB of its centre, T-116)", () => {
    const stored = Object.values(fits.planets).reduce((sum, p) => sum + p.data.length, 0);
    expect(stored).toBeLessThan(330_000);
  });
});
