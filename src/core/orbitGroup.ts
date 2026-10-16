import type { CenterId } from "./body";
import { createProvenance, type Provenance } from "./provenance";
import {
  assertFillBuffer,
  assertGroupCount,
  assertMemberIndex,
  assertWithinBounds,
  GroupElementsError,
  memberState,
  type PointGroup,
} from "./pointGroup";
import { assertUtcUnixMs, EQJ } from "./state";
import type { TimeBounds } from "./trajectory";
import type { ClassicalElements, TwoBodyAdapter } from "./twoBodyAdapter";

export type ElementPlane = "ecliptic-j2000" | "EQJ";

/** Published-style elements: lengths in km, angles in degrees. */
export interface OrbitElements {
  readonly semiMajorAxisKm: number;
  readonly eccentricity: number;
  readonly inclinationDeg: number;
  readonly raanDeg: number;
  readonly argumentOfPeriapsisDeg: number;
  readonly trueAnomalyDeg: number;
}

/** Half-width of a uniform spread around each base element; absent means no spread. */
export type OrbitSpread = Partial<OrbitElements>;

export interface OrbitGroupInput {
  readonly id: string;
  readonly count: number;
  readonly center: CenterId;
  /** Plane the base elements are expressed in; positions are always output in EQJ. */
  readonly plane: ElementPlane;
  /** Instant at which the elements hold. */
  readonly epochUtcMs: number;
  readonly base: OrbitElements;
  readonly spread: OrbitSpread;
  /** Unsigned 32-bit integer; the same seed always gives the same members. */
  readonly seed: number;
  readonly bounds?: TimeBounds;
  readonly provenance: Provenance;
}

const ELEMENT_KEYS = [
  "semiMajorAxisKm",
  "eccentricity",
  "inclinationDeg",
  "raanDeg",
  "argumentOfPeriapsisDeg",
  "trueAnomalyDeg",
] as const satisfies readonly (keyof OrbitElements)[];

const RADIANS = Math.PI / 180;
const TWO_BODY_NOTE = "Motion is unperturbed two-body about the centre; no perturbations are modelled.";

// Local so a group never shares random state with other code (mulberry32, 32-bit seed).
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function assertInput(input: OrbitGroupInput): void {
  assertGroupCount(input.count);
  assertUtcUnixMs(input.epochUtcMs);
  if (!Number.isInteger(input.seed) || input.seed < 0 || input.seed > 0xffffffff) {
    throw new GroupElementsError("seed must be an unsigned 32-bit integer");
  }
  for (const key of ELEMENT_KEYS) {
    if (!Number.isFinite(input.base[key])) throw new GroupElementsError(`base ${key} must be finite`);
    const width = input.spread[key] ?? 0;
    if (!Number.isFinite(width) || width < 0) throw new GroupElementsError(`spread ${key} must be finite and not negative`);
  }
}

function assertBoundOrbit(e: ClassicalElements, member: number): void {
  const bound = e.semiMajorAxisKm > 0 && e.eccentricity >= 0 && e.eccentricity < 1
    && e.inclinationRad >= 0 && e.inclinationRad <= Math.PI;
  if (!bound) {
    throw new GroupElementsError(`member ${member} has elements outside a bound orbit; narrow the spread or change the base`);
  }
}

/** Always draws six values per member so widening one element's spread never reshuffles the others. */
function sampleMembers(input: OrbitGroupInput): ClassicalElements[] {
  const random = seededRandom(input.seed);
  const members: ClassicalElements[] = [];
  for (let member = 0; member < input.count; member++) {
    const value = (key: keyof OrbitElements): number =>
      input.base[key] + (2 * random() - 1) * (input.spread[key] ?? 0);
    const elements: ClassicalElements = {
      semiMajorAxisKm: value("semiMajorAxisKm"),
      eccentricity: value("eccentricity"),
      inclinationRad: value("inclinationDeg") * RADIANS,
      raanRad: value("raanDeg") * RADIANS,
      argumentOfPeriapsisRad: value("argumentOfPeriapsisDeg") * RADIANS,
      trueAnomalyRad: value("trueAnomalyDeg") * RADIANS,
    };
    assertBoundOrbit(elements, member);
    members.push(elements);
  }
  return members;
}

export function rotateInto(matrix: Float64Array, v: ArrayLike<number>, out: Float64Array, offset: number): void {
  for (let row = 0; row < 3; row++) {
    out[offset + row] = matrix[3 * row] * v[0] + matrix[3 * row + 1] * v[1] + matrix[3 * row + 2] * v[2];
  }
}

function initialStates(input: OrbitGroupInput, adapter: TwoBodyAdapter): Float64Array {
  const rotation = input.plane === "ecliptic-j2000" ? adapter.eclipticJ2000ToEqjMatrix() : null;
  const states = new Float64Array(6 * input.count);
  sampleMembers(input).forEach((elements, member) => {
    const { position, velocity } = adapter.elementsToState(elements, input.center);
    if (rotation === null) {
      states.set(position, 6 * member);
      states.set(velocity, 6 * member + 3);
    } else {
      rotateInto(rotation, position, states, 6 * member);
      rotateInto(rotation, velocity, states, 6 * member + 3);
    }
  });
  return states;
}

export function createOrbitGroup(input: OrbitGroupInput, adapter: TwoBodyAdapter): PointGroup {
  assertInput(input);
  const states = initialStates(input, adapter);
  const provenance = createProvenance({
    ...input.provenance,
    notes: `${input.provenance.notes} ${TWO_BODY_NOTE}`.trim(),
  });
  const { count, center, epochUtcMs, bounds } = input;

  const fillPositionsKm = (timeUtcMs: number, out: Float64Array): void => {
    assertUtcUnixMs(timeUtcMs);
    assertWithinBounds(bounds, timeUtcMs);
    assertFillBuffer(count, out);
    const dtSeconds = (timeUtcMs - epochUtcMs) / 1000;
    for (let member = 0; member < count; member++) {
      adapter.propagateMemberInto(states, member, dtSeconds, center, out);
    }
  };

  const group: PointGroup = {
    id: input.id,
    count,
    center,
    frame: EQJ,
    ...(bounds === undefined ? {} : { bounds }),
    provenance,
    fillPositionsKm,
    stateAt(index: number, timeUtcMs: number) {
      assertMemberIndex(count, index);
      assertUtcUnixMs(timeUtcMs);
      assertWithinBounds(bounds, timeUtcMs);
      const position = new Float64Array(3);
      // Same propagation path as the batch, on a one-member view, so the two never disagree.
      const single = new Float64Array(6);
      single.set(states.subarray(6 * index, 6 * index + 6));
      adapter.propagateMemberInto(single, 0, (timeUtcMs - epochUtcMs) / 1000, center, position);
      return memberState(group, index, timeUtcMs, position);
    },
  };
  return Object.freeze(group);
}
