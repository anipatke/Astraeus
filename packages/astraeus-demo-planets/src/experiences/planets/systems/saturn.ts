// Saturn's system for the planets experience: its moon list, fitted positions, mapped pictures, rings and tagged places. The words and numbers
// of the view are data/planets/saturn.json; this file only names where Saturn's data is.
import { SATURN_MOON_CATALOGUE, SATURN_RINGS } from "astraeus/assets/bodies/outerPlanetCatalogues";
import { saturnMoonsSystem } from "astraeus/assets/compositions";
import { SATURN_MOON_SYSTEM } from "astraeus/core/bodies/planetMoons";
import type { PlanetSystem } from "../planetDefinition";
import { chunkUrlsOf, ORBIT_HISTORY_MS, packagesOf } from "../planetSystemParts";
import saturnFitErrors from "astraeus/data/moons/fit-errors/saturn.json";

// The index ships in astraeus-data-saturn; a dynamic import keeps it its own chunk (it is read only when the system loads).
SATURN_MOON_SYSTEM.provideIndex(async () => (await import("astraeus-data-saturn/index.json")).default as unknown);

/** The tagged places of the mapped moons: each body package's features and categories, read as they are stored. */
const PACKAGES = import.meta.glob("../../../../../astraeus/data/bodies/{saturn,mimas,enceladus,tethys,dione,rhea,titan,iapetus}/{features,categories,map}.json", { eager: true, import: "default" }) as Record<string, unknown>;

/** The fit chunks this build ships for Saturn: the window's year for every body, and the years before it only for the moons whose orbit line reaches back into them (`tests/planetSystems.test.ts` proves the set equals what the window loads). */
const SHIPPED = {
  ...import.meta.glob("../../../../../astraeus-data-saturn/data/saturn-moons/*/2016.bin", { query: "?url", import: "default", eager: true }),
  // 2014: not for the 56 moons whose orbit line does not reach back into it.
  ...import.meta.glob(["../../../../../astraeus-data-saturn/data/saturn-moons/*/2014.bin", "!../../../../../astraeus-data-saturn/data/saturn-moons/{aegaeon,anthe,atlas,calypso,daphnis,dione,enceladus,epimetheus,helene,hyperion,iapetus,ijiraq,janus,kiviuq,methone,mimas,pallene,pan,pandora,phoebe,polydeuces,prometheus,rhea,s2004-s54,s2004-s55,s2004-s56,s2005-s4,s2006-s20,s2007-s10,s2009-s2,s2019-s1,s2019-s22,s2019-s23,s2019-s24,s2019-s25,s2019-s26,s2020-s1,s2020-s11,s2020-s12,s2020-s13,s2020-s48,s2020-s49,s2023-s01,s2023-s02,s2023-s06,s2023-s07,s2023-s08,s2023-s09,s2023-s11,s2023-s38,s2023-s50,s2023-s56,s2023-s62,telesto,tethys,titan}/*"], { query: "?url", import: "default", eager: true }),
  // 2015: not for the 24 moons whose orbit line does not reach back into it.
  ...import.meta.glob(["../../../../../astraeus-data-saturn/data/saturn-moons/*/2015.bin", "!../../../../../astraeus-data-saturn/data/saturn-moons/{aegaeon,anthe,atlas,calypso,daphnis,dione,enceladus,epimetheus,helene,hyperion,iapetus,janus,methone,mimas,pallene,pan,pandora,polydeuces,prometheus,rhea,s2009-s2,telesto,tethys,titan}/*"], { query: "?url", import: "default", eager: true }),
} as Record<string, string>;
export const SATURN_CHUNK_URLS = chunkUrlsOf(SHIPPED, "saturn-moons");
export const SATURN_MOON_IDS = SATURN_MOON_CATALOGUE.moons.map((moon) => moon.id);

export const saturnSystem: PlanetSystem = {
  catalogue: SATURN_MOON_CATALOGUE,
  composition: saturnMoonsSystem,
  ephemeris: SATURN_MOON_SYSTEM.ephemeris,
  fitSource: SATURN_MOON_SYSTEM.config.fitSource,
  tidalLockNote: SATURN_MOON_SYSTEM.tidalLockNote,
  centreGmKm3S2: SATURN_MOON_SYSTEM.config.centreGmKm3S2,
  rings: SATURN_RINGS,
  fitErrorsM: saturnFitErrors,
  packages: packagesOf(PACKAGES, ["saturn", "mimas", "enceladus", "tethys", "dione", "rhea", "titan", "iapetus"]),
  load: async (window) => { await SATURN_MOON_SYSTEM.load({ window, bodies: SATURN_MOON_IDS, chunkUrls: SATURN_CHUNK_URLS, history: { bodies: SATURN_MOON_IDS, maxMs: ORBIT_HISTORY_MS } }); },
};
