// Pluto's system for the planets experience: its moon list, fitted positions, mapped pictures and tagged places. The words and numbers
// of the view are data/planets/pluto.json; this file only names where Pluto's data is.
import type { PlanetSystem } from "../planetScene";
import { chunkUrlsOf, moonListOf, moonPositionsOf, packagesOf } from "../planetSystemParts";

/** Pluto's moon list and the measured error of each fit (both ship in astraeus-data-pluto). */
const LISTS = import.meta.glob("../../../../../astraeus-data-pluto/data/pluto-moons/list.json", { eager: true, import: "default" }) as Record<string, unknown>;
const FIT_ERRORS = import.meta.glob("../../../../../astraeus-data-pluto/data/pluto-moons/fit-errors.json", { eager: true, import: "default" }) as Record<string, Record<string, number>>;
/** The index ships in astraeus-data-pluto; a lazy glob keeps it its own chunk (it is read only when the system loads). */
const INDEX = import.meta.glob("../../../../../astraeus-data-pluto/data/pluto-moons/index.json", { import: "default" }) as Record<string, () => Promise<unknown>>;

/** The tagged places of the mapped moons: each body package's features and categories, read as they are stored. */
const PACKAGES = import.meta.glob("../../../../../astraeus-data/data/bodies/{pluto,charon}/{features,categories}.json", { eager: true, import: "default" }) as Record<string, unknown>;

/** The fit chunks this build ships for Pluto: the window's year for every body (all of Pluto's moons orbit in under 40 days, so no earlier year is needed) (`tests/planetSystems.test.ts` proves the set equals what the window loads). */
const SHIPPED = {
  ...import.meta.glob("../../../../../astraeus-data-pluto/data/pluto-moons/*/2016.bin", { query: "?url", import: "default", eager: true }),
} as Record<string, string>;
export const PLUTO_CHUNK_URLS = chunkUrlsOf(SHIPPED, "pluto-moons");
const MOON_LIST = moonListOf(LISTS);
export const PLUTO_MOON_IDS = MOON_LIST.moons.map((moon) => moon.id);

export const plutoSystem: PlanetSystem = {
  bodies: [{ id: "pluto" }, { id: "charon" }],
  moonList: MOON_LIST,
  fitErrorsM: Object.values(FIT_ERRORS)[0],
  packages: packagesOf(PACKAGES, ["pluto", "charon"]),
  data: [moonPositionsOf({ name: "astraeus-data-pluto", centre: "pluto", provides: ["charon"], loadIndex: Object.values(INDEX)[0]!, chunkUrls: PLUTO_CHUNK_URLS })],
};
