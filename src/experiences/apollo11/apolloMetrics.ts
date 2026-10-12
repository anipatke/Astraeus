import { bodyMetrics, resolverTrajectory } from "../../app/bodyMetrics";
import { createTrackedMetrics } from "./spacecraftMetrics";
import type { TrackedBody } from "../../app/mission";
import type { StateResolver } from "../../core/stateResolver";
import type { Metric } from "../../shell/metrics";

/**
 * Apollo's info-panel rows: Earth's and the Moon's distances (the catalogue's rows, without phase or position, which the
 * mission panels draw their own way) and, for each spacecraft, range, speed and distance to the Moon. All from the resolver.
 */
export function apolloMetrics(bodies: readonly TrackedBody[], resolver: StateResolver) {
  const catalogued = bodyMetrics(resolver, ["earth", "moon"], ["distance"]);
  const spacecraft = createTrackedMetrics({ bodies, moon: resolverTrajectory(resolver, "moon", "earth") });
  return (objectId: string, timeUtcMs: number): readonly Metric[] => {
    const own = catalogued(objectId, timeUtcMs);
    return own.length > 0 ? own : spacecraft(objectId, timeUtcMs);
  };
}
