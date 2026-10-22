// Two small helpers for a planet's system module: the shipped fit chunks by path and the tagged-place packages by moon. They only reshape what the
// module's literal `import.meta.glob` calls return (Vite needs the patterns written out per planet).
import type { PlanetSystem } from "./planetDefinition";

/** A glob of `?url` imports keyed by full path, as the file paths relative to the system's folder (`<body>/<year>.bin`), the keys the moon loader looks up. */
export function chunkUrlsOf(shipped: Readonly<Record<string, string>>, folder: string): Readonly<Record<string, string>> {
  return Object.fromEntries(Object.entries(shipped).map(([path, url]) => [path.slice(path.indexOf(`/${folder}/`) + folder.length + 2), url]));
}

/** A glob of `data/bodies/<moon>/{features,categories,map}.json` imports as the packages the builder takes, by moon. */
export function packagesOf(files: Readonly<Record<string, unknown>>, moons: readonly string[]): PlanetSystem["packages"] {
  return Object.fromEntries(moons.map((moon) => {
    const at = (name: string) => files[`../../../../data/bodies/${moon}/${name}.json`] as never;
    const map = at("map") as { coordinates: never } | undefined;
    return [moon, { features: at("features"), categories: at("categories"), ...(map === undefined ? {} : { map }) }];
  }));
}

/** How far back an orbit line may reach: the slowest moons take under three years (as Jupiter's does). */
export const ORBIT_HISTORY_MS = 3 * 365.25 * 86_400_000;
