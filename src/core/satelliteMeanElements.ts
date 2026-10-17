import type { CenterId } from "./body";
import { trueAnomalyFromMean } from "./bodies/io";
import { assertUtcUnixMs } from "./state";
import { createTwoBodyTrajectory } from "./sunCentredSources";
import type { Trajectory } from "./trajectory";
import { createOrbTwoBodyAdapter } from "./twoBodyAdapter";

const DEGREES = Math.PI / 180;
const DAY_MS = 86_400_000;
const UNIX_EPOCH_JD = 2440587.5;
const DAYS_PER_YEAR = 365.25;

/** The shape of a `data/orbits/*.json` record this module reads (only the fields it uses; the files carry more, such as citations and rotation). */
export interface MeanElementRecord {
  readonly id: string;
  readonly parent: string;
  readonly epoch: { readonly jdTdb: number; readonly ttMinusUtcSeconds: number };
  readonly plane:
    | { readonly frame: "ecliptic-j2000" }
    | { readonly frame: string; readonly poleRaDeg: number; readonly poleDecDeg: number };
  readonly elements: {
    readonly semiMajorAxisKm: number;
    readonly eccentricity: number;
    readonly argumentOfPeriapsisDeg: number;
    readonly meanAnomalyDeg: number;
    readonly inclinationDeg: number;
    readonly nodeDeg: number;
    readonly periodDays: number;
    readonly apsisPeriodYears: number | null;
  };
  /** How this record's table values become a fixed ellipse: chosen by measurement against Horizons and kept with the data. */
  readonly model: MeanElementOptions;
  readonly rotation?: { readonly primeMeridianDeg: { readonly perDay: number } };
  readonly parentBody: { readonly gmKm3S2: number };
  readonly bodyPhysical: { readonly gmKm3S2: number };
}

/**
 * How the table's period P becomes the rate of the mean longitude of a fixed ellipse.
 * `table`: P is already the sidereal period (the Saturn and Neptune rows; Mimas 0.942422 d is the known sidereal period).
 * `apsis-corrected`: P is the period of M alone and the periapsis also moves once round per `apsisPeriodYears`; the mean longitude
 * then turns once per 1 / (1/P - 1/Papsis), the rule Io's definition uses (the Jovian rows).
 */
export type PeriodRule = "table" | "apsis-corrected" | "iau-rate";

export function siderealPeriodDaysFor(record: MeanElementRecord, rule: PeriodRule): number {
  const { periodDays, apsisPeriodYears } = record.elements;
  if (rule === "table") return periodDays;
  if (rule === "iau-rate") {
    const rate = record.rotation?.primeMeridianDeg.perDay;
    if (rate === undefined || rate === 0) throw new RangeError(`${record.id}: no IAU rotation rate`);
    return 360 / Math.abs(rate);
  }
  if (apsisPeriodYears === null) throw new RangeError(`${record.id}: the table gives no period of the apsides`);
  return 1 / (1 / periodDays - 1 / (apsisPeriodYears * DAYS_PER_YEAR));
}

/** The instant the elements hold, UTC milliseconds: JD(TDB) taken as TT, less TT minus UTC. */
export function epochUtcMsOf(record: MeanElementRecord): number {
  return Math.round((record.epoch.jdTdb - UNIX_EPOCH_JD) * DAY_MS - record.epoch.ttMinusUtcSeconds * 1000);
}

type Matrix = readonly [readonly number[], readonly number[], readonly number[]];

const rotZ = (angle: number): Matrix => [[Math.cos(angle), -Math.sin(angle), 0], [Math.sin(angle), Math.cos(angle), 0], [0, 0, 1]];
const rotX = (angle: number): Matrix => [[1, 0, 0], [0, Math.cos(angle), -Math.sin(angle)], [0, Math.sin(angle), Math.cos(angle)]];
const multiply = (a: Matrix, b: Matrix): Matrix => a.map((row) => [0, 1, 2].map((column) => row[0] * b[0][column] + row[1] * b[1][column] + row[2] * b[2][column])) as unknown as Matrix;

/**
 * Elements given in a plane whose pole is (RA, Dec) in EQJ, with the node reference on the EQJ equator at RA + 90 degrees, re-expressed as
 * inclination, node and argument of periapsis in EQJ (the Io construction, here with a general inclination and node). Angles in degrees.
 */
export function elementsInPoleFrame(
  pole: { readonly raDeg: number; readonly decDeg: number },
  local: { readonly inclinationDeg: number; readonly nodeDeg: number; readonly argumentOfPeriapsisDeg: number },
): { inclinationDeg: number; raanDeg: number; argumentOfPeriapsisDeg: number } {
  const frame = multiply(rotZ((pole.raDeg + 90) * DEGREES), rotX((90 - pole.decDeg) * DEGREES));
  const orbit = multiply(multiply(rotZ(local.nodeDeg * DEGREES), rotX(local.inclinationDeg * DEGREES)), rotZ(local.argumentOfPeriapsisDeg * DEGREES));
  const m = multiply(frame, orbit);
  const inclination = Math.acos(Math.max(-1, Math.min(1, m[2][2])));
  const degenerate = Math.sin(inclination) < 1e-12;
  const raan = degenerate ? 0 : Math.atan2(m[0][2], -m[1][2]);
  const argument = degenerate ? Math.atan2(m[1][0], m[0][0]) : Math.atan2(m[2][0], m[2][1]);
  return { inclinationDeg: inclination / DEGREES, raanDeg: ((raan / DEGREES) + 360) % 360, argumentOfPeriapsisDeg: ((argument / DEGREES) + 360) % 360 };
}

/** The semi-major axis whose two-body period about `gmKm3S2` equals `periodDays`. */
function semiMajorAxisForPeriod(gmKm3S2: number, periodDays: number): number {
  const meanMotion = (2 * Math.PI) / (periodDays * 86_400);
  return Math.cbrt(gmKm3S2 / (meanMotion * meanMotion));
}

export interface MeanElementOptions {
  readonly periodRule: PeriodRule;
  /** `period` (default): the semi-major axis whose two-body period equals the sidereal period; `table`: the table's own value. */
  readonly semiMajorAxis?: "period" | "table";
  /** Added to the tabulated mean anomaly, degrees; a measurement aid only (see docs/MOON_ORBITS.md), never part of a shipped source. */
  readonly meanAnomalyShiftDeg?: number;
}

/**
 * A moon (or any body) about its parent from a saved mean-element record, by the existing unperturbed two-body provider: no new propagator.
 * The gravitational parameter is parent plus body (the relative motion of the pair). The state is centred on the record's parent.
 */
export function createMeanElementTrajectory(record: MeanElementRecord, options: MeanElementOptions = record.model): Trajectory {
  const { elements } = record;
  const gm = record.parentBody.gmKm3S2 + record.bodyPhysical.gmKm3S2;
  const adapter = createOrbTwoBodyAdapter([{ id: record.parent, gmKm3S2: gm }]);
  const period = siderealPeriodDaysFor(record, options.periodRule);
  const semiMajorAxisKm = options.semiMajorAxis === "table" ? elements.semiMajorAxisKm : semiMajorAxisForPeriod(gm, period);
  const angles = record.plane.frame === "ecliptic-j2000"
    ? { inclinationDeg: elements.inclinationDeg, raanDeg: elements.nodeDeg, argumentOfPeriapsisDeg: elements.argumentOfPeriapsisDeg }
    : elementsInPoleFrame(
      { raDeg: (record.plane as { poleRaDeg: number }).poleRaDeg, decDeg: (record.plane as { poleDecDeg: number }).poleDecDeg },
      { inclinationDeg: elements.inclinationDeg, nodeDeg: elements.nodeDeg, argumentOfPeriapsisDeg: elements.argumentOfPeriapsisDeg },
    );
  const inner = createTwoBodyTrajectory({
    body: record.id,
    center: record.parent,
    plane: record.plane.frame === "ecliptic-j2000" ? "ecliptic-j2000" : "EQJ",
    epochUtcMs: epochUtcMsOf(record),
    elements: {
      semiMajorAxisKm,
      eccentricity: elements.eccentricity,
      ...angles,
      trueAnomalyDeg: trueAnomalyFromMean((elements.meanAnomalyDeg + (options.meanAnomalyShiftDeg ?? 0)) * DEGREES, elements.eccentricity) / DEGREES,
    },
  }, adapter);
  return Object.freeze({
    body: record.id,
    stateAt(timeUtcMs: number, center: CenterId = record.parent) {
      assertUtcUnixMs(timeUtcMs);
      return inner.stateAt(timeUtcMs, center);
    },
  });
}
