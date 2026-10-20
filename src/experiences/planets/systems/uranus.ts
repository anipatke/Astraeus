// Uranus's system for the planets experience: its moon list, fitted positions, mapped pictures, rings and tagged places. The words and numbers
// of the view are data/planets/uranus.json; this file only names where Uranus's data is.
import { URANUS_MOON_CATALOGUE, URANUS_RINGS } from "../../../assets/bodies/outerPlanetCatalogues";
import { uranusMoonsSystem } from "../../../assets/compositions";
import { URANUS_MOON_SYSTEM } from "../../../core/bodies/planetMoons";
import type { PlanetSystem } from "../planetDefinition";
import { chunkUrlsOf, ORBIT_HISTORY_MS, packagesOf } from "../planetSystemParts";
import uranusFitErrors from "../../../../data/moons/fit-errors/uranus.json";

/** The tagged places of Uranus itself (it has no mapped moon): its body package's features and categories, read as they are stored. */
const PACKAGES = import.meta.glob("../../../../data/bodies/uranus/{features,categories}.json", { eager: true, import: "default" }) as Record<string, unknown>;

/** The fit chunks this build ships for Uranus: the window's year for every body, and the years before it only for the moons whose orbit line reaches back into them (`tests/planetSystems.test.ts` proves the set equals what the window loads). */
const SHIPPED = {
  ...import.meta.glob("../../../../data/ephemerides/uranus-moons/*/2016.bin", { query: "?url", import: "default", eager: true }),
  // 2014: not for the 20 moons whose orbit line does not reach back into it.
  ...import.meta.glob(["../../../../data/ephemerides/uranus-moons/*/2014.bin", "!**/{ariel,belinda,bianca,caliban,cordelia,cressida,cupid,desdemona,francisco,juliet,mab,miranda,oberon,ophelia,perdita,portia,puck,rosalind,titania,umbriel}/*"], { query: "?url", import: "default", eager: true }),
  // 2015: not for the 19 moons whose orbit line does not reach back into it.
  ...import.meta.glob(["../../../../data/ephemerides/uranus-moons/*/2015.bin", "!**/{ariel,belinda,bianca,cordelia,cressida,cupid,desdemona,francisco,juliet,mab,miranda,oberon,ophelia,perdita,portia,puck,rosalind,titania,umbriel}/*"], { query: "?url", import: "default", eager: true }),
} as Record<string, string>;
export const URANUS_CHUNK_URLS = chunkUrlsOf(SHIPPED, "uranus-moons");
export const URANUS_MOON_IDS = URANUS_MOON_CATALOGUE.moons.map((moon) => moon.id);

export const uranusSystem: PlanetSystem = {
  catalogue: URANUS_MOON_CATALOGUE,
  composition: uranusMoonsSystem,
  ephemeris: URANUS_MOON_SYSTEM.ephemeris,
  fitSource: URANUS_MOON_SYSTEM.config.fitSource,
  tidalLockNote: URANUS_MOON_SYSTEM.tidalLockNote,
  centreGmKm3S2: URANUS_MOON_SYSTEM.config.centreGmKm3S2,
  rings: URANUS_RINGS,
  fitErrorsM: uranusFitErrors,
  packages: packagesOf(PACKAGES, ["uranus"]),
  load: async (window) => { await URANUS_MOON_SYSTEM.load({ window, bodies: URANUS_MOON_IDS, chunkUrls: URANUS_CHUNK_URLS, history: { bodies: URANUS_MOON_IDS, maxMs: ORBIT_HISTORY_MS } }); },
};
