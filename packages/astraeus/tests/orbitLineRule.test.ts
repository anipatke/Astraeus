import { describe, expect, it } from "vitest";
import { eccentricAnomalyFromMean } from "../src/core/sunCentredSources";
import {
  clampTimeMs,
  eccentricTurnTimes,
  fineTimeMs,
  gridTimes,
  headAbout,
  headByNearness,
  headRange,
  mergedLineTimes,
  outsideMiddleHalf,
  turnGridTimes,
  isStale,
  JUMP_SHARE,
  keptHeadPoints,
  resampleNow,
  stepIndex,
  stepsMoved,
} from "../src/app/orbitLineRule";

describe("orbit line rule", () => {
  const step = 1000;

  it("puts every grid time on a whole multiple of the step, the last a whole step before the current one", () => {
    for (const display of [0, 999, 1000, 123_456, -1, -2500]) {
      const times = gridTimes(display, step, 5);
      expect(times).toHaveLength(5);
      for (const t of times) expect(Math.abs(t % step)).toBe(0);
      expect(times[4]).toBe((stepIndex(display, step) - 1) * step);
      for (let i = 1; i < 5; i += 1) expect(times[i] - times[i - 1]).toBe(step);
    }
  });

  it("keeps the grid fixed while the clock stays in one step, and keeps still-in-span times across a one-step re-sample", () => {
    expect(gridTimes(5000, step, 4)).toEqual(gridTimes(5999, step, 4));
    const before = gridTimes(5500, step, 4);
    const after = gridTimes(6500, step, 4);
    expect(after.slice(0, 3)).toEqual(before.slice(1));
  });

  it("handles negative times with floor steps", () => {
    expect(stepIndex(-1, step)).toBe(-1);
    expect(gridTimes(-1, step, 2)).toEqual([-3000, -2000]);
  });

  it("clamps into the loaded data and not past the display time", () => {
    expect(clampTimeMs(100, 5000, 1000)).toBe(1000);
    expect(clampTimeMs(3000, 5000, 1000)).toBe(3000);
    expect(clampTimeMs(9000, 5000, 1000)).toBe(5000);
    expect(clampTimeMs(100, 500, 1000)).toBe(500);
    expect(clampTimeMs(1.4, 5000, 0)).toBe(1);
  });

  it("runs the head from the last grid sample up to the display time, at most maxPoints on", () => {
    const { from, to } = headRange(6, 6500, step, 8, 32);
    expect(from).toBe(40);
    expect(to).toBe(Math.floor(6500 / (step / 8)));
    expect((to * step) / 8).toBeLessThanOrEqual(6500);
    expect((to + 1) * (step / 8)).toBeGreaterThan(6500);
    expect(headRange(6, 600_000, step, 8, 32).to).toBe(72);
    expect(headRange(6, 100, step, 8, 32)).toEqual({ from: 40, to: 40 });
  });

  it("keeps held head points only when the new range starts inside the held one", () => {
    expect(keptHeadPoints(40, 5, 42, 50)).toBe(3);
    expect(keptHeadPoints(40, 5, 40, 50)).toBe(5);
    expect(keptHeadPoints(40, 5, 45, 50)).toBe(0);
    expect(keptHeadPoints(40, 5, 38, 50)).toBe(0);
    expect(keptHeadPoints(40, 12, 42, 45)).toBe(0);
    expect(keptHeadPoints(Number.NaN, 0, 40, 50)).toBe(0);
  });

  it("re-samples at once on a jump, backwards, or a whole re-sample, and in turn when only stale", () => {
    const span = 127;
    expect(stepsMoved(7500, step, 5)).toBe(2);
    expect(resampleNow(0, span, false)).toBe(false);
    expect(resampleNow(3, span, false)).toBe(false);
    expect(resampleNow(Math.floor(JUMP_SHARE * span), span, false)).toBe(false);
    expect(resampleNow(Math.floor(JUMP_SHARE * span) + 1, span, false)).toBe(true);
    expect(resampleNow(-1, span, false)).toBe(true);
    expect(resampleNow(Number.NaN, span, false)).toBe(true);
    expect(resampleNow(0, span, true)).toBe(true);
    expect(isStale(0)).toBe(false);
    expect(isStale(1)).toBe(true);
  });
});

describe("one turn about the display time (T-445)", () => {
  const turn = 360_000;
  const count = 361;
  const step = turn / (count - 1);

  it("samples a whole turn on a fixed grid centred on the display time, and a re-sample moves no point that stays in the turn", () => {
    const times = turnGridTimes(1_000_123, turn, count);
    expect(times).toHaveLength(count);
    expect(times[count - 1]! - times[0]!).toBe(turn);
    expect(Math.abs(times[180]! - 1_000_123)).toBeLessThanOrEqual(step / 2);
    for (const t of times) expect(t % step).toBe(0);
    const later = turnGridTimes(1_000_123 + 0.3 * turn, turn, count);
    const shared = later.filter((t) => t <= times[count - 1]!);
    expect(shared.length).toBeGreaterThan(count / 2);
    for (const t of shared) expect(times).toContain(t);
  });

  it("re-samples only when the display time leaves the middle half of the turn", () => {
    expect(outsideMiddleHalf(500, 0, 1000)).toBe(false);
    expect(outsideMiddleHalf(250, 0, 1000)).toBe(false);
    expect(outsideMiddleHalf(750, 0, 1000)).toBe(false);
    expect(outsideMiddleHalf(249, 0, 1000)).toBe(true);
    expect(outsideMiddleHalf(751, 0, 1000)).toBe(true);
    expect(outsideMiddleHalf(5, Number.NaN, Number.NaN)).toBe(true);
  });

  it("spaces an eccentric turn on a fixed anomaly grid about the display time", () => {
    const orbit = { eccentricity: 0.9, periodMs: 1_000_000, periapsisUtcMs: 12_345 };
    const times = eccentricTurnTimes(400_000, orbit, 513, eccentricAnomalyFromMean);
    expect(times).toHaveLength(513);
    expect(times[512]! - times[0]!).toBe(orbit.periodMs);
    expect(times[0]!).toBeLessThan(400_000);
    expect(times[512]!).toBeGreaterThan(400_000);
    for (let i = 1; i < times.length; i += 1) expect(times[i]!).toBeGreaterThan(times[i - 1]!);
    // Shorter steps through periapsis than far out: the anomaly, not the time, is even.
    const gaps = times.slice(1).map((t, i) => t - times[i]!);
    expect(Math.min(...gaps) * 10).toBeLessThan(Math.max(...gaps));
    const later = eccentricTurnTimes(700_000, orbit, 513, eccentricAnomalyFromMean);
    for (const t of later.filter((u) => u <= times[512]!)) expect(times).toContain(t);
  });

  it("puts the head's fine points either side of the display time and merges far, head and live times in order, each once", () => {
    const fine = step / 16;
    const { from, to } = headAbout(1_000_123, fine, 16);
    expect(fineTimeMs(from + 16, fine)).toBeLessThanOrEqual(1_000_123);
    expect(fineTimeMs(from + 17, fine)).toBeGreaterThan(1_000_123);
    expect(to - from).toBe(33);
    const { times, farIndex } = mergedLineTimes([0, 10, 20, 30], [10, 12, 14, 20], 13);
    expect(times).toEqual([0, 10, 12, 13, 14, 20, 30]);
    expect(farIndex).toEqual([0, 1, -1, -1, -1, 2, 3]);
    expect(mergedLineTimes([0, 10], [], 10)).toEqual({ times: [0, 10], farIndex: [0, 1] });
    expect(headByNearness(1_000_123, fine, from, to).slice(0, 4)).toEqual([from + 17, from + 16, from + 18, from + 15]);
  });
});
