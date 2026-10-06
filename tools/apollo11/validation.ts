import type { AstronomyAdapter } from "../../src/core/astronomyAdapter";
import { moonOrientationFromOrbit, rotateVectorByQuaternion } from "../../src/core/bodyOrientation";
import { SampledTrajectory } from "../../src/core/sampledTrajectory";
import type { NormalisedAnchor } from "./anchors";
import config from "./config.json";
import { CONSTANTS, NUMERICS } from "./conventions";
import { moonFromEarth } from "./ephemeris";
import { fixedToGeodetic, localAxes, lunarFixedToEqj, sphericalToFixedKm } from "./frames";
import { apsides, propagateKepler } from "./kepler";
import { roundTo } from "./format";
import type { Segment } from "./segments";
import { dot, mulMatVec, norm, sub, toVec3, type Mat3, type Vec3 } from "./vec";

const DEG = 180 / Math.PI;
const NMI = CONSTANTS.nauticalMileKm;

export interface AnchorResidual {
  readonly anchorId: string;
  readonly vehicle: string;
  readonly positionKm: number;
  readonly velocityMs: number;
}

const SPEED_SCAN_STEP_MS = 1000;
const SPEED_SCAN_EXCESS_TOLERANCE_KM = 0.001;
const BURN_PEAK_SCAN_STEP_MS = 100;

export function anchorResiduals(
  vehicle: string,
  trajectory: SampledTrajectory,
  anchorIds: readonly string[],
  anchors: ReadonlyMap<string, NormalisedAnchor>,
): AnchorResidual[] {
  return anchorIds.map((anchorId) => {
    const anchor = anchors.get(anchorId);
    if (anchor === undefined) throw new RangeError(`anchor ${anchorId} missing`);
    const state = trajectory.stateAt(anchor.timeUtcMs);
    return {
      anchorId,
      vehicle,
      positionKm: roundTo(norm(sub(toVec3(state.positionKm), anchor.earthCentred.r)), 6),
      velocityMs: roundTo(norm(sub(toVec3(state.velocityKmS ?? [0, 0, 0]), anchor.earthCentred.v)) * 1000, 6),
    };
  });
}

function runtimeSpeed(
  trajectory: SampledTrajectory,
  timeUtcMs: number,
  adapter?: AstronomyAdapter,
  referenceBody?: "earth" | "moon",
): number {
  const state = trajectory.stateAt(timeUtcMs);
  let velocity = toVec3(state.velocityKmS ?? [0, 0, 0]);
  if (referenceBody === "moon" && adapter !== undefined) velocity = sub(velocity, moonFromEarth(adapter, timeUtcMs).v);
  return norm(velocity);
}

/** Scan runtime one-second moves against the maximum local speed at each interval's endpoints and midpoint. */
export function oneSecondSpeedScan(trajectory: SampledTrajectory) {
  let checkedSeconds = 0;
  let violationCount = 0;
  let maxExcessKm = -Infinity;
  let worst: { startUtcMs: number; moveKm: number; localSpeedKmS: number; excessKm: number } | undefined;
  const firstViolations: { startUtcMs: number; moveKm: number; localSpeedKmS: number; excessKm: number }[] = [];
  for (let startUtcMs = trajectory.bounds.startUtcMs; startUtcMs + SPEED_SCAN_STEP_MS <= trajectory.bounds.endUtcMs; startUtcMs += SPEED_SCAN_STEP_MS) {
    const startState = trajectory.stateAt(startUtcMs);
    const midpointState = trajectory.stateAt(startUtcMs + SPEED_SCAN_STEP_MS / 2);
    const endState = trajectory.stateAt(startUtcMs + SPEED_SCAN_STEP_MS);
    const start = toVec3(startState.positionKm);
    const end = toVec3(endState.positionKm);
    const moveKm = norm(sub(end, start));
    const localSpeedKmS = Math.max(
      norm(toVec3(startState.velocityKmS ?? [0, 0, 0])),
      norm(toVec3(midpointState.velocityKmS ?? [0, 0, 0])),
      norm(toVec3(endState.velocityKmS ?? [0, 0, 0])),
    );
    const excessKm = moveKm - localSpeedKmS;
    checkedSeconds += 1;
    if (excessKm > maxExcessKm) {
      maxExcessKm = excessKm;
      worst = { startUtcMs, moveKm, localSpeedKmS, excessKm };
    }
    if (excessKm > SPEED_SCAN_EXCESS_TOLERANCE_KM) {
      violationCount += 1;
      if (firstViolations.length < 10) firstViolations.push({ startUtcMs, moveKm, localSpeedKmS, excessKm });
    }
  }
  return {
    stepS: SPEED_SCAN_STEP_MS / 1000,
    localSpeedAt: "maximum at interval start, midpoint and end",
    excessToleranceKm: SPEED_SCAN_EXCESS_TOLERANCE_KM,
    checkedSeconds,
    violationCount,
    firstViolations: firstViolations.map((violation) => ({
      startUtcMs: violation.startUtcMs,
      moveKm: roundTo(violation.moveKm, 6),
      localSpeedKmS: roundTo(violation.localSpeedKmS, 6),
      excessKm: roundTo(violation.excessKm, 6),
    })),
    worst: worst === undefined ? undefined : {
      startUtcMs: worst.startUtcMs,
      moveKm: roundTo(worst.moveKm, 6),
      localSpeedKmS: roundTo(worst.localSpeedKmS, 6),
      excessKm: roundTo(worst.excessKm, 6),
    },
    maxExcessKm: roundTo(Number.isFinite(maxExcessKm) ? maxExcessKm : 0, 6),
  };
}

/** Peak speed of the runtime SampledTrajectory during a segment, probed at 100 ms. */
export function burnPeakSpeedKmS(adapter: AstronomyAdapter, trajectory: SampledTrajectory, segment: Segment): number {
  let maximum = 0;
  for (let timeUtcMs = segment.startUtcMs; timeUtcMs < segment.endUtcMs; timeUtcMs += BURN_PEAK_SCAN_STEP_MS) {
    maximum = Math.max(maximum, runtimeSpeed(trajectory, timeUtcMs, adapter, segment.from?.refBody));
  }
  return roundTo(Math.max(maximum, runtimeSpeed(trajectory, segment.endUtcMs, adapter, segment.from?.refBody)), 6);
}

/** Printed-style parameters of an Earth-centred inertial state, for comparing predictions with the table. */
function printedParameters(adapter: AstronomyAdapter, r: Vec3, v: Vec3, timeUtcMs: number) {
  const rotation = Array.from(adapter.earthFixedToEqjMatrix(timeUtcMs)) as unknown as Mat3;
  const transposed: Mat3 = [rotation[0], rotation[3], rotation[6], rotation[1], rotation[4], rotation[7], rotation[2], rotation[5], rotation[8]];
  const fixed = mulMatVec(transposed, r);
  const velocity = mulMatVec(transposed, v);
  const geodetic = fixedToGeodetic(fixed, CONSTANTS.earth.equatorialRadiusKm, CONSTANTS.earth.inverseFlattening);
  const axes = localAxes(geodetic.latitudeDeg, geodetic.longitudeDeg);
  const speed = norm(velocity);
  return {
    latitudeDeg: geodetic.latitudeDeg,
    longitudeDeg: geodetic.longitudeDeg,
    altitudeNmi: geodetic.heightKm / NMI,
    speedFtS: speed / CONSTANTS.footKm,
    flightPathAngleDeg: Math.asin(dot(velocity, axes.up) / speed) * DEG,
    headingDeg: Math.atan2(dot(velocity, axes.east), dot(velocity, axes.north)) * DEG,
  };
}

/** Earth-reference anchors compared with the state propagated from the reference anchor (two-body). */
export function consistencyTable(adapter: AstronomyAdapter, anchors: ReadonlyMap<string, NormalisedAnchor>) {
  const reference = anchors.get(config.suspectAnchors.reference);
  if (reference === undefined) throw new RangeError("consistency reference anchor missing");
  const rows = [];
  for (const anchor of anchors.values()) {
    if (anchor.refBody !== "earth" || anchor.timeUtcMs <= reference.timeUtcMs || anchor.timeUtcMs > anchors.get("A-09")!.timeUtcMs) continue;
    const propagated = propagateKepler(
      CONSTANTS.earth.muKm3S2,
      { r: reference.earthCentred.r, v: reference.earthCentred.v },
      (anchor.timeUtcMs - reference.timeUtcMs) / 1000,
    );
    const predicted = printedParameters(adapter, propagated.r, propagated.v, anchor.timeUtcMs);
    const printed = {
      latitudeDeg: anchor.printedInputs.latitudeDeg,
      longitudeDeg: anchor.printedInputs.longitudeDeg,
      altitudeNmi: anchor.printedInputs.altitudeKm / NMI,
      speedFtS: anchor.printedInputs.inertialSpeedKmS / CONSTANTS.footKm,
      flightPathAngleDeg: anchor.printedInputs.flightPathAngleDeg,
      headingDeg: anchor.printedInputs.headingDeg,
    };
    rows.push({
      anchorId: anchor.id,
      positionDifferenceKm: roundTo(norm(sub(propagated.r, anchor.earthCentred.r)), 1),
      printed: Object.fromEntries(Object.entries(printed).map(([k, x]) => [k, roundTo(x, 2)])),
      predicted: Object.fromEntries(Object.entries(predicted).map(([k, x]) => [k, roundTo(x, 2)])),
      suspect: config.suspectAnchors.ids.includes(anchor.id),
      overridden: anchor.inferredOverride !== undefined,
    });
  }
  return { reference: reference.id, rows };
}

export function orbitCrossChecks(anchors: ReadonlyMap<string, NormalisedAnchor>) {
  return config.publishedOrbits.map((published) => {
    const anchor = anchors.get(published.anchor);
    if (anchor === undefined) throw new RangeError(`anchor ${published.anchor} missing`);
    const orbit = apsides(CONSTANTS.moon.muKm3S2, { r: anchor.native.r, v: anchor.native.v });
    const apolune = (orbit.apoapsisRadiusKm - CONSTANTS.moon.referenceRadiusKm) / NMI;
    const perilune = (orbit.periapsisRadiusKm - CONSTANTS.moon.referenceRadiusKm) / NMI;
    return {
      anchorId: published.anchor,
      source: published.source,
      publishedApoluneNmi: published.apolune,
      computedApoluneNmi: roundTo(apolune, 1),
      publishedPeriluneNmi: published.perilune,
      computedPeriluneNmi: roundTo(perilune, 1),
    };
  });
}

const angleBetweenDeg = (a: Vec3, b: Vec3): number => Math.acos(dot(a, b) / (norm(a) * norm(b))) * DEG;

export interface QualitativeInput {
  readonly adapter: AstronomyAdapter;
  readonly anchors: ReadonlyMap<string, NormalisedAnchor>;
  readonly columbia: SampledTrajectory;
  readonly eagle: SampledTrajectory;
  readonly columbiaSegments: readonly Segment[];
}

/** Brief section 20 qualitative checks, computed from the generated trajectories. */
export function qualitativeChecks(input: QualitativeInput) {
  const { adapter, anchors, columbia, eagle } = input;
  const get = (id: string): NormalisedAnchor => {
    const anchor = anchors.get(id);
    if (anchor === undefined) throw new RangeError(`anchor ${id} missing`);
    return anchor;
  };
  const tli = get("A-03");
  const loi = get("A-11");
  const moonAtLoi = moonFromEarth(adapter, loi.timeUtcMs).r;
  const departureAngle = angleBetweenDeg(tli.earthCentred.r, moonAtLoi);

  const translunar = input.columbiaSegments.find((segment) => segment.id === "A-10>A-11");
  const arrival = translunar === undefined ? undefined : {
    sphereOfInfluenceUtcMs: translunar.sphereOfInfluenceUtcMs,
    propagatedSelenocentricRadiusKm: roundTo(
      norm(sub(toVec3(columbia.stateAt(loi.timeUtcMs - NUMERICS.joinGapMs).positionKm), moonFromEarth(adapter, loi.timeUtcMs - NUMERICS.joinGapMs).r)),
      1,
    ),
    anchorSelenocentricRadiusKm: roundTo(norm(loi.native.r), 1),
  };

  const lunarWindow = { start: get(config.intervals.lunarOrbitWindow.fromAnchor).timeUtcMs, end: get(config.intervals.lunarOrbitWindow.toAnchor).timeUtcMs };
  const staleMoon = moonFromEarth(adapter, lunarWindow.start).r;
  const orbitRange = (trajectory: SampledTrajectory, from: number, to: number) => {
    let min = Infinity;
    let max = -Infinity;
    let stale = Infinity;
    let count = 0;
    const step = 300_000;
    for (let t = Math.max(from, trajectory.bounds.startUtcMs); t <= Math.min(to, trajectory.bounds.endUtcMs); t += step) {
      const position = toVec3(trajectory.stateAt(t).positionKm);
      const distance = norm(sub(position, moonFromEarth(adapter, t).r));
      min = Math.min(min, distance);
      max = Math.max(max, distance);
      stale = Math.min(stale, norm(sub(position, staleMoon)));
      count += 1;
    }
    return {
      probes: count,
      minAltitudeKm: roundTo(min - CONSTANTS.moon.referenceRadiusKm, 1),
      maxAltitudeKm: roundTo(max - CONSTANTS.moon.referenceRadiusKm, 1),
      minDistanceToMoonPositionAtOrbitInsertionKm: roundTo(stale, 1),
    };
  };
  const lunarOrbit = {
    columbia: orbitRange(columbia, lunarWindow.start, lunarWindow.end),
    eagle: orbitRange(eagle, eagle.bounds.startUtcMs, eagle.bounds.endUtcMs),
  };

  const entry = input.columbiaSegments[input.columbiaSegments.length - 1];
  const earthAltitudeKm = (timeUtcMs: number): number => {
    const state = entry.generate(timeUtcMs);
    const rotation = Array.from(adapter.earthFixedToEqjMatrix(timeUtcMs)) as unknown as Mat3;
    const fixed = mulMatVec([rotation[0], rotation[3], rotation[6], rotation[1], rotation[4], rotation[7], rotation[2], rotation[5], rotation[8]], state.r);
    return fixedToGeodetic(fixed, CONSTANTS.earth.equatorialRadiusKm, CONSTANTS.earth.inverseFlattening).heightKm;
  };
  let crossing = entry.startUtcMs;
  for (let t = entry.startUtcMs; t <= entry.endUtcMs + 120_000; t += 1000) {
    if (earthAltitudeKm(t) <= CONSTANTS.entryInterfaceAltitudeKm) {
      crossing = t;
      break;
    }
    crossing = t;
  }
  const entryInterface = {
    anchorTimeUtcMs: entry.endUtcMs,
    propagatedAltitudeAtAnchorTimeKm: roundTo(earthAltitudeKm(entry.endUtcMs), 2),
    propagatedCrossingOfEntryAltitudeUtcMs: crossing,
    crossingMinusAnchorSeconds: (crossing - entry.endUtcMs) / 1000,
    entryAltitudeKm: CONSTANTS.entryInterfaceAltitudeKm,
  };

  return { departure: { angleBetweenTliPositionAndMoonAtLoiDeg: roundTo(departureAngle, 2) }, arrival, lunarOrbit, entryInterface };
}

/** Offset between the IAU-placed landing site and the same selenographic point under the runtime Moon orientation. */
export function landingSiteOffset(adapter: AstronomyAdapter, touchdown: NormalisedAnchor, timeUtcMs: number) {
  const fixed = sphericalToFixedKm(touchdown.inputs.latitudeDeg, touchdown.inputs.longitudeDeg, CONSTANTS.moon.referenceRadiusKm);
  const iau = mulMatVec(lunarFixedToEqj(timeUtcMs), fixed);
  const half = 1_800_000;
  const orientation = moonOrientationFromOrbit(
    adapter.moonPositionKm(timeUtcMs),
    adapter.moonPositionKm(timeUtcMs - half),
    adapter.moonPositionKm(timeUtcMs + half),
  );
  const runtime = toVec3(rotateVectorByQuaternion(orientation, fixed));
  return {
    timeUtcMs,
    offsetKm: roundTo(norm(sub(iau, runtime)), 2),
    offsetDeg: roundTo(angleBetweenDeg(iau, runtime), 3),
  };
}

/** Lowest altitude above the reference sphere along the two-anchor surface arcs, probed every second. */
export function surfaceClearance(segments: readonly Segment[]) {
  return segments
    .filter((segment) => segment.method === "powered-descent-two-anchor" || segment.method === "powered-ascent-two-anchor")
    .map((segment) => {
      let minimum = Infinity;
      for (let t = segment.startUtcMs; t <= segment.endUtcMs; t += 1000) {
        minimum = Math.min(minimum, norm(segment.generate(t).r) - CONSTANTS.moon.referenceRadiusKm);
      }
      return { segmentId: segment.id, minAltitudeKm: roundTo(minimum, 3) };
    });
}
