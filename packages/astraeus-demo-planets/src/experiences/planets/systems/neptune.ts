// Neptune's system for the planets experience: its moon list, fitted positions, mapped pictures and tagged places. The words and numbers
// of the view are data/planets/neptune.json; this file only names where Neptune's data is.
import type { MoonIndex } from "astraeus";
import type { PlanetSystem } from "../planetScene";
import { chunkUrlsOf, moonListOf, moonPositionsOf, ORBIT_HISTORY_MS, packagesOf } from "../planetSystemParts";

/** Neptune's moon list and the measured error of each fit (both ship in astraeus-data-neptune). */
const LISTS = import.meta.glob("../../../../../astraeus-data-neptune/data/neptune-moons/list.json", { eager: true, import: "default" }) as Record<string, unknown>;
const FIT_ERRORS = import.meta.glob("../../../../../astraeus-data-neptune/data/neptune-moons/fit-errors.json", { eager: true, import: "default" }) as Record<string, Record<string, number>>;
/** The index ships in astraeus-data-neptune; a lazy glob keeps it its own chunk (it is read only when the system loads). */
const INDEX = import.meta.glob("../../../../../astraeus-data-neptune/data/neptune-moons/index.json", { import: "default" }) as Record<string, () => Promise<MoonIndex>>;

/** The tagged places of the mapped moons: each body package's features and categories, read as they are stored. */
const PACKAGES = import.meta.glob("../../../../../astraeus-data/data/bodies/{neptune,triton}/{features,categories}.json", { eager: true, import: "default" }) as Record<string, unknown>;

/** The fit chunks this build ships for Neptune: the window's year for every body, and the years before it only for the moons whose orbit line reaches back into them (`tests/planetSystems.test.ts` proves the set equals what the window loads). */
const SHIPPED = {
  ...import.meta.glob("../../../../../astraeus-data-neptune/data/neptune-moons/*/2016.bin", { query: "?url", import: "default", eager: true }),
  // 2014: not for the 9 moons whose orbit line does not reach back into it.
  ...import.meta.glob(["../../../../../astraeus-data-neptune/data/neptune-moons/*/2014.bin", "!../../../../../astraeus-data-neptune/data/neptune-moons/{despina,galatea,hippocamp,larissa,naiad,nereid,proteus,thalassa,triton}/*"], { query: "?url", import: "default", eager: true }),
  // 2015: not for the 8 moons whose orbit line does not reach back into it.
  ...import.meta.glob(["../../../../../astraeus-data-neptune/data/neptune-moons/*/2015.bin", "!../../../../../astraeus-data-neptune/data/neptune-moons/{despina,galatea,hippocamp,larissa,naiad,proteus,thalassa,triton}/*"], { query: "?url", import: "default", eager: true }),
} as Record<string, string>;
export const NEPTUNE_CHUNK_URLS = chunkUrlsOf(SHIPPED, "neptune-moons");
const MOON_LIST = moonListOf(LISTS);
export const NEPTUNE_MOON_IDS = MOON_LIST.moons.map((moon) => moon.id);

export const neptuneSystem: PlanetSystem = {
  bodies: [{ id: "neptune" }, { id: "triton" }],
  moonList: MOON_LIST,
  fitErrorsM: Object.values(FIT_ERRORS)[0],
  orbitHistoryMs: ORBIT_HISTORY_MS,
  packages: packagesOf(PACKAGES, ["neptune", "triton"]),
  data: [moonPositionsOf({ name: "astraeus-data-neptune", center: "neptune", provides: ["triton"], loadIndex: Object.values(INDEX)[0]!, chunkUrls: NEPTUNE_CHUNK_URLS })],
};
