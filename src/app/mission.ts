import type { SimulationClock } from "../core/clock";
import type { TimelineEvent } from "../core/events";
import type { State } from "../core/state";
import type { TimeBounds, Trajectory } from "../core/trajectory";
import type { OrbitPathSamples } from "./orbitPath";

/** A bounded trajectory the scene can draw. Nothing here names a mission. */
export interface TrackedBody {
  readonly id: string;
  readonly label: string;
  readonly color: string;
  readonly trajectory: Trajectory & { readonly bounds: TimeBounds };
  /** Times of the reconstructed samples the path is drawn through. */
  readonly pathTimesUtcMs: readonly number[];
  /** Times of source anchors, drawn apart from the reconstructed samples. */
  readonly anchorTimesUtcMs: readonly number[];
  /** Optional short label per anchor (same order as anchorTimesUtcMs), shown on request for diagnosis. */
  readonly anchorLabels?: readonly string[];
  /** Published position discrepancy per reconstruction segment, in time order. */
  readonly positionDiscrepancies?: readonly PositionDiscrepancy[];
}

/** How far the drawn path may depart from its source over one segment, as the data publishes it. */
export interface PositionDiscrepancy {
  readonly startUtcMs: number;
  readonly endUtcMs: number;
  /** Null when the data publishes no figure for this segment. */
  readonly km: number | null;
  readonly basis: string;
}

/** The segment covering `timeUtcMs`; a shared boundary belongs to the later segment. */
export function discrepancyAt(body: TrackedBody, timeUtcMs: number): PositionDiscrepancy | null {
  const segments = body.positionDiscrepancies ?? [];
  const index = segments.findIndex((segment) => timeUtcMs >= segment.startUtcMs && timeUtcMs < segment.endUtcMs);
  if (index >= 0) return segments[index];
  const last = segments[segments.length - 1];
  return last !== undefined && timeUtcMs === last.endUtcMs ? last : null;
}

export interface MissionConfig {
  readonly title: string;
  readonly notes: readonly string[];
  readonly bodies: readonly TrackedBody[];
  readonly events: readonly TimelineEvent[];
  /** Timeline preset: the span the scrubber covers when the mission is selected. */
  readonly window: TimeBounds;
  readonly rates: readonly number[];
  /** Names for the first and last events on the journey progress line. */
  readonly journey?: { readonly start: string; readonly end: string };
}

/** The body's anchor labels, or null when it has none; a count mismatch is a wiring error. */
export function anchorLabelsOf(body: TrackedBody): readonly string[] | null {
  if (body.anchorLabels === undefined) return null;
  if (body.anchorLabels.length !== body.anchorTimesUtcMs.length) {
    throw new RangeError(`${body.id}: ${body.anchorLabels.length} anchor labels for ${body.anchorTimesUtcMs.length} anchors`);
  }
  return body.anchorLabels;
}

/** State only while the time is inside the trajectory's bounds; otherwise nothing is shown. */
export function stateIfInBounds(body: TrackedBody, timeUtcMs: number): State | null {
  const { startUtcMs, endUtcMs } = body.trajectory.bounds;
  return timeUtcMs < startUtcMs || timeUtcMs > endUtcMs ? null : body.trajectory.stateAt(timeUtcMs);
}

/** Camera targeting must stay continuous, so out-of-bounds times hold the nearest bound. */
export function stateClampedToBounds(body: TrackedBody, timeUtcMs: number): State {
  const { startUtcMs, endUtcMs } = body.trajectory.bounds;
  return body.trajectory.stateAt(Math.min(endUtcMs, Math.max(startUtcMs, timeUtcMs)));
}

/** Physical positions through the trajectory's own stateAt at the given times. */
export function sampleTrackedPositions(
  trajectory: Trajectory,
  timesUtcMs: readonly number[],
): Pick<OrbitPathSamples, "timesUtcMs" | "positionsKm"> {
  const positionsKm = new Float64Array(timesUtcMs.length * 3);
  timesUtcMs.forEach((time, index) => positionsKm.set(trajectory.stateAt(time).positionKm, index * 3));
  return { timesUtcMs, positionsKm };
}

/** Number of sorted times at or before `timeUtcMs`: samples [0, n) are travelled, [n, end) are ahead. */
export function travelledCount(timesUtcMs: readonly number[], timeUtcMs: number): number {
  let low = 0;
  let high = timesUtcMs.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (timesUtcMs[middle] <= timeUtcMs) low = middle + 1;
    else high = middle;
  }
  return low;
}

/** Presentation-only marker size: grows with camera distance so a point stays visible at any zoom. */
export const MARKER_SCREEN_FRACTION = 0.008;
export const MARKER_MIN_RADIUS_UNITS = 1e-4;

export function markerRadiusUnits(cameraDistanceUnits: number): number {
  return Math.max(MARKER_MIN_RADIUS_UNITS, cameraDistanceUnits * MARKER_SCREEN_FRACTION);
}

export function jumpToEvent(clock: SimulationClock, events: readonly TimelineEvent[], id: string): number {
  const event = events.find((candidate) => candidate.id === id);
  if (event === undefined) throw new RangeError(`unknown event "${id}"`);
  clock.seek(event.timeUtcMs);
  return event.timeUtcMs;
}

export type { PlaybackSpeed as Speed } from "../shell/timelineModel";
export { formatRate, mergeSpeeds } from "../shell/timelineModel";

export interface TrackedReadout {
  readonly id: string;
  readonly label: string;
  readonly positionKm: readonly [number, number, number];
  readonly rangeFromEarthKm: number;
  readonly speedKmS: number | null;
  /** Frame and centre the range and speed are measured in. */
  readonly frame: State["frame"];
  readonly center: State["center"];
}

/** Current-position rows for the bodies whose trajectories cover `timeUtcMs`; the rest are omitted. */
export function trackedReadouts(bodies: readonly TrackedBody[], timeUtcMs: number): readonly TrackedReadout[] {
  const rows: TrackedReadout[] = [];
  for (const body of bodies) {
    const state = stateIfInBounds(body, timeUtcMs);
    if (state === null) continue;
    rows.push({
      id: body.id,
      label: body.label,
      positionKm: [state.positionKm[0], state.positionKm[1], state.positionKm[2]],
      rangeFromEarthKm: Math.hypot(...state.positionKm),
      speedKmS: state.velocityKmS === undefined ? null : Math.hypot(...state.velocityKmS),
      frame: state.frame,
      center: state.center,
    });
  }
  return rows;
}
