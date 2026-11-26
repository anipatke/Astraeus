// @vitest-environment happy-dom
// O-101 T-461: the host's labels (`addLabels`) are placed, drawn in the one label layer, covered and switched, on made-up groups and points only (ARCH-03, TEST-01).
import { PerspectiveCamera } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExperienceLabel, GroupLayer } from "../src/app/experienceDefinition";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { hiddenLabelsFrom, labelIdsOf } from "../src/app/App";
import { labelsOn } from "../src/app/displaySwitches";
import { HostLabelPlacer, hostLabelSet } from "../src/app/hostLabels";
import { PointsView } from "../src/app/PointsView";
import { eqjToRenderVector, type RenderVector } from "../src/app/renderCoordinates";
import { SceneLabelLayer } from "../src/app/SceneLabels";
import { labelPositionOf, type SceneTargets } from "../src/app/sceneTargets";
import { createOrbAstronomyAdapter } from "../src/core/astronomyAdapter";
import { createOrbitGroup } from "../src/core/orbitGroup";
import { createProvenance } from "../src/core/provenance";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";
import { trueScale, type ScalePolicy } from "../src/presentation/scalePolicy";
import type { ExperienceObject } from "../src/shell/experience";
import { placementAbout } from "./scenePlacement";

const DAY = 86_400_000;
const START = Date.UTC(2030, 0, 1);
const BOUNDS = { startUtcMs: START, endUtcMs: START + 900 * DAY };
const AU_KM = 1.495978707e8;
const RING_KM = 3 * AU_KM;
const SPREAD_KM = 0.05 * AU_KM;
const adapter = createOrbAstronomyAdapter();
const origin = new FloatingOrigin();
const sunPlacement = placementAbout("sun", adapter);
const provenance = createProvenance({
  sourceType: "illustrative",
  sources: ["Made up inside the host label tests"],
  accuracy: "None claimed.",
  notes: "Fixture.",
});
/** Scales exactly but does not say so, so the view takes the fills-plus-blend path. */
const cpuPolicy: ScalePolicy = {
  id: "true-scale",
  mapPosition: (p) => trueScale.mapPosition(p),
  mapRadius: (r) => trueScale.mapRadius(r),
};
const perKm = trueScale.mapPosition([1, 0, 0])[0];

function layerOf(id: string, count: number, anomalyDeg: number, spreadDeg: number): GroupLayer {
  const group = createOrbitGroup(
    {
      id,
      count,
      center: "sun",
      plane: "ecliptic-j2000",
      epochUtcMs: START,
      provenance,
      seed: 5,
      bounds: BOUNDS,
      base: {
        semiMajorAxisKm: RING_KM,
        eccentricity: 0.001,
        inclinationDeg: 0,
        raanDeg: 0,
        argumentOfPeriapsisDeg: 0,
        trueAnomalyDeg: anomalyDeg,
      },
      spread: { semiMajorAxisKm: SPREAD_KM, trueAnomalyDeg: spreadDeg },
    },
    createOrbTwoBodyAdapter(),
  );
  return {
    group,
    color: "#7fe3c4",
    object: { id, label: id, description: "Made up.", knownLimitations: ["Made up."] },
  };
}

const onGroups = (id: string, groups: readonly string[], extra: Partial<ExperienceLabel> = {}): ExperienceLabel => ({
  id,
  label: id.toUpperCase(),
  labelPriority: 80,
  anchor: { groups },
  ...extra,
});

interface Stand {
  readonly views: PointsView[];
  readonly placer: HostLabelPlacer;
  targetsAt(t: number): SceneTargets;
}
/** Views of the made-up groups synced at `t`, and the targets a frame would hand the layer. */
function stand(layers: readonly GroupLayer[], labels: readonly ExperienceLabel[], policy: ScalePolicy): Stand {
  const views = layers.map((layer) => new PointsView(layer));
  const placer = new HostLabelPlacer(labels);
  return {
    views,
    placer,
    targetsAt(t) {
      for (const view of views) {
        view.sync(t, sunPlacement, policy);
        view.place(origin);
      }
      return {
        bodyIdFor: () => null,
        placed: new Map(),
        absoluteOf: () => [0, 0, 0],
        groupViews: views,
        sunCentredViews: [],
        trackedViews: [],
        hostLabels: placer,
        timeUtcMs: t,
        policy,
        placement: sunPlacement,
      };
    },
  };
}

const norm = (v: ArrayLike<number>): number => Math.hypot(v[0], v[1], v[2]);
const angleDeg = (a: ArrayLike<number>, b: ArrayLike<number>): number =>
  (Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (norm(a) * norm(b))))) * 180) /
  Math.PI;
/**
 * I-209: whether `place` lies inside the groups' members as they stand at `t`: within their widest angle of their mean direction from the
 * Sun when that direction is clear (a swarm). A ring has no mean direction, so only its distance (checked by the caller) applies.
 */
function insideMembers(place: RenderVector, layers: readonly GroupLayer[], t: number): boolean {
  const members = layers.flatMap((layer) =>
    Array.from({ length: layer.group.count }, (_, i) =>
      eqjToRenderVector(trueScale.mapPosition(layer.group.stateAt(i, t).positionKm)),
    ),
  );
  const mean = [0, 0, 0];
  for (const m of members) for (let k = 0; k < 3; k += 1) mean[k] += m[k]! / norm(m);
  if (norm(mean) < 0.25 * members.length) return true;
  return angleDeg(place, mean) <= Math.max(...members.map((m) => angleDeg(m, mean))) + 0.5;
}

describe("a fixed point is placed as a group's member is", () => {
  const EPSILON = (23.4392911 * Math.PI) / 180;
  const km: [number, number, number] = [1.2e8, -3.4e7, 5.6e7];
  const t = START + 10 * DAY;
  it.each([
    ["EQJ about the scene centre", "EQJ", "sun"],
    ["EQJ about Earth", "EQJ", "earth"],
    ["ecliptic about the scene centre", "ecliptic-j2000", "sun"],
    ["ecliptic about Earth", "ecliptic-j2000", "earth"],
  ] as const)("%s", (_name, plane, centre) => {
    const label: ExperienceLabel = {
      id: "mark",
      label: "Mark",
      labelPriority: 80,
      anchor: { positionKm: km, plane, center: centre },
    };
    const placer = new HostLabelPlacer([label]);
    const targets = {
      bodyIdFor: () => null,
      groupViews: [],
      policy: trueScale,
      placement: sunPlacement,
      timeUtcMs: t,
      hostLabels: placer,
    } as unknown as SceneTargets;
    // Turned from its plane by hand (the ecliptic's tilt about the x axis), then moved by the centre's offset from the scene centre.
    const inEqj: [number, number, number] =
      plane === "EQJ"
        ? [...km]
        : [
            km[0],
            km[1] * Math.cos(EPSILON) - km[2] * Math.sin(EPSILON),
            km[1] * Math.sin(EPSILON) + km[2] * Math.cos(EPSILON),
          ];
    const offset = centre === "sun" ? [0, 0, 0] : sunPlacement.resolver.offsetKm(centre, "sun", t);
    if (centre !== "sun") expect(norm(offset)).toBeGreaterThan(1e7);
    const expected = eqjToRenderVector(
      trueScale.mapPosition([inEqj[0] + offset[0], inEqj[1] + offset[1], inEqj[2] + offset[2]]),
    );
    const place = labelPositionOf(targets, "mark")!;
    for (let k = 0; k < 3; k += 1)
      expect(Math.abs(place[k] - expected[k])).toBeLessThan(1e-6 * Math.max(1, norm(expected)));
  });
});

describe.each([
  ["graphics chip", trueScale],
  ["blend of fills", cpuPolicy],
] as const)("a label on groups, on the %s path", (_policyName, policy) => {
  const cases: readonly (readonly [string, readonly GroupLayer[]])[] = [
    ["one group", [layerOf("one", 1200, 100, 15)]],
    ["a ring about the centre", [layerOf("ring", 1200, 180, 180)]],
    [
      "four groups",
      [layerOf("a", 400, 40, 10), layerOf("b", 400, 130, 10), layerOf("c", 400, 220, 10), layerOf("d", 400, 310, 10)],
    ],
  ];
  it.each(cases)("%s: among the dots, and among them again after the clock moves", (_name, layers) => {
    const label = onGroups(
      "name",
      layers.map((layer) => layer.object.id),
    );
    const s = stand(layers, [label], policy);
    for (const t of [START + 10 * DAY, START + 20 * DAY, START + 320 * DAY]) {
      const place = labelPositionOf(s.targetsAt(t), "name")!;
      expect(place).not.toBeNull();
      // Within the ring's own width of the orbit, not at its centre, and inside the dots as they stand at that time (I-209: not on one dot).
      expect(Math.abs(norm(place) / perKm - RING_KM)).toBeLessThanOrEqual(SPREAD_KM * 1.5);
      expect(insideMembers(place, layers, t)).toBe(true);
    }
  });

  it.each([
    ["one swarm", [layerOf("one", 2500, 100, 15)]],
    ["two swarms side by side", [layerOf("a", 1500, 90, 8), layerOf("b", 1500, 110, 8)]],
  ] as const)("%s: the name glides with the swarm at a day a frame (I-209)", (_name, layers) => {
    const s = stand(
      layers,
      [
        onGroups(
          "name",
          layers.map((layer) => layer.object.id),
        ),
      ],
      policy,
    );
    let t = START + 30 * DAY;
    let place = labelPositionOf(s.targetsAt(t), "name")!.slice();
    let centre = s.views[0]!.absolute().slice();
    for (let k = 0; k < 300; k += 1) {
      t += DAY;
      const nextPlace = labelPositionOf(s.targetsAt(t), "name")!.slice();
      const nextCentre = s.views[0]!.absolute().slice();
      // The swarm's own motion this frame bounds the name's: a hop to another dot crosses the swarm's width, far more than one frame.
      const swarmStep = Math.hypot(...[0, 1, 2].map((i) => nextCentre[i]! - centre[i]!));
      const nameStep = Math.hypot(...[0, 1, 2].map((i) => nextPlace[i]! - place[i]!));
      expect(nameStep).toBeLessThanOrEqual(1.5 * swarmStep + 10 * perKm);
      expect(insideMembers(nextPlace as unknown as RenderVector, layers, t)).toBe(true);
      place = nextPlace;
      centre = nextCentre;
    }
  });

  it("is not drawn when its groups are out of their bounds, or hidden by a view; one group left keeps it", () => {
    const layers = [layerOf("a", 400, 40, 10), layerOf("b", 400, 200, 10)];
    const s = stand(layers, [onGroups("name", ["a", "b"])], policy);
    const t = START + 5 * DAY;
    expect(labelPositionOf(s.targetsAt(t), "name")).not.toBeNull();
    s.placer.hide(new Set(["a"]));
    const lone = labelPositionOf(s.targetsAt(t), "name")!;
    expect(insideMembers(lone, [layers[1]!], t)).toBe(true);
    s.placer.hide(new Set(["a", "b"]));
    expect(labelPositionOf(s.targetsAt(t), "name")).toBeNull();
    s.placer.hide(undefined);
    expect(labelPositionOf(s.targetsAt(START - 5 * DAY), "name")).toBeNull();
  });
});

describe("the one label layer", () => {
  let host: HTMLElement;
  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      () =>
        ({
          left: 0,
          top: 0,
          right: 100,
          bottom: 10,
          width: 100,
          height: 10,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    );
  });
  afterEach(() => {
    host.remove();
    vi.restoreAllMocks();
  });
  const camera = new PerspectiveCamera(60, 4 / 3, 0.1, 1e6);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  const body = (id: string, priority: number): ExperienceObject => ({
    id,
    label: id,
    color: "#fff",
    labelPriority: priority,
  });
  const labelEl = (id: string) => host.querySelector<HTMLElement>(`[data-label-id="${id}"]`);
  /** Every label sits at the same place, so every pair collides; `selected` is the object selected. */
  function layout(layer: SceneLabelLayer, selected = "", hidden?: ReadonlySet<string>): string[] {
    layer.update(() => [0, 0, 0], camera, 800, 600, new FloatingOrigin(), selected, hidden);
    return [...layer.shownRects.keys()];
  }

  // Every label sits at the same place and a label has three spots (right, left, above), so three bodies fill it and the fourth label shown loses.
  const crowd = [body("f1", 100), body("f2", 100), body("f3", 100), body("g", 80)];

  it("a host label with a priority above a body's wins an overlap, and below it loses", () => {
    for (const [priority, shown] of [
      [150, true],
      [50, false],
    ] as const) {
      const layer = new SceneLabelLayer(
        host,
        crowd,
        [],
        hostLabelSet([onGroups("mark", ["g"], { labelPriority: priority })]),
      );
      const ids = layout(layer);
      expect(ids).toHaveLength(3);
      expect(ids.includes("mark")).toBe(shown);
      layer.dispose();
    }
  });

  it("carries its id and colour, and the selected group lifts its label as selecting the label does", () => {
    const label = onGroups("mark", ["g"], { color: "#abcdef", labelPriority: 10, selects: { groups: ["g"] } });
    const layer = new SceneLabelLayer(host, crowd, [], hostLabelSet([label]));
    expect(layout(layer)).not.toContain("mark");
    expect(labelEl("mark")!.style.getPropertyValue("--label-color")).toBe("#abcdef");
    expect(layout(layer, "g")).toContain("mark");
    expect(layout(layer, "mark")).toContain("mark");
    layer.dispose();
  });

  it("a group a label is anchored on has no entry of its own; it stays in the object list and the labels switch", () => {
    const set = hostLabelSet([onGroups("mark", ["g", "h"])]);
    const objects = [body("planet", 100), body("g", 80), body("h", 80), body("free", 80)];
    const layer = new SceneLabelLayer(host, objects, [], set);
    expect(labelEl("g")).toBeNull();
    expect(labelEl("h")).toBeNull();
    expect(labelEl("free")).not.toBeNull();
    expect(labelEl("mark")).not.toBeNull();
    layer.dispose();
    // Whatever the switch says, a covered group draws no name; its object is still listed, so it stays selectable.
    const bare = new SceneLabelLayer(host, objects, [], hostLabelSet(undefined));
    expect(labelEl("g")).not.toBeNull();
    bare.dispose();
  });

  it("the Labels switch and ?labels= turn a host label off and on", () => {
    const set = hostLabelSet([onGroups("mark", ["g"])]);
    const layer = new SceneLabelLayer(host, [body("g", 80)], [], set);
    expect(layout(layer)).toEqual(["mark"]);
    const ids = labelIdsOf({ objects: [body("g", 80)] }, { labels: [onGroups("mark", ["g"])] });
    expect(ids).toEqual(["g", "mark"]);
    const off = hiddenLabelsFrom("?labels=mark:off", [{ id: "g" }]);
    expect(off.has("mark")).toBe(true);
    expect(layout(layer, "", off)).toEqual([]);
    expect(layout(layer, "", hiddenLabelsFrom("?labels=mark:on", [{ id: "g", showLabel: false }]))).toEqual(["mark"]);
    expect(labelsOn(ids, new Set(ids), false)).toBe(false);
    expect(layout(layer, "", new Set(ids))).toEqual([]);
    expect(labelsOn(ids, new Set(), false)).toBe(true);
    expect(layout(layer, "", new Set())).toEqual(["mark"]);
    layer.dispose();
  });
});
