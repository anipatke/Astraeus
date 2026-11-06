// Small helpers for a planet's system module: the shipped fit chunks by path, the tagged-place packages by moon, the moon list and the data source. They only
// reshape what the module's literal `import.meta.glob` calls return (Vite needs the patterns written out per planet; a glob, not a package import, because
// this demo is built on the public API and imports only `astraeus`).
import type { DataSource } from "astraeus";
import { parseMoonCatalogue, type MoonCatalogue } from "./moonList";
import type { PlanetSystem } from "./planetScene";

/** A glob of `?url` imports keyed by full path, as the file paths relative to the system's folder (`<body>/<year>.bin`), the keys the moon loader looks up. */
export function chunkUrlsOf(shipped: Readonly<Record<string, string>>, folder: string): Readonly<Record<string, string>> {
  return Object.fromEntries(Object.entries(shipped).map(([path, url]) => [path.slice(path.indexOf(`/${folder}/`) + folder.length + 2), url]));
}

/** A glob of `data/bodies/<moon>/{features,categories,map}.json` imports as the packages the builder takes, by moon. */
export function packagesOf(files: Readonly<Record<string, unknown>>, moons: readonly string[]): PlanetSystem["packages"] {
  return Object.fromEntries(moons.map((moon) => {
    const at = (name: string) => files[`../../../../../astraeus-data/data/bodies/${moon}/${name}.json`] as never;
    const map = at("map") as { coordinates: never } | undefined;
    return [moon, { features: at("features"), categories: at("categories"), ...(map === undefined ? {} : { map }) }];
  }));
}

/** The one file a single-file glob found. */
export function onlyFile<T>(files: Readonly<Record<string, T>>, what: string): T {
  const found = Object.values(files);
  if (found.length !== 1) throw new RangeError(`expected one ${what}, found ${found.length}`);
  return found[0]!;
}

/** The moon list a glob of one `<planet>-moons/list.json` found, checked. */
export const moonListOf = (files: Readonly<Record<string, unknown>>): MoonCatalogue => parseMoonCatalogue(onlyFile(files, "moon list"));

/** The data source a planet's package would hand `mount`: its moon positions (index read on demand, chunk files by path) for the moons the scene holds. */
export function moonPositionsOf(source: { readonly name: string; readonly centre: string; readonly provides: readonly string[]; readonly loadIndex: () => Promise<unknown>; readonly chunkUrls: Readonly<Record<string, string>> }): DataSource {
  return { name: source.name, provides: source.provides, moonPositions: { centre: source.centre, loadIndex: source.loadIndex, chunkUrls: source.chunkUrls } };
}

/** How far back an orbit line may reach: the slowest moons take under three years (as Jupiter's does). */
export const ORBIT_HISTORY_MS = 3 * 365.25 * 86_400_000;
