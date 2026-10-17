import type { CenterId } from "./body";
import { memberStatesOf, propagatedPositionOf, seededRandom, type ElementPlane } from "./orbitGroup";
import {
  assertFillBuffer,
  assertGroupCount,
  assertMemberIndex,
  assertWithinBounds,
  GroupCountError,
  GroupElementsError,
  type PointGroup,
} from "./pointGroup";
import { createProvenance, type Provenance } from "./provenance";
import { assertUtcUnixMs, createState, EQJ, type State } from "./state";
import type { TimeBounds, Trajectory } from "./trajectory";
import type { TwoBodyAdapter } from "./twoBodyAdapter";

/** A measured orbit's shape and orientation. Angles in degrees, length in km. It carries no position along the orbit. */
export interface ListedElements {
  readonly semiMajorAxisKm: number;
  readonly eccentricity: number;
  readonly inclinationDeg: number;
  readonly raanDeg: number;
  readonly argumentOfPeriapsisDeg: number;
}

/** One record of a measured list: its own source id, the time its elements were measured, and the elements. */
export interface ListedMember {
  readonly recordId: string;
  /** The record's own time. Kept with the record; it does not place the dot (see ListedPhase). */
  readonly epochUtcMs: number;
  readonly elements: ListedElements;
}

/** A stated share of the members drawn near a reference body's position along its orbit. A model, not a measurement. */
export interface ListedConcentration {
  /** The reference body (for example a parent); only its position about the group's centre at the reference time is used. */
  readonly around: Trajectory;
  /** Share of members, 0 to 1, whose mean anomaly is placed within `widthDeg` of the reference body's. */
  readonly fraction: number;
  /** Half-width in degrees of mean anomaly, above 0 and at most 180. */
  readonly widthDeg: number;
}

export interface ListedPhase {
  /** The instant at which each member's mean anomaly is the drawing choice below; members then move by two-body motion. */
  readonly referenceUtcMs: number;
  /** Unsigned 32-bit integer picking which member takes which slot; defaults to 0. */
  readonly seed?: number;
  readonly concentration?: ListedConcentration;
}

export interface ListedOrbitGroupInput {
  readonly id: string;
  readonly center: CenterId;
  /** Plane the elements are expressed in; positions are always output in EQJ. */
  readonly plane: ElementPlane;
  readonly members: readonly ListedMember[];
  readonly phase: ListedPhase;
  readonly bounds?: TimeBounds;
  /** Where the elements came from. The group restates the position along each orbit as illustrative. */
  readonly provenance: Provenance;
}

export interface ListedOrbitGroup extends PointGroup {
  /** The source record id of member `index`; also the suffix of that member's State body id. */
  recordIdAt(index: number): string;
  /** Member `index`'s mean anomaly (degrees, 0 to 360) at the reference time: the drawing choice. */
  meanAnomalyDegAt(index: number): number;
}

const RADIANS = Math.PI / 180;
const TWO_PI = 2 * Math.PI;
const ELEMENT_KEYS = ["semiMajorAxisKm", "eccentricity", "inclinationDeg", "raanDeg", "argumentOfPeriapsisDeg"] as const satisfies readonly (keyof ListedElements)[];
/** Step either side of the reference time used to read a reference body's velocity when its State carries none. */
const VELOCITY_STEP_MS = 1000;

function describe(member: ListedMember, index: number): string {
  return `member ${index} (record "${String(member.recordId)}")`;
}

/** The rejection rule: a record must give a finite, bound orbit; unbound records are for the loader to drop. */
function assertMembers(members: readonly ListedMember[]): void {
  if (members.length === 0) throw new GroupCountError("a listed group needs at least one member; the list is empty");
  const seen = new Set<string>();
  members.forEach((member, index) => {
    const who = describe(member, index);
    if (typeof member.recordId !== "string" || member.recordId.length === 0) {
      throw new GroupElementsError(`${who}: recordId must be a non-empty string`);
    }
    if (seen.has(member.recordId)) throw new GroupElementsError(`${who}: duplicate recordId`);
    seen.add(member.recordId);
    try {
      assertUtcUnixMs(member.epochUtcMs);
    } catch {
      throw new GroupElementsError(`${who}: epochUtcMs must be an integer UTC Unix-millisecond value`);
    }
    for (const key of ELEMENT_KEYS) {
      if (!Number.isFinite(member.elements[key])) throw new GroupElementsError(`${who}: ${key} must be finite`);
    }
    const e = member.elements;
    if (!(e.semiMajorAxisKm > 0)) throw new GroupElementsError(`${who}: semiMajorAxisKm must be positive (an unbound orbit has none)`);
    if (!(e.eccentricity >= 0 && e.eccentricity < 1)) {
      throw new GroupElementsError(`${who}: eccentricity must be at least 0 and below 1 (a bound orbit), got ${e.eccentricity}`);
    }
    if (!(e.inclinationDeg >= 0 && e.inclinationDeg <= 180)) {
      throw new GroupElementsError(`${who}: inclinationDeg must be from 0 to 180, got ${e.inclinationDeg}`);
    }
  });
}

function assertPhase(phase: ListedPhase): void {
  assertUtcUnixMs(phase.referenceUtcMs);
  const seed = phase.seed ?? 0;
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new GroupElementsError("phase seed must be an unsigned 32-bit integer");
  const c = phase.concentration;
  if (c === undefined) return;
  if (!(c.fraction >= 0 && c.fraction <= 1)) throw new GroupElementsError(`concentration fraction must be from 0 to 1, got ${c.fraction}`);
  if (!(c.widthDeg > 0 && c.widthDeg <= 180)) throw new GroupElementsError(`concentration widthDeg must be above 0 and at most 180, got ${c.widthDeg}`);
}

/** Solves Kepler's equation M = E - e sin E for E (Newton; bound orbits only). */
export function eccentricAnomalyRad(meanAnomalyRad: number, e: number): number {
  const m = Math.atan2(Math.sin(meanAnomalyRad), Math.cos(meanAnomalyRad));
  let E = e < 0.8 ? m : Math.PI * Math.sign(m || 1);
  for (let step = 0; step < 60; step++) {
    const delta = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
    E -= delta;
    if (Math.abs(delta) < 1e-15) break;
  }
  return E;
}

export function trueAnomalyFromMeanRad(meanAnomalyRad: number, e: number): number {
  const E = eccentricAnomalyRad(meanAnomalyRad, e);
  return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
}

const cross = (a: ArrayLike<number>, b: ArrayLike<number>): number[] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: ArrayLike<number>, b: ArrayLike<number>): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Mean anomaly (radians, 0 to 2π) of a body with the given position and velocity about a centre of gravitational parameter `mu`. */
export function meanAnomalyFromStateRad(r: ArrayLike<number>, v: ArrayLike<number>, mu: number): number {
  const rMag = Math.hypot(r[0], r[1], r[2]);
  const h = cross(r, v);
  const vh = cross(v, h);
  const evec = [0, 1, 2].map((k) => vh[k] / mu - r[k] / rMag);
  const e = Math.hypot(evec[0], evec[1], evec[2]);
  if (!(e < 1)) throw new GroupElementsError("the reference body is not on a bound orbit about the group's centre");
  let nu: number;
  if (e < 1e-12) {
    // Circular: no periapsis, so measure from the ascending node direction.
    const node = [-h[1], h[0], 0];
    const nodeMag = Math.hypot(node[0], node[1]);
    const ref = nodeMag > 0 ? node.map((x) => x / nodeMag) : [1, 0, 0];
    nu = Math.atan2(dot(cross(ref, r), h) / Math.hypot(h[0], h[1], h[2]), dot(ref, r));
  } else {
    nu = Math.acos(Math.max(-1, Math.min(1, dot(evec, r) / (e * rMag))));
    if (dot(r, v) < 0) nu = TWO_PI - nu;
  }
  const E = 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(nu / 2), Math.sqrt(1 + e) * Math.cos(nu / 2));
  const m = E - e * Math.sin(E);
  return ((m % TWO_PI) + TWO_PI) % TWO_PI;
}

/** The centre's gravitational parameter as the adapter applies it: a circular orbit has v² r = μ. */
function muOf(adapter: TwoBodyAdapter, center: CenterId): number {
  const r = 1e6;
  const { velocity } = adapter.elementsToState(
    { semiMajorAxisKm: r, eccentricity: 0, inclinationRad: 0, raanRad: 0, argumentOfPeriapsisRad: 0, trueAnomalyRad: 0 },
    center,
  );
  return dot(velocity, velocity) * r;
}

function referenceMeanAnomalyRad(around: Trajectory, center: CenterId, timeUtcMs: number, adapter: TwoBodyAdapter): number {
  const now: State = around.stateAt(timeUtcMs, center);
  let velocity = now.velocityKmS;
  if (velocity === undefined) {
    const before = around.stateAt(timeUtcMs - VELOCITY_STEP_MS, center).positionKm;
    const after = around.stateAt(timeUtcMs + VELOCITY_STEP_MS, center).positionKm;
    velocity = Float64Array.from([0, 1, 2].map((k) => (after[k] - before[k]) / (2 * VELOCITY_STEP_MS / 1000)));
  }
  return meanAnomalyFromStateRad(now.positionKm, velocity, muOf(adapter, center));
}

/**
 * Mean anomalies in degrees, one per member. The set is evenly spread round the orbit; a seeded shuffle decides which member takes
 * which slot, so list order never lines members up. With a concentration, the first `round(fraction × n)` of the shuffle sit
 * evenly across the window about the reference body and the rest spread evenly round the whole orbit.
 */
function assignMeanAnomaliesDeg(count: number, phase: ListedPhase, referenceDeg: number | null): Float64Array {
  const random = seededRandom(phase.seed ?? 0);
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const clumped = phase.concentration === undefined || referenceDeg === null ? 0 : Math.round(phase.concentration.fraction * count);
  const result = new Float64Array(count);
  const wrap = (deg: number): number => ((deg % 360) + 360) % 360;
  for (let slot = 0; slot < count; slot++) {
    const member = order[slot];
    if (slot < clumped && phase.concentration !== undefined && referenceDeg !== null) {
      const width = phase.concentration.widthDeg;
      result[member] = wrap(referenceDeg + width * (2 * (slot + 0.5) / clumped - 1));
    } else {
      const rest = count - clumped;
      result[member] = (360 * (slot - clumped + 0.5)) / rest;
    }
  }
  return result;
}

const PHASE_NOTE = "Each orbit's shape and orientation come from its record, but the records give no position along the orbit: "
  + "that position is an even spread of mean anomaly at the reference time, a drawing choice (illustrative), advanced by unperturbed two-body motion about the centre.";
const CONCENTRATION_NOTE = "A stated share of the dots is placed near the reference body's position along the orbit: a model, not a measurement. No orbit is added.";

/**
 * A group drawn from a list of measured orbits: each member has its own elements, record time and source record id. Only the
 * position along each orbit is chosen here (see ListedPhase); every member then moves on its own ellipse by two-body motion.
 */
export function createListedOrbitGroup(input: ListedOrbitGroupInput, adapter: TwoBodyAdapter): ListedOrbitGroup {
  assertMembers(input.members);
  assertPhase(input.phase);
  const count = input.members.length;
  assertGroupCount(count);
  const { center, bounds } = input;
  const { referenceUtcMs, concentration } = input.phase;

  const referenceDeg = concentration === undefined
    ? null
    : referenceMeanAnomalyRad(concentration.around, center, referenceUtcMs, adapter) / RADIANS;
  const anomaliesDeg = assignMeanAnomaliesDeg(count, input.phase, referenceDeg);

  const states = memberStatesOf(input.members.map(({ elements }, member) => ({
    semiMajorAxisKm: elements.semiMajorAxisKm,
    eccentricity: elements.eccentricity,
    inclinationRad: elements.inclinationDeg * RADIANS,
    raanRad: elements.raanDeg * RADIANS,
    argumentOfPeriapsisRad: elements.argumentOfPeriapsisDeg * RADIANS,
    trueAnomalyRad: trueAnomalyFromMeanRad(anomaliesDeg[member] * RADIANS, elements.eccentricity),
  })), input.plane, center, adapter);

  const recordIds = input.members.map((member) => member.recordId);
  const provenance = createProvenance({
    sourceType: "illustrative",
    sources: input.provenance.sources,
    accuracy: `${input.provenance.accuracy} Orbit elements are as listed (${input.provenance.sourceType}); the position along each orbit is illustrative.`.trim(),
    notes: `${input.provenance.notes} ${PHASE_NOTE}${concentration === undefined ? "" : ` ${CONCENTRATION_NOTE}`}`.trim(),
  });

  const group: ListedOrbitGroup = {
    id: input.id,
    count,
    center,
    frame: EQJ,
    ...(bounds === undefined ? {} : { bounds }),
    provenance,
    fillPositionsKm(timeUtcMs: number, out: Float64Array): void {
      assertUtcUnixMs(timeUtcMs);
      assertWithinBounds(bounds, timeUtcMs);
      assertFillBuffer(count, out);
      const dtSeconds = (timeUtcMs - referenceUtcMs) / 1000;
      for (let member = 0; member < count; member++) adapter.propagateMemberInto(states, member, dtSeconds, center, out);
    },
    stateAt(index: number, timeUtcMs: number) {
      assertMemberIndex(count, index);
      assertUtcUnixMs(timeUtcMs);
      assertWithinBounds(bounds, timeUtcMs);
      const position = propagatedPositionOf(states, index, (timeUtcMs - referenceUtcMs) / 1000, center, adapter);
      return createState({ body: `${input.id}:${recordIds[index]}`, center, timeUtcMs, frame: EQJ, positionKm: position, orientation: null });
    },
    recordIdAt(index: number): string {
      assertMemberIndex(count, index);
      return recordIds[index];
    },
    meanAnomalyDegAt(index: number): number {
      assertMemberIndex(count, index);
      return anomaliesDeg[index];
    },
  };
  return Object.freeze(group);
}
