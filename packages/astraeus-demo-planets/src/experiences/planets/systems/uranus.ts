// Uranus's system for the planets experience: its moon list, fitted positions, mapped pictures and tagged places. The words and numbers
// of the view are data/planets/uranus.json; this file only names where Uranus's data is.
import type { MoonIndex } from "astraeus";
import type { PlanetSystem } from "../planetScene";
import { chunkUrlsOf, moonListOf, moonPositionsOf, ORBIT_HISTORY_MS, packagesOf } from "../planetSystemParts";

/** Uranus's moon list and the measured error of each fit (both ship in astraeus-data-uranus). */
const LISTS = import.meta.glob("../../../../../astraeus-data-uranus/data/uranus-moons/list.json", { eager: true, import: "default" }) as Record<string, unknown>;
const FIT_ERRORS = import.meta.glob("../../../../../astraeus-data-uranus/data/uranus-moons/fit-errors.json", { eager: true, import: "default" }) as Record<string, Record<string, number>>;
/** The index ships in astraeus-data-uranus; a lazy glob keeps it its own chunk (it is read only when the system loads). */
const INDEX = import.meta.glob("../../../../../astraeus-data-uranus/data/uranus-moons/index.json", { import: "default" }) as Record<string, () => Promise<MoonIndex>>;

/** The tagged places of Uranus itself (it has no mapped moon): its body package's features and categories, read as they are stored. */
const PACKAGES = import.meta.glob("../../../../../astraeus-data/data/bodies/uranus/{features,categories}.json", { eager: true, import: "default" }) as Record<string, unknown>;

/** The fit chunks this build ships for Uranus: the window's year for every body, and the years before it only for the moons whose orbit line reaches back into them (`tests/planetSystems.test.ts` proves the set equals what the window loads). */
const SHIPPED = {
  ...import.meta.glob("../../../../../astraeus-data-uranus/data/uranus-moons/*/2016.bin", { query: "?url", import: "default", eager: true }),
  // 2014: not for the 20 moons whose orbit line does not reach back into it.
  ...import.meta.glob(["../../../../../astraeus-data-uranus/data/uranus-moons/*/2014.bin", "!../../../../../astraeus-data-uranus/data/uranus-moons/{ariel,belinda,bianca,caliban,cordelia,cressida,cupid,desdemona,francisco,juliet,mab,miranda,oberon,ophelia,perdita,portia,puck,rosalind,titania,umbriel}/*"], { query: "?url", import: "default", eager: true }),
  // 2015: not for the 19 moons whose orbit line does not reach back into it.
  ...import.meta.glob(["../../../../../astraeus-data-uranus/data/uranus-moons/*/2015.bin", "!../../../../../astraeus-data-uranus/data/uranus-moons/{ariel,belinda,bianca,cordelia,cressida,cupid,desdemona,francisco,juliet,mab,miranda,oberon,ophelia,perdita,portia,puck,rosalind,titania,umbriel}/*"], { query: "?url", import: "default", eager: true }),
} as Record<string, string>;
export const URANUS_CHUNK_URLS = chunkUrlsOf(SHIPPED, "uranus-moons");
const MOON_LIST = moonListOf(LISTS);
export const URANUS_MOON_IDS = MOON_LIST.moons.map((moon) => moon.id);

export const uranusSystem: PlanetSystem = {
  bodies: [{ id: "uranus" }],
  moonList: MOON_LIST,
  fitErrorsM: Object.values(FIT_ERRORS)[0],
  orbitHistoryMs: ORBIT_HISTORY_MS,
  packages: packagesOf(PACKAGES, ["uranus"]),
  data: [moonPositionsOf({ name: "astraeus-data-uranus", center: "uranus", provides: [], loadIndex: Object.values(INDEX)[0]!, chunkUrls: URANUS_CHUNK_URLS })],
};
