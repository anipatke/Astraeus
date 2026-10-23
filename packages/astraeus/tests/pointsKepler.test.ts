import { describe, expect, it } from "vitest";
import type { GroupLayer } from "../src/app/experienceDefinition";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { PointsView } from "../src/app/PointsView";
import { eqjToRenderVector } from "../src/app/renderCoordinates";
import { sceneOffsetKm } from "../src/app/sceneLayout";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createOrbitGroup } from "../src/core/orbitGroup";
import { createProvenance } from "../src/core/provenance";
import { readableScale, trueScale, type ScalePolicy } from "../src/core/scalePolicy";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";
import { placementAbout } from "./scenePlacement";

// T-075: behaviour of the points layer when the graphics chip places the dots. The shader's arithmetic itself is proven in
// keplerShader.test.ts; here pause, seek, reverse, scale changes, bounds, the centre offset and the readouts that read members.

const DAY = 86_400_000;
const START = Date.UTC(2030, 0, 1);
const BOUNDS = { startUtcMs: START, endUtcMs: START + 400 * DAY };
const COUNT = 2500;
const adapter = createOrbAstronomyAdapter();
const provenance = createProvenance({ sourceType: "illustrative", sources: ["Made up inside the Kepler points tests"], accuracy: "None claimed.", notes: "Fixture." });

function stream(): GroupLayer {
  const group = createOrbitGroup({
    id: "kepler-fixture", count: COUNT, center: "sun", plane: "ecliptic-j2000", epochUtcMs: START + 100 * DAY, provenance, seed: 11, bounds: BOUNDS,
    base: { semiMajorAxisKm: 2.2e8, eccentricity: 0.4, inclinationDeg: 30, raanDeg: 100, argumentOfPeriapsisDeg: 200, trueAnomalyDeg: 90 },
    spread: { semiMajorAxisKm: 8e7, eccentricity: 0.2, inclinationDeg: 20, raanDeg: 40, argumentOfPeriapsisDeg: 60, trueAnomalyDeg: 180 },
  }, createOrbTwoBodyAdapter());
  return { group, color: "#7fe3c4", object: { id: "kepler-fixture", label: "Fixture", description: "Made up.", knownLimitations: ["Made up."] } };
}

/** A policy that scales exactly but does not say so: the group must keep the fills-plus-blend path. */
const unlabelled: ScalePolicy = { id: "true-scale", mapPosition: (p) => trueScale.mapPosition(p), mapRadius: (r) => trueScale.mapRadius(r) };

const sunPlacement = placementAbout("sun", adapter);
const origin = new FloatingOrigin();

/** Member `i` from the floating origin in 64-bit floats: the group's own position, mapped and shifted. */
function exactLocal(layer: GroupLayer, i: number, t: number, policy: ScalePolicy, placement = sunPlacement): number[] {
  const km = layer.group.stateAt(i, t).positionKm;
  const shift = sceneOffsetKm(placement, "sun", t) ?? [0, 0, 0];
  const at = eqjToRenderVector(policy.mapPosition([km[0] + shift[0], km[1] + shift[1], km[2] + shift[2]]));
  const o = origin.scaledCameraOrigin;
  return [at[0] - o[0], at[1] - o[1], at[2] - o[2]];
}

/** Largest gap, in km, between the drawn dots and the exact ones, over a spread of members. */
function gapKm(view: PointsView, layer: GroupLayer, t: number, policy: ScalePolicy, placement = sunPlacement): number {
  const perKm = policy.mapPosition([1, 0, 0])[0];
  let worst = 0;
  for (let i = 0; i < COUNT; i += 37) {
    const drawn = view.memberLocalPosition(i);
    const truth = exactLocal(layer, i, t, policy, placement);
    worst = Math.max(worst, Math.hypot(drawn[0] - truth[0], drawn[1] - truth[1], drawn[2] - truth[2]) / perKm);
  }
  return worst;
}

function show(view: PointsView, t: number, policy: ScalePolicy = trueScale, placement = sunPlacement): void {
  view.sync(t, placement, policy);
  view.place(origin);
}

/** Generous for the rounding of 32 bits on orbits 2e8 km across (measured in keplerShader.test.ts), tight against any drawing mistake. */
const TOLERANCE_KM = 600;

describe("a large two-body group under a scaling policy is placed by the shader", () => {
  it("qualifies by group and policy, and says so", () => {
    const layer = stream();
    const view = new PointsView(layer);
    show(view, START + 120 * DAY, trueScale);
    expect(view.placedByShader).toBe(true);
    show(view, START + 120 * DAY, readableScale);
    expect(view.placedByShader).toBe(true);
    show(view, START + 120 * DAY, unlabelled);
    expect(view.placedByShader).toBe(false);
    show(view, START + 120 * DAY, trueScale);
    expect(view.placedByShader).toBe(true);
    // Small groups, and groups with no elements, keep the earlier path.
    const small = new PointsView({ ...layer, group: { ...layer.group, count: 10, keplerElements: undefined } as never });
    expect(small.placedByShader).toBe(false);
  });

  it("draws the group's positions, forward, paused, backward and across a seek, without refilling for the dots", () => {
    const layer = stream();
    const view = new PointsView(layer);
    const hour = 3_600_000;
    let t = START + 50 * DAY;
    for (let k = 0; k < 30; k += 1) { t += 6 * hour; show(view, t); expect(gapKm(view, layer, t, trueScale)).toBeLessThan(TOLERANCE_KM); }
    const fills = view.fillCount;
    for (let k = 0; k < 5; k += 1) { show(view, t); expect(gapKm(view, layer, t, trueScale)).toBeLessThan(TOLERANCE_KM); } // paused
    expect(view.fillCount).toBe(fills);
    for (let k = 0; k < 30; k += 1) { t -= 6 * hour; show(view, t); expect(gapKm(view, layer, t, trueScale)).toBeLessThan(TOLERANCE_KM); }
    for (const seek of [START + 390 * DAY, START + 3 * DAY, START + 200 * DAY + 1234]) {
      show(view, seek);
      expect(gapKm(view, layer, seek, trueScale)).toBeLessThan(TOLERANCE_KM);
    }
  }, 60_000);

  it("changes scale in place: the same dots, mapped by the new policy", () => {
    const layer = stream();
    const view = new PointsView(layer);
    const t = START + 150 * DAY;
    show(view, t, trueScale);
    const before = view.absolute();
    show(view, t, readableScale);
    expect(view.placedByShader).toBe(true);
    expect(gapKm(view, layer, t, readableScale)).toBeLessThan(TOLERANCE_KM);
    expect(view.absolute()[0]).toBeCloseTo(before[0] * 0.1, 6);
    show(view, t, unlabelled); // and the other path agrees to within its own blend
    expect(gapKm(view, layer, t, trueScale)).toBeLessThan(TOLERANCE_KM);
  });

  it("is hidden outside the group's time bounds and drawn at both ends of them", () => {
    const layer = stream();
    const view = new PointsView(layer);
    show(view, BOUNDS.startUtcMs - DAY);
    expect(view.drawn).toBe(false);
    expect(view.fillCount).toBe(0);
    expect(view.group.children.every((child) => !child.visible)).toBe(true);
    for (const edge of [BOUNDS.startUtcMs, BOUNDS.endUtcMs]) {
      show(view, edge);
      expect(view.drawn).toBe(true);
      expect(view.group.children.filter((child) => child.visible)).toHaveLength(1);
      expect(gapKm(view, layer, edge, trueScale)).toBeLessThan(TOLERANCE_KM);
    }
    show(view, BOUNDS.endUtcMs + DAY);
    expect(view.drawn).toBe(false);
  });

  it("adds the group's centre offset from the scene centre, every frame", () => {
    const layer = stream();
    const view = new PointsView(layer);
    const aboutEarth = placementAbout("earth", adapter);
    for (const t of [START + 20 * DAY, START + 20 * DAY + 7 * 3_600_000, START + 300 * DAY]) {
      show(view, t, trueScale, aboutEarth);
      expect(gapKm(view, layer, t, trueScale, aboutEarth)).toBeLessThan(TOLERANCE_KM);
    }
  });

  it("keeps the focus point and extent from exact fills, at a few of them rather than one per frame", () => {
    const layer = stream();
    const view = new PointsView(layer);
    const exact = new Float64Array(3 * COUNT);
    const centroidAt = (t: number): number[] => {
      layer.group.fillPositionsKm(t, exact);
      const c = [0, 0, 0];
      for (let i = 0; i < exact.length; i += 3) for (let k = 0; k < 3; k++) c[k] += exact[i + k] / COUNT;
      return eqjToRenderVector(c.map((v) => v * trueScale.linearUnitsPerKm!));
    };
    let t = START + 60 * DAY;
    show(view, t);
    centroidAt(t).forEach((v, k) => expect(view.absolute()[k]).toBeCloseTo(v, 6)); // after a seek the focus is exact
    const fills = view.fillCount;
    for (let k = 0; k < 120; k += 1) {
      t += 6 * 3_600_000; // thirty days at six hours a frame
      show(view, t);
      const truth = centroidAt(t);
      const c = view.absolute();
      expect(Math.hypot(c[0] - truth[0], c[1] - truth[1], c[2] - truth[2])).toBeLessThan(2e-4 * view.extentUnits(trueScale)); // measured about 1.5e-4 of the extent for this fast, wide fixture
    }
    expect(view.fillCount - fills).toBeLessThanOrEqual(6); // one per week, not one per frame
    expect(view.extentUnits(trueScale)).toBeGreaterThan(1000);
  }, 60_000);

  it("moves the phase epoch once a window, not once a frame", () => {
    const layer = stream();
    const view = new PointsView(layer);
    let t = START + 10 * DAY;
    for (let k = 0; k < 400; k += 1) { t += 3_600_000; show(view, t); }
    expect(view.rebases).toBeGreaterThanOrEqual(1);
    expect(view.rebases).toBeLessThan(40);
  }, 60_000);
});
