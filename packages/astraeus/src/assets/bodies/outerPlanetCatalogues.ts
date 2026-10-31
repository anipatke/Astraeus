import { NEPTUNE_MOON_CATALOGUE_FILE, PLUTO_MOON_CATALOGUE_FILE, SATURN_MOON_CATALOGUE_FILE, URANUS_MOON_CATALOGUE_FILE } from "../../core/bodies/outerPlanetData";
import { parseMoonCatalogue, type MoonCatalogue } from "../moonCatalogue";

/** The moon lists by family of Saturn (292), Uranus (28), Neptune (16) and Pluto (5): data/moons/<planet>.json (T-115). Core data: an experience chooses which to show. */
export const SATURN_MOON_CATALOGUE: MoonCatalogue = parseMoonCatalogue(SATURN_MOON_CATALOGUE_FILE);
export const URANUS_MOON_CATALOGUE: MoonCatalogue = parseMoonCatalogue(URANUS_MOON_CATALOGUE_FILE);
export const NEPTUNE_MOON_CATALOGUE: MoonCatalogue = parseMoonCatalogue(NEPTUNE_MOON_CATALOGUE_FILE);
export const PLUTO_MOON_CATALOGUE: MoonCatalogue = parseMoonCatalogue(PLUTO_MOON_CATALOGUE_FILE);

export { NEPTUNE_RINGS, SATURN_RINGS, URANUS_RINGS } from "./outerPlanetRings";
