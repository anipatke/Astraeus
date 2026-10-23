/**
 * Jupiter's moons from the core curve-fit set (`data/ephemerides/jupiter-moons/`, JPL Horizons, T-096): Jupiter is one configuration of the
 * generic moon-system loader (`moonSystem.ts`, O-033 T-116), the bindings of the four mapped moons, and the names the Jupiter experience and its
 * tests already use. Core data: any experience may load it; which bodies it shows is the experience's choice (O-025 Decision 8).
 */
import type { BodyId, StateSourceBinding } from "../body";
import { iauElementsFromRecord } from "../iauRotation";
import type { TimeBounds } from "../trajectory";
import { JUPITER } from "./jupiter";
import { chunksNeeded, createMoonSystem, MOON_FIT_SPAN, moonFitSource, type MoonSystemLoad } from "./moonSystem";
import { rotation as callistoRotation } from "../../../data/orbits/callisto.json";
import { rotation as europaRotation } from "../../../data/orbits/europa.json";
import { rotation as ganymedeRotation } from "../../../data/orbits/ganymede.json";
import { rotation as ioRotation } from "../../../data/orbits/io.json";

/** The span the committed fits cover (T-096: 2010-01-01 to 2030-01-01 TDB, chunked per calendar year). */
export const JUPITER_MOON_FIT_SPAN: TimeBounds = MOON_FIT_SPAN;

export const JUPITER_MOON_FIT_SOURCE = moonFitSource("Jupiter");

export const JUPITER_MOON_SYSTEM = createMoonSystem({
  centre: "jupiter",
  centreLabel: "Jupiter",
  centreGmKm3S2: JUPITER.gmKm3S2!,
  ephemerisName: "jup365_merged",
  fitSource: JUPITER_MOON_FIT_SOURCE,
  loadIndex: async () => (await import("../../../data/ephemerides/jupiter-moons/index.json")).default as unknown,
});

export { chunksNeeded };
export type JupiterMoonLoad = MoonSystemLoad;

/** The loaded set; throws before `loadJupiterMoons` resolved rather than drawing a moon from nothing. */
export const jupiterMoonEphemeris = JUPITER_MOON_SYSTEM.ephemeris;
/** Hands in a set built elsewhere (tests read the committed chunks from disk). */
export const installJupiterMoonEphemeris = JUPITER_MOON_SYSTEM.install;
export const loadJupiterMoons = JUPITER_MOON_SYSTEM.load;
export const osculatingPeriodMs = JUPITER_MOON_SYSTEM.osculatingPeriodMs;

export const FITTED_MOON_TIDAL_LOCK = JUPITER_MOON_SYSTEM.tidalLockNote;
/** What every mapped Jupiter moon's record says about its position, with its own worst figure from T-096. */
export const fittedMoonPosition = JUPITER_MOON_SYSTEM.position;

/** The Galilean moons turn synchronously: their prime meridians are the IAU records saved with their orbits (`data/orbits/`), the one source. */
export const IO_ROTATION = iauElementsFromRecord(ioRotation);
const jupiterMoon = (id: BodyId, label: string, radiusKm: number, gmKm3S2: number, worstM: number, header: string) => JUPITER_MOON_SYSTEM.mappedMoon({ id, label, radiusKm, gmKm3S2, worstM, header });

export const EUROPA = jupiterMoon("europa", "Europa", 1560.8, 3202.7121, 0.0755, "Mean radius (km) = 1560.8 +- 0.3, GM (km^3/s^2) = 3202.7121 +- 0.0054");
export const GANYMEDE = jupiterMoon("ganymede", "Ganymede", 2631.2, 9887.8328, 0.0662, "Mean radius (km) = 2631.2 +- 1.7, GM (km^3/s^2) = 9887.8328 +- 0.0074");
export const CALLISTO = jupiterMoon("callisto", "Callisto", 2410.3, 7179.2834, 0.0521, "Mean radius (km) = 2410.3 +- 1.5, GM (km^3/s^2) = 7179.2834 +- 0.0097");

/** Io's binding is in `io.ts` with its definition; the three below are the same pattern. */
export const IO_FITTED_BINDING: StateSourceBinding = JUPITER_MOON_SYSTEM.binding("io", IO_ROTATION);
export const MAPPED_MOON_BINDINGS: readonly StateSourceBinding[] = Object.freeze([
  JUPITER_MOON_SYSTEM.binding(EUROPA.id, iauElementsFromRecord(europaRotation)),
  JUPITER_MOON_SYSTEM.binding(GANYMEDE.id, iauElementsFromRecord(ganymedeRotation)),
  JUPITER_MOON_SYSTEM.binding(CALLISTO.id, iauElementsFromRecord(callistoRotation)),
]);
