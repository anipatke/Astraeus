import type { BodyId } from "../core/body";
import type { TimeBounds } from "../core/trajectory";
import { JUPITER_MOON_SYSTEM } from "../core/bodies/jupiterMoons";
import { MARS_MOON_SYSTEM, NEPTUNE_MOON_SYSTEM, PLUTO_MOON_SYSTEM, SATURN_MOON_SYSTEM, URANUS_MOON_SYSTEM } from "../core/bodies/planetMoons";
import type { MoonSystem } from "../core/bodies/moonSystem";
import { catalogue } from "../assets/catalogue";
import { registerPictures, type Pictures } from "../assets/pictures";

/** Moon positions a data package (`astraeus-data-<planet>`) hands to the engine: where its index is read from and the URL of every chunk file it ships. */
export interface MoonPositions {
  /** The planet the moons circle: `jupiter`, `saturn`, `uranus`, `neptune`, `mars` or `pluto`. */
  readonly centre: BodyId;
  readonly loadIndex: () => Promise<unknown>;
  /** Chunk files by path relative to the index (`<moon>/<year>.bin`) to the URL they are served at. */
  readonly chunkUrls: Readonly<Record<string, string>>;
}

/** What `mount` needs from a data package: what it provides, and optionally pictures to register, moon positions to hand to the engine, and a load step. */
export interface DataSource {
  readonly name: string;
  readonly provides: readonly BodyId[];
  readonly pictures?: Pictures;
  readonly moonPositions?: MoonPositions;
  readonly prepare?: () => Promise<void>;
}

const SYSTEMS: Readonly<Record<string, MoonSystem>> = {
  jupiter: JUPITER_MOON_SYSTEM,
  saturn: SATURN_MOON_SYSTEM,
  uranus: URANUS_MOON_SYSTEM,
  neptune: NEPTUNE_MOON_SYSTEM,
  mars: MARS_MOON_SYSTEM,
  pluto: PLUTO_MOON_SYSTEM,
};

/**
 * Hands the packages' pictures and moon positions to the engine and loads the chunks the scene's window needs for the moons it holds.
 * Nothing is looked up behind the caller's back: a package that was not passed in contributes nothing.
 */
export async function installData(data: readonly DataSource[], sceneBodies: readonly BodyId[], window: TimeBounds): Promise<void> {
  for (const source of data) {
    if (source.pictures !== undefined) registerPictures(source.pictures);
    const positions = source.moonPositions;
    if (positions === undefined) continue;
    const system = SYSTEMS[positions.centre];
    if (system === undefined) throw new RangeError(`${source.name}: no moon system for "${positions.centre}"`);
    system.provideIndex(positions.loadIndex);
    const moons = sceneBodies.filter((id) => catalogue.has(id) && catalogue.get(id).definition.parentId === positions.centre);
    if (moons.length > 0) await system.load({ window, bodies: moons, chunkUrls: positions.chunkUrls });
  }
  for (const source of data) await source.prepare?.();
}
