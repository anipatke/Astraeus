// O-057 T-278: the verb grammar in Design, "Public API shape", called twice on made-up scenes (ARCH-03): `add*` appends and a repeated id throws `duplicate-id`; `set*` replaces the whole setting.
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon } from "astraeus";
import { definitionOf } from "../src/api/definitionOf";

const T0 = Date.UTC(2026, 2, 1);
const MIN = 60_000;
const samples = [0, 1, 2].map((i) => ({ time: T0 + i * 10 * MIN, positionKm: [1e5 + i * 1e3, 0, 0] }));
const base = () => new Scene().addBody(earth).addTrajectory({ id: "probe", samples });
const made = { sourceType: "illustrative", sources: ["Made up"], accuracy: "None claimed.", notes: "Made up." } as const;
const panel = (id: string) => ({ id, at: { time: T0 + 5 * MIN }, title: id, body: ["A made-up line."], provenance: made });
const activity = (id: string) => ({ id, label: id, unit: "per hour", start: T0, end: T0 + 20 * MIN, samples: [{ time: T0, value: 1 }, { time: T0 + 20 * MIN, value: 2 }] });
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return "no error"; };

/** One `add*` call: `add` makes the call with an id, `ids` reads what the scene holds. */
interface AddRow { readonly name: string; readonly add: (scene: Scene, id: string) => Scene; readonly ids: (scene: Scene) => readonly string[] }
const ADDS: readonly AddRow[] = [
  { name: "addStoryPanels", add: (scene, id) => scene.addStoryPanels([panel(id)]), ids: (scene) => scene.panels.map((item) => item.id) },
  { name: "addEvents", add: (scene, id) => scene.addEvents([{ id, label: id, time: T0 }]), ids: (scene) => scene.events.map((item) => item.id) },
  { name: "addTrajectory", add: (scene, id) => scene.addTrajectory({ id, samples }), ids: (scene) => scene.paths.map((item) => item.id).filter((id) => id !== "probe") },
  { name: "addSkyFigures", add: (scene, id) => scene.addSkyFigures([{ id, label: id, segments: [[{ raDeg: 1, decDeg: 2 }, { raDeg: 3, decDeg: 4 }]] }]), ids: (scene) => scene.skyFigures.map((item) => item.id) },
  { name: "addActivity", add: (scene, id) => scene.addActivity(activity(id)), ids: (scene) => scene.activities.map((item) => item.id) },
];

describe("add* appends", () => {
  it.each(ADDS)("$name: a second call keeps the first", ({ add, ids }) => {
    expect(ids(add(add(base(), "one"), "two"))).toEqual(["one", "two"]);
  });
  it.each(ADDS)("$name: a repeated id throws duplicate-id and keeps what was there", ({ add, ids }) => {
    const scene = add(base(), "one");
    expect(codeOf(() => add(scene, "one"))).toBe("duplicate-id");
    expect(ids(scene)).toEqual(["one"]);
  });
  it("addEvents: an id repeated inside one call throws duplicate-id and adds nothing from that call", () => {
    const scene = base().addEvents([{ id: "one", label: "One", time: T0 }]);
    expect(codeOf(() => scene.addEvents([{ id: "two", label: "Two", time: T0 }, { id: "two", label: "Again", time: T0 }]))).toBe("duplicate-id");
    expect(scene.events.map((item) => item.id)).toEqual(["one"]);
  });
  it("addBody: a repeated body throws duplicate-id", () => { expect(codeOf(() => new Scene().addBody(moon).addBody(moon))).toBe("duplicate-id"); });
});

describe("set* replaces the whole setting", () => {
  it("setStoryPanelPlayback: the second call's left-out field returns to its default, not the first call's value", () => {
    const { autoOpen, pauseSeconds } = definitionOf(base().addStoryPanels([panel("p")]).setStoryPanelPlayback({ pauseSeconds: 1, autoOpen: false }).setStoryPanelPlayback({ pauseSeconds: 2 })).experience.storyPanels!;
    expect({ pauseSeconds, autoOpen }).toEqual({ pauseSeconds: 2, autoOpen: true });
  });
  it("setTimeline: the second call's left-out rates return to the default", () => {
    const experience = definitionOf(base().setTimeline({ start: T0, end: T0 + 20 * MIN, rates: [5] }).setTimeline({ start: T0, end: T0 + 20 * MIN })).experience;
    expect(experience.rates).toEqual([60, 3_600, 86_400]);
  });
});
