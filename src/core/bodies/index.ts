import type { CelestialBodyDefinition, StateSourceBinding } from "../body";
import { MoonTrajectory } from "../moonTrajectory";
import { createEarthSunTrajectory } from "../sunCentredSources";
import { EARTH } from "./earth";
import { MOON } from "./moon";
import { SUN } from "./sun";

export { EARTH, EARTH_EPHEMERIS } from "./earth";
export { MOON, MOON_EPHEMERIS } from "./moon";
export { SUN } from "./sun";

/** Every body the engine knows, defined once. */
export const BUILT_IN_BODIES: readonly CelestialBodyDefinition[] = Object.freeze([SUN, EARTH, MOON]);

/** One state source per non-root body; the Sun is the root and has none. */
export const BUILT_IN_BINDINGS: readonly StateSourceBinding[] = Object.freeze([
  Object.freeze<StateSourceBinding>({ body: EARTH.id, create: createEarthSunTrajectory }),
  Object.freeze<StateSourceBinding>({ body: MOON.id, create: (adapter) => new MoonTrajectory(adapter) }),
]);
