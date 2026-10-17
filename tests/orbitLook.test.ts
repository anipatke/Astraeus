import { describe, expect, it } from "vitest";
import { Line, LineBasicMaterial } from "three";
import { createComposition, earthMoonSystem, jupiterIoSystem, SIDEREAL_MONTH_MS } from "../src/assets/compositions";
import { catalogue } from "../src/assets/catalogue";
import { DEFAULT_ORBIT_LOOK, resolveOrbitLook } from "../src/assets/orbitLook";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { readableScale } from "../src/core/scalePolicy";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { compositionPathView } from "../src/app/PathView";
import { arcAlpha, ringAlpha, windowEdgeAlpha } from "../src/app/pathRules";
import { eqjToRenderVector } from "../src/app/renderCoordinates";
import { placementAbout } from "./scenePlacement";

const adapter = createOrbAstronomyAdapter();
const placement = placementAbout("earth", adapter);
const date = Date.UTC(2025, 2, 20, 9, 30);
const moonPath = earthMoonSystem.paths![0];
const lines = (view: ReturnType<typeof compositionPathView>) => view.group.children as Line[];
const alphaOf = (line: Line, i: number) => line.geometry.getAttribute("color").getW(i);

describe("orbit look alpha, from time", () => {
  const P = 1000 * 3_600_000;
  const now = 5e12;
  it("fades the ring to nothing a half period either side of the clock and is full in the middle", () => {
    expect(ringAlpha(now, now - P / 2, P, 0.1)).toBe(0);
    expect(ringAlpha(now, now + P / 2, P, 0.1)).toBe(0);
    expect(ringAlpha(now, now, P, 0.1)).toBe(1);
    expect(ringAlpha(now, now - P / 2 + 0.1 * P, P, 0.1)).toBeCloseTo(1, 6);
    expect(ringAlpha(now, now + 0.05 * P, P, 0)).toBe(1);
    expect(windowEdgeAlpha(0, 181, 0.1)).toBe(0);
    expect(windowEdgeAlpha(90, 181, 0.1)).toBe(1);
  });
  it("makes the arc 1 at the body, 0 at its tail, quadratic between, 0 ahead", () => {
    const arcMs = 0.2 * P;
    expect(arcAlpha(now, now, arcMs, 2)).toBe(1);
    expect(arcAlpha(now, now - arcMs, arcMs, 2)).toBe(0);
    expect(arcAlpha(now, now - arcMs / 2, arcMs, 2)).toBeCloseTo(0.25, 6);
    expect(arcAlpha(now, now - arcMs / 2, arcMs, 1)).toBeCloseTo(0.5, 6);
    expect(arcAlpha(now, now + 1, arcMs, 2)).toBe(0);
  });
  it("is continuous in the clock: a small step moves every vertex's alpha a little", () => {
    const arcMs = 0.2 * P;
    const step = P / 100_000;
    for (let t = now - P; t <= now + P; t += P / 997) {
      for (const [a, b] of [[arcAlpha(now, t, arcMs, 2), arcAlpha(now + step, t, arcMs, 2)], [ringAlpha(now, t, P, 0.1), ringAlpha(now + step, t, P, 0.1)]]) {
        expect(Math.abs(a - b)).toBeLessThan(2e-4 * 10);
      }
    }
  });
});

describe("a composition path's orbit look", () => {
  it("takes Planetary Explorer's values by default, and Io drops only the ring's end fade", () => {
    expect(resolveOrbitLook(undefined)).toEqual(DEFAULT_ORBIT_LOOK);
    expect(DEFAULT_ORBIT_LOOK).toMatchObject({ baseOpacity: 0.18, arcFraction: 0.2, arcPeak: 0.65, arcExponent: 2, zoomBoostBase: 0.45, zoomBoostArc: 0.3 });
    expect(resolveOrbitLook(jupiterIoSystem.paths![0].look)).toEqual({ ...DEFAULT_ORBIT_LOOK, endFadeOn: false });
    expect(moonPath.spanMs).toBe(SIDEREAL_MONTH_MS);
  });
  it("refuses a number outside its bounds, at the path and at the composition", () => {
    expect(() => resolveOrbitLook({ endFade: 0.6 })).toThrow(/endFade/);
    expect(() => resolveOrbitLook({ arcFraction: -0.1 })).toThrow(/arcFraction/);
    expect(() => resolveOrbitLook({ arcPeak: Number.NaN })).toThrow(/arcPeak/);
    expect(() => createComposition(catalogue, { id: "x", bodies: ["earth", "moon"], defaultCenter: "earth", paths: [{ body: "moon", spanMs: 1, look: { baseOpacity: 2 } }] })).toThrow(/baseOpacity/);
    expect(() => resolveOrbitLook({ endFade: 0.5, arcFraction: 0.5 })).not.toThrow();
  });

  const arcOf = (view: ReturnType<typeof compositionPathView>) => {
    const arc = lines(view)[1];
    const count = arc.geometry.drawRange.count;
    return { arc, count, position: arc.geometry.getAttribute("position"), colour: arc.geometry.getAttribute("color") };
  };
  const placed = (view: ReturnType<typeof compositionPathView>) => view.place(new FloatingOrigin());

  it("draws a ring of the whole window and a short arc that ends exactly at the body", () => {
    const view = compositionPathView(moonPath, placement.resolver);
    view.sync(date, placement, readableScale, 0);
    placed(view);
    const [ring] = lines(view);
    expect(lines(view)).toHaveLength(2);
    expect(alphaOf(ring, 0)).toBe(0);
    expect(alphaOf(ring, 90)).toBe(1);
    const { count, position, colour } = arcOf(view);
    expect(count).toBeGreaterThan(30);
    expect(count).toBeLessThan(45);
    const head = count - 1;
    expect(colour.getW(head)).toBe(1);
    expect(colour.getW(0)).toBe(0);
    const body = placement.resolver.stateOf("moon", date, "earth").positionKm;
    const expected = eqjToRenderVector(readableScale.mapPosition(body));
    for (let k = 0; k < 3; k += 1) expect(position.array[3 * head + k]).toBeCloseTo(expected[k], 3);
    expect((ring.material as LineBasicMaterial).opacity).toBeCloseTo(0.18, 6);
    expect((lines(view)[1].material as LineBasicMaterial).opacity).toBeCloseTo(0.65, 6);
  });

  it("keeps the arc on the body between window rebuilds and across one", () => {
    const view = compositionPathView(moonPath, placement.resolver);
    let real = 0;
    let previousHead: number[] | null = null;
    // Steps of 20 minutes drift the clock past the rebuild threshold (an hour) twice; the head must always be the body.
    for (let step = 0; step <= 12; step += 1) {
      const t = date + step * 20 * 60_000;
      real += 1000;
      view.sync(t, placement, readableScale, real);
      placed(view);
      const { count, position, colour } = arcOf(view);
      const head = count - 1;
      const expected = eqjToRenderVector(readableScale.mapPosition(placement.resolver.stateOf("moon", t, "earth").positionKm));
      for (let k = 0; k < 3; k += 1) expect(position.array[3 * head + k]).toBeCloseTo(expected[k], 3);
      expect(colour.getW(head)).toBe(1);
      const now = Array.from(position.array.slice(3 * head, 3 * head + 3));
      if (previousHead !== null) expect(Math.hypot(now[0] - previousHead[0], now[1] - previousHead[1], now[2] - previousHead[2])).toBeLessThan(0.2);
      previousHead = now;
    }
  });

  it("gives the same arc whether the window is stale or freshly built", () => {
    const stale = compositionPathView(moonPath, placement.resolver);
    stale.sync(date, placement, readableScale, 0);
    const later = date + 50 * 60_000;
    stale.sync(later, placement, readableScale, 1); // 50 minutes of drift is under the rebuild threshold: the window stays
    expect(stale.timesUtcMs[90]).toBe(date);
    const fresh = compositionPathView(moonPath, placement.resolver);
    fresh.sync(later, placement, readableScale, 0);
    placed(stale);
    placed(fresh);
    const a = arcOf(stale);
    const b = arcOf(fresh);
    expect(Math.abs(a.count - b.count)).toBeLessThanOrEqual(1);
    for (const f of [0.25, 0.5, 0.75]) {
      // Same time before the body on both: the sample times differ, so compare each against the profile at its own time.
      for (const [view, arc] of [[stale, a], [fresh, b]] as const) {
        const times = view.timesUtcMs;
        const vertex = Math.round(f * (arc.count - 2));
        const lastIdx = times.filter((t) => t <= later).length - 1;
        const sampleIndex = lastIdx - (arc.count - 2) + vertex;
        expect(arc.colour.getW(vertex)).toBeCloseTo(arcAlpha(later, times[sampleIndex], 0.2 * SIDEREAL_MONTH_MS, 2), 5);
      }
    }
  });

  it("switches each layer off and back on", () => {
    const view = compositionPathView(moonPath, placement.resolver);
    view.sync(date, placement, readableScale, 0);
    const [ring, arc] = lines(view);
    const look = view.defaultLook!;
    view.setLook({ ...look, baseOn: false });
    expect([ring.visible, arc.visible]).toEqual([false, true]);
    view.setLook({ ...look, arcOn: false });
    expect([ring.visible, arc.visible]).toEqual([true, false]);
    view.setLook({ ...look, endFadeOn: false });
    view.sync(date, placement, readableScale, 0);
    expect(alphaOf(ring, 0)).toBe(1);
    view.setLook(look);
    view.sync(date, placement, readableScale, 0);
    expect([ring.visible, arc.visible]).toEqual([true, true]);
    expect(alphaOf(ring, 0)).toBe(0);
  });

  it("carries a slider change to the material and the shape at once", () => {
    const view = compositionPathView(moonPath, placement.resolver);
    view.sync(date, placement, readableScale, 0);
    const [ring, arc] = lines(view);
    const look = view.defaultLook!;
    const short = arc.geometry.drawRange.count;
    view.setLook({ ...look, baseOpacity: 0.5, arcPeak: 0.9, arcFraction: 0.4, arcExponent: 1 });
    expect((ring.material as LineBasicMaterial).opacity).toBeCloseTo(0.5, 6);
    expect((arc.material as LineBasicMaterial).opacity).toBeCloseTo(0.9, 6);
    view.sync(date, placement, readableScale, 0); // shapes follow on the next frame
    expect(arc.geometry.drawRange.count).toBeGreaterThan(1.8 * short);
    expect(alphaOf(arc, 0)).toBe(0);
  });

  it("brightens both layers as the camera pulls back, and not when zoom is off", () => {
    const view = compositionPathView(moonPath, placement.resolver);
    view.sync(date, placement, readableScale, 0);
    const [ring, arc] = lines(view);
    const centre = view.absolute();
    const extent = view.extentUnits(readableScale);
    const at = (factor: number) => {
      const origin = new FloatingOrigin();
      origin.set([centre[0] + extent * factor, centre[1], centre[2]]);
      view.place(origin);
    };
    at(1);
    expect((ring.material as LineBasicMaterial).opacity).toBeCloseTo(0.18, 3);
    at(4);
    expect((ring.material as LineBasicMaterial).opacity).toBeCloseTo(0.18 + 0.45, 3);
    expect((arc.material as LineBasicMaterial).opacity).toBe(0.95);
    view.setLook({ ...view.defaultLook!, zoomOn: false });
    expect((ring.material as LineBasicMaterial).opacity).toBeCloseTo(0.18, 6);
  });
});
