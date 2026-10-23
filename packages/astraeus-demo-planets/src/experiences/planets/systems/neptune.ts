// Neptune's system for the planets experience: its moon list, fitted positions, mapped pictures, rings and tagged places. The words and numbers
// of the view are data/planets/neptune.json; this file only names where Neptune's data is.
import { NEPTUNE_MOON_CATALOGUE, NEPTUNE_RINGS } from "../../../../../astraeus/src/assets/bodies/outerPlanetCatalogues";
import { neptuneMoonsSystem } from "../../../../../astraeus/src/assets/compositions";
import { NEPTUNE_MOON_SYSTEM } from "../../../../../astraeus/src/core/bodies/planetMoons";
import type { PlanetSystem } from "../planetDefinition";
import { chunkUrlsOf, ORBIT_HISTORY_MS, packagesOf } from "../planetSystemParts";
import neptuneFitErrors from "../../../../../astraeus/data/moons/fit-errors/neptune.json";

/** The tagged places of the mapped moons: each body package's features and categories, read as they are stored. */
const PACKAGES = import.meta.glob("../../../../../astraeus/data/bodies/{neptune,triton}/{features,categories}.json", { eager: true, import: "default" }) as Record<string, unknown>;

/** The fit chunks this build ships for Neptune: the window's year for every body, and the years before it only for the moons whose orbit line reaches back into them (`tests/planetSystems.test.ts` proves the set equals what the window loads). */
const SHIPPED = {
  ...import.meta.glob("../../../../../astraeus/data/ephemerides/neptune-moons/*/2016.bin", { query: "?url", import: "default", eager: true }),
  // 2014: not for the 9 moons whose orbit line does not reach back into it.
  ...import.meta.glob(["../../../../../astraeus/data/ephemerides/neptune-moons/*/2014.bin", "!../../../../../astraeus/data/ephemerides/neptune-moons/{despina,galatea,hippocamp,larissa,naiad,nereid,proteus,thalassa,triton}/*"], { query: "?url", import: "default", eager: true }),
  // 2015: not for the 8 moons whose orbit line does not reach back into it.
  ...import.meta.glob(["../../../../../astraeus/data/ephemerides/neptune-moons/*/2015.bin", "!../../../../../astraeus/data/ephemerides/neptune-moons/{despina,galatea,hippocamp,larissa,naiad,proteus,thalassa,triton}/*"], { query: "?url", import: "default", eager: true }),
} as Record<string, string>;
export const NEPTUNE_CHUNK_URLS = chunkUrlsOf(SHIPPED, "neptune-moons");
export const NEPTUNE_MOON_IDS = NEPTUNE_MOON_CATALOGUE.moons.map((moon) => moon.id);

export const neptuneSystem: PlanetSystem = {
  catalogue: NEPTUNE_MOON_CATALOGUE,
  composition: neptuneMoonsSystem,
  ephemeris: NEPTUNE_MOON_SYSTEM.ephemeris,
  fitSource: NEPTUNE_MOON_SYSTEM.config.fitSource,
  tidalLockNote: NEPTUNE_MOON_SYSTEM.tidalLockNote,
  centreGmKm3S2: NEPTUNE_MOON_SYSTEM.config.centreGmKm3S2,
  rings: NEPTUNE_RINGS,
  fitErrorsM: neptuneFitErrors,
  packages: packagesOf(PACKAGES, ["neptune", "triton"]),
  load: async (window) => { await NEPTUNE_MOON_SYSTEM.load({ window, bodies: NEPTUNE_MOON_IDS, chunkUrls: NEPTUNE_CHUNK_URLS, history: { bodies: NEPTUNE_MOON_IDS, maxMs: ORBIT_HISTORY_MS } }); },
};
