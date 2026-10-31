/**
 * The one rule that turns a slim-table entry (`listedMoons.ts`) into a catalogue body (O-049 T-211): its planet's moon system builds the definition and the
 * state source, from the table's mean radius and period. Nothing here names a moon. The result is made only when a scene adds the moon, so a moon nobody adds costs nothing.
 * Detailed moons (`planetMoons.ts`, `jupiterMoons.ts`) are defined by hand and are in the built-in catalogue first, so they win.
 */
import type { CelestialBodyDefinition, StateSourceBinding } from "../body";
import { JUPITER_MOON_SYSTEM } from "./jupiterMoons";
import { listedMoon, type ListedMoon } from "./listedMoons";
import { HISTORICAL_MOON_FIT_SPAN, type MoonSystem } from "./moonSystem";
import { MARS_MOON_SYSTEM, NEPTUNE_MOON_SYSTEM, PLUTO_MOON_SYSTEM, SATURN_MOON_SYSTEM, URANUS_MOON_SYSTEM } from "./planetMoons";

/** Each planet's moon system by planet id: the loader every moon of that planet shares. */
export const MOON_SYSTEMS: Readonly<Record<string, MoonSystem>> = Object.freeze({
  jupiter: JUPITER_MOON_SYSTEM,
  saturn: SATURN_MOON_SYSTEM,
  uranus: URANUS_MOON_SYSTEM,
  neptune: NEPTUNE_MOON_SYSTEM,
  mars: MARS_MOON_SYSTEM,
  pluto: PLUTO_MOON_SYSTEM,
});

export interface ListedMoonBody {
  readonly definition: CelestialBodyDefinition;
  readonly binding: StateSourceBinding;
}

const RADIUS_SOURCE = "JPL SSD satellite physical parameters (https://ssd.jpl.nasa.gov/sats/phys_par/), mean radius";
const PERIOD_SOURCE = "JPL SSD satellite mean elements (https://ssd.jpl.nasa.gov/sats/elem/), sidereal period P";

/** The definition and state source of a listed moon: a sphere at its mean radius, positioned from its planet's fits, with the table's period when it has one. */
export function listedMoonBody(moon: ListedMoon): ListedMoonBody {
  const system = MOON_SYSTEMS[moon.parent];
  if (system === undefined) throw new RangeError(`${moon.id}: no moon system for "${moon.parent}"`);
  const definition = system.mappedMoon({
    id: moon.id,
    label: moon.label,
    radiusKm: moon.meanRadiusKm,
    ...(moon.orbitPeriodDays === null ? {} : { orbitPeriodDays: moon.orbitPeriodDays }),
    ...(moon.early ? { span: HISTORICAL_MOON_FIT_SPAN } : {}),
    header: `${RADIUS_SOURCE}${moon.orbitPeriodDays === null ? "" : `; ${PERIOD_SOURCE}`}`,
    dimensionsNote: `Mean radius ${moon.meanRadiusKm} km (${RADIUS_SOURCE}); ${moon.label} is drawn as a sphere at that radius. No gravitational parameter is held, and its rotation is not modelled: the sphere is turned to keep one face to ${system.config.centreLabel}.`,
  });
  return Object.freeze({ definition, binding: system.binding(moon.id) });
}

/** The body for a moon id, or undefined when the table does not list it. */
export const listedMoonBodyOf = (id: string): ListedMoonBody | undefined => {
  const moon = listedMoon(id);
  return moon === undefined ? undefined : listedMoonBody(moon);
};
