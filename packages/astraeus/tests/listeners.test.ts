// O-054 T-244: one helper runs every host listener; a throw is reported to the page and never stops the others. A scan fails if a host-link part loops over its listeners itself.
import { readdirSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { callListeners } from "../src/api/listeners";
import type { SelectionChange } from "../src/api/viewerSelection";
import { ViewerLink, type EventZoneChange, type ViewerChange } from "../src/api/viewerLink";
import type { ViewerControl, ViewerState } from "../src/app/viewerPort";
import { FAKE_PRESENTATION, FAKE_PRESENTATION_CONTROL } from "./helpers/viewerPresentation";

const START = Date.UTC(2020, 0, 1);
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("callListeners", () => {
  it("runs every listener with the value, reports each throw with reportError afterwards, and does not throw", () => {
    const report = vi.fn();
    vi.stubGlobal("reportError", report);
    const boom = new Error("boom");
    const heard: number[] = [];
    callListeners(new Set([() => { throw boom; }, (v: number) => heard.push(v), () => { throw boom; }]), 7);
    expect(heard).toEqual([7]);
    expect(report).toHaveBeenCalledTimes(2);
    expect(report).toHaveBeenCalledWith(boom);
  });

  it("without reportError rethrows each error on a timer, after the other listeners ran", () => {
    vi.useFakeTimers();
    vi.stubGlobal("reportError", undefined);
    const boom = new Error("late");
    const heard: number[] = [];
    callListeners(new Set([() => { throw boom; }, (v: number) => heard.push(v)]), 1);
    expect(heard).toEqual([1]);
    expect(() => vi.runAllTimers()).toThrow("late");
  });

  it("a listener that stops itself or adds one during the call changes the next call only", () => {
    vi.stubGlobal("reportError", vi.fn());
    const set = new Set<(v: number) => void>();
    const heard: string[] = [];
    const added = (): void => { heard.push("added"); };
    const self = (): void => { heard.push("self"); set.delete(self); set.add(added); };
    set.add(self);
    set.add(() => heard.push("other"));
    callListeners(set, 0);
    expect(heard).toEqual(["self", "other"]);
    callListeners(set, 0);
    expect(heard).toEqual(["self", "other", "other", "added"]);
  });
});

function fakeControl(): { control: ViewerControl; state: ViewerState } {
  const state: ViewerState = { timeUtcMs: START + 10, rate: 1, playing: false, auto: true, zones: [], ...FAKE_PRESENTATION };
  const control = {
    window: { startUtcMs: START, endUtcMs: START + 1e6 }, events: [{ id: "e1", type: "flyby", object: "moon" }], rates: [1], paced: true, playable: true, setPlaying: () => undefined,
    read: () => state, seek: () => undefined, setRate: () => undefined, views: [], setView: () => undefined, cameraTargets: () => [], readCamera: () => ({}), setCamera: () => undefined, ...FAKE_PRESENTATION_CONTROL,
  } as unknown as ViewerControl;
  return { control, state };
}

describe("ViewerLink listeners", () => {
  it("a throwing onChange listener does not stop the next one; reportError receives the error", () => {
    const report = vi.fn();
    vi.stubGlobal("reportError", report);
    const link = new ViewerLink();
    const { control, state } = fakeControl();
    const heard: ViewerChange[] = [];
    const boom = new Error("change boom");
    link.onChange(() => { throw boom; });
    link.onChange((c) => heard.push(c));
    link.attach(control);
    link.publish({ ...state, timeUtcMs: START + 20 }, "playback");
    expect(heard).toHaveLength(1);
    expect(report).toHaveBeenCalledWith(boom);
  });

  it("a throwing onEventZone listener does not stop the next one, nor the next zone report; reportError receives the error", () => {
    const report = vi.fn();
    vi.stubGlobal("reportError", report);
    const link = new ViewerLink();
    const { control, state } = fakeControl();
    const heard: EventZoneChange[] = [];
    const boom = new Error("zone boom");
    link.onEventZone(() => { throw boom; });
    link.onEventZone((z) => heard.push(z));
    link.attach(control);
    link.publish({ ...state, zones: ["e1"] }, "playback");
    link.publish({ ...state, zones: [] }, "playback");
    expect(heard.map((z) => z.entered)).toEqual([true, false]);
    expect(report).toHaveBeenCalledTimes(2);
    expect(report).toHaveBeenCalledWith(boom);
  });
});

describe("ViewerLink selection listeners (I-138)", () => {
  it("a throwing onSelect listener does not stop the next one; reportError receives the error; a drop names what last moved the clock", () => {
    const report = vi.fn();
    vi.stubGlobal("reportError", report);
    const link = new ViewerLink();
    const { control, state } = fakeControl();
    const heard: SelectionChange[] = [];
    const boom = new Error("select boom");
    link.onSelect(() => { throw boom; });
    link.onSelect((c) => heard.push(c));
    link.attach(control);
    const moved = { ...state, timeUtcMs: START + 20 };
    link.publish(moved, "host"); // the clock moved by a host call
    link.publishSelection({ ...moved, selected: "moon" }, true); // the viewer then dropped the selection because of it
    link.publishSelection({ ...moved, selected: "earth" }, false); // a visitor's own choice
    link.publish({ ...moved, timeUtcMs: START + 30, selected: "earth" }, "playback");
    link.publishSelection({ ...moved, timeUtcMs: START + 30, selected: "sun" }, true);
    expect(heard.map((c) => [c.object, c.cause])).toEqual([["moon", "host"], ["earth", "visitor"], ["sun", "playback"]]);
    expect(report).toHaveBeenCalledTimes(3);
    expect(report).toHaveBeenCalledWith(boom);
  });
});

/** Every file under `src/api` that holds a listener set: a new host-link part is covered the day it is added. */
const listenerParts = readdirSync(new URL("../src/api/", import.meta.url)).filter((f) => f.endsWith(".ts") && /#listeners|Listeners\b/.test(readFileSync(new URL(`../src/api/${f}`, import.meta.url), "utf8")) && f !== "listeners.ts");

describe("listener scan", () => {
  it("covers the known host-link parts (so the rule cannot go empty)", () => {
    for (const part of ["viewerClock.ts", "viewerZones.ts", "viewerSelection.ts", "viewerCamera.ts"]) expect(listenerParts).toContain(part);
  });

  it("no part that holds listeners loops over them itself, and each calls callListeners", () => {
    for (const file of listenerParts) {
      const source = readFileSync(new URL(`../src/api/${file}`, import.meta.url), "utf8");
      expect(source, file).not.toMatch(/for \(const \w+ of \[?\.{0,3}\s*(this\.)?#?listeners/i);
      expect(source, file).not.toMatch(/#listeners\.forEach/);
      if (/#listeners\b/.test(source) && /\.add\(listener\)/.test(source)) expect(source, file).toContain("callListeners(");
    }
  });
});
