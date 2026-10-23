// Jupiter's system for the planets experience: its moon list, fitted positions, mapped pictures, rings and tagged places. The words and numbers
// of the view are data/planets/jupiter.json; this file only names where Jupiter's data is.
import { JUPITER_MOON_CATALOGUE } from "astraeus/assets/bodies/jupiterMoonCatalogue";
import { JUPITER_RINGS } from "astraeus/assets/bodies/jupiterRings";
import { jupiterMoonsSystem } from "astraeus/assets/compositions";
import { JUPITER } from "astraeus/core/bodies/jupiter";
import { FITTED_MOON_TIDAL_LOCK, JUPITER_MOON_FIT_SOURCE, JUPITER_MOON_SYSTEM, jupiterMoonEphemeris, loadJupiterMoons } from "astraeus/core/bodies/jupiterMoons";
import type { PlanetSystem } from "../planetDefinition";
import { packagesOf } from "../planetSystemParts";

// The index ships in astraeus-data-jupiter; a dynamic import keeps it its own chunk (it is read only when the system loads).
JUPITER_MOON_SYSTEM.provideIndex(async () => (await import("astraeus-data-jupiter/index.json")).default as unknown);

/** The tagged places of the four big moons: each body package's features, categories and map record (whose coordinates convert west longitudes, T-140), read as they are stored. */
const PACKAGES = import.meta.glob("../../../../../astraeus/data/bodies/{io,europa,ganymede,callisto}/{features,categories,map}.json", { eager: true, import: "default" }) as Record<string, unknown>;

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
/** How far back an orbit line may reach: the slowest moons take under three years. */
const ORBIT_HISTORY_MS = 3 * 365.25 * 86_400_000;
export const JUPITER_CHUNK_URLS: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(SHIPPED_CHUNKS).map(([path, url]) => [path.replace(/^.*jupiter-moons\//, ""), url]));
export const JUPITER_MOON_IDS = JUPITER_MOON_CATALOGUE.moons.map((moon) => moon.id);

export const jupiterSystem: PlanetSystem = {
  catalogue: JUPITER_MOON_CATALOGUE,
  composition: jupiterMoonsSystem,
  ephemeris: jupiterMoonEphemeris,
  fitSource: JUPITER_MOON_FIT_SOURCE,
  tidalLockNote: FITTED_MOON_TIDAL_LOCK,
  centreGmKm3S2: JUPITER.gmKm3S2!,
  rings: JUPITER_RINGS,
  packages: packagesOf(PACKAGES, ["io", "europa", "ganymede", "callisto"]),
  load: async (window) => { await loadJupiterMoons({ window, bodies: JUPITER_MOON_IDS, chunkUrls: JUPITER_CHUNK_URLS, history: { bodies: JUPITER_MOON_IDS, maxMs: ORBIT_HISTORY_MS } }); },
};
