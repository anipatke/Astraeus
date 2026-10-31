import { describe, expect, it } from "vitest";
import { Jupiter, Mars, Mercury, Neptune, Saturn, Uranus, Venus } from "@lizard-isana/orb/src/orb-planet.js";
import { registerVSOP87A } from "@lizard-isana/orb/src/orb-vsop87a-registry.js";
import { JUPITER_FULL_COEF } from "@lizard-isana/orb/vsop87a/jupiter";
import { MARS_FULL_COEF } from "@lizard-isana/orb/vsop87a/mars";
import { NEPTUNE_FULL_COEF } from "@lizard-isana/orb/vsop87a/neptune";
import { SATURN_FULL_COEF } from "@lizard-isana/orb/vsop87a/saturn";
import { URANUS_FULL_COEF } from "@lizard-isana/orb/vsop87a/uranus";
import { MERCURY_FULL_COEF } from "@lizard-isana/orb/vsop87a/mercury";
import { VENUS_FULL_COEF } from "@lizard-isana/orb/vsop87a/venus";
import fits from "../data/ephemerides/planets/planets.json";
import { createPlanetModels } from "../src/core/planetModels";
import { PLANET_IDS } from "../src/core/planetSeries";

// The planet curve fits (O-025 T-101, Decision 11) against the full VSOP87A series they replace, at dates that are not fit nodes, and the
// span they cover. The accuracy against JPL Horizons stays in tests/planets.test.ts (C-022/C-023 scope), which runs on the fits.
registerVSOP87A("Mercury", MERCURY_FULL_COEF);
registerVSOP87A("Venus", VENUS_FULL_COEF);
registerVSOP87A("Mars", MARS_FULL_COEF);
registerVSOP87A("Jupiter", JUPITER_FULL_COEF);
registerVSOP87A("Saturn", SATURN_FULL_COEF);
registerVSOP87A("Uranus", URANUS_FULL_COEF);
registerVSOP87A("Neptune", NEPTUNE_FULL_COEF);
const full = { vsop87a: "full" } as const;
const references = {
  mercury: new Mercury(full), venus: new Venus(full), mars: new Mars(full), jupiter: new Jupiter(full),
  saturn: new Saturn(full), uranus: new Uranus(full), neptune: new Neptune(full),
};
/** Pluto has no VSOP87 series; its fit is against Horizons (tests/outerPlanetFits.test.ts). */
const vsopIds = PLANET_IDS.filter((id): id is keyof typeof references => id in references);
const AU_KM = 149_597_870.7;
const models = createPlanetModels();

describe("planet curve fits", () => {
  it("stay within 1 km of the full VSOP87A series from 1972 to 2045 (UTC, leap seconds included)", () => {
    for (const id of vsopIds) {
      let worst = 0;
      for (let ms = Date.UTC(1972, 0, 1) + 7_654_321; ms < Date.UTC(2045, 0, 1); ms += 13 * 86_400_000 + 3_333_333) {
        const a = models[id].xyz(new Date(ms));
        const b = references[id].xyz(new Date(ms));
        worst = Math.max(worst, Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * AU_KM);
      }
      expect(worst, id).toBeLessThan(1);
    }
  });

  it("stay within 8 km of the series from 1969 to the end of 1971, apart from Orb's own pre-1972 step in TT - UTC", () => {
    for (const id of vsopIds) {
      let worst = 0;
      for (let ms = Date.UTC(1969, 0, 1) + 7_654_321; ms < Date.UTC(1972, 0, 1); ms += 5 * 86_400_000 + 3_333_333) {
        const a = models[id].xyz(new Date(ms));
        const b = references[id].xyz(new Date(ms));
        worst = Math.max(worst, Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * AU_KM);
      }
      // Orb steps its pre-1972 TT - UTC once a month (about 0.1 s, up to 5 km for Mercury); the fits follow the smooth line.
      expect(worst, id).toBeLessThan(8);
    }
  });

  it("returns the contract the adapter checks, and refuses dates outside the fitted span", () => {
    const v = models.mars.xyz(new Date(Date.UTC(2019, 8, 21)));
    expect(v.coordinate_keywords).toBe("ecliptic rectangular j2000");
    expect(v.unit_keywords).toBe("au");
    expect(() => models.mars.xyz(new Date(Date.UTC(1940, 0, 1)))).toThrow(RangeError);
    expect(() => models.mars.xyz(new Date(Date.UTC(2050, 0, 1)))).toThrow(RangeError);
  });

  it("is small: all eight planets' coefficients take under 430 KB as stored (408 KB since the fits start in 1950, O-047 T-200; 329 KB from 1969; Pluto's barycentre fit is 15 KB, not the 200 KB of its centre, T-116)", () => {
    const stored = Object.values(fits.planets).reduce((sum, p) => sum + p.data.length, 0);
    expect(stored).toBeLessThan(430_000);
  });
});
