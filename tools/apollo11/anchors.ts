import type { AstronomyAdapter } from "../../src/core/astronomyAdapter";
import config from "./config.json";
import {
  CONSTANTS,
  NUMERICS,
  getToUtcMs,
  parseLatitudeDeg,
  parseLongitudeDeg,
  parsePrintedNumber,
  printedDecimals,
} from "./conventions";
import { toEarthCentred, type CenterName, type CentreState } from "./ephemeris";
import {
  geodeticToFixedKm,
  inertialNorthAxes,
  localAxes,
  lunarFixedToEqj,
  sphericalToFixedKm,
  surfacePointVelocity,
  velocityFromFlightGeometry,
} from "./frames";
import { mulMatVec, norm, sub, type Mat3 } from "./vec";

export interface RawAnchor {
  readonly id: string;
  readonly event: string;
  readonly phase: string;
  readonly vehicle: string;
  readonly ref_body: string;
  readonly get_printed: string;
  readonly latitude_printed: string;
  readonly longitude_printed: string;
  readonly altitude_printed: string;
  readonly inertial_velocity_printed: string;
  readonly flight_path_angle_printed: string;
  readonly heading_angle_printed: string;
  readonly source: { readonly document: string; readonly table: string; readonly page: string };
}

export interface ConversionInputs {
  readonly latitudeDeg: number;
  readonly longitudeDeg: number;
  readonly altitudeKm: number;
  readonly inertialSpeedKmS: number;
  readonly flightPathAngleDeg: number;
  readonly headingDeg: number;
}

export interface InferredOverride {
  readonly field: keyof ConversionInputs;
  readonly printedValue: number;
  readonly reconstructionValue: number;
  readonly status: string;
  readonly confidence: string;
  readonly decision: string;
  readonly evidence: readonly string[];
}

export interface NormalisedAnchor {
  readonly id: string;
  readonly event: string;
  readonly vehicle: string;
  readonly phase: string;
  readonly getPrinted: string;
  readonly timeUtcMs: number;
  readonly refBody: CenterName;
  readonly surfaceFixed: boolean;
  readonly source: string;
  /** Inputs used for conversion; equals printedInputs unless an owner-approved inferred override applies. */
  readonly inputs: ConversionInputs;
  readonly printedInputs: ConversionInputs;
  readonly inferredOverride?: InferredOverride;
  readonly native: CentreState;
  readonly earthCentred: CentreState;
  readonly printRoundingUncertainty: { readonly positionKm: number; readonly velocityMs: number };
}

function parseInputs(raw: RawAnchor): ConversionInputs {
  return {
    latitudeDeg: parseLatitudeDeg(raw.latitude_printed),
    longitudeDeg: parseLongitudeDeg(raw.longitude_printed),
    altitudeKm: parsePrintedNumber(raw.altitude_printed) * CONSTANTS.nauticalMileKm,
    inertialSpeedKmS: parsePrintedNumber(raw.inertial_velocity_printed) * CONSTANTS.footKm,
    flightPathAngleDeg: parsePrintedNumber(raw.flight_path_angle_printed),
    headingDeg: parsePrintedNumber(raw.heading_angle_printed),
  };
}

function refBodyOf(raw: RawAnchor): CenterName {
  if (raw.ref_body === "Earth") return "earth";
  if (raw.ref_body === "Moon") return "moon";
  throw new RangeError(`anchor ${raw.id} has unknown reference body "${raw.ref_body}"`);
}

/** Cartesian EQJ state about the anchor's own reference body (docs/APOLLO11_SOURCES.md 4.8). */
export function nativeState(
  adapter: AstronomyAdapter,
  refBody: CenterName,
  surfaceFixed: boolean,
  inputs: ConversionInputs,
  timeUtcMs: number,
): CentreState {
  if (refBody === "earth") {
    const axes = localAxes(inputs.latitudeDeg, inputs.longitudeDeg);
    const fixed = geodeticToFixedKm(
      inputs.latitudeDeg,
      inputs.longitudeDeg,
      inputs.altitudeKm,
      CONSTANTS.earth.equatorialRadiusKm,
      CONSTANTS.earth.inverseFlattening,
    );
    const rotation = Array.from(adapter.earthFixedToEqjMatrix(timeUtcMs)) as unknown as Mat3;
    const velocity = velocityFromFlightGeometry(axes, inputs.inertialSpeedKmS, inputs.flightPathAngleDeg, inputs.headingDeg);
    return { center: "earth", r: mulMatVec(rotation, fixed), v: mulMatVec(rotation, velocity) };
  }
  const fixed = sphericalToFixedKm(
    inputs.latitudeDeg,
    inputs.longitudeDeg,
    CONSTANTS.moon.referenceRadiusKm + inputs.altitudeKm,
  );
  const position = mulMatVec(lunarFixedToEqj(timeUtcMs), fixed);
  const velocity = surfaceFixed
    ? surfacePointVelocity(timeUtcMs, fixed, NUMERICS.rotationRateHalfStepMs)
    : velocityFromFlightGeometry(
      inertialNorthAxes(position),
      inputs.inertialSpeedKmS,
      inputs.flightPathAngleDeg,
      inputs.headingDeg,
    );
  return { center: "moon", r: position, v: velocity };
}

/** Root-sum-square effect of half a unit in each printed digit (and half a printed tenth of a second). */
function printRoundingUncertainty(
  adapter: AstronomyAdapter,
  raw: RawAnchor,
  refBody: CenterName,
  surfaceFixed: boolean,
  inputs: ConversionInputs,
  timeUtcMs: number,
): { positionKm: number; velocityMs: number } {
  const base = toEarthCentred(adapter, nativeState(adapter, refBody, surfaceFixed, inputs, timeUtcMs), timeUtcMs);
  const half = (printed: string, unit: number): number => 0.5 * 10 ** -printedDecimals(printed) * unit;
  const perturbations: readonly { inputs: ConversionInputs; timeUtcMs: number }[] = [
    { inputs: { ...inputs, latitudeDeg: inputs.latitudeDeg + half(raw.latitude_printed, 1) }, timeUtcMs },
    { inputs: { ...inputs, longitudeDeg: inputs.longitudeDeg + half(raw.longitude_printed, 1) }, timeUtcMs },
    {
      inputs: { ...inputs, altitudeKm: inputs.altitudeKm + half(raw.altitude_printed, CONSTANTS.nauticalMileKm) },
      timeUtcMs,
    },
    {
      inputs: {
        ...inputs,
        inertialSpeedKmS: inputs.inertialSpeedKmS + half(raw.inertial_velocity_printed, CONSTANTS.footKm),
      },
      timeUtcMs,
    },
    { inputs: { ...inputs, flightPathAngleDeg: inputs.flightPathAngleDeg + half(raw.flight_path_angle_printed, 1) }, timeUtcMs },
    { inputs: { ...inputs, headingDeg: inputs.headingDeg + half(raw.heading_angle_printed, 1) }, timeUtcMs },
    { inputs, timeUtcMs: timeUtcMs + 50 },
  ];
  let positionSquared = 0;
  let velocitySquared = 0;
  for (const perturbation of perturbations) {
    const moved = toEarthCentred(
      adapter,
      nativeState(adapter, refBody, surfaceFixed, perturbation.inputs, perturbation.timeUtcMs),
      perturbation.timeUtcMs,
    );
    positionSquared += norm(sub(moved.r, base.r)) ** 2;
    velocitySquared += norm(sub(moved.v, base.v)) ** 2;
  }
  return { positionKm: Math.sqrt(positionSquared), velocityMs: Math.sqrt(velocitySquared) * 1000 };
}

export function normaliseAnchor(adapter: AstronomyAdapter, raw: RawAnchor): NormalisedAnchor {
  const timeUtcMs = getToUtcMs(raw.get_printed);
  const refBody = refBodyOf(raw);
  const surfaceFixed = raw.phase === "lunar_surface";
  const printedInputs = parseInputs(raw);
  const override = (config.inferredOverrides as Record<string, InferredOverride>)[raw.id];
  if (override !== undefined && printedInputs[override.field] !== override.printedValue) {
    throw new RangeError(`override for ${raw.id} expects printed ${override.field} ${override.printedValue}`);
  }
  const inputs = override === undefined ? printedInputs : { ...printedInputs, [override.field]: override.reconstructionValue };
  const native = nativeState(adapter, refBody, surfaceFixed, inputs, timeUtcMs);
  return {
    id: raw.id,
    event: raw.event,
    vehicle: raw.vehicle,
    phase: raw.phase,
    getPrinted: raw.get_printed,
    timeUtcMs,
    refBody,
    surfaceFixed,
    source: `${raw.source.document}, ${raw.source.table}, p. ${raw.source.page}`,
    inputs,
    printedInputs,
    ...(override === undefined ? {} : { inferredOverride: override }),
    native,
    earthCentred: toEarthCentred(adapter, native, timeUtcMs),
    printRoundingUncertainty: printRoundingUncertainty(adapter, raw, refBody, surfaceFixed, inputs, timeUtcMs),
  };
}

/** Lunar lift-off: the touchdown site, Moon-fixed, at the lift-off event time (same printed precision). */
export function liftoffAnchor(
  adapter: AstronomyAdapter,
  touchdown: NormalisedAnchor,
  id: string,
  timeUtcMs: number,
  event: string,
  getPrinted: string,
): NormalisedAnchor {
  const native = nativeState(adapter, "moon", true, touchdown.inputs, timeUtcMs);
  return {
    ...touchdown,
    id,
    event,
    getPrinted,
    timeUtcMs,
    source: `Derived: ${touchdown.id} site held Moon-fixed; time from events.json lift-off`,
    native,
    earthCentred: toEarthCentred(adapter, native, timeUtcMs),
  };
}
