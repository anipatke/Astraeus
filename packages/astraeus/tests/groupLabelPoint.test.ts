import { describe, expect, it } from "vitest";
import type { GroupLayer } from "../src/app/experienceDefinition";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { bestMember, labelDirection, poolResultants, VERNAL_EQUINOX, type Resultant } from "../src/app/groupLabelPoint";
import { PointsView } from "../src/app/PointsView";
import { eqjToRenderVector, type RenderVector } from "../src/app/renderCoordinates";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createOrbitGroup } from "../src/core/orbitGroup";
import { createProvenance } from "../src/core/provenance";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";
import { trueScale, type ScalePolicy } from "../src/presentation/scalePolicy";
import { placementAbout } from "./scenePlacement";

// T-459: a group's name sits on one of its dots. Made-up orbits about the Sun only (ARCH-03); each case runs through a real PointsView
// on the graphics-chip policy and on a policy that scales exactly but does not say so (the two ways the view fills).

const DAY = 86_400_000;
const START = Date.UTC(2030, 0, 1);
const BOUNDS = { startUtcMs: START, endUtcMs: START + 900 * DAY };
const AU_KM = 1.495978707e8;
const RING_KM = 3 * AU_KM;
const RING_SPREAD_KM = 0.05 * AU_KM;
const adapter = createOrbAstronomyAdapter();
const origin = new FloatingOrigin();
const sunPlacement = placementAbout("sun", adapter);
const provenance = createProvenance({
  sourceType: "illustrative",
  sources: ["Made up inside the group label tests"],
  accuracy: "None claimed.",
  notes: "Fixture.",
});
/** Scales exactly but does not say so, so the view takes the fills-plus-blend path. */
const cpuPolicy: ScalePolicy = {
  id: "true-scale",
  mapPosition: (p) => trueScale.mapPosition(p),
  mapRadius: (r) => trueScale.mapRadius(r),
};
const POLICIES: [string, ScalePolicy][] = [
  ["graphics chip", trueScale],
  ["blend of fills", cpuPolicy],
];

function layerOf(id: string, count: number, anomalyDeg: number, anomalySpreadDeg: number): GroupLayer {
  const group = createOrbitGroup(
    {
      id,
      count,
      center: "sun",
      plane: "ecliptic-j2000",
      epochUtcMs: START,
      provenance,
      seed: 5,
      bounds: BOUNDS,
      base: {
        semiMajorAxisKm: RING_KM,
        eccentricity: 0.001,
        inclinationDeg: 0,
        raanDeg: 0,
        argumentOfPeriapsisDeg: 0,
        trueAnomalyDeg: anomalyDeg,
      },
      spread: { semiMajorAxisKm: RING_SPREAD_KM, trueAnomalyDeg: anomalySpreadDeg },
    },
    createOrbTwoBodyAdapter(),
  );
  return {
    group,
    color: "#7fe3c4",
    object: { id, label: id, description: "Made up.", knownLimitations: ["Made up."] },
  };
}

function show(view: PointsView, t: number, policy: ScalePolicy): void {
  view.sync(t, sunPlacement, policy);
  view.place(origin);
}

/** Where every member is at `t`, in render axes, mapped as the label maps. */
function membersAt(layer: GroupLayer, t: number): RenderVector[] {
  return Array.from({ length: layer.group.count }, (_, i) =>
    eqjToRenderVector(trueScale.mapPosition(layer.group.stateAt(i, t).positionKm)),
  );
}

const norm = (v: ArrayLike<number>): number => Math.hypot(v[0], v[1], v[2]);
function angleDeg(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const cos = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (norm(a) * norm(b));
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}
function meanDirection(points: readonly RenderVector[]): RenderVector {
  const sum: RenderVector = [0, 0, 0];
  for (const p of points) for (let k = 0; k < 3; k += 1) sum[k] += p[k] / norm(p);
  return sum;
}
/** The widest angle between any member and the members' mean direction. */
function spreadDeg(points: readonly RenderVector[]): number {
  const mean = meanDirection(points);
  return Math.max(...points.map((p) => angleDeg(p, mean)));
}
const perKm = trueScale.mapPosition([1, 0, 0])[0];

describe("a group's name sits on its dots", () => {
  describe.each(POLICIES)("on the %s path", (_name, policy) => {
    it("a ring is named on the ring, where it crosses the vernal equinox direction, and stays put between fills", () => {
      const layer = layerOf("ring", 2500, 180, 180);
      const view = new PointsView(layer);
      const t = START + 100 * DAY;
      show(view, t, policy);
      const centroidKm = norm(view.absolute()) / perKm;
      expect(centroidKm).toBeLessThan(0.1 * AU_KM);
      const places: RenderVector[] = [];
      for (let k = 0; k < 6; k += 1) {
        show(view, t + k * 20 * DAY, policy);
        const place = view.labelAnchor();
        expect(Math.abs(norm(place) / perKm - RING_KM)).toBeLessThanOrEqual(RING_SPREAD_KM * 1.5);
        places.push([place[0], place[1], place[2]]);
      }
      // Held toward the vernal equinox (EQJ +x), so no step carries the name more than a few degrees round the ring.
      const equinox = eqjToRenderVector(VERNAL_EQUINOX);
      for (const place of places) expect(angleDeg(place, equinox)).toBeLessThan(10);
    });

    it("a swarm is named inside the swarm and follows it", () => {
      const layer = layerOf("swarm", 2500, 100, 15);
      const view = new PointsView(layer);
      for (const t of [START + 10 * DAY, START + 310 * DAY]) {
        show(view, t, policy);
        const members = membersAt(layer, t);
        const place = view.labelAnchor();
        expect(angleDeg(place, meanDirection(members))).toBeLessThanOrEqual(spreadDeg(members) + 0.5);
        expect(Math.abs(norm(place) / perKm - RING_KM)).toBeLessThanOrEqual(RING_SPREAD_KM * 1.5);
      }
    });

    it("several groups pooled are named inside their union", () => {
      const layers = [layerOf("a", 2500, 100, 10), layerOf("b", 2500, 135, 10)];
      const views = layers.map((layer) => new PointsView(layer));
      const t = START + 50 * DAY;
      for (const view of views) show(view, t, policy);
      const pooled = poolResultants(views.map((view) => view.labelResultant));
      expect(pooled.count).toBe(5000);
      const direction = labelDirection(pooled, null);
      const candidates = views.map((view) => view.labelCandidate(direction));
      const winner = candidates[0].cosine >= candidates[1].cosine ? 0 : 1;
      const place = views[winner].labelPlaceOf(candidates[winner].index, policy);
      const all = layers.flatMap((layer) => membersAt(layer, t));
      expect(angleDeg(place, meanDirection(all))).toBeLessThanOrEqual(spreadDeg(all) + 0.5);
    });

    it("a one-member group is named on its member", () => {
      const layer = layerOf("one", 1, 40, 0);
      const view = new PointsView(layer);
      const t = START + 7 * DAY;
      show(view, t, policy);
      const place = view.labelAnchor();
      const member = eqjToRenderVector(trueScale.mapPosition(layer.group.stateAt(0, t).positionKm));
      for (let k = 0; k < 3; k += 1) expect(place[k]).toBeCloseTo(member[k], 6);
    });
  });

  it("holds the earlier direction when the members have no clear mean, and picks the nearest member", () => {
    const ring: Resultant = { x: 0.01, y: 0, z: 0, count: 100 };
    expect(labelDirection(ring, null)).toEqual(VERNAL_EQUINOX);
    expect(labelDirection(ring, [0, 1, 0])).toEqual([0, 1, 0]);
    expect(labelDirection({ x: 0, y: 80, z: 0, count: 100 }, [1, 0, 0])).toEqual([0, 1, 0]);
    const km = [1, 0, 0, 0, 5, 0, 0, 0, -2];
    expect(bestMember(km, [0, 0, 0], 0, 3, [0, 1, 0]).index).toBe(1);
  });
});
