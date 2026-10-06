import { describe, expect, it } from "vitest";
import moonFixture from "./fixtures/moon-horizons.json";
import sunFixture from "./fixtures/sun-horizons.json";
import { SimulationClock } from "../src/core/clock";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { EARTH, MOON } from "../src/core/body";
import { MoonTrajectory } from "../src/core/moonTrajectory";
import {
  composeCenteredPositions,
  earthStateAt,
  inverseCenteredPosition,
  sunPositionFromEarthAt,
} from "../src/core/referenceCenters";
import { createCenteredPosition, createState } from "../src/core/state";
import { readableScale, trueScale } from "../src/core/scalePolicy";

function magnitude(vector: ArrayLike<number>): number {
  return Math.hypot(vector[0], vector[1], vector[2]);
}

function angularDifferenceArcminutes(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const cosine = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (magnitude(a) * magnitude(b));
  return Math.acos(Math.max(-1, Math.min(1, cosine))) * (180 / Math.PI) * 60;
}

describe("absolute-time clock", () => {
  it("pauses, seeks in either direction, and preserves continuity when the rate changes", () => {
    let monotonicMs = 0;
    const clock = new SimulationClock(1_000, () => monotonicMs);
    clock.play();
    monotonicMs = 250;
    expect(clock.now()).toBe(1_250);
    clock.setRate(4);
    expect(clock.now()).toBe(1_250);
    monotonicMs = 500;
    expect(clock.now()).toBe(2_250);
    clock.pause();
    monotonicMs = 5_000;
    expect(clock.now()).toBe(2_250);
    clock.seek(10_000);
    expect(clock.now()).toBe(10_000);
    clock.seek(500);
    expect(clock.now()).toBe(500);
    clock.setRate(-2);
    clock.play();
    monotonicMs = 5_250;
    expect(clock.now()).toBe(0);
    expect(clock.snapshot()).toEqual({ timeUtcMs: 0, playing: true, rate: -2 });
  });

  it("returns the same elapsed time under different observation schedules", () => {
    let coarseNow = 0;
    let fineNow = 0;
    const coarse = new SimulationClock(42_000, () => coarseNow);
    const fine = new SimulationClock(42_000, () => fineNow);
    coarse.play();
    fine.play();
    for (const step of [8, 12, 5, 15]) fineNow += step;
    coarseNow = 40;
    expect(coarse.now()).toBe(42_040);
    expect(fine.now()).toBe(42_040);
  });

  it("rejects invalid UTC times, rates, and a regressing monotonic source", () => {
    let monotonicMs = 10;
    const clock = new SimulationClock(0, () => monotonicMs);
    expect(() => clock.seek(Number.NaN)).toThrow(RangeError);
    expect(() => clock.seek(1.5)).toThrow(RangeError);
    expect(() => clock.seek(8.65e15)).toThrow(RangeError);
    expect(() => clock.setRate(0)).toThrow(RangeError);
    expect(() => clock.setRate(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    clock.play();
    monotonicMs = 9;
    expect(() => clock.now()).toThrow("monotonic time source moved backwards");

    let edgeNow = 0;
    const edgeClock = new SimulationClock(8.64e15, () => edgeNow);
    edgeClock.play();
    edgeNow = 1;
    expect(() => edgeClock.now()).toThrow(RangeError);
  });
});

describe("provider trajectories and scale policies", () => {
  const adapter = createOrbAstronomyAdapter();
  const moon = new MoonTrajectory(adapter);

  it("matches offline geometric JPL Moon vectors within the unchanged targets", () => {
    expect(moonFixture.samples).toHaveLength(8);
    let maximumAngleArcminutes = 0;
    let maximumDistanceErrorKm = 0;
    for (const sample of moonFixture.samples) {
      const state = moon.stateAt(Date.parse(sample.utc));
      expect(state.frame).toBe("EQJ");
      expect(state.center).toBe("earth");
      expect(state.positionKm).toBeInstanceOf(Float64Array);
      maximumAngleArcminutes = Math.max(
        maximumAngleArcminutes,
        angularDifferenceArcminutes(state.positionKm, sample.positionKm),
      );
      maximumDistanceErrorKm = Math.max(
        maximumDistanceErrorKm,
        Math.abs(magnitude(state.positionKm) - magnitude(sample.positionKm)),
      );
    }
    expect(maximumAngleArcminutes).toBeLessThanOrEqual(2);
    expect(maximumDistanceErrorKm).toBeLessThanOrEqual(100);
  });

  it("matches offline geometric JPL Sun vectors", () => {
    expect(sunFixture.samples).toHaveLength(8);
    let maximumAngleArcminutes = 0;
    let maximumDistanceErrorKm = 0;
    for (const sample of sunFixture.samples) {
      const state = sunPositionFromEarthAt(adapter, Date.parse(sample.utc));
      expect(state.center).toBe("earth");
      maximumAngleArcminutes = Math.max(
        maximumAngleArcminutes,
        angularDifferenceArcminutes(state.positionKm, sample.positionKm),
      );
      maximumDistanceErrorKm = Math.max(
        maximumDistanceErrorKm,
        Math.abs(magnitude(state.positionKm) - magnitude(sample.positionKm)),
      );
    }
    expect(maximumAngleArcminutes).toBeLessThanOrEqual(1);
    expect(maximumDistanceErrorKm).toBeLessThanOrEqual(100);
  });

  it("has changing lunar distance, a plausible monthly mean, and approximate sidereal recurrence", () => {
    const januaryDistances = moonFixture.samples
      .filter((sample) => sample.utc.startsWith("2024-01"))
      .map((sample) => magnitude(moon.stateAt(Date.parse(sample.utc)).positionKm));
    expect(Math.max(...januaryDistances) - Math.min(...januaryDistances)).toBeGreaterThan(40_000);
    const meanDistance = januaryDistances.reduce((sum, value) => sum + value, 0) / januaryDistances.length;
    expect(meanDistance).toBeGreaterThan(360_000);
    expect(meanDistance).toBeLessThan(400_000);

    const start = moon.stateAt(Date.parse("2024-01-01T00:00:00Z"));
    const recurrence = moon.stateAt(Date.parse("2024-01-28T07:43:11.390Z"));
    expect(angularDifferenceArcminutes(start.positionKm, recurrence.positionKm) / 60).toBeLessThanOrEqual(0.6);
    expect(Math.abs(magnitude(start.positionKm) - magnitude(recurrence.positionKm))).toBeLessThanOrEqual(1_500);
  });

  it("keeps same-time science fixed when playback rates differ", () => {
    let firstNow = 0;
    let secondNow = 0;
    const firstClock = new SimulationClock(Date.parse("2024-01-08T00:00:00Z"), () => firstNow);
    const secondClock = new SimulationClock(Date.parse("2024-01-08T00:00:00Z"), () => secondNow);
    firstClock.setRate(1);
    secondClock.setRate(500);
    expect(moon.stateAt(firstClock.now()).positionKm).toEqual(moon.stateAt(secondClock.now()).positionKm);
    firstClock.play();
    secondClock.play();
    firstNow = 1000;
    secondNow = 1000;
    expect(moon.stateAt(firstClock.now()).timeUtcMs).not.toBe(moon.stateAt(secondClock.now()).timeUtcMs);
  });

  it("composes explicit centers, preserves body identity, and rejects mixed epochs or frames", () => {
    const time = Date.parse("2024-01-15T00:00:00Z");
    const moonEarth = moon.stateAt(time);
    const earthSun = earthStateAt(adapter, time);
    const sunEarth = sunPositionFromEarthAt(adapter, time);
    const moonSun = composeCenteredPositions(moonEarth, earthSun);
    expect(moonSun.body).toBe("moon");
    expect(moonSun.center).toBe("sun");
    expect(Array.from(moonSun.positionKm)).toEqual([
      moonEarth.positionKm[0] + earthSun.positionKm[0],
      moonEarth.positionKm[1] + earthSun.positionKm[1],
      moonEarth.positionKm[2] + earthSun.positionKm[2],
    ]);
    const inverse = inverseCenteredPosition(moonSun);
    expect(inverse.body).toBe("sun");
    expect(inverse.center).toBe("moon");
    expect(Array.from(inverse.positionKm, (component, index) => component + moonSun.positionKm[index]))
      .toEqual([0, 0, 0]);
    const inverseEarthSun = inverseCenteredPosition(earthSun);
    expect(inverseEarthSun.body).toBe("sun");
    expect(inverseEarthSun.center).toBe("earth");
    expect(inverseEarthSun.positionKm).toEqual(sunEarth.positionKm);

    const nextEpoch = createCenteredPosition({ ...earthSun, timeUtcMs: time + 1 });
    expect(() => composeCenteredPositions(moonEarth, nextEpoch)).toThrow("identical timestamps");
    const otherFrame = { ...earthSun, frame: "ECL" as "EQJ" };
    expect(() => composeCenteredPositions(moonEarth, otherFrame)).toThrow("identical frames");
    const unrelatedBody = createCenteredPosition({
      body: "sun",
      center: "moon",
      timeUtcMs: time,
      frame: "EQJ",
      positionKm: [0, 0, 0],
    });
    expect(() => composeCenteredPositions(moonEarth, unrelatedBody)).toThrow("match the first center");
  });

  it("returns owned Float64 snapshots and leaves scientific state unchanged across scales", () => {
    const source = Float64Array.of(100, 200, 300);
    const state = createState({
      body: "moon",
      center: "earth",
      timeUtcMs: 0,
      positionKm: source,
      orientation: [0, 0, 0, 1],
    });
    source[0] = -1;
    const before = Array.from(state.positionKm);
    const truePosition = trueScale.mapPosition(state.positionKm);
    const readablePosition = readableScale.mapPosition(state.positionKm);
    expect(state.positionKm).not.toBe(source);
    expect(truePosition).not.toBe(state.positionKm);
    expect(readablePosition).not.toBe(state.positionKm);
    expect(readablePosition[0] / truePosition[0]).toBeCloseTo(0.1, 12);
    expect(Array.from(state.positionKm)).toEqual(before);
    expect(state.orientation).toEqual([0, 0, 0, 1]);
    expect(trueScale.mapRadius(MOON.radiusKm) / trueScale.mapRadius(EARTH.radiusKm))
      .toBeCloseTo(MOON.radiusKm / EARTH.radiusKm, 12);
    expect(readableScale.mapRadius(MOON.radiusKm)).toBe(trueScale.mapRadius(MOON.radiusKm));
    expect(readableScale.mapRadius(EARTH.radiusKm)).toBe(trueScale.mapRadius(EARTH.radiusKm));
    expect(magnitude(trueScale.mapPosition([EARTH.radiusKm, 0, 0]))).toBeCloseTo(1, 12);
    expect(magnitude(readableScale.mapPosition([EARTH.radiusKm, 0, 0]))).toBeCloseTo(0.1, 12);
  });

  it("rejects malformed states and scale inputs at their boundaries", () => {
    expect(() => createState({
      body: "moon", center: "earth", timeUtcMs: Number.NaN, positionKm: [1, 2, 3], orientation: [0, 0, 0, 1],
    })).toThrow(RangeError);
    expect(() => createState({
      body: "moon", center: "earth", timeUtcMs: 0, positionKm: [1, 2], orientation: [0, 0, 0, 1],
    })).toThrow(TypeError);
    expect(() => createState({
      body: "moon", center: "earth", timeUtcMs: 0, positionKm: [1, 2, 3], orientation: [0, 0, 0, 0],
    })).toThrow(RangeError);
    expect(() => createCenteredPosition({
      body: "moon", center: "earth", timeUtcMs: 0, frame: "ECL" as "EQJ", positionKm: [1, 2, 3],
    })).toThrow("EQJ frame only");
    expect(() => trueScale.mapPosition([0, Number.NaN, 0])).toThrow(TypeError);
    expect(() => readableScale.mapRadius(-1)).toThrow(RangeError);
    expect(() => adapter.moonPositionKm(Number.NaN)).toThrow(RangeError);
  });
});
