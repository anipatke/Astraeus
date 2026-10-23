import type { BodyId } from "../core/body";
import type { StateResolver } from "../core/stateResolver";
import { catalogue as builtInCatalogue, type BodyCatalogue } from "../assets/catalogue";
import type { CenteredPosition } from "../core/state";
import { discrepancyAt, trackedReadouts, type TrackedBody, type TrackedReadout } from "./mission";
import type {
  AltitudeMetric,
  DistanceMetric,
  Metric,
  MetricReference,
  RelativeDistanceMetric,
  SpeedMetric,
  UncertaintyMetric,
} from "../shell/metrics";

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

/** A body a path's readouts are measured against: its id, its name and its mean radius. */
export interface ReadoutTarget {
  readonly id: string;
  readonly label: string;
  readonly radiusKm: number;
}

/** The target's state when it shares the path's centre and frame, otherwise null. */
export function inSameFrame(row: Pick<TrackedReadout, "frame" | "center">, state: CenteredPosition | null): CenteredPosition | null {
  return state !== null && state.center === row.center && state.frame === row.frame ? state : null;
}

export const separationKm = (a: readonly number[], b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Centre-to-centre distance from the path to a body, drawn in that body's radii. */
export function pathDistanceMetric(row: TrackedReadout, target: ReadoutTarget, state: CenteredPosition | null): RelativeDistanceMetric {
  const same = inSameFrame(row, state);
  return {
    kind: "relative-distance",
    id: `${row.id}-to-${target.id}`,
    label: `Distance to ${target.label}`,
    value: same === null ? null : separationKm(row.positionKm, same.positionKm),
    unit: "km",
    digits: 0,
    from: row.label,
    to: target.label,
    targetRadius: target.radiusKm,
    context: `centre to centre · ${row.frame}`,
    unavailable: `no ${target.label} state in this frame`,
  };
}

/** Height above a body's mean radius (not terrain: on the surface the value can be negative); null when the body has no state in the path's frame. */
export function pathAltitudeMetric(row: TrackedReadout, target: ReadoutTarget, state: CenteredPosition | null): AltitudeMetric {
  const same = inSameFrame(row, state);
  const away = same === null ? null : separationKm(row.positionKm, same.positionKm);
  return {
    kind: "altitude",
    id: `${row.id}-altitude-${target.id}`,
    label: `Altitude above ${target.label}`,
    value: away === null ? null : away - target.radiusKm,
    unit: "km",
    digits: 1,
    body: target.label,
    datum: "mean radius",
    bodyRadius: target.radiusKm,
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


/** One bar on a path's info card. */
export type ReadoutSpec =
  | { readonly kind: "range"; readonly marker?: BodyId }
  | { readonly kind: "speed" }
  | { readonly kind: "distance"; readonly to: BodyId }
  | { readonly kind: "altitude"; readonly above: BodyId };

export interface PathReadouts {
  readonly body: TrackedBody;
  readonly readouts: readonly ReadoutSpec[];
}

const targetOf = (id: BodyId, source: BodyCatalogue): ReadoutTarget => ({ id, label: source.get(id).definition.label, radiusKm: source.get(id).definition.radiusKm });

/**
 * The info card's bars for paths that ask for readouts, from State only. Range is from the path's centre body; a named body is read from the
 * resolver about that centre, so it shares the path's frame. A path outside its bounds and any other id have none.
 */
export function createReadoutMetrics(paths: readonly PathReadouts[], resolver: StateResolver, source: BodyCatalogue = builtInCatalogue) {
  const peaks = new Map(paths.map(({ body }) => [body.id, peakAnchorSpeedKmS(body)]));
  return (objectId: string, timeUtcMs: number): readonly Metric[] => {
    const path = paths.find(({ body }) => body.id === objectId);
    const row = path === undefined ? undefined : trackedReadouts([path.body], timeUtcMs)[0];
    if (path === undefined || row === undefined) return [];
    const stateOf = (id: BodyId): CenteredPosition => (id === row.center ? { body: id, center: row.center, timeUtcMs, frame: row.frame, positionKm: new Float64Array(3) } : resolver.stateOf(id, timeUtcMs, row.center));
    return path.readouts.map((spec): Metric => {
      switch (spec.kind) {
        case "range": return spacecraftRangeMetric(row, spec.marker === undefined ? null : referenceInSameFrame(`${targetOf(spec.marker, source).label} now`, row, stateOf(spec.marker)));
        case "speed": return spacecraftSpeedMetric(row, peaks.get(row.id) ?? null);
        case "distance": return pathDistanceMetric(row, targetOf(spec.to, source), stateOf(spec.to));
        case "altitude": return pathAltitudeMetric(row, targetOf(spec.above, source), stateOf(spec.above));
      }
    });
  };
}
