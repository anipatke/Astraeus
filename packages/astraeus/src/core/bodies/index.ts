import type { CelestialBodyDefinition, StateSourceBinding } from "../body";
import { MoonTrajectory } from "../moonTrajectory";
import { createPlanetSunTrajectory } from "./planetTrajectory";
import { createEarthSunTrajectory } from "../sunCentredSources";
import { EARTH } from "./earth";
import { MOON } from "./moon";
import { IO, IO_BINDING } from "./io";
import { CALLISTO, EUROPA, GANYMEDE, MAPPED_MOON_BINDINGS } from "./jupiterMoons";
import { JUPITER, JUPITER_ROTATION } from "./jupiter";
import { MARS, MARS_ROTATION } from "./mars";
import { MERCURY, MERCURY_ROTATION } from "./mercury";
import { NEPTUNE, NEPTUNE_ROTATION, PLUTO, SATURN, SATURN_ROTATION, URANUS, URANUS_ROTATION } from "./outerPlanets";
import { PLANET_MOON_BINDINGS, PLANET_MOON_DEFINITIONS, PLUTO_BINDING } from "./planetMoons";
import { SUN } from "./sun";
import { SWIFT_TUTTLE, SWIFT_TUTTLE_BINDING } from "./swiftTuttle";
import { VENUS, VENUS_ROTATION } from "./venus";

export { EARTH, EARTH_EPHEMERIS } from "./earth";
export { MOON, MOON_EPHEMERIS } from "./moon";
export { SUN } from "./sun";
export { SWIFT_TUTTLE, SWIFT_TUTTLE_SAMPLING } from "./swiftTuttle";
export { IO } from "./io";
export { CALLISTO, EUROPA, GANYMEDE } from "./jupiterMoons";
export { JUPITER, JUPITER_EPHEMERIS, JUPITER_ROTATION } from "./jupiter";
export { MARS, MARS_EPHEMERIS, MARS_ROTATION } from "./mars";
export { MERCURY, MERCURY_EPHEMERIS, MERCURY_ROTATION } from "./mercury";
export { NEPTUNE, PLUTO, SATURN, URANUS } from "./outerPlanets";
export { VENUS, VENUS_EPHEMERIS, VENUS_ROTATION } from "./venus";

/** Every body the engine knows, defined once. */
export const BUILT_IN_BODIES: readonly CelestialBodyDefinition[] = Object.freeze([SUN, EARTH, MOON, MERCURY, VENUS, MARS, JUPITER, IO, EUROPA, GANYMEDE, CALLISTO, SATURN, URANUS, NEPTUNE, PLUTO, ...PLANET_MOON_DEFINITIONS, SWIFT_TUTTLE]);

/** One state source per non-root body; the Sun is the root and has none. */
export const BUILT_IN_BINDINGS: readonly StateSourceBinding[] = Object.freeze([
  Object.freeze<StateSourceBinding>({ body: EARTH.id, create: createEarthSunTrajectory }),
  Object.freeze<StateSourceBinding>({ body: MOON.id, create: (adapter) => new MoonTrajectory(adapter) }),
  Object.freeze<StateSourceBinding>({ body: MERCURY.id, create: (adapter) => createPlanetSunTrajectory("mercury", MERCURY_ROTATION, adapter) }),
  Object.freeze<StateSourceBinding>({ body: VENUS.id, create: (adapter) => createPlanetSunTrajectory("venus", VENUS_ROTATION, adapter) }),
  Object.freeze<StateSourceBinding>({ body: MARS.id, create: (adapter) => createPlanetSunTrajectory("mars", MARS_ROTATION, adapter) }),
  Object.freeze<StateSourceBinding>({ body: JUPITER.id, create: (adapter) => createPlanetSunTrajectory("jupiter", JUPITER_ROTATION, adapter) }),
  Object.freeze<StateSourceBinding>({ body: SATURN.id, create: (adapter) => createPlanetSunTrajectory("saturn", SATURN_ROTATION, adapter) }),
  Object.freeze<StateSourceBinding>({ body: URANUS.id, create: (adapter) => createPlanetSunTrajectory("uranus", URANUS_ROTATION, adapter) }),
  Object.freeze<StateSourceBinding>({ body: NEPTUNE.id, create: (adapter) => createPlanetSunTrajectory("neptune", NEPTUNE_ROTATION, adapter) }),
  PLUTO_BINDING,
  IO_BINDING,
  ...MAPPED_MOON_BINDINGS,
  ...PLANET_MOON_BINDINGS,
  SWIFT_TUTTLE_BINDING,
]);
