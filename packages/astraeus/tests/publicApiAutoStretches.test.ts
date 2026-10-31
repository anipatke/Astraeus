// O-050 T-216: `lineFixedTo: "auto"` picks the stretches by sphere of influence. Made-up configurations only (ARCH-03).
import { describe, expect, it, vi } from "vitest";
import { Scene, SceneError, earth, mars, moon, sun } from "astraeus";
import { catalogue } from "../src/assets/catalogue";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createStateResolver } from "../src/core/stateResolver";
import { trackedBodiesOf } from "../src/app/experienceDefinition";
import { innermostHolding, influenceStretches, sphereOfInfluenceKm } from "../src/api/sphereOfInfluence";

const T0 = Date.parse("2026-01-01T00:00:00Z");
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const resolver = createStateResolver(catalogue.definitions(), catalogue.sources(), createOrbAstronomyAdapter());
const stretchesOf = (scene: Scene) => trackedBodiesOf(scene.toDefinition())[0]!.lineFixedTo as readonly { startUtcMs: number; endUtcMs: number; body: string }[];

describe("sphereOfInfluenceKm", () => {
  it("is a (m / M)^(2/5)", () => {
    expect(sphereOfInfluenceKm(1, 1, 100)).toBe(100);
    expect(sphereOfInfluenceKm(1, 32, 100)).toBeCloseTo(100 * (1 / 32) ** 0.4, 9);
  });
  it("is NaN, never holding a probe, where a GM is missing", () => {
    expect(sphereOfInfluenceKm(undefined, 1, 100)).toBeNaN();
    expect(sphereOfInfluenceKm(1, undefined, 100)).toBeNaN();
    expect(sphereOfInfluenceKm(0, 1, 100)).toBeNaN();
  });
});

describe("influenceStretches", () => {
  const candidate = (id: string, radiusKm: number, at: (t: number) => number) => ({ id, radiusKm: () => radiusKm, probeDistanceKm: at });
  it("the smaller sphere wins, runs merge, a stretch opens at its first sample and closes where the next run opens", () => {
    const candidates = [candidate("outer", 100, () => 50), candidate("inner", 10, (t) => (t >= 3 && t <= 5 ? 5 : 99))];
    expect(innermostHolding(candidates, 4)).toBe("inner");
    expect(innermostHolding(candidates, 1)).toBe("outer");
    expect(influenceStretches([0, 1, 2, 3, 4, 5, 6, 7], candidates)).toEqual([
      { startUtcMs: 0, endUtcMs: 3, body: "outer" }, { startUtcMs: 3, endUtcMs: 6, body: "inner" }, { startUtcMs: 6, endUtcMs: 7, body: "outer" },
    ]);
  });
  it("leaves samples no body holds uncovered and gives nothing for no samples", () => {
    expect(influenceStretches([0, 1, 2], [candidate("a", 1, () => 5)])).toEqual([]);
    expect(influenceStretches([], [candidate("a", 1, () => 0)])).toEqual([]);
  });
});

describe('lineFixedTo: "auto"', () => {
  it("a synthetic flyby enters and leaves a planet's sphere within one sample of the analytic crossing", () => {
    const count = 241; // hourly, 10 days
    const centre = 120;
    const rate = 20_000; // km per sample along x, relative to Mars
    const samples = Array.from({ length: count }, (_, i) => {
      const t = T0 + i * HOUR;
      const m = resolver.stateOf("mars", t, "sun").positionKm;
      return { time: t, positionKm: [m[0]! + (i - centre) * rate, m[1]!, m[2]!] };
    });
    const radiusAt = (i: number) => sphereOfInfluenceKm(catalogue.get("mars").definition.gmKm3S2, catalogue.get("sun").definition.gmKm3S2, Math.hypot(...resolver.stateOf("mars", T0 + i * HOUR, "sun").positionKm));
    const analytic = radiusAt(centre) / rate; // samples from the closest approach to the sphere's edge
    const scene = new Scene().addBody(sun).addBody(earth).addBody(mars).setTime(T0).addTrajectory({ id: "probe", center: "sun", samples, lineFixedTo: "auto" });
    const stretches = stretchesOf(scene);
    expect(stretches.map((s) => s.body)).toEqual(["sun", "mars", "sun"]);
    const enter = (stretches[1]!.startUtcMs - T0) / HOUR;
    const leave = (stretches[1]!.endUtcMs - T0) / HOUR;
    expect(Math.abs(enter - (centre - analytic))).toBeLessThanOrEqual(1);
    expect(Math.abs(leave - (centre + analytic))).toBeLessThanOrEqual(1);
    expect(stretches[0]!.startUtcMs).toBe(T0);
    expect(stretches[2]!.endUtcMs).toBe(T0 + (count - 1) * HOUR);
  });

  it("a Moon orbit in an Earth-centred scene resolves to the Moon", () => {
    const samples = Array.from({ length: 6 }, (_, i) => {
      const t = T0 + i * DAY;
      const m = resolver.stateOf("moon", t, "earth").positionKm;
      return { time: t, positionKm: [m[0]! + 3_000, m[1]!, m[2]!] };
    });
    const scene = new Scene().addBody(earth).addBody(moon).setTime(T0).addTrajectory({ id: "probe", samples, lineFixedTo: "auto" });
    expect(stretchesOf(scene)).toEqual([{ startUtcMs: T0, endUtcMs: T0 + 5 * DAY, body: "moon" }]);
  });

  it("a path far from everything stays on the scene centre", () => {
    const samples = Array.from({ length: 4 }, (_, i) => ({ time: T0 + i * DAY, positionKm: [5e7 + i * 1e6, 0, 0] }));
    const scene = new Scene().addBody(earth).addBody(moon).setTime(T0).addTrajectory({ id: "probe", samples, lineFixedTo: "auto" });
    expect(stretchesOf(scene)).toEqual([]);
  });

  it("resolves into the list the explicit form takes, so drawing, menu and follow share one path", () => {
    const samples = Array.from({ length: 6 }, (_, i) => {
      const t = T0 + i * DAY;
      const m = resolver.stateOf("moon", t, "earth").positionKm;
      return { time: t, positionKm: [m[0]! + 3_000, m[1]!, m[2]!] };
    });
    const build = (lineFixedTo: unknown) => new Scene().addBody(earth).addBody(moon).setTime(T0).addTrajectory({ id: "probe", samples, lineFixedTo: lineFixedTo as never });
    const auto = trackedBodiesOf(build("auto").toDefinition())[0]!;
    const explicit = trackedBodiesOf(build([{ start: T0, end: T0 + 5 * DAY, body: "moon" }]).toDefinition())[0]!;
    expect(auto.lineFixedTo).toEqual(explicit.lineFixedTo);
    expect(build("auto").toDefinition().experience.objects.filter((o) => o.id === "probe")).toHaveLength(1);
  });
});

describe("GM audit", () => {
  it("records which built-in bodies have no GM (they cannot hold a probe)", () => {
    const lacking = catalogue.definitions().filter((d) => !(d.gmKm3S2! > 0)).map((d) => d.id).sort();
    expect(lacking).toEqual(["swift-tuttle"]); // a comet: no published GM; every planet, the Sun, the Moon and the built-in moons carry one
  });
});

const flybySamples = () => Array.from({ length: 241 }, (_, i) => {
  const t = T0 + i * HOUR;
  const m = resolver.stateOf("mars", t, "sun").positionKm;
  return { time: t, positionKm: [m[0]! + (i - 120) * 20_000, m[1]!, m[2]!] };
});

describe('lineFixedTo: "auto" when the planet series load after the scene is built (a consumer\'s mount)', () => {
  // vitest.setup.ts preloads the series into the shared module instance; a reset registry gives a second instance with the series NOT loaded.
  const fresh = async () => {
    vi.resetModules();
    const api = await import("astraeus");
    const series = await import("../src/core/planetSeries");
    const definitionModule = await import("../src/app/experienceDefinition");
    const prepared = await import("../src/api/prepared");
    const view = await import("../src/app/TrackedBodyView");
    expect(series.planetSeriesLoaded()).toBe(false);
    return { api, series, trackedBodiesOf: definitionModule.trackedBodiesOf, prepareScene: prepared.prepareScene, TrackedBodyView: view.TrackedBodyView };
  };

  it("resolves in prepare to the explicit form's list, and the object menu, trackedBodies and the view input carry it", async () => {
    const f = await fresh();
    const build = (lineFixedTo: unknown) => new f.api.Scene().addBody(f.api.sun).addBody(f.api.earth).addBody(f.api.mars).setTime(T0).addTrajectory({ id: "probe", center: "sun", samples: flybySamples(), lineFixedTo: lineFixedTo as never });
    const { definition, ready } = f.prepareScene(build("auto"));
    // before the series are in nothing has been resolved and the viewer has not been given the definition (mount renders only after `ready`)
    expect(f.series.planetSeriesLoaded()).toBe(false);
    expect(f.trackedBodiesOf(definition)[0]!.lineFixedTo).toBeUndefined();
    await ready;
    const resolved = f.trackedBodiesOf(definition)[0]!.lineFixedTo as readonly { body: string }[];
    expect(resolved.map((stretch) => stretch.body)).toEqual(["sun", "mars", "sun"]);
    const explicit = build(resolved.map((s: any) => ({ start: s.startUtcMs, end: s.endUtcMs, body: s.body }))).toDefinition();
    expect(f.trackedBodiesOf(explicit)[0]!.lineFixedTo).toEqual(resolved);
    expect(definition.experience.objects.filter((o) => o.id === "probe")).toHaveLength(1);
    const view = new f.TrackedBodyView(f.trackedBodiesOf(definition)[0]!);
    expect(view.body.lineFixedTo).toBe(resolved);
  });

  it("an auto path whose body data is missing (dated outside the planet series) fails with out-of-span, in prepare, as today", async () => {
    const f = await fresh();
    const samples = Array.from({ length: 4 }, (_, i) => ({ time: Date.parse("1800-01-01T00:00:00Z") + i * DAY, positionKm: [1.5e8 + i, 0, 0] }));
    const scene = new f.api.Scene().addBody(f.api.sun).addBody(f.api.mars).setTime(Date.parse("1800-01-01T00:00:00Z")).addTrajectory({ id: "probe", center: "sun", samples, lineFixedTo: "auto" });
    const error = await f.prepareScene(scene).ready.then(() => undefined, (e: unknown) => e);
    expect(error).toBeInstanceOf(f.api.SceneError);
    expect((error as SceneError).code).toBe("out-of-span");
  });

  it("the same path with the series already loaded fails the same way", async () => {
    const samples = Array.from({ length: 4 }, (_, i) => ({ time: Date.parse("1800-01-01T00:00:00Z") + i * DAY, positionKm: [1.5e8 + i, 0, 0] }));
    const scene = new Scene().addBody(sun).addBody(mars).setTime(Date.parse("1800-01-01T00:00:00Z")).addTrajectory({ id: "probe", center: "sun", samples, lineFixedTo: "auto" });
    const error = await scene.toDefinition().prepare!().then(() => undefined, (e: unknown) => e);
    expect((error as SceneError).code).toBe("out-of-span");
  });
});
