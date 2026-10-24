import { hasEarthMoon } from "astraeus/tests/scenePlacement";
import appHtml from "../app.html?raw";
import { describe, expect, it } from "vitest";
import perseidsFile from "astraeus-demo-showers/data/showers/perseids.json";
import { jupiterIoExplorer } from "astraeus-demo-planets/experiences/jupiter-io/jupiterIo";
import { buildShowerDefinition } from "astraeus-demo-showers/tests/helpers/showerDefinition";
import { parseShowerSettings } from "astraeus-demo-showers/experiences/showers/showerSettings";
import { focusLimits } from "astraeus/app/sceneFraming";
import { MOON } from "astraeus/core/body";
import { readableScale, trueScale } from "astraeus/core/scalePolicy";
import {
  DEFAULT_CAMERA_FAR,
  cameraReachOf,
  pageTitleOf,
  experienceWithGroups,
  groupsOf,
  trackedBodiesOf,
  validateCameraReach,
  type ExperienceDefinition,
} from "astraeus/app/experienceDefinition";
import { syntheticBeltDefinition } from "astraeus/synthetic/syntheticRingDefinition";
import { syntheticBareDefinition, syntheticDefinition } from "astraeus/synthetic/syntheticDefinition";
import { apollo11Definition } from "astraeus-demo-apollo11/experiences/apollo11/apollo11Definition";

const appSources = import.meta.glob<string>("../../astraeus/src/app/*.{ts,tsx}", { query: "?raw", import: "default", eager: true });

const genericWindowFiles = [
  "../../astraeus/src/core/timeWindow.ts",
  "../../astraeus/src/shell/timelineModel.ts",
  "../../astraeus/src/shell/TimelineBar.tsx",
  "../../astraeus/src/shell/infoModel.ts",
  "../../astraeus/src/shell/InfoPanel.tsx",
  "../../astraeus/src/shell/MetricVisual.tsx",
  "../../astraeus/src/shell/metrics.ts",
  "../../astraeus/src/shell/experience.ts",
  "../../astraeus/src/shell/AstraeusShell.tsx",
  "../../astraeus/src/shell/style.css",
];
const windowSources = import.meta.glob<string>(
  ["../../astraeus/src/core/timeWindow.ts", "../../astraeus/src/shell/*.{ts,tsx,css}"],
  { query: "?raw", import: "default", eager: true },
);

describe("window files stay generic", () => {
  it.each(genericWindowFiles)("%s is covered and has no meteor, shower or Perseids naming", (path) => {
    expect(windowSources[path]).toBeDefined();
    expect(windowSources[path]).not.toMatch(/meteor|shower|perseid/i);
  });
});

describe("experience plug-in contract", () => {
  it("keeps generic src/app code free of src/mission, src/experiences and src/synthetic imports", () => {
    const offenders = Object.entries(appSources)
      .filter(([, source]) => /from\s+["'][^"']*\/(mission|experiences|synthetic)\/[^"']*["']/.test(source))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it("supplies Apollo's tracked bodies only through the tracked-bodies layer", () => {
    expect(trackedBodiesOf(apollo11Definition).length).toBeGreaterThan(0);
    const withoutLayer: ExperienceDefinition = { ...apollo11Definition, sceneLayers: [] };
    expect(trackedBodiesOf(withoutLayer)).toEqual([]);
  });

  it("starts Apollo's clock at its window start", () => {
    expect(apollo11Definition.clock.startUtcMs).toBe(apollo11Definition.experience.window.startUtcMs);
  });

  it.each([
    [[], 0],
    [["tracked-bodies"], 1],
    [["tracked-bodies", "tracked-bodies"], 1],
  ] as const)("reads layers %j as %i tracked body, whatever the composition", (layers, tracked) => {
    const definition: ExperienceDefinition = { ...syntheticDefinition, sceneLayers: layers };
    expect(hasEarthMoon(definition)).toBe(true);
    expect(trackedBodiesOf(definition)).toHaveLength(tracked);
  });

  it("offers a bare synthetic variant without Earth and Moon", () => {
    expect(hasEarthMoon(syntheticBareDefinition)).toBe(false);
    expect(hasEarthMoon(syntheticDefinition)).toBe(true);
    expect(trackedBodiesOf(syntheticBareDefinition)).toHaveLength(1);
  });
});

const camera = ["experienceDefinition.ts", "AstraeusScene.tsx", "CameraController.tsx", "App.tsx"].map((file) => `../../astraeus/src/app/${file}`);

describe("camera reach files stay generic", () => {
  it.each(camera)("%s is covered and has no meteor, shower or Perseids naming", (path) => {
    expect(appSources[path]).toBeDefined();
    expect(appSources[path]).not.toMatch(/meteor|shower|perseid/i);
  });
});

describe("optional camera reach", () => {
  // Today's scene constants: reach max(30, moonDistance x 3.5), Earth min 1.15, Moon min 1.6 x radius, tracked min 0.002, far 5000.
  const moonRadius = trueScale.mapRadius(MOON.radiusKm);
  it.each([6, 60, 600])("keeps today's limits for every focus kind when omitted (Moon distance %d)", (moonDistance) => {
    const reach = Math.max(30, moonDistance * 3.5);
    const frame = { centre: "earth", span: moonDistance };
    for (const policy of [trueScale, readableScale]) {
      expect(focusLimits("earth", frame, policy, {})).toEqual({ min: 1.15, max: reach });
      expect(focusLimits("moon", frame, policy, {})).toEqual({ min: moonRadius * 1.6, max: reach });
      expect(focusLimits("columbia", frame, policy, {})).toEqual({ min: 0.002, max: reach });
    }
  });

  it("keeps the 5000 far plane and no reach for definitions that declare none", () => {
    expect(DEFAULT_CAMERA_FAR).toBe(5_000);
    expect(cameraReachOf(apollo11Definition)).toEqual({});
    expect(cameraReachOf(syntheticDefinition)).toEqual({});
  });

  it("replaces only the farthest distance when declared, for every focus kind", () => {
    const declared = { maxFocusDistance: 400_000, far: 1_000_000 };
    const frame = { centre: "earth", span: 60 };
    expect(focusLimits("earth", frame, trueScale, declared)).toEqual({ min: 1.15, max: 400_000 });
    expect(focusLimits("moon", frame, trueScale, declared)).toEqual({ min: moonRadius * 1.6, max: 400_000 });
    expect(focusLimits("dust-belt", frame, trueScale, declared)).toEqual({ min: 0.002, max: 400_000 });
  });

  it("lets the made-up belt declare a reach that exceeds today's far plane", () => {
    const reach = cameraReachOf(syntheticBeltDefinition);
    expect(reach.maxFocusDistance).toBeGreaterThan(DEFAULT_CAMERA_FAR);
    expect(reach.far).toBeGreaterThan(reach.maxFocusDistance ?? Infinity);
  });

  it.each([
    [{ maxFocusDistance: Number.NaN }, /camera\.maxFocusDistance must be finite/],
    [{ far: Infinity }, /camera\.far must be finite/],
    [{ maxFocusDistance: 0 }, /camera\.maxFocusDistance must be positive/],
    [{ far: -1 }, /camera\.far must be positive/],
    [{ maxFocusDistance: 100, far: 100 }, /camera\.far \(100\) must exceed camera\.maxFocusDistance \(100\)/],
    [{ maxFocusDistance: 100, far: 50 }, /must exceed/],
  ])("rejects %j with a named error", (reach, message) => {
    expect(() => validateCameraReach(reach)).toThrow(message);
  });

  it("accepts a partial or empty reach", () => {
    expect(validateCameraReach({})).toEqual({});
    expect(validateCameraReach({ far: 9_000 })).toEqual({ far: 9_000 });
    expect(validateCameraReach({ maxFocusDistance: 90 })).toEqual({ maxFocusDistance: 90 });
  });

  it("leaves group fills and the shell's objects identical with and without a declared reach", () => {
    const without: ExperienceDefinition = { ...syntheticBeltDefinition, camera: undefined };
    const [declared] = groupsOf(syntheticBeltDefinition);
    const [plain] = groupsOf(without);
    const a = new Float64Array(3 * declared.group.count);
    const b = new Float64Array(3 * plain.group.count);
    const t = syntheticBeltDefinition.clock.startUtcMs + 3_600_000;
    declared.group.fillPositionsKm(t, a);
    plain.group.fillPositionsKm(t, b);
    expect(a).toEqual(b);
    expect(experienceWithGroups(syntheticBeltDefinition)).toEqual(experienceWithGroups(without));
  });
});

describe("the page heading", () => {
  it("is Astraeus until an experience opens, then the experience's own label before it", () => {
    expect(appHtml).toMatch(/<title>Astraeus<\/title>/);
    expect(appHtml).not.toMatch(/spike/i);
    expect(pageTitleOf({})).toBe("Astraeus");
    expect(pageTitleOf({ label: "  " })).toBe("Astraeus");
    expect(pageTitleOf({ label: "Perseids" })).toBe("Perseids \u00b7 Astraeus");
  });

  it("is taken from each real experience's definition, so the shell names none", () => {
    const perseids = buildShowerDefinition(parseShowerSettings(perseidsFile), { kind: "absent" });
    const titles = [apollo11Definition, jupiterIoExplorer, perseids].map(pageTitleOf);
    expect(titles).toEqual(["Apollo 11 \u00b7 Astraeus", "Jupiter and Io \u00b7 Astraeus", "Perseids \u00b7 Astraeus"]);
  });
});
