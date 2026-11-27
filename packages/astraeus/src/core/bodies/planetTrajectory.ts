import { makeState, transform } from "@lizard-isana/orb/frames";
import { AstroInstant } from "@lizard-isana/orb/time";
import type { AstronomyAdapter, PlanetId } from "../astronomyAdapter";
import type { BodyId, CenterId, StateSourceBinding } from "../body";
import { AU_KM } from "../constants";
import type { ChebyshevEphemeris } from "../chebyshevEphemeris";
import { type IauRotationElements, iauOrientation } from "../iauRotation";
import { NotLoadedError, PlanetFitsUncoveredError, type PlanetModel } from "../planetSeries";
import { TimeScaleOutOfRangeError } from "../timeScale";
import { assertUtcUnixMs, createState, EQJ, type State } from "../state";
import { processMoonData } from "../moonData";
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
  return sunTrajectory(
    planet,
    rotation,
    adapter,
    (timeUtcMs) => adapter.planetPositionFromSunKm(planet, timeUtcMs),
    offsetKm,
  );
}

/** A Sun-centred body placed by `positionKm` (EQJ km) and turned by its IAU rotation: the one trajectory the planets and the package-series bodies share. */
function sunTrajectory(
  body: BodyId,
  rotation: IauRotationElements,
  adapter: AstronomyAdapter,
  positionKm: (timeUtcMs: number) => Float64Array,
  offsetKm?: (timeUtcMs: number) => ArrayLike<number> | null,
): Trajectory {
  return Object.freeze({
    body,
    stateAt(timeUtcMs: number, center: CenterId = "sun"): State {
      if (center !== "sun")
        throw new RangeError(
          `${body} is Sun-centred; centre "${center}" is not offered, the state resolver recentres it`,
        );
      assertUtcUnixMs(timeUtcMs);
      const position = positionKm(timeUtcMs);
      const offset = offsetKm?.(timeUtcMs);
      if (offset !== undefined && offset !== null)
        for (let axis = 0; axis < 3; axis += 1) position[axis] += offset[axis];
      return createState({
        body,
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
export function planetBinding(
  planet: PlanetId,
  rotation: IauRotationElements,
  system?: BarycentreOffsetSource,
): StateSourceBinding {
  const offsetKm = system === undefined ? undefined : barycentreOffsetKm(system);
  return Object.freeze<StateSourceBinding>({
    body: planet,
    create: (adapter, moonData) => {
      if (moonData === undefined) return createPlanetSunTrajectory(planet, rotation, adapter, offsetKm);
      // A scene's planet reads only its own scene's system (the planet's id is its moon system's centre); none loaded there leaves it at the barycentre.
      return createPlanetSunTrajectory(planet, rotation, adapter, (timeUtcMs) => {
        const own = moonData.system(planet);
        return own === undefined ? null : barycentreOffsetKm(own)(timeUtcMs);
      });
    },
  });
}

/**
 * The binding of a Sun-circling body whose positions a data package hands in (`DataSource.bodyPositions`): `installData` reads the series, in the
 * planet-fit format, into the scene's selection only when the scene holds the body, and this places the body from it, Sun-centred and turned by
 * `rotation`. Before then, or with no scene, it throws `NotLoadedError` (the public `missing-data`). A body definition names this as its one binding.
 */
export function packageSeriesBinding(body: BodyId, rotation: IauRotationElements): StateSourceBinding {
  return Object.freeze<StateSourceBinding>({
    body,
    create: (adapter, moonData) =>
      sunTrajectory(body, rotation, adapter, (timeUtcMs) => {
        const model = (moonData ?? processMoonData).series(body);
        if (model === undefined)
          throw new NotLoadedError(
            `the positions of ${body} are not loaded: pass its data package to mount or scene.load`,
          );
        const { x, y, z } = xyzOrSpanError(body, model, timeUtcMs);
        // The same ecliptic-J2000 to EQJ turn the astronomy adapter gives the planet series.
        const state = makeState({
          t: AstroInstant.fromUnixMs(timeUtcMs),
          frame: "ecliptic-j2000",
          center: "sun",
          r: [x * AU_KM, y * AU_KM, z * AU_KM],
        });
        return Float64Array.from(transform(state, { frame: "equatorial-j2000" }).r);
      }),
  });
}

/** The model's position, or, outside its years, the error carrying the body's own span, so the message names its years and not the built-in planets'. */
function xyzOrSpanError(body: BodyId, model: PlanetModel, timeUtcMs: number): ReturnType<PlanetModel["xyz"]> {
  const date = new Date(timeUtcMs);
  try {
    return model.xyz(date);
  } catch (error) {
    if (
      model.span !== undefined &&
      (error instanceof TimeScaleOutOfRangeError || error instanceof PlanetFitsUncoveredError)
    )
      throw new PlanetFitsUncoveredError(date, model.span, body);
    throw error;
  }
}
