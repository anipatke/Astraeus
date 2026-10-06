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
}

export interface MissionConfig {
  readonly title: string;
  readonly notes: readonly string[];
  readonly bodies: readonly TrackedBody[];
  readonly events: readonly TimelineEvent[];
  /** Timeline preset: the span the scrubber covers when the mission is selected. */
  readonly window: TimeBounds;
  readonly rates: readonly number[];
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

export interface Speed {
  readonly label: string;
  readonly rate: number;
}

export const formatRate = (rate: number): string => `${rate.toLocaleString("en-US")}×`;

/** Existing speeds plus any mission rates not already offered, in ascending order. */
export function mergeSpeeds(base: readonly Speed[], rates: readonly number[]): readonly Speed[] {
  const extra = rates.filter((rate) => !base.some((speed) => speed.rate === rate))
    .map((rate) => ({ label: formatRate(rate), rate }));
  return [...base, ...extra].sort((a, b) => a.rate - b.rate);
}

export interface TrackedReadout {
  readonly id: string;
  readonly label: string;
  readonly rangeFromEarthKm: number;
  readonly speedKmS: number | null;
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
      rangeFromEarthKm: Math.hypot(...state.positionKm),
      speedKmS: state.velocityKmS === undefined ? null : Math.hypot(...state.velocityKmS),
    });
  }
  return rows;
}
