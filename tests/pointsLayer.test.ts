import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  experienceWithGroups,
  groupsOf,
  trackedBodiesOf,
  usesEarthMoon,
  type ExperienceDefinition,
  type GroupLayer,
  type SceneLayerId,
} from "../src/app/experienceDefinition";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { PointsView } from "../src/app/PointsView";
import { placementAbout } from "./scenePlacement";
import { eqjToRenderVector } from "../src/app/renderCoordinates";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import type { CenterId } from "../src/core/body";
import { createProvenance } from "../src/core/provenance";
import { memberState, type PointGroup } from "../src/core/pointGroup";
import { composeCenteredPositions, sunPositionFromEarthAt } from "../src/core/referenceCenters";
import { readableScale, trueScale } from "../src/core/scalePolicy";
import { AstraeusShell } from "../src/shell/AstraeusShell";
import { findCameraPreset } from "../src/shell/objectModel";
import { apollo11Definition } from "../src/mission/apollo11Definition";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import { syntheticRingLayer } from "../src/synthetic/syntheticRingDefinition";

const adapter = createOrbAstronomyAdapter();
const earthPlacement = placementAbout("earth", adapter);
const START = Date.UTC(2030, 0, 1);
const END = START + 6 * 3_600_000;
const COUNT = 50;

const provenance = createProvenance({
  sourceType: "illustrative",
  sources: ["Made up inside the points layer tests; not a real population"],
  accuracy: "None claimed. A rotating ring invented for this fixture.",
  notes: "Exists to prove the points layer through the plug-in contract.",
});

/** Made-up ring that turns once per six hours; positions depend only on the time. */
function ringGroup(id: string, center: CenterId, fills: { count: number } = { count: 0 }): PointGroup {
  const position = (index: number, timeUtcMs: number): number[] => {
    const angle = (2 * Math.PI * index) / COUNT + (2 * Math.PI * (timeUtcMs - START)) / (END - START);
    return [20_000 * Math.cos(angle), 20_000 * Math.sin(angle), 3_000 * Math.sin(2 * angle)];
  };
  return {
    id, count: COUNT, center, frame: "EQJ", bounds: { startUtcMs: START, endUtcMs: END }, provenance,
    fillPositionsKm(timeUtcMs, out) {
      fills.count += 1;
      for (let i = 0; i < COUNT; i += 1) out.set(position(i, timeUtcMs), 3 * i);
    },
    stateAt: (index, timeUtcMs) => memberState({ id, center, bounds: { startUtcMs: START, endUtcMs: END } }, index, timeUtcMs, position(index, timeUtcMs)),
  };
}

function layerFor(id: string, center: CenterId, fills?: { count: number }, extra: Partial<GroupLayer> = {}): GroupLayer {
  return {
    group: ringGroup(id, center, fills),
    color: "#88ccff",
    object: {
      id, label: `Ring ${id}`, description: "Centroid of a made-up ring.", knownLimitations: ["Made up; no physical meaning."],
    },
    ...extra,
  };
}

function definitionWith(layers: readonly SceneLayerId[], groups: readonly GroupLayer[]): ExperienceDefinition {
  const presets = groups.flatMap((layer) => [
    { id: `focus-${layer.object.id}`, label: "Focus", request: { kind: "focus", target: layer.object.id } },
    { id: `follow-${layer.object.id}`, label: "Follow", request: { kind: "follow", target: layer.object.id } },
  ] as const);
  return {
    ...syntheticDefinition,
    sceneLayers: layers,
    groups,
    experience: { ...syntheticDefinition.experience, cameraPresets: [...syntheticDefinition.experience.cameraPresets, ...presets] },
  };
}

const noop = () => undefined;
function shellMarkup(definition: ExperienceDefinition): string {
  return renderToStaticMarkup(createElement(AstraeusShell, {
    experience: experienceWithGroups(definition),
    snapshot: { timeUtcMs: START, rate: 1, playing: false } as never,
    developerMode: false, onDeveloperModeChange: noop, onTogglePlayback: noop, onRateChange: noop, onSeek: noop,
    onCameraRequest: noop, onSelectionChange: noop, scaleId: "true-scale", onScaleChange: noop, children: null,
  }));
}

describe("points layer: layer matrix through the plug-in helpers", () => {
  const ring = layerFor("ring-a", "earth");
  it.each([
    ["empty", [], 0, false, 0],
    ["tracked-only", ["tracked-bodies"], 0, false, 1],
    ["points-only", ["points"], 1, false, 0],
    ["earth-moon + points", ["earth-moon", "points"], 1, true, 0],
    ["all three", ["earth-moon", "tracked-bodies", "points"], 1, true, 1],
    ["duplicates", ["points", "points", "earth-moon", "earth-moon", "tracked-bodies", "tracked-bodies"], 1, true, 1],
  ] as const)("%s", (_name, layers, groups, earthMoon, tracked) => {
    const definition = definitionWith(layers, [ring, ring]);
    expect(groupsOf(definition)).toHaveLength(groups);
    expect(usesEarthMoon(definition)).toBe(earthMoon);
    expect(trackedBodiesOf(definition)).toHaveLength(tracked);
  });

  it("draws no group, and adds no shell item, without the points layer", () => {
    const definition = definitionWith(["earth-moon", "tracked-bodies"], [ring]);
    expect(groupsOf(definition)).toEqual([]);
    expect(experienceWithGroups(definition)).toBe(definition.experience);
    expect(shellMarkup(definition)).not.toContain("Ring ring-a");
  });

  it("leaves Apollo, which has no points layer, exactly as it was", () => {
    expect(groupsOf(apollo11Definition)).toEqual([]);
    expect(experienceWithGroups(apollo11Definition)).toBe(apollo11Definition.experience);
  });
});

describe("points layer: one shell item per group", () => {
  it("lists each group once, with the group's provenance, limitations and bounds", () => {
    const definition = definitionWith(["points"], [layerFor("ring-a", "earth"), layerFor("ring-a", "earth"), layerFor("ring-b", "sun")]);
    const objects = experienceWithGroups(definition).objects.filter((object) => object.id.startsWith("ring-"));
    expect(objects.map((object) => object.id)).toEqual(["ring-a", "ring-b"]);
    expect(objects[0].provenance).toBe(provenance);
    expect(objects[0].availability).toEqual({ startUtcMs: START, endUtcMs: END });
    expect(objects[0].knownLimitations).toEqual(["Made up; no physical meaning."]);
    const markup = shellMarkup(definition);
    expect(markup.match(/Ring ring-a/g)).toHaveLength(1);
    expect(markup.match(/Ring ring-b/g)).toHaveLength(1);
  });

  it("does not list a group twice when the experience already lists its id", () => {
    const layer = layerFor("survey-marker", "earth");
    const definition = definitionWith(["points", "tracked-bodies"], [layer]);
    expect(experienceWithGroups(definition).objects.filter((object) => object.id === "survey-marker")).toHaveLength(1);
  });

  it("gives select, focus and follow a target through the group's id", () => {
    const experience = experienceWithGroups(definitionWith(["points"], [layerFor("ring-a", "earth")]));
    expect(findCameraPreset(experience, "focus", "ring-a")?.request).toEqual({ kind: "focus", target: "ring-a" });
    expect(findCameraPreset(experience, "follow", "ring-a")?.request).toEqual({ kind: "follow", target: "ring-a" });
  });
});

describe("points view", () => {
  it("places a Sun-centred member where the composed single-member State puts it", () => {
    const view = new PointsView(layerFor("ring-sun", "sun"));
    const origin = new FloatingOrigin();
    const t = START + 1_800_000;
    view.sync(t, earthPlacement, trueScale);
    view.place(origin);
    const member = view.layer.group.stateAt(7, t);
    const composed = composeCenteredPositions(member, sunPositionFromEarthAt(adapter, t));
    const expected = eqjToRenderVector(trueScale.mapPosition(composed.positionKm));
    const local = view.memberLocalPosition(7);
    for (let i = 0; i < 3; i += 1) expect(local[i]).toBeCloseTo(expected[i], 1);
    expect(composed.center).toBe("earth");
  });

  it("places an Earth-centred member without any offset", () => {
    const view = new PointsView(layerFor("ring-earth", "earth"));
    view.sync(START, earthPlacement, trueScale);
    view.place(new FloatingOrigin());
    const expected = eqjToRenderVector(trueScale.mapPosition(view.layer.group.stateAt(3, START).positionKm));
    const local = view.memberLocalPosition(3);
    for (let i = 0; i < 3; i += 1) expect(local[i]).toBeCloseTo(expected[i], 4);
  });

  it("maps through ScalePolicy at both scales and never changes the group's State (ARCH-02)", () => {
    const view = new PointsView(layerFor("ring-earth", "earth"));
    const group = view.layer.group;
    const before = group.stateAt(5, START);
    const origin = new FloatingOrigin();
    view.sync(START, earthPlacement, trueScale);
    view.place(origin);
    const trueLocal = view.memberLocalPosition(5);
    view.sync(START, earthPlacement, readableScale);
    origin.set([100, -50, 25]); // a camera move
    view.place(origin);
    const readableLocal = view.memberLocalPosition(5);
    const expected = eqjToRenderVector(readableScale.mapPosition(before.positionKm));
    expect(readableLocal[0]).toBeCloseTo(expected[0] - 100, 3);
    expect(readableLocal[1]).toBeCloseTo(expected[1] + 50, 3);
    expect(readableLocal[2]).toBeCloseTo(expected[2] - 25, 3);
    expect(Math.hypot(...trueLocal)).toBeCloseTo(Math.hypot(...before.positionKm) / 6371.0084, 2);
    expect(group.stateAt(5, START)).toEqual(before);
    expect(view.fillCount).toBe(1); // a scale switch remaps; it does not refill
  });

  it("holds the representative point at the centroid of the members", () => {
    const view = new PointsView(layerFor("ring-earth", "earth"));
    view.sync(START, earthPlacement, trueScale);
    const km = [0, 0, 0];
    for (let i = 0; i < COUNT; i += 1) {
      const p = view.layer.group.stateAt(i, START).positionKm;
      for (let k = 0; k < 3; k += 1) km[k] += p[k] / COUNT;
    }
    const expected = eqjToRenderVector(trueScale.mapPosition(km));
    for (let i = 0; i < 3; i += 1) expect(view.absolute()[i]).toBeCloseTo(expected[i], 6);
    expect(view.extentUnits(trueScale)).toBeGreaterThan(3);
  });

  it("draws nothing and calls no fill outside the bounds, and draws at both boundary times", () => {
    const fills = { count: 0 };
    const view = new PointsView(layerFor("ring-earth", "earth", fills));
    const origin = new FloatingOrigin();
    for (const outside of [START - 1, END + 1]) {
      view.sync(outside, earthPlacement, trueScale);
      view.place(origin);
      expect(view.drawn).toBe(false);
      expect(view.group.children[0].visible).toBe(false);
    }
    expect(fills.count).toBe(0);
    for (const boundary of [START, END]) {
      view.sync(boundary, earthPlacement, trueScale);
      view.place(origin);
      expect(view.drawn).toBe(true);
      expect(view.group.children[0].visible).toBe(true);
    }
    expect(fills.count).toBe(2);
  });

  it("still gives the camera a representative point when it starts outside the bounds", () => {
    const view = new PointsView(layerFor("ring-sun", "sun"));
    view.sync(START - 1, earthPlacement, trueScale);
    const centre = eqjToRenderVector(trueScale.mapPosition(sunPositionFromEarthAt(adapter, START).positionKm));
    expect(view.absolute()).toEqual(centre);
    expect(view.drawn).toBe(false);
  });

  // T-030: replaces the T-028 case "refills only after the clock has moved the refill interval, in either direction".
  // A fill now happens once per interval while playing on, and the drawn positions blend the two held fills.
  it("fills once for a seek, then once per interval while playing forward", () => {
    const fills = { count: 0 };
    const view = new PointsView(layerFor("ring-earth", "earth", fills, { refillAfterMs: 60_000 }));
    const start = START + 600_000;
    view.sync(start, earthPlacement, trueScale);
    expect(fills.count).toBe(1);
    for (let t = start + 5_000; t <= start + 150_000; t += 5_000) view.sync(t, earthPlacement, trueScale);
    expect(fills.count).toBe(4); // pair slides at +5 s, +65 s and +125 s
    view.sync(start + 150_000, earthPlacement, trueScale);
    expect(fills.count).toBe(4); // a repeated time never fills
  });

  it("fills once per interval while playing backwards", () => {
    const fills = { count: 0 };
    const view = new PointsView(layerFor("ring-earth", "earth", fills, { refillAfterMs: 60_000 }));
    const start = START + 3_000_000;
    view.sync(start, earthPlacement, trueScale);
    for (let t = start - 5_000; t >= start - 150_000; t -= 5_000) view.sync(t, earthPlacement, trueScale);
    expect(fills.count).toBe(4);
  });

  it("refills once on a seek outside the held pair and does not blend across the gap", () => {
    const fills = { count: 0 };
    const view = new PointsView(layerFor("ring-earth", "earth", fills, { refillAfterMs: 60_000 }));
    view.sync(START + 600_000, earthPlacement, trueScale);
    view.sync(START + 600_000 + 5_000, earthPlacement, trueScale);
    const before = fills.count;
    const target = START + 4_000_000;
    view.sync(target, earthPlacement, trueScale);
    view.place(new FloatingOrigin());
    expect(fills.count).toBe(before + 1);
    const exact = eqjToRenderVector(trueScale.mapPosition(view.layer.group.stateAt(9, target).positionKm));
    const local = view.memberLocalPosition(9);
    for (let i = 0; i < 3; i += 1) expect(local[i]).toBeCloseTo(exact[i], 4);
  });

  it("draws the exact fill at a fill time and a close blend between fills", () => {
    const span = 600_000;
    const view = new PointsView(layerFor("ring-earth", "earth", undefined, { refillAfterMs: span }));
    const start = START + 1_200_000;
    const origin = new FloatingOrigin();
    view.sync(start, earthPlacement, trueScale);
    view.sync(start + 1, earthPlacement, trueScale); // slides the pair so the after-fill is one span on
    view.sync(start, earthPlacement, trueScale);
    view.place(origin);
    const at = (member: number, t: number) => eqjToRenderVector(trueScale.mapPosition(view.layer.group.stateAt(member, t).positionKm));
    for (let i = 0; i < 3; i += 1) expect(view.memberLocalPosition(11)[i]).toBeCloseTo(at(11, start)[i], 4);
    const mid = start + span / 2;
    view.sync(mid, earthPlacement, trueScale);
    view.place(origin);
    const exact = at(11, mid);
    const local = view.memberLocalPosition(11);
    const errorUnits = Math.hypot(local[0] - exact[0], local[1] - exact[1], local[2] - exact[2]);
    // A 10-minute span on a ring that turns once per six hours is the coarse case: under half a percent of the radius.
    expect(errorUnits / Math.hypot(...exact)).toBeLessThan(0.005);
    expect(errorUnits).toBeGreaterThan(0); // it is a blend, not the exact fill
  });

  it("keeps the group's State identical while blending and across a scale switch (ARCH-02)", () => {
    const view = new PointsView(layerFor("ring-earth", "earth", undefined, { refillAfterMs: 60_000 }));
    const group = view.layer.group;
    const t = START + 900_000;
    const before = group.stateAt(4, t + 20_000);
    view.sync(t, earthPlacement, trueScale);
    view.sync(t + 20_000, earthPlacement, trueScale);
    view.place(new FloatingOrigin());
    view.sync(t + 20_000, earthPlacement, readableScale);
    view.place(new FloatingOrigin());
    expect(group.stateAt(4, t + 20_000)).toEqual(before);
  });

  it("holds both fills inside the bounds up to the end, for a group that rejects times outside them", () => {
    const layer = syntheticRingLayer;
    const view = new PointsView(layer);
    const end = layer.group.bounds!.endUtcMs;
    for (let t = end - 150_000; t <= end; t += 5_000) view.sync(t, earthPlacement, trueScale);
    expect(view.drawn).toBe(true);
    const start = layer.group.bounds!.startUtcMs;
    const back = new PointsView(layer);
    for (let t = start + 150_000; t >= start; t -= 5_000) back.sync(t, earthPlacement, trueScale);
    expect(back.drawn).toBe(true);
  });

  it("rejects a refill interval that is not positive and finite", () => {
    expect(() => new PointsView(layerFor("ring-earth", "earth", undefined, { refillAfterMs: 0 }))).toThrow(RangeError);
    expect(() => new PointsView(layerFor("ring-earth", "earth", undefined, { refillAfterMs: Number.NaN }))).toThrow(RangeError);
  });

  it("composes a group centred on the Moon through the resolver, like any catalogued centre", () => {
    const view = new PointsView(layerFor("ring-moon", "moon"));
    const t = START + 1_800_000;
    view.sync(t, earthPlacement, trueScale);
    view.place(new FloatingOrigin());
    const member = view.layer.group.stateAt(7, t);
    const moonFromEarth = earthPlacement.resolver.offsetKm("moon", "earth", t);
    const expected = eqjToRenderVector(trueScale.mapPosition([0, 1, 2].map((k) => member.positionKm[k] + moonFromEarth[k])));
    const local = view.memberLocalPosition(7);
    for (let i = 0; i < 3; i += 1) expect(local[i]).toBeCloseTo(expected[i], 1);
  });

  it("adds nothing to a group whose centre is the scene centre, and shifts it by the centre's offset otherwise", () => {
    const t = START + 1_800_000;
    const about = (center: string) => {
      const view = new PointsView(layerFor("ring-sun", "sun"));
      view.sync(t, placementAbout(center, adapter), trueScale);
      view.place(new FloatingOrigin());
      return view.memberLocalPosition(3);
    };
    const member = layerFor("ring-sun", "sun").group.stateAt(3, t).positionKm;
    const fromSun = eqjToRenderVector(trueScale.mapPosition(member));
    const sunCentred = about("sun");
    for (let i = 0; i < 3; i += 1) expect(sunCentred[i]).toBeCloseTo(fromSun[i], 1);
    const earthCentred = about("earth");
    const sunFromEarth = earthPlacement.resolver.offsetKm("sun", "earth", t);
    const shifted = eqjToRenderVector(trueScale.mapPosition([0, 1, 2].map((k) => member[k] + sunFromEarth[k])));
    for (let i = 0; i < 3; i += 1) expect(earthCentred[i]).toBeCloseTo(shifted[i], 1);
  });
});
