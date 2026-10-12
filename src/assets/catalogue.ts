import type { BodyId, CelestialBodyDefinition, StateSourceBinding } from "../core/body";
import { BUILT_IN_BINDINGS, BUILT_IN_BODIES } from "../core/bodies";
import { EARTH_ENTRY } from "./bodies/earth";
import { IO_ENTRY } from "./bodies/io";
import { JUPITER_ENTRY } from "./bodies/jupiter";
import { MARS_ENTRY } from "./bodies/mars";
import { MERCURY_ENTRY } from "./bodies/mercury";
import { MOON_ENTRY } from "./bodies/moon";
import { SUN_ENTRY } from "./bodies/sun";
import { VENUS_ENTRY } from "./bodies/venus";
import { textureRightsProblem } from "./licence";
import type { BodyVisual } from "./visual";

/** Definition, optional state source, and appearance of one body, joined by id. */
export interface BodyAsset {
  readonly definition: CelestialBodyDefinition;
  /** Absent for the root body only. */
  readonly source?: StateSourceBinding;
  readonly visual: BodyVisual;
}

export interface VisualEntry {
  readonly body: BodyId;
  readonly visual: BodyVisual;
}

export interface BodyCatalogue {
  /** Throws on an unknown id. */
  get(id: BodyId): BodyAsset;
  has(id: BodyId): boolean;
  ids(): readonly BodyId[];
  /** The core inputs a state resolver needs, without the visuals. */
  definitions(): readonly CelestialBodyDefinition[];
  sources(): readonly StateSourceBinding[];
}

export class AssetCatalogueError extends RangeError {}

/** Joins the three records by id and rejects any join that does not hold. */
export function createCatalogue(
  definitions: readonly CelestialBodyDefinition[],
  bindings: readonly StateSourceBinding[],
  visuals: readonly VisualEntry[],
): BodyCatalogue {
  const byId = new Map<BodyId, CelestialBodyDefinition>();
  for (const definition of definitions) {
    if (byId.has(definition.id)) throw new AssetCatalogueError(`duplicate body id "${definition.id}"`);
    byId.set(definition.id, definition);
  }
  const sources = new Map<BodyId, StateSourceBinding>();
  for (const binding of bindings) {
    if (!byId.has(binding.body)) throw new AssetCatalogueError(`a state source names "${binding.body}", which has no definition`);
    if (sources.has(binding.body)) throw new AssetCatalogueError(`duplicate state source for "${binding.body}"`);
    sources.set(binding.body, binding);
  }
  const looks = new Map<BodyId, BodyVisual>();
  for (const entry of visuals) {
    if (!byId.has(entry.body)) throw new AssetCatalogueError(`a visual names "${entry.body}", which has no definition`);
    if (looks.has(entry.body)) throw new AssetCatalogueError(`duplicate visual for "${entry.body}"`);
    const texture = entry.visual.texture;
    const problem = texture === undefined ? null : textureRightsProblem(texture);
    if (problem !== null) throw new AssetCatalogueError(`the texture of "${entry.body}" ${problem}`);
    looks.set(entry.body, entry.visual);
  }
  const assets = new Map<BodyId, BodyAsset>();
  for (const definition of byId.values()) {
    const source = sources.get(definition.id);
    if (definition.parentId !== undefined && source === undefined) {
      throw new AssetCatalogueError(`body "${definition.id}" has a parent but no state source`);
    }
    if (definition.parentId === undefined && source !== undefined) {
      throw new AssetCatalogueError(`root body "${definition.id}" must not have a state source`);
    }
    const visual = looks.get(definition.id);
    if (visual === undefined) throw new AssetCatalogueError(`body "${definition.id}" has no visual`);
    assets.set(definition.id, Object.freeze({ definition, ...(source === undefined ? {} : { source }), visual }));
  }
  const orderedDefinitions = Object.freeze([...byId.values()]);
  const orderedSources = Object.freeze([...sources.values()]);
  return Object.freeze({
    get(id: BodyId): BodyAsset {
      const asset = assets.get(id);
      if (asset === undefined) throw new AssetCatalogueError(`unknown body "${id}"`);
      return asset;
    },
    has: (id: BodyId): boolean => assets.has(id),
    ids: (): readonly BodyId[] => orderedDefinitions.map((definition) => definition.id),
    definitions: (): readonly CelestialBodyDefinition[] => orderedDefinitions,
    sources: (): readonly StateSourceBinding[] => orderedSources,
  });
}

/** The id of the catalogue's one root body (the one with no parent), the origin every chain ends at. */
export function rootBodyId(source: BodyCatalogue = catalogue): BodyId {
  const root = source.definitions().find((definition) => definition.parentId === undefined);
  if (root === undefined) throw new AssetCatalogueError("the catalogue has no root body");
  return root.id;
}

/** Explicit, import-built, no discovery. */
export const catalogue: BodyCatalogue = createCatalogue(BUILT_IN_BODIES, BUILT_IN_BINDINGS, [SUN_ENTRY, EARTH_ENTRY, MOON_ENTRY, MERCURY_ENTRY, VENUS_ENTRY, MARS_ENTRY, JUPITER_ENTRY, IO_ENTRY]);
