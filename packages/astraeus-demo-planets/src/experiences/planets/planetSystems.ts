import type { PlanetSystem } from "./planetDefinition";

// The planets' system modules, loaded lazily: a planet's system (moon list, positions, pictures) is fetched only for the chosen one.
// The public build offers Jupiter alone (owner, 2026-10-22): its glob names only Jupiter's file, so Vite leaves the other eight planets' systems out of the bundle.
// This sits in the planets package so the site reaches the demo's code through its declared entry, not by a path into `src/` (I-076).
const FILES = __PUBLIC_BUILD__
  ? import.meta.glob<Record<string, PlanetSystem>>("./systems/jupiter.ts")
  : import.meta.glob<Record<string, PlanetSystem>>("./systems/*.ts");

/** The loader for each system module, keyed by the system name the settings file names (`jupiter`, `saturn`, ...). */
export const PLANET_SYSTEMS: Readonly<Record<string, () => Promise<Record<string, PlanetSystem>>>> = Object.fromEntries(
  Object.entries(FILES).map(([path, load]) => [path.slice(path.lastIndexOf("/") + 1, -".ts".length), load]),
);
