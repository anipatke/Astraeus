import type { AstronomyAdapter } from "../../src/core/astronomyAdapter";
import type { NormalisedAnchor } from "./anchors";
import { solvePhysicalBurn } from "./burn";
import { CONSTANTS, NUMERICS } from "./conventions";
import { integrateSpan, tableAt, type EarthState, type StateTable } from "./dynamics";
import { moonFromEarth, type CenterName, type CentreState } from "./ephemeris";
import { lunarFixedToEqj, lunarRotationRate } from "./frames";
import { hermiteAt } from "./hermite";
import { add, dot, mulMatVec, norm, scale, sub, toVec3, transpose, type Mat3, type Vec3 } from "./vec";

export type SegmentMethod =
  | "coast-nbody-smoothed"
  | "powered-burn-physical"
  | "parking-orbit-backward"
  | "powered-descent-two-anchor"
  | "surface-hold"
  | "powered-ascent-two-anchor";

/** A segment's state as a function of time, about whichever centre is in force at that instant. */
export type SegmentGenerator = (timeUtcMs: number) => CentreState;

/** How far a smoothed coast departs from the unsmoothed propagation from its start anchor. */
export interface Smoothing {
  /** Propagation from the start anchor alone; its miss at the end anchor is the published raw miss. */
  readonly unsmoothed: SegmentGenerator;
  readonly centre: CenterName;
  readonly maxCorrectionKm: number;
  readonly maxCorrectionMs: number;
}

export interface Segment {
  readonly id: string;
  /** Anchor the segment starts from; null for the parking orbit, which runs backward from its end anchor. */
  readonly from: NormalisedAnchor | null;
  /** Anchor whose converted state the segment reaches (or, for the parking orbit, starts from). */
  readonly to: NormalisedAnchor;
  readonly startUtcMs: number;
  readonly endUtcMs: number;
  readonly method: SegmentMethod;
  readonly generate: SegmentGenerator;
  readonly smoothing?: Smoothing;
  /** Present when this segment ends at a modelled state that the next segment may start from. */
  readonly endState?: EarthState;
  /** Burn fit and its residual against the printed cutoff anchor. */
  readonly burn?: {
    readonly constantAccelerationKmS2: Vec3;
    readonly cutoffPositionResidualKm: number;
    readonly cutoffVelocityResidualMs: number;
  };
  /** First instant within the Moon's sphere of influence (entering) or outside it (leaving), when the coast crosses it. */
  readonly sphereOfInfluenceUtcMs?: number;
  /** Direction the generator integrates from its start anchor. */
  readonly reverse: boolean;
}

function endpoints(from: NormalisedAnchor, to: NormalisedAnchor): Pick<Segment, "id" | "from" | "to" | "startUtcMs" | "endUtcMs"> {
  return { id: `${from.id}>${to.id}`, from, to, startUtcMs: from.timeUtcMs, endUtcMs: to.timeUtcMs };
}

const asEarth = (state: EarthState): CentreState => ({ center: "earth", r: state.r, v: state.v });

/** Integrated span around an anchor, padded so callers may probe a little past either end. */
function spanThrough(adapter: AstronomyAdapter, start: EarthState, epochUtcMs: number, startUtcMs: number, endUtcMs: number): StateTable {
  const marginMs = NUMERICS.coastMarginS * 1000;
  return integrateSpan(adapter, start, epochUtcMs, startUtcMs - marginMs, endUtcMs + marginMs);
}

/** Radius interpolated linearly and direction along the great circle, so blending two orbits keeps their altitude. */
function blendAbout(a: Vec3, b: Vec3, w: number): Vec3 {
  const ra = norm(a);
  const rb = norm(b);
  const cosine = Math.min(1, Math.max(-1, dot(a, b) / (ra * rb)));
  const angle = Math.acos(cosine);
  const radius = ra + (rb - ra) * w;
  if (angle < 1e-9) return scale(add(scale(a, 1 - w), scale(b, w)), radius / norm(add(scale(a, 1 - w), scale(b, w))));
  const ka = Math.sin((1 - w) * angle) / Math.sin(angle) / ra;
  const kb = Math.sin(w * angle) / Math.sin(angle) / rb;
  return scale(add(scale(a, ka), scale(b, kb)), radius);
}

/** Smoothstep weight: 0 with zero slope at the start anchor, 1 with zero slope at the end anchor. */
function weight(from: NormalisedAnchor, to: NormalisedAnchor, timeUtcMs: number): number {
  const u = Math.min(1, Math.max(0, (timeUtcMs - from.timeUtcMs) / (to.timeUtcMs - from.timeUtcMs)));
  return u * u * (3 - 2 * u);
}

/** First time the path is inside (entering) or outside (leaving) the Moon's sphere of influence, to the millisecond. */
function sphereOfInfluenceCrossing(
  adapter: AstronomyAdapter,
  position: (timeUtcMs: number) => Vec3,
  startUtcMs: number,
  endUtcMs: number,
  entering: boolean,
): number | undefined {
  const inside = (t: number): boolean =>
    norm(sub(position(t), moonFromEarth(adapter, t).r)) <= CONSTANTS.moon.sphereOfInfluenceKm;
  const stepMs = NUMERICS.sphereOfInfluenceScanStepS * 1000;
  let before = startUtcMs;
  for (let t = startUtcMs + stepMs; before < endUtcMs; t += stepMs) {
    const probe = Math.min(t, endUtcMs);
    if (inside(probe) === entering) {
      let low = before;
      let high = probe;
      while (high - low > 1) {
        const middle = Math.floor((low + high) / 2);
        if (inside(middle) === entering) high = middle;
        else low = middle;
      }
      return high;
    }
    before = probe;
  }
  return undefined;
}

/**
 * Coast integrated with Earth (J2), Moon and Sun forward from its start anchor and backward from its end anchor,
 * blended by a smoothstep weight about the body both anchors reference (Earth otherwise). The result starts on
 * the start anchor and ends on the end anchor in position and velocity; the forward propagation's miss at the
 * end anchor is kept as the raw miss (Objective O-002, confirmed decisions 2026-10-06).
 */
function smoothedCoast(adapter: AstronomyAdapter, from: NormalisedAnchor, to: NormalisedAnchor, startState?: EarthState): Segment {
  const forwardStart = startState ?? from.earthCentred;
  const forward = spanThrough(adapter, forwardStart, from.timeUtcMs, from.timeUtcMs, to.timeUtcMs);
  const backward = spanThrough(adapter, to.earthCentred, to.timeUtcMs, from.timeUtcMs, to.timeUtcMs);
  const centre: CenterName = from.refBody === "moon" && to.refBody === "moon" ? "moon" : "earth";
  const position = (timeUtcMs: number): Vec3 => {
    const f = tableAt(forward, timeUtcMs).r;
    const b = tableAt(backward, timeUtcMs).r;
    const w = weight(from, to, timeUtcMs);
    if (centre === "earth") return blendAbout(f, b, w);
    const moon = toVec3(adapter.moonPositionKm(timeUtcMs));
    return add(moon, blendAbout(sub(f, moon), sub(b, moon), w));
  };
  const halfMs = NUMERICS.smoothingVelocityHalfStepMs;
  const generate: SegmentGenerator = (timeUtcMs) => {
    if (timeUtcMs === from.timeUtcMs) return asEarth(forwardStart);
    if (timeUtcMs === to.timeUtcMs) return asEarth(to.earthCentred);
    const velocity = scale(sub(position(timeUtcMs + halfMs), position(timeUtcMs - halfMs)), 1000 / (2 * halfMs));
    return { center: "earth", r: position(timeUtcMs), v: velocity };
  };
  const unsmoothed: SegmentGenerator = (timeUtcMs) => asEarth(tableAt(forward, timeUtcMs));
  let maxCorrectionKm = 0;
  let maxCorrectionMs = 0;
  const points = NUMERICS.correctionScanPoints;
  for (let i = 0; i <= points; i += 1) {
    const t = Math.round(from.timeUtcMs + ((to.timeUtcMs - from.timeUtcMs) * i) / points);
    const smoothed = generate(t);
    const raw = unsmoothed(t);
    maxCorrectionKm = Math.max(maxCorrectionKm, norm(sub(smoothed.r, raw.r)));
    maxCorrectionMs = Math.max(maxCorrectionMs, norm(sub(smoothed.v, raw.v)) * 1000);
  }
  const sphereOfInfluenceUtcMs = from.refBody === to.refBody
    ? undefined
    : sphereOfInfluenceCrossing(adapter, (t) => generate(t).r, from.timeUtcMs, to.timeUtcMs, to.refBody === "moon");
  return {
    ...endpoints(from, to),
    method: "coast-nbody-smoothed",
    generate,
    smoothing: { unsmoothed, centre, maxCorrectionKm, maxCorrectionMs },
    ...(sphereOfInfluenceUtcMs === undefined ? {} : { sphereOfInfluenceUtcMs }),
    reverse: false,
  };
}

function physicalBurn(adapter: AstronomyAdapter, from: NormalisedAnchor, to: NormalisedAnchor): Segment {
  const burn = solvePhysicalBurn(adapter, from, to, NUMERICS.burnStepS);
  return {
    ...endpoints(from, to),
    method: "powered-burn-physical",
    generate: (timeUtcMs) => {
      if (timeUtcMs === from.timeUtcMs) return from.native;
      const earthState = tableAt(burn.table, timeUtcMs);
      if (from.refBody === "earth") return asEarth(earthState);
      const moon = moonFromEarth(adapter, timeUtcMs);
      return { center: "moon", r: sub(earthState.r, moon.r), v: sub(earthState.v, moon.v) };
    },
    reverse: false,
    endState: burn.endState,
    burn: {
      constantAccelerationKmS2: burn.constantAccelerationKmS2,
      cutoffPositionResidualKm: burn.cutoffPositionResidualKm,
      cutoffVelocityResidualMs: burn.cutoffVelocityResidualMs,
    },
  };
}

/** Parking orbit: the TLI-ignition anchor integrated backward, because no NASA anchor exists before it. */
export function parkingOrbitBackward(adapter: AstronomyAdapter, startUtcMs: number, startLabel: string, to: NormalisedAnchor): Segment {
  const table = spanThrough(adapter, to.earthCentred, to.timeUtcMs, startUtcMs, to.timeUtcMs);
  return {
    id: `${startLabel}<${to.id}`,
    from: null,
    to,
    startUtcMs,
    endUtcMs: to.timeUtcMs,
    method: "parking-orbit-backward",
    generate: (timeUtcMs) => (timeUtcMs === to.timeUtcMs ? asEarth(to.earthCentred) : asEarth(tableAt(table, timeUtcMs))),
    reverse: true,
  };
}

function fixedFrame(timeUtcMs: number): { rotation: Mat3; rate: Mat3 } {
  return { rotation: lunarFixedToEqj(timeUtcMs), rate: lunarRotationRate(timeUtcMs, NUMERICS.rotationRateHalfStepMs) };
}

/** Moon-fixed position and velocity (velocity relative to the rotating frame) of an inertial Moon-centred state. */
function toMoonFixed(state: CentreState, timeUtcMs: number): { p: Vec3; v: Vec3 } {
  const { rotation, rate } = fixedFrame(timeUtcMs);
  const inverse = transpose(rotation);
  const p = mulMatVec(inverse, state.r);
  const frameVelocity = mulMatVec(inverse, mulMatVec(rate, p));
  return { p, v: sub(mulMatVec(inverse, state.v), frameVelocity) };
}

/** Hermite through two anchors in the Moon-fixed frame, so the arc follows the rotating surface. */
function moonFixedHermite(
  from: NormalisedAnchor,
  to: NormalisedAnchor,
  method: SegmentMethod,
): Segment {
  const start = toMoonFixed(from.native, from.timeUtcMs);
  const end = toMoonFixed(to.native, to.timeUtcMs);
  const ends = { p0: start.p, v0: start.v, p1: end.p, v1: end.v, spanS: (to.timeUtcMs - from.timeUtcMs) / 1000 };
  return {
    ...endpoints(from, to),
    method,
    generate: (timeUtcMs) => {
      const { p, v } = hermiteAt(ends, (timeUtcMs - from.timeUtcMs) / 1000 / ends.spanS);
      const { rotation, rate } = fixedFrame(timeUtcMs);
      const velocity = mulMatVec(rotation, v);
      const frameVelocity = mulMatVec(rate, p);
      return {
        center: "moon",
        r: mulMatVec(rotation, p),
        v: [velocity[0] + frameVelocity[0], velocity[1] + frameVelocity[1], velocity[2] + frameVelocity[2]],
      };
    },
    reverse: false,
  };
}

function surfaceHold(from: NormalisedAnchor, to: NormalisedAnchor): Segment {
  const fixed = toMoonFixed(from.native, from.timeUtcMs).p;
  return {
    ...endpoints(from, to),
    method: "surface-hold",
    generate: (timeUtcMs) => {
      const { rotation, rate } = fixedFrame(timeUtcMs);
      return { center: "moon", r: mulMatVec(rotation, fixed), v: mulMatVec(rate, fixed) };
    },
    reverse: false,
  };
}

export function buildSegment(
  adapter: AstronomyAdapter,
  from: NormalisedAnchor,
  to: NormalisedAnchor,
  powered: boolean,
  special: SegmentMethod | undefined,
  startState?: EarthState,
): Segment {
  if (special === "surface-hold") return surfaceHold(from, to);
  if (special === "powered-descent-two-anchor" || special === "powered-ascent-two-anchor") {
    return moonFixedHermite(from, to, special);
  }
  return powered ? physicalBurn(adapter, from, to) : smoothedCoast(adapter, from, to, startState);
}
