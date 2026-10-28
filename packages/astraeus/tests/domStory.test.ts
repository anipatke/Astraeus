// @vitest-environment happy-dom
// The story panel contract on the pretend page (O-038 T-143), on the made-up experience's two panels (the generic part of browser-story-panels.mjs): opening as playback
// reaches a panel, holding and resuming, the timeline markers, closing, the folded details and the two settings. What each demo's own panels say is data, checked by
// tests/storyStoriesAllDemos.test.ts; the scene marker's drawing is the smoke check.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syntheticDefinition } from "../src/synthetic/syntheticDefinition";
import { $, change, mountShell, press, pressKey, type Mounted } from "./domSetup";

let m: Mounted;
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { m.unmount(); vi.useRealTimers(); });
const panels = syntheticDefinition.experience.storyPanels!.panels;
const panelEl = () => m.container.querySelector<HTMLElement>(".story-panel");
const markers = () => [...m.container.querySelectorAll<HTMLElement>(".timeline-panel-marker")];
/** Seeks a second before a panel, plays, and lets six simulated seconds pass (100 ms at the first rate). */
const playAcross = (index: number) => {
  m.clock.seek(panels[index].timeUtcMs - 1_000);
  m.advance(0);
  if (!m.clock.playing) press($(m.container, ".timeline-play"));
  m.advance(100);
};

describe("opening as playback reaches a panel", () => {
  it("has a timeline marker per panel", () => {
    m = mountShell();
    expect(markers()).toHaveLength(panels.length);
  });

  it("opens the first panel by itself on forward playback and holds playback", () => {
    m = mountShell();
    playAcross(0);
    expect(panelEl()?.getAttribute("data-panel-id")).toBe(panels[0].id);
    expect(m.clock.playing).toBe(false);
    expect(panelEl()?.querySelector(".story-panel-continue")).not.toBeNull();
    expect(panelEl()?.querySelector(".story-badge")?.getAttribute("data-badge")).toBe("illustrative");
  });

  it("resumes on its own after the pause length", () => {
    m = mountShell();
    playAcross(0);
    vi.advanceTimersByTime(1_900);
    expect(m.clock.playing).toBe(false);
    vi.advanceTimersByTime(200);
    expect(m.clock.playing).toBe(true);
    expect(panelEl()).not.toBeNull();
  });

  it("resumes early on a tap on Continue", () => {
    m = mountShell();
    playAcross(0);
    press($(m.container, ".story-panel-continue"));
    expect(m.clock.playing).toBe(true);
    expect(panelEl()?.querySelector(".story-panel-continue")).toBeNull();
  });

  it("opens the panels in time order as playback reaches each, one at a time", () => {
    m = mountShell();
    const opened: (string | null | undefined)[] = [];
    playAcross(0);
    opened.push(panelEl()?.getAttribute("data-panel-id"));
    press($(m.container, ".story-panel-continue"));
    playAcross(1);
    opened.push(panelEl()?.getAttribute("data-panel-id"));
    expect(opened).toEqual(panels.map((panel) => panel.id));
    expect(m.container.querySelectorAll(".story-panel")).toHaveLength(1);
  });

  it("opens nothing when the timeline is scrubbed or stepped past the markers", () => {
    m = mountShell();
    const slider = $(m.container, 'input[aria-label="Seek timeline"]') as HTMLInputElement;
    change(slider, slider.max);
    change(slider, slider.min);
    press($(m.container, ".timeline-next"));
    m.advance(10);
    expect(panelEl()).toBeNull();
  });
});

describe("the timeline markers and closing", () => {
  it("open their panel, one at a time, and a marker seeks to its panel's time", () => {
    m = mountShell();
    press(markers()[0]);
    expect(panelEl()?.getAttribute("data-panel-id")).toBe(panels[0].id);
    expect(m.clock.now()).toBe(panels[0].timeUtcMs);
    press(markers()[1]);
    expect(m.container.querySelectorAll(".story-panel")).toHaveLength(1);
    expect(panelEl()?.getAttribute("data-panel-id")).toBe(panels[1].id);
  });

  it("opens from a scene marker's request, and closes on Escape and on its close button", () => {
    m = mountShell();
    m.requestPanel(panels[0].id);
    expect(panelEl()?.getAttribute("data-panel-id")).toBe(panels[0].id);
    pressKey(document, "Escape");
    expect(panelEl()).toBeNull();
    press(markers()[0]);
    press($(m.container, 'button[aria-label="Close story panel"]'));
    expect(panelEl()).toBeNull();
  });

  it("closing a held panel lets playback go on", () => {
    m = mountShell();
    playAcross(0);
    press($(m.container, 'button[aria-label="Close story panel"]'));
    expect(m.clock.playing).toBe(true);
  });
});

describe("details and sources", () => {
  it("fold the details and sources into one section, closed by default, one tap opens it and another folds it", () => {
    m = mountShell();
    press(markers()[0]);
    const section = $(m.container, ".story-panel .sources-section") as HTMLDetailsElement;
    expect(m.container.querySelectorAll(".story-panel .sources-section")).toHaveLength(1);
    expect(section.open).toBe(false);
    expect(section.querySelector("summary")?.textContent).toContain("The details and sources");
    expect([...section.querySelectorAll(".sources-details p")].map((p) => p.textContent)).toEqual(panels[0].details);
    press($(section, "summary"));
    expect(section.open).toBe(true);
    press($(section, "summary"));
    expect(section.open).toBe(false);
  });

  it("labels a panel with no details plainly as Sources", () => {
    m = mountShell();
    press(markers()[1]);
    expect($(m.container, ".story-panel .sources-section summary").textContent).toMatch(/^Sources/);
  });
});

describe("the two settings", () => {
  it("a pause length of 0 opens a panel without pausing", () => {
    m = mountShell({ storyPanelSettings: { autoOpen: true, pauseSeconds: 0 } });
    playAcross(0);
    expect(panelEl()).not.toBeNull();
    expect(m.clock.playing).toBe(true);
  });

  it("with auto-open off, playback crosses silently and the markers still open panels", () => {
    m = mountShell({ storyPanelSettings: { autoOpen: false, pauseSeconds: 2 } });
    playAcross(0);
    expect(panelEl()).toBeNull();
    expect(m.clock.playing).toBe(true);
    press(markers()[0]);
    expect(panelEl()).not.toBeNull();
  });
});

describe("zoom through a phone sheet", () => {
  /** Puts a canvas where the app's scene sits and records the wheel events that reach it, as the camera control would hear them. */
  const withCanvas = () => {
    const canvas = document.createElement("canvas");
    m.container.querySelector(".shell-canvas")!.append(canvas);
    const heard: WheelEvent[] = [];
    canvas.addEventListener("wheel", (event) => heard.push(event));
    return heard;
  };
  const touches = (type: string, spread: number) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(event, { touches: [{ clientX: 0, clientY: 0 }, { clientX: spread, clientY: 0 }] });
    return event;
  };
  it("forwards a wheel over the open phone sheet to the scene and keeps the sheet open", () => {
    m = mountShell({ phone: true });
    const heard = withCanvas();
    m.requestPanel(panels[0].id);
    const wheel = new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true });
    panelEl()!.dispatchEvent(wheel);
    expect(heard.map((event) => event.deltaY)).toEqual([120]);
    expect(wheel.defaultPrevented).toBe(true);
    expect(panelEl()).not.toBeNull();
  });
  it("forwards a pinch as a zoom: spreading zooms in (negative wheel), closing zooms out", () => {
    m = mountShell({ phone: true });
    const heard = withCanvas();
    m.requestPanel(panels[0].id);
    const sheet = panelEl()!;
    sheet.dispatchEvent(touches("touchstart", 100));
    sheet.dispatchEvent(touches("touchmove", 120));
    sheet.dispatchEvent(touches("touchmove", 90));
    expect(heard.map((event) => event.deltaY)).toEqual([-100, 150]);
  });
  it("leaves a sheet with something to scroll its own wheel", () => {
    m = mountShell({ phone: true });
    const heard = withCanvas();
    m.requestPanel(panels[0].id);
    const sheet = panelEl()!;
    Object.defineProperty(sheet, "scrollHeight", { value: 600 });
    Object.defineProperty(sheet, "clientHeight", { value: 300 });
    const wheel = new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true });
    sheet.dispatchEvent(wheel);
    expect(heard).toEqual([]);
    expect(wheel.defaultPrevented).toBe(false);
  });
  it("does nothing on a wide screen, where the side panel is beside the scene", () => {
    m = mountShell();
    const heard = withCanvas();
    m.requestPanel(panels[0].id);
    panelEl()!.dispatchEvent(new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true }));
    expect(heard).toEqual([]);
  });
});
