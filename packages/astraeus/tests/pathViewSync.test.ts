import { describe, expect, it, vi } from "vitest";
import { BufferAttribute, Line } from "three";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { DEFAULT_ORBIT_LOOK, type OrbitLook } from "../src/assets/orbitLook";
import { readableScale, trueScale } from "../src/presentation/scalePolicy";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { PathView } from "../src/app/PathView";
import type { PathLayer } from "../src/app/experienceDefinition";
import { eccentricSource, syntheticEccentricPath } from "./synthetic/syntheticEccentricDefinition";
import { placementAbout } from "./scenePlacement";

const adapter = createOrbAstronomyAdapter();
const DAY = 86_400_000;
const T0 = Date.UTC(2031, 5, 1);
const sun = placementAbout("sun", adapter);
const earth = placementAbout("earth", adapter);
const SCREEN = { fovDeg: 45, viewportHeightPx: 900 };

// Made-up orbit and trails of the made-up eccentric body, each over a rolling window so it carries the orbit look.
const kinds: Record<string, PathLayer> = {
  orbit: { ...syntheticEccentricPath, sampling: undefined, span: { windowMs: 400 * DAY } },
  "relative trail": {
    ...syntheticEccentricPath,
    kind: "trail",
    frame: "relative",
    sampling: undefined,
    span: { windowMs: 400 * DAY },
  },
  "inertial trail": {
    ...syntheticEccentricPath,
    kind: "trail",
    frame: "inertial",
    sampling: undefined,
    span: { windowMs: 400 * DAY },
  },
} as Record<string, PathLayer>;

const build = (layer: PathLayer, look: OrbitLook = DEFAULT_ORBIT_LOOK) => new PathView(layer, { orbitLook: look });
const run = (view: PathView, t: number, placement = sun, policy = trueScale, origin = new FloatingOrigin()) => {
  view.sync(t, placement, policy, 0);
  view.place(origin, SCREEN);
};
const snapshot = (view: PathView) =>
  view.group.children.flatMap((child) => {
    const geometry = (child as Line).geometry;
    return ["position", "color"].flatMap((name) => {
      const a = geometry.getAttribute(name) as BufferAttribute | undefined;
      return a === undefined ? [] : [Array.from(a.array as Float32Array)];
    });
  });
const positionVersions = (view: PathView) =>
  view.group.children.map((child) => ((child as Line).geometry.getAttribute("position") as BufferAttribute).version);
const perturbed = (look: OrbitLook, key: keyof OrbitLook): OrbitLook => {
  const v = look[key];
  const next = typeof v === "boolean" ? !v : Number.isInteger(v) ? (v as number) + 2 : (v as number) * 0.5 + 0.01;
  return { ...look, [key]: next };
};

describe.each(Object.entries(kinds))("a %s path view", (_name, layer) => {
  it("does not re-evaluate an unchanged frame", () => {
    const stateAt = vi.fn((t: number, c?: Parameters<typeof eccentricSource.stateAt>[1]) =>
      eccentricSource.stateAt(t, c),
    );
    const view = build({ ...layer, source: { ...eccentricSource, stateAt } } as PathLayer);
    run(view, T0);
    const spy = stateAt;
    spy.mockClear();
    const before = snapshot(view);
    run(view, T0);
    view.setLook({ ...DEFAULT_ORBIT_LOOK });
    run(view, T0);
    expect(spy).toHaveBeenCalledTimes(0);
    expect(snapshot(view)).toEqual(before);
  });

  it("re-evaluates when an input changes", () => {
    const view = build(layer);
    run(view, T0);
    const before = snapshot(view);
    run(view, T0 + 3 * DAY);
    expect(snapshot(view)).not.toEqual(before);

    const centred = build(layer);
    run(centred, T0);
    run(centred, T0, earth);
    const centredFresh = build(layer);
    run(centredFresh, T0, earth);
    expect(snapshot(centred)).toEqual(snapshot(centredFresh));

    const scaled = build(layer);
    run(scaled, T0);
    run(scaled, T0, sun, readableScale);
    const scaledFresh = build(layer);
    run(scaledFresh, T0, sun, readableScale);
    expect(snapshot(scaled)).toEqual(snapshot(scaledFresh));

    for (const key of Object.keys(DEFAULT_ORBIT_LOOK) as (keyof OrbitLook)[]) {
      const look = perturbed(DEFAULT_ORBIT_LOOK, key);
      const live = build(layer);
      run(live, T0);
      live.setLook(look);
      run(live, T0);
      const fresh = build(layer, look);
      run(fresh, T0);
      expect(snapshot(live), key).toEqual(snapshot(fresh));
    }
  });

  it("does not re-upload an unchanged frame", () => {
    const view = build(layer);
    const origin = new FloatingOrigin();
    run(view, T0, sun, trueScale, origin);
    const first = positionVersions(view);
    run(view, T0, sun, trueScale, origin);
    expect(positionVersions(view)).toEqual(first);
    view.place(origin, { ...SCREEN, viewportHeightPx: 450 });
    expect(positionVersions(view)).not.toEqual(first);
    const second = positionVersions(view);
    const moved = new FloatingOrigin();
    moved.set([1, 2, 3]);
    view.place(moved, { ...SCREEN, viewportHeightPx: 450 });
    expect(positionVersions(view)).not.toEqual(second);
  });
});
