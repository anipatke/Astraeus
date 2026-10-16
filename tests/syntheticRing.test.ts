import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { experienceWithGroups, groupsOf, type ExperienceDefinition } from "../src/app/experienceDefinition";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { PointsView } from "../src/app/PointsView";
import { hasEarthMoon, placementAbout } from "./scenePlacement";
import { eqjToRenderVector } from "../src/app/renderCoordinates";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { SimulationClock } from "../src/core/clock";
import { composeCenteredPositions, sunPositionFromEarthAt } from "../src/core/referenceCenters";
import { readableScale, trueScale } from "../src/core/scalePolicy";
import { AstraeusShell } from "../src/shell/AstraeusShell";
import { findCameraPreset } from "../src/shell/objectModel";
import {
  BELT_MEMBER_COUNT,
  RING_MEMBER_COUNT,
  syntheticBeltDefinition,
  syntheticBeltLayer,
  syntheticRingDefinition,
  syntheticRingLayer,
} from "../src/synthetic/syntheticRingDefinition";

const adapter = createOrbAstronomyAdapter();
const earthPlacement = placementAbout("earth", adapter);
const { startUtcMs, endUtcMs } = syntheticRingDefinition.experience.window;
const noop = () => undefined;

function shellMarkup(definition: ExperienceDefinition): string {
  return renderToStaticMarkup(createElement(AstraeusShell, {
    experience: experienceWithGroups(definition),
    snapshot: new SimulationClock(definition.clock.startUtcMs).snapshot(),
    developerMode: false, onDeveloperModeChange: noop, onTogglePlayback: noop, onRateChange: noop, onSeek: noop,
    onCameraRequest: noop, onSelectionChange: noop, scaleId: "true-scale", onScaleChange: noop, children: null,
  }));
}

// The Sun-centred group goes through the same definition path as the ring.
const beltDefinition: ExperienceDefinition = {
  ...syntheticRingDefinition,
  sceneLayers: ["points"],
  groups: [syntheticBeltLayer],
  experience: {
    ...syntheticRingDefinition.experience,
    cameraPresets: [
      ...syntheticRingDefinition.experience.cameraPresets,
      { id: "focus-belt", label: "Focus belt", request: { kind: "focus", target: "dust-belt" } },
    ],
  },
};

describe("the made-up debris ring through the plug-in contract", () => {
  it("is an Earth-centred group of at least 10,000 members with illustrative provenance and a two-body limitation", () => {
    const { group, object } = syntheticRingLayer;
    expect(group.count).toBe(RING_MEMBER_COUNT);
    expect(RING_MEMBER_COUNT).toBeGreaterThanOrEqual(10_000);
    expect(group.center).toBe("earth");
    expect(group.provenance.sourceType).toBe("illustrative");
    expect(group.provenance.notes).toMatch(/two-body/i);
    expect(object.knownLimitations?.join(" ")).toMatch(/two-body/);
  });

  it("is listed once in the shell with its provenance, and has focus and follow presets", () => {
    expect(groupsOf(syntheticRingDefinition)).toHaveLength(1);
    const experience = experienceWithGroups(syntheticRingDefinition);
    const items = experience.objects.filter((object) => object.id === "debris-ring");
    expect(items).toHaveLength(1);
    expect(items[0].provenance?.sourceType).toBe("illustrative");
    expect(shellMarkup(syntheticRingDefinition).match(/Debris ring/g)?.length).toBeGreaterThan(0);
    expect(findCameraPreset(experience, "focus", "debris-ring")).toBeDefined();
    expect(findCameraPreset(experience, "follow", "debris-ring")).toBeDefined();
    expect(hasEarthMoon(syntheticRingDefinition)).toBe(true);
  });

  it("names no meteor, shower or Apollo object", () => {
    expect(shellMarkup(syntheticRingDefinition)).not.toMatch(/columbia|eagle|apollo|meteor|shower|perseid/i);
  });

  it("gives the same positions for the same time and keeps every member near its Earth-centred shell", () => {
    const { group } = syntheticRingLayer;
    const a = new Float64Array(3 * group.count);
    const b = new Float64Array(3 * group.count);
    const t = startUtcMs + 5 * 3_600_000;
    group.fillPositionsKm(t, a);
    group.fillPositionsKm(t, b);
    expect(a).toEqual(b);
    for (let i = 0; i < group.count; i += 997) {
      const r = Math.hypot(a[3 * i], a[3 * i + 1], a[3 * i + 2]);
      expect(r).toBeGreaterThan(20_000);
      expect(r).toBeLessThan(32_000);
    }
  });

  it("maps through both scales and leaves the group's State unchanged (ARCH-02)", () => {
    const view = new PointsView(syntheticRingLayer);
    const before = syntheticRingLayer.group.stateAt(42, startUtcMs);
    const origin = new FloatingOrigin();
    view.sync(startUtcMs, earthPlacement, trueScale);
    view.place(origin);
    expect(view.drawn).toBe(true);
    view.sync(startUtcMs, earthPlacement, readableScale);
    view.place(origin);
    expect(syntheticRingLayer.group.stateAt(42, startUtcMs)).toEqual(before);
    expect(view.fillCount).toBe(1);
  });

  it("is hidden outside its time bounds", () => {
    const view = new PointsView(syntheticRingLayer);
    view.sync(endUtcMs + 1, earthPlacement, trueScale);
    expect(view.drawn).toBe(false);
  });
});

describe("the made-up Sun-centred belt through the same definition path", () => {
  it("is a Sun-centred illustrative group of at least 10,000 members", () => {
    const { group } = syntheticBeltLayer;
    expect(group.count).toBe(BELT_MEMBER_COUNT);
    expect(group.count).toBeGreaterThanOrEqual(10_000);
    expect(group.center).toBe("sun");
    expect(group.provenance.sourceType).toBe("illustrative");
    expect(group.provenance.notes).toMatch(/two-body/i);
  });

  it("is listed once, selectable through the definition helpers", () => {
    expect(groupsOf(beltDefinition).map((layer) => layer.object.id)).toEqual(["dust-belt"]);
    expect(experienceWithGroups(beltDefinition).objects.filter((object) => object.id === "dust-belt")).toHaveLength(1);
    expect(findCameraPreset(experienceWithGroups(beltDefinition), "focus", "dust-belt")).toBeDefined();
  });

  it("places a member where the composed single-member State puts it", () => {
    const view = new PointsView(syntheticBeltLayer);
    const t = startUtcMs + 3_600_000;
    view.sync(t, earthPlacement, trueScale);
    view.place(new FloatingOrigin());
    const composed = composeCenteredPositions(syntheticBeltLayer.group.stateAt(11, t), sunPositionFromEarthAt(adapter, t));
    const expected = eqjToRenderVector(trueScale.mapPosition(composed.positionKm));
    const local = view.memberLocalPosition(11);
    for (let i = 0; i < 3; i += 1) expect(local[i] / expected[i]).toBeCloseTo(1, 4);
    expect(composed.center).toBe("earth");
  });

  it("is deterministic and bounded in time like any group", () => {
    const { group } = syntheticBeltLayer;
    const a = new Float64Array(3 * group.count);
    const b = new Float64Array(3 * group.count);
    group.fillPositionsKm(startUtcMs, a);
    group.fillPositionsKm(startUtcMs, b);
    expect(a).toEqual(b);
    expect(() => group.fillPositionsKm(endUtcMs + 1, a)).toThrow();
  });
});

describe("the made-up belt as a mounted experience", () => {
  it("mounts only the points layer and lists the belt once with focus and follow presets", () => {
    expect(hasEarthMoon(syntheticBeltDefinition)).toBe(false);
    expect(groupsOf(syntheticBeltDefinition).map((layer) => layer.object.id)).toEqual(["dust-belt"]);
    const experience = experienceWithGroups(syntheticBeltDefinition);
    expect(experience.objects.filter((object) => object.id === "dust-belt")).toHaveLength(1);
    expect(findCameraPreset(experience, "focus", "dust-belt")).toBeDefined();
    expect(findCameraPreset(experience, "follow", "dust-belt")).toBeDefined();
    expect(shellMarkup(syntheticBeltDefinition)).toContain("Dust belt");
  });
});
