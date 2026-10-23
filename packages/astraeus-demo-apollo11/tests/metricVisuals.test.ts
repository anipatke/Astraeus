import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createOrbAstronomyAdapter } from "astraeus/core/astronomyAdapter";
import { MoonTrajectory } from "astraeus/core/moonTrajectory";
import { catalogue } from "astraeus/assets/catalogue";
import { createStateResolver } from "astraeus/core/stateResolver";
import { sceneMetrics } from "astraeus/app/metricReadouts";
import { peakAnchorSpeedKmS, referenceInSameFrame, spacecraftRangeMetric, spacecraftSpeedMetric } from "astraeus/app/trackedMetrics";
import { stateIfInBounds, trackedReadouts } from "astraeus/app/mission";
import { MOON } from "astraeus/core/body";
import { apollo11Mission, apolloMetrics } from "./support";
import { MetricVisual } from "astraeus/shell/MetricVisual";
import {
  altitudeGlyph,
  describeMetric,
  distanceScale,
  litDiscPath,
  phaseVisual,
  planViews,
  progressScale,
  rateScale,
  relationGlyph,
  speedGauge,
  uncertaintyBand,
  type DistanceMetric,
  type Metric,
  type PhaseMetric,
  type RateMetric,
  type SpeedMetric,
} from "astraeus/shell/metrics";

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
  const adapter = createOrbAstronomyAdapter();
  const moon = new MoonTrajectory(adapter);
  const resolver = createStateResolver(catalogue.definitions(), catalogue.sources(), adapter);
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
    expect(referenceInSameFrame("Moon now", row, resolver.stateOf("moon", time, "sun"))).toBeNull();
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

  it("gives each spacecraft's info card range, speed, the Moon gap and the two named altitudes, measured from one centre and frame (Decisions 2 and 9)", () => {
    const metricsFor = apolloMetrics(resolver);
    const rows = (id: string) => metricsFor(id, time);
    const eagleRows = rows("eagle");
    expect(eagleRows.map((row) => row.id)).toEqual(["eagle-range", "eagle-speed", "eagle-to-moon", "eagle-altitude-earth", "eagle-altitude-moon"]);
    const [, eagleRow] = trackedReadouts(apollo11Mission.bodies, time);
    const moonFromEarth = moon.stateAt(time);
    const value = (list: readonly Metric[], id: string) => { const row = list.find((r) => r.id === id) as { value: number | null }; return row.value!; };
    const gap = value(eagleRows, "eagle-to-moon");
    expect(gap).toBeCloseTo(Math.hypot(...eagleRow.positionKm.map((c, i) => c - moonFromEarth.positionKm[i])), 3);
    expect(value(eagleRows, "eagle-altitude-moon")).toBeCloseTo(gap - MOON.radiusKm, 3);
    expect(Math.abs(value(eagleRows, "eagle-altitude-moon"))).toBeLessThan(10); // on the surface: near the mean radius, either side
    expect(value(eagleRows, "eagle-altitude-earth")).toBeCloseTo(Math.hypot(...eagleRow.positionKm) - 6371, -1);
    expect(eagleRows.filter((row) => row.kind === "altitude").map((row) => (row as { body: string }).body)).toEqual(["Earth", "Moon"]);
    const range = eagleRows.find((row) => row.id === "eagle-range") as { markers?: { label: string }[] };
    expect(range.markers?.map((marker) => marker.label)).toEqual(["Moon now"]);
  });

  it("shows nothing for a spacecraft outside its path, and the drawn rows leave State identical at a fixed time", () => {
    const metricsFor = apolloMetrics(resolver);
    expect(metricsFor("columbia", apollo11Mission.window.startUtcMs)).toEqual([]);
    const states = () => [...apollo11Mission.bodies.map((body) => stateIfInBounds(body, time)), moon.stateAt(time)];
    const before = states();
    const first = metricsFor("columbia", time);
    expect(metricsFor("columbia", time)).toEqual(first);
    expect(states()).toEqual(before);
  });
});

describe("rate metric", () => {
  const rate = (overrides: Partial<RateMetric> = {}): RateMetric => ({
    kind: "rate", id: "r", label: "Passes", value: 40, unit: "per hour", digits: 0, ...overrides,
  });

  it("reads numbers-first and is numeric-only without a range or peak", () => {
    const html = render(rate());
    expect(html).toContain("<strong class=\"metric-value\">40</strong>");
    expect(html).toContain("per hour");
    expect(html).not.toContain("<svg");
    expect(rateScale(rate())).toBeNull();
  });

  it("draws a bar against the stated limits and shows their basis", () => {
    const limits = { min: 0, max: 100, basis: "busiest hour on record" };
    expect(rateScale(rate({ range: limits }))).toMatchObject({ valueFraction: 0.4, markers: [] });
    const html = render(rate({ range: limits }));
    expect(html).toContain("<svg");
    expect(html).toContain("0–100 per hour");
    expect(html).toContain("busiest hour on record");
    expect(render(rate({ value: 130, range: limits }))).toContain("value outside this range");
    expect(rateScale(rate({ value: 130, range: limits }))?.valueFraction).toBe(1);
  });

  it("marks a peak, on the range or on a bar spanning value and peak", () => {
    const peak = { label: "Last year's peak", value: 80 };
    expect(rateScale(rate({ peak }))).toMatchObject({ span: 80, valueFraction: 0.5, markers: [{ fraction: 1 }] });
    expect(rateScale(rate({ value: 100, peak }))?.markers[0]?.fraction).toBe(0.8);
    expect(rateScale(rate({ peak, range: { min: 0, max: 160, basis: "b" } }))?.markers[0]?.fraction).toBe(0.5);
    expect(render(rate({ peak }))).toContain("Last year&#x27;s peak 80 per hour");
  });

  it("states an unavailable value instead of a bar", () => {
    const html = render(rate({ value: null, unavailable: "not observed", range: { min: 0, max: 100, basis: "b" } }));
    expect(html).toContain("not observed");
    expect(html).not.toContain("<svg");
  });

  it("works for any per-time count with its own wording", () => {
    const html = render(rate({ label: "Launches", unit: "per day", digits: 1, value: 2.5 }));
    expect(html).toContain("2.5");
    expect(html).toContain("per day");
    expect(html).not.toMatch(/meteor|shower|perseid/i);
  });

  it("leaves every existing kind rendering as before (speed, distance, phase, progress, uncertainty, coordinates cases above still pass)", () => {
    expect(render(speed())).not.toContain("<svg");
    expect(render(distance({ markers: [{ label: "M", value: 200 }] }))).toContain("<svg");
    expect(render(phase())).toContain("25.0");
  });
});
