import type { BodyId, CenterId } from "./body";
import type { Provenance } from "./provenance";
import { createState, EQJ, type FrameId, type State } from "./state";
import type { TimeBounds } from "./trajectory";

export class GroupBoundsError extends RangeError {
  override readonly name = "GroupBoundsError";
}
export class GroupBufferError extends RangeError {
  override readonly name = "GroupBufferError";
}
export class GroupCountError extends RangeError {
  override readonly name = "GroupCountError";
}
export class GroupElementsError extends TypeError {
  override readonly name = "GroupElementsError";
}

/**
 * Positions for a whole population at once. Members are anonymous: the batch fill avoids the
 * per-member State allocation that makes one Trajectory per member too slow for thousands.
 */
export interface PointGroup {
  readonly id: BodyId;
  readonly count: number;
  readonly center: CenterId;
  readonly frame: FrameId;
  /** Absent means the group is valid for every time. */
  readonly bounds?: TimeBounds;
  readonly provenance: Provenance;
  /** Writes every member's position (EQJ km, x y z per member) into `out`, which must hold 3 × count values. */
  fillPositionsKm(timeUtcMs: number, out: Float64Array): void;
  /** One member as an ordinary State; positionKm equals the batch values for the same time. */
  stateAt(index: number, timeUtcMs: number): State;
}

export function assertGroupCount(count: number): void {
  if (!Number.isSafeInteger(count) || count <= 0) {
    throw new GroupCountError("group count must be a positive integer");
  }
}

export function assertWithinBounds(bounds: TimeBounds | undefined, timeUtcMs: number): void {
  if (bounds !== undefined && (timeUtcMs < bounds.startUtcMs || timeUtcMs > bounds.endUtcMs)) {
    throw new GroupBoundsError(`time ${timeUtcMs} is outside the group's bounds`);
  }
}

export function assertFillBuffer(count: number, out: Float64Array): void {
  if (out.length !== 3 * count) {
    throw new GroupBufferError(`fill buffer must hold ${3 * count} values, received ${out.length}`);
  }
}

export function assertMemberIndex(count: number, index: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= count) {
    throw new RangeError(`member index must be an integer from 0 to ${count - 1}`);
  }
}

/** Builds a member's State from its already-computed position; shared so every group reads members the same way. */
export function memberState(
  group: Pick<PointGroup, "id" | "center" | "bounds">,
  index: number,
  timeUtcMs: number,
  positionKm: ArrayLike<number>,
): State {
  return createState({
    body: `${group.id}:${index}`,
    center: group.center,
    timeUtcMs,
    frame: EQJ,
    positionKm,
    orientation: null,
  });
}
