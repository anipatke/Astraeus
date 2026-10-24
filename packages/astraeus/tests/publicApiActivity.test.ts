// The activity, loop and view calls of the public API (O-042 T-175), proved on a made-up burst of activity (ARCH-03): a rate curve with a peak and sources on the timeline,
// a group's live rate bar (at, before and after the peak and outside the window), looping, the ecliptic up and the camera's reach.
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon, type ActivityInput, type GroupInput } from "astraeus";
import { viewUpVector } from "../src/app/viewUp";
import { cameraReachOf } from "../src/app/experienceDefinition";
import type { RateMetric } from "../src/shell/metrics";

const DAY = 86_400_000;
const T0 = Date.parse("2026-08-01T00:00:00Z");
const day = (n: number) => T0 + n * DAY;
const orbit = (k: number) => ({ id: `rock-${k}`, semiMajorAxisKm: 80_000 + 5_000 * k, eccentricity: 0.1, inclinationDeg: 5, raanDeg: 40, argumentOfPeriapsisDeg: 70 });
const source = { sourceType: "illustrative" as const, sources: ["A made-up curve"], accuracy: "None claimed.", notes: "Invented." };
const burst = (extra: Partial<ActivityInput> = {}): ActivityInput => ({
  id: "burst", label: "Burst", unit: "per hour", start: day(0), end: day(20), peak: day(10),
  samples: [{ time: day(0), value: 2 }, { time: day(10), value: 100 }, { time: day(20), value: 4 }],
  provenance: [{ start: day(0), end: day(8), provenance: source }, { start: day(12), end: day(20), provenance: { ...source, sources: ["Another made-up curve"] } }],
  ...extra,
});
const group = (extra: Partial<GroupInput> = {}): GroupInput => ({ id: "ring", orbits: [orbit(0), orbit(1)], readouts: [{ kind: "rate" }], ...extra });
const base = () => new Scene().addBody(earth).addBody(moon).setTime(day(5));
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return "no error"; };
const rateAtTime = (scene: Scene, time: number): RateMetric => {
  const metrics = scene.toDefinition().createMetrics({ resolver: undefined as never } as never);
  return metrics("ring", time)[0] as RateMetric;
};

describe("addActivity", () => {
  it("puts the curve on the timeline as a window with its peak, unit and sources, and spans the timeline", () => {
    const definition = base().addActivity(burst()).toDefinition();
    const [window] = definition.experience.windows!;
    expect(window).toMatchObject({ id: "burst", label: "Burst", peakUtcMs: day(10), startUtcMs: day(0), endUtcMs: day(20) });
    expect(window!.rate).toMatchObject({ unit: "per hour" });
    expect(window!.provenance!.map((span) => span.provenance.sources[0])).toEqual(["A made-up curve", "Another made-up curve"]);
    expect(definition.experience.window).toEqual({ startUtcMs: day(0), endUtcMs: day(20) });
  });
  it("leaves the timeline span to setTimeline when given", () => {
    const definition = base().addActivity(burst()).setTimeline({ start: day(-5), end: day(30) }).toDefinition();
    expect(definition.experience.window).toEqual({ startUtcMs: day(-5), endUtcMs: day(30) });
  });
  it("has no windows unless added", () => { expect(base().toDefinition().experience.windows).toBeUndefined(); });
  it.each([
    ["a repeated id", () => base().addActivity(burst()).addActivity(burst()), "bad-activity"],
    ["no id", () => base().addActivity(burst({ id: "" })), "bad-activity"],
    ["no unit", () => base().addActivity(burst({ unit: "" })), "bad-activity"],
    ["one sample", () => base().addActivity(burst({ samples: [{ time: day(0), value: 1 }] })), "bad-activity"],
    ["a negative rate", () => base().addActivity(burst({ samples: [{ time: day(0), value: -1 }, { time: day(1), value: 1 }] })), "bad-activity"],
    ["samples out of order", () => base().addActivity(burst({ samples: [{ time: day(2), value: 1 }, { time: day(1), value: 1 }] })), "bad-activity"],
    ["a sample outside the activity", () => base().addActivity(burst({ samples: [{ time: day(0), value: 1 }, { time: day(30), value: 1 }] })), "bad-activity"],
    ["a peak outside the activity", () => base().addActivity(burst({ peak: day(40) })), "bad-activity"],
    ["an end before the start", () => base().addActivity(burst({ start: day(20), end: day(0) })), "bad-activity"],
    ["overlapping sources", () => base().addActivity(burst({ provenance: [{ start: day(0), end: day(8), provenance: source }, { start: day(6), end: day(9), provenance: source }] })), "bad-activity"],
    ["a source with no provenance", () => base().addActivity(burst({ provenance: [{ start: day(0), end: day(8) } as never] })), "bad-activity"],
    ["a time that is not a time", () => base().addActivity(burst({ peak: "soon" })), "bad-time"],
  ])("refuses %s", (_name, call, code) => { expect(codeOf(call)).toBe(code); });
});

describe("a group's rate readout", () => {
  const scene = () => base().addActivity(burst()).addGroup(group());
  it("reads the curve at the peak, before and after it, against the peak", () => {
    const peak = rateAtTime(scene(), day(10));
    expect(peak).toMatchObject({ kind: "rate", value: 100, unit: "per hour", peak: { label: "Peak", value: 100 }, context: "Burst" });
    expect(rateAtTime(scene(), day(5)).value).toBeCloseTo(51, 6);
    expect(rateAtTime(scene(), day(15)).value).toBeCloseTo(52, 6);
    expect(rateAtTime(scene(), day(0)).value).toBe(2);
  });
  it("is unavailable outside the activity", () => {
    const outside = rateAtTime(scene(), day(25));
    expect(outside.value).toBeNull();
    expect(outside.unavailable).toBe("outside the activity");
    expect(rateAtTime(scene(), day(-1)).value).toBeNull();
  });
  it("names the activity it reads and the peak's name", () => {
    const s = base().addActivity(burst()).addActivity(burst({ id: "other", label: "Other", peakLabel: "Published peak", samples: [{ time: day(0), value: 1 }, { time: day(20), value: 3 }], peak: day(20) })).addGroup(group({ readouts: [{ kind: "rate", activity: "other" }] }));
    expect(rateAtTime(s, day(10))).toMatchObject({ value: 2, context: "Other", peak: { label: "Published peak", value: 3 } });
  });
  it("gives a group with no readouts no bars", () => {
    const s = base().addActivity(burst()).addGroup(group({ readouts: undefined }));
    expect(s.toDefinition().createMetrics({ resolver: undefined as never } as never)("ring", day(10))).toEqual([]);
  });
  it.each([
    ["a readout kind that is not one", () => base().addGroup(group({ readouts: [{ kind: "speed" } as never] })), "bad-readout"],
    ["readouts that are not a list", () => base().addGroup(group({ readouts: {} as never })), "bad-readout"],
    ["a rate with no activity in the scene", () => base().addGroup(group()).toDefinition(), "bad-readout"],
    ["a rate naming an activity not in the scene", () => base().addActivity(burst()).addGroup(group({ readouts: [{ kind: "rate", activity: "ghost" }] })).toDefinition(), "bad-readout"],
  ])("refuses %s", (_name, call, code) => { expect(codeOf(call)).toBe(code); });
});

describe("setTimeline loop", () => {
  it("loops only when asked", () => {
    expect(base().setTimeline({ start: day(0), end: day(20), loop: true }).toDefinition().loop).toBe(true);
    expect(base().setTimeline({ start: day(0), end: day(20) }).toDefinition().loop).toBeUndefined();
    expect(base().setTimeline({ start: day(0), end: day(20), loop: false }).toDefinition().loop).toBeUndefined();
  });
  it("refuses a loop that is not true or false", () => { expect(codeOf(() => base().setTimeline({ start: day(0), end: day(20), loop: "yes" as never }))).toBe("bad-timeline"); });
});

describe("camera up and reach", () => {
  it("opens about the ecliptic pole when asked, on lookAt and follow, and keeps the equatorial up otherwise", () => {
    expect(base().setTime(day(0)).camera.lookAt("moon", { up: "ecliptic" })).toBeDefined();
    const looking = base();
    looking.camera.lookAt("moon", { up: "ecliptic" });
    expect(looking.toDefinition().viewUp).toBe("ecliptic");
    expect(viewUpVector("ecliptic")).not.toEqual(viewUpVector(looking.toDefinition().viewUp === "ecliptic" ? "equatorial" : "ecliptic"));
    const following = base();
    following.camera.follow("moon", { up: "equatorial" });
    expect(following.toDefinition().viewUp).toBe("equatorial");
    const plain = base();
    plain.camera.lookAt("moon");
    expect(plain.toDefinition().viewUp).toBeUndefined();
  });
  it("refuses an up that is not one", () => { expect(codeOf(() => base().camera.lookAt("moon", { up: "north" as never }))).toBe("bad-camera"); });
  it("sets how far the viewer can zoom out, with the far plane beyond it, and nothing otherwise", () => {
    const scene = base();
    scene.camera.setReach(50_000);
    expect(cameraReachOf(scene.toDefinition())).toEqual({ maxFocusDistance: 50_000, far: 125_000 });
    expect(base().toDefinition().camera).toBeUndefined();
  });
  it("lets labels reach as far as the camera can zoom out", () => {
    const labelReach = (scene: Scene) => scene.toDefinition().experience.objects.find((object) => object.id === "moon")!.labelMaxDistance;
    expect(labelReach(base())).toBe(500);
    const far = base();
    far.camera.setReach(50_000);
    expect(labelReach(far)).toBe(50_000);
    const near = base();
    near.camera.setReach(100);
    expect(labelReach(near)).toBe(500);
  });
  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, "far"])("refuses a reach of %s", (value) => { expect(codeOf(() => base().camera.setReach(value as never))).toBe("bad-camera"); });
});
