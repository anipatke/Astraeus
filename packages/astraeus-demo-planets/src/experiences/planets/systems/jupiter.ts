// Jupiter's system for the planets experience: its moon list, fitted positions, mapped pictures and tagged places. The words and numbers
// of the view are data/planets/jupiter.json; this file only names where Jupiter's data is.
import type { MoonIndex } from "astraeus";
import type { PlanetSystem } from "../planetScene";
import { chunkUrlsOf, moonListOf, moonPositionsOf, ORBIT_HISTORY_MS, packagesOf } from "../planetSystemParts";

/** Jupiter's moon list (it ships in astraeus-data-jupiter). */
const LISTS = import.meta.glob("../../../../../astraeus-data-jupiter/data/jupiter-moons/list.json", { eager: true, import: "default" }) as Record<string, unknown>;
/** The index ships in astraeus-data-jupiter; a lazy glob keeps it its own chunk (it is read only when the system loads). */
const INDEX = import.meta.glob("../../../../../astraeus-data-jupiter/data/jupiter-moons/index.json", { import: "default" }) as Record<string, () => Promise<MoonIndex>>;

/** The tagged places of the four big moons: each body package's features, categories and map record (whose coordinates convert west longitudes, T-140), read as they are stored. */
const PACKAGES = import.meta.glob("../../../../../astraeus-data/data/bodies/{io,europa,ganymede,callisto}/{features,categories,map}.json", { eager: true, import: "default" }) as Record<string, unknown>;

/**
 * The fit chunks this build ships: the window's year (one file per moon per year), served as files and fetched only for this
 * experience. A window in another year needs its year here; `chunksNeeded` refuses a window whose chunks are not shipped.
 */
const SHIPPED_CHUNKS = {
  ...import.meta.glob("../../../../../astraeus-data-jupiter/data/jupiter-moons/*/2016.bin", { query: "?url", import: "default", eager: true }),
  // The two years before, for the moons whose orbit takes longer than the window's year has had (the orbit line is the moon's own fitted
  // path over one period ending now): every moon but the inner and big four, whose periods are days, and Jupiter's own series (the centre).
  ...import.meta.glob(["../../../../../astraeus-data-jupiter/data/jupiter-moons/*/{2014,2015}.bin", "!../../../../../astraeus-data-jupiter/data/jupiter-moons/{metis,adrastea,amalthea,thebe,io,europa,ganymede,callisto}/*"], { query: "?url", import: "default", eager: true }),
} as Record<string, string>;
export const JUPITER_CHUNK_URLS: Readonly<Record<string, string>> = chunkUrlsOf(SHIPPED_CHUNKS, "jupiter-moons");
const MOON_LIST = moonListOf(LISTS);
export const JUPITER_MOON_IDS = MOON_LIST.moons.map((moon) => moon.id);

export const jupiterSystem: PlanetSystem = {
  // Io keeps its loop; the other three moons' orbit lines are drawn with the small moons' batch.
  bodies: [{ id: "jupiter" }, { id: "io", orbit: true }, { id: "europa" }, { id: "ganymede" }, { id: "callisto" }],
  moonList: MOON_LIST,
  orbitHistoryMs: ORBIT_HISTORY_MS,
  packages: packagesOf(PACKAGES, ["io", "europa", "ganymede", "callisto"]),
  data: [moonPositionsOf({ name: "astraeus-data-jupiter", center: "jupiter", provides: ["io", "europa", "ganymede", "callisto"], loadIndex: Object.values(INDEX)[0]!, chunkUrls: JUPITER_CHUNK_URLS })],
};
