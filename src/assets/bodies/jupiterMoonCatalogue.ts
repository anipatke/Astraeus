import { JUPITER_MOON_CATALOGUE_FILE } from "../../core/bodies/jupiterData";
import { parseMoonCatalogue, type MoonCatalogue } from "../moonCatalogue";

/** Jupiter's 115 moons by family (data/moons/jupiter.json, T-097). Core data: an experience chooses which of them to show. */
export const JUPITER_MOON_CATALOGUE: MoonCatalogue = parseMoonCatalogue(JUPITER_MOON_CATALOGUE_FILE);
