/**
 * Made-up members on two-body motion as a point group with the `EphemerisGroup` shape: each member has its own elements and moment, and the group
 * answers the same questions a curve-fit group does (batch fill, one state, a position at any time, how far back the data reach), so a body set
 * draws them with no change. Motion is unperturbed two-body about the centre; the centre's gravity comes from the adapter.
 */
import type { BodyId, CenterId } from "./body";
import type { EphemerisGroup } from "./ephemerisGroup";
import { memberStatesOf, propagatedPositionOf, type ElementPlane, type OrbitElements } from "./orbitGroup";
import { assertFillBuffer, assertMemberIndex, assertWithinBounds, GroupElementsError, memberState } from "./pointGroup";
import type { Provenance } from "./provenance";
import { assertUtcUnixMs, EQJ, createState, type State } from "./state";
import type { TimeBounds } from "./trajectory";
import type { ClassicalElements, TwoBodyAdapter } from "./twoBodyAdapter";

/** One member: its id, its elements (km, degrees) and the moment they hold. */
export interface ElementsGroupMember {
  readonly id: BodyId;
  readonly elements: OrbitElements;
  readonly epochUtcMs: number;
  /** The plane the elements are given in. */
  readonly plane: ElementPlane;
}

export interface ElementsGroupInput {
  readonly id: BodyId;
  readonly center: CenterId;
  readonly members: readonly ElementsGroupMember[];
  readonly bounds: TimeBounds;
  readonly provenance: Provenance;
}

const RADIANS = Math.PI / 180;
/** Half the step of the centred difference that gives a member's velocity, ms. */
const VELOCITY_HALF_STEP_MS = 500;

function classical(elements: OrbitElements, id: BodyId): ClassicalElements {
  for (const key of ["semiMajorAxisKm", "eccentricity", "inclinationDeg", "raanDeg", "argumentOfPeriapsisDeg", "trueAnomalyDeg"] as const) {
    if (!Number.isFinite(elements[key])) throw new GroupElementsError(`member "${id}" ${key} must be finite`);
  }
  const { semiMajorAxisKm, eccentricity } = elements;
  if (!(semiMajorAxisKm > 0) || !(eccentricity >= 0 && eccentricity < 1)) throw new GroupElementsError(`member "${id}" needs a bound orbit: a positive semi-major axis and an eccentricity from 0 to below 1`);
  if (!(elements.inclinationDeg >= 0 && elements.inclinationDeg <= 180)) throw new GroupElementsError(`member "${id}" inclination must be from 0 to 180 degrees`);
  return {
    semiMajorAxisKm,
    eccentricity,
    inclinationRad: elements.inclinationDeg * RADIANS,
    raanRad: elements.raanDeg * RADIANS,
    argumentOfPeriapsisRad: elements.argumentOfPeriapsisDeg * RADIANS,
    trueAnomalyRad: elements.trueAnomalyDeg * RADIANS,
  };
}

export function createElementsGroup(input: ElementsGroupInput, adapter: TwoBodyAdapter): EphemerisGroup {
  const { id, center, bounds, provenance } = input;
  const members = Object.freeze(input.members.map((member) => member.id));
  if (members.length === 0) throw new RangeError(`group "${id}" lists no members`);
  if (new Set(members).size !== members.length) throw new RangeError(`group "${id}" lists a member twice`);
  if (!(bounds.endUtcMs >= bounds.startUtcMs)) throw new RangeError(`group "${id}" bounds end before they start`);
  input.members.forEach((member) => assertUtcUnixMs(member.epochUtcMs));
  // One state per member at its own moment: the shared placement takes each member's elements in turn.
  const states = input.members.map((member) => memberStatesOf([classical(member.elements, member.id)], member.plane, center, adapter));
  const count = members.length;
  const one = new Float64Array(3);
  const at = (index: number, timeUtcMs: number, out: Float64Array, offset: number): void => {
    assertMemberIndex(count, index);
    assertUtcUnixMs(timeUtcMs);
    out.set(propagatedPositionOf(states[index], 0, (timeUtcMs - input.members[index].epochUtcMs) / 1000, center, adapter), offset);
  };
  const group: EphemerisGroup = {
    id,
    count,
    center,
    frame: EQJ,
    bounds,
    provenance,
    members,
    fillPositionsKm(timeUtcMs: number, out: Float64Array): void {
      assertWithinBounds(bounds, timeUtcMs);
      assertFillBuffer(count, out);
      for (let index = 0; index < count; index += 1) at(index, timeUtcMs, out, 3 * index);
    },
    stateAt(index: number, timeUtcMs: number): State {
      assertWithinBounds(bounds, timeUtcMs);
      at(index, timeUtcMs, one, 0);
      return memberState(group, index, timeUtcMs, one);
    },
    memberPositionKmInto(index: number, timeUtcMs: number, out: Float64Array, offset: number): void {
      at(index, timeUtcMs, out, offset);
    },
    // Two-body motion needs no loaded data: it reaches back as far as asked.
    memberLoadedFromUtcMs(index: number): number | null {
      assertMemberIndex(count, index);
      return -Infinity;
    },
    memberStateAt(index: number, timeUtcMs: number): State {
      assertWithinBounds(bounds, timeUtcMs);
      const here = new Float64Array(3);
      const before = new Float64Array(3);
      const after = new Float64Array(3);
      at(index, timeUtcMs, here, 0);
      at(index, timeUtcMs - VELOCITY_HALF_STEP_MS, before, 0);
      at(index, timeUtcMs + VELOCITY_HALF_STEP_MS, after, 0);
      const velocityKmS = Float64Array.from([0, 1, 2].map((k) => (after[k] - before[k]) / (2 * VELOCITY_HALF_STEP_MS / 1000)));
      return createState({ body: members[index], center, timeUtcMs, plane: EQJ, positionKm: here, velocityKmS, orientation: null });
    },
  };
  return Object.freeze(group);
}
