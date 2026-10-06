import { describe, expect, it } from "vitest";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { EARTH, MOON } from "../src/core/body";
import { SimulationClock } from "../src/core/clock";
import { MoonTrajectory } from "../src/core/moonTrajectory";
import { earthStateAt, sunPositionFromEarthAt } from "../src/core/referenceCenters";
import { readableScale, trueScale, type ScalePolicy } from "../src/core/scalePolicy";
import {
  clampToWindow,
  formatUtcInput,
  parseUtcInput,
  SCRUB_HALF_SPAN_MS,
  seekClock,
  setPlaying,
  SPEEDS,
} from "../src/app/DebugControls";
import { buildDebugReadout, overlayRows, type DebugReadout } from "../src/app/DebugOverlay";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { pathNeedsRefresh, sampleOrbitPath } from "../src/app/orbitPath";
import { bodyAbsolutes } from "../src/app/sceneLayout";

const adapter = createOrbAstronomyAdapter();
const trajectory = new MoonTrajectory(adapter);
const T = Date.UTC(2026, 3, 1, 12, 0, 0);

function fakeClock(startUtcMs = T) {
  let now = 0;
  const clock = new SimulationClock(startUtcMs, () => now);
  return { clock, advance: (ms: number) => { now += ms; } };
}

function readoutFor(timeUtcMs: number, policy: ScalePolicy, origin = new FloatingOrigin(), rate = 1): DebugReadout {
  const earth = earthStateAt(adapter, timeUtcMs);
  const moonFromEarth = trajectory.stateAt(timeUtcMs, "earth");
  const placed = bodyAbsolutes(moonFromEarth, policy);
  const renderedDistanceUnits = Math.hypot(
    placed.moonAbsolute[0] - placed.earthAbsolute[0],
    placed.moonAbsolute[1] - placed.earthAbsolute[1],
    placed.moonAbsolute[2] - placed.earthAbsolute[2],
  );
  return buildDebugReadout({
    timeUtcMs, rate, policy, earth, moonFromEarth,
    sunFromEarth: sunPositionFromEarthAt(adapter, timeUtcMs),
    placed, renderedDistanceUnits, origin,
  });
}

describe("UTC input", () => {
  it("parses valid UTC text with and without seconds", () => {
    expect(parseUtcInput("2026-04-01 12:00:00")).toEqual({ ok: true, timeUtcMs: T });
    expect(parseUtcInput("2026-04-01T12:00Z")).toEqual({ ok: true, timeUtcMs: T });
  });

  it.each(["", "tomorrow", "2026-02-30 10:00", "2026-13-01 10:00", "2026-04-01 24:30", "1800-01-01 00:00", "2200-01-01 00:00"])(
    "rejects %j with a message",
    (text) => {
      const result = parseUtcInput(text);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
    },
  );

  it("round-trips through the display format", () => {
    expect(parseUtcInput(formatUtcInput(T))).toEqual({ ok: true, timeUtcMs: T });
  });

  it("an invalid entry never reaches the clock", () => {
    const { clock } = fakeClock();
    const parsed = parseUtcInput("2026-02-30 10:00");
    if (parsed.ok) seekClock(clock, parsed.timeUtcMs);
    expect(clock.now()).toBe(T);
  });
});

describe("clock controls", () => {
  it("offers exactly 1x, 1 h/s, 1 day/s and 7 days/s", () => {
    expect(SPEEDS.map((s) => s.rate)).toEqual([1, 3600, 86400, 604800]);
  });

  it("seeks forward and backward while paused and stays paused", () => {
    const { clock, advance } = fakeClock();
    seekClock(clock, T + 5 * 86_400_000);
    advance(10_000);
    expect(clock.playing).toBe(false);
    expect(clock.now()).toBe(T + 5 * 86_400_000);
    seekClock(clock, T - 3 * 86_400_000);
    expect(clock.now()).toBe(T - 3 * 86_400_000);
    expect(clock.playing).toBe(false);
  });

  it("seeks while playing and keeps advancing from the target at the current rate", () => {
    const { clock, advance } = fakeClock();
    clock.setRate(3600);
    setPlaying(clock, true);
    advance(1000);
    seekClock(clock, T + 86_400_000);
    expect(clock.now()).toBe(T + 86_400_000);
    advance(2000);
    expect(clock.playing).toBe(true);
    expect(clock.now()).toBe(T + 86_400_000 + 2000 * 3600);
  });

  it("changing rate does not move the requested timestamp or its state", () => {
    const { clock, advance } = fakeClock();
    clock.setRate(3600);
    setPlaying(clock, true);
    advance(1000);
    const before = clock.now();
    for (const { rate } of SPEEDS) {
      clock.setRate(rate);
      expect(clock.now()).toBe(before);
    }
    const stateBefore = trajectory.stateAt(before, "earth").positionKm;
    clock.setRate(604_800);
    expect(Array.from(trajectory.stateAt(clock.now(), "earth").positionKm)).toEqual(Array.from(stateBefore));
    advance(1000);
    expect(clock.now()).toBe(before + 1000 * 604_800);
  });

  it("pausing and resuming does not discontinue time", () => {
    const { clock, advance } = fakeClock();
    clock.setRate(86_400);
    setPlaying(clock, true);
    advance(500);
    setPlaying(clock, false);
    const paused = clock.now();
    advance(9000);
    expect(clock.now()).toBe(paused);
    setPlaying(clock, true);
    expect(clock.now()).toBe(paused);
  });
});

describe("scrub window", () => {
  it("is centred on the seek target and bounds the scrubbed time", () => {
    const window = seekClock(fakeClock().clock, T);
    expect(window).toEqual({ startUtcMs: T - SCRUB_HALF_SPAN_MS, endUtcMs: T + SCRUB_HALF_SPAN_MS });
    expect(clampToWindow(T + 2 * SCRUB_HALF_SPAN_MS, window)).toBe(window.endUtcMs);
    expect(clampToWindow(T - 2 * SCRUB_HALF_SPAN_MS, window)).toBe(window.startUtcMs);
    expect(clampToWindow(T, window)).toBe(T);
  });
});

describe("debug readout", () => {
  it("keeps scientific values identical across scale policies at the same timestamp", () => {
    const a = readoutFor(T, readableScale);
    const b = readoutFor(T, trueScale);
    const { policyId: _pa, renderedDistanceUnits: _ra, earthLocal: _ea, moonLocal: _ma, ...sciA } = a;
    const { policyId: _pb, renderedDistanceUnits: _rb, earthLocal: _eb, moonLocal: _mb, ...sciB } = b;
    expect(sciA).toEqual(sciB);
    expect(a.policyId).not.toBe(b.policyId);
    expect(a.renderedDistanceUnits).toBeCloseTo(b.renderedDistanceUnits * 0.1, 9);
  });

  it("does not depend on the rate or on a rate change", () => {
    const { rate: _r1, ...slow } = readoutFor(T, readableScale, undefined, 1);
    const { rate: _r2, ...fast } = readoutFor(T, readableScale, undefined, 604_800);
    expect(slow).toEqual(fast);
  });

  it("reports rendered distance equal to the scene mapping and the physical distance in km", () => {
    for (const policy of [readableScale, trueScale]) {
      const r = readoutFor(T, policy);
      const moonKm = trajectory.stateAt(T, "earth").positionKm;
      const mapped = policy.mapPosition(moonKm);
      expect(r.renderedDistanceUnits).toBeCloseTo(Math.hypot(mapped[0], mapped[1], mapped[2]), 9);
      expect(r.moonDistanceKm).toBeCloseTo(Math.hypot(moonKm[0], moonKm[1], moonKm[2]), 9);
    }
  });

  it("labels the Moon position with frame, centre and units", () => {
    const r = readoutFor(T, trueScale);
    expect(r.moonPosition).toMatchObject({ frame: "EQJ", center: "earth", units: "km" });
  });

  it("separates scaled origin from local render coordinates", () => {
    const origin = new FloatingOrigin();
    const base = readoutFor(T, trueScale, origin);
    origin.set([base.moonLocal[0] + 5, 1, -2]);
    const moved = readoutFor(T, trueScale, origin);
    expect(moved.scaledOrigin).toEqual([base.moonLocal[0] + 5, 1, -2]);
    expect(moved.moonLocal[0]).toBeCloseTo(base.moonLocal[0] - (base.moonLocal[0] + 5), 9);
    expect(moved.moonDistanceKm).toBe(base.moonDistanceKm);
    expect(moved.renderedDistanceUnits).toBeCloseTo(base.renderedDistanceUnits, 9);
  });

  it("shows plausible physical values: unit Sun directions, bounded illumination, orientation quaternions", () => {
    const r = readoutFor(T, readableScale);
    expect(Math.hypot(...r.earthSunDirection)).toBeCloseTo(1, 12);
    expect(Math.hypot(...r.moonSunDirection)).toBeCloseTo(1, 12);
    expect(r.lunarIlluminatedFraction).toBeGreaterThanOrEqual(0);
    expect(r.lunarIlluminatedFraction).toBeLessThanOrEqual(1);
    expect(Math.hypot(...r.earthOrientation!)).toBeCloseTo(1, 12);
    expect(Math.hypot(...r.moonOrientation!)).toBeCloseTo(1, 12);
    expect(MOON.radiusKm / EARTH.radiusKm).toBeCloseTo(readableScale.mapRadius(MOON.radiusKm), 12);
    expect(trueScale.mapRadius(MOON.radiusKm)).toBe(readableScale.mapRadius(MOON.radiusKm));
  });

  it("overlay rows list every required item", () => {
    const labels = overlayRows(readoutFor(T, readableScale)).map(([label]) => label);
    for (const wanted of ["UTC time", "Speed", "Scale policy", "Earth–Moon distance", "Rendered distance", "Moon position",
      "Earth orientation", "Moon orientation", "Sun direction (from Earth)", "Moon lit (geometric)", "Scaled origin", "Moon local"]) {
      expect(labels).toContain(wanted);
    }
  });
});

describe("path refresh after seeking", () => {
  it("rebuilds the path when a seek leaves the sampled window and not for tiny moves", () => {
    const samples = sampleOrbitPath(trajectory, T);
    expect(pathNeedsRefresh(samples, T + 1000, 0, 0)).toBe(false);
    expect(pathNeedsRefresh(samples, T - 20 * 86_400_000, 0, 0)).toBe(true);
    expect(pathNeedsRefresh(samples, T + 20 * 86_400_000, 0, 0)).toBe(true);
  });

  it("a scrub within the sampled window rebuilds once drift exceeds the threshold", () => {
    const samples = sampleOrbitPath(trajectory, T);
    expect(pathNeedsRefresh(samples, T + 2 * 3_600_000, 1000, 0)).toBe(true);
    expect(pathNeedsRefresh(samples, T + 2 * 3_600_000, 100, 0)).toBe(false);
  });
});
