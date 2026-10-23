import type { AstronomyAdapter, PlanetId } from "../astronomyAdapter";
import type { CenterId } from "../body";
import { type IauRotationElements, iauOrientation } from "../iauRotation";
import { assertUtcUnixMs, createState, EQJ, type State } from "../state";
import type { Trajectory } from "../trajectory";

/**
 * A planet in its one native centre, the Sun: VSOP87A position and IAU-rotation orientation from the adapter's time scale.
 * No velocity is modelled (a State carries none from this source), so a planet has no speed readout.
 * `offsetKm`, when given and not null at a time, is added to the series position: Pluto's own offset from its system's barycentre (the series
 * is the barycentre), available only once its system's fits are loaded.
 */
export function createPlanetSunTrajectory(
  planet: PlanetId,
  rotation: IauRotationElements,
  adapter: AstronomyAdapter,
  offsetKm?: (timeUtcMs: number) => ArrayLike<number> | null,
): Trajectory {
  return Object.freeze({
    body: planet,
    stateAt(timeUtcMs: number, center: CenterId = "sun"): State {
      if (center !== "sun") throw new RangeError(`${planet} is Sun-centred; centre "${center}" is not offered, the state resolver recentres it`);
      assertUtcUnixMs(timeUtcMs);
      const position = adapter.planetPositionFromSunKm(planet, timeUtcMs);
      const offset = offsetKm?.(timeUtcMs);
      if (offset !== undefined && offset !== null) for (let axis = 0; axis < 3; axis += 1) position[axis] += offset[axis];
      return createState({
        body: planet,
        center: "sun",
        timeUtcMs,
        frame: EQJ,
        positionKm: position,
        orientation: iauOrientation(rotation, adapter.daysSinceJ2000Tt(timeUtcMs)),
      });
    },
  });
}
