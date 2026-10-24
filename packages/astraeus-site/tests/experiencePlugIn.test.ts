import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createOrbAstronomyAdapter } from "astraeus/core/astronomyAdapter";
import { SimulationClock } from "astraeus/core/clock";
import { catalogue } from "astraeus/assets/catalogue";
import { createSceneResolver } from "astraeus/app/sceneLayout";
import { experienceWithGroups, trackedBodiesOf, type ExperienceDefinition } from "astraeus/app/experienceDefinition";
import { AstraeusShell } from "astraeus/shell/AstraeusShell";
import { apollo11Definition } from "astraeus-demo-apollo11/experiences/apollo11/apollo11Definition";
import { syntheticDefinition } from "astraeus/synthetic/syntheticDefinition";
import { provenanceAt, rateAt } from "astraeus/core/timeWindow";
import { infoView } from "astraeus/shell/infoModel";
import perseidsFile from "astraeus-demo-showers/data/showers/perseids.json";
import { buildShowerDefinition } from "astraeus-demo-showers/tests/helpers/showerDefinition";
import { madeUpOrbits } from "astraeus-demo-showers/tests/helpers/measuredOrbits";
import { parseShowerSettings } from "astraeus-demo-showers/experiences/showers/showerSettings";
import type { RateMetric } from "astraeus/shell/metrics";

const sources = import.meta.glob<string>(
  ["../../astraeus/src/core/**/*.{ts,tsx}", "../../astraeus/src/assets/**/*.{ts,tsx}", "../../astraeus/src/shell/**/*.{ts,tsx,css}", "../../astraeus/src/app/*.{ts,tsx,css}"],
  { query: "?raw", import: "default", eager: true },
);

const noop = () => undefined;

function shellMarkup(definition: ExperienceDefinition): string {
  const clock = new SimulationClock(definition.clock.startUtcMs);
  return renderToStaticMarkup(createElement(AstraeusShell, {
    experience: definition.experience,
    snapshot: clock.snapshot(),
    developerMode: false,
    onDeveloperModeChange: noop,
    onTogglePlayback: noop,
    onRateChange: noop,
    onSeek: noop,
    onCameraRequest: noop,
    onSelectionChange: noop,
    scaleId: "true-scale",
    onScaleChange: noop,
    children: null,
  }));
}

describe.each([
  ["Apollo", apollo11Definition, "Columbia"],
  ["the synthetic experience", syntheticDefinition, "Survey marker"],
] as const)("%s through the plug-in contract", (_name, definition, ownLabel) => {
  it("hands the shell its own objects", () => {
    expect(shellMarkup(definition)).toContain(ownLabel);
  });

  it("draws exactly the tracked bodies it lists", () => {
    expect(trackedBodiesOf(definition).map((body) => body.id)).toEqual(definition.trackedBodies.map((body) => body.id));
    expect(definition.experience.objects.map((object) => object.id)).toEqual(expect.arrayContaining(definition.trackedBodies.map((body) => body.id)));
  });

  it("builds metrics for its own bodies through the generic factory", () => {
    const clock = new SimulationClock(definition.clock.startUtcMs);
    const metrics = definition.createMetrics({ clock, resolver: createSceneResolver(createOrbAstronomyAdapter()), catalogue });
    const body = definition.trackedBodies[0];
    expect(metrics(body.id, body.trajectory.bounds.startUtcMs).length).toBeGreaterThan(0);
  });
});

describe("the synthetic experience", () => {
  it("shows none of Apollo's objects and carries illustrative provenance", () => {
    const markup = shellMarkup(syntheticDefinition);
    expect(markup).not.toMatch(/columbia|eagle|apollo/i);
    const marker = syntheticDefinition.experience.objects.find((object) => object.id === "survey-marker");
    expect(marker?.provenance?.sourceType).toBe("illustrative");
    expect(marker?.knownLimitations?.length).toBeGreaterThan(0);
  });

  it("keeps its clock and events inside its own window", () => {
    const { window, events } = syntheticDefinition.experience;
    expect(syntheticDefinition.clock.startUtcMs).toBe(window.startUtcMs);
    expect(events).toHaveLength(2);
    for (const event of events) {
      expect(event.timeUtcMs).toBeGreaterThanOrEqual(window.startUtcMs);
      expect(event.timeUtcMs).toBeLessThanOrEqual(window.endUtcMs);
    }
  });
});

describe("the synthetic window", () => {
  const { windows = [], window: bounds } = syntheticDefinition.experience;
  const [contact] = windows;
  const minutes = (value: number) => contact.startUtcMs + value * 60_000;
  const metricsAt = (timeUtcMs: number) => {
    const clock = new SimulationClock(syntheticDefinition.clock.startUtcMs);
    return syntheticDefinition.createMetrics({ clock, resolver: createSceneResolver(createOrbAstronomyAdapter()), catalogue })("survey-marker", timeUtcMs);
  };

  it("mounts one window through ExperienceConfig.windows, inside the timeline", () => {
    expect(windows).toHaveLength(1);
    expect(contact.startUtcMs).toBeGreaterThanOrEqual(bounds.startUtcMs);
    expect(contact.endUtcMs).toBeLessThanOrEqual(bounds.endUtcMs);
    expect(contact.peakUtcMs).toBeDefined();
    expect(shellMarkup(syntheticDefinition)).toContain("Contact window");
  });

  it("computes its rate readout from the same window samples as rateAt", () => {
    for (const offset of [0, 17, 45, 90, 105, 135, 150, 179, 180]) {
      const time = minutes(offset);
      const rate = metricsAt(time).find((metric): metric is RateMetric => metric.kind === "rate");
      expect(rate?.value).toBe(rateAt(contact, time));
      expect(rate?.unit).toBe(contact.rate?.unit);
    }
    expect(rateAt(contact, contact.peakUtcMs ?? 0)).toBe(48);
  });

  it("shows the rate as unavailable outside the window", () => {
    for (const time of [bounds.startUtcMs, contact.startUtcMs - 60_000, contact.endUtcMs + 60_000, bounds.endUtcMs]) {
      const rate = metricsAt(time).find((metric): metric is RateMetric => metric.kind === "rate");
      expect(rate?.value).toBeNull();
      expect(rate?.unavailable).toBeTruthy();
    }
  });

  it("changes its source wording across the span boundary, never labelled measured", () => {
    const before = provenanceAt(contact, minutes(60));
    const after = provenanceAt(contact, minutes(150));
    expect(before?.sourceType).toBe("illustrative");
    expect(after?.sourceType).toBe("illustrative");
    expect(before?.accuracy).not.toBe(after?.accuracy);
    expect(before?.notes).not.toBe(after?.notes);
    const first = infoView(syntheticDefinition.experience, { kind: "window", id: contact.id }, minutes(60));
    const second = infoView(syntheticDefinition.experience, { kind: "window", id: contact.id }, minutes(150));
    expect(first?.provenance?.notes).not.toBe(second?.provenance?.notes);
    expect(first?.provenance?.status).not.toMatch(/measured/i);
  });

  it("leaves Apollo without windows and with its events unchanged", () => {
    expect(apollo11Definition.experience.windows).toBeUndefined();
    expect(apollo11Definition.experience.events.length).toBeGreaterThan(0);
    expect(syntheticDefinition.experience.events.map((event) => event.id)).toEqual(["marker-start", "marker-quarter"]);
  });
});

describe("a shower built from a settings file", () => {
  const shower = buildShowerDefinition(parseShowerSettings(perseidsFile), { kind: "loaded", orbits: madeUpOrbits(7, 50) });

  it("mounts through the shell with its own stream and none of Apollo's objects", () => {
    const markup = shellMarkup({ ...shower, experience: experienceWithGroups(shower) });
    expect(markup).toContain("Perseids stream");
    expect(markup).not.toMatch(/columbia|eagle|apollo/i);
  });
});

describe("generic code boundary", () => {
  it("leaves the shower builder outside its scope by design: it is where a shower's own words live", () => {
    expect(Object.keys(sources).some((path) => path.includes("/showers/"))).toBe(false);
  });

  it("contains no experience-specific names in core, shell or generic app code", () => {
    expect(Object.keys(sources).some((path) => path.includes("/src/core/") || path.includes("/core/"))).toBe(true);
    expect(Object.keys(sources).some((path) => path.includes("/shell/"))).toBe(true);
    expect(Object.keys(sources).some((path) => path.includes("/app/"))).toBe(true);
    expect(Object.keys(sources).some((path) => path.includes("/assets/"))).toBe(true);
    const offenders = Object.entries(sources)
      .filter(([, source]) => /apollo|columbia|eagle|perseid|meteor/i.test(source))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});
