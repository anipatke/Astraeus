import type { BodyId } from "../core/body";
import type { TimeBounds } from "../core/trajectory";
import { MOON_SYSTEMS } from "../core/bodies/listedMoonBodies";
import { MoonOutOfSpanError } from "../core/bodies/moonSystem";
import { catalogue as builtInCatalogue, type BodyCatalogue } from "../assets/catalogue";
import { SceneError } from "./errors";
import type { BodySetLoad } from "./planBodySets";
import { picturesProblem, type Pictures } from "../assets/pictures";

/** Moon positions a data package (`astraeus-data-<planet>`) hands to the engine: where its index is read from and the URL of every chunk file it ships. */
export interface MoonPositions {
  /** The planet the moons circle: `jupiter`, `saturn`, `uranus`, `neptune`, `mars` or `pluto`. */
  readonly centre: BodyId;
  readonly loadIndex: () => Promise<unknown>;
  /** Chunk files by path relative to the index (`<moon>/<year>.bin`) to the URL they are served at. */
  readonly chunkUrls: Readonly<Record<string, string>>;
}

/** What `mount` needs from a data package: what it provides, and optionally pictures for the viewer, moon positions to hand to the engine, and a load step. */
export interface DataSource {
  readonly name: string;
  readonly provides: readonly BodyId[];
  readonly pictures?: Pictures;
  readonly moonPositions?: MoonPositions;
  readonly prepare?: () => Promise<void>;
}

/**
 * Checks the rights of the packages' pictures (the viewer draws them from its definition, `assembleScene` carries them there), hands the moon positions to the engine and loads the chunks the scene's window needs for the moons it holds.
 * Nothing is looked up behind the caller's back: a package that was not passed in contributes nothing.
 */
export async function installData(data: readonly DataSource[], sceneBodies: readonly BodyId[], window: TimeBounds, catalogue: BodyCatalogue = builtInCatalogue, sets?: BodySetLoad): Promise<void> {
  for (const source of data) {
    const problem = source.pictures === undefined ? null : picturesProblem(source.pictures);
    if (problem !== null) throw new SceneError("bad-data", `${source.name}: ${problem}`);
    const positions = source.moonPositions;
    if (positions === undefined) continue;
    const system = MOON_SYSTEMS[positions.centre];
    if (system === undefined) throw new SceneError("bad-data", `${source.name}: no moon system for "${positions.centre}"`);
    system.provideIndex(positions.loadIndex);
    const moons = [...sceneBodies.filter((id) => catalogue.has(id) && catalogue.get(id).definition.parentId === positions.centre), ...(sets?.moons ?? []).filter((moon) => moon.parent === positions.centre).map(({ id }) => id)];
    const maxMs = sets?.historyMs.get(positions.centre) ?? 0;
    if (moons.length > 0) await system.load({ window, bodies: moons, chunkUrls: positions.chunkUrls, ...(maxMs > 0 ? { history: { bodies: moons, maxMs } } : {}) }).catch(outOfSpan(source.name));
  }
  for (const source of data) await source.prepare?.();
}

/** Turns a moon's span refusal into the public error, naming the package that holds the positions (once: the load promise is shared). */
function outOfSpan(packageName: string): (error: unknown) => never {
  return (error) => {
    if (error instanceof MoonOutOfSpanError) throw new SceneError("out-of-span", `${error.body} is outside the years ${packageName} covers: ${error.message}; set the timeline inside that span, or refit the data for the longer years`);
    throw error;
  };
}
