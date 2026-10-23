import { NEPTUNE_MOON_CATALOGUE_FILE, NEPTUNE_RING_FILE, PLUTO_MOON_CATALOGUE_FILE, SATURN_MOON_CATALOGUE_FILE, SATURN_RING_FILE, URANUS_MOON_CATALOGUE_FILE, URANUS_RING_FILE } from "../../core/bodies/outerPlanetData";
import { parseMoonCatalogue, type MoonCatalogue } from "../moonCatalogue";
import { parseRingSystem, type RingSystem } from "../rings";

/** The moon lists by family of Saturn (292), Uranus (28), Neptune (16) and Pluto (5): data/moons/<planet>.json (T-115). Core data: an experience chooses which to show. */
export const SATURN_MOON_CATALOGUE: MoonCatalogue = parseMoonCatalogue(SATURN_MOON_CATALOGUE_FILE);
export const URANUS_MOON_CATALOGUE: MoonCatalogue = parseMoonCatalogue(URANUS_MOON_CATALOGUE_FILE);
export const NEPTUNE_MOON_CATALOGUE: MoonCatalogue = parseMoonCatalogue(NEPTUNE_MOON_CATALOGUE_FILE);
export const PLUTO_MOON_CATALOGUE: MoonCatalogue = parseMoonCatalogue(PLUTO_MOON_CATALOGUE_FILE);

/** Ring bands from the NASA NSSDC ring fact sheets with the donor's looks (data/rings/<planet>.json, T-118). Pluto has none. */
export const SATURN_RINGS: RingSystem = parseRingSystem(SATURN_RING_FILE);
export const URANUS_RINGS: RingSystem = parseRingSystem(URANUS_RING_FILE);
export const NEPTUNE_RINGS: RingSystem = parseRingSystem(NEPTUNE_RING_FILE);
