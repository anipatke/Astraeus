import { createRequire } from "node:module";
import { dirname } from "node:path";

const require = createRequire(import.meta.url);

/** The folder (with a trailing slash) holding a planet's moon-position files, from its installed data package (`astraeus-data-<planet>`). */
export function moonDataFolder(planet: string): string {
  return `${dirname(require.resolve(`astraeus-data-${planet}/package.json`))}/data/${planet}-moons/`;
}
