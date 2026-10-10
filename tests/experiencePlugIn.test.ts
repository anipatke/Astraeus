import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { SimulationClock } from "../src/core/clock";
import { MoonTrajectory } from "../src/core/moonTrajectory";
import { trackedBodiesOf, type ExperienceDefinition } from "../src/app/experienceDefinition";
import { AstraeusShell } from "../src/shell/AstraeusShell";
import { apollo11Definition } from "../src/mission/apollo11Definition";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";

const sources = import.meta.glob<string>(
  ["../src/core/**/*.{ts,tsx}", "../src/shell/**/*.{ts,tsx,css}", "../src/app/*.{ts,tsx,css}"],
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
    const adapter = createOrbAstronomyAdapter();
    const clock = new SimulationClock(definition.clock.startUtcMs);
    const metrics = definition.createMetrics({ clock, adapter, moon: new MoonTrajectory(adapter) });
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

describe("generic code boundary", () => {
  it("contains no experience-specific names in core, shell or generic app code", () => {
    expect(Object.keys(sources).some((path) => path.includes("/src/core/") || path.includes("/core/"))).toBe(true);
    expect(Object.keys(sources).some((path) => path.includes("/shell/"))).toBe(true);
    expect(Object.keys(sources).some((path) => path.includes("/app/"))).toBe(true);
    const offenders = Object.entries(sources)
      .filter(([, source]) => /apollo|columbia|eagle|perseid|meteor/i.test(source))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});
