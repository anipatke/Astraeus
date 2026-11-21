import { describe, expect, it } from "vitest";
import { BufferAttribute, LineSegments } from "three";
import { DEFAULT_BODY_SET_LOOK, familiesWithPalette, validateBodySet, type BodySetLayer } from "../src/app/bodySet";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { OrbitSetView } from "../src/app/OrbitSetView";
import { eqjToRenderQuaternion, eqjToRenderVector } from "../src/app/renderCoordinates";
import { rotateVectorByQuaternion } from "../src/core/bodyOrientation";
import type { ChebyshevEphemeris } from "../src/core/chebyshevEphemeris";
import { createEphemerisGroup } from "../src/core/ephemerisGroup";
import { createProvenance } from "../src/core/provenance";
import { trueScale, type ScalePolicy } from "../src/core/scalePolicy";
import { createState, EQJ } from "../src/core/state";
import { placementAbout } from "./scenePlacement";

// T-368 (O-085): the EQJ -> render axis change is a proper rotation, and each hand-written copy of it agrees with eqjToRenderVector.
// (The Kepler shader's copy is pinned by tests/keplerShader.test.ts in the showers demo: flipping a sign there fails its three cases.)

const NON_SYMMETRIC = [0.3, -0.5, 0.8];

describe("the render-axis conversion", () => {
  const basis = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((unit) => eqjToRenderVector(unit));

  it("has determinant +1 and is orthonormal", () => {
    const [[a, b, c], [d, e, f], [g, h, i]] = basis;
    expect(a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)).toBe(1);
    for (let r = 0; r < 3; r += 1) {
      for (let s = 0; s < 3; s += 1) {
        const dot = basis[r][0] * basis[s][0] + basis[r][1] * basis[s][1] + basis[r][2] * basis[s][2];
        expect(dot).toBe(r === s ? 1 : 0);
      }
    }
  });

  it("keeps a quaternion unit length and rotates consistently with the vector", () => {
    let seed = 12345;
    const next = (): number => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296) * 2 - 1;
    const raw = [next(), next(), next(), next()];
    const norm = Math.hypot(...raw);
    const q = raw.map((v) => v / norm) as [number, number, number, number];
    const converted = eqjToRenderQuaternion(q);
    expect(Math.hypot(...converted)).toBeCloseTo(1, 14);
    // Rotate a vector by the converted quaternion with the same formula (q v q*), through the render axes.
    const [x, y, z, w] = converted;
    const [vx, vy, vz] = eqjToRenderVector(NON_SYMMETRIC);
    const tx = 2 * (y * vz - z * vy);
    const ty = 2 * (z * vx - x * vz);
    const tz = 2 * (x * vy - y * vx);
    const rotated = [vx + w * tx + (y * tz - z * ty), vy + w * ty + (z * tx - x * tz), vz + w * tz + (x * ty - y * tx)];
    const expected = eqjToRenderVector(rotateVectorByQuaternion(q, NON_SYMMETRIC));
    rotated.forEach((value, k) => expect(value).toBeCloseTo(expected[k], 12));
  });
});

// A made-up inclined circular orbit, so that every EQJ component is non-zero.
const GM = 1e5;
const R = 50_000;
const T0 = Date.UTC(2016, 10, 4);
const INCLINATION = 0.6;
const at = (timeUtcMs: number) => {
  const angle = Math.sqrt(GM / R ** 3) * ((timeUtcMs - T0) / 1000);
  const speed = Math.sqrt(GM / R);
  const p = [R * Math.cos(angle), R * Math.sin(angle) * Math.cos(INCLINATION), R * Math.sin(angle) * Math.sin(INCLINATION)];
  const v = [-speed * Math.sin(angle), speed * Math.cos(angle) * Math.cos(INCLINATION), speed * Math.cos(angle) * Math.sin(INCLINATION)];
  return { p, v };
};
const fake = {
  positionsKmInto(timeUtcMs: number, _bodies: readonly string[], out: Float64Array) {
    out.set(at(timeUtcMs).p, 0);
  },
  loadedFromUtcMs: () => T0 - 5 * 86_400_000,
  stateOf(id: string, timeUtcMs: number) {
    const { p, v } = at(timeUtcMs);
    return createState({ body: id, center: "jupiter", timeUtcMs, plane: EQJ, positionKm: p, velocityKmS: v, orientation: null });
  },
} as unknown as ChebyshevEphemeris;
const provenance = createProvenance({ sourceType: "illustrative", sources: ["made up"], accuracy: "none", notes: "" });
const layer: BodySetLayer = validateBodySet({
  id: "inclined",
  group: createEphemerisGroup({ id: "inclined", center: "jupiter", ephemeris: () => fake, members: ["alpha"], bounds: { startUtcMs: T0, endUtcMs: T0 + 14 * 86_400_000 }, provenance }),
  members: [{ id: "alpha", label: "Alpha", radiusKm: 1, family: "near" }],
  families: familiesWithPalette([{ id: "near", label: "Near" }]),
  bodyFamilies: {},
  centreGmKm3S2: GM,
});

/** The same scaling with no `linearUnitsPerKm`, so the view takes its general path (which calls eqjToRenderVector). */
const generalTrueScale: ScalePolicy = { id: trueScale.id, mapPosition: (km) => trueScale.mapPosition(km), mapRadius: (km) => trueScale.mapRadius(km) };

function drawn(policy: ScalePolicy): Float32Array[] {
  const orbits = new OrbitSetView(layer, 16);
  orbits.sync(T0, placementAbout("jupiter"), policy, true);
  orbits.place(new FloatingOrigin(), DEFAULT_BODY_SET_LOOK, true);
  return orbits.group.children.filter((child): child is LineSegments => child instanceof LineSegments).map((lines) => (lines.geometry.getAttribute("position") as BufferAttribute).array as Float32Array);
}

describe("hand-written copies of the conversion", () => {
  it("the orbit lines' scale-only fast path draws what the general path (eqjToRenderVector) draws, paths and heads", () => {
    expect(generalTrueScale.linearUnitsPerKm).toBeUndefined();
    const fast = drawn(trueScale);
    const general = drawn(generalTrueScale);
    expect(fast.length).toBe(2);
    fast.forEach((array, k) => {
      expect(array.length).toBe(general[k].length);
      let peak = 0;
      for (let i = 0; i < array.length; i += 1) {
        expect(array[i]).toBeCloseTo(general[k][i], 5);
        peak = Math.max(peak, Math.abs(array[i]));
      }
      expect(peak).toBeGreaterThan(0);
    });
  });
});
