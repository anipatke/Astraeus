// @vitest-environment happy-dom
// Story steps through the public API (O-066 T-300), on a made-up probe (ARCH-03): `at` left out makes a step, steps keep the order added across calls, `scene.panels` reads them,
// and the handle's `panel`, `setPanel` and `onPanel` check, report and keep call order. The two embedding paths share one handle builder (`viewerHandleOf`), as twoViewers.test.ts runs.
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon, type StoryPanelInput } from "astraeus";
import { definitionOf } from "../src/api/definitionOf";
import { experienceInView, viewById } from "../src/app/viewHiding";
import { ViewerLink } from "../src/api/viewerLink";
import { viewerHandleOf } from "../src/api/viewerHandle";
import type { ViewerControl, ViewerState } from "../src/app/viewerPort";
import { FAKE_PRESENTATION, FAKE_PRESENTATION_CONTROL } from "./helpers/viewerPresentation";

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const samples = [0, 1, 2, 3].map((i) => ({ time: T0 + i * 10 * MIN, positionKm: [10_000 + i * 1_000, 0, 0], velocityKmS: [1, 0, 0] }));
const base = () => new Scene().addBody(earth).addBody(moon).addTrajectory({ id: "probe", label: "Probe", samples });
const made = { sourceType: "illustrative", sources: ["Made up"], accuracy: "None claimed.", notes: "Made up." } as const;
const entry = (id: string, at?: StoryPanelInput["at"], extra: Partial<StoryPanelInput> = {}): StoryPanelInput => ({ id, ...(at === undefined ? {} : { at }), title: `Title ${id}`, body: "A made-up line.", provenance: made, ...extra });
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return "no error"; };

describe("addStoryPanels: steps", () => {
  it("keeps steps in the order added across calls, after the moment panels, and reads them with no time", () => {
    const scene = base().addStoryPanels([entry("s1"), entry("m2", { time: T0 + 20 * MIN })]).addStoryPanels([entry("s2", undefined, { object: "probe" }), entry("m1", { time: T0 + 10 * MIN })]);
    expect(scene.panels.map(({ id, timeUtcMs }) => [id, timeUtcMs])).toEqual([["m1", T0 + 10 * MIN], ["m2", T0 + 20 * MIN], ["s1", undefined], ["s2", undefined]]);
    expect(scene.panels[3]!.object).toBe("probe");
    const set = definitionOf(scene).experience.storyPanels!;
    expect(set.panels.map(({ id }) => id)).toEqual(["m1", "m2"]);
    expect(set.steps!.map(({ id, step }) => [id, step])).toEqual([["s1", 1], ["s2", 2]]);
  });
  it("a scene with steps only has no moment panels and no timeline need", () => {
    const set = definitionOf(base().addStoryPanels([entry("s1"), entry("s2")]).setTimeline({ none: true })).experience.storyPanels!;
    expect(set.panels).toEqual([]);
    expect(set.steps).toHaveLength(2);
  });
  it("a repeated id between a step and a moment panel throws duplicate-id; a step naming an unknown object throws bad-panels", () => {
    expect(codeOf(() => base().addStoryPanels([entry("a")]).addStoryPanels([entry("a", { time: T0 })]))).toBe("duplicate-id");
    expect(codeOf(() => definitionOf(base().addStoryPanels([entry("a", undefined, { object: "nowhere" })])))).toBe("bad-panels");
  });
  it("an at that is not a moment is still bad-panels", () => {
    expect(codeOf(() => base().addStoryPanels([entry("a", { time: "soon" })]))).toBe("bad-panels");
  });
});

describe("views and steps", () => {
  it("a view can name a step, and the view that does not name it hides it", () => {
    const definition = definitionOf(base().addStoryPanels([entry("s1"), entry("s2")]).setViews([{ id: "a", label: "A", panels: ["s1"] }, { id: "b", label: "B", panels: ["s2"] }], { place: "top-bar" }));
    const inView = (id: string) => experienceInView(definition.experience, definition.views, viewById(definition.views, id)).storyPanels!.steps!.map((step) => step.id);
    expect(inView("a")).toEqual(["s1"]);
    expect(inView("b")).toEqual(["s2"]);
  });
});

describe("the handle's panel calls", () => {
  function fake() {
    let state: ViewerState = { timeUtcMs: T0, rate: 1, playing: false, ...FAKE_PRESENTATION, panel: "s1" };
    const asked: (string | undefined)[] = [];
    const control: ViewerControl = {
      window: { startUtcMs: T0, endUtcMs: T0 + 60 * MIN }, events: [], rates: [1], paced: false, playable: true, setPlaying: () => undefined, read: () => state, seek: () => undefined, setRate: () => undefined,
      views: [], setView: () => undefined, cameraTargets: () => [], readCamera: () => undefined, setCamera: () => undefined, ...FAKE_PRESENTATION_CONTROL,
      panels: () => ["s1", "s2", "m1"],
      setPanel: (id) => { asked.push(id); state = { ...state, ...(id === undefined ? { panel: undefined } : { panel: id }) } as ViewerState; if (id === undefined) delete (state as { panel?: string }).panel; },
    };
    return { control, asked };
  }
  it("reads the panel the viewer opened with, without reporting it", () => {
    const { control } = fake();
    const handle = viewerHandleOf(new ViewerLink());
    const link = new ViewerLink(); link.attach(control);
    const live = viewerHandleOf(link);
    const heard: unknown[] = [];
    live.onPanel((change) => heard.push(change));
    link.publish(control.read(), "playback");
    expect(live.panel).toBe("s1");
    expect(heard).toEqual([]);
    expect(handle.panel).toBeUndefined(); // a link nobody drew
  });
  it("opens, closes and reports with cause host, in call order, nothing when unchanged", () => {
    const { control, asked } = fake();
    const link = new ViewerLink(); link.attach(control);
    const handle = viewerHandleOf(link);
    const heard: { panel?: string; cause: string }[] = [];
    handle.onPanel(({ panel, cause }) => heard.push({ ...(panel === undefined ? {} : { panel }), cause }));
    handle.setPanel("s2");
    handle.setPanel("s2");
    handle.setPanel(undefined);
    handle.setPanel("m1");
    expect(asked).toEqual(["s2", "s2", undefined, "m1"]);
    expect(heard).toEqual([{ panel: "s2", cause: "host" }, { cause: "host" }, { panel: "m1", cause: "host" }]);
    expect(handle.panel).toBe("m1");
  });
  it("a visitor's change, a playback open and a view-switch drop carry their causes", () => {
    const { control } = fake();
    const link = new ViewerLink(); link.attach(control);
    const handle = viewerHandleOf(link);
    const heard: string[] = [];
    handle.onPanel(({ panel, cause }) => heard.push(`${panel ?? "none"}:${cause}`));
    link.publishPanel({ ...control.read(), panel: "s2" }, "visitor");
    link.publishPanel({ ...control.read(), panel: "m1" }, "playback");
    link.publish({ ...control.read(), panel: "m1", playing: true }, "host"); // the host moved the view or clock last; the open panel is unchanged
    const { panel: _gone, ...closed } = control.read();
    link.publishPanel(closed as ViewerState, "move");
    expect(heard).toEqual(["s2:visitor", "m1:playback", "none:host"]);
  });
  it("an unknown id or a non-string throws bad-panels and changes nothing; before ready it throws not-mounted", () => {
    const { control, asked } = fake();
    const link = new ViewerLink();
    const handle = viewerHandleOf(link);
    expect(codeOf(() => handle.setPanel("s1"))).toBe("not-mounted");
    link.attach(control);
    expect(codeOf(() => handle.setPanel("nope"))).toBe("bad-panels");
    expect(codeOf(() => handle.setPanel(3 as never))).toBe("bad-panels");
    expect(codeOf(() => handle.setPanel(""))).toBe("bad-panels");
    expect(asked).toEqual([]);
  });
});
