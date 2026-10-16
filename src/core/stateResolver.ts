import type { AstronomyAdapter } from "./astronomyAdapter";
import type { BodyId, CelestialBodyDefinition, CenterId, StateSourceBinding } from "./body";
import { composeCenteredPositions, inverseCenteredPosition } from "./referenceCenters";
import { assertUtcUnixMs, createState, type CenteredPosition, type Quaternion, type State } from "./state";
import type { Trajectory } from "./trajectory";

/** One evaluation per (body, time); composes along the parent chain. */
export interface StateResolver {
  /** State of `body` measured from `center`, both catalogued. Throws if either is unknown. */
  stateOf(body: BodyId, timeUtcMs: number, center: CenterId): State;
  /** Vector from `center` to `from`'s centre, for shifting externally computed positions (groups, paths). */
  offsetKm(from: CenterId, center: CenterId, timeUtcMs: number): Float64Array;
  /** The catalogue root's position from `center`: the one Sun everything is lit by. */
  sunFrom(center: CenterId, timeUtcMs: number): State;
}

/** Native states kept per (body, time) so a frame asks each provider once; the oldest are dropped first. */
const MEMO_LIMIT = 64;

export class CatalogueError extends RangeError {
  constructor(message: string) {
    super(message);
    this.name = "CatalogueError";
  }
}

function indexDefinitions(definitions: readonly CelestialBodyDefinition[]): Map<BodyId, CelestialBodyDefinition> {
  const byId = new Map<BodyId, CelestialBodyDefinition>();
  for (const definition of definitions) {
    if (typeof definition.id !== "string" || definition.id.length === 0) throw new CatalogueError("a body id must be non-empty");
    if (byId.has(definition.id)) throw new CatalogueError(`duplicate body id "${definition.id}"`);
    byId.set(definition.id, definition);
  }
  const roots = definitions.filter((definition) => definition.parentId === undefined);
  if (roots.length !== 1) throw new CatalogueError(`a catalogue needs exactly one root body, got ${roots.length}`);
  if (roots[0].orientation !== "none") throw new CatalogueError(`root body "${roots[0].id}" has no provider, so its orientation must be "none"`);
  for (const definition of definitions) {
    let visited = 0;
    for (let at = definition; at.parentId !== undefined; at = byId.get(at.parentId)!) {
      if (!byId.has(at.parentId)) throw new CatalogueError(`body "${at.id}" names unknown parent "${at.parentId}"`);
      visited += 1;
      if (visited > definitions.length) throw new CatalogueError(`body "${definition.id}" has a parent cycle`);
    }
  }
  return byId;
}

function createProviders(
  byId: ReadonlyMap<BodyId, CelestialBodyDefinition>,
  bindings: readonly StateSourceBinding[],
  adapter: AstronomyAdapter,
): Map<BodyId, Trajectory> {
  const providers = new Map<BodyId, Trajectory>();
  for (const binding of bindings) {
    const definition = byId.get(binding.body);
    if (definition === undefined) throw new CatalogueError(`binding names unknown body "${binding.body}"`);
    if (providers.has(binding.body)) throw new CatalogueError(`duplicate binding for body "${binding.body}"`);
    if (definition.parentId === undefined) throw new CatalogueError(`root body "${binding.body}" must not have a state source`);
    const provider = binding.create(adapter);
    if (provider.body !== binding.body) {
      throw new CatalogueError(`the state source for "${binding.body}" computes "${provider.body}"`);
    }
    providers.set(binding.body, provider);
  }
  for (const definition of byId.values()) {
    if (definition.parentId !== undefined && !providers.has(definition.id)) {
      throw new CatalogueError(`body "${definition.id}" has a parent but no state source`);
    }
  }
  return providers;
}

export function createStateResolver(
  definitions: readonly CelestialBodyDefinition[],
  bindings: readonly StateSourceBinding[],
  adapter: AstronomyAdapter,
): StateResolver {
  const byId = indexDefinitions(definitions);
  const providers = createProviders(byId, bindings, adapter);
  const root = definitions.find((definition) => definition.parentId === undefined)!;
  const requiresOrientation = (body: BodyId): boolean => {
    const definition = byId.get(body);
    return definition !== undefined && definition.orientation !== "none";
  };
  const memo = new Map<string, State>();

  function native(body: BodyId, timeUtcMs: number): State {
    const key = `${body}@${timeUtcMs}`;
    const known = memo.get(key);
    if (known !== undefined) return known;
    const parentId = byId.get(body)!.parentId!;
    const state = providers.get(body)!.stateAt(timeUtcMs, parentId);
    if (state.body !== body || state.center !== parentId) {
      throw new CatalogueError(`the state source for "${body}" returned "${state.body}" from "${state.center}", not from "${parentId}"`);
    }
    memo.set(key, state);
    if (memo.size > MEMO_LIMIT) memo.delete(memo.keys().next().value!);
    return state;
  }

  function chainToRoot(body: BodyId): BodyId[] {
    const chain = [body];
    for (let at = byId.get(body)!; at.parentId !== undefined; at = byId.get(at.parentId)!) chain.push(at.parentId);
    return chain;
  }

  /** `body` measured from `ancestor`, walking up the parent chain; undefined when they are the same body. */
  function upTo(body: BodyId, ancestor: BodyId, timeUtcMs: number): CenteredPosition | undefined {
    if (body === ancestor) return undefined;
    let composed: CenteredPosition = native(body, timeUtcMs);
    while (composed.center !== ancestor) composed = composeCenteredPositions(composed, native(composed.center, timeUtcMs));
    return composed;
  }

  function stateOf(body: BodyId, timeUtcMs: number, center: CenterId): State {
    assertUtcUnixMs(timeUtcMs);
    if (!byId.has(body)) throw new CatalogueError(`unknown body "${body}"`);
    if (!byId.has(center)) throw new CatalogueError(`unknown centre "${center}"`);
    // Orientation is the body's own provider's and is carried through composition unchanged.
    const orientation: Quaternion | null = body === root.id ? null : native(body, timeUtcMs).orientation;
    const input = { body, center, timeUtcMs };
    if (body === center) return createState({ ...input, positionKm: [0, 0, 0], orientation }, requiresOrientation);

    const centreChain = new Set(chainToRoot(center));
    const ancestor = chainToRoot(body).find((id) => centreChain.has(id))!;
    const bodyFromAncestor = upTo(body, ancestor, timeUtcMs);
    const centreFromAncestor = upTo(center, ancestor, timeUtcMs);
    const placed = bodyFromAncestor === undefined
      ? inverseCenteredPosition(centreFromAncestor!)
      : centreFromAncestor === undefined
        ? bodyFromAncestor
        : composeCenteredPositions(bodyFromAncestor, inverseCenteredPosition(centreFromAncestor));
    return createState({ ...input, positionKm: placed.positionKm, orientation }, requiresOrientation);
  }

  return Object.freeze({
    stateOf,
    offsetKm: (from: CenterId, center: CenterId, timeUtcMs: number) => Float64Array.from(stateOf(from, timeUtcMs, center).positionKm),
    sunFrom: (center: CenterId, timeUtcMs: number) => stateOf(root.id, timeUtcMs, center),
  });
}
