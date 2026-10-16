import type { AstronomyAdapter, PlanetId } from "../astronomyAdapter";
import type { CenterId } from "../body";
import { type IauRotationElements, iauOrientation } from "../iauRotation";
import { assertUtcUnixMs, createState, EQJ, type State } from "../state";
import type { Trajectory } from "../trajectory";

/**
 * A planet in its one native centre, the Sun: VSOP87A position and IAU-rotation orientation from the adapter's time scale.
 * No velocity is modelled (a State carries none from this source), so a planet has no speed readout.
 */
export function createPlanetSunTrajectory(
  planet: PlanetId,
  rotation: IauRotationElements,
  adapter: AstronomyAdapter,
): Trajectory {
  return Object.freeze({
    body: planet,
    stateAt(timeUtcMs: number, center: CenterId = "sun"): State {
      if (center !== "sun") throw new RangeError(`${planet} is Sun-centred; centre "${center}" is not offered, the state resolver recentres it`);
      assertUtcUnixMs(timeUtcMs);
      return createState({
        body: planet,
        center: "sun",
        timeUtcMs,
        frame: EQJ,
        positionKm: adapter.planetPositionFromSunKm(planet, timeUtcMs),
        orientation: iauOrientation(rotation, adapter.daysSinceJ2000Tt(timeUtcMs)),
      });
    },
  });
}
