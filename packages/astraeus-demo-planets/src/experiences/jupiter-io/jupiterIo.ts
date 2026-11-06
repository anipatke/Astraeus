// Jupiter's view, built the way the planets experience builds it (data/planets/jupiter.json + Jupiter's system), for the tests and scripts that
// read it directly. The page itself builds it in main.tsx, from whichever planet the address names.
import jupiterFile from "../../../data/planets/jupiter.json";
import panelsFile from "../../../data/stories/jupiter-io/panels.json";
import type { Scene } from "astraeus";
import { buildPlanetScene } from "../planets/planetScene";
import { parsePlanetSettings } from "../planets/planetSettings";
import { jupiterSystem } from "../planets/systems/jupiter";

export { JUPITER_CHUNK_URLS, JUPITER_MOON_IDS } from "../planets/systems/jupiter";
const settings = parsePlanetSettings(jupiterFile);
export const JUPITER_WINDOW = settings.window;
/** The page heading the site shows for this view. */
export const JUPITER_LABEL = settings.experienceLabel;
/** The data packages the scene is mounted with (Jupiter's moon positions). */
export const jupiterIoData = jupiterSystem.data;
export const jupiterIoScene: Scene = buildPlanetScene(settings, jupiterSystem, panelsFile);
