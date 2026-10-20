// Jupiter's system for the planets experience: its moon list, fitted positions, mapped pictures, rings and tagged places. The words and numbers
// of the view are data/planets/jupiter.json; this file only names where Jupiter's data is.
import { JUPITER_MOON_CATALOGUE } from "../../../assets/bodies/jupiterMoonCatalogue";
import { JUPITER_RINGS } from "../../../assets/bodies/jupiterRings";
import { jupiterMoonsSystem } from "../../../assets/compositions";
import { JUPITER } from "../../../core/bodies/jupiter";
import { FITTED_MOON_TIDAL_LOCK, JUPITER_MOON_FIT_SOURCE, jupiterMoonEphemeris, loadJupiterMoons } from "../../../core/bodies/jupiterMoons";
import type { PlanetSystem } from "../planetDefinition";
import ioFeatures from "../../../../data/bodies/io/features.json";
import ioCategories from "../../../../data/bodies/io/categories.json";
import europaFeatures from "../../../../data/bodies/europa/features.json";
import europaCategories from "../../../../data/bodies/europa/categories.json";
import ganymedeFeatures from "../../../../data/bodies/ganymede/features.json";
import ganymedeCategories from "../../../../data/bodies/ganymede/categories.json";
import callistoFeatures from "../../../../data/bodies/callisto/features.json";
import callistoCategories from "../../../../data/bodies/callisto/categories.json";

/**
 * The fit chunks this build ships: the window's year (one file per moon per year), served as files and fetched only for this
 * experience. A window in another year needs its year here; `chunksNeeded` refuses a window whose chunks are not shipped.
 */
const SHIPPED_CHUNKS = {
  ...import.meta.glob("../../../../data/ephemerides/jupiter-moons/*/2016.bin", { query: "?url", import: "default", eager: true }),
  // The two years before, for the moons whose orbit takes longer than the window's year has had (the orbit line is the moon's own fitted
  // path over one period ending now): every moon but the inner and big four, whose periods are days, and Jupiter's own series (the centre).
  ...import.meta.glob(["../../../../data/ephemerides/jupiter-moons/*/{2014,2015}.bin", "!**/{metis,adrastea,amalthea,thebe,io,europa,ganymede,callisto}/*"], { query: "?url", import: "default", eager: true }),
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
  packages: {
    io: { features: ioFeatures, categories: ioCategories },
    europa: { features: europaFeatures, categories: europaCategories },
    ganymede: { features: ganymedeFeatures, categories: ganymedeCategories },
    callisto: { features: callistoFeatures, categories: callistoCategories },
  },
  load: async (window) => { await loadJupiterMoons({ window, bodies: JUPITER_MOON_IDS, chunkUrls: JUPITER_CHUNK_URLS, history: { bodies: JUPITER_MOON_IDS, maxMs: ORBIT_HISTORY_MS } }); },
};
