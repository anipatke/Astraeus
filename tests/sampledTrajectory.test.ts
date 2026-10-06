import { describe, expect, it } from "vitest";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { SimulationClock } from "../src/core/clock";
import { createEvents } from "../src/core/events";
import { createProvenance } from "../src/core/provenance";
import { SampledTrajectory, TrajectoryOutOfRangeError, type TrajectorySample } from "../src/core/sampledTrajectory";
import { readableScale, trueScale } from "../src/core/scalePolicy";

const T0 = 1_000_000;
const STEP_MS = 60_000;

function build(
  samples: readonly TrajectorySample[],
  overrides: Partial<ConstructorParameters<typeof SampledTrajectory>[0]> = {},
): SampledTrajectory {
  return new SampledTrajectory({ body: "craft-a", center: "earth", samples, ...overrides });
}

function cubicSamples(count: number, withVelocity: boolean): TrajectorySample[] {
  // x(t) = 1 + 2t - 3t^2 + 0.5t^3 (t in seconds from T0); y = 7 - t; z = t^3 / 100.
  return Array.from({ length: count }, (_, i) => {
    const timeUtcMs = T0 + i * STEP_MS;
    const t = (i * STEP_MS) / 1000;
    return {
      timeUtcMs,
      positionKm: [1 + 2 * t - 3 * t * t + 0.5 * t ** 3, 7 - t, t ** 3 / 100],
      ...(withVelocity ? { velocityKmS: [2 - 6 * t + 1.5 * t * t, -1, (3 * t * t) / 100] } : {}),
    };
  });
}

const RADIUS_KM = 7000;
const OMEGA = 0.001; // rad/s
function circle(timeUtcMs: number): { p: number[]; v: number[] } {
  const a = OMEGA * ((timeUtcMs - T0) / 1000);
  return {
    p: [RADIUS_KM * Math.cos(a), RADIUS_KM * Math.sin(a), 0],
    v: [-RADIUS_KM * OMEGA * Math.sin(a), RADIUS_KM * OMEGA * Math.cos(a), 0],
  };
}
function circleSamples(count: number, stepMs: number): TrajectorySample[] {
  return Array.from({ length: count }, (_, i) => {
    const timeUtcMs = T0 + i * stepMs;
    const { p, v } = circle(timeUtcMs);
    return { timeUtcMs, positionKm: p, velocityKmS: v };
  });
}

describe("SampledTrajectory sampling and bounds", () => {
  const linear = build([
    { timeUtcMs: T0, positionKm: [0, 0, 0] },
    { timeUtcMs: T0 + 1000, positionKm: [10, 20, 30] },
    { timeUtcMs: T0 + 3000, positionKm: [30, 60, 90] },
  ]);

  it("is deterministic and declares its bounds, center and null orientation", () => {
    const a = linear.stateAt(T0 + 1500);
    const b = linear.stateAt(T0 + 1500);
    expect(Array.from(a.positionKm)).toEqual(Array.from(b.positionKm));
    expect(linear.bounds).toEqual({ startUtcMs: T0, endUtcMs: T0 + 3000 });
    expect(a).toMatchObject({ body: "craft-a", center: "earth", frame: "EQJ", orientation: null });
    expect(a.velocityKmS).toBeUndefined();
  });

  it("handles before-first, first, between, last and after-last", () => {
    expect(() => linear.stateAt(T0 - 1)).toThrow(TrajectoryOutOfRangeError);
    expect(() => linear.stateAt(T0 + 3001)).toThrow(TrajectoryOutOfRangeError);
    expect(Array.from(linear.stateAt(T0).positionKm)).toEqual([0, 0, 0]);
    expect(Array.from(linear.stateAt(T0 + 3000).positionKm)).toEqual([30, 60, 90]);
    expect(Array.from(linear.stateAt(T0 + 1000).positionKm)).toEqual([10, 20, 30]);
    expect(Array.from(linear.stateAt(T0 + 2000).positionKm)).toEqual([20, 40, 60]);
  });

  it("returns fresh snapshots that never expose internal buffers", () => {
    const first = linear.stateAt(T0 + 1000);
    (first.positionKm as Float64Array)[0] = 999;
    expect(linear.stateAt(T0 + 1000).positionKm[0]).toBe(10);
    const input = [
      { timeUtcMs: T0, positionKm: [0, 0, 0] },
      { timeUtcMs: T0 + 1000, positionKm: [1, 1, 1] },
    ];
    const copy = build(input);
    input[0].positionKm[0] = 50;
    expect(copy.stateAt(T0).positionKm[0]).toBe(0);
  });

  it("rejects a center it does not hold", () => {
    expect(() => linear.stateAt(T0, "sun")).toThrow(/holds center/);
    expect(linear.stateAt(T0, "earth").center).toBe("earth");
  });
});

describe("SampledTrajectory interpolation", () => {
  it("is exact for linear motion without velocity", () => {
    const state = build([
      { timeUtcMs: T0, positionKm: [0, 0, 0] },
      { timeUtcMs: T0 + 4000, positionKm: [8, -4, 12] },
    ]).stateAt(T0 + 1000);
    expect(Array.from(state.positionKm)).toEqual([2, -1, 3]);
  });

  it("reproduces cubic motion with Hermite interpolation", () => {
    const trajectory = build(cubicSamples(4, true));
    const t = 90;
    const state = trajectory.stateAt(T0 + t * 1000);
    expect(state.positionKm[0]).toBeCloseTo(1 + 2 * t - 3 * t * t + 0.5 * t ** 3, 6);
    expect(state.positionKm[1]).toBeCloseTo(7 - t, 9);
    expect(state.positionKm[2]).toBeCloseTo(t ** 3 / 100, 6);
    expect(state.velocityKmS?.[0]).toBeCloseTo(2 - 6 * t + 1.5 * t * t, 6);
  });

  it("stays close to a circular orbit between samples", () => {
    const trajectory = build(circleSamples(11, 30_000));
    for (let k = 1; k < 10; k += 1) {
      const timeUtcMs = T0 + k * 30_000 + 12_345;
      const truth = circle(timeUtcMs);
      const state = trajectory.stateAt(timeUtcMs);
      expect(Math.hypot(...state.positionKm.map((c, i) => c - truth.p[i]))).toBeLessThan(0.05);
    }
  });
});

describe("SampledTrajectory validation", () => {
  const two = (b: Partial<TrajectorySample>): TrajectorySample[] => [
    { timeUtcMs: T0, positionKm: [0, 0, 0] },
    { timeUtcMs: T0 + 1000, positionKm: [1, 1, 1], ...b },
  ];

  it("rejects bad construction", () => {
    expect(() => build([{ timeUtcMs: T0, positionKm: [0, 0, 0] }])).toThrow(/at least two/);
    expect(() => build(two({ timeUtcMs: T0 }))).toThrow(/strictly increasing/);
    expect(() => build(two({ timeUtcMs: T0 - 1 }))).toThrow(/strictly increasing/);
    expect(() => build(two({ positionKm: [Number.NaN, 0, 0] }))).toThrow(/finite/);
    expect(() => build(two({ velocityKmS: [0, 0, 0] }))).toThrow(/every sample or on none/);
    expect(() => build(two({}), { frame: "ICRF" as never })).toThrow(/EQJ/);
    expect(() => build(two({}), { center: "mars" as never })).toThrow(/reference center/);
    expect(() => build(two({}), { body: "" })).toThrow();
  });
});

describe("provenance and events", () => {
  it("attaches provenance without affecting State", () => {
    const samples = cubicSamples(3, true);
    const plain = build(samples);
    const documented = build(samples, {
      provenance: { sourceType: "reconstructed", sources: ["doc A"], accuracy: "~1 km", notes: "synthetic" },
    });
    expect(documented.provenance?.sourceType).toBe("reconstructed");
    expect(Array.from(documented.stateAt(T0 + 30_000).positionKm)).toEqual(Array.from(plain.stateAt(T0 + 30_000).positionKm));
    expect(() => createProvenance({ sourceType: "guess" as never, sources: [], accuracy: "", notes: "" })).toThrow();
  });

  it("validates events: sorted and unique ids", () => {
    expect(createEvents([{ timeUtcMs: 1, id: "a", label: "A" }, { timeUtcMs: 2, id: "b", label: "B", type: "x" }])).toHaveLength(2);
    expect(() => createEvents([{ timeUtcMs: 2, id: "a", label: "A" }, { timeUtcMs: 1, id: "b", label: "B" }])).toThrow(/sorted/);
    expect(() => createEvents([{ timeUtcMs: 1, id: "a", label: "A" }, { timeUtcMs: 2, id: "a", label: "B" }])).toThrow(/duplicate/);
  });
});

describe("presentation independence", () => {
  const trajectory = build(circleSamples(5, 30_000));

  it("leaves State unchanged under TrueScale and ReadableScale", () => {
    const before = Array.from(trajectory.stateAt(T0 + 45_000).positionKm);
    const trueMapped = trueScale.mapPosition(before);
    const readableMapped = readableScale.mapPosition(before);
    expect(readableMapped[0] / trueMapped[0]).toBeCloseTo(0.1, 12);
    expect(Array.from(trajectory.stateAt(T0 + 45_000).positionKm)).toEqual(before);
  });

  it("leaves State unchanged under floating-origin rebasing", () => {
    const state = trajectory.stateAt(T0 + 45_000);
    const before = Array.from(state.positionKm);
    const origin = new FloatingOrigin();
    origin.set(trueScale.mapPosition(before));
    origin.rebaseIfFar([100, 100, 100], 1);
    origin.toLocal(trueScale.mapPosition(before));
    expect(Array.from(trajectory.stateAt(T0 + 45_000).positionKm)).toEqual(before);
    expect(Array.from(state.positionKm)).toEqual(before);
  });

  it("gives identical State for the same T via seek, 1x and accelerated playback", () => {
    const target = T0 + 90_000;
    let monotonicMs = 0;
    const seeked = new SimulationClock(T0, () => monotonicMs);
    seeked.seek(target);

    const realtime = new SimulationClock(T0, () => monotonicMs);
    realtime.play();
    monotonicMs += 90_000;
    const realtimeNow = realtime.now();

    const fast = new SimulationClock(T0, () => monotonicMs);
    fast.setRate(60);
    fast.play();
    monotonicMs += 1_500;
    const fastNow = fast.now();

    expect([realtimeNow, fastNow]).toEqual([target, target]);
    const expected = Array.from(trajectory.stateAt(seeked.now()).positionKm);
    expect(Array.from(trajectory.stateAt(realtimeNow).positionKm)).toEqual(expected);
    expect(Array.from(trajectory.stateAt(fastNow).positionKm)).toEqual(expected);
  });
});
