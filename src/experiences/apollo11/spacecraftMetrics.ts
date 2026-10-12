import { EARTH, MOON } from "../../core/body";
import type { CenteredPosition } from "../../core/state";
import type { Trajectory } from "../../core/trajectory";
import { discrepancyAt, trackedReadouts, type TrackedBody, type TrackedReadout } from "../../app/mission";
import type {
  AltitudeMetric,
  CoordinatesMetric,
  DistanceMetric,
  Metric,
  MetricReference,
  RelativeDistanceMetric,
  SpeedMetric,
  UncertaintyMetric,
} from "../../shell/metrics";

const centreName = (center: string) => `${center.charAt(0).toUpperCase()}${center.slice(1)} centre`;

/**
 * Highest speed at the body's NASA source anchors, the honest top of its speed gauge. Anchors rather
 * than reconstructed samples, because a smoothed join can carry a known non-physical spike (I-008).
 * Null when the body has no anchors or the trajectory carries no velocity.
 */
export function peakAnchorSpeedKmS(body: TrackedBody): number | null {
  let peak: number | null = null;
  for (const time of body.anchorTimesUtcMs) {
    const velocity = body.trajectory.stateAt(time).velocityKmS;
    if (velocity === undefined) return null;
    peak = Math.max(peak ?? 0, Math.hypot(...velocity));
  }
  return peak;
}

/** A reference marker only when it is measured from the same centre and in the same frame as the value. */
export function referenceInSameFrame(
  label: string,
  row: Pick<TrackedReadout, "frame" | "center">,
  reference: CenteredPosition | null,
): MetricReference | null {
  if (reference === null || reference.center !== row.center || reference.frame !== row.frame) return null;
  return { label, value: Math.hypot(...reference.positionKm) };
}

export function spacecraftRangeMetric(row: TrackedReadout, moon: MetricReference | null): DistanceMetric {
  return {
    kind: "distance",
    id: `${row.id}-range`,
    label: "Range",
    value: row.rangeFromEarthKm,
    unit: "km",
    digits: 0,
    origin: `${centreName(row.center)} · ${row.frame}`,
    ...(moon === null ? {} : { markers: [moon] }),
  };
}

export function spacecraftSpeedMetric(row: TrackedReadout, peakKmS: number | null): SpeedMetric {
  return {
    kind: "speed",
    id: `${row.id}-speed`,
    label: "Speed",
    value: row.speedKmS,
    unit: "km/s",
    digits: 3,
    context: `inertial, relative to ${centreName(row.center)} · ${row.frame}`,
    unavailable: "not modeled",
    ...(peakKmS === null ? {} : { range: { min: 0, max: peakKmS, basis: "peak at NASA source anchors", digits: 1 } }),
  };
}

/** The Moon's state when it shares the spacecraft's centre and frame, otherwise null. */
function moonInSameFrame(row: TrackedReadout, moon: CenteredPosition | null): CenteredPosition | null {
  return moon !== null && moon.center === row.center && moon.frame === row.frame ? moon : null;
}

const separationKm = (a: readonly number[], b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Centre-to-centre distance from the spacecraft to the Moon, drawn in Moon radii. */
export function spacecraftMoonMetric(row: TrackedReadout, moon: CenteredPosition | null): RelativeDistanceMetric {
  const same = moonInSameFrame(row, moon);
  return {
    kind: "relative-distance",
    id: `${row.id}-to-moon`,
    label: "Distance to Moon",
    value: same === null ? null : separationKm(row.positionKm, same.positionKm),
    unit: "km",
    digits: 0,
    from: row.label,
    to: "Moon",
    targetRadius: MOON.radiusKm,
    context: `centre to centre · ${row.frame}`,
    unavailable: "no Moon state in this frame",
  };
}

/**
 * Height above the mean radius of whichever of Earth and the Moon is closer to the surface.
 * Mean radius, not terrain: on the lunar surface the value can be negative.
 */
export function spacecraftAltitudeMetric(row: TrackedReadout, moon: CenteredPosition | null): AltitudeMetric {
  const aboveEarth = row.rangeFromEarthKm - EARTH.radiusKm;
  const same = moonInSameFrame(row, moon);
  const aboveMoon = same === null ? Infinity : separationKm(row.positionKm, same.positionKm) - MOON.radiusKm;
  const nearMoon = aboveMoon < aboveEarth;
  return {
    kind: "altitude",
    id: `${row.id}-altitude`,
    label: "Altitude",
    value: nearMoon ? aboveMoon : aboveEarth,
    unit: "km",
    digits: 1,
    body: nearMoon ? "Moon" : "Earth",
    datum: "mean radius",
    bodyRadius: nearMoon ? MOON.radiusKm : EARTH.radiusKm,
  };
}

export function spacecraftPositionMetric(row: TrackedReadout, moon: CenteredPosition | null): CoordinatesMetric {
  const same = moonInSameFrame(row, moon);
  return {
    kind: "coordinates",
    id: `${row.id}-position`,
    label: "Position",
    system: "xyz",
    components: (["x", "y", "z"] as const).map((label, index) => ({ label, value: row.positionKm[index], unit: "km", digits: 0 })),
    frame: row.frame,
    origin: centreName(row.center),
    planViews: {
      references: same === null ? [] : [{ label: "Moon", xyz: [same.positionKm[0], same.positionKm[1], same.positionKm[2]] }],
    },
  };
}

/** The data's own discrepancy for the segment at this time, compared with the vehicle's largest. */
export function spacecraftDiscrepancyMetric(body: TrackedBody, timeUtcMs: number): UncertaintyMetric {
  const segment = discrepancyAt(body, timeUtcMs);
  const published = (body.positionDiscrepancies ?? []).flatMap((d) => (d.km === null ? [] : [d.km]));
  return {
    kind: "uncertainty",
    id: `${body.id}-discrepancy`,
    label: "Position discrepancy",
    value: segment?.km ?? null,
    unit: "km",
    digits: 1,
    context: segment?.basis ?? "outside the reconstructed segments",
    unavailable: "not published",
    ...(published.length === 0 ? {} : { scale: { max: Math.max(...published), basis: "this vehicle's reconstruction" } }),
  };
}


export interface TrackedMetricSources {
  readonly bodies: readonly TrackedBody[];
  /** Earth-centred Moon trajectory, the reference every Earth-centred tracked body is measured against. */
  readonly moon: Trajectory;
}

/**
 * The info panel's range, speed and Moon-distance rows for one tracked body, from State only: scale policy and camera never
 * enter. A tracked body outside its bounds and any other id have none. The catalogued bodies' own rows are `bodyMetrics`'.
 */
export function createTrackedMetrics({ bodies, moon }: TrackedMetricSources) {
  const peaks = new Map(bodies.map((body) => [body.id, peakAnchorSpeedKmS(body)]));
  return (objectId: string, timeUtcMs: number): readonly Metric[] => {
    const body = bodies.find((candidate) => candidate.id === objectId);
    const row = body === undefined ? undefined : trackedReadouts([body], timeUtcMs)[0];
    if (row === undefined) return [];
    const moonState = moon.stateAt(timeUtcMs);
    return [
      spacecraftRangeMetric(row, referenceInSameFrame("Moon now", row, moonState)),
      spacecraftSpeedMetric(row, peaks.get(row.id) ?? null),
      spacecraftMoonMetric(row, moonState),
    ];
  };
}
