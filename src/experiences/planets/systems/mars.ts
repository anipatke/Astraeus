// Mars's system for the planets experience: Mars with Phobos and Deimos on their fitted orbits, and Mars's tagged places. The words and numbers of the
// view are data/planets/mars.json; this file only names where Mars's data is.
import { catalogue } from "../../../assets/catalogue";
import { createComposition } from "../../../assets/compositions";
import { MARS } from "../../../core/bodies/mars";
import { MARS_MOON_SYSTEM } from "../../../core/bodies/planetMoons";
import { moonFitSource } from "../../../core/bodies/moonSystem";
import { parseMoonCatalogue } from "../../../assets/moonCatalogue";
import type { PlanetSystem } from "../planetDefinition";
import marsMoons from "../../../../data/moons/mars.json";
import marsFeatures from "../../../../data/bodies/mars/features.json";
import marsCategories from "../../../../data/bodies/mars/categories.json";

/** The fit chunks this build ships for Mars: the window's year (one file per body per year), fetched only for this planet. A window in another year needs its year here. */
const SHIPPED_CHUNKS = import.meta.glob("../../../../data/ephemerides/mars-moons/*/2016.bin", { query: "?url", import: "default", eager: true }) as Record<string, string>;
/** How far back an orbit line may reach: Deimos takes 1.26 days. */
const ORBIT_HISTORY_MS = 3 * 86_400_000;
const DAY_MS = 86_400_000;
export const MARS_CHUNK_URLS: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(SHIPPED_CHUNKS).map(([path, url]) => [path.replace(/^.*mars-moons\//, ""), url]));
const MARS_MOON_LIST = parseMoonCatalogue(marsMoons);
const MARS_MOON_IDS = MARS_MOON_LIST.moons.map((moon) => moon.id);

export const marsSystem: PlanetSystem = {
  catalogue: MARS_MOON_LIST,
  // Each moon keeps its own loop (one period, from the fitted orbit): Phobos about 7.7 hours, Deimos about 30.3 hours.
  composition: createComposition(catalogue, {
    id: "mars-moons",
    bodies: ["mars", "phobos", "deimos"],
    defaultCenter: "mars",
    paths: [{ body: "phobos", spanMs: 0.3189 * DAY_MS }, { body: "deimos", spanMs: 1.2624 * DAY_MS }],
  }),
  ephemeris: () => MARS_MOON_SYSTEM.ephemeris(),
  fitSource: moonFitSource("Mars"),
  tidalLockNote: MARS_MOON_SYSTEM.tidalLockNote,
  centreGmKm3S2: MARS.gmKm3S2!,
  packages: { mars: { features: marsFeatures, categories: marsCategories } },
  load: async (window) => { await MARS_MOON_SYSTEM.load({ window, bodies: MARS_MOON_IDS, chunkUrls: MARS_CHUNK_URLS, history: { bodies: MARS_MOON_IDS, maxMs: ORBIT_HISTORY_MS } }); },
};
