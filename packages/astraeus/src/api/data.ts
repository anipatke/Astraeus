import type { BodyId } from "../core/body";
import type { TimeBounds } from "../core/trajectory";
import { MOON_SYSTEMS } from "../core/bodies/listedMoonBodies";
import { MoonOutOfSpanError } from "../core/bodies/moonSystem";
import { catalogue as builtInCatalogue, type BodyCatalogue } from "../assets/catalogue";
import { SceneError } from "./errors";
import { rejectRenamed } from "./renamedInputs";
import type { BodySetLoad } from "./planBodySets";
import { picturesProblem, type Pictures } from "../assets/pictures";

/** A moon-position index as a data package reads it from its JSON file: `format`, `id` and the list of `bodies` with their fits. The engine checks all of it when it loads (`bad-data` if it does not fit), so every field is optional here. */
export interface MoonIndex {
  readonly format?: string;
  readonly id?: string;
  readonly bodies?: readonly object[];
}

/** Moon positions a data package (`astraeus-data-<planet>`) hands to the engine: where its index is read from and the URL of every chunk file it ships. */
export interface MoonPositions {
  /** The planet the moons circle: `jupiter`, `saturn`, `uranus`, `neptune`, `mars` or `pluto`. */
  readonly center: BodyId;
  readonly loadIndex: () => Promise<MoonIndex>;
  /** Chunk files by path relative to the index (`<moon>/<year>.bin`) to the URL they are served at. */
  readonly chunkUrls: Readonly<Record<string, string>>;
}

/** What `mount` needs from a data package: what it provides, and optionally pictures for the viewer, moon positions to hand to the engine, and a load step. */
export interface DataSource {
  readonly name: string;
  readonly provides: readonly BodyId[];
  readonly pictures?: Pictures;
  readonly moonPositions?: MoonPositions;
  /**
   * Positions of Sun-circling bodies by body id, each read (once per scene) only when the scene holds that body. A loader resolves to the JSON file
   * in the planet-fit format of the engine's own planets: `format`, `timeScale` and the body's fit under `planets.<id>`; the engine checks all of it
   * (`bad-data` if it does not fit). The file itself or a JSON module holding it as `default` (plain Node, Vite, webpack) are both accepted.
   */
  readonly bodyPositions?: Readonly<Record<BodyId, () => Promise<object>>>;
  readonly prepare?: () => Promise<void>;
}

/**
 * The faults of a data source that need no loading, thrown by `check`, `load` and `mount` alike (one function, so the three cannot differ): a picture that fails the rights rule or carries an old
 * name (`bad-data`, `renamed`), a body-positions entry that is not a loader, moon positions carrying an old name or naming a planet with no moon system. Nothing is read or loaded here; a scene with no data passes.
 */
export function checkDataSources(data: readonly DataSource[]): void {
  for (const source of data) {
    const problem = source.pictures === undefined ? null : picturesProblem(source.pictures);
    if (problem !== null) throw new SceneError("bad-data", `${source.name}: ${problem}`);
    for (const [name, texture] of Object.entries(source.pictures ?? {}))
      rejectRenamed(
        "TextureRefDesktop",
        (texture as { desktop?: unknown }).desktop,
        `${source.name}: pictures.${name}.desktop`,
      );
    for (const [id, load] of Object.entries(source.bodyPositions ?? {}))
      if (typeof load !== "function")
        throw new SceneError("bad-data", `${source.name}: bodyPositions.${id} is not a function`);
    const positions = source.moonPositions;
    if (positions === undefined) continue;
    rejectRenamed("MoonPositions", positions, `${source.name}: moonPositions`);
    if (MOON_SYSTEMS[positions.center] === undefined)
      throw new SceneError("bad-data", `${source.name}: no moon system for "${positions.center}"`);
  }
}

/** Whether a body the scene holds still waits for the series a data package hands in (`bodyPositions`): `installData` reads it in `prepare`, so nothing reads that body's states before. */
export function awaitsBodyPositions(
  data: readonly DataSource[],
  sceneBodies: readonly BodyId[],
  catalogue: BodyCatalogue = builtInCatalogue,
): boolean {
  const store = catalogue.moonData;
  return data.some((source) =>
    Object.keys(source.bodyPositions ?? {}).some(
      (id) => store !== undefined && sceneBodies.includes(id) && store.series(id) === undefined,
    ),
  );
}

/** A loader's result: the JSON file itself (Parcel), or a JSON module holding it as `default` (plain Node gives only that key; Vite and webpack add named keys). */
function jsonOf(loaded: object): object {
  const file = (loaded as { readonly default?: unknown }).default;
  return typeof file === "object" && file !== null ? file : loaded;
}

/**
 * Checks the rights of the packages' pictures (the viewer draws them from its definition, `assembleScene` carries them there), reads the series of each package body the scene holds into the scene's selection,
 * hands the moon positions to the engine and loads the chunks the scene's window needs for the moons it holds.
 * Nothing is looked up behind the caller's back: a package that was not passed in contributes nothing.
 */
export async function installData(
  data: readonly DataSource[],
  sceneBodies: readonly BodyId[],
  window: TimeBounds,
  catalogue: BodyCatalogue = builtInCatalogue,
  sets?: BodySetLoad,
): Promise<void> {
  checkDataSources(data);
  const store = catalogue.moonData;
  for (const source of data)
    for (const [id, load] of Object.entries(source.bodyPositions ?? {}))
      if (store !== undefined && sceneBodies.includes(id) && store.series(id) === undefined)
        store.provideSeries(
          id,
          await Promise.all([load(), import("../core/planetModels")])
            .then(([loaded, models]) => models.createSeriesModel(jsonOf(loaded), id))
            .catch((error: unknown) => {
              throw new SceneError("bad-data", `${source.name}: bodyPositions.${id}: ${String(error)}`);
            }),
        );
  for (const source of data) {
    const positions = source.moonPositions;
    if (positions === undefined) continue;
    const system = catalogue.moonData?.system(positions.center) ?? MOON_SYSTEMS[positions.center]!;
    system.provideIndex(positions.loadIndex);
    const moons = [
      ...sceneBodies.filter((id) => catalogue.has(id) && catalogue.get(id).definition.parentId === positions.center),
      ...(sets?.moons ?? []).filter((moon) => moon.parent === positions.center).map(({ id }) => id),
    ];
    const maxMs = sets?.historyMs.get(positions.center) ?? 0;
    if (moons.length > 0)
      await system
        .load({
          window,
          bodies: moons,
          chunkUrls: positions.chunkUrls,
          ...(maxMs > 0 ? { history: { bodies: moons, maxMs } } : {}),
        })
        .catch(moonLoadFailure(source.name));
  }
  for (const source of data) await source.prepare?.();
}

/** Turns a moon load's failure into the public error, naming the package that holds the positions (once: the load promise is shared): a span refusal is `out-of-span`, a `SceneError` passes, and bytes that cannot be read or parsed are `bad-data`. */
function moonLoadFailure(packageName: string): (error: unknown) => never {
  return (error) => {
    if (error instanceof MoonOutOfSpanError)
      throw new SceneError(
        "out-of-span",
        `${error.body} is outside the years ${packageName} covers: ${error.message}; set the timeline inside that span, or refit the data for the longer years`,
      );
    if (error instanceof SceneError) throw error;
    throw new SceneError(
      "bad-data",
      `${packageName}: its moon positions could not be read or parsed: ${error instanceof Error ? error.message : String(error)}`,
    );
  };
}
