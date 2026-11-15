// I-176 / T-315: every public call that takes a time refuses a fractional or out-of-range value with one SceneError code, `bad-time`, which is still a RangeError.
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon } from "astraeus";
import { toUtcMs } from "../src/api/time";

const T0 = Date.parse("2026-01-02T00:00:00Z");
const DAY = 86_400_000;
const sample = (d: number, positionKm = [400_000, 0, 0]) => ({ time: T0 + d * DAY, positionKm });
const provider = { stateAt: (timeUtcMs: number, center?: string) => ({ body: "p", center: center ?? "earth", timeUtcMs, plane: "EQJ", positionKm: new Float64Array([400_000, 0, 0]), orientation: null }) as never };
const base = () => new Scene().addBody(earth).addBody(moon).addTrajectory({ id: "sampled", center: "earth", samples: [sample(0), sample(1), sample(2)] });
const orbit = { id: "o", semiMajorAxisKm: 7000, eccentricity: 0.01, inclinationDeg: 10, raanDeg: 0, argumentOfPeriapsisDeg: 0 };

// Each call takes its time from `t`; a call with no scene-level time input is not listed.
const calls: readonly (readonly [string, (t: number | string | Date) => unknown])[] = [
  ["stateOf on a body", (t) => base().stateOf("moon", t)],
  ["stateOf on a samples path", (t) => base().stateOf("sampled", t)],
  ["stateOf on a provider path", (t) => base().addTrajectory({ id: "provided", center: "earth", bounds: { start: T0, end: T0 + 2 * DAY }, provider }).stateOf("provided", t)],
  ["addTrajectory sample time", (t) => new Scene().addBody(earth).addTrajectory({ id: "x", center: "earth", samples: [{ time: t, positionKm: [1, 0, 0] }, sample(1)] })],
  ["addTrajectory provider bounds.start", (t) => new Scene().addBody(earth).addTrajectory({ id: "x", center: "earth", bounds: { start: t, end: T0 + DAY }, provider })],
  ["addTrajectory provider bounds.end", (t) => new Scene().addBody(earth).addTrajectory({ id: "x", center: "earth", bounds: { start: T0, end: t }, provider })],
  ["addEvents time", (t) => base().addEvents([{ id: "e", label: "E", time: t }])],
  ["setTimeline start", (t) => base().setTimeline({ start: t, end: T0 + DAY })],
  ["setTimeline end", (t) => base().setTimeline({ start: T0, end: t })],
  ["setTimeline at (none)", (t) => base().setTimeline({ none: true, at: t })],
  ["setTime", (t) => base().setTime(t)],
  ["addGroup referenceTime", (t) => base().addGroup({ id: "g", plane: "ecliptic-j2000", orbits: [orbit], referenceTime: t }).check()],
  ["addGroup orbit time", (t) => base().addGroup({ id: "g", plane: "ecliptic-j2000", orbits: [{ ...orbit, time: t }] }).check()],
  ["addActivity start", (t) => base().addActivity({ id: "a", label: "A", unit: "u", start: t, end: T0 + DAY, samples: [{ time: T0, value: 1 }, { time: T0 + DAY, value: 2 }] })],
];
const values: readonly (readonly [string, number | string | Date])[] = [
  ["a fractional number", T0 + 0.5],
  ["an out-of-range number", 1e16],
  ["a negative out-of-range number", -1e16],
  ["an invalid text", "soon"],
  ["an invalid Date", new Date(Number.NaN)],
];

describe("bad-time on every public time input (I-176)", () => {
  const table = calls.flatMap(([call, run]) => values.map(([kind, value]) => [call, kind, run, value] as const));
  it.each(table)("%s given %s throws SceneError bad-time", (_call, _kind, run, value) => {
    let thrown: unknown;
    try { run(value); } catch (error) { thrown = error; }
    expect(thrown).toBeInstanceOf(SceneError);
    expect((thrown as SceneError).code).toBe("bad-time");
    expect(thrown).toBeInstanceOf(RangeError);
  });
  it.each(values)("the shared converter refuses %s and names it", (_kind, value) => {
    expect(() => toUtcMs(value, "x")).toThrowError(/x/);
  });
  // These calls wrap a bad moment in their own documented code (one cause per code, API-05); a fractional or out-of-range one is refused there too, not accepted.
  it.each([
    ["addBody shownDuring", (t: number) => new Scene().addBody(earth, { shownDuring: { start: t } }), "bad-body"],
    ["addTrajectory shownDuring", (t: number) => new Scene().addBody(earth).addTrajectory({ id: "x", center: "earth", samples: [sample(0), sample(1)], shownDuring: { end: t } }), "bad-trajectory"],
    ["addTrajectory anchor", (t: number) => new Scene().addBody(earth).addTrajectory({ id: "x", center: "earth", samples: [sample(0), sample(1)], anchors: [{ id: "a", time: t }] }), "bad-anchor"],
    ["addStoryPanels at.time", (t: number) => new Scene().addBody(earth).addStoryPanels([{ id: "p", at: { time: t }, title: "T", body: "B", provenance: { sourceType: "illustrative", sources: ["s"], accuracy: "a", notes: "n" } }]), "bad-panels"],
  ] as const)("%s refuses a fractional and an out-of-range time with its own code %s", (_call, run, code) => {
    for (const t of [T0 + 0.5, 1e16]) {
      let thrown: unknown;
      try { run(t); } catch (error) { thrown = error; }
      expect((thrown as SceneError | undefined)?.code, String(t)).toBe(code);
    }
  });
  it("a whole millisecond, an ISO text and a Date are still taken", () => {
    expect(toUtcMs(T0)).toBe(T0);
    expect(toUtcMs("2026-01-02T00:00:00Z")).toBe(T0);
    expect(toUtcMs(new Date(T0))).toBe(T0);
    expect(base().stateOf("sampled", T0 + DAY).timeUtcMs).toBe(T0 + DAY);
  });
});
