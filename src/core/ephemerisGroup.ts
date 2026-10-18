/**
 * Members of a curve-fit ephemeris set as one point group: every member's centre-relative position in one batch call, with no
 * allocation, for drawing many bodies each frame. The set is reached through a getter, so a group can be declared before its
 * chunks are loaded; it is read only when a position is asked for.
 */
import type { BodyId } from "./body";
import type { ChebyshevEphemeris } from "./chebyshevEphemeris";
import { assertFillBuffer, assertMemberIndex, assertWithinBounds, memberState, type PointGroup } from "./pointGroup";
import type { Provenance } from "./provenance";
import { EQJ, type State } from "./state";
import type { TimeBounds } from "./trajectory";

export interface EphemerisGroupOptions {
  readonly id: BodyId;
  /** The set's centre; every member is measured from it. */
  readonly center: BodyId;
  readonly ephemeris: () => ChebyshevEphemeris;
  /** Member body ids, in member order. */
  readonly members: readonly BodyId[];
  /** The times the group may be asked for: the window whose chunks are loaded. */
  readonly bounds: TimeBounds;
  readonly provenance: Provenance;
}

/** A point group whose members are also named bodies: each member's own state (with velocity) is available by index. */
export interface EphemerisGroup extends PointGroup {
  readonly members: readonly BodyId[];
  /** One member's centre-relative State, with velocity (km/s), as the set gives it. */
  memberStateAt(index: number, timeUtcMs: number): State;
  /**
   * One member's centre-relative position (km) into `out` at `offset`, at any time the loaded chunks cover, inside the group's bounds or
   * before them: for drawing the path a member has just travelled. Throws when a needed chunk is not loaded.
   */
  memberPositionKmInto(index: number, timeUtcMs: number, out: Float64Array, offset: number): void;
  /** The earliest time the loaded chunks cover continuously up to `timeUtcMs` for this member, or null. */
  memberLoadedFromUtcMs(index: number, timeUtcMs: number): number | null;
}

export function createEphemerisGroup(options: EphemerisGroupOptions): EphemerisGroup {
  const { id, center, ephemeris, bounds, provenance } = options;
  const members = Object.freeze([...options.members]);
  if (members.length === 0) throw new RangeError(`group "${id}" lists no members`);
  if (new Set(members).size !== members.length) throw new RangeError(`group "${id}" lists a member twice`);
  if (!(bounds.endUtcMs >= bounds.startUtcMs)) throw new RangeError(`group "${id}" bounds end before they start`);
  const one = new Float64Array(3);
  const single = members.map((member) => [member]);
  const group: EphemerisGroup = {
    id,
    count: members.length,
    center,
    frame: EQJ,
    bounds,
    provenance,
    members,
    fillPositionsKm(timeUtcMs: number, out: Float64Array): void {
      assertWithinBounds(bounds, timeUtcMs);
      assertFillBuffer(members.length, out);
      ephemeris().positionsKmInto(timeUtcMs, members, out);
    },
    stateAt(index: number, timeUtcMs: number): State {
      assertMemberIndex(members.length, index);
      assertWithinBounds(bounds, timeUtcMs);
      ephemeris().positionsKmInto(timeUtcMs, [members[index]], one);
      return memberState(group, index, timeUtcMs, one);
    },
    memberPositionKmInto(index: number, timeUtcMs: number, out: Float64Array, offset: number): void {
      assertMemberIndex(members.length, index);
      ephemeris().positionsKmInto(timeUtcMs, single[index], one);
      out[offset] = one[0];
      out[offset + 1] = one[1];
      out[offset + 2] = one[2];
    },
    memberLoadedFromUtcMs(index: number, timeUtcMs: number): number | null {
      assertMemberIndex(members.length, index);
      return ephemeris().loadedFromUtcMs(members[index], timeUtcMs);
    },
    memberStateAt(index: number, timeUtcMs: number): State {
      assertMemberIndex(members.length, index);
      assertWithinBounds(bounds, timeUtcMs);
      return ephemeris().stateOf(members[index], timeUtcMs);
    },
  };
  return Object.freeze(group);
}
