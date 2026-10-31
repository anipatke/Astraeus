// @vitest-environment happy-dom
// I-126 (O-050 T-214): markers that would overlap on the track are gathered under one numbered mark that lists them, so each stays reachable.
import { createElement, act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { TimelineBar } from "../src/shell/TimelineBar";
import type { ExperienceConfig } from "../src/shell/experience";
import { groupMarkers, MARKER_MIN_SPACING_PX } from "../src/shell/timelineModel";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const HOUR = 3_600_000;
const START = Date.UTC(2016, 0, 1);
const bounds = { startUtcMs: START, endUtcMs: START + 3 * 365 * 24 * HOUR };
const at = (hours: number) => ({ timeUtcMs: START + 400 * 24 * HOUR + hours * HOUR });

describe("groupMarkers", () => {
  it("leaves well-separated markers alone", () => {
    const groups = groupMarkers([{ timeUtcMs: START + 10 * 24 * HOUR }, { timeUtcMs: START + 500 * 24 * HOUR }], bounds, 1000);
    expect(groups.map((g) => g.members.length)).toEqual([1, 1]);
  });
  it("gathers five markers within 5 hours at phone and desktop widths, in time order, at their mean position", () => {
    const items = [at(4), at(0), at(2), at(1), at(5)];
    for (const width of [300, 1200]) {
      const groups = groupMarkers(items, bounds, width);
      expect(groups).toHaveLength(1);
      expect(groups[0]!.members.map((m) => m.timeUtcMs)).toEqual([0, 1, 2, 4, 5].map((h) => at(h).timeUtcMs));
      expect(groups[0]!.positionPercent).toBeCloseTo(((at(2.4).timeUtcMs - START) / (bounds.endUtcMs - START)) * 100, 6);
    }
  });
  it("splits when the gap reaches the minimum spacing and keeps every member exactly once", () => {
    const width = 1000;
    const msPerPx = (bounds.endUtcMs - START) / width;
    const items = [0, 1, 2, 3].map((i) => ({ timeUtcMs: START + 100 * msPerPx + i * MARKER_MIN_SPACING_PX * msPerPx }));
    expect(groupMarkers(items, bounds, width).map((g) => g.members.length)).toEqual([1, 1, 1, 1]);
    const tight = items.map((item, i) => ({ timeUtcMs: item.timeUtcMs - i * 2 * msPerPx }));
    expect(groupMarkers(tight, bounds, width).flatMap((g) => g.members)).toHaveLength(4);
  });
  it("gathers nothing while the track is unmeasured", () => {
    expect(groupMarkers([at(0), at(1)], bounds, 0).map((g) => g.members.length)).toEqual([1, 1]);
  });
  it("handles empty input and a zero-length window", () => {
    expect(groupMarkers([], bounds, 300)).toEqual([]);
    expect(groupMarkers([{ timeUtcMs: 1 }, { timeUtcMs: 2 }], { startUtcMs: 5, endUtcMs: 5 }, 300)).toHaveLength(1);
  });
});

describe("TimelineBar marker groups", () => {
  const events = [0, 1, 2, 3, 4].map((h) => ({ id: `e${h}`, label: `Event ${h}`, timeUtcMs: at(h).timeUtcMs }));
  const experience = { objects: [], cameraPresets: [], events: [...events, { id: "far", label: "Far event", timeUtcMs: START + 900 * 24 * HOUR }], window: bounds, rates: [1] } as unknown as ExperienceConfig;
  let root: ReturnType<typeof createRoot>;
  let host: HTMLElement;
  const originalRect = Element.prototype.getBoundingClientRect;
  afterEach(() => { act(() => root.unmount()); host.remove(); Element.prototype.getBoundingClientRect = originalRect; });

  const mount = () => {
    Element.prototype.getBoundingClientRect = function () { return this.classList.contains("timeline-markers") ? { width: 300, height: 22, top: 0, left: 0, right: 300, bottom: 22, x: 0, y: 0, toJSON: () => ({}) } : originalRect.call(this); };
    const seeks: string[] = [];
    const infos: string[] = [];
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    act(() => {
      root.render(createElement(TimelineBar, {
        experience, snapshot: { timeUtcMs: START, playing: false, rate: 1 }, onTogglePlayback: () => undefined, onRateChange: () => undefined, onSeek: () => undefined,
        onEventSeek: (e) => seeks.push(e.id), onEventInfo: (e) => infos.push(e.id), onWindowSeek: () => undefined, onWindowInfo: () => undefined,
      }));
    });
    return { seeks, infos };
  };
  const click = (el: Element) => act(() => { (el as HTMLElement).click(); });

  it("shows one group mark for the five close events and leaves the isolated event as it was", () => {
    mount();
    const toggle = host.querySelector<HTMLButtonElement>(".timeline-group-toggle")!;
    expect(toggle.textContent).toBe("5");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(host.querySelectorAll(".timeline-markers > button.timeline-marker")).toHaveLength(1);
    expect(host.querySelector('.timeline-markers > button[aria-label="Go to Far event"]')).not.toBeNull();
  });
  it("opens each of the five events from the list, by pointer and by a keyboard activation of its button", () => {
    const { seeks, infos } = mount();
    for (let i = 0; i < 5; i++) {
      click(host.querySelector(".timeline-group-toggle")!);
      const items = [...host.querySelectorAll<HTMLButtonElement>(".timeline-group-item")];
      expect(items.map((b) => b.getAttribute("aria-label"))).toEqual(events.map((e) => `Go to ${e.label}`));
      click(items[i]!);
      expect(host.querySelector(".timeline-group-list")).toBeNull();
    }
    expect(seeks).toEqual(events.map((e) => e.id));
    expect(infos).toEqual(events.map((e) => e.id));
  });
  it("closes the list on Escape", () => {
    mount();
    click(host.querySelector(".timeline-group-toggle")!);
    act(() => { host.querySelector(".timeline-group-list")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    expect(host.querySelector(".timeline-group-list")).toBeNull();
  });
});
