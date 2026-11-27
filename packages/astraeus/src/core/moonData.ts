/**
 * The moon data one scene owns (O-084 T-357): a moon system per centre, made on first use, each holding its own decoded set and sharing only the
 * decoded bytes with other scenes (`moonChunkCache.ts`). A state-source binding given one reads these systems and never the process-wide ones
 * (`listedMoonBodies.ts`), which core callers without a scene keep using.
 */
import { MOON_SYSTEMS } from "./bodies/listedMoonBodies";
import { createMoonSystem, type MoonSystem } from "./bodies/moonSystem";
import type { BodyId } from "./body";
import type { PlanetModel } from "./planetSeries";

/**
 * What a binding reads a scene's data through: the scene's moon system for a centre (undefined for a centre with no moon system), the series of a
 * Sun-circling body a data package handed in (`DataSource.bodyPositions`; undefined until `installData` read it), and a count that changes when either installs or loads.
 */
export interface MoonDataSelection {
  system(centre: BodyId): MoonSystem | undefined;
  series(body: BodyId): PlanetModel | undefined;
  provideSeries(body: BodyId, model: PlanetModel): void;
  revision(): number;
}

/** The package series of bodies read with no scene (core callers and the test setup); a scene always reads its own. */
export const processMoonData: MoonDataSelection = createSceneMoonData();

/** A scene's own moon data and package series: empty until a system is loaded or a series handed in; each centre's system is made fresh, from the same configuration as the process-wide one. */
export function createSceneMoonData(): MoonDataSelection {
  const systems = new Map<BodyId, MoonSystem>();
  const series = new Map<BodyId, PlanetModel>();
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
    series: (body: BodyId): PlanetModel | undefined => series.get(body),
    provideSeries(body: BodyId, model: PlanetModel): void {
      series.set(body, model);
      revision += 1;
    },
    revision: (): number => revision,
  });
}
