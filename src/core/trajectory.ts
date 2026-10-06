import type { BodyId, CenterId } from "./body";
import type { State } from "./state";

/** Inclusive UTC Unix-millisecond range over which a Trajectory can produce State. */
export interface TimeBounds {
  readonly startUtcMs: number;
  readonly endUtcMs: number;
}

export interface Trajectory {
  readonly body: BodyId;
  /** Absent means the Trajectory is valid for every time. */
  readonly bounds?: TimeBounds;
  stateAt(timeUtcMs: number, center?: CenterId): State;
}
