// @vitest-environment happy-dom
// The frame stage that hides what the current view does not show (O-051 T-219): one hidden set, read for bodies, paths, groups and story markers.
import { describe, expect, it } from "vitest";
import { applyViewVisibility, type FrameContext } from "../src/app/sceneFrame";
import { StoryMarkerLayer } from "../src/app/StoryMarkers";
import { experienceInView, hiddenByView, viewById } from "../src/app/viewHiding";
import type { ViewSettings } from "../src/app/views";

const node = () => ({ visible: true });
const settings: ViewSettings = {
  place: "top-bar", start: "a",
  views: [
    { id: "a", label: "A", camera: { rule: "stay" }, objects: new Set(["earth", "pa"]), events: new Set(["ea"]), panels: new Set(["qa"]) },
    { id: "b", label: "B", camera: { rule: "stay" }, objects: new Set(["earth", "pb"]), events: new Set(["eb"]), panels: new Set(["qb"]) },
  ],
};

describe("applyViewVisibility", () => {
  const make = (hidden: ReadonlySet<string> | undefined) => {
    const body = node(); const path = node(); const other = node(); const tracked = node();
    const ctx = {
      controls: { viewHidden: hidden === undefined ? undefined : { objects: hidden, panels: new Set<string>() } },
      orbit: { lookOut: null },
      bodyRefs: { groups: new Map([["earth", body]]) },
      views: { trackedViews: [{ body: { id: "tr" }, group: tracked }], groupViews: [], sunCentredViews: [{ id: "pa", group: path }], compositionPaths: [{ id: "pb", layer: { source: { body: "x" } }, group: other }], bodySetViews: [], orbitSetViews: [] },
    } as unknown as FrameContext;
    return { ctx, body, path, other, tracked };
  };

  it("hides exactly the named ids' groups and shows the rest, without any rebuild", () => {
    const { ctx, body, path, other, tracked } = make(new Set(["pb", "tr"]));
    applyViewVisibility(ctx);
    expect([body.visible, path.visible, other.visible, tracked.visible]).toEqual([true, true, false, false]);
  });

  it("shows a hidden group again when the set changes, and everything when there is no set", () => {
    const { ctx, other } = make(new Set(["pb"]));
    applyViewVisibility(ctx);
    expect(other.visible).toBe(false);
    (ctx.controls as { viewHidden?: unknown }).viewHidden = undefined;
    applyViewVisibility(ctx);
    expect(other.visible).toBe(true);
  });
});

describe("lines follow the body they belong to", () => {
  const owned = (hidden: ReadonlySet<string>) => {
    const line = node(); const setLines = node(); const own = node();
    const ctx = {
      controls: { viewHidden: { objects: hidden, panels: new Set<string>() } },
      orbit: { lookOut: null },
      bodyRefs: { groups: new Map() },
      views: { trackedViews: [], groupViews: [], sunCentredViews: [], compositionPaths: [{ id: "moon-orbit", layer: { source: { body: "moon" } }, group: line }, { id: "mine", layer: { source: { body: "mine" } }, group: own }], bodySetViews: [], orbitSetViews: [{ id: "set-orbits", layer: { id: "set" }, group: setLines }] },
    } as unknown as FrameContext;
    return { ctx, line, setLines, own };
  };
  it("hides a moon's orbit line and a set's orbit lines with their owner, though no view names them", () => {
    const { ctx, line, setLines, own } = owned(new Set(["moon", "set"]));
    applyViewVisibility(ctx);
    expect([line.visible, setLines.visible, own.visible]).toEqual([false, false, true]);
  });
  it("shows them while the owner shows", () => {
    const { ctx, line, setLines } = owned(new Set(["other"]));
    applyViewVisibility(ctx);
    expect([line.visible, setLines.visible]).toEqual([true, true]);
  });
  it("hides an object that is part of a hidden one (a Sun-orbit line) from the lists, labels and taps", () => {
    const experience = { objects: [{ id: "earth" }, { id: "earth-orbit", partOf: "earth", listed: false }, { id: "mars" }, { id: "mars-orbit", partOf: "mars", listed: false }], events: [] } as never;
    const two: ViewSettings = { place: "top-bar", start: "a", views: [
      { id: "a", label: "A", camera: { rule: "stay" }, objects: new Set(["earth", "earth-orbit", "mars", "mars-orbit"]), events: new Set(), panels: new Set() },
      { id: "b", label: "B", camera: { rule: "stay" }, objects: new Set(["mars", "mars-orbit"]), events: new Set(), panels: new Set() },
    ] };
    expect([...hiddenByView(two, viewById(two, "b"), experience).objects].sort()).toEqual(["earth", "earth-orbit"]);
    expect(experienceInView(experience, two, viewById(two, "b")).objects.map((o) => o.id)).toEqual(["mars", "mars-orbit"]);
    expect(hiddenByView(two, viewById(two, "a"), experience).objects.size).toBe(0);
  });
});

describe("what a view hides", () => {
  it("hides only ids some view shows and this one does not", () => {
    const hidden = hiddenByView(settings, viewById(settings, "a"));
    expect([...hidden.objects]).toEqual(["pb"]);
    expect([...hidden.panels]).toEqual(["qb"]);
  });
  it("leaves a scene without views untouched, as the same experience object", () => {
    const experience = { objects: [], events: [] } as never;
    expect(experienceInView(experience, undefined, undefined)).toBe(experience);
    expect(hiddenByView(undefined, undefined).objects.size).toBe(0);
  });
});

describe("story markers", () => {
  it("draws no marker for a panel the view hides or an object it hides", () => {
    const host = document.createElement("div");
    const layer = new StoryMarkerLayer(host, [
      { panelId: "qa", objectId: "pa", title: "A", timeUtcMs: 1 },
      { panelId: "qb", objectId: "pb", title: "B", timeUtcMs: 2 },
      { panelId: "qs", objectId: "earth", title: "S", timeUtcMs: 3 },
    ], () => undefined);
    const camera = { updateMatrixWorld: () => undefined } as never;
    // Nothing is placed here, so every marker reads hidden; what matters is that hidden ones are never asked for a position.
    const asked: string[] = [];
    layer.update((id) => { asked.push(id); return null; }, camera, 100, 100, {} as never, null, 0, { objects: new Set(["earth"]), panels: new Set(["qb"]) });
    expect(asked).toEqual(["pa"]);
    layer.dispose();
  });
});
