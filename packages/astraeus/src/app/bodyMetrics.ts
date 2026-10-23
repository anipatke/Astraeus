import type { BodyId, CenterId } from "../core/body";
import { directionToSun } from "../core/illumination";
import type { StateResolver } from "../core/stateResolver";
import type { Trajectory } from "../core/trajectory";
import { catalogue as builtInCatalogue, rootBodyId, type BodyCatalogue } from "../assets/catalogue";
import type { CoordinatesMetric, DistanceMetric, Metric, PhaseMetric } from "../shell/metrics";

/** The metrics a body can offer from State alone. */
export type BodyMetricKind = "distance" | "phase" | "coordinates";

const centreName = (center: string) => `${center.charAt(0).toUpperCase()}${center.slice(1)} centre`;

/**
 * A body's states as a Trajectory in its native centre, read from the resolver. The resolver stays the one source of
 * positions: a panel that wants "the Moon about Earth" asks it, not a second provider.
 */
export function resolverTrajectory(resolver: StateResolver, body: BodyId, defaultCenter: CenterId): Trajectory {
  return { body, stateAt: (timeUtcMs, center = defaultCenter) => resolver.stateOf(body, timeUtcMs, center) };
}

/** Distance between the centres of two catalogued bodies; id and wording are the metric's own. */
function distanceMetric(resolver: StateResolver, id: string, label: string, body: BodyId, from: BodyId, timeUtcMs: number): DistanceMetric {
  const state = resolver.stateOf(body, timeUtcMs, from);
  return {
    kind: "distance",
    id,
    label,
    value: Math.hypot(...state.positionKm),
    unit: "km",
    digits: 0,
    context: `centre to centre · ${state.frame}`,
  };
}

/** Fraction of the disc lit, seen from the parent: the angle at the body between the Sun and the parent. */
function phaseMetric(resolver: StateResolver, body: BodyId, parent: BodyId, parentLabel: string, label: string, timeUtcMs: number): PhaseMetric {
  const bodyFromParent = resolver.stateOf(body, timeUtcMs, parent);
  const toSun = directionToSun(bodyFromParent, resolver.sunFrom(parent, timeUtcMs));
  const length = Math.hypot(...bodyFromParent.positionKm);
  const toParent = bodyFromParent.positionKm.map((component) => -component / length);
  const cosine = toSun[0] * toParent[0] + toSun[1] * toParent[1] + toSun[2] * toParent[2];
  return {
    kind: "phase",
    id: `${body}-phase`,
    label,
    fraction: Math.max(0, Math.min(1, (1 + cosine) / 2)),
    context: `fraction of the disc lit, seen from ${parentLabel}'s centre`,
  };
}

function coordinatesMetric(resolver: StateResolver, body: BodyId, parent: BodyId, label: string, timeUtcMs: number): CoordinatesMetric {
  const state = resolver.stateOf(body, timeUtcMs, parent);
  return {
    kind: "coordinates",
    id: `${body}-position`,
    label,
    system: "xyz",
    components: (["x", "y", "z"] as const).map((component, index) => ({ label: component, value: state.positionKm[index], unit: "km", digits: 0 })),
    frame: state.frame,
    origin: centreName(parent),
    planViews: { references: [] },
  };
}

/**
 * Metrics of catalogued bodies, from State only (scale policy and camera never enter). A body whose parent is among `ids`
 * reports its distance from it; a parent reports its distance to each child among `ids`; a body orbiting something other
 * than the root also reports its phase and position. A body that is not among `ids`, or an unknown id, has none, and a
 * body never reads a body that is not among `ids`.
 */
export function bodyMetrics(
  resolver: StateResolver,
  ids: readonly BodyId[],
  kinds: readonly BodyMetricKind[] = ["distance", "phase", "coordinates"],
  source: BodyCatalogue = builtInCatalogue,
) {
  const wanted = new Set(kinds);
  const mounted = new Set(ids);
  const root = rootBodyId(source);
  return (objectId: string, timeUtcMs: number): readonly Metric[] => {
    if (!mounted.has(objectId) || !source.has(objectId)) return [];
    const { definition } = source.get(objectId);
    const parent = definition.parentId !== undefined && mounted.has(definition.parentId) ? source.get(definition.parentId).definition : undefined;
    const metrics: Metric[] = [];
    if (wanted.has("distance")) {
      for (const child of source.definitions()) {
        if (child.parentId === objectId && mounted.has(child.id)) {
          metrics.push(distanceMetric(resolver, `${objectId}-to-${child.id}`, `Distance to ${child.label}`, child.id, objectId, timeUtcMs));
        }
      }
      if (parent !== undefined) metrics.push(distanceMetric(resolver, `${objectId}-range`, `Distance from ${parent.label}`, objectId, parent.id, timeUtcMs));
    }
    if (parent !== undefined && parent.id !== root) {
      if (wanted.has("phase")) metrics.push(phaseMetric(resolver, objectId, parent.id, parent.label, `Geometric ${definition.label} illumination`, timeUtcMs));
      if (wanted.has("coordinates")) metrics.push(coordinatesMetric(resolver, objectId, parent.id, `${definition.label} position`, timeUtcMs));
    }
    return metrics;
  };
}
