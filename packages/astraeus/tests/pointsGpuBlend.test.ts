import { describe, expect, it } from "vitest";
import type { GroupLayer } from "../src/app/experienceDefinition";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { PointsView } from "../src/app/PointsView";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createProvenance } from "../src/core/provenance";
import { memberState, type PointGroup } from "../src/core/pointGroup";
import { readableScale, trueScale } from "../src/core/scalePolicy";
import { eqjToRenderVector } from "../src/app/renderCoordinates";
import { sceneOffsetKm } from "../src/app/sceneLayout";
import { placementAbout } from "./scenePlacement";

// T-073: the blend of the two fills happens in the vertex shader. Proven on a made-up ring first (ARCH-03): the numbers
// handed to the shader (two attributes, a factor, an offset) must reproduce today's CPU blend
// `from + f * (to - from) - origin` to within 32-bit float precision, far from the scene centre and after the origin moves.

const adapter = createOrbAstronomyAdapter();
const placement = placementAbout("earth", adapter);
const START = Date.UTC(2030, 0, 1);
const END = START + 6 * 3_600_000;
const COUNT = 500;
const SPAN = 600_000;
const provenance = createProvenance({
  sourceType: "illustrative",
  sources: ["Made up inside the GPU blend tests; not a real population"],
  accuracy: "None claimed. A rotating ring invented for this fixture.",
  notes: "Exists to prove the points layer's shader inputs.",
});

function ring(): PointGroup {
  const position = (index: number, t: number): number[] => {
    const angle = (2 * Math.PI * index) / COUNT + (2 * Math.PI * (t - START)) / (END - START);
    const radius = 20_000 + (index % 7) * 500;
    return [radius * Math.cos(angle), radius * Math.sin(angle), 3_000 * Math.sin(2 * angle)];
  };
  const bounds = { startUtcMs: START, endUtcMs: END };
  return {
    id: "ring", count: COUNT, center: "moon", frame: "EQJ", bounds, provenance,
    fillPositionsKm(t, out) { for (let i = 0; i < COUNT; i += 1) out.set(position(i, t), 3 * i); },
    stateAt: (index, t) => memberState({ id: "ring", center: "moon", bounds }, index, t, position(index, t)),
  };
}

const layer: GroupLayer = {
  group: ring(), color: "#88ccff", refillAfterMs: SPAN,
  object: { id: "ring", label: "Ring", description: "A made-up ring.", knownLimitations: ["Made up."] },
};

/** Today's blend, in 64-bit floats from the group's own positions: what the CPU loop used to write. */
function exact(t: number, policy: typeof trueScale, origin: ArrayLike<number>, index: number, before: number, after: number): number[] {
  const at = (time: number): number[] => {
    const km = layer.group.stateAt(index, time).positionKm;
    const off = sceneOffsetKm(placement, "moon", time) ?? [0, 0, 0];
    return eqjToRenderVector(policy.mapPosition([km[0] + off[0], km[1] + off[1], km[2] + off[2]])) as number[];
  };
  const a = at(before);
  const b = at(after);
  const f = after > before ? (t - before) / (after - before) : 0;
  return [0, 1, 2].map((k) => a[k] + f * (b[k] - a[k]) - origin[k]);
}

/** The shader's arithmetic in 32 bits: mix(from, to, factor) + offset. */
function shaded(view: PointsView, index: number): number[] {
  return view.memberLocalPosition(index);
}

describe("points layer blend inputs for the vertex shader", () => {
  const origin = new FloatingOrigin();
  const worst = (view: PointsView, t: number, policy: typeof trueScale, before: number, after: number): number => {
    let widest = 0;
    for (let i = 0; i < COUNT; i += 1) {
      const want = exact(t, policy, origin.scaledCameraOrigin, i, before, after);
      const got = shaded(view, i);
      for (let k = 0; k < 3; k += 1) widest = Math.max(widest, Math.abs(got[k] - want[k]));
    }
    return widest;
  };

  it("reproduce the exact blended positions at fills, between fills, after a slide, in both scales and with the origin moved", () => {
    const view = new PointsView(layer);
    const t0 = START + 1_000_000;
    // Earth radii: positions are a few units across, the Moon sits about 60 units from the scene centre; 32-bit error is ~1e-5.
    const tolerance = 1e-4;
    view.sync(t0, placement, trueScale);
    view.place(origin);
    expect(worst(view, t0, trueScale, t0, t0)).toBeLessThan(tolerance); // a seek: both fills the same, factor 0
    for (const t of [t0 + 100_000, t0 + SPAN / 2]) {
      view.sync(t, placement, trueScale);
      view.place(origin);
      expect(view.blendInputs.factor).toBeGreaterThan(0);
      expect(worst(view, t, trueScale, t0, t0 + SPAN)).toBeLessThan(tolerance);
    }
    const slid = t0 + SPAN + 200_000; // past the pair: slides, anchor and both attributes are rewritten
    view.sync(t0 + SPAN, placement, trueScale);
    view.sync(slid, placement, trueScale);
    view.place(origin);
    expect(worst(view, slid, trueScale, t0 + SPAN, t0 + 2 * SPAN)).toBeLessThan(tolerance);
    origin.set([40, -25, 7]); // the camera moved: only the offset changes
    const attributesBefore = Float32Array.from(view.blendInputs.from);
    view.place(origin);
    expect(view.blendInputs.from).toEqual(attributesBefore);
    expect(worst(view, slid, trueScale, t0 + SPAN, t0 + 2 * SPAN)).toBeLessThan(tolerance);
    view.sync(slid, placement, readableScale); // a scale change remaps both fills and rewrites the attributes
    view.place(origin);
    expect(worst(view, slid, readableScale, t0 + SPAN, t0 + 2 * SPAN)).toBeLessThan(tolerance);
    expect(attributesBefore).not.toEqual(view.blendInputs.from);
  });

  it("rewrites the attributes only when a fill changes, not on frames that only move the blend or the origin", () => {
    const view = new PointsView(layer);
    const origin2 = new FloatingOrigin();
    const t0 = START + 1_000_000;
    view.sync(t0, placement, trueScale);
    view.sync(t0 + 1_000, placement, trueScale); // after a seek the first move slides the pair
    view.place(origin2);
    const { from } = view.blendInputs;
    const marker = -12345;
    from[0] = marker; // a stand-in for "not rewritten": an upload would overwrite it
    for (let t = t0 + 2_000; t < t0 + SPAN; t += 50_000) {
      view.sync(t, placement, trueScale);
      origin2.set([t % 7, 1, 2]);
      view.place(origin2);
      expect(from[0]).toBe(marker);
    }
    view.sync(t0 + SPAN + 1_000, placement, trueScale); // the pair slides: rewritten
    view.place(origin2);
    expect(from[0]).not.toBe(marker);
  });
});
