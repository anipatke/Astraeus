import { describe, expect, it, vi } from "vitest";
import type { BufferAttribute, LineSegments } from "three";
import { DEFAULT_BODY_SET_LOOK, familiesWithPalette, validateBodySet, type BodySetLayer } from "../src/app/bodySet";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { OrbitSetView } from "../src/app/OrbitSetView";
import type { ChebyshevEphemeris } from "../src/core/chebyshevEphemeris";
import { createEphemerisGroup } from "../src/core/ephemerisGroup";
import { createProvenance } from "../src/core/provenance";
import { createState, EQJ } from "../src/core/state";
import { readableScale, trueScale } from "../src/presentation/scalePolicy";
import { placementAbout } from "./scenePlacement";

// ARCH-03: made-up bodies on circular orbits about a made-up GM (a set with a balance point, one without), not a real system.
const GM = 1e5;
const RADII_KM: Record<string, number> = { alpha: 50_000, beta: 120_000, gamma: 200_000 };
const T0 = Date.UTC(2016, 10, 4);
const HOUR_MS = 3_600_000;
const circular = (id: string, timeUtcMs: number) => {
  const r = RADII_KM[id];
  const angle = Math.sqrt(GM / r ** 3) * ((timeUtcMs - T0) / 1000);
  const speed = Math.sqrt(GM / r);
  return {
    p: [r * Math.cos(angle), r * Math.sin(angle), 0],
    v: [-speed * Math.sin(angle), speed * Math.cos(angle), 0],
  };
};
const fake: ChebyshevEphemeris = {
  positionsKmInto(timeUtcMs: number, bodies: readonly string[], out: Float64Array) {
    bodies.forEach((id, i) => out.set(circular(id, timeUtcMs).p, 3 * i));
  },
  loadedFromUtcMs: () => T0 - 5 * 86_400_000,
  stateOf(id: string, timeUtcMs: number) {
    const { p, v } = circular(id, timeUtcMs);
    return createState({
      body: id,
      center: "jupiter",
      timeUtcMs,
      plane: EQJ,
      positionKm: p,
      velocityKmS: v,
      orientation: null,
    });
  },
} as unknown as ChebyshevEphemeris;
const provenance = createProvenance({ sourceType: "illustrative", sources: ["made up"], accuracy: "none", notes: "" });
const bounds = { startUtcMs: T0, endUtcMs: T0 + 60 * 86_400_000 };
function makeLayer(balance: boolean): BodySetLayer {
  return validateBodySet({
    id: `made-up-${balance ? "balance" : "plain"}`,
    group: createEphemerisGroup({
      id: "made-up",
      center: "jupiter",
      ephemeris: () => fake,
      members: ["alpha", "beta", "gamma"],
      bounds,
      provenance,
    }),
    members: ["alpha", "beta", "gamma"].map((id) => ({ id, label: id, radiusKm: 1, family: "all" })),
    families: familiesWithPalette([{ id: "all", label: "All" }]),
    bodyFamilies: {},
    centreGmKm3S2: GM,
    ...(balance ? { balancePoint: { body: "gamma", gmKm3S2: GM / 10 } } : {}),
  });
}
const placement = placementAbout("jupiter");
const T_START = T0 + 3 * 86_400_000;

function buffers(view: OrbitSetView): { positions: BufferAttribute; sizes: BufferAttribute } {
  const geometry = (view.group.children[0] as LineSegments).geometry;
  return {
    positions: geometry.getAttribute("position") as BufferAttribute,
    sizes: geometry.getAttribute("aSize") as BufferAttribute,
  };
}
/** The first and last index (exclusive) at which two arrays differ, or null when equal. */
function changedSpan(a: ArrayLike<number>, b: ArrayLike<number>): [number, number] | null {
  let first = -1;
  let last = -1;
  for (let i = 0; i < a.length; i += 1)
    if (a[i] !== b[i]) {
      if (first < 0) first = i;
      last = i + 1;
    }
  return first < 0 ? null : [first, last];
}
const frame = (view: OrbitSetView, origin: FloatingOrigin, t: number, enabled = true) => {
  view.sync(t, placement, trueScale, enabled);
  view.place(origin, DEFAULT_BODY_SET_LOOK, false);
};

describe.each([true, false])("orbit-set lines in an unchanged frame (balance point: %s)", (balance) => {
  it("does not resample when nothing changed", () => {
    const layer = makeLayer(balance);
    const view = new OrbitSetView(layer);
    const reads = vi.spyOn(fake, "positionsKmInto");
    const states = vi.spyOn(fake, "stateOf");
    const calls = (run: () => void): number => {
      reads.mockClear();
      states.mockClear();
      run();
      return reads.mock.calls.length + states.mock.calls.length;
    };
    view.sync(T_START, placement, trueScale, true);
    const counts = {
      unchanged: calls(() => view.sync(T_START, placement, trueScale, true)),
      time: calls(() => view.sync(T_START + HOUR_MS, placement, trueScale, true)),
      policy: calls(() => view.sync(T_START + HOUR_MS, placement, readableScale, true)),
      disabled: calls(() => view.sync(T_START + HOUR_MS, placement, readableScale, false)),
      enabled: calls(() => view.sync(T_START + HOUR_MS, placement, readableScale, true)),
      placement: calls(() => view.sync(T_START + HOUR_MS, placementAbout("jupiter"), readableScale, true)),
    };
    expect(counts.unchanged).toBe(0);
    for (const key of ["time", "policy", "enabled", "placement"] as const) expect(counts[key], key).toBeGreaterThan(0);
  });

  it("keeps one dirty range per buffer, covering every changed path", () => {
    const view = new OrbitSetView(makeLayer(balance));
    const origin = new FloatingOrigin();
    const { positions, sizes } = buffers(view);
    frame(view, origin, T_START);
    for (let k = 1; k <= 100; k += 1) {
      const before = {
        p: Float32Array.from(positions.array as Float32Array),
        s: Float32Array.from(sizes.array as Float32Array),
      };
      frame(view, origin, T_START + k * HOUR_MS);
      for (const [attribute, was] of [
        [positions, before.p],
        [sizes, before.s],
      ] as const) {
        expect(attribute.updateRanges.length, `frame ${k}`).toBeLessThanOrEqual(1);
        const changed = changedSpan(was, attribute.array);
        if (changed === null) continue;
        const [range] = attribute.updateRanges;
        expect(range.start).toBeLessThanOrEqual(changed[0]);
        expect(range.start + range.count).toBeGreaterThanOrEqual(changed[1]);
      }
    }
  });

  it("marks no range while hidden, then one covering every path changed meanwhile", () => {
    const view = new OrbitSetView(makeLayer(balance));
    const origin = new FloatingOrigin();
    const { positions } = buffers(view);
    frame(view, origin, T_START);
    positions.clearUpdateRanges();
    const start = Float32Array.from(positions.array as Float32Array);
    view.group.visible = false;
    for (let k = 1; k <= 100; k += 1) {
      frame(view, origin, T_START + k * HOUR_MS);
      expect(positions.updateRanges.length, `frame ${k}`).toBe(0);
    }
    view.group.visible = true;
    frame(view, origin, T_START + 100 * HOUR_MS);
    expect(positions.updateRanges.length).toBe(1);
    const changed = changedSpan(start, positions.array)!;
    expect(positions.updateRanges[0].start).toBeLessThanOrEqual(changed[0]);
    expect(positions.updateRanges[0].start + positions.updateRanges[0].count).toBeGreaterThanOrEqual(changed[1]);
    // A twin that ran the same frames visible draws the same lines.
    const twin = new OrbitSetView(makeLayer(balance));
    for (let k = 0; k <= 100; k += 1) frame(twin, new FloatingOrigin(), T_START + k * HOUR_MS);
    expect(Array.from(positions.array)).toEqual(Array.from(buffers(twin).positions.array));
  });
});
