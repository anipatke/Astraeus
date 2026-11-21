/**
 * Jupiter's moons from the core curve-fit set (`data/ephemerides/jupiter-moons/`, JPL Horizons, T-096): Jupiter is one configuration of the
 * generic moon-system loader (`moonSystem.ts`, O-033 T-116), the bindings of the four mapped moons, and the names the Jupiter experience and its
 * tests already use. Core data: any experience may load it; which bodies it shows is the experience's choice (O-025 Decision 8).
 */
import type { BodyId, StateSourceBinding } from "../body";
import { iauElementsFromRecord } from "../iauRotation";
import type { TimeBounds } from "../trajectory";
import { recordPeriodDays } from "../siderealPeriod";
import { JUPITER } from "./jupiter";
import {
  chunksNeeded,
  createMoonSystem,
  HISTORICAL_MOON_FIT_SPAN,
  moonFitSource,
  type MoonSystemLoad,
} from "./moonSystem";
import callistoOrbit from "../../../data/orbits/callisto.json" with { type: "json" };
import europaOrbit from "../../../data/orbits/europa.json" with { type: "json" };
import ganymedeOrbit from "../../../data/orbits/ganymede.json" with { type: "json" };
import ioOrbit from "../../../data/orbits/io.json" with { type: "json" };

/** The span the committed fits cover (T-096: 2010-01-01 to 2030-01-01 TDB, chunked per calendar year). */
export const JUPITER_MOON_FIT_SPAN: TimeBounds = HISTORICAL_MOON_FIT_SPAN;

export const JUPITER_MOON_FIT_SOURCE = moonFitSource("Jupiter");

export const JUPITER_MOON_SYSTEM = createMoonSystem({
  centre: "jupiter",
  centreLabel: "Jupiter",
  centreGmKm3S2: JUPITER.gmKm3S2!,
  ephemerisName: "jup365_merged",
  fitSource: JUPITER_MOON_FIT_SOURCE,
});

export { chunksNeeded };
export type JupiterMoonLoad = MoonSystemLoad;

/** The loaded set; throws before `loadJupiterMoons` resolved rather than drawing a moon from nothing. */
export const jupiterMoonEphemeris = JUPITER_MOON_SYSTEM.ephemeris;
/** Hands in a set built elsewhere (tests read the committed chunks from disk). */
export const installJupiterMoonEphemeris = JUPITER_MOON_SYSTEM.install;
export const loadJupiterMoons = JUPITER_MOON_SYSTEM.load;
export const osculatingPeriodMs = JUPITER_MOON_SYSTEM.osculatingPeriodMs;

/** What every mapped Jupiter moon's record says about its position, with its own worst figure from T-096. */
export const fittedMoonPosition = JUPITER_MOON_SYSTEM.position;

/** The Galilean moons turn synchronously: their prime meridians are the IAU records saved with their orbits (`data/orbits/`), the one source. */
export const IO_ROTATION = iauElementsFromRecord(ioOrbit.rotation);
const jupiterMoon = (
  id: BodyId,
  label: string,
  radiusKm: number,
  gmKm3S2: number,
  worstM: number,
  header: string,
  orbit: Parameters<typeof recordPeriodDays>[0] & { rotation: Parameters<typeof iauElementsFromRecord>[0] },
) =>
  JUPITER_MOON_SYSTEM.mappedMoon({
    id,
    label,
    radiusKm,
    gmKm3S2,
    worstM,
    header,
    orbitPeriodDays: recordPeriodDays(orbit),
    span: HISTORICAL_MOON_FIT_SPAN,
    rotation: iauElementsFromRecord(orbit.rotation),
  });

const EUROPA_MOON = jupiterMoon(
  "europa",
  "Europa",
  1560.8,
  3202.7121,
  0.163,
  "Mean radius (km) = 1560.8 +- 0.3, GM (km^3/s^2) = 3202.7121 +- 0.0054",
  europaOrbit,
);
const GANYMEDE_MOON = jupiterMoon(
  "ganymede",
  "Ganymede",
  2631.2,
  9887.8328,
  0.1206,
  "Mean radius (km) = 2631.2 +- 1.7, GM (km^3/s^2) = 9887.8328 +- 0.0074",
  ganymedeOrbit,
);
const CALLISTO_MOON = jupiterMoon(
  "callisto",
  "Callisto",
  2410.3,
  7179.2834,
  0.0947,
  "Mean radius (km) = 2410.3 +- 1.5, GM (km^3/s^2) = 7179.2834 +- 0.0097",
  callistoOrbit,
);

export const EUROPA = EUROPA_MOON.definition;
export const GANYMEDE = GANYMEDE_MOON.definition;
export const CALLISTO = CALLISTO_MOON.definition;

/** Io's definition and binding are in `io.ts` (both from `IO_ROTATION`); each of the three below is one record of facts giving both. */
export const MAPPED_MOON_BINDINGS: readonly StateSourceBinding[] = Object.freeze([
  EUROPA_MOON.binding,
  GANYMEDE_MOON.binding,
  CALLISTO_MOON.binding,
]);
