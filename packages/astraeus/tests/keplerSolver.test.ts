import { describe, expect, it } from "vitest";
import { eccentricAnomalyFromMean as eccentricAnomalyShared, KeplerEccentricityError, trueAnomalyFromMean } from "../src/core/keplerAnomaly";
import { fillKeplerRangeKm, type KeplerElements } from "../src/core/keplerElements";
import { eccentricAnomalyRad, trueAnomalyFromMeanRad } from "../src/core/listedOrbitGroup";
import { eccentricAnomalyFromMean as eccentricAnomalySunCentred } from "../src/core/sunCentredSources";

// T-341: every CPU Kepler solve agrees with an independent bisection of E - e sin E = M, for every bound eccentricity, including
// near-parabolic comets. The bisection has no starting guess to overshoot and no derivative to vanish, so it is the reference.

const TWO_PI = 2 * Math.PI;
const ECCENTRICITIES = [0, 0.5, 0.9, 0.99, 0.995, 0.999, 0.9999];
const MEANS = [
  0, 1e-9, -1e-9, 1e-6, -1e-6, 1e-4, 1e-3, 0.0017782794, -0.0017782794, 0.002, 0.0031622777, 0.004, 0.01, 0.05, 0.1, 0.5, 1, 2, 3, Math.PI - 1e-6, Math.PI, -Math.PI + 1e-6, -Math.PI, -2, -0.3,
  TWO_PI + 0.001, -TWO_PI - 0.001, 7 * TWO_PI + 1e-5, 12.5, -33.3, 1234.5678, -98_765.4321,
];

/** E in [-pi, pi] by bisection: E - e sin E rises with E, so the root of an odd function sits in [0, pi] for |M| <= pi. */
function bisectEccentric(meanWrapped: number, e: number): number {
  const sign = meanWrapped < 0 ? -1 : 1;
  const m = Math.abs(meanWrapped);
  let low = 0;
  let high = Math.PI;
  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    if (mid - e * Math.sin(mid) < m) low = mid;
    else high = mid;
  }
  return (sign * (low + high)) / 2;
}

const wrap = (m: number): number => m - TWO_PI * Math.round(m / TWO_PI);
const trueFromEccentric = (E: number, e: number): number => 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
const eccentricFromTrue = (nu: number, e: number): number => 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(nu / 2), Math.sqrt(1 + e) * Math.cos(nu / 2));
const angleDiff = (a: number, b: number): number => Math.abs(wrap(a - b));

const E_TOLERANCE = 1e-9;
/** Reducing a large mean anomaly by whole turns costs about 2e-16 per turn of the 2 pi constant, so the allowance grows with |M|. */
const residualTolerance = (m: number): number => 1e-12 + 2e-15 * Math.abs(m);

/** Each entry point returns the wrapped eccentric anomaly for a mean anomaly and e. */
const ENTRY_POINTS: Record<string, (m: number, e: number) => number> = {
  "keplerAnomaly.eccentricAnomalyFromMean": (m, e) => wrap(eccentricAnomalyShared(m, e)),
  "keplerAnomaly.trueAnomalyFromMean": (m, e) => eccentricFromTrue(trueAnomalyFromMean(m, e), e),
  "listedOrbitGroup.eccentricAnomalyRad": (m, e) => eccentricAnomalyRad(m, e),
  "listedOrbitGroup.trueAnomalyFromMeanRad": (m, e) => eccentricFromTrue(trueAnomalyFromMeanRad(m, e), e),
  "sunCentredSources.eccentricAnomalyFromMean": (m, e) => wrap(eccentricAnomalySunCentred(m, e)),
  "keplerElements.fillKeplerRangeKm": (m, e) => {
    const elements: KeplerElements = {
      count: 1,
      epochUtcMs: 0,
      semiMajorAxisKm: Float64Array.of(1),
      eccentricity: Float64Array.of(e),
      periapsisDirection: Float64Array.of(1, 0, 0),
      quadratureDirection: Float64Array.of(0, 1, 0),
      meanAnomalyRad: Float64Array.of(wrap(m)),
      meanMotionRadS: Float64Array.of(0),
    };
    const out = new Float64Array(3);
    fillKeplerRangeKm(elements, 0, out, 0, 1);
    return Math.atan2(out[1] / Math.sqrt(1 - e * e), out[0] + e);
  },
};

describe("Kepler solvers against bisection", () => {
  for (const [name, solve] of Object.entries(ENTRY_POINTS)) {
    it(`${name} matches the bisection root and residual for every e and mean anomaly`, () => {
      const failures: string[] = [];
      for (const e of ECCENTRICITIES) {
        for (const m of MEANS) {
          const wrapped = wrap(m);
          const reference = bisectEccentric(wrapped, e);
          const E = solve(m, e);
          const residual = Math.abs(wrap(E - e * Math.sin(E) - wrapped));
          const error = angleDiff(E, reference);
          if (!(error <= E_TOLERANCE + residualTolerance(m)) || !(residual <= residualTolerance(m))) failures.push(`e=${e} M=${m}: E=${E} want ${reference} (error ${error}, residual ${residual})`);
        }
      }
      expect(failures).toEqual([]);
    });
  }

  it("the true anomaly of a near-parabolic comet near periapsis is where the bisection puts it", () => {
    const e = 0.999;
    const m = 1e-5;
    expect(trueAnomalyFromMean(m, e)).toBeCloseTo(trueFromEccentric(bisectEccentric(m, e), e), 9);
  });

  it("refuses eccentricities outside [0, 1) with a named error", () => {
    for (const e of [1, 1.5, -0.1, Number.NaN]) {
      expect(() => eccentricAnomalyShared(1, e)).toThrow(KeplerEccentricityError);
      expect(() => eccentricAnomalyShared(1, e)).toThrow(/eccentricity/);
      expect(() => trueAnomalyFromMean(1, e)).toThrow(/eccentricity/);
      expect(() => eccentricAnomalyRad(1, e)).toThrow(/eccentricity/);
      expect(() => trueAnomalyFromMeanRad(1, e)).toThrow(/eccentricity/);
      expect(() => eccentricAnomalySunCentred(1, e)).toThrow(/eccentricity/);
    }
  });
});
