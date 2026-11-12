// @vitest-environment happy-dom
// O-071 T-310: `shownDuring` on bodies and paths: input checks, the one shown rule, the frame's hidden set. Made-up configurations only (ARCH-03).
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon, sun } from "astraeus";
import { definitionOf } from "../src/api/definitionOf";
import { applyViewVisibility, hiddenOf, shownUnderView, type FrameContext } from "../src/app/sceneFrame";
import { hiddenWithShownSpans, shownAt } from "../src/app/viewHiding";
import type { ExperienceObject } from "../src/shell/experience";

const T0 = Date.parse("2026-01-01T00:00:00Z");
const DAY = 86_400_000;
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? `${error.code}: ${error.message}` : String(error); } return "no error"; };
const samples = () => Array.from({ length: 5 }, (_, i) => ({ time: T0 + i * 10 * DAY, positionKm: [1.2e8 + i * 1e6, 2e7 * i, 5e6] }));

/** The three calls, each taking one `shownDuring` value, so one table checks what they share. */
const calls = {
  addBody: { code: "bad-body", build: (shownDuring: unknown) => new Scene().addBody(sun).addBody(earth, { shownDuring: shownDuring as never }), id: "earth" },
  addBodyFromElements: {
    code: "bad-body",
    build: (shownDuring: unknown) => new Scene().addBody(sun).addBodyFromElements({ id: "rock", label: "Rock", elements: { semiMajorAxisAu: 2.2, eccentricity: 0.1, inclinationDeg: 5, ascendingNodeDeg: 20, argumentOfPerihelionDeg: 30, meanAnomalyDeg: 10 }, epoch: { jd: 2461000.5, timeScale: "TDB", ttMinusUtcSeconds: 69.184 }, plane: "ecliptic-j2000", source: { name: "Made up", url: "https://example.invalid", solution: "none", accessed: "2026-01-01" }, marker: { color: "#ffaa00", sizePx: 6 }, accuracy: { classification: "approximate", statement: "Made up.", valid: { start: "2025-01-01T00:00:00Z", end: "2030-01-01T00:00:00Z" }, limitations: ["Made up."] } }, { shownDuring: shownDuring as never }),
    id: "rock",
  },
  addTrajectory: { code: "bad-trajectory", build: (shownDuring: unknown) => new Scene().addBody(sun).addTrajectory({ id: "probe", center: "sun", samples: samples(), shownDuring: shownDuring as never }), id: "probe" },
};

describe("shownDuring input, on every call that takes it", () => {
  const faults: [string, unknown, RegExp][] = [
    ["not an object", 5, /shownDuring must be an object/],
    ["null", null, /shownDuring must be an object/],
    ["a list", [], /shownDuring must be an object/],
    ["neither end", {}, /needs a start, an end or both/],
    ["a start that is not a moment", { start: "not a time" }, /shownDuring start: .*not a valid moment/],
    ["an end that is not a moment", { start: T0, end: "nope" }, /shownDuring end: .*not a valid moment/],
    ["an end equal to the start", { start: T0, end: T0 }, /must end after it starts/],
    ["an end before the start", { start: T0 + 1, end: T0 }, /must end after it starts/],
  ];
  for (const [name, call] of Object.entries(calls)) {
    it(`${name} throws its own code naming shownDuring`, () => {
      for (const [, value, message] of faults) {
        const fault = codeOf(() => call.build(value));
        expect(fault).toMatch(new RegExp(`^${call.code}: ${name}\\("${call.id}"\\): `));
        expect(fault).toMatch(message);
      }
    });
    it(`${name} accepts an open start, an open end and both ends, as ISO text, a Date or milliseconds`, () => {
      for (const value of [{ start: T0 }, { end: T0 }, { start: T0, end: T0 + DAY }, { start: new Date(T0), end: "2026-01-03T00:00:00Z" }]) expect(codeOf(() => definitionOf(call.build(value)))).toBe("no error");
    });
    it(`${name} puts the span in ms on the object list, and nothing when not given`, () => {
      const object = (value: unknown) => definitionOf(call.build(value)).experience.objects.find((o) => o.id === call.id)!;
      expect(object({ start: new Date(T0), end: "2026-01-03T00:00:00Z" }).shownDuring).toEqual({ startUtcMs: T0, endUtcMs: T0 + 2 * DAY });
      expect(object({ end: T0 }).shownDuring).toEqual({ endUtcMs: T0 });
      expect(object(undefined).shownDuring).toBeUndefined();
    });
  }
});

describe("shownAt", () => {
  const span = { startUtcMs: 1000, endUtcMs: 2000 };
  it("is start <= t < end, an open end unbounded, no span always", () => {
    const shown = (shownDuring: ExperienceObject["shownDuring"], t: number) => shownAt({ shownDuring }, t);
    expect([999, 1000, 1999, 2000].map((t) => shown(span, t))).toEqual([false, true, true, false]);
    expect([-1e15, 1999, 2000].map((t) => shown({ endUtcMs: 2000 }, t))).toEqual([true, true, false]);
    expect([999, 1000, 1e15].map((t) => shown({ startUtcMs: 1000 }, t))).toEqual([false, true, true]);
    expect(shown(undefined, 5)).toBe(true);
  });
  it("never shows both and never hides both of an object that ends at T and one that starts at T", () => {
    const T = 5000;
    for (let t = T - 3; t <= T + 3; t++) expect(shownAt({ shownDuring: { endUtcMs: T } }, t)).not.toBe(shownAt({ shownDuring: { startUtcMs: T } }, t));
  });
});

const obj = (id: string, extra: Partial<ExperienceObject> = {}): ExperienceObject => ({ id, label: id, ...extra });
const hiddenIds = (view: ReturnType<typeof hiddenWithShownSpans>) => [...(view?.objects ?? [])].sort();

describe("hiddenWithShownSpans", () => {
  const objects = [obj("a", { shownDuring: { endUtcMs: 100 } }), obj("b", { shownDuring: { startUtcMs: 100 } }), obj("a-orbit", { partOf: "a", listed: false }), obj("c")];
  it("adds every object not shown at the time, and what is part of one", () => {
    expect(hiddenIds(hiddenWithShownSpans(undefined, objects, 50))).toEqual(["b"]);
    expect(hiddenIds(hiddenWithShownSpans(undefined, objects, 100))).toEqual(["a", "a-orbit"]);
  });
  it("combines with the view's hidden set: hidden by either", () => {
    const view = { objects: new Set(["c"]), panels: new Set(["p"]) };
    const both = hiddenWithShownSpans(view, objects, 100)!;
    expect(hiddenIds(both)).toEqual(["a", "a-orbit", "c"]);
    expect([...both.panels]).toEqual(["p"]);
    expect([...view.objects]).toEqual(["c"]);
  });
  it("returns the same object when nothing is hidden by time, with spans or without, and with no time", () => {
    const view = { objects: new Set(["c"]), panels: new Set<string>() };
    expect(hiddenWithShownSpans(view, [obj("a"), obj("c")], 100)).toBe(view);
    expect(hiddenWithShownSpans(view, [obj("a", { shownDuring: { startUtcMs: 0 } })], 100)).toBe(view);
    expect(hiddenWithShownSpans(view, objects, undefined)).toBe(view);
    expect(hiddenWithShownSpans(undefined, objects, 50)).not.toBeUndefined();
    expect(hiddenWithShownSpans(undefined, [obj("a")], 50)).toBeUndefined();
  });
});

describe("the frame outside a span", () => {
  const scene = () => new Scene().addBody(sun).addBody(earth).addBody(moon, { orbit: true, shownDuring: { start: T0 + 10 * DAY, end: T0 + 20 * DAY } }).addTrajectory({ id: "probe", center: "sun", samples: samples(), shownDuring: { end: T0 + 15 * DAY } }).setTime(T0);
  const node = () => ({ visible: true });
  const make = () => {
    const objects = definitionOf(scene()).experience.objects;
    const [moonGroup, earthGroup, probe, moonLine] = [node(), node(), node(), node()];
    const ctx = {
      controls: { viewHidden: { objects: new Set(["unrelated"]), panels: new Set<string>() }, labelObjects: objects, hiddenLabels: new Set<string>() },
      orbit: { lookOut: null },
      bodyRefs: { groups: new Map([["moon", moonGroup], ["earth", earthGroup]]) },
      views: { trackedViews: [{ body: { id: "probe" }, group: probe }], groupViews: [], sunCentredViews: [], compositionPaths: [{ id: "moon-orbit", layer: { source: { body: "moon" } }, group: moonLine }], bodySetViews: [], orbitSetViews: [] },
    } as unknown as FrameContext;
    return { ctx, moonGroup, earthGroup, probe, moonLine };
  };
  const visible = (m: ReturnType<typeof make>) => [m.earthGroup.visible, m.moonGroup.visible, m.moonLine.visible, m.probe.visible];

  it("draws the marker and line only while the span holds, and the label and pick list follow", () => {
    const m = make();
    const cases: [number, boolean[], string[]][] = [
      [T0, [true, false, false, true], ["earth", "probe"]],
      [T0 + 10 * DAY, [true, true, true, true], ["earth", "moon", "probe"]],
      [T0 + 15 * DAY, [true, true, true, false], ["earth", "moon"]],
      [T0 + 20 * DAY, [true, false, false, false], ["earth"]],
    ];
    for (const [t, drawn, listed] of cases) {
      applyViewVisibility(m.ctx, t);
      expect(visible(m)).toEqual(drawn);
      const shown = shownUnderView(m.ctx, t);
      expect(shown.objects.map(({ id }) => id).filter((id) => ["earth", "moon", "probe"].includes(id)).sort()).toEqual(listed);
      expect([...(shown.hiddenLabels ?? [])].includes("moon")).toBe(!listed.includes("moon"));
      expect(hiddenOf(m.ctx, t)!.objects.has("unrelated")).toBe(true);
    }
  });

  it("changes nothing about State: stateOf is the same with and without the span", () => {
    const plain = new Scene().addBody(sun).addBody(earth).addTrajectory({ id: "probe", center: "sun", samples: samples() }).setTime(T0);
    const spanned = scene();
    for (const t of [T0, T0 + 12 * DAY, T0 + 15 * DAY, T0 + 30 * DAY]) {
      expect(spanned.stateOf("probe", Math.min(t, T0 + 40 * DAY))).toEqual(plain.stateOf("probe", Math.min(t, T0 + 40 * DAY)));
    }
  });
});
