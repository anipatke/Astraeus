// Mars's system for the planets experience: Mars with Phobos and Deimos on their fitted orbits, and Mars's tagged places. The words and numbers of the
// view are data/planets/mars.json; this file only names where Mars's data is.
import type { PlanetSystem } from "../planetScene";
import { chunkUrlsOf, moonListOf, moonPositionsOf, packagesOf } from "../planetSystemParts";

/** Mars's moon list and the measured error of each fit (both ship in astraeus-data-mars). */
const LISTS = import.meta.glob("../../../../../astraeus-data-mars/data/mars-moons/list.json", { eager: true, import: "default" }) as Record<string, unknown>;
const FIT_ERRORS = import.meta.glob("../../../../../astraeus-data-mars/data/mars-moons/fit-errors.json", { eager: true, import: "default" }) as Record<string, Record<string, number>>;
/** The index ships in astraeus-data-mars; a lazy glob keeps it its own chunk (it is read only when the system loads). */
const INDEX = import.meta.glob("../../../../../astraeus-data-mars/data/mars-moons/index.json", { import: "default" }) as Record<string, () => Promise<unknown>>;

/** The tagged places of Mars itself: its body package's features and categories, read as they are stored. */
const PACKAGES = import.meta.glob("../../../../../astraeus-data/data/bodies/mars/{features,categories}.json", { eager: true, import: "default" }) as Record<string, unknown>;

/** The fit chunks this build ships for Mars: the window's year (one file per body per year), fetched only for this planet. A window in another year needs its year here. */
const SHIPPED_CHUNKS = import.meta.glob("../../../../../astraeus-data-mars/data/mars-moons/*/2016.bin", { query: "?url", import: "default", eager: true }) as Record<string, string>;
export const MARS_CHUNK_URLS: Readonly<Record<string, string>> = chunkUrlsOf(SHIPPED_CHUNKS, "mars-moons");
const MOON_LIST = moonListOf(LISTS);

export const marsSystem: PlanetSystem = {
  // Each moon keeps its own loop (one period, from the fitted orbit): Phobos about 7.7 hours, Deimos about 30.3 hours. Their lines fade at the old end, as the moons' default look does.
  bodies: [{ id: "mars" }, { id: "phobos", orbit: { lapDays: 0.3189, fades: true } }, { id: "deimos", orbit: { lapDays: 1.2624, fades: true } }],
  moonList: MOON_LIST,
  fitErrorsM: Object.values(FIT_ERRORS)[0],
  packages: packagesOf(PACKAGES, ["mars"]),
  data: [moonPositionsOf({ name: "astraeus-data-mars", centre: "mars", provides: ["phobos", "deimos"], loadIndex: Object.values(INDEX)[0]!, chunkUrls: MARS_CHUNK_URLS })],
};
