/**
 * The moon data one scene owns (O-084 T-357): a moon system per centre, made on first use, each holding its own decoded set and sharing only the
 * decoded bytes with other scenes (`moonChunkCache.ts`). A state-source binding given one reads these systems and never the process-wide ones
 * (`listedMoonBodies.ts`), which core callers without a scene keep using.
 */
import { MOON_SYSTEMS } from "./bodies/listedMoonBodies";
import { createMoonSystem, type MoonSystem } from "./bodies/moonSystem";
import type { BodyId } from "./body";

/** What a binding reads moon data through: the scene's system for a centre (undefined for a centre with no moon system), and a count that changes when one installs or loads. */
export interface MoonDataSelection {
  system(centre: BodyId): MoonSystem | undefined;
  revision(): number;
}

/** A scene's own moon data: empty until a system is loaded; each centre's system is made fresh, from the same configuration as the process-wide one. */
export function createSceneMoonData(): MoonDataSelection {
  const systems = new Map<BodyId, MoonSystem>();
  let revision = 0;
  return Object.freeze({
    system(centre: BodyId): MoonSystem | undefined {
      const held = systems.get(centre);
      if (held !== undefined) return held;
      const shared = MOON_SYSTEMS[centre];
      if (shared === undefined) return undefined;
      const made = createMoonSystem(shared.config, () => {
        revision += 1;
      });
      systems.set(centre, made);
      return made;
    },
    revision: (): number => revision,
  });
}
