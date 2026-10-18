import type { CelestialBodyDefinition, StateSourceBinding } from "../body";
import { moonOrientationFromOrbit } from "../bodyOrientation";
import { createProvenance } from "../provenance";
import { assertUtcUnixMs, createState, type State } from "../state";
import type { CenterId } from "../body";
import { createTwoBodyTrajectory } from "../sunCentredSources";
import type { Trajectory } from "../trajectory";
import { createOrbTwoBodyAdapter } from "../twoBodyAdapter";
import { JUPITER } from "./jupiter";
import { createFittedMoonTrajectory, fittedMoonPosition, JUPITER_MOON_FIT_SPAN } from "./jupiterMoons";

const DEGREES = Math.PI / 180;
const ORIENTATION_SAMPLE_SECONDS = 1800;

/**
 * Io's mean orbital elements about Jupiter, J2000 epoch (2000-01-01 12:00 TDB), referred to the local Laplace plane, from the JPL Solar
 * System Dynamics "Planetary Satellite Mean Elements" table (https://ssd.jpl.nasa.gov/sats/elem/, ephemeris JUP365, row for Io 501,
 * read 2026-10-12). The table's own warning: these are "not intended for ephemeris computation".
 */
export const IO_MEAN_ELEMENTS = Object.freeze({
  epochTdb: "2000-01-01.5",
  semiMajorAxisKm: 421800,
  eccentricity: 0.004,
  argumentOfPeriapsisDeg: 49.1,
  meanAnomalyDeg: 330.9,
  inclinationDeg: 0.0,
  nodeDeg: 0.0,
  periodDays: 1.762732,
  /** The table's period of the apsides (years); the table's P is the anomalistic period, the time for M to advance 360 degrees. */
  apsisPeriodYears: 1.333,
  /** Pole of the Laplace plane, degrees: the table's R.A. and Dec. columns. Tilt to Jupiter's equator is 0.0. */
  laplacePoleRaDeg: 268.1,
  laplacePoleDecDeg: 64.5,
  citation: "JPL SSD Planetary Satellite Mean Elements (https://ssd.jpl.nasa.gov/sats/elem/), Io, JUP365 (R. A. Jacobson 2021), Laplace frame, read 2026-10-12",
});

/** J2000 (2000-01-01 12:00 TDB) in UTC: TDB is taken as TT, and TT - UTC was 64.184 s then. A 64 s error would move Io about 1100 km. */
export const IO_EPOCH_UTC_MS = Date.UTC(2000, 0, 1, 12, 0, 0) - 64_184;

/** Io's period about Jupiter, days: the sidereal period the mean elements give (about 1.769). */
export const IO_PERIOD_DAYS = siderealPeriodDays(IO_MEAN_ELEMENTS.periodDays, IO_MEAN_ELEMENTS.apsisPeriodYears);

/** Solves Kepler's equation for the true anomaly (radians) from the mean anomaly (radians). */
export function trueAnomalyFromMean(meanRad: number, eccentricity: number): number {
  let eccentric = meanRad + eccentricity * Math.sin(meanRad);
  for (let step = 0; step < 50; step += 1) {
    eccentric -= (eccentric - eccentricity * Math.sin(eccentric) - meanRad) / (1 - eccentricity * Math.cos(eccentric));
  }
  return 2 * Math.atan2(
    Math.sqrt(1 + eccentricity) * Math.sin(eccentric / 2),
    Math.sqrt(1 - eccentricity) * Math.cos(eccentric / 2),
  );
}

/**
 * The sidereal period, days. The table's P is anomalistic (M advances 360 degrees in it) and its periapsis moves once round per
 * `apsisPeriodYears`; the table gives no sign for that motion. The retrograde sign gives 1.7691 d, the known sidereal period (the Horizons
 * header for Io says about 1.77 d); the prograde sign gives 1.756 d, which put Io hundreds of thousands of km from Horizons. A fixed-ellipse
 * two-body orbit cannot precess, so it takes the sidereal period to keep Io's mean longitude right.
 */
export function siderealPeriodDays(anomalisticDays: number, apsisPeriodYears: number): number {
  return 1 / (1 / anomalisticDays - 1 / (apsisPeriodYears * 365.25));
}

/** The semi-major axis whose two-body period about Jupiter's GM equals `periodDays`. */
export function periodConsistentSemiMajorAxisKm(gmKm3S2: number, periodDays: number): number {
  const meanMotion = (2 * Math.PI) / (periodDays * 86_400);
  return Math.cbrt(gmKm3S2 / (meanMotion * meanMotion));
}

/** Io about Jupiter from the mean elements by unperturbed two-body motion, tidally locked (near side towards Jupiter). */
export function createIoTrajectory(): Trajectory {
  const elements = IO_MEAN_ELEMENTS;
  const gm = JUPITER.gmKm3S2!;
  const adapter = createOrbTwoBodyAdapter([JUPITER]);
  // Laplace plane = the plane with pole (ra, dec), node reference on the EQJ equator at ra + 90 deg; as an EQJ-plane orbit that is
  // inclination 90 - dec and node ra + 90, with the table's argument of periapsis measured from that reference.
  const inner = createTwoBodyTrajectory({
    body: "io",
    center: "jupiter",
    plane: "EQJ",
    epochUtcMs: IO_EPOCH_UTC_MS,
    elements: {
      semiMajorAxisKm: periodConsistentSemiMajorAxisKm(gm, siderealPeriodDays(elements.periodDays, elements.apsisPeriodYears)),
      eccentricity: elements.eccentricity,
      inclinationDeg: 90 - elements.laplacePoleDecDeg + elements.inclinationDeg,
      raanDeg: elements.laplacePoleRaDeg + 90 + elements.nodeDeg,
      argumentOfPeriapsisDeg: elements.argumentOfPeriapsisDeg,
      trueAnomalyDeg: trueAnomalyFromMean(elements.meanAnomalyDeg * DEGREES, elements.eccentricity) / DEGREES,
    },
  }, adapter);
  const positionAt = (timeUtcMs: number): Float64Array => Float64Array.from(inner.stateAt(timeUtcMs, "jupiter").positionKm);
  return Object.freeze({
    body: "io",
    stateAt(timeUtcMs: number, center: CenterId = "jupiter"): State {
      assertUtcUnixMs(timeUtcMs);
      if (center !== "jupiter") throw new RangeError(`Io is Jupiter-centred; centre "${center}" is not offered, the state resolver recentres it`);
      const position = positionAt(timeUtcMs);
      const orientation = moonOrientationFromOrbit(
        position,
        positionAt(timeUtcMs - ORIENTATION_SAMPLE_SECONDS * 1000),
        positionAt(timeUtcMs + ORIENTATION_SAMPLE_SECONDS * 1000),
      );
      return createState({ body: "io", center: "jupiter", timeUtcMs, positionKm: position, orientation });
    },
  });
}

/** The dates the mean-element model was compared over (T-078); not the dates Io is valid for now (the fits). */
export const IO_MEAN_ELEMENT_VALID_UTC = Object.freeze({ startUtcMs: Date.UTC(1969, 6, 21), endUtcMs: Date.UTC(2030, 5, 1) });
const HORIZONS_PHYSICAL = "JPL Horizons satellite physical properties for Io 501 (https://ssd.jpl.nasa.gov/api/horizons.api, header archived in tests/fixtures/io-horizons-source.txt), read 2026-10-12";

/** The largest Jupiter-centred distance from Horizons over the six compared dates (tests/jupiterIo.test.ts asserts this). */
export const IO_MAX_ERROR_KM = 9388;
export const IO_DIAMETER_KM = 3642.98;

export const IO_EPHEMERIS_LIMITATIONS: readonly string[] = Object.freeze([
  `Largest sampled difference from Horizons is about ${IO_MAX_ERROR_KM.toLocaleString("en-US")} km, ${(IO_MAX_ERROR_KM / IO_DIAMETER_KM).toFixed(1)} Io diameters; the position is an approximate demonstration, not an ephemeris. It is nearest right at the J2000 epoch (about 0.8 thousand km) and grows with distance from it.`,
  "Io moves on one unperturbed ellipse: the precession of its periapsis and the resonance with Europa and Ganymede are not modelled, only the mean longitude is kept right by using the sidereal period.",
  "The source table says its mean elements are not intended for ephemeris computation.",
  "No velocity is modelled for Io, so it has no speed readout.",
]);

export const IO_TIDAL_LOCK_LIMITATION = "Io's orientation is an approximate tidal lock keeping its near side towards Jupiter, with no libration.";

export const IO: CelestialBodyDefinition = Object.freeze({
  id: "io",
  label: "Io",
  radiusKm: 1821.49,
  gmKm3S2: 5959.9155,
  parentId: "jupiter",
  orientation: "tidal-lock",
  accuracy: Object.freeze({
    dimensions: createProvenance({
      sourceType: "observed",
      sources: [HORIZONS_PHYSICAL],
      accuracy: "Mean radius 1821.49 km and GM 5959.9155 km^3/s^2 as printed in the Horizons header; Io is drawn as a sphere.",
      notes: "Gravitational parameter in km^3/s^2.",
    }),
    position: fittedMoonPosition("Io", 0.0994),
    validUtc: JUPITER_MOON_FIT_SPAN,
    orientationLimitations: Object.freeze([IO_TIDAL_LOCK_LIMITATION]),
  }),
});

/** Io's position comes from the core curve fits (JPL Horizons, O-025 Decision 3); the mean-element model above is kept as the record T-078 measured. */
export const IO_BINDING: StateSourceBinding = Object.freeze({ body: IO.id, create: () => createFittedMoonTrajectory(IO.id) });
