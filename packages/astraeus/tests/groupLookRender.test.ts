// @vitest-environment happy-dom
// O-078 T-324: what `setGroupLook` changes in the drawn scene. The frame stage `applyGroupLooks` gives each points layer its live look; proven on made-up
// two-body groups (ARCH-03) on both ways of drawing: the blend of exact fills, and the shader placing the dots (KeplerPoints).
import { describe, expect, it } from "vitest";
import { Color, type BufferGeometry, type Points, type PointsMaterial } from "three";
import type { GroupLayer } from "../src/app/experienceDefinition";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { DEFAULT_POINT_SIZE_PX, PointsView, type GroupDotLook } from "../src/app/PointsView";
import { SceneLabelLayer } from "../src/app/SceneLabels";
import { applyGroupLooks } from "../src/app/sceneFrame";
import { createOrbitGroup } from "../src/core/orbitGroup";
import { createProvenance } from "../src/core/provenance";
import { trueScale, type ScalePolicy } from "../src/presentation/scalePolicy";
import { createOrbTwoBodyAdapter } from "../src/core/twoBodyAdapter";
import { checkedGroupLook } from "../src/api/groupLookInput";
import { placementAbout } from "./scenePlacement";

const DAY = 86_400_000;
const START = Date.UTC(2030, 0, 1);
const BOUNDS = { startUtcMs: START, endUtcMs: START + 400 * DAY };
const provenance = createProvenance({
  sourceType: "illustrative",
  sources: ["Made up inside the group look tests"],
  accuracy: "None claimed.",
  notes: "Fixture.",
});
const placement = placementAbout("sun");
const origin = new FloatingOrigin();
/** Scales exactly but does not say so: the group keeps the fills-plus-blend path (as in pointsKepler.test.ts). */
const unlabelled: ScalePolicy = {
  id: "true-scale",
  mapPosition: (p) => trueScale.mapPosition(p),
  mapRadius: (r) => trueScale.mapRadius(r),
};

function belt(id: string, count: number, color = "#7fe3c4", pointSizePx?: number): GroupLayer {
  const group = createOrbitGroup(
    {
      id,
      count,
      center: "sun",
      plane: "ecliptic-j2000",
      epochUtcMs: START + 100 * DAY,
      provenance,
      seed: 11,
      bounds: BOUNDS,
      base: {
        semiMajorAxisKm: 4.2e8,
        eccentricity: 0.15,
        inclinationDeg: 15,
        raanDeg: 100,
        argumentOfPeriapsisDeg: 200,
        trueAnomalyDeg: 90,
      },
      spread: {
        semiMajorAxisKm: 1e8,
        eccentricity: 0.1,
        inclinationDeg: 10,
        raanDeg: 180,
        argumentOfPeriapsisDeg: 180,
        trueAnomalyDeg: 180,
      },
    },
    createOrbTwoBodyAdapter(),
  );
  return {
    group,
    color,
    ...(pointSizePx === undefined ? {} : { pointSizePx }),
    object: { id, label: id, description: "Made up.", knownLimitations: ["Made up."] },
  };
}

/** The view's drawn parts: the blend dots and, for a big two-body group, the shader-placed dots. */
const partsOf = (view: PointsView) => view.group.children as Points<BufferGeometry, PointsMaterial>[];
const lookOf = (points: Points<BufferGeometry, PointsMaterial>) => ({
  color: `#${points.material.color.getHexString()}`,
  size: points.material.size,
});
const show = (view: PointsView, t: number, policy: ScalePolicy) => {
  view.sync(t, placement, policy);
  view.place(origin);
};
const positions = (view: PointsView, count: number) =>
  Array.from({ length: count }, (_, i) => i)
    .filter((i) => i % 97 === 0)
    .map((i) => view.memberLocalPosition(i));

/** The parts of a frame context the stage reads. */
function frame(views: PointsView[], looks: Map<string, GroupDotLook>, labels: SceneLabelLayer | null = null) {
  return {
    controls: { groupLooks: looks },
    views: { groupViews: views },
    state: { wakes: 0 },
    layers: { sceneLabels: { current: labels } },
  } as unknown as Parameters<typeof applyGroupLooks>[0] & { state: { wakes: number } };
}

describe("applyGroupLooks gives a group's dots the host's colour and size", () => {
  it("without any setGroupLook a group is drawn exactly as before (the layer's colour and size, or the default size)", () => {
    const own = new PointsView(belt("own", 2500, "#ff8800", 3));
    const plain = new PointsView(belt("plain", 50));
    for (const part of partsOf(own)) expect(lookOf(part)).toEqual({ color: "#ff8800", size: 3 });
    expect(partsOf(own)).toHaveLength(2); // blend and shader-placed
    for (const part of partsOf(plain)) expect(lookOf(part)).toEqual({ color: "#7fe3c4", size: DEFAULT_POINT_SIZE_PX });
    const ctx = frame([own, plain], new Map());
    applyGroupLooks(ctx);
    expect(ctx.state.wakes).toBe(0);
    for (const part of partsOf(own)) expect(lookOf(part)).toEqual({ color: "#ff8800", size: 3 });
  });

  it.each([
    ["the shader places the dots (GPU path)", trueScale, true],
    ["the blend of exact fills (CPU path)", unlabelled, false],
  ])(
    "on %s: both materials carry the look on the next frame; positions, fills and geometry are untouched",
    (_name, policy, gpu) => {
      const count = 2500;
      const view = new PointsView(belt("g", count));
      const t = START + 120 * DAY;
      show(view, t, policy);
      expect(view.placedByShader).toBe(gpu);
      const before = positions(view, count);
      const fills = view.fillCount;
      const parts = partsOf(view);
      const geometries = parts.map((part) => part.geometry);
      const materials = parts.map((part) => part.material);
      const versions = materials.map((material) => material.version);
      const looks = new Map([["g", { color: "#204060", dotSizePx: 1.25 }]]);
      const ctx = frame([view], looks);
      applyGroupLooks(ctx);
      show(view, t, policy); // the next frame, at the same (paused) time
      for (const part of partsOf(view)) expect(lookOf(part)).toEqual({ color: "#204060", size: 1.25 });
      expect(ctx.state.wakes).toBe(1); // a paused viewer's draw rule wakes for it
      expect(positions(view, count)).toEqual(before);
      expect(view.fillCount).toBe(fills);
      expect(partsOf(view).map((part) => part.geometry)).toEqual(geometries);
      expect(partsOf(view).every((part, i) => part.geometry === geometries[i] && part.material === materials[i])).toBe(
        true,
      );
      // Colour and size are uniforms: the material's program is not rebuilt.
      expect(partsOf(view).map((part) => part.material.version)).toEqual(versions);
      applyGroupLooks(ctx);
      expect(ctx.state.wakes).toBe(1); // an unchanged look does nothing
    },
  );

  it("a group that switches way of drawing (a scale change) keeps the look", () => {
    const view = new PointsView(belt("g", 2500));
    const t = START + 120 * DAY;
    show(view, t, trueScale);
    applyGroupLooks(frame([view], new Map([["g", { color: "#abcdef", dotSizePx: 5 }]])));
    show(view, t, unlabelled);
    expect(view.placedByShader).toBe(false);
    for (const part of partsOf(view)) expect(lookOf(part)).toEqual({ color: "#abcdef", size: 5 });
    show(view, t, trueScale);
    expect(view.placedByShader).toBe(true);
    expect(view.look).toEqual({ color: "#abcdef", dotSizePx: 5 });
  });

  it("gives the group's scene label the colour, and leaves other labels alone", () => {
    const host = document.createElement("div");
    const labels = new SceneLabelLayer(host, [
      { id: "g", label: "Group", color: "#7fe3c4" },
      { id: "earth", label: "Earth" },
    ]);
    const label = (id: string) => host.querySelector<HTMLElement>(`[data-label-id="${id}"]`)!;
    expect(label("g").style.getPropertyValue("--label-color")).toBe("#7fe3c4");
    applyGroupLooks(
      frame([new PointsView(belt("g", 50))], new Map([["g", { color: "#303030", dotSizePx: 2 }]]), labels),
    );
    expect(label("g").style.getPropertyValue("--label-color")).toBe("#303030");
    expect(label("earth").style.getPropertyValue("--label-color")).toBe("");
  });
});

describe("scale: 25 groups, about 126,000 dots", () => {
  it("25 setGroupLook-sized changes take a fraction of a frame (measured, not a threshold)", () => {
    const counts = Array.from({ length: 25 }, () => 5040);
    const views = counts.map((count, i) => new PointsView(belt(`g${i}`, count, "#9de3a8", 2)));
    const total = counts.reduce((sum, count) => sum + count, 0);
    const t = START + 120 * DAY;
    for (const view of views) show(view, t, trueScale);
    const looks = new Map<string, GroupDotLook>();
    const ids = views.map((view) => view.id);
    const dim = (keep: ReadonlySet<string>) => {
      for (const view of views) {
        // What the handle does per call: check the input against the look in force, then record it.
        const current = looks.get(view.id) ?? view.look;
        looks.set(
          view.id,
          checkedGroupLook(
            view.id,
            keep.has(view.id) ? { color: "#ffd27a", dotSizePx: 2.5 } : { color: "#3a4a55", dotSizePx: 1.5 },
            current,
            ids,
          ),
        );
      }
      applyGroupLooks(frame(views, looks));
    };
    dim(new Set(["g3", "g4"])); // warm up
    const runs: number[] = [];
    for (let run = 0; run < 20; run += 1) {
      const keep = new Set([`g${run % 25}`, `g${(run + 1) % 25}`]);
      const started = performance.now();
      dim(keep);
      runs.push(performance.now() - started);
    }
    runs.sort((a, b) => a - b);
    const median = runs[Math.floor(runs.length / 2)];
    console.log(
      `[O-078 scale] 25 groups, ${total} dots: 25 checked looks + one applyGroupLooks frame stage, median ${median.toFixed(3)} ms, worst ${runs.at(-1)!.toFixed(3)} ms over ${runs.length} runs (Node ${process.version})`,
    );
    expect(total).toBe(126_000);
    expect(
      views.every((view) =>
        partsOf(view).every((part) => part.material.size === (view.id === "g19" || view.id === "g20" ? 2.5 : 1.5)),
      ),
    ).toBe(true);
  });
});

// Keep the colour parser honest: three reads the hex the handle accepts (short and long) as the same colour.
it("three reads #abc and #aabbcc as one colour", () => {
  expect(new Color("#abc").getHexString()).toBe("aabbcc");
});
