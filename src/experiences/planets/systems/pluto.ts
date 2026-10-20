// Pluto's system for the planets experience: its moon list, fitted positions, mapped pictures and tagged places. The words and numbers
// of the view are data/planets/pluto.json; this file only names where Pluto's data is.
import { PLUTO_MOON_CATALOGUE } from "../../../assets/bodies/outerPlanetCatalogues";
import { plutoMoonsSystem } from "../../../assets/compositions";
import { PLUTO_MOON_SYSTEM } from "../../../core/bodies/planetMoons";
import type { PlanetSystem } from "../planetDefinition";
import { chunkUrlsOf, packagesOf } from "../planetSystemParts";
import plutoFitErrors from "../../../../data/moons/fit-errors/pluto.json";

/** The tagged places of the mapped moons: each body package's features and categories, read as they are stored. */
const PACKAGES = import.meta.glob("../../../../data/bodies/{pluto,charon}/{features,categories}.json", { eager: true, import: "default" }) as Record<string, unknown>;

/** The fit chunks this build ships for Pluto: the window's year for every body (all of Pluto's moons orbit in under 40 days, so no earlier year is needed) (`tests/planetSystems.test.ts` proves the set equals what the window loads). */
const SHIPPED = {
  ...import.meta.glob("../../../../data/ephemerides/pluto-moons/*/2016.bin", { query: "?url", import: "default", eager: true }),
} as Record<string, string>;
export const PLUTO_CHUNK_URLS = chunkUrlsOf(SHIPPED, "pluto-moons");
export const PLUTO_MOON_IDS = PLUTO_MOON_CATALOGUE.moons.map((moon) => moon.id);

export const plutoSystem: PlanetSystem = {
  catalogue: PLUTO_MOON_CATALOGUE,
  composition: plutoMoonsSystem,
  ephemeris: PLUTO_MOON_SYSTEM.ephemeris,
  fitSource: PLUTO_MOON_SYSTEM.config.fitSource,
  tidalLockNote: PLUTO_MOON_SYSTEM.tidalLockNote,
  centreGmKm3S2: PLUTO_MOON_SYSTEM.config.centreGmKm3S2,
  fitErrorsM: plutoFitErrors,
  packages: packagesOf(PACKAGES, ["pluto", "charon"]),
  load: async (window) => { await PLUTO_MOON_SYSTEM.load({ window, bodies: PLUTO_MOON_IDS, chunkUrls: PLUTO_CHUNK_URLS }); },
};
