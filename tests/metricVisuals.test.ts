import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SimulationClock } from "../src/core/clock";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { MoonTrajectory } from "../src/core/moonTrajectory";
import { MissionTelemetry } from "../src/app/MissionPanel";
import {
  journeyProgressMetric,
  peakAnchorSpeedKmS,
  referenceInSameFrame,
  sceneMetrics,
  spacecraftAltitudeMetric,
  spacecraftDiscrepancyMetric,
  spacecraftMoonMetric,
  spacecraftPositionMetric,
  spacecraftRangeMetric,
  spacecraftSpeedMetric,
} from "../src/app/metricReadouts";
import { discrepancyAt, stateIfInBounds, trackedReadouts } from "../src/app/mission";
import { MOON } from "../src/core/body";
import { apollo11Mission } from "../src/mission/apollo11";
import { MetricVisual } from "../src/shell/MetricVisual";
import {
  altitudeGlyph,
  describeMetric,
  distanceScale,
  litDiscPath,
  phaseVisual,
  planViews,
  progressScale,
  relationGlyph,
  speedGauge,
  uncertaintyBand,
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
    expect(text).toBe("Distance: 100 km; Body centre · frame; Moon now 400 km.");
    const arc = render(speed({ range: { min: 0, max: 10, basis: "peak" } }));
    expect(arc).toContain('role="img"');
    expect(arc).toContain("Speed: 5.0 km/s; 0.0–10.0 km/s; peak.");
  });
});

describe("relative distance, altitude, progress, uncertainty and coordinates", () => {
  it("draws a relative distance in the target's radii, broken beyond the window, numeric-only without a radius", () => {
    const base = { kind: "relative-distance", id: "r", label: "Gap", value: 1_900, unit: "km", digits: 0, from: "Craft", to: "Moon" } as const;
    expect(relationGlyph(base)).toBeNull();
    expect(relationGlyph({ ...base, targetRadius: 1_900 })).toEqual({ radii: 1, beyondWindow: false });
    expect(relationGlyph({ ...base, value: 380_000, targetRadius: 1_900 })).toEqual({ radii: 200, beyondWindow: true });
    expect(render({ ...base, targetRadius: 1_000 })).toContain("1.9 × Moon radius");
    expect(render(base)).not.toContain("<svg");
  });

  it("draws altitude against the body's radius and says when the value is below the datum", () => {
    const base = { kind: "altitude", id: "a", label: "Altitude", value: 110, unit: "km", digits: 1, body: "Moon", datum: "mean radius" } as const;
    expect(altitudeGlyph(base)).toBeNull();
    expect(altitudeGlyph({ ...base, bodyRadius: 1_100 })).toEqual({ radii: 0.1, beyondWindow: false });
    expect(render({ ...base, bodyRadius: 1_737.4 })).toContain("above Moon mean radius (1,737.4 km)");
    expect(render({ ...base, value: -1.9, bodyRadius: 1_737.4 })).toContain("below Moon mean radius");
  });

  it("shows progress as a share of a known total with milestones", () => {
    const metric = { kind: "progress", id: "p", label: "Journey", value: 50, total: 200, unit: "h", digits: 1,
      startLabel: "start", endLabel: "end", markers: [{ label: "half", value: 100 }] } as const;
    expect(progressScale(metric)).toEqual({ span: 200, valueFraction: 0.25, markers: [{ label: "half", value: 100, fraction: 0.5 }] });
    expect(progressScale({ ...metric, total: 0 })).toBeNull();
    const html = render(metric);
    expect(html).toContain("25.0");
    expect(html).toContain("50.0 of 200.0 h · start → end");
  });

  it("shows a ± half-width, banded only against the largest half-width in the same data", () => {
    const base = { kind: "uncertainty", id: "u", label: "Discrepancy", value: 50, unit: "km", digits: 1 } as const;
    expect(uncertaintyBand(base)).toBeNull();
    expect(uncertaintyBand({ ...base, scale: { max: 200, basis: "data" } })).toBe(0.25);
    expect(render(base)).toContain("±50.0");
    expect(render(base)).not.toContain("<svg");
    expect(render({ ...base, value: null, unavailable: "not published" })).toContain("not published");
  });

  it("names the coordinate system, frame and origin for each system", () => {
    const html = render({ kind: "coordinates", id: "c", label: "Radiant", system: "radec", frame: "J2000 equatorial", origin: "Earth",
      components: [{ label: "RA", value: 48.0, unit: "°", digits: 1 }, { label: "Dec", value: 58.0, unit: "°", digits: 1 }] });
    expect(html).toContain("Right ascension / declination · J2000 equatorial · from Earth");
    expect(html).toContain("RA 48.0");
    expect(render({ kind: "coordinates", id: "n", label: "Site", system: "latlon", frame: "WGS84", origin: "Earth", components: null })).toContain("unavailable");
  });
});

describe("coordinate radar view", () => {
  const position = (references: readonly { label: string; xyz: readonly [number, number, number] }[] | undefined) => ({
    kind: "coordinates", id: "pos", label: "Position", system: "xyz", frame: "EQJ", origin: "Body centre",
    components: [{ label: "x", value: -200, unit: "km", digits: 0 }, { label: "y", value: 50, unit: "km", digits: 0 }, { label: "z", value: 10, unit: "km", digits: 0 }],
    ...(references === undefined ? {} : { planViews: { references } }),
  }) as const;

  it("projects onto x–y and z on one scale that fits every point inside the round view and the tick", () => {
    const views = planViews(position([{ label: "Moon", xyz: [-400, 0, -100] }]));
    expect(views?.halfSpan).toBe(400);
    expect(views?.views.map((v) => [v.name, ...v.axes])).toEqual([["top", "x", "y"], ["side", "x", "z"]]);
    expect(views?.views[0].object).toEqual([-0.5, 0.125]);
    expect(views?.views[1].object).toEqual([-0.5, 0.025]);
    expect(views?.views[1].references[0]).toEqual({ label: "Moon", point: [-1, -0.25] });
  });

  it("draws views only when asked, for XYZ, with a non-zero position", () => {
    expect(planViews(position(undefined))).toBeNull();
    expect(planViews({ ...position([]), system: "radec" })).toBeNull();
    expect(planViews({ ...position([]), components: null })).toBeNull();
    const html = render(position([{ label: "Moon", xyz: [-400, 0, -100] }]));
    expect(html).toContain('class="metric-visual metric-radar"');
    expect(html).toContain("round: top view x–y · tick: z · rim ±400 km · lavender: Moon");
    expect(render(position(undefined))).not.toContain("metric-radar");
    expect(planViews(position([{ label: "Far", xyz: [300, 400, 0] }]))?.halfSpan).toBe(500); // planar distance, not one axis
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
    { kind: "coordinates", id: "radiant", label: "Radiant", system: "radec", frame: "J2000 equatorial", origin: "Earth centre",
      components: [{ label: "RA", value: 48.0, unit: "°", digits: 1 }, { label: "Dec", value: 58.0, unit: "°", digits: 1 }] },
    { kind: "progress", id: "shower", label: "Shower activity window", value: 25, total: 39, unit: "days", digits: 0, startLabel: "17 July", endLabel: "24 August" },
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
    expect(describeMetric(pinned)).toContain("value outside this range");
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

  it("measures the spacecraft–Moon gap and altitude from the same centre and frame, above the nearer body's mean radius", () => {
    const [columbiaRow, eagleRow] = trackedReadouts(apollo11Mission.bodies, time);
    const moonFromEarth = moon.stateAt(time);
    const gap = spacecraftMoonMetric(eagleRow, moonFromEarth);
    expect(gap.value).toBeCloseTo(Math.hypot(...eagleRow.positionKm.map((c, i) => c - moonFromEarth.positionKm[i])), 9);
    expect(spacecraftMoonMetric(eagleRow, moon.stateAt(time, "sun")).value).toBeNull();
    const eagleAltitude = spacecraftAltitudeMetric(eagleRow, moonFromEarth);
    expect(eagleAltitude.body).toBe("Moon");
    expect(eagleAltitude.value).toBeCloseTo(gap.value! - MOON.radiusKm, 9);
    expect(Math.abs(eagleAltitude.value!)).toBeLessThan(10); // on the surface: near the mean radius, either side
    expect(spacecraftAltitudeMetric(columbiaRow, null).body).toBe("Earth");
    const parked = trackedReadouts([columbia], columbia.trajectory.bounds.startUtcMs)[0];
    expect(spacecraftAltitudeMetric(parked, moon.stateAt(columbia.trajectory.bounds.startUtcMs)).body).toBe("Earth");
    expect(spacecraftPositionMetric(columbiaRow, null).components?.map((c) => c.value)).toEqual([...columbiaRow.positionKm]);
    expect(spacecraftPositionMetric(columbiaRow, null).planViews?.references).toEqual([]);
    expect(spacecraftPositionMetric(columbiaRow, moon.stateAt(time, "sun")).planViews?.references).toEqual([]);
    expect(spacecraftPositionMetric(columbiaRow, moonFromEarth).planViews?.references).toEqual([
      { label: "Moon", xyz: [moonFromEarth.positionKm[0], moonFromEarth.positionKm[1], moonFromEarth.positionKm[2]] },
    ]);
  });

  it("reads each segment's published discrepancy from the generated data, and none where none is published", () => {
    const afterTli = Date.UTC(1969, 6, 16, 16, 22, 8, 200);
    expect(discrepancyAt(columbia, afterTli)).toMatchObject({ km: 463.219, basis: "largest smoothing correction on this coast" });
    const parking = spacecraftDiscrepancyMetric(columbia, columbia.trajectory.bounds.startUtcMs + 60_000);
    expect(parking.value).toBeNull();
    expect(parking.context).toBe("no figure published (parking-orbit-backward)");
    expect(parking.scale?.max).toBe(1963.327);
    expect(discrepancyAt(columbia, columbia.trajectory.bounds.endUtcMs)?.km).toBe(32.232);
  });

  it("measures journey progress from the first to the last event", () => {
    const events = apollo11Mission.events;
    const metric = journeyProgressMetric(events, events[0].timeUtcMs, { start: "lift-off", end: "splashdown" });
    expect(metric.value).toBe(0);
    expect(metric.total).toBeCloseTo((events[events.length - 1].timeUtcMs - events[0].timeUtcMs) / 3_600_000, 9);
    expect(metric.markers).toHaveLength(events.length);
    expect(journeyProgressMetric(events, events[events.length - 1].timeUtcMs + 1e9, { start: "a", end: "b" }).value).toBe(metric.total);
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
