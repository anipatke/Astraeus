import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SimulationClock } from "../src/core/clock";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { MoonTrajectory } from "../src/core/moonTrajectory";
import { MissionTelemetry } from "../src/app/MissionPanel";
import { peakAnchorSpeedKmS, referenceInSameFrame, sceneMetrics, spacecraftRangeMetric, spacecraftSpeedMetric } from "../src/app/metricReadouts";
import { stateIfInBounds, trackedReadouts } from "../src/app/mission";
import { apollo11Mission } from "../src/mission/apollo11";
import { MetricVisual } from "../src/shell/MetricVisual";
import {
  describeMetric,
  distanceScale,
  litDiscPath,
  phaseVisual,
  speedGauge,
  type DistanceMetric,
  type Metric,
  type PhaseMetric,
  type SpeedMetric,
} from "../src/shell/metrics";

const render = (metric: Metric) => renderToStaticMarkup(createElement(MetricVisual, { metric }));

const speed = (overrides: Partial<SpeedMetric> = {}): SpeedMetric => ({
  kind: "speed", id: "s", label: "Speed", value: 5, unit: "km/s", digits: 1, ...overrides,
});
const distance = (overrides: Partial<DistanceMetric> = {}): DistanceMetric => ({
  kind: "distance", id: "d", label: "Distance", value: 100, unit: "km", digits: 0, ...overrides,
});
const phase = (overrides: Partial<PhaseMetric> = {}): PhaseMetric => ({
  kind: "phase", id: "p", label: "Phase", fraction: 0.25, ...overrides,
});

describe("metric visual references and numeric-only fallback", () => {
  it("draws a speed arc only against a stated range", () => {
    expect(speedGauge(speed())).toBeNull();
    expect(speedGauge(speed({ value: null, range: { min: 0, max: 10, basis: "b" } }))).toBeNull();
    expect(speedGauge(speed({ range: { min: 0, max: 0, basis: "b" } }))).toBeNull();
    expect(speedGauge(speed({ range: { min: 0, max: 10, basis: "b" } }))).toEqual({ fraction: 0.5, outside: false });
    expect(speedGauge(speed({ value: 12, range: { min: 0, max: 10, basis: "b" } }))).toEqual({ fraction: 1, outside: true });
  });

  it("draws a distance bar only against reference markers and spans them all", () => {
    expect(distanceScale(distance())).toBeNull();
    expect(distanceScale(distance({ markers: [] }))).toBeNull();
    const scale = distanceScale(distance({ value: 100, markers: [{ label: "Far", value: 400 }] }));
    expect(scale?.span).toBe(400);
    expect(scale?.valueFraction).toBe(0.25);
    expect(scale?.markers[0].fraction).toBe(1);
    expect(distanceScale(distance({ value: 500, markers: [{ label: "Near", value: 400 }] }))?.markers[0].fraction).toBe(0.8);
  });

  it("draws a phase glyph only when the lit side is known, otherwise a 0–100% band", () => {
    expect(phaseVisual(phase({ fraction: null }))).toBeNull();
    expect(phaseVisual(phase())).toEqual({ kind: "band", fraction: 0.25 });
    expect(phaseVisual(phase({ litLimb: "left" }))).toMatchObject({ kind: "glyph", mirrored: true });
    expect(phaseVisual(phase({ litLimb: "right" }))).toMatchObject({ kind: "glyph", mirrored: false });
  });

  it("shapes the lit disc from the illuminated fraction", () => {
    expect(litDiscPath(0)).toBe("");
    expect(litDiscPath(1)).toContain("A 1 1 0 1 1 0 -1");
    expect(litDiscPath(0.25)).toBe("M 0 -1 A 1 1 0 0 1 0 1 A 0.5000 1 0 0 0 0 -1 Z"); // crescent: terminator bulges toward the lit limb
    expect(litDiscPath(0.75)).toBe("M 0 -1 A 1 1 0 0 1 0 1 A 0.5000 1 0 0 1 0 -1 Z"); // gibbous: away from it
    expect(litDiscPath(0.5)).toContain("A 0.0000 1");
  });

  it("renders numeric-only readouts without any visual, and states unavailable values", () => {
    expect(render(speed())).not.toContain("<svg");
    expect(render(distance())).not.toContain("<svg");
    const unavailable = render(speed({ value: null, unavailable: "not modeled", range: { min: 0, max: 10, basis: "b" } }));
    expect(unavailable).toContain("not modeled");
    expect(unavailable).not.toContain("<svg");
  });

  it("carries value, unit, context and references in text, not only in the shape", () => {
    const text = describeMetric(distance({ context: "Body centre · frame", markers: [{ label: "Moon now", value: 400 }] }));
    expect(text).toBe("Distance: 100 km; Body centre · frame; Moon now at 400 km.");
    const arc = render(speed({ range: { min: 0, max: 10, basis: "peak" } }));
    expect(arc).toContain('role="img"');
    expect(arc).toContain("50% of 0.0–10.0 km/s (peak)");
  });
});

describe("metric visuals reuse outside Apollo", () => {
  // A meteor-shower style experience: different objects, units and references, same components.
  const fixture: readonly Metric[] = [
    { kind: "speed", id: "meteoroid-speed", label: "Entry speed", value: 59.4, unit: "km/s", digits: 1,
      context: "relative to Earth's atmosphere", range: { min: 11.2, max: 72.8, basis: "physical limits for bound meteoroids" } },
    { kind: "distance", id: "meteor-height", label: "Height", value: 105, unit: "km", digits: 0,
      origin: "sea level", markers: [{ label: "Kármán line", value: 100 }] },
    { kind: "phase", id: "moon-tonight", label: "Moon tonight", fraction: 0.62, litLimb: "left", context: "seen from the observer" },
    { kind: "distance", id: "comet-distance", label: "Parent comet distance", value: 2.7, unit: "au", digits: 2 },
  ];

  it("renders every type through the same components with the fixture's own labels and units", () => {
    const markup = fixture.map(render);
    expect(markup[0]).toContain("59.4");
    expect(markup[0]).toContain("physical limits for bound meteoroids");
    expect(markup[1]).toContain("Kármán line 100 km");
    expect(markup[1]).toContain("from sea level");
    expect(markup[2]).toContain('transform="scale(-1 1)"');
    expect(markup[2]).toContain("62.0");
    expect(markup[3]).toContain("2.70");
    expect(markup[3]).not.toContain("<svg");
    for (const html of markup) expect(html).not.toMatch(/apollo|columbia|eagle/i);
  });
});

describe("Apollo metric configuration", () => {
  const [columbia, eagle] = apollo11Mission.bodies;
  const moon = new MoonTrajectory(createOrbAstronomyAdapter());
  const time = Math.round((eagle.trajectory.bounds.startUtcMs + eagle.trajectory.bounds.endUtcMs) / 2);

  it("tops each speed gauge at the vehicle's peak speed at NASA source anchors, not at a reconstruction artefact", () => {
    const peak = peakAnchorSpeedKmS(columbia);
    expect(peak).not.toBeNull();
    for (const t of columbia.anchorTimesUtcMs) {
      expect(Math.hypot(...columbia.trajectory.stateAt(t).velocityKmS!)).toBeLessThanOrEqual(peak!);
    }
    expect(peak!).toBeCloseTo(11.032, 3); // entry interface anchor
    // I-008: the accepted post-TLI join spike stays outside the gauge and is reported as such.
    const spike = Math.hypot(...columbia.trajectory.stateAt(Date.UTC(1969, 6, 16, 16, 22, 8, 200)).velocityKmS!);
    expect(spike).toBeGreaterThan(70);
    const pinned = spacecraftSpeedMetric({ ...trackedReadouts([columbia], time)[0], speedKmS: spike }, peak);
    expect(speedGauge(pinned)).toEqual({ fraction: 1, outside: true });
    expect(describeMetric(pinned)).toContain("outside that range");
    const row = trackedReadouts([columbia], time)[0];
    expect(spacecraftSpeedMetric(row, peak).range).toEqual({ min: 0, max: peak, basis: "peak at NASA source anchors", digits: 1 });
    expect(spacecraftSpeedMetric(row, null).range).toBeUndefined();
  });

  it("marks the Moon on a range bar only when measured from the same centre and frame", () => {
    const row = trackedReadouts([columbia], time)[0];
    const moonFromEarth = moon.stateAt(time);
    const marker = referenceInSameFrame("Moon now", row, moonFromEarth);
    expect(marker?.value).toBeCloseTo(Math.hypot(...moonFromEarth.positionKm), 9);
    expect(referenceInSameFrame("Moon now", row, moon.stateAt(time, "sun"))).toBeNull();
    expect(referenceInSameFrame("Moon now", row, null)).toBeNull();
    expect(distanceScale(spacecraftRangeMetric(row, marker))).not.toBeNull();
    expect(spacecraftRangeMetric(row, marker).origin).toBe("Earth centre · EQJ");
  });

  it("keeps Earth–Moon distance numeric-only and lunar illumination as a band without a lit side", () => {
    const [earthMoon, rendered, illumination] = sceneMetrics({
      timeUtcMs: time, rate: 1, policyId: "true-scale",
      moonPosition: { frame: "EQJ", center: "earth", units: "km", positionKm: [384_000, 0, 0] },
      moonDistanceKm: 384_000, renderedDistanceUnits: 60.2, earthOrientation: null, moonOrientation: null,
      earthSunDirection: [1, 0, 0], moonSunDirection: [1, 0, 0], lunarIlluminatedFraction: 0.4,
      scaledOrigin: [0, 0, 0], earthLocal: [0, 0, 0], moonLocal: [0, 0, 0],
    });
    expect(earthMoon.kind === "distance" && distanceScale(earthMoon)).toBeNull();
    expect(rendered.kind === "distance" && distanceScale(rendered)).toBeNull();
    expect(illumination.kind === "phase" && phaseVisual(illumination)).toEqual({ kind: "band", fraction: 0.4 });
  });

  it("metric visuals mounted, updated and removed leave State identical at a fixed time", () => {
    const states = () => [...apollo11Mission.bodies.map((body) => stateIfInBounds(body, time)), moon.stateAt(time)];
    const before = states();
    const clock = new SimulationClock(time);
    const first = renderToStaticMarkup(createElement(MissionTelemetry, { mission: apollo11Mission, clock, moon }));
    const again = renderToStaticMarkup(createElement(MissionTelemetry, { mission: apollo11Mission, clock, moon }));
    renderToStaticMarkup(createElement("div"));
    expect(first).toContain("Moon now");
    expect(first).toContain("peak at NASA source anchors");
    expect(again).toBe(first);
    expect(clock.now()).toBe(time);
    expect(states()).toEqual(before);
  });
});
