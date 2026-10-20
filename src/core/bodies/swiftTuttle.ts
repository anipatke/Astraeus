import type { CelestialBodyDefinition, StateSourceBinding } from "../body";
import { createProvenance } from "../provenance";
import { createTwoBodyTrajectory, type EccentricSampling } from "../sunCentredSources";
import type { Trajectory } from "../trajectory";
import { createOrbTwoBodyAdapter } from "../twoBodyAdapter";
import { trueAnomalyFromMean } from "../keplerAnomaly";
import { SUN } from "./sun";

const AU_KM = 149_597_870.7;
const DEGREES = Math.PI / 180;

/**
 * Orbital elements of 109P/Swift-Tuttle from the JPL Small-Body Database (https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=109P&full-prec=1&phys-par=1,
 * read 2026-10-15T08:39Z, raw response archived in tests/fixtures/swift-tuttle-horizons-source.txt). Solution SB405-CPV-2 of 2001-10-09 (M.S.W. Keesey),
 * 652 observations 1737-1995, equinox J2000, ecliptic plane, osculating at the epoch.
 */
export const SWIFT_TUTTLE_ELEMENTS = Object.freeze({
  epochJdTdb: 2450000.5,
  semiMajorAxisAu: 26.0920694978266,
  eccentricity: 0.963225755046038,
  inclinationDeg: 113.453816997171,
  ascendingNodeDeg: 139.3811920815948,
  argumentOfPerihelionDeg: 152.9821676305871,
  meanAnomalyDeg: 7.631696167124212,
  perihelionJdTdb: 2448968.499784556297,
  periodDays: 48681.19346262312,
  aphelionAu: 51.22462284058444,
  citation: "JPL Small-Body Database API, 109P/Swift-Tuttle, solution SB405-CPV-2 (2001-10-09), epoch JD 2450000.5 TDB, read 2026-10-15",
});

/**
 * The epoch in UTC: 1995-10-10 00:00 TDB, taken as TT, which ran 61.184 s ahead of UTC then (32.184 s plus 29 leap seconds). A 61 s error would
 * move the comet at most about 2.6 thousand km near perihelion, far below the two-body error against Horizons.
 */
export const SWIFT_TUTTLE_EPOCH_UTC_MS = Date.UTC(1995, 9, 10) - 61_184;

/** Nucleus diameter 26 km (Lamy, Toth, Fernandez and Weaver 2004, Comets II, pp. 223-264) as printed by SBDB; Horizons prints RAD = 13 km. */
export const SWIFT_TUTTLE_RADIUS_KM = 13;

/** The dates the comet was compared with JPL Horizons (tests/fixtures/swift-tuttle-horizons.json): 1990-01-01 to 2030-01-01. */
const COMPARED_UTC = Object.freeze({ startUtcMs: Date.UTC(1990, 0, 1), endUtcMs: Date.UTC(2030, 0, 1) });

/** The largest Sun-centred distance from Horizons over the eight compared dates, km (tests/swiftTuttle.test.ts asserts this figure). */
export const SWIFT_TUTTLE_MAX_ERROR_KM = 10_686_093;

/** The largest of those differences as a fraction of the comet's distance from the Sun at that date (at the 1992 perihelion). */
export const SWIFT_TUTTLE_MAX_ERROR_FRACTION = 0.00857;

/**
 * Classification: a position within this fraction of the comet's distance from the Sun at every compared date is good enough to draw where the
 * comet is on its orbit at overview scale (an error of 1% of 45 AU is half an AU) and is called "approximate"; it is not an ephemeris and is not
 * good enough to compute a close approach. A body's own diameter is no yardstick here: the nucleus is 26 km, the error is millions of km.
 */
export const SWIFT_TUTTLE_APPROXIMATE_LIMIT_FRACTION = 0.01;

const gm = SUN.gmKm3S2!;
const semiMajorAxisKm = SWIFT_TUTTLE_ELEMENTS.semiMajorAxisAu * AU_KM;
const meanMotionRadPerS = Math.sqrt(gm / semiMajorAxisKm ** 3);

/** The two-body period about the Sun's GM from the catalogue (the model's own, 133.28 years), ms. */
export const SWIFT_TUTTLE_PERIOD_MS = ((2 * Math.PI) / meanMotionRadPerS) * 1000;

/** What a path of the comet's orbit needs to space its samples by eccentric anomaly; periapsis is where the model puts it, not SBDB's own. */
export const SWIFT_TUTTLE_SAMPLING: EccentricSampling = Object.freeze({
  eccentricity: SWIFT_TUTTLE_ELEMENTS.eccentricity,
  periodMs: SWIFT_TUTTLE_PERIOD_MS,
  periapsisUtcMs: Math.round(SWIFT_TUTTLE_EPOCH_UTC_MS - ((SWIFT_TUTTLE_ELEMENTS.meanAnomalyDeg * DEGREES) / meanMotionRadPerS) * 1000),
});

export const SWIFT_TUTTLE_LIMITATIONS: readonly string[] = Object.freeze([
  "Unperturbed two-body motion about the Sun from osculating elements at 1995-10-10: no planetary perturbations and no non-gravitational forces (comet outgassing). The elements are a fit to the 1737-1995 observations.",
  "Horizons applies perturbations from a fit to the same observations, so the two drift apart.",
  "Positions before 1990 or after 2030 were not compared with Horizons; the orbit reaches 51 AU and takes 133 years, a long span for two-body motion.",
  "The comet's size is the nucleus alone (a 26 km body); the coma and tail are not modelled. No velocity or orientation is modelled.",
]);

export function createSwiftTuttleTrajectory(): Trajectory {
  const elements = SWIFT_TUTTLE_ELEMENTS;
  return createTwoBodyTrajectory({
    body: "swift-tuttle",
    plane: "ecliptic-j2000",
    epochUtcMs: SWIFT_TUTTLE_EPOCH_UTC_MS,
    elements: {
      semiMajorAxisKm,
      eccentricity: elements.eccentricity,
      inclinationDeg: elements.inclinationDeg,
      raanDeg: elements.ascendingNodeDeg,
      argumentOfPeriapsisDeg: elements.argumentOfPerihelionDeg,
      trueAnomalyDeg: trueAnomalyFromMean(elements.meanAnomalyDeg * DEGREES, elements.eccentricity) / DEGREES,
    },
  }, createOrbTwoBodyAdapter());
}

export const SWIFT_TUTTLE: CelestialBodyDefinition = Object.freeze({
  id: "swift-tuttle",
  label: "109P/Swift-Tuttle",
  radiusKm: SWIFT_TUTTLE_RADIUS_KM,
  parentId: "sun",
  orientation: "none",
  accuracy: Object.freeze({
    dimensions: createProvenance({
      sourceType: "observed",
      sources: [
        "JPL Small-Body Database physical parameters for 109P (diameter 26 km, Lamy et al. 2004, Comets II), read 2026-10-15",
        "JPL Horizons comet header for 109P (RAD = 13 km), read 2026-10-15",
      ],
      accuracy: "Nucleus radius of 13 km, half the published effective diameter. A comet has no gravitational parameter in either source, so it cannot be a two-body centre.",
      notes: "At interplanetary scale the nucleus is far smaller than a pixel; it is drawn as a marker.",
    }),
    position: createProvenance({
      sourceType: "reconstructed",
      sources: [SWIFT_TUTTLE_ELEMENTS.citation, "Two-body motion about the Sun's gravitational parameter (catalogue)", "Compared with JPL Horizons, target DES=109P;CAP (solution JPL#32), centre 500@10, ICRF"],
      accuracy: `Position was compared with JPL Horizons at eight dates from 1990 to 2030: the largest Sun-centred difference is about ${SWIFT_TUTTLE_MAX_ERROR_KM.toLocaleString("en-US")} km (${(SWIFT_TUTTLE_MAX_ERROR_FRACTION * 100).toFixed(2)}% of its distance from the Sun at that date), so this is an approximate position for drawing the orbit and the comet's place on it, not an ephemeris. This is the largest difference at the eight dates compared, not a bound for every date.`,
      notes: "Geometric position about the Sun's centre; no light-time. Elements are osculating at the epoch.",
    }),
    validUtc: COMPARED_UTC,
    orientationLimitations: SWIFT_TUTTLE_LIMITATIONS,
  }),
});

export const SWIFT_TUTTLE_BINDING: StateSourceBinding = Object.freeze({ body: SWIFT_TUTTLE.id, create: () => createSwiftTuttleTrajectory() });
