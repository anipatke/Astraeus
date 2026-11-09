import type { CelestialBodyDefinition, StateSourceBinding } from "../body";
import { MoonTrajectory } from "../moonTrajectory";
import { planetBinding } from "./planetTrajectory";
import { createEarthSunTrajectory } from "../sunCentredSources";
import { EARTH } from "./earth";
import { MOON } from "./moon";
import { IO, IO_BINDING } from "./io";
import { CALLISTO, EUROPA, GANYMEDE, JUPITER_MOON_SYSTEM, MAPPED_MOON_BINDINGS } from "./jupiterMoons";
import { JUPITER, JUPITER_ROTATION } from "./jupiter";
import { MARS, MARS_ROTATION } from "./mars";
import { MERCURY, MERCURY_ROTATION } from "./mercury";
import { NEPTUNE, NEPTUNE_ROTATION, PLUTO, PLUTO_ROTATION, SATURN, SATURN_ROTATION, URANUS, URANUS_ROTATION } from "./outerPlanets";
import { MARS_MOON_SYSTEM, NEPTUNE_MOON_SYSTEM, PLANET_MOON_BINDINGS, PLANET_MOON_DEFINITIONS, PLUTO_MOON_SYSTEM, SATURN_MOON_SYSTEM, URANUS_MOON_SYSTEM } from "./planetMoons";
import { SUN } from "./sun";
import { VENUS, VENUS_ROTATION } from "./venus";

export { EARTH, EARTH_EPHEMERIS } from "./earth";
export { MOON, MOON_EPHEMERIS } from "./moon";
export { SUN } from "./sun";
export { IO } from "./io";
export { CALLISTO, EUROPA, GANYMEDE } from "./jupiterMoons";
export { JUPITER, JUPITER_EPHEMERIS, JUPITER_ROTATION } from "./jupiter";
export { MARS, MARS_EPHEMERIS, MARS_ROTATION } from "./mars";
export { MERCURY, MERCURY_EPHEMERIS, MERCURY_ROTATION } from "./mercury";
export { NEPTUNE, PLUTO, SATURN, URANUS } from "./outerPlanets";
export { VENUS, VENUS_EPHEMERIS, VENUS_ROTATION } from "./venus";

/** Every body the engine knows, defined once. */
export const BUILT_IN_BODIES: readonly CelestialBodyDefinition[] = Object.freeze([SUN, EARTH, MOON, MERCURY, VENUS, MARS, JUPITER, IO, EUROPA, GANYMEDE, CALLISTO, SATURN, URANUS, NEPTUNE, PLUTO, ...PLANET_MOON_DEFINITIONS]);

/** One state source per non-root body; the Sun is the root and has none. */
export const BUILT_IN_BINDINGS: readonly StateSourceBinding[] = Object.freeze([
  Object.freeze<StateSourceBinding>({ body: EARTH.id, create: createEarthSunTrajectory }),
  Object.freeze<StateSourceBinding>({ body: MOON.id, create: (adapter) => new MoonTrajectory(adapter) }),
  // Each planet is its system barycentre plus, with its moon system loaded, its own offset from it (O-063 T-290).
  planetBinding("mercury", MERCURY_ROTATION),
  planetBinding("venus", VENUS_ROTATION),
  planetBinding("mars", MARS_ROTATION, MARS_MOON_SYSTEM),
  planetBinding("jupiter", JUPITER_ROTATION, JUPITER_MOON_SYSTEM),
  planetBinding("saturn", SATURN_ROTATION, SATURN_MOON_SYSTEM),
  planetBinding("uranus", URANUS_ROTATION, URANUS_MOON_SYSTEM),
  planetBinding("neptune", NEPTUNE_ROTATION, NEPTUNE_MOON_SYSTEM),
  planetBinding("pluto", PLUTO_ROTATION, PLUTO_MOON_SYSTEM),
  IO_BINDING,
  ...MAPPED_MOON_BINDINGS,
  ...PLANET_MOON_BINDINGS,
]);
