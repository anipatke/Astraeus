// O-070 T-309: the moments a provider path's line is drawn at. Synthetic paths only (ARCH-03).
import { describe, expect, it } from "vitest";
import { PROVIDER_MAX_SAMPLES, PROVIDER_SEED_SAMPLES, providerPathTimes } from "../src/api/providerPathTimes";

const HOUR = 3_600_000;
const YEAR = 365.25 * 24 * HOUR;
const T0 = Date.UTC(2026, 0, 1);
const EARTH_RADIUS_KM = 6371;
type Reader = (timeUtcMs: number) => number[];

const evenTimes = (start: number, end: number): number[] => Array.from({ length: PROVIDER_SEED_SAMPLES }, (_, i) => Math.round(start + (i * (end - start)) / (PROVIDER_SEED_SAMPLES - 1)));

/** A hyperbolic flyby about Earth (mu 398,600 km3/s2, 10 km/s at infinity) closest to the centre at `closestMs`; it speeds up and bends round the centre in about an hour. */
const flyby = (closestKm: number, closestMs: number): Reader => {
  const mu = 398_600;
  const vInf = 10;
  const a = mu / (vInf * vInf);
  const e = 1 + closestKm / a;
  const n = Math.sqrt(mu / a ** 3);
  return (t) => {
    const m = (n * (t - closestMs)) / 1000;
    let h = Math.asinh(m / e);
    for (let i = 0; i < 60; i += 1) h -= (e * Math.sinh(h) - h - m) / (e * Math.cosh(h) - 1);
    return [a * (e - Math.cosh(h)) * -1, a * Math.sqrt(e * e - 1) * Math.sinh(h), 0];
  };
};

/** A circle about the centre, `periodMs` per turn. */
const circle = (radiusKm: number, periodMs: number): Reader => (t) => [radiusKm * Math.cos((2 * Math.PI * (t - T0)) / periodMs), radiusKm * Math.sin((2 * Math.PI * (t - T0)) / periodMs), 0];

/** The shortest distance from `p` to the line through `points` (a straight segment between each neighbouring pair). */
function distanceToLine(points: readonly number[][], p: readonly number[]): number {
  let best = Infinity;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const ab = [b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!];
    const len2 = ab[0]! ** 2 + ab[1]! ** 2 + ab[2]! ** 2;
    const f = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0]! - a[0]!) * ab[0]! + (p[1]! - a[1]!) * ab[1]! + (p[2]! - a[2]!) * ab[2]!) / len2));
    best = Math.min(best, Math.hypot(p[0]! - a[0]! - f * ab[0]!, p[1]! - a[1]! - f * ab[1]!, p[2]! - a[2]!- f * ab[2]!));
  }
  return best;
}

/** The worst gap, as a fraction of the true distance from the centre, between the line through `times` and the true position, each minute within `window` of `closestMs`. */
function worstGap(read: Reader, times: readonly number[], closestMs: number, window: number): number {
  const line = times.map(read);
  let worst = 0;
  for (let t = closestMs - window; t <= closestMs + window; t += 60_000) {
    const truth = read(t);
    worst = Math.max(worst, distanceToLine(line, truth) / Math.hypot(...truth));
  }
  return worst;
}

const strictlyWholeMs = (times: readonly number[]): boolean => times.every((t, i) => Number.isInteger(t) && (i === 0 || t > times[i - 1]!));

describe("a one-hour flyby inside six-year bounds (F-05)", () => {
  const start = T0;
  const end = T0 + 6 * YEAR;
  // Midway between two of the 128 even moments, so the even moments alone never see the pass.
  const even = evenTimes(start, end);
  const closestMs = Math.round((even[60]! + even[61]!) / 2);
  const read = flyby(3 * EARTH_RADIUS_KM, closestMs);

  it("keeps the line within 1% of the true distance from the centre at every minute within 3 hours of closest approach", () => {
    expect(worstGap(read, even, closestMs, 3 * HOUR)).toBeGreaterThan(0.01); // the 128 even moments alone fail the bound
    const times = providerPathTimes(start, end, read);
    expect(worstGap(read, times, closestMs, 3 * HOUR)).toBeLessThan(0.01);
    expect(times.length).toBeLessThanOrEqual(PROVIDER_MAX_SAMPLES);
  });

  it("is deterministic", () => {
    expect(providerPathTimes(start, end, read)).toEqual(providerPathTimes(start, end, read));
  });
});

describe("what every path keeps", () => {
  const end = T0 + 6 * YEAR;
  const cases: [string, Reader][] = [
    ["a circular orbit over six years", circle(2e5, 2.3 * YEAR)],
    ["a near-still path", () => [1e8, 2e7, 5e6]],
    ["a flyby", flyby(3 * EARTH_RADIUS_KM, T0 + 3 * YEAR)],
    ["a pass so close and fast the refinement would exceed the cap", circle(1e6, 60_000)],
  ];
  it.each(cases)("%s: the 128 even moments and both bounds, whole ms, strictly increasing, within the cap", (_name, read) => {
    const times = providerPathTimes(T0, end, read);
    for (const t of evenTimes(T0, end)) expect(times).toContain(t);
    expect(times[0]).toBe(T0);
    expect(times.at(-1)).toBe(end);
    expect(strictlyWholeMs(times)).toBe(true);
    expect(times.length).toBeLessThanOrEqual(PROVIDER_MAX_SAMPLES);
  });

  it("adds nothing to a near-still path, and stops at the cap for the pathological one", () => {
    expect(providerPathTimes(T0, end, () => [1e8, 2e7, 5e6])).toHaveLength(PROVIDER_SEED_SAMPLES);
    expect(providerPathTimes(T0, end, circle(1e6, 60_000))).toHaveLength(PROVIDER_MAX_SAMPLES);
  });
});

describe("a provider that gives no position at planning", () => {
  it.each<[string, Reader]>([["throws", () => { throw new Error("data not loaded"); }], ["gives none", () => undefined as never], ["gives a fault", () => [NaN, 0, 0]]])("one that %s keeps the 128 even moments", (_name, read) => {
    expect(providerPathTimes(T0, T0 + 6 * YEAR, read)).toEqual(evenTimes(T0, T0 + 6 * YEAR));
  });
});

describe("very short bounds", () => {
  it.each([1, 2, 3, 7, 50, 200])("%i ms still gives strictly increasing whole milliseconds from start to end", (span) => {
    const times = providerPathTimes(T0, T0 + span, circle(1e5, 40));
    expect(strictlyWholeMs(times)).toBe(true);
    expect(times[0]).toBe(T0);
    expect(times.at(-1)).toBe(T0 + span);
    expect(times.length).toBeLessThanOrEqual(span + 1);
  });
});
