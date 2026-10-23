// @vitest-environment happy-dom
// The story calls of the public API (O-041 T-167), proved on a made-up probe (ARCH-03): events with provenance, story panels, the timeline's span and speeds or no timeline,
// a true-scale-only choice, an opening view that does not follow, a camera menu per body and path, and the state a story quotes.
import { afterEach, describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon, readableScale, trueScale, type StoryPanelsInput } from "astraeus";
import { openClock } from "../src/app/openClock";
import { scaleChoiceIdsOf } from "../src/app/experienceDefinition";
import { $, mountShell, type Mounted } from "./domSetup";

const T0 = Date.parse("2026-03-01T00:00:00Z");
const MIN = 60_000;
const samples = [0, 1, 2, 3].map((i) => ({ time: T0 + i * 10 * MIN, positionKm: [10_000 + i * 1_000, 0, 0], velocityKmS: [i + 1, 0, 0] }));
const probe = { id: "probe", label: "Probe", samples, anchors: [{ id: "fix-a", time: T0 + 10 * MIN }] };
const base = () => new Scene().addBody(earth).addBody(moon).addTrajectory(probe);
const codeOf = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return "no error"; };
const messageOf = (fn: () => unknown) => { try { fn(); } catch (error) { return (error as Error).message; } return ""; };
const panel = (id: string, at: Record<string, string>, extra: Record<string, unknown> = {}) => ({ id, at, title: `Title ${id}`, body: ["A line."], badge: "observed", sources: ["A made-up source"], ...extra });
const panels = (...list: unknown[]): StoryPanelsInput => ({ panels: list });

describe("addEvents", () => {
  it("keeps events sorted across calls and carries their provenance", () => {
    const provenance = { sourceType: "reconstructed" as const, sources: ["A made-up log"], accuracy: "To the minute.", notes: "Invented." };
    const definition = base().addEvents([{ id: "late", label: "Late", time: T0 + 20 * MIN, type: "burn" }], { provenance }).addEvents([{ id: "early", label: "Early", time: "2026-03-01T00:05:00Z" }]).toDefinition();
    expect(definition.experience.events.map((event) => event.id)).toEqual(["early", "late"]);
    expect(definition.experience.events[1]).toMatchObject({ timeUtcMs: T0 + 20 * MIN, type: "burn" });
    expect(definition.experience.eventProvenance?.sources).toEqual(["A made-up log"]);
  });
  it("starts with no events and no provenance", () => {
    const definition = base().toDefinition();
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
  it("resolves a panel by utc, by event and by anchor, sorted by time", () => {
    const definition = base().addEvents([{ id: "burn", label: "Burn", time: T0 + 25 * MIN }])
      .addStoryPanels({ pauseSeconds: 3, panels: [panel("by-event", { event: "burn" }, { object: "probe" }), panel("by-utc", { utc: "2026-03-01T00:02:00Z" }), panel("by-anchor", { anchor: "fix-a" })] }).toDefinition();
    const set = definition.experience.storyPanels!;
    expect(set.panels.map((p) => [p.id, p.timeUtcMs])).toEqual([["by-utc", T0 + 2 * MIN], ["by-anchor", T0 + 10 * MIN], ["by-event", T0 + 25 * MIN]]);
    expect(set.panels[2]!.objectId).toBe("probe");
    expect(set.pauseSeconds).toBe(3);
  });
  it("has no panels unless added", () => { expect(base().toDefinition().experience.storyPanels).toBeUndefined(); });
  it.each([
    ["an event that is not there", panels(panel("p1", { event: "ghost" })), "p1", "at.event"],
    ["an anchor that is not there", panels(panel("p2", { anchor: "ghost" })), "p2", "at.anchor"],
    ["an object that is not in the scene", panels(panel("p3", { utc: "2026-03-01T00:02:00Z" }, { object: "ghost" })), "p3", "object"],
    ["a time outside the timeline", panels(panel("p4", { utc: "2030-01-01T00:00:00Z" })), "p4", "at"],
    ["a badge that is not one", panels(panel("p5", { utc: "2026-03-01T00:02:00Z" }, { badge: "guess" })), "p5", "badge"],
    ["no sources", panels(panel("p6", { utc: "2026-03-01T00:02:00Z" }, { sources: [] })), "p6", "sources"],
    ["a repeated panel id", panels(panel("p7", { utc: "2026-03-01T00:02:00Z" }), panel("p7", { utc: "2026-03-01T00:03:00Z" })), "p7", "id"],
  ])("throws bad-panels for %s, naming the panel and field", (_name, input, id, field) => {
    const call = () => base().addStoryPanels(input).toDefinition();
    expect(codeOf(call)).toBe("bad-panels");
    expect(messageOf(call)).toContain(id);
    expect(messageOf(call)).toContain(field);
  });
});

describe("setTimeline", () => {
  it("sets the span, the speeds and the opening speed", () => {
    const definition = base().setTimeline({ start: "2026-03-01T00:00:00Z", end: "2026-03-02T00:00:00Z", rates: [10, 100], rate: 100 }).toDefinition();
    expect(definition.experience.window).toEqual({ startUtcMs: T0, endUtcMs: T0 + 86_400_000 });
    expect(definition.experience.rates).toEqual([10, 100]);
    expect(definition.clock.rate).toBe(100);
    expect(definition.experience.hideTimeline).toBeUndefined();
    expect(definition.clock.playing).toBeUndefined();
  });
  it("keeps the path span, three speeds and 60 when nothing is set", () => {
    const definition = base().toDefinition();
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
    ["a time set outside the span", () => base().setTime(T0 + 3 * 86_400_000).setTimeline({ start: T0, end: T0 + 86_400_000 }).toDefinition()],
  ])("refuses %s", (_name, call) => { expect(codeOf(call)).toMatch(/^bad-(timeline|time)$/); });
  it("throws bad-timeline for a span the time lies outside", () => {
    expect(codeOf(() => base().setTime(T0 + 3 * 86_400_000).setTimeline({ start: T0, end: T0 + 86_400_000 }).toDefinition())).toBe("bad-timeline");
  });

  describe("no timeline", () => {
    let m: Mounted | undefined;
    afterEach(() => { m?.unmount(); m = undefined; });

    it("frozen: the clock stays paused at the chosen moment and the shell draws no bar", () => {
      const definition = base().setTimeline({ none: true, at: "2026-03-01T00:07:00Z" }).toDefinition();
      expect(definition.experience.hideTimeline).toBe(true);
      expect(definition.clock).toMatchObject({ startUtcMs: T0 + 7 * MIN, playing: false });
      const clock = openClock(definition);
      expect(clock.playing).toBe(false);
      expect(clock.now()).toBe(T0 + 7 * MIN);
      m = mountShell({ experience: definition.experience });
      expect(m.container.querySelector(".timeline-bar")).toBeNull();
      expect(m.container.querySelector("#timeline-drawer")).toBeNull();
      expect($(m.container, "main").getAttribute("data-timeline-hidden")).toBe("true");
    });
    it("frozen at the time of setTime when no moment is given", () => {
      expect(base().setTime(T0 + 4 * MIN).setTimeline({ none: true }).toDefinition().clock.startUtcMs).toBe(T0 + 4 * MIN);
    });
    it("running: the clock plays on at the chosen rate and the shell draws no bar, also on a phone", () => {
      const definition = base().setTimeline({ none: true, rate: 600 }).toDefinition();
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
      const definition = base().toDefinition();
      expect(openClock(definition).playing).toBe(true);
      m = mountShell({ experience: definition.experience });
      expect(m.container.querySelector(".timeline-bar")).not.toBeNull();
      expect($(m.container, "main").getAttribute("data-timeline-hidden")).toBe("false");
    });
  });
});

describe("setScale with only", () => {
  it("offers the chosen scale alone", () => {
    expect(scaleChoiceIdsOf(base().setScale(trueScale, { only: true }).toDefinition())).toEqual([trueScale.id]);
    expect(scaleChoiceIdsOf(base().setScale(readableScale, { only: true }).toDefinition())).toEqual([readableScale.id]);
  });
  it("offers both without it, and a later call without it lifts the restriction", () => {
    expect(scaleChoiceIdsOf(base().setScale(trueScale).toDefinition())).toEqual([trueScale.id, readableScale.id]);
    expect(scaleChoiceIdsOf(base().setScale(trueScale, { only: true }).setScale(trueScale).toDefinition())).toHaveLength(2);
  });
  it("still refuses a scale that is not one", () => { expect(codeOf(() => base().setScale({ id: "x" } as never, { only: true }))).toBe("bad-scale"); });
});

describe("camera.lookAt and the automatic camera menu", () => {
  it("opens looking at an object without following it", () => {
    const definition = (() => { const scene = base(); scene.camera.lookAt("probe", { distance: 12, azimuthDeg: 10 }); return scene.toDefinition(); })();
    expect(definition.startView).toEqual({ focus: "probe", azimuthDeg: 10, elevationDeg: 30, distance: 12 });
    expect(definition.experience.startCameraPresetId).toBe("focus-probe");
  });
  it("lets the last of follow and lookAt win", () => {
    const scene = base();
    scene.camera.follow("probe").lookAt("moon");
    expect(scene.camera.following).toBe(false);
    expect(scene.camera.target).toBe("moon");
    scene.camera.follow("moon");
    expect(scene.camera.following).toBe(true);
  });
  it("refuses an object not in the scene", () => { expect(codeOf(() => base().camera.lookAt("ghost"))).toBe("unknown-body"); });
  it("lists Overview plus Focus and Follow for every body and path, with the opening one in force", () => {
    const scene = base();
    scene.camera.follow("moon");
    const { cameraPresets, startCameraPresetId } = scene.toDefinition().experience;
    expect(cameraPresets.map((preset) => preset.id)).toEqual(["overview", "focus-earth", "follow-earth", "focus-moon", "follow-moon", "focus-probe", "follow-probe"]);
    expect(cameraPresets.find((preset) => preset.id === "follow-probe")).toMatchObject({ label: "Follow Probe", request: { kind: "follow", target: "probe" } });
    expect(startCameraPresetId).toBe("follow-moon");
  });
  it("keeps no preset in force when no view is set", () => { expect(base().toDefinition().experience.startCameraPresetId).toBeUndefined(); });
});

describe("stateOf", () => {
  it("gives the state of a path at a moment, about its centre", () => {
    const state = base().stateOf("probe", T0 + 10 * MIN);
    expect(state.positionKm[0]).toBeCloseTo(11_000, 6);
    expect(Math.hypot(...(state.velocityKmS as unknown as number[]))).toBeCloseTo(2, 6);
  });
  it("refuses a body, an unknown id and a moment outside the path", () => {
    expect(codeOf(() => base().stateOf("moon", T0))).toBe("unknown-body");
    expect(codeOf(() => base().stateOf("ghost", T0))).toBe("unknown-body");
    expect(codeOf(() => base().stateOf("probe", T0 + 99 * MIN))).toBe("bad-time");
    expect(codeOf(() => base().stateOf("probe", "soon"))).toBe("bad-time");
  });
});
