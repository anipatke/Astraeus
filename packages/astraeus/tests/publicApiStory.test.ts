// @vitest-environment happy-dom
// The story calls of the public API (O-041 T-167), proved on a made-up probe (ARCH-03): events with provenance, story panels, the timeline's span and speeds or no timeline,
// a true-scale-only choice, an opening view that does not follow, a camera menu per body and path, and the state a story quotes.
import { afterEach, describe, expect, it, vi } from "vitest";
import { Scene, SceneError, earth, moon, readableScale, trueScale, type StoryPanelInput } from "astraeus";
import { infoView } from "../src/shell/infoModel";
import { openClock } from "../src/app/openClock";
import { scaleChoiceIdsOf } from "../src/app/experienceDefinition";
import { $, mountShell, press, type Mounted } from "./domSetup";
import { definitionOf } from "../src/api/definitionOf";

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const samples = [0, 1, 2, 3].map((i) => ({ time: T0 + i * 10 * MIN, positionKm: [10_000 + i * 1_000, 0, 0], velocityKmS: [i + 1, 0, 0] }));
const probe = { id: "probe", label: "Probe", samples, anchors: [{ id: "fix-a", time: T0 + 10 * MIN }] };
const base = () => new Scene().addBody(earth).addBody(moon).addTrajectory(probe);
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return "no error"; };
const messageOf = (fn: () => unknown) => { try { fn(); } catch (error) { return (error as Error).message; } return ""; };
const made = { sourceType: "observed", sources: ["A made-up source"], accuracy: "None claimed.", notes: "Made up." } as const;
const panel = (id: string, at: Record<string, string | number | Date>, extra: Record<string, unknown> = {}) => ({ id, at, title: `Title ${id}`, body: ["A line."], provenance: made, ...extra }) as never;
const panels = (...list: unknown[]) => list as readonly StoryPanelInput[];

describe("addEvents", () => {
  it("keeps events sorted across calls and carries their provenance", () => {
    const provenance = { sourceType: "reconstructed" as const, sources: ["A made-up log"], accuracy: "To the minute.", notes: "Invented." };
    const definition = definitionOf(base().addEvents([{ id: "late", label: "Late", time: T0 + 20 * MIN, type: "burn" }], { provenance }).addEvents([{ id: "early", label: "Early", time: "2026-03-01T00:05:00Z" }]));
    expect(definition.experience.events.map((event) => event.id)).toEqual(["early", "late"]);
    expect(definition.experience.events[1]).toMatchObject({ timeUtcMs: T0 + 20 * MIN, type: "burn" });
    expect(definition.experience.eventProvenance?.sources).toEqual(["A made-up log"]);
  });
  it("shows an event's own provenance, else the batch's, and refuses a malformed one naming the event (O-045 T-187)", () => {
    const modelled = { sourceType: "modelled" as const, sources: ["A made-up model"], accuracy: "Computed.", notes: "Invented." };
    const batch = { sourceType: "observed" as const, sources: ["A made-up log"], accuracy: "To the minute.", notes: "Invented." };
    const experience = definitionOf(base().addEvents([{ id: "calc", label: "Calculated", time: T0 + MIN, provenance: modelled }, { id: "seen", label: "Seen", time: T0 + 2 * MIN }], { provenance: batch })).experience;
    expect(infoView(experience, { kind: "event", id: "calc" })!.provenance).toMatchObject({ sourceType: "modelled", status: "Modelled", sources: ["A made-up model"] });
    expect(infoView(experience, { kind: "event", id: "seen" })!.provenance).toMatchObject({ sourceType: "observed", status: "Observed" });
    const bad = { ...modelled, sourceType: "guessed" };
    expect(codeOf(() => base().addEvents([{ id: "calc", label: "C", time: T0, provenance: bad as never }]))).toBe("bad-event");
    expect(messageOf(() => base().addEvents([{ id: "calc", label: "C", time: T0, provenance: bad as never }]))).toContain('event "calc"');
    expect(codeOf(() => base().addEvents([{ id: "ok", label: "C", time: T0 }], { provenance: bad as never }))).toBe("bad-event");
  });
  it("carries an event's object, refuses one the scene lacks naming the event and the id, and Go to frames it (I-120)", () => {
    const experience = definitionOf(base().addEvents([{ id: "flyby", label: "Flyby", time: T0 + 20 * MIN, object: "moon" }, { id: "plain", label: "Plain", time: T0 + 5 * MIN }])).experience;
    expect(experience.events.find((event) => event.id === "flyby")?.object).toBe("moon");
    expect(experience.events.find((event) => event.id === "plain")).not.toHaveProperty("object");
    const ghost = () => definitionOf(base().addEvents([{ id: "flyby", label: "Flyby", time: T0, object: "ghost" }]));
    expect(codeOf(ghost)).toBe("bad-event");
    expect(messageOf(ghost)).toContain('"flyby"');
    expect(messageOf(ghost)).toContain('"ghost"');
    expect(codeOf(() => base().addEvents([{ id: "e", label: "E", time: T0, object: "" }]))).toBe("bad-event");
    const m = mountShell({ experience });
    const rows = [...m.container.querySelectorAll<HTMLElement>(".timeline-expanded li button")];
    const before = m.cameraRequests.length;
    press(rows.find((row) => row.textContent?.includes("Plain"))!);
    expect(m.cameraRequests.length).toBe(before);
    press(rows.find((row) => row.textContent?.includes("Flyby"))!);
    expect(m.cameraRequests.at(-1)).toEqual({ kind: "focus", target: "moon" });
    expect(m.selected()).toBe("moon");
    expect(m.clock.now()).toBe(T0 + 20 * MIN);
    m.unmount();
  });
  it("starts with no events and no provenance", () => {
    const definition = definitionOf(base());
    expect(definition.experience.events).toEqual([]);
    expect(definition.experience.eventProvenance).toBeUndefined();
  });
  it.each([
    ["a repeated id", () => base().addEvents([{ id: "a", label: "A", time: T0 }, { id: "a", label: "B", time: T0 }]), "bad-event"],
    ["an id used in an earlier call", () => base().addEvents([{ id: "a", label: "A", time: T0 }]).addEvents([{ id: "a", label: "B", time: T0 }]), "bad-event"],
    ["an empty id", () => base().addEvents([{ id: "", label: "A", time: T0 }]), "bad-event"],
    ["no label", () => base().addEvents([{ id: "a", label: "", time: T0 }]), "bad-event"],
    ["events that are not a list", () => base().addEvents(undefined as never), "bad-event"],
    ["a moment that is not a time", () => base().addEvents([{ id: "a", label: "A", time: "soon" }]), "bad-time"],
  ])("refuses %s", (_name, call, code) => { expect(codeOf(call)).toBe(code); });
});

describe("addStoryPanels", () => {
  const moment = { time: "2026-03-01T00:02:00Z" };
  it("resolves a panel by time, by event and by anchor, sorted by time", () => {
    const definition = definitionOf(base().addEvents([{ id: "burn", label: "Burn", time: T0 + 25 * MIN }])
      .addStoryPanels([panel("by-event", { event: "burn" }, { object: "probe" }), panel("by-time", moment), panel("by-anchor", { anchor: "fix-a" })]).setStoryPanelPlayback({ pauseSeconds: 3 }));
    const set = definition.experience.storyPanels!;
    expect(set.panels.map((p) => [p.id, p.timeUtcMs])).toEqual([["by-time", T0 + 2 * MIN], ["by-anchor", T0 + 10 * MIN], ["by-event", T0 + 25 * MIN]]);
    expect(set.panels[2]!.objectId).toBe("probe");
    expect(set.pauseSeconds).toBe(3);
  });
  it("has no panels unless added", () => { expect(definitionOf(base()).experience.storyPanels).toBeUndefined(); });

  it("takes at.time as any TimeInput through the normal converter: text with no Z, a Date, or milliseconds (O-057 T-278)", () => {
    const expected = Date.parse("2026-03-01T00:02:00+00:00");
    const scene = base().addStoryPanels([panel("offset", { time: "2026-03-01T01:02:00+01:00" }), panel("date", { time: new Date(expected + MIN) }), panel("ms", { time: expected + 2 * MIN })]);
    expect(scene.panels.map((p) => [p.id, p.timeUtcMs])).toEqual([["offset", expected], ["date", expected + MIN], ["ms", expected + 2 * MIN]]);
  });

  it("appends: a second call keeps the first batch (O-057 T-278)", () => {
    const scene = base().addStoryPanels([panel("one", moment)]).addStoryPanels([panel("two", { anchor: "fix-a" })]);
    expect(scene.panels.map((p) => p.id)).toEqual(["one", "two"]);
  });

  it("a repeated id throws duplicate-id at the call, inside one batch and across calls, and a failed batch adds nothing (O-057 T-278)", () => {
    expect(codeOf(() => base().addStoryPanels([panel("p7", moment), panel("p7", moment)]))).toBe("duplicate-id");
    expect(messageOf(() => base().addStoryPanels([panel("p7", moment), panel("p7", moment)]))).toContain("p7");
    const scene = base().addStoryPanels([panel("p7", moment)]);
    expect(codeOf(() => scene.addStoryPanels([panel("new", moment), panel("p7", moment)]))).toBe("duplicate-id");
    expect(scene.panels.map((p) => p.id)).toEqual(["p7"]);
  });

  // Links may be added later, so these fail when the scene is built, not at the call.
  it.each([
    ["an event that is not there", panels(panel("p1", { event: "ghost" })), "p1", "at.event"],
    ["an anchor that is not there", panels(panel("p2", { anchor: "ghost" })), "p2", "at.anchor"],
    ["an object that is not in the scene", panels(panel("p3", moment, { object: "ghost" })), "p3", "object"],
    ["a time outside the timeline", panels(panel("p4", { time: "2030-01-01T00:00:00Z" })), "p4", "at"],
  ])("throws bad-panels for %s at check and mount, not at the call, naming the panel and field", (_name, input, id, field) => {
    const scene = base().addStoryPanels(input);
    const call = () => definitionOf(scene);
    expect(codeOf(call)).toBe("bad-panels");
    expect(messageOf(call)).toContain(id);
    expect(messageOf(call)).toContain(field);
    expect(codeOf(() => scene.check())).toBe("bad-panels");
  });

  it("links are read when the scene is built, so an event, anchor or object added after the panel is found (O-057 T-278)", () => {
    const scene = new Scene().addBody(earth).addStoryPanels([panel("late-links", { event: "later" }, { object: "probe" }), panel("by-fix", { anchor: "fix-a" })])
      .addTrajectory(probe).addEvents([{ id: "later", label: "Later", time: T0 + 5 * MIN }]);
    expect(scene.panels.map((p) => p.id)).toEqual(["late-links", "by-fix"]);
  });

  // Each field wrong alone, on an otherwise good panel: the call itself throws.
  it.each([
    ["no id", { id: "" }, "#1", "id"],
    ["no title", { title: "" }, "bad", "title"],
    ["an empty body", { body: [] }, "bad", "body"],
    ["details that are not text", { details: [5] }, "bad", "details[0]"],
    ["an object that is not text", { object: 5 }, "bad", "object"],
    ["no at", { at: undefined }, "bad", "at"],
    ["two moments at once", { at: { time: T0, event: "burn" } }, "bad", "at"],
    ["a moment that is not one", { at: { time: "soon" } }, "bad", "at.time"],
    ["an empty event name", { at: { event: "" } }, "bad", "at.event"],
    ["an empty anchor name", { at: { anchor: "" } }, "bad", "at.anchor"],
    ["no provenance", { provenance: undefined }, "bad", "provenance"],
    ["a source type that is not one", { provenance: { ...made, sourceType: "guess" } }, "bad", "provenance.sourceType"],
    ["no sources", { provenance: { ...made, sources: [] } }, "bad", "provenance.sources"],
    ["sources that are not a list", { provenance: { ...made, sources: "One" } }, "bad", "provenance.sources"],
    ["a blank source", { provenance: { ...made, sources: [" "] } }, "bad", "provenance.sources[0]"],
    ["a blank accuracy", { provenance: { ...made, accuracy: " " } }, "bad", "provenance.accuracy"],
    ["no notes", { provenance: { ...made, notes: undefined } }, "bad", "provenance.notes"],
  ])("throws bad-panels at the call for %s, naming the panel and field (O-057 T-278)", (_name, change, id, field) => {
    const call = () => base().addStoryPanels(panels(panel("bad", moment, change)));
    expect(codeOf(call)).toBe("bad-panels");
    expect(messageOf(call)).toContain(`story panel ${id}: ${field} `);
  });

  it("refuses what is not a list, and an entry that is not an object, at the call", () => {
    expect(codeOf(() => base().addStoryPanels(5 as never))).toBe("bad-panels");
    expect(codeOf(() => base().addStoryPanels(undefined as never))).toBe("bad-panels");
    expect(messageOf(() => base().addStoryPanels([null] as never))).toContain("story panel #1");
  });

  it("keeps an accuracy class and error fraction a panel's provenance states", () => {
    const provenance = { ...made, accuracyClass: "indicative", maxErrorFraction: 0.02 };
    expect(base().addStoryPanels(panels(panel("p", moment, { provenance }))).panels[0]!.provenance).toEqual(provenance);
  });
});

describe("setStoryPanelPlayback", () => {
  const settings = (scene: Scene) => { const { pauseSeconds, autoOpen } = definitionOf(scene).experience.storyPanels!; return { pauseSeconds, autoOpen }; };
  const withPanel = () => base().addStoryPanels([panel("p", { anchor: "fix-a" })]);

  it("defaults to a 6 second pause and opening by itself", () => { expect(settings(withPanel())).toEqual({ pauseSeconds: 6, autoOpen: true }); });
  it("sets each setting alone", () => {
    expect(settings(withPanel().setStoryPanelPlayback({ pauseSeconds: 2 }))).toEqual({ pauseSeconds: 2, autoOpen: true });
    expect(settings(withPanel().setStoryPanelPlayback({ autoOpen: false }))).toEqual({ pauseSeconds: 6, autoOpen: false });
  });
  it("replaces the whole setting: a field left out of the second call returns to its default", () => {
    expect(settings(withPanel().setStoryPanelPlayback({ pauseSeconds: 2, autoOpen: false }).setStoryPanelPlayback({ pauseSeconds: 9 }))).toEqual({ pauseSeconds: 9, autoOpen: true });
  });
  it("applies whichever order it is called in with addStoryPanels", () => {
    expect(settings(base().setStoryPanelPlayback({ pauseSeconds: 0 }).addStoryPanels([panel("p", { anchor: "fix-a" })]))).toEqual({ pauseSeconds: 0, autoOpen: true });
  });
  it.each([
    ["a pause below zero", { pauseSeconds: -1 }, "pauseSeconds"],
    ["a pause over the limit", { pauseSeconds: 21 }, "pauseSeconds"],
    ["an autoOpen that is not true or false", { autoOpen: "yes" }, "autoOpen"],
    ["no object", undefined, "playback"],
  ])("throws bad-panels at the call for %s", (_name, input, field) => {
    const call = () => base().setStoryPanelPlayback(input as never);
    expect(codeOf(call)).toBe("bad-panels");
    expect(messageOf(call)).toContain(field);
  });
});

describe("setTimeline", () => {
  it("sets the span, the speeds and the opening speed", () => {
    const definition = definitionOf(base().setTimeline({ start: "2026-03-01T00:00:00Z", end: "2026-03-02T00:00:00Z", rates: [10, 100], rate: 100 }));
    expect(definition.experience.window).toEqual({ startUtcMs: T0, endUtcMs: T0 + 86_400_000 });
    expect(definition.experience.rates).toEqual([10, 100]);
    expect(definition.clock.rate).toBe(100);
    expect(definition.experience.hideTimeline).toBeUndefined();
    expect(definition.clock.playing).toBeUndefined();
  });
  it("keeps the path span, three speeds and 60 when nothing is set", () => {
    const definition = definitionOf(base());
    expect(definition.experience.window).toEqual({ startUtcMs: T0, endUtcMs: T0 + 30 * MIN });
    expect(definition.experience.rates).toEqual([60, 3_600, 86_400]);
    expect(definition.clock.rate).toBe(60);
  });
  it.each([
    ["an end before the start", () => base().setTimeline({ start: "2026-03-02T00:00:00Z", end: "2026-03-01T00:00:00Z" })],
    ["a start that is not a time", () => base().setTimeline({ start: "soon", end: "2026-03-01T00:00:00Z" })],
    ["no speeds", () => base().setTimeline({ start: T0, end: T0 + MIN, rates: [] })],
    ["a negative speed", () => base().setTimeline({ start: T0, end: T0 + MIN, rates: [-1] })],
    ["a zero opening rate", () => base().setTimeline({ start: T0, end: T0 + MIN, rate: 0 })],
    ["a zero rate with no timeline", () => base().setTimeline({ none: true, rate: 0 })],
    ["a time set outside the span", () => definitionOf(base().setTime(T0 + 3 * 86_400_000).setTimeline({ start: T0, end: T0 + 86_400_000 }))],
  ])("refuses %s", (_name, call) => { expect(codeOf(call)).toMatch(/^bad-(timeline|time)$/); });
  it("throws bad-timeline for a span the time lies outside", () => {
    expect(codeOf(() => definitionOf(base().setTime(T0 + 3 * 86_400_000).setTimeline({ start: T0, end: T0 + 86_400_000 })))).toBe("bad-timeline");
  });

  describe("no timeline", () => {
    let m: Mounted | undefined;
    afterEach(() => { m?.unmount(); m = undefined; });

    it("frozen: the clock stays paused at the chosen moment and the shell draws no bar", () => {
      const definition = definitionOf(base().setTimeline({ none: true, at: "2026-03-01T00:07:00Z" }));
      expect(definition.experience.hideTimeline).toBe(true);
      expect(definition.clock).toMatchObject({ startUtcMs: T0 + 7 * MIN, playing: false });
      const clock = openClock(definition);
      expect(clock.playing).toBe(false);
      expect(clock.now()).toBe(T0 + 7 * MIN);
      m = mountShell({ experience: definition.experience });
      expect(m.container.querySelector(".timeline-bar")).toBeNull();
      expect(m.container.querySelector(".timeline-drawer")).toBeNull();
      expect($(m.container, "main").getAttribute("data-timeline-hidden")).toBe("true");
    });
    it("frozen at the time of setTime when no moment is given", () => {
      expect(definitionOf(base().setTime(T0 + 4 * MIN).setTimeline({ none: true })).clock.startUtcMs).toBe(T0 + 4 * MIN);
    });
    it("running: the clock plays on at the chosen rate and the shell draws no bar, also on a phone", () => {
      const definition = definitionOf(base().setTimeline({ none: true, rate: 600 }));
      expect(definition.clock.playing).toBeUndefined();
      const clock = openClock(definition);
      expect(clock.playing).toBe(true);
      expect(clock.rate).toBe(600);
      for (const phone of [false, true]) {
        m = mountShell({ experience: definition.experience, phone });
        expect(m.container.querySelector(".timeline-bar")).toBeNull();
        expect(m.container.querySelector(".drawer-handle-top")).toBeNull();
        m.unmount();
      }
      m = undefined;
    });
    it("leaves a scene with a timeline exactly as it was: the bar is drawn and the clock plays", () => {
      const definition = definitionOf(base());
      expect(openClock(definition).playing).toBe(true);
      m = mountShell({ experience: definition.experience });
      expect(m.container.querySelector(".timeline-bar")).not.toBeNull();
      expect($(m.container, "main").getAttribute("data-timeline-hidden")).toBe("false");
    });
  });
});

describe("setScale with only", () => {
  it("offers the chosen scale alone", () => {
    expect(scaleChoiceIdsOf(definitionOf(base().setScale(trueScale, { only: true })))).toEqual([trueScale.id]);
    expect(scaleChoiceIdsOf(definitionOf(base().setScale(readableScale, { only: true })))).toEqual([readableScale.id]);
  });
  it("offers both without it, and a later call without it lifts the restriction", () => {
    expect(scaleChoiceIdsOf(definitionOf(base().setScale(trueScale)))).toEqual([trueScale.id, readableScale.id]);
    expect(scaleChoiceIdsOf(definitionOf(base().setScale(trueScale, { only: true }).setScale(trueScale)))).toHaveLength(2);
  });
  it("still refuses a scale that is not one", () => { expect(codeOf(() => base().setScale({ id: "x" } as never, { only: true }))).toBe("bad-scale"); });
});

describe("camera.focus and the automatic camera menu", () => {
  it("opens looking at an object without following it", () => {
    const definition = (() => { const scene = base(); scene.camera.focus("probe", { distance: 12, azimuthDeg: 10 }); return definitionOf(scene); })();
    expect(definition.startView).toEqual({ focus: "probe", azimuthDeg: 10, elevationDeg: 30, distance: 12 });
    expect(definition.experience.startCameraPresetId).toBe("focus-probe");
  });
  it("lets the last of follow and focus win", () => {
    const scene = base();
    scene.camera.follow("probe").focus("moon");
    expect(scene.camera.following).toBe(false);
    expect(scene.camera.target).toBe("moon");
    scene.camera.follow("moon");
    expect(scene.camera.following).toBe(true);
  });
  it("refuses an object not in the scene", () => { expect(codeOf(() => base().camera.focus("ghost"))).toBe("unknown-body"); });
  it("lists Overview plus Focus and Follow for every body and path, with the opening one in force", () => {
    const scene = base();
    scene.camera.follow("moon");
    const { cameraPresets, startCameraPresetId } = definitionOf(scene).experience;
    expect(cameraPresets.map((preset) => preset.id)).toEqual(["overview", "focus-earth", "follow-earth", "focus-moon", "follow-moon", "focus-probe", "follow-probe"]);
    expect(cameraPresets.find((preset) => preset.id === "follow-probe")).toMatchObject({ label: "Follow Probe", request: { kind: "follow", target: "probe" } });
    expect(startCameraPresetId).toBe("follow-moon");
  });
  it("keeps no preset in force when no view is set", () => { expect(definitionOf(base()).experience.startCameraPresetId).toBeUndefined(); });
});

describe("stateOf", () => {
  it("gives the state of a path at a moment, about its centre", () => {
    const state = base().stateOf("probe", T0 + 10 * MIN);
    expect(state.positionKm[0]).toBeCloseTo(11_000, 6);
    expect(Math.hypot(...(state.velocityKmS as unknown as number[]))).toBeCloseTo(2, 6);
  });
  it("refuses a body, an unknown id and a moment outside the path", () => {
    expect(codeOf(() => base().stateOf("sun", T0))).toBe("unknown-body");
    expect(codeOf(() => base().stateOf("ghost", T0))).toBe("unknown-body");
    expect(codeOf(() => base().stateOf("probe", T0 + 99 * MIN))).toBe("bad-time");
    expect(codeOf(() => base().stateOf("probe", "soon"))).toBe("bad-time");
  });
});

describe("the opening moment with nothing setting a span", () => {
  afterEach(() => { vi.useRealTimers(); });
  it("opens a scene of only bodies at the current time, with the month window kept around it", () => {
    const now = Date.parse("2026-06-15T12:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const definition = definitionOf(new Scene().addBody(earth).addBody(moon));
    expect(definition.clock.startUtcMs).toBe(now);
    expect(definition.experience.window).toEqual({ startUtcMs: now - 15 * 86_400_000, endUtcMs: now + 15 * 86_400_000 });
  });
  it("still honours setTime and a trajectory's span (the tests above)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse("2026-06-15T12:00:00Z"));
    expect(definitionOf(base()).clock.startUtcMs).toBe(T0);
    expect(definitionOf(new Scene().addBody(earth).setTime(T0)).clock.startUtcMs).toBe(T0);
  });
});
