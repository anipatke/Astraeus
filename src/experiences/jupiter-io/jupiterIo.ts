// Jupiter's view, built the way the planets experience builds it (data/planets/jupiter.json + Jupiter's system), for the tests and scripts that
// read it directly. The page itself builds it in main.tsx, from whichever planet the address names.
import jupiterFile from "../../../data/planets/jupiter.json";
import panelsFile from "../../../data/stories/jupiter-io/panels.json";
import type { ExperienceDefinition } from "../../app/experienceDefinition";
import { buildPlanetDefinition } from "../planets/planetDefinition";
import { parsePlanetSettings } from "../planets/planetSettings";
import { jupiterSystem } from "../planets/systems/jupiter";

export { JUPITER_CHUNK_URLS, JUPITER_MOON_IDS } from "../planets/systems/jupiter";
const settings = parsePlanetSettings(jupiterFile);
export const JUPITER_WINDOW = settings.window;
export const jupiterIoExplorer: ExperienceDefinition = buildPlanetDefinition(settings, jupiterSystem, panelsFile);
