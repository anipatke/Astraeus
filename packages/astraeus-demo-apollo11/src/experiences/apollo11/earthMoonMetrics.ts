import { EARTH, MOON } from "astraeus/core/body";
import type { CenteredPosition } from "astraeus/core/state";
import type { Trajectory } from "astraeus/core/trajectory";
import type { TrackedBody, TrackedReadout } from "astraeus/app/mission";
import { trackedReadouts } from "astraeus/app/mission";
import {
  inSameFrame,
  pathDistanceMetric,
  peakAnchorSpeedKmS,
  referenceInSameFrame,
  separationKm,
  spacecraftRangeMetric,
  spacecraftSpeedMetric,
} from "astraeus/app/trackedMetrics";
import type { AltitudeMetric, CoordinatesMetric, Metric, RelativeDistanceMetric } from "astraeus/shell/metrics";

const centreName = (center: string) => `${center.charAt(0).toUpperCase()}${center.slice(1)} centre`;

const MOON_TARGET = { id: "moon", label: "Moon", radiusKm: MOON.radiusKm };

/** Centre-to-centre distance from the spacecraft to the Moon, drawn in Moon radii. */
export function spacecraftMoonMetric(row: TrackedReadout, moon: CenteredPosition | null): RelativeDistanceMetric {
  return pathDistanceMetric(row, MOON_TARGET, moon);
}

/**
 * Height above the mean radius of whichever of Earth and the Moon is closer to the surface.
 * Mean radius, not terrain: on the lunar surface the value can be negative.
 */
export function spacecraftAltitudeMetric(row: TrackedReadout, moon: CenteredPosition | null): AltitudeMetric {
  const aboveEarth = row.rangeFromEarthKm - EARTH.radiusKm;
  const same = inSameFrame(row, moon);
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
  const same = inSameFrame(row, moon);
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
