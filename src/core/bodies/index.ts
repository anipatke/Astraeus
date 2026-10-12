import type { CelestialBodyDefinition, StateSourceBinding } from "../body";
import { MoonTrajectory } from "../moonTrajectory";
import { createPlanetSunTrajectory } from "./planetTrajectory";
import { createEarthSunTrajectory } from "../sunCentredSources";
import { EARTH } from "./earth";
import { MOON } from "./moon";
import { IO, IO_BINDING } from "./io";
import { JUPITER, JUPITER_ROTATION } from "./jupiter";
import { MARS, MARS_ROTATION } from "./mars";
import { MERCURY, MERCURY_ROTATION } from "./mercury";
import { SUN } from "./sun";
import { VENUS, VENUS_ROTATION } from "./venus";

export { EARTH, EARTH_EPHEMERIS } from "./earth";
export { MOON, MOON_EPHEMERIS } from "./moon";
export { SUN } from "./sun";
export { IO } from "./io";
export { JUPITER, JUPITER_EPHEMERIS, JUPITER_ROTATION } from "./jupiter";
export { MARS, MARS_EPHEMERIS, MARS_ROTATION } from "./mars";
export { MERCURY, MERCURY_EPHEMERIS, MERCURY_ROTATION } from "./mercury";
export { VENUS, VENUS_EPHEMERIS, VENUS_ROTATION } from "./venus";

/** Every body the engine knows, defined once. */
export const BUILT_IN_BODIES: readonly CelestialBodyDefinition[] = Object.freeze([SUN, EARTH, MOON, MERCURY, VENUS, MARS, JUPITER, IO]);

/** One state source per non-root body; the Sun is the root and has none. */
export const BUILT_IN_BINDINGS: readonly StateSourceBinding[] = Object.freeze([
  Object.freeze<StateSourceBinding>({ body: EARTH.id, create: createEarthSunTrajectory }),
  Object.freeze<StateSourceBinding>({ body: MOON.id, create: (adapter) => new MoonTrajectory(adapter) }),
  Object.freeze<StateSourceBinding>({ body: MERCURY.id, create: (adapter) => createPlanetSunTrajectory("mercury", MERCURY_ROTATION, adapter) }),
  Object.freeze<StateSourceBinding>({ body: VENUS.id, create: (adapter) => createPlanetSunTrajectory("venus", VENUS_ROTATION, adapter) }),
  Object.freeze<StateSourceBinding>({ body: MARS.id, create: (adapter) => createPlanetSunTrajectory("mars", MARS_ROTATION, adapter) }),
  Object.freeze<StateSourceBinding>({ body: JUPITER.id, create: (adapter) => createPlanetSunTrajectory("jupiter", JUPITER_ROTATION, adapter) }),
  IO_BINDING,
]);
