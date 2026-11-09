import type { AstronomyAdapter, PlanetId } from "../astronomyAdapter";
import type { CenterId, StateSourceBinding } from "../body";
import type { ChebyshevEphemeris } from "../chebyshevEphemeris";
import { type IauRotationElements, iauOrientation } from "../iauRotation";
import { assertUtcUnixMs, createState, EQJ, type State } from "../state";
import type { Trajectory } from "../trajectory";

/**
 * A planet in its one native centre, the Sun: the planet series position (the system barycentre, from JPL Horizons) and IAU-rotation orientation
 * from the adapter's time scale. No velocity is modelled (a State carries none from this source), so a planet has no speed readout.
 * `offsetKm`, when given and not null at a time, is added to the series position: the planet's own offset from its system's barycentre,
 * available only once its moon system's fits are loaded.
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
        plane: EQJ,
        positionKm: position,
        orientation: iauOrientation(rotation, adapter.daysSinceJ2000Tt(timeUtcMs)),
      });
    },
  });
}

/** The part of a moon system the planet binding reads: whether a set is installed, and the set. */
export interface BarycentreOffsetSource {
  isLoaded(): boolean;
  ephemeris(): ChebyshevEphemeris;
}

/**
 * The planet's own offset from its system barycentre at `timeUtcMs`, from its moon system's centre series, or null while the system is not loaded
 * or the time lies outside the loaded chunks (the planet then stays at the barycentre, which its position record says).
 */
export function barycentreOffsetKm(system: BarycentreOffsetSource): (timeUtcMs: number) => ArrayLike<number> | null {
  return (timeUtcMs) => {
    if (!system.isLoaded()) return null;
    try {
      return system.ephemeris().centreOffsetKm(timeUtcMs);
    } catch {
      return null;
    }
  };
}

/**
 * The one planet binding (O-063 T-290; Pluto's since O-033 T-116): the planet series gives the system barycentre, and a planet with a moon system
 * adds its own offset from that barycentre once the system's fits are loaded. Mercury and Venus have no moon system: barycentre and centre agree.
 */
export function planetBinding(planet: PlanetId, rotation: IauRotationElements, system?: BarycentreOffsetSource): StateSourceBinding {
  const offsetKm = system === undefined ? undefined : barycentreOffsetKm(system);
  return Object.freeze<StateSourceBinding>({ body: planet, create: (adapter) => createPlanetSunTrajectory(planet, rotation, adapter, offsetKm) });
}
