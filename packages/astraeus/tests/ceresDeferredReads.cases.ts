// I-211: a scene holding Ceres makes its setup reads of body states (`lineFixedTo: "auto"` stretches, a camera fitted to Ceres) once Ceres's series is
// in, whatever loaded before it. Shared by tests/ceresDeferredReads.test.ts (planet series preloaded) and tests/cold/ceresDeferredReads.test.ts (cold):
// each row builds the same scene twice in one module graph through `definitionOf` + `prepare`. In `cold` each row takes a fresh graph, so its first build finds
// no series loaded and its second finds the planet series loaded; in `preloaded` both builds find them loaded.
// The probe is made up (ARCH-03); Ceres's positions are its own (astraeus-data).
import { dataSource } from "astraeus-data";
import { describe, expect, it, vi } from "vitest";
import * as astraeus from "astraeus";
import { definitionOf } from "../src/api/definitionOf";
import { trackedBodiesOf } from "../src/app/experienceDefinition";

type Api = typeof import("astraeus");
type Engine = {
  readonly api: Api;
  readonly definitionOf: typeof import("../src/api/definitionOf").definitionOf;
  readonly trackedBodiesOf: typeof import("../src/app/experienceDefinition").trackedBodiesOf;
};
type Stretch = { readonly startUtcMs: number; readonly endUtcMs: number; readonly body: string };

const T0 = Date.parse("2026-01-01T00:00:00Z");
const DAY = 86_400_000;
const COUNT = 50;
const AU_KM = 149_597_870.7;
const TIMES = Array.from({ length: COUNT }, (_, i) => T0 + i * DAY);
/** Days 20 to 29: 20,000 km from Ceres, well inside its sphere of influence (about 75,000 km here). */
const NEAR = new Set(Array.from({ length: 10 }, (_, i) => 20 + i));

/** The engine of this file's graph: in `preloaded` the planet series are already in (vitest.setup.ts). */
const preloaded: Engine = { api: astraeus, definitionOf, trackedBodiesOf };

/** A fresh module graph: the engine as a cold host imports it, with nothing loaded yet in this graph. */
async function fresh(): Promise<Engine> {
  vi.resetModules();
  return {
    api: await import("astraeus"),
    definitionOf: (await import("../src/api/definitionOf")).definitionOf,
    trackedBodiesOf: (await import("../src/app/experienceDefinition")).trackedBodiesOf,
  };
}

/** Ceres's positions about the Sun at the sample times; in `cold` read in a graph of their own (thrown away, so each row starts cold). Each scene has its own series, so this loads nothing for the rows' scenes. */
async function ceresKm(engine: Engine): Promise<readonly ArrayLike<number>[]> {
  const { api } = engine;
  const scene = new api.Scene()
    .addBody(api.sun)
    .addBody(api.ceres)
    .setTimeline({ start: T0, end: T0 + COUNT * DAY });
  await scene.load({ data: [dataSource] });
  return TIMES.map((t) => scene.stateOf("ceres", t).positionKm);
}

type Row = {
  readonly name: string;
  readonly near: boolean;
  readonly withCeres: boolean;
  readonly fit: boolean;
};

const rows: readonly Row[] = [
  { name: "Ceres holds no sample: the stretches of the scene without Ceres", near: false, withCeres: true, fit: false },
  { name: "the same probe without Ceres (the reference)", near: false, withCeres: false, fit: false },
  { name: "samples inside Ceres's sphere: a stretch fixed to Ceres", near: true, withCeres: true, fit: false },
  { name: "a camera fitted to Ceres gets its distance", near: false, withCeres: true, fit: true },
];

export function ceresDeferredReadsTable(project: "preloaded" | "cold"): void {
  describe(`a Ceres scene's setup reads, built twice in one process (${project})`, () => {
    it.each(rows)("$name", async ({ near, withCeres, fit }) => {
      const ceres = await ceresKm(project === "cold" ? await fresh() : preloaded);
      // The probe sits 2 au out (1 au from Earth at the closest, far from Ceres), except on the NEAR days when the row puts it beside Ceres.
      const samples = TIMES.map((time, i) => ({
        time,
        positionKm:
          near && NEAR.has(i) ? [ceres[i]![0]! + 20_000, ceres[i]![1]!, ceres[i]![2]!] : [2 * AU_KM, 0, 0.3 * AU_KM],
      }));
      const engine = project === "cold" ? await fresh() : preloaded;
      const { api } = engine;
      const build = async (): Promise<{
        stretches: readonly Stretch[] | undefined;
        farthestKm: number | undefined;
      }> => {
        const scene = new api.Scene().addBody(api.sun).addBody(api.earth);
        if (withCeres) scene.addBody(api.ceres);
        scene
          .setTimeline({ start: T0, end: T0 + (COUNT - 1) * DAY })
          .addTrajectory({ id: "probe", center: "sun", samples, lineFixedTo: "auto" });
        if (fit) scene.camera.fitOrbit(api.ceres);
        const definition = engine.definitionOf(scene, withCeres ? [dataSource] : []);
        await definition.prepare?.();
        const fitted = definition.camera?.fitOrbit;
        return {
          stretches: engine.trackedBodiesOf(definition)[0]!.lineFixedTo as readonly Stretch[] | undefined,
          farthestKm: fitted === undefined ? undefined : fitted.farthestKm(),
        };
      };
      const builds = [await build(), await build()];
      const whole: readonly Stretch[] = [{ startUtcMs: TIMES[0]!, endUtcMs: TIMES[COUNT - 1]!, body: "sun" }];
      for (const [index, { stretches, farthestKm }] of builds.entries()) {
        const label = `build ${index + 1}`;
        if (near) {
          expect(
            stretches?.map(({ body }) => body),
            label,
          ).toEqual(["sun", "ceres", "sun"]);
          expect(stretches?.[1]?.startUtcMs, label).toBe(TIMES[20]);
        } else expect(stretches, label).toEqual(whole);
        if (fit) {
          // Ceres's farthest from the Sun is about 2.98 au (aphelion); the fitted distance is at least its distance at the opening time.
          expect(farthestKm, label).toBeGreaterThan(2.5 * AU_KM);
          expect(farthestKm, label).toBeLessThan(3.1 * AU_KM);
        } else expect(farthestKm, label).toBeUndefined();
      }
    });
  });
}
