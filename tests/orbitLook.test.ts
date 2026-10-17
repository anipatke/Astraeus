import { describe, expect, it } from "vitest";
import { DoubleSide, Line, LineBasicMaterial, Mesh, MeshBasicMaterial } from "three";
import { createComposition, earthMoonSystem, jupiterIoSystem, SIDEREAL_MONTH_MS } from "../src/assets/compositions";
import { catalogue } from "../src/assets/catalogue";
import { DEFAULT_ORBIT_LOOK, resolveOrbitLook } from "../src/assets/orbitLook";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { readableScale } from "../src/core/scalePolicy";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { compositionPathView } from "../src/app/PathView";
import { arcSegmentAlpha, ringAlpha, windowEdgeAlpha } from "../src/app/pathRules";
import { eqjToRenderVector } from "../src/app/renderCoordinates";
import { placementAbout } from "./scenePlacement";

const adapter = createOrbAstronomyAdapter();
const DAY = 86_400_000;
const placement = placementAbout("earth", adapter);
const date = Date.UTC(2025, 2, 20, 9, 30);
const moonPath = earthMoonSystem.paths![0];
const lines = (view: ReturnType<typeof compositionPathView>) => view.group.children as Line[];
const RIBBON_ROWS = 9 * 2; // ARC_SUBSTEPS + 1 points, two vertices each, per segment
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
  it("gives arc segments the donor's profile: 0.65 t squared, 1 at the body, nothing at the tail", () => {
    const ops = Array.from({ length: 16 }, (_, i) => arcSegmentAlpha(i, 16, 0.65, 2));
    expect(ops[0]).toBeCloseTo(0.65, 9);
    expect(ops[15]).toBe(0);
    for (let i = 0; i < 16; i += 1) expect(ops[i]).toBeCloseTo(0.65 * (1 - i / 15) ** 2, 9);
    expect(arcSegmentAlpha(7, 15, 0.5, 1)).toBeCloseTo(0.25, 9);
  });
  it("keeps the ring continuous in the clock: a small step moves every vertex's alpha a little", () => {
    const step = P / 100_000;
    for (let t = now - P; t <= now + P; t += P / 997) expect(Math.abs(ringAlpha(now, t, P, 0.1) - ringAlpha(now + step, t, P, 0.1))).toBeLessThan(2e-3);
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

  const placed = (view: ReturnType<typeof compositionPathView>) => view.place(new FloatingOrigin());
  const trueKm = (t: number) => placement.resolver.stateOf("moon", t, "earth").positionKm;
  const trueRender = (t: number) => Array.from(eqjToRenderVector(readableScale.mapPosition(trueKm(t))));
  const distance = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const centreLine = (view: ReturnType<typeof compositionPathView>) => {
    const c = view.arcPointsAbsolute;
    return Array.from({ length: c.length / 3 }, (_, k) => [c[3 * k], c[3 * k + 1], c[3 * k + 2]]);
  };

  it("builds the arc from 16 ribbon segments at the donor's opacities, ending exactly at the body", () => {
    const view = compositionPathView(moonPath, placement.resolver);
    view.sync(date, placement, readableScale, 0);
    placed(view);
    const [ring, arc] = lines(view);
    expect(lines(view)).toHaveLength(2);
    expect(arc).toBeInstanceOf(Mesh);
    const material = arc.material as MeshBasicMaterial;
    expect([material.transparent, material.depthWrite, material.side]).toEqual([true, false, DoubleSide]);
    expect(arc.geometry.drawRange.count).toBe(16 * 8 * 6);
    const ops = view.arcSegmentOpacities;
    expect(ops).toHaveLength(16);
    ops.forEach((op, i) => expect(op).toBeCloseTo(0.65 * (1 - i / 15) ** 2, 5));
    expect(ops[15]).toBe(0);
    const colour = arc.geometry.getAttribute("color");
    expect(colour.getW(0)).toBeCloseTo(ops[0], 6); // first vertex of segment 0
    expect(colour.getW(RIBBON_ROWS * 15)).toBe(0);
    const head = centreLine(view).at(-1)!;
    expect(distance(head, trueRender(date))).toBeLessThan(1e-3);
    expect(alphaOf(ring, 40)).toBe(1);
    expect((ring.material as LineBasicMaterial).opacity).toBeCloseTo(0.18, 6);
  });

  it("keeps the ring under the arc, as Planetary Explorer does", () => {
    const view = compositionPathView(moonPath, placement.resolver);
    view.sync(date, placement, readableScale, 0);
    const [ring] = lines(view);
    const arcMs = 0.2 * SIDEREAL_MONTH_MS;
    const times = view.timesUtcMs;
    let inside = 0;
    for (let i = 0; i < times.length; i += 1) {
      if (times[i] >= date - arcMs && times[i] <= date && i > 20 && i < 160) {
        inside += 1;
        expect(alphaOf(ring, i)).toBeGreaterThan(0.99);
      }
    }
    expect(inside).toBeGreaterThan(30);
  });

  it("takes the ribbon width from the setting, in the orbit's plane", () => {
    const view = compositionPathView(moonPath, placement.resolver);
    view.sync(date, placement, readableScale, 0);
    const extent = view.extentUnits(readableScale);
    const origin = new FloatingOrigin();
    origin.set([0, 0, 1e7]);
    view.place(origin);
    expect(view.arcRibbonWidth).toBeCloseTo(2 * 0.0015 * extent, 3);
    view.setLook({ ...view.defaultLook!, arcWidth: 0.006 });
    view.sync(date, placement, readableScale, 0);
    view.place(origin);
    expect(view.arcRibbonWidth).toBeCloseTo(2 * 0.006 * extent, 3);
    view.setLook({ ...view.defaultLook!, arcSegments: 10 });
    view.sync(date, placement, readableScale, 0);
    expect(view.arcSegmentOpacities).toHaveLength(10);
    expect(lines(view)[1].geometry.drawRange.count).toBe(10 * 8 * 6);
  });

  it("keeps the arc on the body between window rebuilds and across one", () => {
    const view = compositionPathView(moonPath, placement.resolver);
    let real = 0;
    for (let step = 0; step <= 12; step += 1) {
      const t = date + step * 20 * 60_000;
      real += 1000;
      view.sync(t, placement, readableScale, real);
      expect(distance(view.arcHeadAbsolute()!, trueRender(t))).toBeLessThan(1e-3);
    }
  });

  /** Every arc point lies on the body's true path at its own time, and no step is longer than the true path between its ends. */
  function expectArcOnTruePath(view: ReturnType<typeof compositionPathView>, now: number): void {
    const points = centreLine(view);
    const times = view.arcTimesUtcMs;
    expect(times).toHaveLength(points.length);
    expect(times[points.length - 1]).toBe(now);
    expect(now - times[0]).toBeCloseTo(0.2 * SIDEREAL_MONTH_MS, -1);
    for (let i = 0; i < points.length; i += 1) expect(distance(points[i], trueRender(times[i]))).toBeLessThan(1e-3);
    for (let i = 1; i < points.length; i += 1) {
      let along = 0;
      let previous = trueRender(times[i - 1]);
      for (let k = 1; k <= 20; k += 1) {
        const next = trueRender(Math.round(times[i - 1] + ((times[i] - times[i - 1]) * k) / 20));
        along += distance(previous, next);
        previous = next;
      }
      expect(distance(points[i - 1], points[i])).toBeLessThanOrEqual(along * 1.001 + 1e-6);
    }
  }

  it("draws an arc of the true path right after a clock jump, at load and mid-play", () => {
    const view = compositionPathView(moonPath, placement.resolver);
    view.sync(date, placement, readableScale, 0);
    expectArcOnTruePath(view, date);
    for (const [jump, real] of [[3 * DAY, 1], [-9 * DAY, 2], [40 * DAY, 3], [0.5 * DAY, 4]] as const) {
      const now = date + jump;
      view.sync(now, placement, readableScale, real);
      const times = view.timesUtcMs;
      expect(now).toBeGreaterThanOrEqual(times[0]);
      expect(now).toBeLessThanOrEqual(times[times.length - 1]);
      expect(Math.abs(times[90] - now)).toBeLessThanOrEqual(0.05 * SIDEREAL_MONTH_MS);
      expectArcOnTruePath(view, now);
    }
  });

  it("gives the same arc whether the ring window is stale or freshly built", () => {
    const stale = compositionPathView(moonPath, placement.resolver);
    stale.sync(date, placement, readableScale, 0);
    const later = date + 20 * 60_000;
    stale.sync(later, placement, readableScale, 1);
    expect(stale.timesUtcMs[90]).toBe(date);
    const fresh = compositionPathView(moonPath, placement.resolver);
    fresh.sync(later, placement, readableScale, 0);
    expect(Array.from(stale.arcTimesUtcMs)).toEqual(Array.from(fresh.arcTimesUtcMs));
    expect(Array.from(stale.arcPointsAbsolute)).toEqual(Array.from(fresh.arcPointsAbsolute));
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
    const [ring] = lines(view);
    const look = view.defaultLook!;
    view.setLook({ ...look, baseOpacity: 0.5, arcPeak: 0.9, arcFraction: 0.4, arcExponent: 1 });
    expect((ring.material as LineBasicMaterial).opacity).toBeCloseTo(0.5, 6);
    view.sync(date, placement, readableScale, 0); // shapes follow on the next frame
    expect(view.arcSegmentOpacities[0]).toBeCloseTo(0.9, 6);
    expect(view.arcSegmentOpacities[5]).toBeCloseTo(0.9 * (1 - 5 / 15), 6);
    expect(date - view.arcTimesUtcMs[0]).toBeCloseTo(0.4 * SIDEREAL_MONTH_MS, -1);
  });

  it("brightens both layers as the camera pulls back, and not when zoom is off", () => {
    const view = compositionPathView(moonPath, placement.resolver);
    view.sync(date, placement, readableScale, 0);
    const [ring] = lines(view);
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
    expect(view.arcSegmentOpacities[0]).toBeCloseTo(0.95, 6);
    expect(view.arcSegmentOpacities[15]).toBeCloseTo(0.3, 6); // the donor adds the boost to every segment
    view.setLook({ ...view.defaultLook!, zoomOn: false });
    expect((ring.material as LineBasicMaterial).opacity).toBeCloseTo(0.18, 6);
    expect(view.arcSegmentOpacities[0]).toBeCloseTo(0.65, 6);
  });
});
