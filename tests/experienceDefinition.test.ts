import { describe, expect, it } from "vitest";
import { trackedBodiesOf, usesEarthMoon, type ExperienceDefinition } from "../src/app/experienceDefinition";
import { syntheticBareDefinition, syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import { apollo11Definition } from "../src/mission/apollo11Definition";

const appSources = import.meta.glob<string>("../src/app/*.{ts,tsx}", { query: "?raw", import: "default", eager: true });

const genericWindowFiles = [
  "../src/core/timeWindow.ts",
  "../src/shell/timelineModel.ts",
  "../src/shell/TimelineBar.tsx",
  "../src/shell/infoModel.ts",
  "../src/shell/InfoPanel.tsx",
  "../src/shell/MetricVisual.tsx",
  "../src/shell/metrics.ts",
  "../src/shell/experience.ts",
  "../src/shell/AstraeusShell.tsx",
  "../src/shell/style.css",
];
const windowSources = import.meta.glob<string>(
  ["../src/core/timeWindow.ts", "../src/shell/*.{ts,tsx,css}"],
  { query: "?raw", import: "default", eager: true },
);

describe("window files stay generic", () => {
  it.each(genericWindowFiles)("%s is covered and has no meteor, shower or Perseids naming", (path) => {
    expect(windowSources[path]).toBeDefined();
    expect(windowSources[path]).not.toMatch(/meteor|shower|perseid/i);
  });
});

describe("experience plug-in contract", () => {
  it("keeps generic src/app code free of src/mission and src/synthetic imports", () => {
    const offenders = Object.entries(appSources)
      .filter(([, source]) => /from\s+["'][^"']*\/(mission|synthetic)\/[^"']*["']/.test(source))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it("supplies Apollo's tracked bodies only through the tracked-bodies layer", () => {
    expect(trackedBodiesOf(apollo11Definition).length).toBeGreaterThan(0);
    const withoutLayer: ExperienceDefinition = { ...apollo11Definition, sceneLayers: ["earth-moon"] };
    expect(trackedBodiesOf(withoutLayer)).toEqual([]);
  });

  it("starts Apollo's clock at its window start", () => {
    expect(apollo11Definition.clock.startUtcMs).toBe(apollo11Definition.experience.window.startUtcMs);
  });

  it.each([
    [[], false, 0],
    [["tracked-bodies"], false, 1],
    [["earth-moon"], true, 0],
    [["earth-moon", "tracked-bodies"], true, 1],
    [["tracked-bodies", "tracked-bodies", "earth-moon", "earth-moon"], true, 1],
  ] as const)("reads layers %j as earth-moon=%s with %i tracked body", (layers, earthMoon, tracked) => {
    const definition: ExperienceDefinition = { ...syntheticDefinition, sceneLayers: layers };
    expect(usesEarthMoon(definition)).toBe(earthMoon);
    expect(trackedBodiesOf(definition)).toHaveLength(tracked);
  });

  it("offers a bare synthetic variant without Earth and Moon", () => {
    expect(usesEarthMoon(syntheticBareDefinition)).toBe(false);
    expect(usesEarthMoon(syntheticDefinition)).toBe(true);
    expect(trackedBodiesOf(syntheticBareDefinition)).toHaveLength(1);
  });
});
