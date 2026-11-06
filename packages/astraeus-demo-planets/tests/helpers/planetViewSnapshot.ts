import type { Scene } from "astraeus";

type Definition = ReturnType<Scene["toDefinition"]>;

/** A group of a body set as a view shows it: id, centre, members, span and where the positions come from. */
const groupOf = (g: { id: string; center: string; members: readonly string[]; bounds: unknown; provenance: unknown }) => ({ id: g.id, center: g.center, members: g.members, bounds: g.bounds, provenance: g.provenance });

/**
 * The state resolver a body's card needs (`createMetrics`), made only from what the scene says: a body's state about its parent, which the scene gives, and the Sun seen from a planet,
 * which is the planet's state about the Sun, reversed. A card never asks for more (the distance to a child, the distance from the parent, the phase and the position).
 */
function resolverOf(scene: Scene) {
  const reversed = (state: ReturnType<Scene["stateOf"]>, body: string, center: string, timeUtcMs: number) => ({ ...state, body, center, timeUtcMs, positionKm: Float64Array.from(state.positionKm as ArrayLike<number>, (value: number) => -value) });
  const stateOf = (body: string, timeUtcMs: number, center: string) => {
    if (body === "sun") return reversed(scene.stateOf(center, timeUtcMs), body, center, timeUtcMs);
    return scene.stateOf(body, timeUtcMs);
  };
  return { stateOf, sunFrom: (center: string, timeUtcMs: number) => stateOf("sun", timeUtcMs, center) };
}

/**
 * What a planet's view shows, as plain data: the whole definition but its functions (the ephemeris closures and the loader), with the small-moon sets summarised by their members,
 * families, centre gravity, balance point and groups, and the rows of every listed object's info card at the opening time.
 * The `planet-views-before.json` fixture was recorded from the old `buildPlanetDefinition` for all nine planets before it was removed (O-059 T-270); the planets are now built by
 * `buildPlanetScene`, and `planetViews.test.ts` holds the new output to it. The scene's definition is the stop-gap the site is given until it mounts the scene (T-272).
 */
export function planetViewSnapshot(definition: Definition, scene: Scene): unknown {
  const metrics = definition.createMetrics!({ resolver: resolverOf(scene) as never, clock: undefined as never, catalogue: undefined as never });
  const rows: Record<string, unknown> = {};
  for (const object of definition.experience.objects.filter((candidate) => candidate.listed !== false)) {
    try { rows[object.id] = metrics(object.id, definition.clock.startUtcMs); } catch (error) { rows[object.id] = `throws ${(error as Error).message}`; }
  }
  const { prepare: _prepare, createMetrics: _createMetrics, bodySets, ...rest } = definition as unknown as Record<string, unknown> & { bodySets?: any[] };
  return JSON.parse(JSON.stringify({
    ...rest,
    bodySets: (bodySets ?? []).map((set) => ({ id: set.id, members: set.members, families: set.families, bodyFamilies: set.bodyFamilies, centre: set.centreGmKm3S2, balancePoint: set.balancePoint, group: groupOf(set.group), extra: set.extraOrbits === undefined ? undefined : { group: groupOf(set.extraOrbits.group), families: set.extraOrbits.families } })),
    metricRows: rows,
  }, (_key, value) => (typeof value === "function" ? "[function]" : value)).replaceAll("/packages/astraeus/src/", "/src/"));
}
