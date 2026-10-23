import { describe, expect, it } from "vitest";
import type { TrackedBody } from "../src/app/mission";
import type { PathView } from "../src/app/PathView";
import type { PointsView } from "../src/app/PointsView";
import type { BodySetView } from "../src/app/BodySetView";
import type { TrackedBodyView } from "../src/app/TrackedBodyView";
import { trueScale } from "../src/core/scalePolicy";
import { bodySetMemberAbsolute, canFocus, focusAbsoluteOf, framedViewOf, labelPositionOf, type SceneTargets } from "../src/app/sceneTargets";
import type { RenderVector } from "../src/app/renderCoordinates";

// Made-up views: the module only asks them where they are (ARCH-01).
const group = { id: "group", drawn: true, absolute: () => [1, 2, 3] } as unknown as PointsView;
const hiddenGroup = { id: "hidden", drawn: false, absolute: () => [9, 9, 9] } as unknown as PointsView;
const path = { id: "path", absolute: () => [4, 5, 6], labelAnchor: () => [7, 8, 9] } as unknown as PathView;
const tracked = { body: { id: "craft", trajectory: { bounds: { startUtcMs: 0, endUtcMs: 100 }, stateAt: () => ({}) } } as unknown as TrackedBody, absolute: () => [0, 1, 0] } as unknown as TrackedBodyView;
const set = { memberAbsolute: (id: string) => (id === "member" ? ([2, 2, 2] as RenderVector) : null) } as unknown as BodySetView;

function targets(over: Partial<SceneTargets> = {}): SceneTargets {
  const placed = new Map<string, RenderVector>([["alpha", [10, 0, 0]]]);
  return {
    bodyIdFor: (id) => (id === "alpha" || id === "shell-alpha" ? "alpha" : null),
    placed: placed as SceneTargets["placed"],
    absoluteOf: () => [10, 0, 0],
    groupViews: [group, hiddenGroup], sunCentredViews: [path], trackedViews: [tracked], bodySetViews: [set],
    timeUtcMs: 50, policy: trueScale, placement: {} as SceneTargets["placement"],
    ...over,
  };
}

describe("focusAbsoluteOf", () => {
  it("answers a body, a group, a path, a body-set member and a tracked body in that order", () => {
    const t = targets();
    expect(focusAbsoluteOf(t, "shell-alpha")).toEqual([10, 0, 0]);
    expect(focusAbsoluteOf(t, "group")).toEqual([1, 2, 3]);
    expect(focusAbsoluteOf(t, "path")).toEqual([4, 5, 6]);
    expect(focusAbsoluteOf(t, "member")).toEqual([2, 2, 2]);
    expect(focusAbsoluteOf(t, "craft")).toEqual([0, 1, 0]);
  });
  it("throws for an id nothing answers to, and canFocus reports it", () => {
    expect(() => focusAbsoluteOf(targets(), "nowhere")).toThrow(RangeError);
    expect(canFocus(targets(), "nowhere")).toBe(false);
    expect(canFocus(targets(), "path")).toBe(true);
  });
});

describe("framedViewOf", () => {
  it("finds a group or a path, and nothing for a body", () => {
    expect(framedViewOf(targets(), "group")).toBe(group);
    expect(framedViewOf(targets(), "path")).toBe(path);
    expect(framedViewOf(targets(), "alpha")).toBeUndefined();
  });
});

describe("labelPositionOf", () => {
  it("anchors a body where it was placed, or null when it was not placed", () => {
    expect(labelPositionOf(targets(), "alpha")).toEqual([10, 0, 0]);
    expect(labelPositionOf(targets({ bodyIdFor: () => "beta" }), "beta")).toBeNull();
  });
  it("anchors a drawn group, hides an undrawn one, and anchors a path at its label anchor", () => {
    expect(labelPositionOf(targets(), "group")).toEqual([1, 2, 3]);
    expect(labelPositionOf(targets(), "hidden")).toBeNull();
    expect(labelPositionOf(targets(), "path")).toEqual([7, 8, 9]);
  });
  it("shows a tracked body only inside its trajectory bounds", () => {
    expect(labelPositionOf(targets({ timeUtcMs: 50 }), "craft")).toEqual([0, 1, 0]);
    expect(labelPositionOf(targets({ timeUtcMs: 500 }), "craft")).toBeNull();
    expect(labelPositionOf(targets(), "unknown")).toBeNull();
  });
});

describe("bodySetMemberAbsolute", () => {
  it("finds a member in any set, and null when none holds it or there are no sets", () => {
    expect(bodySetMemberAbsolute({ bodySetViews: [set] }, "member")).toEqual([2, 2, 2]);
    expect(bodySetMemberAbsolute({ bodySetViews: [set] }, "other")).toBeNull();
    expect(bodySetMemberAbsolute({}, "member")).toBeNull();
  });
});
