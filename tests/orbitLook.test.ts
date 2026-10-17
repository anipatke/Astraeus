import { describe, expect, it } from "vitest";
import { Line, LineBasicMaterial } from "three";
import { createComposition, earthMoonSystem, jupiterIoSystem, SIDEREAL_MONTH_MS } from "../src/assets/compositions";
import { catalogue } from "../src/assets/catalogue";
import { DEFAULT_ORBIT_LOOK, resolveOrbitLook } from "../src/assets/orbitLook";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { readableScale } from "../src/core/scalePolicy";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { compositionPathView } from "../src/app/PathView";
import { orbitLookShapes } from "../src/app/pathRules";
import { placementAbout } from "./scenePlacement";

const adapter = createOrbAstronomyAdapter();
const placement = placementAbout("earth", adapter);
const date = Date.UTC(2025, 2, 20, 9, 30);
const moonPath = earthMoonSystem.paths![0];
const lines = (view: ReturnType<typeof compositionPathView>) => view.group.children as Line[];
const alphaOf = (line: Line, i: number) => line.geometry.getAttribute("color").getW(i);

describe("orbit look shapes", () => {
  const n = 181;
  const shapes = orbitLookShapes(n, 0.1, 0.2, 2);
  it("fades the ring to nothing at both ends and is full in the middle", () => {
    expect(shapes.ring[0]).toBe(0);
    expect(shapes.ring[n - 1]).toBe(0);
    expect(shapes.ring[90]).toBe(1);
    expect(shapes.ring[Math.round(0.1 * (n - 1))]).toBeCloseTo(1, 5);
    for (let i = 1; i <= 18; i += 1) expect(shapes.ring[i]).toBeGreaterThan(shapes.ring[i - 1]);
    for (let i = 0; i < n; i += 1) expect(shapes.ring[i]).toBeCloseTo(shapes.ring[n - 1 - i], 6);
    expect(orbitLookShapes(n, 0, 0.2, 2).ring.every((a) => a === 1)).toBe(true);
  });
  it("makes the arc bright at the body and nothing at its tail, quadratic behind", () => {
    expect(shapes.arcCount).toBe(37); // 0.2 of 180 intervals
    expect(shapes.arcFirst).toBe(90 - 36);
    expect(shapes.arc[90]).toBe(1);
    expect(shapes.arc[shapes.arcFirst]).toBe(0);
    expect(shapes.arc[90 - 18]).toBeCloseTo(0.25, 6); // halfway back: (1 - 0.5)^2
    expect(shapes.arc[91]).toBe(0); // nothing ahead of the body
    expect(orbitLookShapes(n, 0.1, 0.2, 1).arc[90 - 18]).toBeCloseTo(0.5, 6);
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

  it("draws a ring and an arc over the same vertices, the arc only behind the body", () => {
    const view = compositionPathView(moonPath, placement.resolver);
    view.sync(date, placement, readableScale, 0);
    const [ring, arc] = lines(view);
    expect(lines(view)).toHaveLength(2);
    expect(ring.geometry.getAttribute("position")).toBe(arc.geometry.getAttribute("position"));
    expect(alphaOf(ring, 0)).toBe(0);
    expect(alphaOf(ring, 90)).toBe(1);
    expect(alphaOf(arc, 90)).toBe(1);
    expect(alphaOf(arc, 90 - 36)).toBe(0);
    expect(arc.geometry.drawRange).toEqual({ start: 54, count: 37 });
    expect((ring.material as LineBasicMaterial).opacity).toBeCloseTo(0.18, 6);
    expect((arc.material as LineBasicMaterial).opacity).toBeCloseTo(0.65, 6);
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
    expect(alphaOf(ring, 0)).toBe(1);
    view.setLook(look);
    expect([ring.visible, arc.visible]).toEqual([true, true]);
    expect(alphaOf(ring, 0)).toBe(0);
  });

  it("carries a slider change to the material and the shape at once", () => {
    const view = compositionPathView(moonPath, placement.resolver);
    view.sync(date, placement, readableScale, 0);
    const [ring, arc] = lines(view);
    const look = view.defaultLook!;
    view.setLook({ ...look, baseOpacity: 0.5, arcPeak: 0.9, arcFraction: 0.4, arcExponent: 1 });
    expect((ring.material as LineBasicMaterial).opacity).toBeCloseTo(0.5, 6);
    expect((arc.material as LineBasicMaterial).opacity).toBeCloseTo(0.9, 6);
    expect(arc.geometry.drawRange).toEqual({ start: 90 - 72, count: 73 });
    expect(alphaOf(arc, 90 - 36)).toBeCloseTo(0.5, 6);
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
