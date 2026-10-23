import { bodyMetrics, resolverTrajectory } from "../../../../astraeus/src/app/bodyMetrics";
import { createTrackedMetrics } from "../../../../astraeus/src/experiences/apollo11/spacecraftMetrics";
import type { TrackedBody } from "../../../../astraeus/src/app/mission";
import type { StateResolver } from "../../../../astraeus/src/core/stateResolver";
import type { Metric } from "../../../../astraeus/src/shell/metrics";

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
