import { describe, expect, it, vi } from "vitest";
import { elementsToState, propagateKepler, GM } from "@lizard-isana/orb/kepler";
import { makeState, transform } from "@lizard-isana/orb/frames";
import { AstroInstant } from "@lizard-isana/orb/time";
import { createOrbitGroup, type OrbitGroupInput } from "../src/core/orbitGroup";
import {
  GroupBoundsError,
  GroupBufferError,
  GroupCountError,
  GroupElementsError,
} from "../src/core/pointGroup";
import { createProvenance } from "../src/core/provenance";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";

const adapter = createOrbTwoBodyAdapter();
const EPOCH = Date.UTC(2026, 7, 12);
const HOUR = 3_600_000;
const RADIANS = Math.PI / 180;
// Library agreement is expected to be exact (same code path); a nanometre is the named tolerance.
const LIBRARY_TOLERANCE_KM = 1e-6;

const provenance = createProvenance({
  sourceType: "illustrative",
  sources: ["made-up test group"],
  accuracy: "none; not a real population",
  notes: "Invented for contract tests.",
});

// A made-up ring of debris 7,000 km from Earth's centre.
const ring: OrbitGroupInput = {
  id: "test-ring",
  count: 200,
  center: "earth",
  plane: "EQJ",
  epochUtcMs: EPOCH,
  base: { semiMajorAxisKm: 7000, eccentricity: 0.01, inclinationDeg: 30, raanDeg: 40, argumentOfPeriapsisDeg: 0, trueAnomalyDeg: 0 },
  spread: { semiMajorAxisKm: 100, eccentricity: 0.005, inclinationDeg: 2, raanDeg: 3, trueAnomalyDeg: 180 },
  seed: 7,
  provenance,
};

// A made-up belt around the Sun, 2.5 AU out.
const belt: OrbitGroupInput = {
  ...ring,
  id: "test-belt",
  center: "sun",
  plane: "ecliptic-j2000",
  base: { semiMajorAxisKm: 3.7e8, eccentricity: 0.1, inclinationDeg: 5, raanDeg: 80, argumentOfPeriapsisDeg: 20, trueAnomalyDeg: 0 },
  spread: { semiMajorAxisKm: 2e7, eccentricity: 0.05, inclinationDeg: 3, raanDeg: 10, trueAnomalyDeg: 180 },
};

function fill(input: OrbitGroupInput, timeUtcMs: number): Float64Array {
  const group = createOrbitGroup(input, adapter);
  const out = new Float64Array(3 * group.count);
  group.fillPositionsKm(timeUtcMs, out);
  return out;
}

describe("point group contract", () => {
  it("declares its identity, centre, frame, bounds and provenance, and reads one member as an ordinary State", () => {
    const bounds = { startUtcMs: EPOCH, endUtcMs: EPOCH + 24 * HOUR };
    const group = createOrbitGroup({ ...ring, bounds }, adapter);
    expect(group).toMatchObject({ id: "test-ring", count: 200, center: "earth", frame: "EQJ", bounds });
    expect(group.provenance.sourceType).toBe("illustrative");
    expect(group.provenance.notes).toContain("unperturbed two-body");

    const t = EPOCH + 3 * HOUR;
    const state = group.stateAt(17, t);
    expect(state).toMatchObject({ body: "test-ring:17", center: "earth", frame: "EQJ", timeUtcMs: t, orientation: null });
    expect(Object.isFrozen(state)).toBe(true);
  });

  it("returns a single member whose position equals the batch values for the same time", () => {
    const group = createOrbitGroup(ring, adapter);
    const t = EPOCH + 5 * HOUR;
    const out = new Float64Array(3 * group.count);
    group.fillPositionsKm(t, out);
    for (const index of [0, 1, 99, 199]) {
      expect([...group.stateAt(index, t).positionKm]).toEqual([...out.subarray(3 * index, 3 * index + 3)]);
    }
  });

  it("rejects out-of-range member indexes", () => {
    const group = createOrbitGroup(ring, adapter);
    expect(() => group.stateAt(-1, EPOCH)).toThrow(RangeError);
    expect(() => group.stateAt(200, EPOCH)).toThrow(RangeError);
    expect(() => group.stateAt(1.5, EPOCH)).toThrow(RangeError);
  });
});

describe("orbit-based group determinism", () => {
  it("gives bit-identical arrays for the same time and seed, and across fills of one group", () => {
    const t = EPOCH + 9 * HOUR;
    const a = fill(ring, t);
    const b = fill(ring, t);
    expect(a.every((value, i) => Object.is(value, b[i]))).toBe(true);
    const group = createOrbitGroup(ring, adapter);
    const first = new Float64Array(a.length);
    const second = new Float64Array(a.length);
    group.fillPositionsKm(t, first);
    group.fillPositionsKm(t, second);
    expect(first.every((value, i) => Object.is(value, second[i]))).toBe(true);
  });

  it("gives different arrays for a different seed", () => {
    const t = EPOCH + 9 * HOUR;
    const a = fill(ring, t);
    const b = fill({ ...ring, seed: 8 }, t);
    expect(a.some((value, i) => value !== b[i])).toBe(true);
  });

  it("does not use Math.random", () => {
    const random = vi.spyOn(Math, "random");
    fill(ring, EPOCH + HOUR);
    expect(random).not.toHaveBeenCalled();
    random.mockRestore();
  });

  it("works Earth-centred and Sun-centred, with finite EQJ output at the right distance", () => {
    for (const [input, nominalKm] of [[ring, 7000], [belt, 3.7e8]] as const) {
      const out = fill(input, EPOCH + 30 * HOUR);
      expect(out.every(Number.isFinite)).toBe(true);
      const radius = Math.hypot(out[0], out[1], out[2]);
      expect(radius).toBeGreaterThan(nominalKm * 0.7);
      expect(radius).toBeLessThan(nominalKm * 1.3);
    }
  });

  it("outputs EQJ whether elements are given in the ecliptic or in EQJ", () => {
    // A flat orbit in the named plane: members stay in that plane, so the ecliptic one is tilted in EQJ.
    const flat = { ...ring, count: 50, spread: { trueAnomalyDeg: 180 }, base: { ...ring.base, inclinationDeg: 0, raanDeg: 0, eccentricity: 0.01 } };
    const t = EPOCH + 2 * HOUR;
    const eqjOut = fill({ ...flat, plane: "EQJ" }, t);
    const eclipticOut = fill({ ...flat, plane: "ecliptic-j2000" }, t);
    const obliquity = 84381.406 / 3600 * RADIANS;
    const eclipticNormal = [0, -Math.sin(obliquity), Math.cos(obliquity)];
    for (let i = 0; i < 50; i++) {
      expect(Math.abs(eqjOut[3 * i + 2])).toBeLessThan(1e-6);
      const along = eclipticOut[3 * i] * eclipticNormal[0] + eclipticOut[3 * i + 1] * eclipticNormal[1] + eclipticOut[3 * i + 2] * eclipticNormal[2];
      expect(Math.abs(along)).toBeLessThan(1e-6);
    }
  });
});

describe("propagation agrees with the library", () => {
  const zeroSpread = (center: "earth" | "sun", plane: "EQJ" | "ecliptic-j2000"): OrbitGroupInput => ({
    ...ring,
    count: 3,
    center,
    plane,
    spread: {},
  });

  it("matches the library's own propagation of the base orbit (EQJ elements)", () => {
    const t = EPOCH + 40 * HOUR;
    for (const center of ["earth", "sun"] as const) {
      const out = fill(zeroSpread(center, "EQJ"), t);
      const e = ring.base;
      const state = elementsToState({
        semiMajorAxis: e.semiMajorAxisKm,
        eccentricity: e.eccentricity,
        inclination: e.inclinationDeg * RADIANS,
        raan: e.raanDeg * RADIANS,
        argumentOfPeriapsis: e.argumentOfPeriapsisDeg * RADIANS,
        trueAnomaly: e.trueAnomalyDeg * RADIANS,
      }, GM[center]);
      const direct = propagateKepler(state.r, state.v, 40 * 3600, GM[center]);
      for (let member = 0; member < 3; member++) {
        for (let axis = 0; axis < 3; axis++) {
          expect(Math.abs(out[3 * member + axis] - direct.r[axis])).toBeLessThan(LIBRARY_TOLERANCE_KM);
        }
      }
    }
  });

  it("matches the library's frame transform for ecliptic-J2000 elements", () => {
    const t = EPOCH + 12 * HOUR;
    const out = fill(zeroSpread("sun", "ecliptic-j2000"), t);
    const e = ring.base;
    const state = elementsToState({
      semiMajorAxis: e.semiMajorAxisKm,
      eccentricity: e.eccentricity,
      inclination: e.inclinationDeg * RADIANS,
      raan: e.raanDeg * RADIANS,
      argumentOfPeriapsis: e.argumentOfPeriapsisDeg * RADIANS,
      trueAnomaly: e.trueAnomalyDeg * RADIANS,
    }, GM.sun);
    const instant = AstroInstant.fromUnixMs(EPOCH);
    const toEqj = (r: Float64Array) => transform(makeState({ t: instant, frame: "ecliptic-j2000", center: "sun", r }), { frame: "equatorial-j2000" });
    const direct = propagateKepler(toEqj(state.r).r, toEqj(state.v).r, 12 * 3600, GM.sun);
    for (let axis = 0; axis < 3; axis++) {
      expect(Math.abs(out[axis] - direct.r[axis])).toBeLessThan(LIBRARY_TOLERANCE_KM);
    }
  });
});

describe("named errors", () => {
  it("rejects a time outside the group's bounds", () => {
    const group = createOrbitGroup({ ...ring, bounds: { startUtcMs: EPOCH, endUtcMs: EPOCH + HOUR } }, adapter);
    const out = new Float64Array(3 * group.count);
    expect(() => group.fillPositionsKm(EPOCH + 2 * HOUR, out)).toThrow(GroupBoundsError);
    expect(() => group.fillPositionsKm(EPOCH - 1, out)).toThrow(GroupBoundsError);
    expect(() => group.stateAt(0, EPOCH + 2 * HOUR)).toThrow(GroupBoundsError);
    expect(() => group.fillPositionsKm(EPOCH + HOUR, out)).not.toThrow();
  });

  it("rejects a buffer of the wrong length", () => {
    const group = createOrbitGroup(ring, adapter);
    expect(() => group.fillPositionsKm(EPOCH, new Float64Array(3 * 200 - 1))).toThrow(GroupBufferError);
    expect(() => group.fillPositionsKm(EPOCH, new Float64Array(3 * 200 + 3))).toThrow(GroupBufferError);
  });

  it("rejects a zero, negative or fractional count", () => {
    for (const count of [0, -5, 2.5, Number.NaN]) {
      expect(() => createOrbitGroup({ ...ring, count }, adapter)).toThrow(GroupCountError);
    }
  });

  it("rejects non-finite elements, spreads and seeds", () => {
    expect(() => createOrbitGroup({ ...ring, base: { ...ring.base, eccentricity: Number.NaN } }, adapter)).toThrow(GroupElementsError);
    expect(() => createOrbitGroup({ ...ring, base: { ...ring.base, semiMajorAxisKm: Infinity } }, adapter)).toThrow(GroupElementsError);
    expect(() => createOrbitGroup({ ...ring, spread: { inclinationDeg: -1 } }, adapter)).toThrow(GroupElementsError);
    expect(() => createOrbitGroup({ ...ring, spread: { inclinationDeg: Number.NaN } }, adapter)).toThrow(GroupElementsError);
    expect(() => createOrbitGroup({ ...ring, seed: 1.5 }, adapter)).toThrow(GroupElementsError);
    expect(() => createOrbitGroup({ ...ring, seed: -1 }, adapter)).toThrow(GroupElementsError);
  });

  it("rejects a spread that leaves a bound orbit", () => {
    expect(() => createOrbitGroup({ ...ring, spread: { eccentricity: 5 } }, adapter)).toThrow(GroupElementsError);
    expect(() => createOrbitGroup({ ...ring, spread: { semiMajorAxisKm: 1e6 } }, adapter)).toThrow(GroupElementsError);
    expect(() => createOrbitGroup({ ...ring, base: { ...ring.base, inclinationDeg: 1 }, spread: { inclinationDeg: 20 } }, adapter)).toThrow(GroupElementsError);
  });

  it("rejects an invalid epoch and an invalid fill time", () => {
    expect(() => createOrbitGroup({ ...ring, epochUtcMs: 1.5 }, adapter)).toThrow(RangeError);
    const group = createOrbitGroup(ring, adapter);
    expect(() => group.fillPositionsKm(Number.NaN, new Float64Array(600))).toThrow(RangeError);
  });
});

describe("generic boundary for the new files", () => {
  const sources = import.meta.glob<string>(
    ["../src/core/pointGroup.ts", "../src/core/orbitGroup.ts", "../src/core/twoBodyAdapter.ts"],
    { query: "?raw", import: "default", eager: true },
  );

  it("covers all three new files and finds no experience, mission or shower naming", () => {
    expect(Object.keys(sources)).toHaveLength(3);
    const offenders = Object.entries(sources)
      .filter(([, source]) => /apollo|columbia|eagle|perseid|meteor|shower|swift|tuttle|radiant/i.test(source))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});

describe("public core exposes no library types", () => {
  it("returns only plain typed arrays and core values", () => {
    const group = createOrbitGroup(ring, adapter);
    expect(group.stateAt(0, EPOCH).positionKm).toBeInstanceOf(Float64Array);
    expect(adapter.eclipticJ2000ToEqjMatrix()).toBeInstanceOf(Float64Array);
  });
});
