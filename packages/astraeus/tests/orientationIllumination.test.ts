import { describe, expect, it } from "vitest";
import phaseFixture from "./fixtures/usno-moon-phases-2024.json";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import {
  rotateVectorByQuaternion,
} from "../src/core/bodyOrientation";
import { directionFromCenterToSun, directionToSun, lunarIlluminatedFraction } from "../src/core/illumination";
import { MoonTrajectory } from "../src/core/moonTrajectory";
import { earthStateAt, sunPositionFromEarthAt } from "../src/core/referenceCenters";

function unit(vector: ArrayLike<number>): Float64Array {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  return Float64Array.of(vector[0] / length, vector[1] / length, vector[2] / length);
}

function dot(a: ArrayLike<number>, b: ArrayLike<number>): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function angularDifferenceDegrees(a: ArrayLike<number>, b: ArrayLike<number>): number {
  return Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (Math.hypot(a[0], a[1], a[2]) * Math.hypot(b[0], b[1], b[2]))))) * 180 / Math.PI;
}

function phaseTimeUtcMs(event: { year: number; month: number; day: number; time: string }): number {
  return Date.parse(`${event.year}-${String(event.month).padStart(2, "0")}-${String(event.day).padStart(2, "0")}T${event.time}:00Z`);
}

describe("scientific Earth and Moon orientation", () => {
  const adapter = createOrbAstronomyAdapter();
  const moon = new MoonTrajectory(adapter);

  it("uses a normalized date-based Earth-fixed-to-EQJ orientation with sidereal daily motion", () => {
    const epoch = Date.parse("2024-01-01T00:00:00Z");
    const earth0 = earthStateAt(adapter, epoch);
    const earth1 = earthStateAt(adapter, epoch + 86_400_000);
    expect(earth0.orientation).not.toBeNull();
    expect(Math.hypot(...earth0.orientation!)).toBeCloseTo(1, 12);
    expect(Math.hypot(...earth1.orientation!)).toBeCloseTo(1, 12);

    const primeMeridian0 = rotateVectorByQuaternion(earth0.orientation!, [1, 0, 0]);
    const primeMeridian1 = rotateVectorByQuaternion(earth1.orientation!, [1, 0, 0]);
    const phase0 = Math.atan2(primeMeridian0[1], primeMeridian0[0]);
    const phase1 = Math.atan2(primeMeridian1[1], primeMeridian1[0]);
    const wrappedAdvance = (phase1 - phase0 + 2 * Math.PI) % (2 * Math.PI);
    const advanceDegrees = wrappedAdvance * 180 / Math.PI;
    // 1.002737909 sidereal turns per mean solar day, allowing the small date-frame terms.
    expect(advanceDegrees).toBeGreaterThan(0.95);
    expect(advanceDegrees).toBeLessThan(1.02);
  });

  it("keeps the Moon's body +X near-side axis Earth-facing and its +Z pole on the local orbit normal", () => {
    for (const utc of [
      "2022-06-01T00:00:00Z",
      "2024-01-01T00:00:00Z",
      "2024-01-15T00:00:00Z",
      "2024-01-28T07:43:11.390Z",
      "2025-06-01T00:00:00Z",
    ]) {
      const time = Date.parse(utc);
      const state = moon.stateAt(time);
      const nearSideAxis = rotateVectorByQuaternion(state.orientation!, [1, 0, 0]);
      const moonToEarth = unit([-state.positionKm[0], -state.positionKm[1], -state.positionKm[2]]);
      expect(dot(nearSideAxis, moonToEarth)).toBeGreaterThan(0.999999);
      expect(Math.hypot(...state.orientation!)).toBeCloseTo(1, 12);

      const earlier = adapter.moonPositionKm(time - 1_800_000);
      const later = adapter.moonPositionKm(time + 1_800_000);
      const orbitNormal = unit([
        earlier[1] * later[2] - earlier[2] * later[1],
        earlier[2] * later[0] - earlier[0] * later[2],
        earlier[0] * later[1] - earlier[1] * later[0],
      ]);
      const poleAxis = rotateVectorByQuaternion(state.orientation!, [0, 0, 1]);
      expect(dot(poleAxis, orbitNormal)).toBeGreaterThan(0.999999);
    }
  });
});

describe("geometric Sun direction and lunar illumination", () => {
  const adapter = createOrbAstronomyAdapter();
  const moon = new MoonTrajectory(adapter);

  it("matches USNO new, quarter and full Moon event fractions within one percent", () => {
    const selected = phaseFixture.phasedata.filter((event) => event.month === 1 && event.year === 2024);
    expect(selected.filter((event) => ["Last Quarter", "New Moon", "First Quarter", "Full Moon"].includes(event.phase)))
      .toHaveLength(4);
    for (const event of selected.filter((item) => ["Last Quarter", "New Moon", "First Quarter", "Full Moon"].includes(item.phase))) {
      const time = phaseTimeUtcMs(event);
      const moonState = moon.stateAt(time);
      const sunState = sunPositionFromEarthAt(adapter, time);
      const fraction = lunarIlluminatedFraction(moonState, sunState);
      const expected = event.phase === "New Moon" ? 0
        : event.phase === "Full Moon" ? 1
          : 0.5;
      expect(Math.abs(fraction - expected), event.phase).toBeLessThanOrEqual(0.01);
    }
  });

  it("provides normalized physical body-to-Sun directions independent of scale", () => {
    const time = Date.parse("2024-01-15T00:00:00Z");
    const moonEarth = moon.stateAt(time);
    const sunEarth = sunPositionFromEarthAt(adapter, time);
    const earthToSun = directionFromCenterToSun(sunEarth);
    const moonToSun = directionToSun(moonEarth, sunEarth);
    expect(Math.hypot(...earthToSun)).toBeCloseTo(1, 12);
    expect(Math.hypot(...moonToSun)).toBeCloseTo(1, 12);
    expect(angularDifferenceDegrees(moonToSun, earthToSun)).toBeLessThan(0.2);
  });

  it("rejects illumination vectors with mismatched times, frames, or centers", () => {
    const time = Date.parse("2024-01-15T00:00:00Z");
    const moonEarth = moon.stateAt(time);
    const validSun = sunPositionFromEarthAt(adapter, time);
    const wrongTime = { ...validSun, timeUtcMs: time + 1 };
    const wrongCenter = { ...validSun, center: "sun" as const };
    const wrongFrame = { ...validSun, frame: "ECL" as "EQJ" };
    expect(() => lunarIlluminatedFraction(moonEarth, wrongTime)).toThrow("identical timestamps");
    expect(() => lunarIlluminatedFraction(moonEarth, wrongCenter)).toThrow("same center");
    expect(() => lunarIlluminatedFraction(moonEarth, wrongFrame)).toThrow("identical frames");
  });
});
